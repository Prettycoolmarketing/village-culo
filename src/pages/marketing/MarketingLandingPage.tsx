import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePageMeta } from '../../utils/usePageMeta'
import { InnerContainer } from '../../components/layout/PageContainer'
import { MarketingHero } from './MarketingHero'
import { MarketingLeadModal, hasCapturedLead } from './MarketingLeadModal'
import { PCM_SUPPORT_EMAIL } from '../../config/pcmPaymentLinks'

type Dest = { label: string; source: string; to: string }

const PUBLISHING: Dest = { label: 'Publishing Service', source: 'marketing-publishing', to: '/marketing/publishing' }
const SOCIAL: Dest = { label: 'Social Media Partnership', source: 'marketing-social', to: '/marketing/social' }

const WHO_LIST = ['Your ideas.', 'Your experience.', 'Your business.', 'Your authority.']

const PUBLISHING_BODY = [
  'We go through the content you have already published across YouTube, podcasts, Instagram and your website and turn each piece into a structured Village article.',
  'Each article is built around the real idea, story or lesson inside the original content and connected back to your founder profile.',
  'You walk away with a growing body of searchable work that positions you around the things you actually know.',
  'We also give you the links to your founder profile and published articles so you can connect them back to your website, socials and existing content.',
]

const SOCIAL_BODY = [
  'This is for founders who want to keep showing up without having to manage the whole content machine themselves.',
  'We create up to 30 pieces of content each month using CULO Creatives across formats like Quick Rhythm, voiceover, talking head, carousel and founder story content.',
  'We handle hooks, captions, editing, scheduling and publishing across your social platforms and into CULO Village.',
  'An optional filming tier includes a half day content shoot every four weeks using Pretty Cool Marketing filming frameworks, with the footage turned around into content for the month ahead.',
]

