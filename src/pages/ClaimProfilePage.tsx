import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom'
import { usePageMeta } from '../utils/usePageMeta'
import { useAuth } from '../contexts/AuthContext'
import { getFounders, updateFounder } from '../services/founders'
import { founderClaimService } from '../services/founderClaim'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { InnerContainer } from '../components/layout/PageContainer'
import { WebmailButtons } from '../components/ui/WebmailButtons'

export function ClaimProfilePage() {
  const { slug } = useParams<{ slug: string }>()
  const [searchParams] = useSearchParams()
  const founder = getFounders().find(f => f.slug === slug)
  const key = searchParams.get('key')

  // A link carrying the founder's own secret (sent to them directly —
  // curation, not the public profile page) skips the request-and-review
  // flow entirely and goes straight to creating their account. The real
  // token never reaches the client directly — it's checked server-side by
  // verify-claim-token (see that function's own notes for why: founders.data
  // is publicly readable, so a secret stored there wouldn't be one).
  // Without a matching key, /claim/:slug falls back to the older request
  // form below.
  const [claimKeyState, setClaimKeyState] = useState<'checking' | 'valid' | 'invalid'>(key ? 'checking' : 'invalid')
  useEffect(() => {
    if (!key || !founder) { setClaimKeyState('invalid'); return }
    if (!isSupabaseConfigured || !supabase) { setClaimKeyState('invalid'); return }
    let cancelled = false
    supabase.functions.invoke<{ valid?: boolean }>('verify-claim-token', { body: { founderId: founder.id, key } })
      .then(({ data }) => { if (!cancelled) setClaimKeyState(data?.valid ? 'valid' : 'invalid') })
      .catch(() => { if (!cancelled) setClaimKeyState('invalid') })
    return () => { cancelled = true }
  }, [key, founder?.id])

  usePageMeta({
    title:       founder ? `Claim ${founder.name}'s Profile` : 'Claim a Profile',
    description: founder
      ? `Claim your CULO Village profile for ${founder.name} to edit, import content, and publish with CULO.`
      : 'Claim your CULO Village founder profile.',
  })

  // Not found
  if (!founder || (founder.status !== 'published' && founder.status !== 'featured')) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-4 pt-20">
        <div className="text-center max-w-md">
          <h1 className="font-heading text-2xl font-semibold text-charcoal mb-3">Profile not found</h1>
          <p className="font-body text-muted mb-6">
            We couldn't find a public profile with this URL.
          </p>
          <Link to="/founders" className="text-sm font-medium text-primary hover:underline">
            Browse all founders →
          </Link>
        </div>
      </main>
    )
  }

  // Briefly, only when a ?key= is actually present — verifying it server-side
  // takes one round-trip, and showing the request form for a flash before
  // swapping to the instant-claim one would be a worse experience than a
  // beat of nothing.
  if (claimKeyState === 'checking') {
    return <main className="min-h-screen bg-background" />
  }

  // Already claimed / verified — don't show form. founder.userId is checked
  // too since it's the real ownership signal and can be set (self-link) even
  // when profileStatus is a stale 'village-curated'.
  if (founder.userId || founder.profileStatus === 'claimed' || founder.profileStatus === 'verified') {
    return (
      <main className="min-h-screen bg-background pt-20">
        <InnerContainer>
          <div className="max-w-lg mx-auto text-center py-20">
            <div className="w-14 h-14 rounded-full bg-secondary/15 flex items-center justify-center mx-auto mb-5" aria-hidden="true">
              <svg className="w-7 h-7 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h1 className="font-heading text-2xl font-semibold text-charcoal mb-3">
              This profile has been {founder.profileStatus === 'verified' ? 'verified' : 'claimed'}
            </h1>
            <p className="font-body text-muted mb-6 leading-relaxed">
              {founder.name}'s profile is already {founder.profileStatus === 'verified' ? 'verified' : 'owned'} by its founder. If you believe there is an error, please contact CULO Village.
            </p>
            <Link
              to={`/founders/${founder.slug}`}
              className="text-sm font-medium text-primary hover:underline"
            >
              ← Back to {founder.name}'s profile
            </Link>
          </div>
        </InnerContainer>
      </main>
    )
  }

  // Pending — a valid claim key skips this too; the secret link is a
  // stronger signal than whatever put it in this state earlier.
  if (founder.profileStatus === 'claim-pending' && claimKeyState !== 'valid') {
    return (
      <main className="min-h-screen bg-background pt-20">
        <InnerContainer>
          <div className="max-w-lg mx-auto text-center py-20">
            <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-5" aria-hidden="true">
              <svg className="w-7 h-7 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="font-heading text-2xl font-semibold text-charcoal mb-3">
              Claim pending review
            </h1>
            <p className="font-body text-muted mb-6 leading-relaxed">
              A claim has already been submitted for {founder.name}'s profile and is currently under review. You'll receive a response by email once reviewed.
            </p>
            <Link
              to={`/founders/${founder.slug}`}
              className="text-sm font-medium text-primary hover:underline"
            >
              ← Back to {founder.name}'s profile
            </Link>
          </div>
        </InnerContainer>
      </main>
    )
  }

  // A staff-sent secret link (?key=) is a fully trusted signal on its own —
  // skip the email/name matching heuristics below entirely for it. Every
  // other visitor lands on the same instant form; matchClaimEmail() decides
  // at submit time whether they go straight to their dashboard or fall back
  // to the review queue.
  return <InstantClaimForm founder={founder} skipVerification={claimKeyState === 'valid'} />
}

