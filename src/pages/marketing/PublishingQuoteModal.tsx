import { useState } from 'react'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import { getArchiveTier } from '../../config/archiveUnlock'

interface ArchiveResult {
  total: number
  sources: { type: string; label: string; count: number }[]
  sample: { title: string; thumbnailUrl?: string; source: string }[]
}

type Step = 'form' | 'loading' | 'result' | 'error'

// The self-serve quote for the Village publishing service. A prospect
// coming from /marketing already gave their email to get here, so this
// never asks for it again beyond a confirm — it takes their content links,
// gets a cheap archive-size count (detect-archive-size, no full import),
// prices the one-off transfer from that count, and hands them straight to
// Stripe. Account + password happen after payment (stripe-archive-unlock
// webhook), not before.
export function PublishingQuoteModal({ email: initialEmail, onClose, service = 'publishing', serviceName = 'Blog Management', monthlyPrice = 900 }: {
  email?: string
  onClose: () => void
  service?: 'publishing' | 'creatives' | 'full'
  serviceName?: string
  monthlyPrice?: number
}) {
  const [step, setStep] = useState<Step>('form')
  const [email, setEmail] = useState(initialEmail ?? '')
  const [youtube, setYoutube] = useState('')
  const [rss, setRss] = useState('')
  const [website, setWebsite] = useState('')
  const [instagramCount, setInstagramCount] = useState('')
  const [result, setResult] = useState<ArchiveResult | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [checkingOut, setCheckingOut] = useState<'upfront' | 'installment' | null>(null)

  async function runQuote() {
    if (!email.includes('@')) { setErrorMsg('Enter the email you want your dashboard under.'); return }
    setStep('loading')
    setErrorMsg('')
    try {
      if (!isSupabaseConfigured || !supabase) throw new Error('Not available right now — email us instead.')
      const { data, error } = await supabase.functions.invoke<ArchiveResult>('detect-archive-size', {
        body: {
          youtube: youtube.trim() || undefined,
          feeds: rss.trim() ? [rss.trim()] : undefined,
          sitemap: website.trim() || undefined,
          instagramCount: instagramCount.trim() ? Number(instagramCount.trim()) : undefined,
        },
      })
      if (error || !data) throw new Error(error?.message || 'Could not read your channels.')
      setResult(data)
      setStep('result')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong.')
      setStep('error')
    }
  }

  const tier = result ? getArchiveTier(result.total) : null

  async function checkout(plan: 'upfront' | 'installment') {
    if (!result) return
    setCheckingOut(plan)
    setErrorMsg('')
    try {
      if (!isSupabaseConfigured || !supabase) throw new Error('Not available right now — email us instead.')
      const { data, error } = await supabase.functions.invoke<{ url?: string; error?: string }>('create-pcm-checkout', {
        body: { email, service, archiveTotal: result.total, plan },
      })
      if (error || data?.error || !data?.url) throw new Error(data?.error || error?.message || 'Could not start checkout.')
      window.location.href = data.url
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong.')
      setCheckingOut(null)
    }
  }

  const upfrontTotal = tier ? tier.price + monthlyPrice * 3 : 0
  const firstInstalment = tier ? Math.ceil(tier.price / 3) : 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <h2 className="font-heading text-2xl font-bold text-charcoal">Get your quote</h2>
          <button onClick={onClose} className="text-muted hover:text-charcoal text-xl leading-none" aria-label="Close">×</button>
        </div>

        {step === 'form' && (
          <>
            <p className="font-body text-sm text-muted mb-5">
              Paste in what you have. We do a quick count of your back catalogue and price the one-off
              transfer from that, then {serviceName} is ${monthlyPrice.toLocaleString()} AUD a month (3-month minimum).
            </p>
            <div className="flex flex-col gap-3">
              <Field label="Your email">
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@business.com" className={inputClass} />
              </Field>
              <Field label="YouTube channel">
                <input type="url" value={youtube} onChange={e => setYoutube(e.target.value)}
                  placeholder="https://youtube.com/@yourchannel" className={inputClass} />
              </Field>
              <Field label="Podcast or blog RSS feed">
                <input type="url" value={rss} onChange={e => setRss(e.target.value)}
                  placeholder="https://.../feed.xml" className={inputClass} />
              </Field>
              <Field label="Website">
                <input type="url" value={website} onChange={e => setWebsite(e.target.value)}
                  placeholder="https://yourbusiness.com" className={inputClass} />
              </Field>
              <Field label="Roughly how many Instagram posts">
                <input type="number" value={instagramCount} onChange={e => setInstagramCount(e.target.value)}
                  placeholder="e.g. 400" className={inputClass} />
              </Field>
            </div>
            <p className="font-body text-xs text-muted mt-2">
              No need to be exact — we build in headroom for Stories saved to your archive, which don't show
              up in a normal post count.
            </p>
            {errorMsg && <p className="text-sm text-red-600 mt-3">{errorMsg}</p>}
            <button onClick={() => void runQuote()}
              className="mt-5 w-full px-6 py-3.5 bg-primary text-white text-base font-semibold rounded-xl hover:bg-[#b05a35] transition-colors">
              See my quote →
            </button>
          </>
        )}

        {step === 'loading' && (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="font-body text-sm text-muted">Counting your archive…</p>
          </div>
        )}

        {step === 'result' && result && tier && (
          <>
            {result.sample.length > 0 && (
              <div className="grid grid-cols-4 gap-1.5 mb-5">
                {result.sample.slice(0, 8).map((s, i) => (
                  s.thumbnailUrl
                    ? <img key={i} src={s.thumbnailUrl} alt="" className="w-full aspect-square object-cover rounded-md" />
                    : <div key={i} className="w-full aspect-square rounded-md bg-[#F3EDE6]" />
                ))}
              </div>
            )}

            <div className="bg-[#EBF2F8] border border-[#CFE0EE] rounded-xl p-5 mb-5">
              <p className="font-body text-sm text-muted mb-1">Your quote</p>
              <p className="font-body text-sm text-charcoal">
                One-off Archive Transfer <span className="font-semibold">{tier.priceLabel.replace(' once', '')}</span>
                <span className="text-muted"> · covers the initial import only</span>
              </p>
              <p className="font-body text-sm text-charcoal mt-1">
                {serviceName} <span className="font-semibold">${monthlyPrice.toLocaleString()} AUD / month</span>
                <span className="text-muted"> · 3-month minimum</span>
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => void checkout('upfront')}
                disabled={!!checkingOut}
                className="w-full px-6 py-3.5 bg-primary text-white text-base font-semibold rounded-xl hover:bg-[#b05a35] disabled:opacity-50 transition-colors"
              >
                {checkingOut === 'upfront' ? 'Starting…' : `Pay upfront — $${upfrontTotal.toLocaleString()} AUD →`}
              </button>
              <p className="font-body text-xs text-muted -mt-1">
                Archive Transfer plus your first 3 months. ${monthlyPrice.toLocaleString()} a month then bills automatically from month 4.
              </p>

              <button
                onClick={() => void checkout('installment')}
                disabled={!!checkingOut}
                className="w-full px-6 py-3 border border-primary text-primary text-sm font-semibold rounded-xl hover:bg-primary/5 disabled:opacity-50 transition-colors"
              >
                {checkingOut === 'installment' ? 'Starting…' : 'Pay monthly instead →'}
              </button>
              <p className="font-body text-xs text-muted -mt-1">
                ${monthlyPrice.toLocaleString()} a month from today, with the Archive Transfer split across your first 3 invoices
                (first payment ${(monthlyPrice + firstInstalment).toLocaleString()} AUD).
              </p>
            </div>

            <p className="font-body text-xs text-muted mt-4 text-center">
              You set your dashboard password straight after payment.
            </p>
          </>
        )}

        {step === 'error' && (
          <div className="py-10 text-center">
            <p className="font-body text-sm text-red-600 mb-4">{errorMsg}</p>
            <button onClick={() => setStep('form')} className="text-sm font-semibold text-primary hover:underline">
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

const inputClass =
  'w-full border border-border rounded-xl px-3 py-2.5 text-sm text-charcoal placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-charcoal mb-1">{label}</label>
      {children}
    </div>
  )
}