export function MarketingLandingPage() {
  const navigate = useNavigate()
  const [dest, setDest] = useState<Dest | null>(null)

  usePageMeta({
    title: 'Done for you inside the Village — Pretty Cool Marketing',
    description:
      'We take the videos, podcasts, blogs, website pages and Instagram posts you already have, turn them into structured founder content, and publish them into CULO Village so your work is easier to find through search and AI. Or we run your social content end to end.',
    keywords: [
      'Pretty Cool Marketing', 'done for you services', 'founder content', 'content republishing',
      'CULO Village', 'AI search', 'social media partnership', 'founder library',
    ],
  })

  /** Open the lead form, or skip straight through if this browser already gave details. */
  function go(d: Dest) {
    if (hasCapturedLead()) navigate(d.to)
    else setDest(d)
  }

  return (
    <main className="min-h-screen bg-surface">
      <MarketingHero
        kicker="Pretty Cool Marketing"
        title="Done for you inside the Village"
        description={
          <>
            <p className="mb-4">You have probably already created the content.</p>
            <p className="mb-4">
              We take the videos, podcasts, blogs, website pages and Instagram posts you already have,
              turn them into structured founder content, and publish them into CULO Village so your
              work is easier to find through search and AI.
            </p>
            <p>Or, if you want the whole thing handled, we run your social content end to end.</p>
          </>
        }
        right={
          <div className="bg-[#EBF2F8] border border-[#CFE0EE] rounded-2xl p-8 shadow-lg flex flex-col gap-3">
            <p className="font-heading text-lg font-bold text-charcoal mb-1">Two ways to work with us</p>
            <button
              onClick={() => go(PUBLISHING)}
              className="px-5 py-3 bg-primary text-white text-sm font-semibold rounded-xl text-center hover:bg-[#b05a35] transition-colors"
            >
              Publishing Service
            </button>
            <button
              onClick={() => go(SOCIAL)}
              className="px-5 py-3 border border-border text-charcoal text-sm font-semibold rounded-xl text-center hover:border-primary transition-colors"
            >
              Social Media Partnership
            </button>
          </div>
        }
      />

      {/* ── Who this is for ───────────────────────────────────────────────── */}
      <section className="py-16 md:py-20 bg-surface border-b border-border">
        <InnerContainer className="max-w-3xl">
          <p className="font-body text-xs font-semibold text-charcoal uppercase tracking-widest mb-3">
            Who this is for
          </p>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-charcoal mb-6 leading-tight">
            Founders who have already said the valuable things
          </h2>
          <p className="font-body text-lg text-muted leading-relaxed mb-4">
            Your best thinking is often buried in old podcast episodes, captions, talking head videos,
            interviews and website pages.
          </p>
          <p className="font-body text-lg text-muted leading-relaxed mb-8">
            Pretty Cool Marketing pulls that work back out, gives it structure and republishes it
            inside CULO Village so it starts building a clear body of work around you.
          </p>
          <ul className="space-y-2">
            {WHO_LIST.map(item => (
              <li key={item} className="flex gap-3 font-body text-lg text-charcoal leading-relaxed">
                <span className="text-primary font-bold shrink-0">—</span>
                {item}
              </li>
            ))}
          </ul>
          <p className="font-body text-lg text-charcoal leading-relaxed mt-6 font-semibold">
            All connected in one place.
          </p>
        </InnerContainer>
      </section>

      {/* ── The two services ─────────────────────────────────────────────── */}
      <section className="py-16 md:py-20 bg-surface">
        <InnerContainer>
          <div className="grid md:grid-cols-2 gap-8">
            <OfferCard
              kicker="Publishing Service"
              title="Turn your back catalogue into a founder library"
              paragraphs={PUBLISHING_BODY}
              cta="See the Publishing Service"
              onClick={() => go(PUBLISHING)}
            />
            <OfferCard
              kicker="Social Media Partnership"
              title="We run the content with you"
              paragraphs={SOCIAL_BODY}
              cta="See the Social Media Partnerships"
              onClick={() => go(SOCIAL)}
            />
          </div>
        </InnerContainer>
      </section>

      {/* ── Ready to start — blue section, orange buttons ────────────────── */}
      <section className="py-16 md:py-20 bg-[#EBF2F8] border-t border-[#CFE0EE]">
        <InnerContainer>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-charcoal leading-tight">
                Ready to start?
              </h2>
              <p className="mt-4 font-body text-lg text-charcoal/80 leading-relaxed">
                Choose the service that fits what you need and we will show you the pricing.
              </p>
              <p className="mt-2 font-body text-lg text-charcoal/80 leading-relaxed">
                Or email us at{' '}
                <a href={`mailto:${PCM_SUPPORT_EMAIL}`} className="text-charcoal font-semibold underline">
                  {PCM_SUPPORT_EMAIL}
                </a>
              </p>
            </div>
            <div className="md:justify-self-end w-full md:max-w-xs flex flex-col gap-3">
              <button
                onClick={() => go(PUBLISHING)}
                className="px-6 py-3 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-[#b05a35] transition-colors"
              >
                Publishing Service
              </button>
              <button
                onClick={() => go(SOCIAL)}
                className="px-6 py-3 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-[#b05a35] transition-colors"
              >
                Social Media Partnership
              </button>
            </div>
          </div>
        </InnerContainer>
      </section>

      {/* ── DIY note — big dark box over the blue, at the very bottom ─────── */}
      <section className="pb-16 md:pb-24 bg-[#EBF2F8]">
        <InnerContainer>
          <div className="bg-charcoal rounded-3xl px-8 py-14 md:px-16 md:py-20 text-center">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-4">
              Want to do it yourself?
            </h2>
            <p className="font-body text-lg text-white/80 leading-relaxed mb-4 max-w-2xl mx-auto">
              You can build and publish your own founder library directly inside CULO Village.
            </p>
            <p className="font-body text-lg mb-4">
              <a href="https://www.culovillage.com" className="text-white font-semibold underline hover:text-primary">
                Learn about CULO Village →
              </a>
            </p>
            <p className="font-body text-lg text-white/60 leading-relaxed">
              Pretty Cool Marketing is simply the done for you version.
            </p>
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
  kicker, title, paragraphs, cta, onClick,
}: {
  kicker: string; title: string; paragraphs: string[]; cta: string; onClick: () => void
}) {
  return (
    <div className="bg-[#EBF2F8] border border-[#CFE0EE] rounded-2xl p-10 flex flex-col shadow-card">
      <p className="font-body text-xs font-semibold text-charcoal uppercase tracking-widest mb-3">{kicker}</p>
      <h3 className="font-heading text-2xl font-bold text-charcoal mb-4 leading-tight">{title}</h3>
      <div className="font-body text-muted leading-relaxed flex-1 mb-6 space-y-3">
        {paragraphs.map((p, i) => <p key={i}>{p}</p>)}
      </div>
      <button
        onClick={onClick}
        className="inline-flex justify-center px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-[#b05a35] transition-colors"
      >
        {cta}
      </button>
    </div>
  )
}
