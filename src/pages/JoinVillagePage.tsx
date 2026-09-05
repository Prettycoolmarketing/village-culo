import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { updateFounder } from '../services/founders'
import { linkOwnFounder } from '../services/currentFounder'
import { locations } from '../data/locations'
import { industries } from '../data/industries'
import { slugify } from '../utils/slugify'
import { supabase } from '../lib/supabase'
import { WebmailButtons } from '../components/ui/WebmailButtons'
import { Footer } from '../components/layout/Footer'
import type { Founder } from '../types'

// TODO: swap for the real hero photo once it's back on hand — the original
// (Screenshot 2026-06-23 at 4.48.10 pm.png) went missing from Desktop
// between being requested and being copied in. Using the existing Canva
// hero shot as a placeholder so the page isn't blocked on it.
const HERO_IMAGE = '/creatives/culo-canva-hero.png'

const GRID_ROW_1 = ['/join/grid-1.png', '/join/grid-2.png', '/join/grid-3.png']
const GRID_ROW_2 = ['/join/grid-4.png', '/join/grid-5.png', '/join/grid-6.png']

// The real, account-creating join flow — staged at /join rather than
// replacing the homepage's "coming soon" waitlist (see WaitlistForm), which
// stays live and untouched until the Canva app is actually approved. Once
// it's ready to go live, point culovillage.com's main flow here (or move
// this page to the root route). Creates a real account, not a waitlist row:
// email only, no password up front (better conversion — the founder sets a
// real password once inside the dashboard, via the "set your password"
// prompt in DashboardLayout).
//
// ?source=canva vs the default 'village' tags which funnel actually created
// the account, so CAPO can tell a Canva Marketplace deep-link apart from a
// direct culovillage.com signup. This is the exact URL the Canva app's
// "Join the Village" button should deep-link to: /join?source=canva

const COLLABORATOR_CUTOFF = '2027-01-01T00:00:00.000Z'
const STANDARD_TRIAL_DAYS = 14

