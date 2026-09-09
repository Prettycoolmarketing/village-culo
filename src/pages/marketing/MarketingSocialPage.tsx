import { Link } from 'react-router-dom'
import { usePageMeta } from '../../utils/usePageMeta'
import { InnerContainer } from '../../components/layout/PageContainer'
import { MarketingHero } from './MarketingHero'
import { MarketingCheckoutButton } from './MarketingCheckoutButton'
import { PCM_SUPPORT_EMAIL } from '../../config/pcmPaymentLinks'

const TIER2_POINTS = [
  '30 posts a month, edited in Culo Creatives in a mix of Quick Rhythm, voice over and talking head.',
  'Scheduled to all platforms and into the Village, with curated captions and hooks on each one.',
  'Approval is done through a Canva edit link. Hooks and captions can be altered directly at your request — including adding in any special offers, prices or details into the caption.',
  'Scheduling is done in Content 360 or Meta Business Suite. Once scheduled, changes are made by the business.',
  'If a post fails, it is up to you to manage it and contact PCM with any questions.',
  'If a day is missed due to computer error, that post is scheduled for the next day.',
  'Scheduling time is 6pm daily. Some posts may auto-post to your Instagram stories.',
]

const TIER3_POINTS = [
  'Everything in Tier 2, plus a half-day shoot every 4 weeks — with you or your team.',
  'Filmed in the PCM frameworks: B-roll, talking heads and voice overs.',
  'Edited in line with Tier 2 and scheduled the same way.',
  'Content is live 2 weeks after joining and transferring all raw footage. Shoots are filmed within that 2-week window.',
  'Shoots run every 4 weeks so content stays edited, scheduled and live within the following 2 weeks.',
  'If you don’t want to shoot, you must provide 30 days’ worth of raw footage to be edited — shot as 10-second B-rolls through to 1-minute talking heads.',
]

const TIMELINE = [
  ['Day 1', 'Shoot day — filming'],
  ['Days 2–3', 'Back up all footage'],
  ['Days 4–6', 'Editing'],
  ['Days 7–10', 'Approvals'],
  ['Days 11–14', 'Scheduling'],
]

