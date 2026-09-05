import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { usePageMeta } from '../utils/usePageMeta'
import { useAuth } from '../contexts/AuthContext'
import { ensureJoinedFounder } from '../services/joinFlow'
import { getFounder, updateFounder } from '../services/founders'
import { supabase } from '../lib/supabase'
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

  const [ready, setReady] = useState(false)
  const [email, setEmail] = useState('')
  const [founderId, setFounderId] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [remember, setRemember] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      if (!supabase) { navigate('/join', { replace: true }); return }
      const { data } = await supabase.auth.getUser()
      const user = data.user
      if (!user) { navigate('/join', { replace: true }); return }
      setEmail(user.email ?? '')
      const id = await ensureJoinedFounder(user.id, user.email ?? '', source)
      setFounderId(id)
      setReady(true)
    })()
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

    if (founderId) {
      const founder = getFounder(founderId)
      if (founder) await updateFounder({ ...founder, passwordSet: true })
    }

    setSubmitting(false)
    navigate('/join/offer', { replace: true })
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
