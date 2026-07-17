import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { consumeCanvaPkceVerifier, exchangeCanvaCode } from '../../services/canva'

// Canva redirects the browser here after the founder approves (or denies)
// the consent screen started in startCanvaConnect (services/canva.ts). The
// PKCE code_verifier never left the browser, so it's read back out of
// sessionStorage here (keyed by the `state` param) rather than being part
// of Canva's redirect at all.
export function DashboardCanvaCallbackPage() {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<'working' | 'done' | 'error'>('working')
  const [error, setError] = useState('')

  useEffect(() => {
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const deniedReason = searchParams.get('error_description') ?? searchParams.get('error')

    if (deniedReason) { setStatus('error'); setError(deniedReason); return }
    if (!code || !state) { setStatus('error'); setError('Missing code from Canva — try connecting again.'); return }

    const pkce = consumeCanvaPkceVerifier(state)
    if (!pkce) { setStatus('error'); setError('This connection link expired — try connecting again.'); return }

    void exchangeCanvaCode(pkce.founderId, code, pkce.verifier)
      .then(() => setStatus('done'))
      .catch(err => { setStatus('error'); setError(err instanceof Error ? err.message : 'Could not connect Canva.') })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F5F0]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="bg-white rounded-2xl border border-[#E8E4DD] p-8 max-w-sm w-full text-center">
        {status === 'working' && <p className="text-sm text-[#6B7280]">Connecting your Canva account…</p>}
        {status === 'done' && (
          <>
            <p className="text-sm font-semibold text-[#2D2A26] mb-3">Canva connected</p>
            <Link to="/dashboard/import" className="text-sm text-[#C86A43] font-semibold hover:underline">
              Back to Import Content →
            </Link>
          </>
        )}
        {status === 'error' && (
          <>
            <p className="text-sm font-semibold text-red-600 mb-2">Couldn't connect Canva</p>
            <p className="text-xs text-[#9CA3AF] mb-4">{error}</p>
            <Link to="/dashboard/import" className="text-sm text-[#C86A43] font-semibold hover:underline">
              Back to Import Content →
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
