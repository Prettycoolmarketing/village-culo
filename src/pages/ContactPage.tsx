import { useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { usePageMeta } from '../utils/usePageMeta'
import { InnerContainer } from '../components/layout/PageContainer'
import { submitSupportRequest } from '../services/supportRequest'

// Same dark "Support" treatment as the bottom of /how-culo-canva, standing
// alone as its own page rather than only living at the foot of one other
// page — a real, memorable /culocontact URL to hand out.
export function ContactPage() {
  usePageMeta({
    title: 'Contact — Pretty Cool Marketing x CULO Village',
    description: 'Send us a message and we\'ll get back to you — usually within a business day.',
  })

  return (
    <main className="min-h-screen bg-charcoal">
      <section className="pt-32 pb-24 relative overflow-hidden">
        <InnerContainer>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="font-body text-xs font-semibold text-primary uppercase tracking-widest mb-4">
                Contact
              </p>
              <h1 className="font-heading text-3xl sm:text-4xl font-bold text-white mb-2 leading-tight">
                Get in touch
              </h1>
              <p className="font-body text-white/60 mb-6">
                Send us a message and we'll get back to you — usually within a business day.
              </p>
              <ContactForm />
            </div>
            <div className="relative">
              <img
                src="/contact/culo-icon-graphic.png"
                alt="CULO — format picker showing Carousel, Reel and Blog options above the Creatives button"
                className="w-full h-auto rounded-3xl"
              />
            </div>
          </div>
        </InnerContainer>
      </section>
    </main>
  )
}

function ContactForm() {
  // A link from a curated founder's own profile (or the outreach email)
  // pre-fills the message so someone asking to be removed doesn't have to
  // explain from scratch who they are or what they're asking for — see the
  // "Request removal" link on the curated-profile banner.
  const [searchParams] = useSearchParams()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState(searchParams.get('message') ?? '')
  const [status, setStatus] = useState<'idle' | 'busy' | 'done' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !message.trim()) return
    setStatus('busy')
    setError(null)
    const source = searchParams.get('source') ?? 'contact-page'
    const result = await submitSupportRequest({ name: name.trim(), email: email.trim(), message: message.trim(), source })
    if (result.success) setStatus('done')
    else { setStatus('error'); setError(result.error ?? 'Could not send your message. Please try again.') }
  }

  if (status === 'done') {
    return (
      <div className="bg-white rounded-2xl border border-border px-6 py-6">
        <p className="font-body text-sm font-semibold text-[#5E6B4A]">Message sent ✓</p>
        <p className="font-body text-sm text-muted mt-1">We've got it — we'll get back to you soon.</p>
      </div>
    )
  }

  const inputClass = 'w-full border border-border rounded-xl px-3 py-2.5 text-sm text-charcoal placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white'

  return (
    <form onSubmit={e => void handleSubmit(e)} className="flex flex-col gap-3">
      <input
        type="text" required value={name} onChange={e => setName(e.target.value)}
        placeholder="Your name" aria-label="Your name" className={inputClass}
      />
      <input
        type="email" required value={email} onChange={e => setEmail(e.target.value)}
        placeholder="you@email.com" aria-label="Your email" className={inputClass}
      />
      <textarea
        required rows={5} value={message} onChange={e => setMessage(e.target.value)}
        placeholder="How can we help?" aria-label="Your message"
        className={`${inputClass} resize-y`}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={status === 'busy'}
        className="self-start px-6 py-3 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-[#b05a35] disabled:opacity-60 transition-colors"
      >
        {status === 'busy' ? 'Sending…' : 'Send message'}
      </button>
    </form>
  )
}
