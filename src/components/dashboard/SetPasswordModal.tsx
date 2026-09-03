import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { getCurrentFounder } from '../../services/currentFounder'
import { updateFounder } from '../../services/founders'

// Shown over the dashboard for founders who joined through the email-only
// flow (JoinVillagePage) — their account exists on a throwaway password
// they never saw. Dismissible ("Later") so it never blocks the dashboard
// outright, but reappears every session until a real password is set.

export function SetPasswordModal({ onClose }: { onClose: () => void }) {
  const { user, updatePassword } = useAuth()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
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

    const founder = getCurrentFounder(user)
    if (founder) await updateFounder({ ...founder, passwordSet: true })
    setSubmitting(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl max-w-sm w-full px-8 py-8" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <h2 className="text-xl font-bold text-[#2D2A26] mb-1">Set your password</h2>
        <p className="text-sm text-[#6B7280] mb-6 leading-relaxed">
          You're already in — just set a real password so you can log back in next time.
        </p>
        <form onSubmit={e => void handleSubmit(e)} className="flex flex-col gap-3">
          <input
            type="password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="New password"
            className="rounded-lg px-3 py-2.5 text-sm border border-[#E8E4DD] focus:outline-none focus:ring-2 focus:ring-[#C86A43]/30 focus:border-[#C86A43] transition-colors"
          />
          <input
            type="password"
            required
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="Confirm password"
            className="rounded-lg px-3 py-2.5 text-sm border border-[#E8E4DD] focus:outline-none focus:ring-2 focus:ring-[#C86A43]/30 focus:border-[#C86A43] transition-colors"
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex items-center justify-between gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="text-sm text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
            >
              Later
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-[#C86A43] text-white text-sm font-semibold rounded-lg hover:bg-[#b05a35] disabled:opacity-60 transition-colors"
            >
              {submitting ? 'Saving…' : 'Set password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