export function MarketingSocialPage() {
  usePageMeta({
    title: 'Social media content — Tier 2 & Tier 3 | Pretty Cool Marketing',
    description:
      'Tier 2: 30 posts a month edited in Culo Creatives and scheduled across every platform for $3,000/mo. Tier 3: adds a half-day shoot every 4 weeks in the PCM frameworks for $3,888 every 4 weeks.',
    keywords: [
      'social media content agency', 'content editing and distribution', 'content creator retainer',
      'done for you social media', 'talking head reels', 'voice over reels', 'Quick Rhythm reels',
      'Meta Business Suite scheduling', 'Content 360',
    ],
  })

  return (
    <main className="min-h-screen bg-pcm-sand">
      <MarketingHero
        kicker="Offer two · monthly partnership"
        title="Social media content, edited and distributed for you."
        description="Two tiers. Tier 2 edits and schedules 30 posts a month across every platform and into the Village. Tier 3 adds a half-day shoot every 4 weeks in the PCM frameworks, on a fast turnaround built on the app and editing process."
        right={
          <div className="bg-pcm-sand rounded-2xl p-7 shadow-lg flex flex-col gap-4">
            <a href="#tier-2" className="block">
              <p className="font-body text-xs font-semibold text-pcm-orange uppercase tracking-widest">Tier 2</p>
              <p className="font-heading text-2xl font-bold text-pcm-ink">$3,000 AUD <span className="text-sm font-normal text-pcm-muted">/ month</span></p>
            </a>
            <div className="border-t border-pcm-linen" />
            <a href="#tier-3" className="block">
              <p className="font-body text-xs font-semibold text-pcm-orange uppercase tracking-widest">Tier 3</p>
              <p className="font-heading text-2xl font-bold text-pcm-ink">$3,888 AUD <span className="text-sm font-normal text-pcm-muted">/ 4 weeks</span></p>
            </a>
          </div>
        }
      />

      {/* Tiers */}
      <section className="py-16 md:py-20">
        <InnerContainer>
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Tier 2 */}
            <div id="tier-2" className="bg-white border border-pcm-linen rounded-2xl p-8 shadow-card flex flex-col scroll-mt-24">
              <p className="font-body text-xs font-semibold text-pcm-orange uppercase tracking-widest mb-2">Tier 2</p>
              <h2 className="font-heading text-2xl font-bold text-pcm-ink mb-2">Content Editing &amp; Distribution</h2>
              <p className="font-body text-pcm-ink mb-6">
                <span className="text-3xl font-bold">$3,000 AUD</span>{' '}
                <span className="text-pcm-muted text-sm">per month</span>
              </p>
              <ul className="space-y-3 flex-1 mb-6">
                {TIER2_POINTS.map(p => (
                  <li key={p} className="flex gap-3 font-body text-pcm-muted leading-relaxed">
                    <span className="text-pcm-orange font-bold shrink-0">—</span>{p}
                  </li>
                ))}
              </ul>
              <MarketingCheckoutButton offerId="tier2" />
            </div>

            {/* Tier 3 */}
            <div id="tier-3" className="bg-white border-2 border-pcm-orange rounded-2xl p-8 shadow-card flex flex-col scroll-mt-24">
              <p className="font-body text-xs font-semibold text-pcm-orange uppercase tracking-widest mb-2">Tier 3</p>
              <h2 className="font-heading text-2xl font-bold text-pcm-ink mb-2">Content Creator</h2>
              <p className="font-body text-pcm-ink mb-6">
                <span className="text-3xl font-bold">$3,888 AUD</span>{' '}
                <span className="text-pcm-muted text-sm">every 4 weeks</span>
              </p>
              <ul className="space-y-3 flex-1 mb-6">
                {TIER3_POINTS.map(p => (
                  <li key={p} className="flex gap-3 font-body text-pcm-muted leading-relaxed">
                    <span className="text-pcm-orange font-bold shrink-0">—</span>{p}
                  </li>
                ))}
              </ul>
              <MarketingCheckoutButton offerId="tier3" />
            </div>
          </div>
        </InnerContainer>
      </section>

      {/* Turnaround */}
      <section className="py-16 md:py-20 bg-pcm-cream border-y border-pcm-linen">
        <InnerContainer className="max-w-3xl">
          <p className="font-body text-xs font-semibold text-pcm-orange uppercase tracking-widest mb-3">
            The turnaround
          </p>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-pcm-ink mb-4 leading-tight">
            From shoot day to scheduled in about two weeks.
          </h2>
          <p className="font-body text-pcm-muted leading-relaxed mb-8">
            Shoot days take 1 day to film, 2 days to back up and 3 days to edit — 6 days. Then roughly
            4 days for approvals, and scheduling takes about 4 days. Every 4 weeks, so content is
            scheduled, edited and live within the next 2 weeks. These are approximate.
          </p>
          <div className="border border-pcm-linen rounded-2xl overflow-hidden">
            {TIMELINE.map(([when, what], i) => (
              <div key={when} className={`flex gap-4 px-5 py-4 ${i % 2 ? 'bg-pcm-sand' : 'bg-white'}`}>
                <span className="font-body text-sm font-semibold text-pcm-orange w-24 shrink-0">{when}</span>
                <span className="font-body text-pcm-ink">{what}</span>
              </div>
            ))}
          </div>
        </InnerContainer>
      </section>

      {/* Terms */}
      <section className="py-16 md:py-20">
        <InnerContainer className="max-w-3xl">
          <p className="font-body text-xs font-semibold text-pcm-orange uppercase tracking-widest mb-3">
            How the partnership works
          </p>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-pcm-ink mb-8 leading-tight">
            The details, up front.
          </h2>
          <div className="space-y-6 font-body text-pcm-muted leading-relaxed">
            <p><strong className="text-pcm-ink">Ceasing the partnership.</strong> Clients can cease the partnership at any time. If you do, no content from those shoots or that editing may be used — if you don't like the content that's been processed, it isn't yours to run.</p>
            <p><strong className="text-pcm-ink">Between shoots.</strong> Once scheduling is done, clients manage their own community engagement until the next shoot.</p>
            <p><strong className="text-pcm-ink">Failed posts and missed days.</strong> If a post fails, it's up to you to manage it and contact PCM with any questions. If a day is missed due to computer error, that post is scheduled for the next day.</p>
            <p><strong className="text-pcm-ink">No shoot?</strong> Provide 30 days' worth of raw footage instead — 10-second B-rolls through to 1-minute talking heads — and we edit that in line with Tier 2.</p>
          </div>
        </InnerContainer>
      </section>

      <section className="py-16 md:py-20 text-center bg-pcm-cream border-t border-pcm-linen">
        <InnerContainer className="max-w-2xl">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-pcm-ink mb-6 leading-tight">
            Start a partnership
          </h2>
          <p className="font-body text-pcm-muted mb-8">
            After payment you'll get instructions to email {PCM_SUPPORT_EMAIL} your raw footage and
            drive links.{' '}
            <Link to="/marketing/start?offer=tier2" className="text-pcm-orange hover:underline">
              Preview the instructions →
            </Link>
          </p>
          <div className="grid sm:grid-cols-2 gap-4 max-w-lg mx-auto">
            <MarketingCheckoutButton offerId="tier2" />
            <MarketingCheckoutButton offerId="tier3" />
          </div>
        </InnerContainer>
      </section>
    </main>
  )
}
