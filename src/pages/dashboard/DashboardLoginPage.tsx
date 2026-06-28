import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export function DashboardLoginPage() {
  const { signIn, isConfigured } = useAuth()
  const navigate = useNavigate()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState<string | null>(null)
  const [loading,  setLoading]  = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error: err } = await signIn(email, password)
    setLoading(false)
    if (err) { setError(err); return }
    navigate('/dashboard/home')
  }

  return (
    <div className="min-h-screen bg-[#F8F5F0] flex items-center justify-center px-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="w-full max-w-sm">

        {/* Logo */}
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
          <h1 className="text-xl font-bold text-[#2D2A26] mb-1">Sign in</h1>
          <p className="text-sm text-[#6B7280] mb-6">
            {isConfigured ? 'Use your CULO publisher account.' : 'Dev mode — any credentials will work.'}
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
                className="w-full px-3 py-2.5 rounded-lg border border-[#E8E4DD] text-sm text-[#2D2A26] bg-white placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#C86A43]/30 focus:border-[#C86A43] transition-colors"
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
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full px-3 py-2.5 rounded-lg border border-[#E8E4DD] text-sm text-[#2D2A26] bg-white placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#C86A43]/30 focus:border-[#C86A43] transition-colors"
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
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-[#9CA3AF] mt-6">
          <a href="/" className="hover:text-[#C86A43] transition-colors">← Back to Village</a>
        </p>
      </div>
    </div>
  )
}
