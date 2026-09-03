import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { updateFounder } from '../services/founders'
import { linkOwnFounder } from '../services/currentFounder'
import { locations } from '../data/locations'
import { industries } from '../data/industries'
import { slugify } from '../utils/slugify'
import { supabase } from '../lib/supabase'
import type { Founder } from '../types'

// Replaces the old "join the waitlist" entry point for the Village itself
// (the Canva-app "coming soon" waitlist on VillagePage/CreativesPage is a
// separate, still-live thing — see WaitlistForm). This creates a real
// account, not a waitlist row: email only, no password up front (better
// conversion — the founder sets a real password once inside the dashboard,
// via the "set your password" prompt in DashboardLayout).
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
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold text-[#2D2A26] mb-3">Check your email</h1>
          <p className="text-sm text-[#6B7280] leading-relaxed">
            We sent a confirmation link to <span className="font-medium text-[#2D2A26]">{email}</span>. Click it,
            then come back here to get into your dashboard.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FBF1EB] px-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="max-w-md w-full">
        <h1 className="text-3xl sm:text-4xl font-bold text-[#2D2A26] mb-3 text-center leading-tight">
          Join the CULO Village and get free access to CULO Creatives
        </h1>
        <p className="text-sm text-[#6B7280] text-center mb-8 leading-relaxed">
          One email, no password needed yet — you'll land straight in your dashboard and can set a password
          once you're in.
        </p>
        <form onSubmit={e => void handleSubmit(e)} className="flex flex-col gap-3">
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@email.com"
            aria-label="Email address"
            className="rounded-xl px-4 py-3 text-base bg-white text-[#2D2A26] placeholder:text-[#9CA3AF] border border-[#E8E4DD] focus:outline-none focus:ring-2 focus:ring-[#C86A43]/30 focus:border-[#C86A43] transition-colors"
          />
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl px-6 py-3 text-base font-semibold bg-[#C86A43] text-white hover:bg-[#b05a35] disabled:opacity-60 transition-colors"
          >
            {submitting ? 'Joining…' : 'Join free'}
          </button>
          {error && <p className="text-sm text-red-600 text-center">{error}</p>}
        </form>
      </div>
    </div>
  )
}
