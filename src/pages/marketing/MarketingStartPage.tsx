import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { usePageMeta } from '../../utils/usePageMeta'
import { InnerContainer } from '../../components/layout/PageContainer'
import { PCM_SUPPORT_EMAIL } from '../../config/pcmPaymentLinks'
import { PCM_SERVICES, type PcmServiceId } from '../../config/pcmServices'
import { VOICE_BRIEF_INTERVIEW_PROMPT } from '../../services/blogWriter'

// Accept both the new service ids and the old tier2/tier3 aliases that
// live Payment Links still redirect with.
function resolveService(raw: string | null): PcmServiceId | null {
  if (!raw) return null
  const alias: Record<string, PcmServiceId> = { tier2: 'social', tier3: 'content' }
  const id = (alias[raw] ?? raw) as PcmServiceId
  return PCM_SERVICES[id] ? id : null
}

const CALENDLY_URL = 'https://calendly.com/prettycoolmarketing_/30min'

const CHECKLIST = [
  'Your OneDrive links to previously posted content, raw footage and documents.',
  'Your Google Drive links to the same.',
  'Links to your existing content: YouTube channel, podcast, website and Instagram.',
  'Your website URL and the social accounts you want your published work linked from.',
  'A short note on how you want to be positioned, whether that is business, speaker or authority in your field.',
]