export function JoinVillagePage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const source = searchParams.get('source') === 'canva' ? 'canva' : 'village'

  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkEmail, setCheckEmail] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) return
    setSubmitting(true)
    setError(null)

    // Founder never sees or needs this — it's a throwaway credential that
    // establishes their session; the "set your password" modal replaces it
    // with a real one the moment they land in the dashboard.
    const throwawayPassword = crypto.randomUUID()
    const signUpResult = await signUp(trimmed, throwawayPassword)

    if (signUpResult.error) {
      setSubmitting(false)
      setError(signUpResult.error)
      return
    }
    if (signUpResult.needsConfirmation) {
      setSubmitting(false)
      setCheckEmail(true)
      return
    }

    // signUp() doesn't hand back the new user's id directly — pull it from
    // the session it just established, right after the call, rather than
    // waiting on AuthContext's own state to catch up on the next render.
    const userId = (await supabase?.auth.getUser())?.data.user?.id
    if (!userId) {
      setSubmitting(false)
      setError('Could not create your account. Please try again.')
      return
    }

    const now = new Date()
    const isPreLaunchCohort = now.toISOString() < COLLABORATOR_CUTOFF
    const founderId = crypto.randomUUID()
    const founder: Founder = {
      id: founderId,
      slug: slugify(trimmed.split('@')[0] || 'founder') + '-' + Math.random().toString(36).slice(2, 6),
      name: trimmed.split('@')[0] || 'New Founder',
      bio: '',
      avatar: '/placeholders/village-founder.svg',
      location: locations[0]!,
      industry: industries[0]!,
      businessId: '',
      topics: [],
      status: 'draft',
      featured: false,
      createdAt: now.toISOString(),
      userId,
      signupProduct: source,
      passwordSet: false,
      creativeSubscription: isPreLaunchCohort
        ? { status: 'trial', trialEnd: COLLABORATOR_CUTOFF }
        : { status: 'trial', tier: 'standard', trialEnd: new Date(now.getTime() + STANDARD_TRIAL_DAYS * 86400000).toISOString() },
    }

    const result = await updateFounder(founder)
    setSubmitting(false)
    if (!result.success) {
      setError(result.error ?? 'Could not create your account. Please try again.')
      return
    }
    void linkOwnFounder(founderId)

    navigate('/dashboard/welcome?setPassword=1', { replace: true })
  }

  if (checkEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FBF1EB] px-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-[#2D2A26] mb-3">Check your email</h1>
          <p className="text-sm text-[#6B7280] leading-relaxed mb-6">
            We sent a confirmation link to <span className="font-medium text-[#2D2A26]">{email}</span>. Click it,
            then come back here to get into your dashboard.
          </p>
          <WebmailButtons />
        </div>
      </div>
    )
  }

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* ── Hero / join form ──────────────────────────────────────────────── */}
      <section className="bg-[#FBF1EB] px-6 py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-bold text-[#2D2A26] mb-6 leading-[1.1]">
            Join The Culo Village to receive free access to Culo Creatives: Exclusively in Canva.
          </h1>
          <p className="text-base md:text-lg text-[#6B7280] leading-relaxed mb-10 max-w-2xl mx-auto">
            It's time to share your messy thoughts and raw footage into structured social media posts and
            publish your previously created content across platforms with CULO.
          </p>
          <form onSubmit={e => void handleSubmit(e)} className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@email.com"
              aria-label="Email address"
              className="flex-1 min-w-0 rounded-xl px-5 py-4 text-base bg-white text-[#2D2A26] placeholder:text-[#9CA3AF] border border-[#E8E4DD] focus:outline-none focus:ring-2 focus:ring-[#C86A43]/30 focus:border-[#C86A43] transition-colors"
            />
            <button
              type="submit"
              disabled={submitting}
              className="shrink-0 rounded-xl px-8 py-4 text-base font-semibold bg-[#C86A43] text-white hover:bg-[#b05a35] disabled:opacity-60 transition-colors"
            >
              {submitting ? 'Joining…' : 'Join free'}
            </button>
          </form>
          {error && <p className="text-sm text-red-600 text-center mt-3">{error}</p>}
          <p className="text-xs text-[#9CA3AF] mt-4">
            One email, no password needed yet — you'll land straight in your dashboard.
          </p>
        </div>
      </section>

      {/* ── Hero banner image ─────────────────────────────────────────────── */}
      <section className="bg-[#FBF1EB]">
        <div className="max-w-6xl mx-auto px-6 pb-16 md:pb-24">
          <img
            src={HERO_IMAGE}
            alt="CULO Creatives inside Canva — turn your expertise into structured content in Canva, then publish in the Village for discovery"
            className="w-full h-auto rounded-3xl"
          />
        </div>
      </section>

      {/* ── What is CULO Creatives ────────────────────────────────────────── */}
      <section className="bg-white px-6 py-16 md:py-24">
        <div className="max-w-4xl mx-auto">
          <p className="text-base md:text-lg text-[#2D2A26] leading-relaxed mb-6">
            The Culo Village helps founders structure their previously posted content across platforms and
            republish as individual webpages for AI search-ability as a joint publishing house.
          </p>
          <p className="text-base md:text-lg text-[#2D2A26] leading-relaxed mb-6">
            Culo Creatives is a design platform exclusively available in Canva helping founders edit their
            messy thoughts and raw footage into different formats of reels, carousels, captions and blogs for
            easy, humanised, storytelling, content.
          </p>
          <p className="text-base md:text-lg text-[#2D2A26] leading-relaxed">
            Someone may have the most amazing business and be a talented, knowledgable founder but without
            consistent content speaking to their target audience with purposeful hooks, subtitles, captions in
            an all in one easy to manage/approve workspace and scheduled to all platforms with back-linked to
            websites/articles, they will struggle with visibility and keeping up with the demands of closed
            platforms algorithms.
          </p>
        </div>
      </section>

      {/* ── Product screenshot grid — 3 over 3 ───────────────────────────── */}
      <section className="bg-[#FBF1EB] px-6 py-16 md:py-24">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
            {GRID_ROW_1.map(src => (
              <img key={src} src={src} alt="CULO Creatives in Canva" className="w-full h-auto rounded-2xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {GRID_ROW_2.map(src => (
              <img key={src} src={src} alt="CULO Creatives in Canva" className="w-full h-auto rounded-2xl" />
            ))}
          </div>
        </div>
      </section>

      {/* ── How-to video ──────────────────────────────────────────────────── */}
      <section className="bg-white px-6 py-16 md:py-24">
        <div className="max-w-4xl mx-auto">
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-[#2D2A26]">
            <iframe
              src="https://www.youtube.com/embed/qe0pMAlpVFc?start=22"
              title="How to publish with CULO"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
