import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePageMeta } from '../../utils/usePageMeta'
import { InnerContainer } from '../../components/layout/PageContainer'
import { MarketingHero } from './MarketingHero'
import { MarketingLeadModal, hasCapturedLead } from './MarketingLeadModal'
import { PCM_SUPPORT_EMAIL } from '../../config/pcmPaymentLinks'

type Dest = { label: string; source: string; to: string }

const PUBLISHING: Dest = { label: 'Publishing service', source: 'marketing-publishing', to: '/marketing/publishing' }
const SOCIAL: Dest = { label: 'Social media partnerships', source: 'marketing-social', to: '/marketing/social' }

export function MarketingLandingPage() {
  const navigate = useNavigate()
  const [dest, setDest] = useState<Dest | null>(null)

  usePageMeta({
    title: 'Done For You Services in the Village — Pretty Cool Marketing',
    description:
      'Done for you services in the Culo Village. Two ways to work with us: a one-off publishing service, or an ongoing social media content partnership.',
    keywords: [
      'Pretty Cool Marketing', 'done for you services', 'content republishing service',
      'AI search authority', 'founder authority positioning', 'social media content agency',
      'Culo Village',
    ],
  })

  /** Open the lead form, or skip straight through if this browser already gave details. */
  function go(d: Dest) {
    if (hasCapturedLead()) navigate(d.to)
    else setDest(d)
  }

  return (
    <main className="min-h-screen bg-pcm-cream">
      <MarketingHero
        kicker="Pretty Cool Marketing"
        title="Done for you services in the Village."
        description={
          <>
            We take the content you have already made — across YouTube, podcasts, your website and
            Instagram — restructure it, and republish each piece so AI and search can find you as a
            founder and an expert. Or we run your social media content end to end.
          </>
        }
        right={
          <div className="bg-pcm-sand border border-pcm-linen rounded-2xl p-7 shadow-lg flex flex-col gap-3">
            <p className="font-heading text-lg font-bold text-pcm-dark mb-1">Two ways to work with us</p>
            <button
              onClick={() => go(PUBLISHING)}
              className="px-5 py-3 bg-pcm-orange text-white text-sm font-semibold rounded-xl text-center hover:bg-pcm-orange-dark transition-colors"
            >
              Publishing service
            </button>
            <button
              onClick={() => go(SOCIAL)}
              className="px-5 py-3 border border-pcm-linen text-pcm-dark text-sm font-semibold rounded-xl text-center hover:border-pcm-orange transition-colors"
            >
              Social media partnerships
            </button>
          </div>
        }
      />

      {/* ── Who this is for ───────────────────────────────────────────────── */}
      <section className="py-16 md:py-20 border-b border-pcm-linen">
        <InnerContainer className="max-w-3xl">
          <p className="font-body text-xs font-semibold text-pcm-dark uppercase tracking-widest mb-3">
            Who this is for
          </p>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-pcm-dark mb-6 leading-tight">
            Founders who have already said the valuable things — just not in a place AI can read them.
          </h2>
          <p className="font-body text-lg text-pcm-muted leading-relaxed">
            Your best thinking is buried in podcast episodes, old captions, talking-head videos and
            website pages that were never built for search. The Culo Village is set up for
            searchability. We move your work into it and structure it so it positions you as a
            business, a speaker, an authority — whatever your dream is.
          </p>
        </InnerContainer>
      </section>

      {/* ── The two offers ────────────────────────────────────────────────── */}
      <section className="py-16 md:py-20">
        <InnerContainer>
          <div className="max-w-2xl mb-12">
            <p className="font-body text-xs font-semibold text-pcm-dark uppercase tracking-widest mb-3">
              What we do
            </p>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-pcm-dark leading-tight">
              Two ways to work with us.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <OfferCard
              kicker="One-off service"
              title="Publishing service"
              body="We transfer everything you have previously posted across YouTube, podcasts, websites and Instagram, and republish each piece as an individual article — restructured to position you as an authority and a business in your area. You get the link to your founder profile and every published article, and we encourage you to link them from your social accounts and your website."
              cta="See the publishing service"
              onClick={() => go(PUBLISHING)}
            />
            <OfferCard
              kicker="Monthly partnership"
              title="Social media partnerships"
              body="30 posts a month edited in Culo Creatives across Quick Rhythm, voice over and talking head, scheduled to every platform and into the Village with curated captions and hooks. An optional tier adds a half-day shoot every 4 weeks in the PCM frameworks, filmed and edited to a fast turnaround."
              cta="See the social media tiers"
              onClick={() => go(SOCIAL)}
            />
          </div>
        </InnerContainer>
      </section>

      {/* ── DIY note ──────────────────────────────────────────────────────── */}
      <section className="py-14 border-y border-pcm-linen">
        <InnerContainer className="max-w-3xl text-center">
          <p className="font-body text-lg text-pcm-dark leading-relaxed">
            You can also do this yourself by becoming a Culo Village member.{' '}
            <a href="https://www.culovillage.com" className="text-pcm-dark font-semibold underline hover:text-pcm-orange">
              Learn about the Village →
            </a>{' '}
            We are the service that takes care of it for you.
          </p>
        </InnerContainer>
      </section>

      {/* ── Footer CTA — orange section, dark buttons ─────────────────────── */}
      <section className="py-16 md:py-20 bg-pcm-orange text-center">
        <InnerContainer className="max-w-2xl">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
            Ready to start?
          </h2>
          <p className="font-body text-lg text-white/85 leading-relaxed mb-8">
            Pick a service and we’ll show you the rates. Or email us first at{' '}
            <a href={`mailto:${PCM_SUPPORT_EMAIL}`} className="text-white font-semibold underline">
              {PCM_SUPPORT_EMAIL}
            </a>
            .
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => go(PUBLISHING)}
              className="px-6 py-3 bg-pcm-dark text-white text-sm font-semibold rounded-xl hover:bg-[#1a110b] transition-colors"
            >
              Publishing service
            </button>
            <button
              onClick={() => go(SOCIAL)}
              className="px-6 py-3 bg-pcm-dark text-white text-sm font-semibold rounded-xl hover:bg-[#1a110b] transition-colors"
            >
              Social media partnerships
            </button>
          </div>
        </InnerContainer>
      </section>

      <MarketingLeadModal
        open={dest !== null}
        onClose={() => setDest(null)}
        onSuccess={() => { const d = dest; setDest(null); if (d) navigate(d.to) }}
        offerLabel={dest?.label ?? ''}
        source={dest?.source ?? 'marketing'}
      />
    </main>
  )
}

function OfferCard({
  kicker, title, body, cta, onClick,
}: {
  kicker: string; title: string; body: string; cta: string; onClick: () => void
}) {
  return (
    <div className="bg-pcm-sand border border-pcm-linen rounded-2xl p-8 flex flex-col shadow-card">
      <p className="font-body text-xs font-semibold text-pcm-dark uppercase tracking-widest mb-3">{kicker}</p>
      <h3 className="font-heading text-2xl font-bold text-pcm-dark mb-4">{title}</h3>
      <p className="font-body text-pcm-muted leading-relaxed flex-1 mb-6">{body}</p>
      <button
        onClick={onClick}
        className="inline-flex justify-center px-5 py-2.5 bg-pcm-orange text-white text-sm font-semibold rounded-xl hover:bg-pcm-orange-dark transition-colors"
      >
        {cta}
      </button>
    </div>
  )
}