export function MarketingStartPage() {
  const [params] = useSearchParams()
  const serviceId = resolveService(params.get('offer'))
  const service = serviceId ? PCM_SERVICES[serviceId] : null
  const [copied, setCopied] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)

  function copyPrompt() {
    void navigator.clipboard.writeText(VOICE_BRIEF_INTERVIEW_PROMPT)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Calendly inline embed — load their widget script once.
  useEffect(() => {
    if (document.querySelector('script[src*="calendly.com/assets/external/widget.js"]')) return
    const s = document.createElement('script')
    s.src = 'https://assets.calendly.com/assets/external/widget.js'
    s.async = true
    document.body.appendChild(s)
  }, [])

  usePageMeta({
    title: 'You’re in — send us your material | Pretty Cool Marketing',
    description: 'Next step after payment: email Pretty Cool Marketing your MD files, OneDrive and Google Drive links, and your existing content so we can get to work.',
  })

  const subject = service ? `New client — ${service.name}` : 'New client — Pretty Cool Marketing'
  const mailto = `mailto:${PCM_SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
    `Name:\nBusiness:\nOffer: ${service?.name ?? ''}\n\nMD files attached: \nOneDrive link(s): \nGoogle Drive link(s): \nYouTube: \nPodcast: \nWebsite: \nInstagram: \n\nHow I want to be positioned: \n`,
  )}`

  return (
    <main className="min-h-screen bg-surface">
      <section className="relative overflow-hidden bg-surface py-20 md:py-24 text-center border-b border-border">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #7CA9CC 0%, transparent 70%)' }} />
          <div className="absolute -bottom-24 -left-24 w-[400px] h-[400px] rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #5E6B4A 0%, transparent 70%)' }} />
        </div>
        <InnerContainer className="max-w-2xl relative">
          <p className="font-body text-xs font-semibold text-charcoal/70 uppercase tracking-widest mb-4">
            {service ? service.name : "Pretty Cool Marketing"}
          </p>
          <h1 className="font-heading text-4xl sm:text-5xl font-bold text-charcoal leading-tight mb-6">
            You’re in. Here’s the one thing we need from you.
          </h1>
          <p className="font-body text-lg text-charcoal/80 leading-relaxed">
            To get started we need your material. Email everything below to{' '}
            <a href={`mailto:${PCM_SUPPORT_EMAIL}`} className="text-charcoal underline">
              {PCM_SUPPORT_EMAIL}
            </a>
            .
          </p>
        </InnerContainer>
      </section>

      <section className="relative overflow-hidden py-16 md:py-20 bg-surface">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #7CA9CC 0%, transparent 70%)' }} />
          <div className="absolute -bottom-24 -right-24 w-[400px] h-[400px] rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #5E6B4A 0%, transparent 70%)' }} />
        </div>
        <InnerContainer className="max-w-3xl relative">
          <p className="font-body text-xs font-semibold text-charcoal uppercase tracking-widest mb-3">
            What to send
          </p>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-charcoal mb-8 leading-tight">
            Email us your information
          </h2>

          <div className="bg-white rounded-2xl p-8 mb-10 shadow-lg">
            <p className="font-heading text-xl font-bold text-charcoal mb-2">Your brand story file (the important one)</p>
            <p className="font-body text-muted leading-relaxed mb-4">
              This is a document about your business, your story, your expertise and your voice. It is
              what lets us write your articles so they sound like you, not generic AI. If you have ever
              generated something like this with ChatGPT, Claude or another AI, send us the file. If
              not, copy the prompt below into any AI you use, answer what it asks, and send us the
              result as a .md or .txt file.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={copyPrompt}
                className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-[#b05a35] transition-colors"
              >
                {copied ? 'Copied ✓' : 'Copy the prompt'}
              </button>
              <button
                onClick={() => setShowPrompt(s => !s)}
                className="px-5 py-2.5 border border-border text-charcoal text-sm font-semibold rounded-xl hover:border-primary transition-colors"
              >
                {showPrompt ? 'Hide it' : 'Read it first'}
              </button>
            </div>
            {showPrompt && (
              <pre className="mt-4 max-h-80 overflow-y-auto whitespace-pre-wrap text-xs text-muted bg-[#F8F5F0] rounded-lg p-4 font-mono">
                {VOICE_BRIEF_INTERVIEW_PROMPT}
              </pre>
            )}
          </div>

          <p className="font-body text-sm font-semibold text-charcoal uppercase tracking-widest mb-3">And these links</p>
          <ul className="space-y-4 mb-10">
            {CHECKLIST.map(item => (
              <li key={item} className="flex gap-3 font-body text-lg text-muted leading-relaxed">
                <span className="text-charcoal font-bold shrink-0">—</span>
                {item}
              </li>
            ))}
          </ul>

          <div className="bg-charcoal rounded-2xl p-10 shadow-card">
            <p className="font-body text-sm text-white/60 mb-1">Send to</p>
            <p className="font-heading text-xl font-bold text-white mb-5">{PCM_SUPPORT_EMAIL}</p>
            <a
              href={mailto}
              className="inline-flex items-center justify-center px-6 py-3 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-[#b05a35] transition-colors"
            >
              Open a pre-filled email →
            </a>
            <p className="mt-3 font-body text-xs text-white/60">
              Opens your mail app with the checklist ready to fill in. Attach your MD files before
              sending.
            </p>
          </div>

          {/* Lock in your first content shoot — only for packages that
              actually include a shoot (Content Creator, Full Service). */}
          {service?.hasShoots && (
            <div className="mt-10 bg-white rounded-2xl p-6 sm:p-8 shadow-lg">
              <h3 className="font-heading text-xl font-bold text-charcoal mb-1">Lock in your first content shoot</h3>
              <p className="font-body text-sm text-muted mb-5">
                Pick a time below. We shoot on Tuesdays and Thursdays, so choose whichever suits you best.
              </p>
              <div
                className="calendly-inline-widget"
                data-url={CALENDLY_URL}
                style={{ minWidth: '320px', height: '650px' }}
              />
            </div>
          )}

          <p className="mt-10 font-body text-muted leading-relaxed">
            Once we have your material:{' '}
            {serviceId === 'publishing' ? (
              <>we restructure and republish each piece, then send you your founder profile link and every article.</>
            ) : service?.hasShoots ? (
              <>your first shoot is booked within 2 weeks and content is live 2 weeks after we have all your raw footage.</>
            ) : serviceId === 'creatives' || serviceId === 'full' ? (
              <>your archive publishing begins, and your first month of social posts is scheduled across every platform and into the Village.</>
            ) : (
              <>editing begins, and your first month of posts is scheduled across every platform and into the Village.</>
            )}
          </p>

          <p className="mt-8 font-body text-sm">
            <Link to="/marketing" className="text-charcoal hover:underline">← Back to Pretty Cool Marketing</Link>
          </p>
        </InnerContainer>
      </section>
    </main>
  )
}
