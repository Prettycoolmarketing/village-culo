import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

type Mode = 'signin' | 'signup'

export function DashboardLoginPage() {
  const { signIn, signUp, isConfigured } = useAuth()
  const navigate = useNavigate()

  const [mode,            setMode]            = useState<Mode>('signin')
  const [email,           setEmail]           = useState('')
  const [password,        setPassword]        = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error,           setError]           = useState<string | null>(null)
  const [loading,         setLoading]         = useState(false)
  const [checkEmail,      setCheckEmail]      = useState(false)

  function switchMode(next: Mode) {
    setMode(next)
    setError(null)
    setCheckEmail(false)
    setConfirmPassword('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (mode === 'signup' && password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)

    if (mode === 'signin') {
      const { error: err } = await signIn(email, password)
      setLoading(false)
      if (err) { setError(err); return }
      navigate('/dashboard/home')
    } else {
      const { error: err, needsConfirmation } = await signUp(email, password)
      setLoading(false)
      if (err) { setError(err); return }
      if (needsConfirmation) {
        setCheckEmail(true)
      } else {
        navigate('/onboarding')
      }
    }
  }

  const inp = 'w-full px-3 py-2.5 rounded-lg border border-[#E8E4DD] text-sm text-[#2D2A26] bg-white placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#C86A43]/30 focus:border-[#C86A43] transition-colors'

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

          {checkEmail ? (
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-[#2D2A26] mb-2">Check your email</h1>
              <p className="text-sm text-[#6B7280] mb-6 leading-relaxed">
                We sent a confirmation link to <span className="font-medium text-[#2D2A26]">{email}</span>. Click it to activate your account, then come back and sign in.
              </p>
              <button
                onClick={() => switchMode('signin')}
                className="w-full py-2.5 border border-[#E8E4DD] text-[#2D2A26] text-sm font-medium rounded-lg hover:border-[#C86A43]/40 hover:text-[#C86A43] transition-colors"
              >
                Back to sign in
              </button>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-bold text-[#2D2A26] mb-1">
                {mode === 'signin' ? 'Sign in' : 'Create account'}
              </h1>
              <p className="text-sm text-[#6B7280] mb-6">
                {!isConfigured
                  ? 'Dev mode — any credentials will work.'
                  : mode === 'signin'
                  ? 'Use your CULO publisher account.'
                  : 'Create your CULO publisher account.'}
              </p>

              {!isConfigured && (
                <div className="mb-5 px-3 py-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-700">
                  Supabase is not configured. Auth is simulated — credentials are not verified.
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label htmlFor="login-email" className="block text-sm font-medium text-[#2D2A26] mb-1.5">Email</label>
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    className={inp}
                  />
                </div>

                <div>
                  <label htmlFor="login-password" className="block text-sm font-medium text-[#2D2A26] mb-1.5">Password</label>
                  <input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                    placeholder="••••••••"
                    className={inp}
                  />
                </div>

                {mode === 'signup' && (
                  <div>
                    <label htmlFor="login-confirm" className="block text-sm font-medium text-[#2D2A26] mb-1.5">Confirm password</label>
                    <input
                      id="login-confirm"
                      type="password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                      placeholder="••••••••"
                      className={inp}
                    />
                  </div>
                )}

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
                  {loading
                    ? (mode === 'signin' ? 'Signing in…' : 'Creating account…')
                    : (mode === 'signin' ? 'Sign in' : 'Create account')}
                </button>
              </form>

              <div className="mt-5 pt-5 border-t border-[#F3EDE6] text-center">
                {mode === 'signin' ? (
                  <p className="text-xs text-[#9CA3AF]">
                    No account?{' '}
                    <button onClick={() => switchMode('signup')} className="text-[#C86A43] hover:underline font-medium">
                      Create one →
                    </button>
                  </p>
                ) : (
                  <p className="text-xs text-[#9CA3AF]">
                    Already have an account?{' '}
                    <button onClick={() => switchMode('signin')} className="text-[#C86A43] hover:underline font-medium">
                      Sign in →
                    </button>
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        <p className="text-center text-xs text-[#9CA3AF] mt-6">
          <a href="/" className="hover:text-[#C86A43] transition-colors">← Back to Village</a>
        </p>
      </div>
    </div>
  )
}
