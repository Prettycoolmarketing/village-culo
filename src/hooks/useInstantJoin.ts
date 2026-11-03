import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { ensureJoinedFounder } from '../services/joinFlow'

// The actual "type an email, get an account" mechanic behind both
// JoinVillagePage's dedicated hero and the homepage's compact inline
// capture — same signup logic, different surrounding page chrome (a full
// page takeover on one, a small card on the other), so only the state
// machine is shared, not the JSX around it. Extracted so there's exactly
// one implementation of the actual signup call, not two that could drift.
export function useInstantJoin(source: 'village' | 'canva', canvaUserId?: string) {
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkEmail, setCheckEmail] = useState(false)
  const [alreadyMember, setAlreadyMember] = useState(false)
  // A real, confirmed pattern — 4 of the last 11 signups never confirmed
  // their email at all (checked directly against auth.users). Some share
  // of that is almost certainly the confirmation email landing in spam or
  // just getting lost, not someone changing their mind — and until now
  // there was no way to ask for it again short of signing up a second
  // time with the same email (which Supabase's anti-enumeration behaviour
  // makes look identical to a real resend anyway, so there was no reason
  // not to just offer a real one).
  const [resent, setResent] = useState(false)
  const [resending, setResending] = useState(false)
  const confirmRedirect = `/join/confirm?source=${source}${canvaUserId ? `&canvaUserId=${encodeURIComponent(canvaUserId)}` : ''}`

  async function handleResend() {
    if (!supabase || !email.trim()) return
    setResending(true)
    await supabase.auth.resend({
      type: 'signup',
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}${confirmRedirect}` },
    }).catch(() => { /* best-effort — Supabase's own anti-enumeration behaviour means this never reveals whether the email actually exists */ })
    setResending(false)
    setResent(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) return
    setSubmitting(true)
    setError(null)

    // Founder never sees or needs this — it's a throwaway credential that
    // establishes their session; the very next step (JoinConfirmPage) has
    // them replace it with a real one.
    const throwawayPassword = crypto.randomUUID()
    const signUpResult = await signUp(trimmed, throwawayPassword, confirmRedirect)

    if (signUpResult.alreadyRegistered) {
      // Email is already a member. Don't say "check your email" — send them
      // to sign in (or reset a password they may never have set).
      setSubmitting(false)
      setAlreadyMember(true)
      return
    }
    if (signUpResult.error) {
      setSubmitting(false)
      setError(signUpResult.error)
      return
    }
    if (signUpResult.needsConfirmation) {
      // The overwhelmingly common case (Supabase's "Confirm email" is on) —
      // no session exists yet, so there's no userId to attach a founder
      // record to. JoinConfirmPage creates it once they click the email
      // link and land back here with a real session — see ensureJoinedFounder.
      setSubmitting(false)
      setCheckEmail(true)
      return
    }

    // Only reached when email confirmation is off and a session exists
    // immediately — same ensureJoinedFounder() call JoinConfirmPage makes,
    // so both paths converge on one function rather than duplicating it.
    const userId = (await supabase?.auth.getUser())?.data.user?.id
    setSubmitting(false)
    if (!userId) {
      setError('Could not create your account. Please try again.')
      return
    }
    await ensureJoinedFounder(userId, trimmed, source, { canvaUserId })
    navigate('/join/confirm', { replace: true })
  }

  return { email, setEmail, submitting, error, checkEmail, alreadyMember, handleSubmit, handleResend, resending, resent }
}