// Loose matching for a claimant with no exact verified claimEmail on file —
// most curated founders won't have one (research only sets it when it finds
// a real, high-confidence contact). Rather than hard-block everyone else
// into a manual queue, look for other signals a genuine founder's own email
// would carry: their own domain, or their own name in the address. Neither
// is proof by itself, but either is a reasonable bar for self-serve access —
// staff still see a note on the profile (claimNotes) when it was a soft
// match rather than an exact one.
const GENERIC_EMAIL_DOMAINS = new Set([
  'gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'icloud.com', 'me.com', 'live.com', 'aol.com', 'proton.me', 'protonmail.com',
])
const GENERIC_LINK_DOMAINS = new Set([
  'instagram.com', 'linkedin.com', 'youtube.com', 'tiktok.com', 'facebook.com', 'twitter.com', 'x.com', 'threads.net', 'spotify.com', 'linktr.ee',
])

function normalizeToken(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function extractDomain(url?: string): string | null {
  if (!url) return null
  try {
    const u = new URL(/^https?:\/\//.test(url) ? url : `https://${url}`)
    return u.hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return null
  }
}

type ClaimMatch = 'verified' | 'likely' | 'none'

function matchClaimEmail(email: string, founder: ReturnType<typeof getFounders>[number]): ClaimMatch {
  const normalizedEmail = email.trim().toLowerCase()
  if (founder.claimEmail && founder.claimEmail.trim().toLowerCase() === normalizedEmail) return 'verified'

  const [localPart, emailDomain] = normalizedEmail.split('@')
  const localToken = normalizeToken(localPart ?? '')

  const ownDomains = [founder.website, founder.instagram, founder.linkedin, founder.youtube, founder.podcast, ...(founder.socialLinks?.map(l => l.url) ?? [])]
    .map(extractDomain)
    .filter((d): d is string => !!d && !GENERIC_LINK_DOMAINS.has(d))
  if (emailDomain && !GENERIC_EMAIL_DOMAINS.has(emailDomain) && ownDomains.includes(emailDomain)) return 'likely'

  const nameParts = founder.name.toLowerCase().split(/\s+/).map(normalizeToken).filter(p => p.length >= 3)
  if (localToken.length >= 3 && nameParts.some(part => localToken.includes(part))) return 'likely'

  return 'none'
}

// The default public claim path — no review queue, no staff step, unless
// matchClaimEmail() can't find any signal tying the claimant to this
// founder (skipVerification bypasses that check entirely for a trusted
// ?key= link). Creates the real Supabase account right here and marks the
// founder claimed with this email, so getCurrentFounder()'s existing
// claimEmail-match (see services/currentFounder.ts) picks it up the moment
// they land in the dashboard.
function InstantClaimForm({ founder, skipVerification }: { founder: ReturnType<typeof getFounders>[number]; skipVerification: boolean }) {
  const navigate = useNavigate()
  const { signUp } = useAuth()
  const [name, setName]           = useState('')
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]         = useState('')
  const [needsConfirmation, setNeedsConfirmation] = useState(false)
  // Confirmed real bug, not hypothetical: a founder (tibo@tap4change.org)
  // hit this exact message — "sign in instead" — on a page with no sign-in
  // link or form anywhere on it ("there's nowhere to login"). Dedicated
  // state instead of the generic `error` string so the render side can
  // show a real link, not just unreachable advice.
  const [alreadyHasAccount, setAlreadyHasAccount] = useState(false)
  const [submittedForReview, setSubmittedForReview] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!name.trim()) {
      setError('Please enter your name.')
      return
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    // No exact verified email or staff link — try the softer name/domain
    // signals before deciding this needs a human to look at it. 'none'
    // means nothing on file resembles this claimant at all, so this goes
    // to the review queue instead of straight into someone else's dashboard.
    const match = skipVerification ? 'verified' : matchClaimEmail(email, founder)
    if (match === 'none') {
      setSubmitting(true)
      try {
        await founderClaimService.create({
          founderId:        founder.id,
          requesterName:    name.trim(),
          requesterEmail:   email.trim(),
          requesterMessage: 'Submitted via instant claim — could not auto-verify email against profile records.',
        })
        setSubmittedForReview(true)
      } catch (err) {
        setError(err instanceof Error && err.message ? err.message : 'Something went wrong submitting your claim. Please try again.')
      } finally {
        setSubmitting(false)
      }
      return
    }

    setSubmitting(true)
    try {
      await updateFounder({
        ...founder,
        profileStatus: 'claimed',
        claimedAt: new Date().toISOString(),
        claimEmail: email.trim(),
        isClaimable: false,
        claimNotes: match === 'likely'
          ? `Instant-claimed by ${name.trim()} <${email.trim()}> — soft match (name/domain), not an exact verified email. Worth a quick look.`
          : founder.claimNotes,
      })
      const { error: signUpError, needsConfirmation: needsConf, alreadyRegistered } = await signUp(email.trim(), password, '/dashboard/welcome')
      if (alreadyRegistered) {
        setAlreadyHasAccount(true)
        return
      }
      if (signUpError) {
        setError(signUpError)
        return
      }
      if (needsConf) {
        setNeedsConfirmation(true)
        return
      }
      navigate('/dashboard/welcome', { replace: true })
    } finally {
      setSubmitting(false)
    }
  }

  if (submittedForReview) {
    return (
      <main className="min-h-screen bg-background pt-20">
        <InnerContainer>
          <div className="max-w-lg mx-auto text-center py-20">
            <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-5" aria-hidden="true">
              <svg className="w-7 h-7 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="font-heading text-2xl font-semibold text-charcoal mb-3">Claim submitted for review</h1>
            <p className="font-body text-muted mb-6 leading-relaxed">
              We couldn't automatically verify <strong>{email}</strong> against what we have on file for {founder.name}, so
              our team will take a quick look and follow up by email within a few business days.
            </p>
            <Link to={`/founders/${founder.slug}`} className="text-sm font-medium text-primary hover:underline">
              ← Back to {founder.name}'s profile
            </Link>
          </div>
        </InnerContainer>
      </main>
    )
  }

  if (needsConfirmation) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-4 pt-20">
        <div className="max-w-md text-center">
          <h1 className="font-heading text-2xl font-semibold text-charcoal mb-3">Almost there</h1>
          <p className="font-body text-muted leading-relaxed mb-6">
            Check <strong>{email}</strong> for a confirmation link — once you click it, your founder profile will be fully editable for you to continue publishing your story.
          </p>
          <WebmailButtons />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background pt-20">
      <InnerContainer>
        <div className="max-w-md mx-auto py-16">
          <h1 className="font-heading text-2xl font-semibold text-charcoal mb-2">
            Claim {founder.name}'s profile
          </h1>
          <p className="font-body text-sm text-muted mb-5 leading-relaxed">
            Create your account below and everything already on your profile (bio, stories, businesses) will be waiting, fully editable.
          </p>
          {/* What they're actually joining, spelled out — the form below
              only asks for an email and password, which undersells what's
              on the other side of it without this. Same free-10 offer as
              the main join flow (see JoinVillagePage/MarketingLandingPage). */}
          <div className="mb-8 bg-surface rounded-xl border border-border p-4">
            <p className="font-body text-sm font-semibold text-charcoal mb-3">
              Structure your previously posted content from across platforms and republish it as individual web
              articles for AI discoverability.
            </p>
            <ul className="flex flex-col gap-2">
            {[
              'Free membership, forever — no credit card required',
              'Your first 10 articles published free, on us',
              'Full control to edit, add or remove anything on your profile',
            ].map(item => (
              <li key={item} className="flex items-start gap-2 font-body text-sm text-charcoal/80">
                <svg className="w-4 h-4 text-[#5E6B4A] mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {item}
              </li>
            ))}
            </ul>
          </div>
          <form onSubmit={e => void handleSubmit(e)} className="flex flex-col gap-4">
            <div>
              <label className="block font-body text-sm font-medium text-charcoal mb-1.5">Full name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                autoComplete="name"
                placeholder={`e.g. ${founder.name}`}
                className="w-full px-3.5 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <div>
              <label className="block font-body text-sm font-medium text-charcoal mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-3.5 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
              <p className="font-body text-xs text-muted mt-1.5">
                Use the email associated with your business or public profile — it helps us confirm this is really you.
              </p>
            </div>
            <div>
              <label className="block font-body text-sm font-medium text-charcoal mb-1.5">Set a password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full px-3.5 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            {error && <p className="font-body text-sm text-red-600">{error}</p>}
            {alreadyHasAccount && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                <p className="font-body text-sm text-amber-800 mb-2">
                  An account already exists for this email — sign in instead, and this profile will connect to it automatically.
                </p>
                <Link
                  to="/dashboard/login"
                  className="inline-block font-body text-sm font-semibold text-primary hover:underline"
                >
                  Sign in →
                </Link>
              </div>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-[#b05a35] disabled:opacity-60 transition-colors"
            >
              {submitting ? 'Creating your account…' : 'Claim my profile'}
            </button>
          </form>
          <p className="font-body text-xs text-muted/70 mt-6 leading-relaxed text-center">
            If we can't verify your email automatically, we'll send your claim to our team for a quick manual check instead.
          </p>
        </div>
      </InnerContainer>
    </main>
  )
}
