import { useState, type FormEvent } from 'react'
import { waitlistService } from '../../services/waitlist'

// Reused everywhere CULO Creatives in Canva is mentioned but not yet
// generally available — captures an email while the founder waits on
// Canva's app approval, instead of a dead-end "coming soon" with nothing
// to actually do.
export function WaitlistForm({ source, dark = false, size = 'default' }: { source: string; dark?: boolean; size?: 'default' | 'lg' }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'busy' | 'done' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setStatus('busy')
    setError(null)
    const result = await waitlistService.join({ email: email.trim(), source })
    if (result.success) setStatus('done')
    else { setStatus('error'); setError(result.error ?? 'Could not join the waitlist. Please try again.') }
  }

  const large = size === 'lg'

  if (status === 'done') {
    return (
      <p className={`${large ? 'text-lg md:text-xl text-center' : 'text-sm'} font-medium ${dark ? 'text-white' : 'text-secondary'}`}>
        You're on the list — we'll email you the moment it's ready.
      </p>
    )
  }

  return (
    <form onSubmit={e => void handleSubmit(e)} className={`flex flex-col sm:flex-row ${large ? 'gap-3' : 'gap-2'}`}>
      <input
        type="email"
        required
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="you@email.com"
        aria-label="Email address"
        className={`rounded-xl flex-1 min-w-0 focus:outline-none focus:ring-2 transition-colors ${
          large ? 'px-6 py-4 text-lg' : 'px-4 py-2.5 text-sm'
        } ${
          dark
            ? 'bg-white/10 text-white placeholder:text-white/50 border border-white/20 focus:ring-white/30'
            : 'bg-white text-charcoal placeholder:text-muted border border-border focus:ring-primary/30'
        }`}
      />
      <button
        type="submit"
        disabled={status === 'busy'}
        className={`bg-primary text-white font-semibold rounded-xl hover:bg-[#b05a35] disabled:opacity-60 transition-colors shrink-0 ${
          large ? 'px-8 py-4 text-lg' : 'px-5 py-2.5 text-sm'
        }`}
      >
        {status === 'busy' ? 'Joining…' : 'Join the waitlist'}
      </button>
      {error && <p className={`${large ? 'text-sm' : 'text-xs'} text-red-400 sm:ml-2 self-center`}>{error}</p>}
    </form>
  )
}
