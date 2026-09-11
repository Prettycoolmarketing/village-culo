import { useState } from 'react'
import { Link } from 'react-router-dom'
import { usePageMeta } from '../../utils/usePageMeta'
import { InnerContainer } from '../../components/layout/PageContainer'
import { MarketingHero } from './MarketingHero'
import { PublishingQuoteModal } from './PublishingQuoteModal'

const CALENDLY = 'https://calendly.com/prettycoolmarketing_/30min'

const CARE_BLOCKS: { title: string; paras: string[] }[] = [
  {
    title: 'We bring the old work together',
    paras: [
      'YouTube videos, podcast episodes, Instagram posts, existing blogs and articles you have been featured in can all become part of your founder library inside The Culo Village.',
      'Your original content stays where it already lives. The Village connects the source back to the article and your founder profile.',
    ],
  },
  {
    title: 'You get a designated writer',
    paras: [
      'Your writer works through your archive and publishes 30 founder articles every month.',
      'Each article is built around the actual idea, experience, lesson or story inside the original piece.',
      'We are not inventing expertise for you.',
      'We are publishing the expertise you already have.',
    ],
  },
  {
    title: 'Built for discovery',
    paras: [
      'Your articles are structured with clear topics, context and connections back to you as the founder.',
      'That gives search engines and AI systems a much clearer body of work to understand when people are looking for the things you know about.',
    ],
  },
  {
    title: 'You still own the final word',
    paras: [
      'You get your own Culo Village dashboard.',
      'Every article appears there as it is published, and you can open it, review it and edit it whenever you want.',
    ],
  },
  {
    title: 'One founder profile. A growing body of work.',
    paras: [
      'Instead of sending people to dozens of disconnected posts, you have one founder profile connecting your articles, original media, business, experience and ideas.',
      'And every published article gives you another link you can connect back to your website, LinkedIn and socials.',
    ],
  },
]

const STEPS: { n: string; title: string; paras: string[] }[] = [
  {
    n: '1',
    title: 'Transfer your content spread across platforms',
    paras: [
      'We look at your YouTube, podcast, Instagram, website and any other places your work lives so we can understand the size of your archive.',
    ],
  },
  {
    n: '2',
    title: 'We quote the transfer',
    paras: [
      'Archive Transfer is a one-off setup cost for bringing your existing body of work into The Culo Village.',
      'Your monthly Blog Management is $900 AUD a month with a 3-month minimum.',
    ],
  },
  {
    n: '3',
    title: 'Your Village is set up',
    paras: [
      'You receive access to your own Culo Village dashboard, with your founder profile and imported library ready for your writer.',
    ],
  },
  {
    n: '4',
    title: 'Your writer starts publishing',
    paras: [
      'Every month, your designated writer works through the archive and turns 30 pieces into structured founder articles.',
      'The story stays yours.',
      'We give it somewhere useful to live.',
    ],
  },
  {
    n: '5',
    title: 'Watch the library grow',
    paras: [
      'Articles appear inside your dashboard as they are published.',
      'Review them, edit them or connect the links back to the rest of your online presence.',
      'Month after month, the scattered content you already made becomes a much bigger body of searchable founder work.',
    ],
  },
]

