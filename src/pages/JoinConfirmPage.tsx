import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { usePageMeta } from '../utils/usePageMeta'
import { useAuth } from '../contexts/AuthContext'
import { ensureJoinedFounder } from '../services/joinFlow'
import { getFounder, updateFounder } from '../services/founders'
import { runOnboardingResearch } from '../services/onboardingResearch'
import { supabase } from '../lib/supabase'
import { JoinProgress } from '../components/ui/JoinProgress'
import { Navbar } from '../components/layout/Navbar'

// Where the Supabase email-confirmation link actually lands (see
// AuthContext.signUp's redirectPath and JoinVillagePage's call site) — the
// first thing a new founder sees after confirming, before the dashboard.
// This is also where the founder record itself gets created for anyone who
// had to confirm their email, since there's no session/userId to attach it
// to until now — see ensureJoinedFounder's header comment for the bug this
// fixes (a confirmed founder with no record at all).

export function JoinConfirmPage() {
  usePageMeta({ title: 'Set your password', ogType: 'website' })
  const { updatePassword } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const source = searchParams.get('source') === 'canva' ? 'canva' : 'village'
  const canvaUserId = searchParams.get('canvaUserId')?.trim() || undefined

  const [ready, setReady] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [email, setEmail] = useState('')
  const [founderId, setFounderId] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  // Optional, not a required step — /join/setup tried making a link
  // mandatory here once before and it was a real source of signup friction
  // and sync races (see the comment on handleSubmit below), so this is
  // deliberately just one more field on the same form, not a new gate.
  // Skipping it changes nothing; giving it means research runs immediately
  // instead of waiting for them to separately find Profile's own research
  // box or connect a source later (confirmed real gap: Brad Marsh, Julie
  // Trell, Rachel Harker, Vivien all sat with a real account and no bio for
  // days before anyone noticed).
  const [researchLink, setResearchLink] = useState('')
  const [remember, setRemember] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) { navigate('/join', { replace: true }); return }
    let settled = false

    async function proceed(user: { id: string; email?: string }) {
      if (settled) return
      settled = true
      setEmail(user.email ?? '')
      // ensureJoinedFounder calls out to a couple of edge functions
      // (find-curated-match, the enroll/notify calls inside it) with no
      // timeout of its own — a slow or hung network call here used to mean
      // this page just sat on "Loading…" forever, no error, no retry,
      // nothing for a founder to do but give up. Confirmed as a real
      // suspect: two real signups in a row got a founder record created
      // and then nothing — no password ever set, no further activity at
      // all. A 15s timeout plus a visible retry beats an indefinite,
      // silent hang either way, bug or just a slow connection.
      try {
        const id = await Promise.race([
          ensureJoinedFounder(user.id, user.email ?? '', source, { canvaUserId }),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Timed out')), 15000)),
        ])
        setFounderId(id)
        // Re-opening a confirm-email link (an old one still sitting in an
        // inbox, or a duplicate Supabase sent) used to show "Set your
        // password" again every time, with no check for whether this
        // account already has one — confusing for someone who's already
        // fully set up and possibly already logged into the dashboard in
        // another tab. Skip straight past it when there's nothing left to
        // do here.
        const founder = id ? getFounder(id) : null
        if (founder?.passwordSet) {
          navigate('/dashboard/profile', { replace: true })
          return
        }
        setReady(true)
      } catch {
        settled = false
        setLoadError(true)
      }
    }

    // The confirmation link's session comes back in the URL hash, which
    // supabase-js parses asynchronously on load — an immediate getUser()
    // call here can race ahead of that and see no session yet, bouncing a
    // genuinely-confirmed founder back to /join. Listen for the auth event
    // it fires once that parsing finishes, with a short-poll fallback in
    // case the event already fired before this listener was attached.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) void proceed(session.user)
    })

    void (async () => {
      const { data } = await supabase.auth.getSession()
      if (data.session?.user) { void proceed(data.session.user); return }
      await new Promise(r => setTimeout(r, 800))
      if (settled) return
      const retry = await supabase.auth.getUser()
      if (retry.data.user) { void proceed(retry.data.user); return }
      if (!settled) navigate('/join', { replace: true })
    })()

    return () => sub.subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setSubmitting(true)
    setError(null)

    const result = await updatePassword(password)
    if (result.error) {
      setSubmitting(false)
      setError(result.error)
      return
    }

    let founder = founderId ? getFounder(founderId) : null
    if (founder) {
      await updateFounder({ ...founder, passwordSet: true })
      founder = { ...founder, passwordSet: true }
    }

    // Fire-and-forget — never block landing on the dashboard waiting for
    // research to finish. Only fires when a link was actually given; an
    // empty field changes nothing about this flow.
    if (founder && researchLink.trim()) {
      const raw = researchLink.trim()
      const identifier = raw.startsWith('@') || /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
      void runOnboardingResearch(founder.id, identifier)
    }

    setSubmitting(false)
    // /join/setup used to be a required next step (name + a research link)
    // before the dashboard — it was its own extra page in the funnel, with
    // its own cache-sync races, and a real source of signup friction/
    // glitches. The optional researchLink field above gives a lighter way
    // to capture the same thing without that mistake: one more field on
    // this same form, never a gate. Whether or not they gave one, they
    // still land on Profile's Overview tab, where "run research" is the
    // first thing they see (see ResumeResearchBanner there) if they
    // skipped it or want to try a different link. A returning login still
    // lands on Import as normal (see DashboardLoginPage) — this is
    // specifically the just-signed-up moment.
    navigate('/dashboard/profile', { replace: true })
  }

  if (loadError) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="max-w-sm text-center">
          <p className="font-body text-sm text-charcoal font-semibold mb-2">Something took too long to load.</p>
          <p className="font-body text-sm text-muted mb-6">Your email's confirmed — this was just a connection hiccup setting up your account. Try again.</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-xl px-6 py-3 text-sm font-semibold bg-primary text-white hover:bg-[#b05a35] transition-colors"
          >
            Try again
          </button>
        </div>
      </main>
    )
  }

  if (!ready) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <p className="font-body text-sm text-muted">Loading…</p>
      </main>
    )
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background flex items-center justify-center px-6 py-24">
        <div className="max-w-sm w-full">
          <JoinProgress step={1} />
          <h1 className="font-heading text-2xl font-bold text-charcoal mb-2 text-center">You're confirmed</h1>
          <p className="font-body text-sm text-muted text-center mb-8">
            Set a password so you can log back in next time.
          </p>
          <form onSubmit={e => void handleSubmit(e)} className="flex flex-col gap-3">
            {/* Hidden username field — lets the browser's password manager
                associate the saved credentials with this email, the same
                way it would on any real login form, so it reliably offers
                to save them. */}
            <input type="email" name="username" autoComplete="username" value={email} readOnly hidden />
            <input
              type="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="New password"
              className="rounded-xl px-4 py-3 text-sm text-charcoal border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
            <input
              type="password"
              required
              autoComplete="new-password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Confirm password"
              className="rounded-xl px-4 py-3 text-sm text-charcoal border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
            {/* Optional — see researchLink's own note above. One extra
                field on the same form, not a new required step. */}
            <input
              type="text"
              value={researchLink}
              onChange={e => setResearchLink(e.target.value)}
              placeholder="Your Instagram, YouTube, website or LinkedIn (optional)"
              className="rounded-xl px-4 py-3 text-sm text-charcoal border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
            <p className="font-body text-xs text-muted -mt-1">
              Give us a link and we'll start writing your bio and first article right away — or skip this and do it later.
            </p>
            <label className="flex items-center gap-2 text-sm text-muted mt-1">
              <input
                type="checkbox"
                checked={remember}
                onChange={e => setRemember(e.target.checked)}
                className="accent-primary"
              />
              Remember my login on this device
            </label>
            {error && <p className="font-body text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="mt-2 rounded-xl px-6 py-3 text-sm font-semibold bg-primary text-white hover:bg-[#b05a35] disabled:opacity-60 transition-colors"
            >
              {submitting ? 'Saving…' : 'Continue'}
            </button>
          </form>
        </div>
      </main>
    </>
  )
}
