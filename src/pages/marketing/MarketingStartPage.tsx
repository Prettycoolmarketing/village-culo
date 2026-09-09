import { useSearchParams, Link } from 'react-router-dom'
import { usePageMeta } from '../../utils/usePageMeta'
import { InnerContainer } from '../../components/layout/PageContainer'
import { PCM_SUPPORT_EMAIL, PCM_OFFERS, type PcmOffer } from '../../config/pcmPaymentLinks'

const CHECKLIST = [
  'Your MD (.md) files exported from AI — anything you have generated about your business, your story, your expertise or your content.',
  'Your OneDrive links to previously posted content, raw footage and documents.',
  'Your Google Drive links to the same.',
  'Links to your existing content: YouTube channel, podcast, website and Instagram.',
  'Your website URL and the social accounts you want your published work linked from.',
  'A short note on how you want to be positioned — business, speaker, authority, whatever your dream is.',
]

export function MarketingStartPage() {
  const [params] = useSearchParams()
  const offerId = params.get('offer') as PcmOffer['id'] | null
  const offer = offerId && PCM_OFFERS[offerId] ? PCM_OFFERS[offerId] : null

  usePageMeta({
    title: 'You’re in — send us your material | Pretty Cool Marketing',
    description: 'Next step after payment: email Pretty Cool Marketing your MD files, OneDrive and Google Drive links, and your existing content so we can get to work.',
  })

  const subject = offer ? `New client — ${offer.name}` : 'New client — Pretty Cool Marketing'
  const mailto = `mailto:${PCM_SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
    `Name:\nBusiness:\nOffer: ${offer?.name ?? ''}\n\nMD files attached: \nOneDrive link(s): \nGoogle Drive link(s): \nYouTube: \nPodcast: \nWebsite: \nInstagram: \n\nHow I want to be positioned: \n`,
  )}`

  return (
    <main className="min-h-screen bg-pcm-cream">
      <section className="bg-pcm-cream py-20 md:py-24 text-center border-b border-pcm-linen">
        <InnerContainer className="max-w-2xl">
          <p className="font-body text-xs font-semibold text-pcm-dark/70 uppercase tracking-widest mb-4">
            {offer ? offer.name : 'Pretty Cool Marketing'}
          </p>
          <h1 className="font-heading text-4xl sm:text-5xl font-bold text-pcm-dark leading-tight mb-6">
            You’re in. Here’s the one thing we need from you.
          </h1>
          <p className="font-body text-lg text-pcm-dark/80 leading-relaxed">
            To get started we need your material. Email everything below to{' '}
            <a href={`mailto:${PCM_SUPPORT_EMAIL}`} className="text-pcm-dark underline">
              {PCM_SUPPORT_EMAIL}
            </a>
            .
          </p>
        </InnerContainer>
      </section>

      <section className="py-16 md:py-20 bg-pcm-sand">
        <InnerContainer className="max-w-3xl">
          <p className="font-body text-xs font-semibold text-pcm-dark uppercase tracking-widest mb-3">
            What to send
          </p>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-pcm-dark mb-8 leading-tight">
            Email us your information
          </h2>
          <ul className="space-y-4 mb-10">
            {CHECKLIST.map(item => (
              <li key={item} className="flex gap-3 font-body text-lg text-pcm-muted leading-relaxed">
                <span className="text-pcm-dark font-bold shrink-0">—</span>
                {item}
              </li>
            ))}
          </ul>

          <div className="bg-pcm-cream border border-pcm-linen rounded-2xl p-8 shadow-card">
            <p className="font-body text-sm text-pcm-muted mb-1">Send to</p>
            <p className="font-heading text-xl font-bold text-pcm-dark mb-5">{PCM_SUPPORT_EMAIL}</p>
            <a
              href={mailto}
              className="inline-flex items-center justify-center px-6 py-3 bg-pcm-orange text-white text-sm font-semibold rounded-xl hover:bg-pcm-orange-dark transition-colors"
            >
              Open a pre-filled email →
            </a>
            <p className="mt-3 font-body text-xs text-pcm-muted">
              Opens your mail app with the checklist ready to fill in. Attach your MD files before
              sending.
            </p>
          </div>

          <p className="mt-10 font-body text-pcm-muted leading-relaxed">
            Once we have your material:{' '}
            {offer?.id === 'publishing' ? (
              <>we restructure and republish each piece, then send you your founder profile link and every article.</>
            ) : offer?.id === 'tier3' ? (
              <>your first shoot is booked within 2 weeks and content is live 2 weeks after we have all your raw footage.</>
            ) : (
              <>editing begins, and your first month of posts is scheduled across every platform and into the Village.</>
            )}
          </p>

          <p className="mt-8 font-body text-sm">
            <Link to="/marketing" className="text-pcm-dark hover:underline">← Back to Pretty Cool Marketing</Link>
          </p>
        </InnerContainer>
      </section>
    </main>
  )
}
