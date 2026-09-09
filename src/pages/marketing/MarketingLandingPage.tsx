import { Link } from 'react-router-dom'
import { usePageMeta } from '../../utils/usePageMeta'
import { InnerContainer } from '../../components/layout/PageContainer'
import { MarketingHero } from './MarketingHero'
import { PCM_SUPPORT_EMAIL } from '../../config/pcmPaymentLinks'

export function MarketingLandingPage() {
  usePageMeta({
    title: 'Pretty Cool Marketing — the done-for-you service arm of the Culo Village',
    description:
      'Pretty Cool Marketing takes your existing content, restructures it and republishes it so AI and search can find you as an authority in your field. Publishing service and social media content partnerships.',
    keywords: [
      'Pretty Cool Marketing', 'content republishing service', 'AI search authority',
      'founder authority positioning', 'done for you content', 'social media content agency',
      'Culo Village', 'content editing and distribution', 'content creator retainer',
    ],
  })

  return (
    <main className="min-h-screen bg-pcm-sand">
      <MarketingHero
        kicker="Pretty Cool Marketing"
        title="We do the work of positioning you as the authority in your field."
        description={
          <>
            The done-for-you service arm of the{' '}
            <a href="https://www.culovillage.com" className="text-white underline hover:text-pcm-orange">
              Culo Village
            </a>
            . We take the content you have already made — across YouTube, podcasts, your website and
            Instagram — restructure it, and republish each piece as its own article so AI and search
            can find you as a founder and an expert.
          </>
        }
        right={
          <div className="bg-pcm-sand rounded-2xl p-7 shadow-lg flex flex-col gap-3">
            <p className="font-heading text-lg font-bold text-pcm-ink mb-1">Two ways to work with us</p>
            <Link
              to="/marketing/publishing"
              className="px-5 py-3 bg-pcm-orange text-white text-sm font-semibold rounded-xl text-center hover:bg-pcm-orange-dark transition-colors"
            >
              Publishing service — $900 one-off
            </Link>
            <Link
              to="/marketing/social"
              className="px-5 py-3 border border-pcm-linen text-pcm-ink text-sm font-semibold rounded-xl text-center hover:border-pcm-orange hover:text-pcm-orange transition-colors"
            >
              Social media partnerships
            </Link>
          </div>
        }
      />

      {/* ── Who this is for ───────────────────────────────────────────────── */}
      <section className="py-16 md:py-20 bg-pcm-cream border-y border-pcm-linen">
        <InnerContainer className="max-w-3xl">
          <p className="font-body text-xs font-semibold text-pcm-orange uppercase tracking-widest mb-3">
            Who this is for
          </p>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-pcm-ink mb-6 leading-tight">
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
            <p className="font-body text-xs font-semibold text-pcm-orange uppercase tracking-widest mb-3">
              What we do
            </p>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-pcm-ink leading-tight">
              Two ways to work with us.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <OfferCard
              kicker="Offer one · one-off service"
              title="Publishing in the Culo Village"
              price="$900 AUD"
              cadence="one-off payment"
              body="We transfer everything you have previously posted across YouTube, podcasts, websites and Instagram, and republish each piece as an individual article — restructured to position you as an authority and a business in your area. You get the link to your founder profile and every published article, and we encourage you to link them from your social accounts and your website."
              to="/marketing/publishing"
              cta="See the publishing service"
            />
            <OfferCard
              kicker="Offer two · monthly partnership"
              title="Social media content"
              price="From $3,000 AUD"
              cadence="per month"
              body="Tier 2 — 30 posts a month edited in Culo Creatives across Quick Rhythm, voice over and talking head, scheduled to every platform and into the Village with curated captions and hooks. Tier 3 adds a half-day shoot every 4 weeks in the PCM frameworks, filmed and edited to a fast turnaround."
              to="/marketing/social"
              cta="See the social media tiers"
            />
          </div>
        </InnerContainer>
      </section>

      {/* ── DIY note ──────────────────────────────────────────────────────── */}
      <section className="py-14 bg-pcm-cream border-y border-pcm-linen">
        <InnerContainer className="max-w-3xl text-center">
          <p className="font-body text-lg text-pcm-ink leading-relaxed">
            You can also do this yourself by becoming a Culo Village member.{' '}
            <a href="https://www.culovillage.com" className="text-pcm-orange font-semibold hover:underline">
              Learn about the Village →
            </a>{' '}
            We are the service that takes care of it for you.
          </p>
        </InnerContainer>
      </section>

      {/* ── Footer CTA ────────────────────────────────────────────────────── */}
      <section className="py-16 md:py-20 text-center">
        <InnerContainer className="max-w-2xl">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-pcm-ink mb-4 leading-tight">
            Ready to start?
          </h2>
          <p className="font-body text-lg text-pcm-muted leading-relaxed mb-8">
            Pick an offer above and check out. Or email us first at{' '}
            <a href={`mailto:${PCM_SUPPORT_EMAIL}`} className="text-pcm-orange font-semibold hover:underline">
              {PCM_SUPPORT_EMAIL}
            </a>
            .
          </p>
        </InnerContainer>
      </section>
    </main>
  )
}

function OfferCard({
  kicker, title, price, cadence, body, to, cta,
}: {
  kicker: string; title: string; price: string; cadence: string; body: string; to: string; cta: string
}) {
  return (
    <div className="bg-white border border-pcm-linen rounded-2xl p-8 flex flex-col shadow-card">
      <p className="font-body text-xs font-semibold text-pcm-orange uppercase tracking-widest mb-3">{kicker}</p>
      <h3 className="font-heading text-2xl font-bold text-pcm-ink mb-2">{title}</h3>
      <p className="font-body text-pcm-ink mb-5">
        <span className="text-3xl font-bold">{price}</span>{' '}
        <span className="text-pcm-muted text-sm">{cadence}</span>
      </p>
      <p className="font-body text-pcm-muted leading-relaxed flex-1 mb-6">{body}</p>
      <Link
        to={to}
        className="inline-flex justify-center px-5 py-2.5 bg-pcm-orange text-white text-sm font-semibold rounded-xl hover:bg-pcm-orange-dark transition-colors"
      >
        {cta}
      </Link>
    </div>
  )
}
