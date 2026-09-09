import { Link } from 'react-router-dom'
import { usePageMeta } from '../../utils/usePageMeta'
import { InnerContainer } from '../../components/layout/PageContainer'
import { MarketingHero, MarketingPriceCard } from './MarketingHero'
import { MarketingCheckoutButton } from './MarketingCheckoutButton'
import { PCM_SUPPORT_EMAIL } from '../../config/pcmPaymentLinks'

const INCLUDED = [
  'We collect everything you have previously posted across YouTube, podcasts, websites and Instagram.',
  'Each piece is restructured and republished as its own individual article — built for searchability.',
  'Your blogs, articles and stories are rewritten to position you as an authority and a business in your area.',
  'You are set up with your founder profile link and a link to every published article.',
  'We show you how to link your published work back to your social accounts and your website.',
]

const STEPS = [
  { n: '1', title: 'Pay for the service', body: 'A single $900 AUD payment. No subscription, no ongoing fee.' },
  { n: '2', title: 'Send us your material', body: `You get instructions to email ${PCM_SUPPORT_EMAIL} with your information — including your MD files from AI, and your OneDrive / Google Drive links to previously posted content.` },
  { n: '3', title: 'We restructure and republish', body: 'We transfer each piece into the Culo Village and republish it as a standalone article, structured to position you as a founder and an authority in your field.' },
  { n: '4', title: 'You get your links', body: 'Your founder profile and every published article, ready to link from your social media and your website.' },
]

export function MarketingPublishingPage() {
  usePageMeta({
    title: 'Publishing in the Culo Village — $900 one-off | Pretty Cool Marketing',
    description:
      'We transfer all your previously posted content across YouTube, podcasts, websites and Instagram and republish each piece as an individual article, structured so AI finds you as an authority. One-off $900 AUD.',
    keywords: [
      'content republishing service', 'AI search authority', 'founder authority positioning',
      'republish podcast as article', 'Culo Village publishing', 'done for you content transfer',
    ],
  })

  return (
    <main className="min-h-screen bg-background">
      <MarketingHero
        kicker="Offer one · one-off service"
        title="Publishing in the Culo Village"
        description="As a service, we transfer all the content you have previously posted across YouTube, podcasts, websites and Instagram, and republish each piece as an individual article. This is what helps AI find you as a founder and positions you as an authority in your field."
        right={
          <MarketingPriceCard price="$900 AUD" cadence="one-off payment · one-off service">
            <MarketingCheckoutButton offerId="publishing" />
          </MarketingPriceCard>
        }
      />

      {/* What's included */}
      <section className="py-16 md:py-20 bg-background border-b border-border">
        <InnerContainer className="max-w-3xl">
          <p className="font-body text-xs font-semibold text-charcoal uppercase tracking-widest mb-3">
            What's included
          </p>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-charcoal mb-8 leading-tight">
            A done-for-you move into a home built for search.
          </h2>
          <ul className="space-y-4">
            {INCLUDED.map(item => (
              <li key={item} className="flex gap-3 font-body text-lg text-muted leading-relaxed">
                <span className="text-charcoal font-bold shrink-0">—</span>
                {item}
              </li>
            ))}
          </ul>
        </InnerContainer>
      </section>

      {/* How it works */}
      <section className="py-16 md:py-20 bg-background">
        <InnerContainer>
          <div className="max-w-2xl mb-12">
            <p className="font-body text-xs font-semibold text-charcoal uppercase tracking-widest mb-3">
              How it works
            </p>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-charcoal leading-tight">
              Four steps.
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {STEPS.map(step => (
              <div key={step.n} className="bg-surface border border-border rounded-2xl p-7 shadow-card">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <span className="font-heading font-bold text-charcoal">{step.n}</span>
                </div>
                <h3 className="font-heading text-xl font-bold text-charcoal mb-2">{step.title}</h3>
                <p className="font-body text-muted leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </InnerContainer>
      </section>

      {/* DIY / Village note */}
      <section className="py-14 bg-background border-y border-border">
        <InnerContainer className="max-w-3xl text-center">
          <p className="font-body text-lg text-charcoal leading-relaxed">
            Clients can also do this themselves by becoming a Culo Village member. The Village is set
            up for searchability — we are the service that restructures your blogs, articles and
            stories and takes care of it for you.{' '}
            <a href="https://www.culovillage.com" className="text-charcoal font-semibold hover:underline">
              Learn about the Village →
            </a>
          </p>
        </InnerContainer>
      </section>

      {/* Final CTA — cream section (like the hero), orange button */}
      <section className="py-16 md:py-20 bg-background border-t border-border">
        <InnerContainer>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-charcoal leading-tight">
                Start your publishing service
              </h2>
              <p className="mt-4 font-body text-sm text-charcoal/80">
                After payment you'll get instructions to email us your material.{' '}
                <Link to="/marketing/start?offer=publishing" className="text-charcoal underline">
                  Preview those instructions →
                </Link>
              </p>
            </div>
            <div className="md:justify-self-end w-full md:max-w-xs">
              <MarketingCheckoutButton offerId="publishing" />
            </div>
          </div>
        </InnerContainer>
      </section>
    </main>
  )
}
