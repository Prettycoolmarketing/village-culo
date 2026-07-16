import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export function DashboardResetPasswordPage() {
  const { updatePassword, isConfigured } = useAuth()
  const navigate = useNavigate()

  const [password,        setPassword]        = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error,           setError]           = useState<string | null>(null)
  const [loading,         setLoading]         = useState(false)
  const [done,            setDone]            = useState(false)

  const inp = 'w-full px-3 py-2.5 rounded-lg border border-[#E8E4DD] text-sm text-[#2D2A26] bg-white placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#C86A43]/30 focus:border-[#C86A43] transition-colors'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    const { error: err } = await updatePassword(password)
    setLoading(false)
    if (err) { setError(err); return }
    setDone(true)
  }

  return (
    <div className="min-h-screen bg-[#F8F5F0] flex items-center justify-center px-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="w-full max-w-sm">

        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 rounded-2xl bg-[#C86A43] flex items-center justify-center">
            <span className="text-white text-lg font-bold leading-none">C</span>
          </div>
          <div>
            <p className="text-lg font-bold text-[#2D2A26] leading-none">CULO</p>
            <p className="text-xs text-[#9CA3AF] leading-none mt-0.5">Publisher Dashboard</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E8E4DD] p-8 shadow-sm">

          {done ? (
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-[#2D2A26] mb-2">Password updated</h1>
              <p className="text-sm text-[#6B7280] mb-6 leading-relaxed">
                Your password has been changed. Sign in with your new password.
              </p>
              <button
                onClick={() => navigate('/dashboard/login')}
                className="w-full py-2.5 bg-[#C86A43] text-white text-sm font-semibold rounded-lg hover:bg-[#b05a35] transition-colors"
              >
                Back to sign in
              </button>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-bold text-[#2D2A26] mb-1">Choose a new password</h1>
              <p className="text-sm text-[#6B7280] mb-6">
                {!isConfigured
                  ? 'Dev mode — password reset is unavailable without Supabase configured.'
                  : 'Set a new password for your account.'}
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label htmlFor="reset-password" className="block text-sm font-medium text-[#2D2A26] mb-1.5">New password</label>
                  <input
                    id="reset-password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    placeholder="••••••••"
                    className={inp}
                  />
                </div>

                <div>
                  <label htmlFor="reset-confirm" className="block text-sm font-medium text-[#2D2A26] mb-1.5">Confirm new password</label>
                  <input
                    id="reset-confirm"
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    placeholder="••••••••"
                    className={inp}
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-[#C86A43] text-white text-sm font-semibold rounded-lg hover:bg-[#b05a35] disabled:opacity-60 transition-colors mt-1"
                >
                  {loading ? 'Updating…' : 'Update password'}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs text-[#9CA3AF] mt-6">
          <Link to="/dashboard/login" className="hover:text-[#C86A43] transition-colors">← Back to sign in</Link>
        </p>
      </div>
    </div>
  )
}
