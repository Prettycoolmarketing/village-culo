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
import { InnerContainer } from '../components/layout/PageContainer'
import type { Founder } from '../types'

const HERO_IMAGE = '/join/join-hero.png'

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
      <main className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <h1 className="font-heading text-2xl font-bold text-charcoal mb-3">Check your email</h1>
          <p className="font-body text-sm text-muted leading-relaxed mb-6">
            We sent a confirmation link to <span className="font-medium text-charcoal">{email}</span>. Click it,
            then come back here to get into your dashboard.
          </p>
          <WebmailButtons />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">

      {/* ── Hero / join form — dark, same charcoal treatment as Creatives'
          own hero. Copy + form on the left, hero photo on the right, so the
          image isn't just decoration stacked below — it sits right where
          the eye lands next. */}
      <section className="bg-charcoal py-20 md:py-28" aria-labelledby="join-heading">
        <InnerContainer>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="text-center lg:text-left">
              <p className="font-body text-xs font-semibold text-primary uppercase tracking-widest mb-4">
                Free till January 1st 2027
              </p>
              <h1 id="join-heading" className="font-heading text-4xl sm:text-5xl font-bold text-white mb-6 leading-tight">
                Join The Culo Village to<br />
                Access Culo Creatives<br />
                Exclusively In Canva
              </h1>
              <p className="font-body text-base md:text-lg text-white/70 leading-relaxed mb-10 max-w-xl mx-auto lg:mx-0">
                It's time to share your messy thoughts and raw footage into structured social media posts.
              </p>
              <form onSubmit={e => void handleSubmit(e)} className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto lg:mx-0">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  aria-label="Email address"
                  className="flex-1 min-w-0 rounded-xl px-5 py-4 text-base bg-white/10 text-white placeholder:text-white/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 transition-colors"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="shrink-0 rounded-xl px-8 py-4 text-base font-semibold bg-primary text-white hover:bg-[#b05a35] disabled:opacity-60 transition-colors"
                >
                  {submitting ? 'Joining…' : 'Join free'}
                </button>
              </form>
              {error && <p className="font-body text-sm text-red-400 text-center lg:text-left mt-3">{error}</p>}
              <p className="font-body text-xs text-white/40 mt-4">
                Join the culo village for free, no spam emails, culo creatives free access till january 1st 2027
              </p>
            </div>
            <img
              src={HERO_IMAGE}
              alt="A Canva project full of finished CULO Creatives content — vlog style reels, talking head reels, quick rhythm reels, voice over reels and captions, all generated from one founder's raw footage"
              className="w-full h-auto rounded-3xl"
            />
          </div>
        </InnerContainer>
      </section>

      {/* ── What is CULO Creatives — moved up right under the join form,
          on the Village's signature pale-blue gradient background (same
          soft radial circles as the homepage's HeroWidget). Copy sits next
          to the video, same side-by-side pattern as CreativesPage's "Watch
          the demo" section. */}
      <section className="relative overflow-hidden py-16 md:py-20" aria-labelledby="what-heading">
        <div className="absolute inset-0 bg-background" aria-hidden="true">
          <div
            className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, #7CA9CC 0%, transparent 70%)' }}
          />
          <div
            className="absolute -bottom-24 -left-24 w-[400px] h-[400px] rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #5E6B4A 0%, transparent 70%)' }}
          />
        </div>
        <InnerContainer className="relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-center">
            <div>
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-charcoal">
                <iframe
                  src="https://www.youtube.com/embed/qe0pMAlpVFc?start=22"
                  title="How to publish with CULO"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                />
              </div>
            </div>
            <div>
              <p className="font-body text-xs font-semibold text-primary uppercase tracking-widest mb-3">
                What is CULO Creatives in Canva?
              </p>
              <h2 id="what-heading" className="font-heading text-2xl sm:text-3xl font-bold text-charcoal leading-tight mb-5">
                Free access till January 1st 2027.
              </h2>
              <p className="font-body text-base text-muted leading-relaxed mb-4">
                Culo Creatives is a design platform exclusively available in Canva helping founders edit their
                messy thoughts and raw footage into different formats of reels, carousels, captions and blogs
                for easy, humanised, storytelling, content.
              </p>
              <p className="font-body text-base text-muted leading-relaxed">
                Someone may have the most amazing business and be a talented, knowledgable founder but without
                consistent content speaking to their target audience with purposeful hooks, subtitles, captions
                in an all in one easy to manage/approve workspace and scheduled to all platforms with
                back-linked to websites/articles, they will struggle with visibility and keeping up with the
                demands of closed platforms algorithms.
              </p>
            </div>
          </div>
        </InnerContainer>
      </section>

      {/* ── Product screenshot grid — 3 over 3, with the "raw footage" line
          as a single-line title spanning the top instead of sitting beside
          a separate hero image (that image now lives up in the dark hero). */}
      <section className="py-16 md:py-20 border-y border-border" aria-labelledby="product-heading">
        <InnerContainer>
          <h2 id="product-heading" className="font-heading text-xl sm:text-2xl lg:text-3xl font-bold text-charcoal text-center leading-tight mb-10 lg:whitespace-nowrap">
            Turn your raw footage into social media posts in one workspace
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
            {GRID_ROW_1.map(src => (
              <img key={src} src={src} alt="CULO Creatives in Canva" className="w-full h-auto rounded-2xl border border-border" />
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {GRID_ROW_2.map(src => (
              <img key={src} src={src} alt="CULO Creatives in Canva" className="w-full h-auto rounded-2xl border border-border" />
            ))}
          </div>
        </InnerContainer>
      </section>

      {/* ── What is The Culo Village — the Village pitch lives here, separate
          from the Creatives-in-Canva copy above, with an orange arrow back
          up to the join form instead of repeating the email capture again. */}
      <section className="py-16 md:py-20 bg-background" aria-labelledby="village-heading">
        <InnerContainer className="text-center max-w-2xl">
          <p className="font-body text-xs font-semibold text-primary uppercase tracking-widest mb-3">
            What is The Culo Village?
          </p>
          <h2 id="village-heading" className="font-heading text-2xl sm:text-3xl font-bold text-charcoal leading-tight mb-5">
            One joint publishing house for everything you've already created.
          </h2>
          <p className="font-body text-base text-muted leading-relaxed mb-8">
            The Culo Village helps founders structure their previously posted content across platforms and
            republish as individual webpages for AI search-ability as a joint publishing house.
          </p>
          <a href="#join-heading" className="inline-flex flex-col items-center gap-2 text-primary font-body text-sm font-semibold hover:text-[#b05a35] transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            Join to be discovered
          </a>
        </InnerContainer>
      </section>

      <Footer />
    </main>
  )
}