export function MarketingPublishingPage() {
  usePageMeta({
    title: 'Blog Management — your archive, published properly | Pretty Cool Marketing',
    description:
      'The valuable stuff is already in your archive. Pretty Cool Marketing brings your back catalogue into The Culo Village and a designated writer turns it into 30 structured founder articles a month. $900 AUD a month plus a one-off Archive Transfer.',
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
        title="We republish your body of work for AI discovery"
        description={
          <>
            <p className="mb-4">
              Years of your ideas, experience and stories are probably sitting across YouTube, podcasts,
              Instagram, old blogs and features other people have written about you.
            </p>
            <p className="mb-4">
              Pretty Cool Marketing brings that work into The Culo Village, then gives you a designated
              writer who turns it into structured founder articles every month.
            </p>
            <p className="mb-4">Not generic blogs written from scratch.</p>
            <p className="mb-4">
              Your existing ideas, stories and expertise, pulled out of the content you have already made
              and turned into a growing body of work that is easier for people, search engines and AI
              tools to understand.
            </p>
            <p className="mb-4">You keep running the business.</p>
            <p>We build the library.</p>
          </>
        }
        right={
          <div className="bg-[#EBF2F8] border border-[#CFE0EE] rounded-2xl p-8 shadow-lg text-center">
            <p className="font-body text-xs font-semibold text-charcoal uppercase tracking-widest mb-1">Blog Management</p>
            <p className="font-heading text-3xl font-bold text-charcoal">$900 AUD <span className="text-base font-normal text-muted">/ month</span></p>
            <p className="font-body text-sm text-muted mt-1 mb-5">
              Plus a one-off Archive Transfer based on the size of your existing content library.
            </p>
            <button
              onClick={() => setQuoteOpen(true)}
              className="block w-full text-center px-6 py-3.5 bg-primary text-white text-base font-semibold rounded-xl hover:bg-[#b05a35] transition-colors"
            >
              Get your quote →
            </button>
            <a href={CALENDLY} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">
              Or book a call →
            </a>
          </div>
        }
      />

      {/* What we take care of */}
      <section className="py-16 md:py-20 bg-surface border-b border-border">
        <InnerContainer className="max-w-3xl">
          <p className="font-body text-xs font-semibold text-charcoal uppercase tracking-widest mb-3">
            What we take care of
          </p>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-charcoal mb-10 leading-tight">
            Your archive becomes something people can actually find
          </h2>
          <div className="space-y-8">
            {CARE_BLOCKS.map(block => (
              <div key={block.title}>
                <h3 className="font-heading text-xl font-bold text-charcoal mb-2">{block.title}</h3>
                {block.paras.map((p, i) => (
                  <p key={i} className="font-body text-lg text-muted leading-relaxed mb-2">{p}</p>
                ))}
              </div>
            ))}
          </div>
        </InnerContainer>
      </section>

      {/* How it works */}
      <section className="py-16 md:py-20 bg-surface">
        <InnerContainer className="max-w-3xl">
          <p className="font-body text-xs font-semibold text-charcoal uppercase tracking-widest mb-3">
            How it works
          </p>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-charcoal mb-10 leading-tight">
            Give us the archive. We start building.
          </h2>
          <div className="space-y-4">
            {STEPS.map(step => (
              <div key={step.n} className="bg-[#EBF2F8] border border-[#CFE0EE] rounded-2xl p-7 flex gap-5">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="font-heading font-bold text-primary">{step.n}</span>
                </div>
                <div>
                  <h3 className="font-heading text-xl font-bold text-charcoal mb-1">{step.title}</h3>
                  {step.paras.map((p, i) => (
                    <p key={i} className="font-body text-muted leading-relaxed mb-1.5">{p}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </InnerContainer>
      </section>

      {/* Why it's worth it */}
      <section className="py-16 md:py-20 bg-[#EBF2F8] border-y border-[#CFE0EE]">
        <InnerContainer className="max-w-3xl">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-charcoal mb-8 leading-tight">
            Why publishing your archive here is worth it
          </h2>
          <div className="font-body text-lg text-charcoal/80 leading-relaxed space-y-4">
            <p>Every piece you publish here becomes a real web page of your own.</p>
            <p>
              Link it to your website or share it on LinkedIn, and it works as a genuine backlink
              pointing straight back to you, the kind of credibility a PR agency would normally charge
              you to build.
            </p>
            <p>
              A page-per-post archive like this is also exactly what AI search actually reads: structured
              articles, not a caption buried in someone else's feed, so it's how you get found there
              instead of staying invisible to it.
            </p>
            <p>
              Add the Village badge to your own site, and every one of those links leads straight back to
              you too.
            </p>
          </div>
        </InnerContainer>
      </section>

      {/* Final CTA — the DIY/Village note used to be its own separate
          section right before this one, repeating the same "join, publish
          it yourself" ground the hero and "What we take care of" already
          cover. Folded in here as a smaller aside instead, so there's one
          strong close on the blue background rather than two back to back. */}
      <section className="py-16 md:py-20 bg-[#EBF2F8] border-t border-[#CFE0EE]">
        <InnerContainer className="max-w-2xl text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-charcoal leading-tight mb-6">
            You already did the hard part.
          </h2>
          <div className="font-body text-lg text-charcoal/80 leading-relaxed mb-8 space-y-1">
            <p>You lived it.</p>
            <p>You learnt it.</p>
            <p>You filmed it.</p>
            <p>You talked about it.</p>
            <p>Now we turn it into a body of work people can actually find.</p>
          </div>

          <div className="bg-white border border-[#CFE0EE] rounded-2xl p-8 shadow-sm mb-8">
            <p className="font-body text-xs font-semibold text-charcoal uppercase tracking-widest mb-1">Blog Management</p>
            <p className="font-heading text-2xl font-bold text-charcoal">$900 AUD <span className="text-base font-normal text-muted">/ month</span></p>
            <p className="font-body text-sm text-muted mt-1 mb-6">Plus your one-off Archive Transfer.</p>
            <button
              onClick={() => setQuoteOpen(true)}
              className="w-full inline-flex justify-center px-8 py-4 bg-primary text-white text-base font-semibold rounded-xl hover:bg-[#b05a35] transition-colors"
            >
              Get your quote →
            </button>
            <p className="mt-4 font-body text-sm text-muted">
              Or <a href={CALENDLY} target="_blank" rel="noopener noreferrer" className="underline">book a 30-minute call</a>.
            </p>
            <p className="mt-6 font-body text-xs text-muted">
              Monthly management has a 3-month minimum. By starting a service with Pretty Cool Marketing, you
              agree to our <Link to="/terms" className="underline">Terms</Link>.
            </p>
          </div>

          <div className="border-t border-[#CFE0EE] pt-8">
            <p className="font-body text-sm font-semibold text-charcoal mb-2">Already happy to do the publishing yourself?</p>
            <p className="font-body text-sm text-charcoal/80 leading-relaxed mb-3 max-w-md mx-auto">
              You don't need Pretty Cool Marketing to be part of The Culo Village. Join for free, bring in
              your own content, and publish your first articles yourself, no charge. Blog Management is for
              when you'd rather someone else deal with the archive you know is worth something.
            </p>
            <a href="https://www.culovillage.com/join" className="text-primary text-sm font-semibold hover:underline">
              Join The Culo Village free →
            </a>
          </div>
        </InnerContainer>
      </section>
    </main>
  )
}
