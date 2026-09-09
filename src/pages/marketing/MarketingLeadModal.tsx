import { useState, useEffect, type FormEvent } from 'react'
import { pcmLeadsService } from '../../services/pcmLeads'

const CAPTURED_FLAG = 'pcm_lead_captured_v1'

/** Once someone has given their details in this browser, later clicks skip the form. */
export function hasCapturedLead(): boolean {
  try { return localStorage.getItem(CAPTURED_FLAG) === '1' } catch { return false }
}
function markCaptured() {
  try { localStorage.setItem(CAPTURED_FLAG, '1') } catch { /* private mode — no-op */ }
}

const inputClass =
  'w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-charcoal text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors'

export function MarketingLeadModal({
  open,
  onClose,
  onSuccess,
  offerLabel,
  source,
}: {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  offerLabel: string
  source: string
}) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', website: '' })
  const [status, setStatus] = useState<'idle' | 'busy' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [open, onClose])

  if (!open) return null

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim()) return
    setStatus('busy')
    setError(null)
    const res = await pcmLeadsService.submit({ ...form, source })
    if (res.success) {
      markCaptured()
      onSuccess()
    } else {
      setStatus('error')
      setError(res.error ?? 'Something went wrong. Please try again.')
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-charcoal/60"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`See rates for ${offerLabel}`}
    >
      <div
        className="w-full max-w-md bg-surface rounded-2xl shadow-lg p-7 relative"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 text-muted hover:text-charcoal transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <p className="font-body text-xs font-semibold text-charcoal uppercase tracking-widest mb-2">
          {offerLabel}
        </p>
        <h2 className="font-heading text-2xl font-bold text-charcoal mb-2 leading-tight">
          A few details, then we’ll show you the rates.
        </h2>
        <p className="font-body text-sm text-muted mb-5">
          So we know who we’re talking to. We’ll be in touch about working together.
        </p>

        <form onSubmit={submit} className="flex flex-col gap-3">
          <input
            className={inputClass}
            placeholder="Full name"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            className={inputClass}
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            required
          />
          <input
            className={inputClass}
            type="tel"
            placeholder="Phone number"
            value={form.phone}
            onChange={e => setForm({ ...form, phone: e.target.value })}
          />
          <input
            className={inputClass}
            placeholder="Your website"
            value={form.website}
            onChange={e => setForm({ ...form, website: e.target.value })}
          />
          {error && <p className="font-body text-xs text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={status === 'busy'}
            className="mt-1 inline-flex items-center justify-center px-6 py-3 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-[#b05a35] disabled:opacity-60 transition-colors"
          >
            {status === 'busy' ? 'One moment…' : 'See rates'}
          </button>
        </form>
      </div>
    </div>
  )
}
