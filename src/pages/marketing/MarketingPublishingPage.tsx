import { useState } from 'react'
import { Link } from 'react-router-dom'
import { usePageMeta } from '../../utils/usePageMeta'
import { InnerContainer } from '../../components/layout/PageContainer'
import { MarketingHero } from './MarketingHero'
import { PublishingQuoteModal } from './PublishingQuoteModal'

const CALENDLY = 'https://calendly.com/prettycoolmarketing_/30min'

const INCLUDED = [
  'We bring your whole archive into The Culo Village. YouTube videos, podcast episodes, Instagram posts, blogs and articles you have been featured in.',
  'A designated writer restructures and publishes your articles every month, built around the real idea, story or lesson inside each piece and connected back to your founder profile.',
  'Every article is written for searchability, so search engines and AI find you as an authority in your field.',
  'You get your own Culo Village dashboard. Every article shows up there as it goes live, and it is yours to edit any time.',
  'Your founder profile and article links are ready to connect back to your website and your socials.',
]

const STEPS: [string, string, string][] = [
  ['1', 'Get your quote', 'Paste in your channels. We count your back catalogue on the spot and price the one-off transfer from that size.'],
  ['2', 'Pay and set your password', 'Pay the archive transfer, set a password, and your Culo Village dashboard is ready.'],
  ['3', 'Send us your material', 'Email your footage, files and drive links. We pass them to your designated writer to work through in Culo Creatives.'],
  ['4', 'Approve the first batch', 'You get an edit link to review. Once you approve, your library goes live and scheduling begins for the next 30 days.'],
  ['5', 'Review and edit any time', 'Every article appears in your dashboard as it goes live. Change anything you like, and the change flows through to the published page.'],
]

export function MarketingPublishingPage() {
  usePageMeta({
    title: 'Village Service — your archive, published and managed | Pretty Cool Marketing',
    description:
      'Pretty Cool Marketing brings your whole back catalogue into The Culo Village and publishes it as structured founder articles, month after month, with a designated writer. From $900 AUD a month plus a one-off archive transfer.',
    keywords: [
      'content republishing service', 'AI search authority', 'founder authority positioning',
      'blog management', 'Culo Village publishing', 'done for you content',
    ],
  })

  const [quoteOpen, setQuoteOpen] = useState(false)

  return (
    <main className="min-h-screen bg-surface">
      {quoteOpen && <PublishingQuoteModal onClose={() => setQuoteOpen(false)} />}
      <MarketingHero
        kicker="Pretty Cool Marketing"
        title="Your archive, published and managed for you"
        description={
          <>
            <p className="mb-4">
              You have years of content spread across platforms that nobody can search.
            </p>
            <p className="mb-4">
              We bring your whole archive into The Culo Village and give you a designated writer who
              publishes it as structured founder articles, month after month, so you are found through
              search and AI as the authority in your field.
            </p>
            <p>You focus on serving your customers. We take care of the library.</p>
          </>
        }
        right={
          <div className="bg-[#EBF2F8] border border-[#CFE0EE] rounded-2xl p-8 shadow-lg text-center">
            <p className="font-body text-xs font-semibold text-charcoal uppercase tracking-widest mb-1">Village Service</p>
            <p className="font-heading text-3xl font-bold text-charcoal">from $900 AUD <span className="text-base font-normal text-muted">/ month</span></p>
            <p className="font-body text-sm text-muted mt-1 mb-5">plus a one-off archive transfer, quoted from the size of your archive</p>
            <button
              onClick={() => setQuoteOpen(true)}
              className="block w-full text-center px-6 py-3.5 bg-primary text-white text-base font-semibold rounded-xl hover:bg-[#b05a35] transition-colors"
            >
              Get your quote →
            </button>
            <a href={CALENDLY} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">
              Or book a call first
            </a>
          </div>
        }
      />

      {/* What's included */}
      <section className="py-16 md:py-20 bg-surface border-b border-border">
        <InnerContainer className="max-w-3xl">
          <p className="font-body text-xs font-semibold text-charcoal uppercase tracking-widest mb-3">
            What's included
          </p>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-charcoal mb-8 leading-tight">
            A managed move into a home built for search
          </h2>
          <ul className="space-y-5">
            {INCLUDED.map(item => (
              <li key={item} className="flex gap-3 font-body text-lg text-muted leading-relaxed">
                <span className="text-primary font-bold shrink-0">—</span>
                {item}
              </li>
            ))}
          </ul>
        </InnerContainer>
      </section>

      {/* How it works */}
      <section className="py-16 md:py-20 bg-surface">
        <InnerContainer className="max-w-3xl">
          <p className="font-body text-xs font-semibold text-charcoal uppercase tracking-widest mb-3">
            How it works
          </p>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-charcoal mb-10 leading-tight">
            From your scattered archive to a published library
          </h2>
          <div className="space-y-4">
            {STEPS.map(([n, title, body]) => (
              <div key={n} className="bg-[#EBF2F8] border border-[#CFE0EE] rounded-2xl p-7 flex gap-5">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="font-heading font-bold text-primary">{n}</span>
                </div>
                <div>
                  <h3 className="font-heading text-xl font-bold text-charcoal mb-1">{title}</h3>
                  <p className="font-body text-muted leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </InnerContainer>
      </section>

      {/* DIY / Village note */}
      <section className="py-14 bg-surface border-y border-border">
        <InnerContainer className="max-w-3xl text-center">
          <p className="font-body text-lg text-charcoal leading-relaxed">
            You can also do this yourself by becoming a Culo Village member. The Village is built for
            searchability. This is the service where we bring it all in and keep publishing it for you.{' '}
            <a href="https://www.culovillage.com/join" className="text-primary font-semibold hover:underline">
              Join the Village →
            </a>
          </p>
        </InnerContainer>
      </section>

      {/* Final CTA */}
      <section className="py-16 md:py-20 bg-[#EBF2F8] border-t border-[#CFE0EE]">
        <InnerContainer className="max-w-2xl text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-charcoal leading-tight mb-4">
            Ready to be found?
          </h2>
          <p className="font-body text-lg text-charcoal/80 leading-relaxed mb-8">
            Paste in your channels, see your archive transfer price, and start straight away.
          </p>
          <button
            onClick={() => setQuoteOpen(true)}
            className="inline-flex px-8 py-4 bg-primary text-white text-base font-semibold rounded-xl hover:bg-[#b05a35] transition-colors"
          >
            Get your quote →
          </button>
          <p className="mt-4 font-body text-sm text-muted">
            Or <a href={CALENDLY} target="_blank" rel="noopener noreferrer" className="underline">book a call first</a>.
          </p>
          <p className="mt-6 font-body text-sm text-muted">
            Monthly management has a 3-month minimum. By starting you agree to our{' '}
            <Link to="/terms" className="underline">Terms</Link>.
          </p>
        </InnerContainer>
      </section>
    </main>
  )
}
