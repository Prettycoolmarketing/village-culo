import { useState } from 'react'
import { Link } from 'react-router-dom'
import { usePageMeta } from '../../utils/usePageMeta'
import { InnerContainer } from '../../components/layout/PageContainer'
import { MarketingHero } from './MarketingHero'
import { MarketingCheckoutButton } from './MarketingCheckoutButton'
import { PublishingQuoteModal } from './PublishingQuoteModal'
import { PCM_SERVICES } from '../../config/pcmServices'

const CALENDLY = 'https://calendly.com/prettycoolmarketing_/30min'

const SMM_INCLUDES: [string, string][] = [
  ['30 pieces every month', 'Your footage is edited in Culo Creatives into a mix of content formats, rather than posting the same style over and over.'],
  ['Hooks and captions', 'Every piece comes with a curated hook and caption. Got an offer, price, launch or something specific you need mentioned? Tell us and we will work it in.'],
  ['Easy approvals in Canva', 'We send you a Canva edit link so you can see what is being created and request changes before anything is scheduled.'],
  ['Scheduling and distribution', 'Once approved, we schedule your content across your connected platforms using our publishing tools.'],
  ['Publishing into The Culo Village', 'Your content does not disappear after a few days in a feed. We also publish it into your Village so your growing body of work stays connected to you.'],
]

const CREATOR_INCLUDES: [string, string][] = [
  ['4 hours filming', 'A focused shoot with you or your team.'],
  ['Built around the PCM frameworks', 'We deliberately capture different kinds of footage so you are not left with 30 versions of the same reel.'],
  ['Footage backed up and organised', 'Everything is sorted after the shoot and prepared for editing.'],
  ['Edited in Culo Creatives', 'Your creator turns the footage into the month of content using the same system behind our Social Media Management service.'],
  ['Then we run the rest', 'Approvals, captions, hooks, scheduling, distribution and Village publishing are handled by the Pretty Cool Marketing team.'],
]

const TIMELINE: [string, string, string][] = [
  ['Day 1', 'Create', 'We film your content, or you send us the raw footage you already have.'],
  ['Days 2 to 3', 'Sort', 'Footage is backed up, organised and prepared for editing.'],
  ['Days 4 to 6', 'Create the content', 'We turn the footage into your monthly content inside Culo Creatives.'],
  ['Days 7 to 10', 'You approve it', 'You review everything through Canva and let us know what needs changing.'],
  ['Days 11 to 14', 'We schedule it', 'Approved content is scheduled across your connected platforms and prepared for publishing into The Culo Village.'],
]

function IncludeList({ items }: { items: [string, string][] }) {
  return (
    <div className="space-y-5">
      {items.map(([title, body]) => (
        <div key={title}>
          <p className="font-body text-charcoal font-semibold">{title}</p>
          <p className="font-body text-muted leading-relaxed mt-1">{body}</p>
        </div>
      ))}
    </div>
  )
}

export function MarketingSocialPage() {
  usePageMeta({
    title: 'Social media, run for you | Pretty Cool Marketing',
    description:
      'Pretty Cool Marketing turns your footage into 30 pieces of content a month, gets it approved, schedules it across your platforms and publishes it into The Culo Village. Send us your footage, or add a Content Creator and we make it with you.',
    keywords: [
      'social media management australia', 'done for you social media', 'content creator retainer',
      'founder content agency', 'Culo Creatives', 'social media scheduling', 'content shoot',
    ],
  })

  const [quote, setQuote] = useState<'creatives' | 'full' | null>(null)

  return (
    <main className="min-h-screen bg-surface">
      {quote && (
        <PublishingQuoteModal
          onClose={() => setQuote(null)}
          service={quote}
          serviceName={PCM_SERVICES[quote].name}
          monthlyPrice={PCM_SERVICES[quote].monthlyPrice}
        />
      )}
      <MarketingHero
        kicker="Pretty Cool Marketing"
        title="Your socials, captured, made and posted for you"
        description={
          <>
            <p className="mb-4">Your business depends on you.</p>
            <p className="mb-4">
              Pretty Cool Marketing turns your raw footage into a full month of content, then takes care
              of the approvals, captions, scheduling, distribution and publishing into The Culo Village.
            </p>
            <p>
              You can send us the footage you already have, or add a Content Creator and we will come and
              document with you. Think interviews, events, your team, your customers captured and ready
              to be seen.
            </p>
          </>
        }
        right={
          // No single "start" button here — which package fits depends on
          // whether you're sending your own footage or want us to film it
          // too, so the two real starting points (with their own Stripe
          // checkout buttons) live below at #smm and #creator, not here.
          <div className="bg-[#EBF2F8] border border-[#CFE0EE] rounded-2xl p-8 shadow-lg flex flex-col gap-4">
            <p className="font-body text-sm font-semibold text-charcoal">Choose your package below:</p>
            <a href="#smm" className="block">
              <p className="font-body text-xs font-semibold text-charcoal uppercase tracking-widest">Social Media Management</p>
              <p className="font-heading text-2xl font-bold text-charcoal">$3,000 AUD <span className="text-sm font-normal text-muted">/ month</span></p>
              <p className="font-body text-xs text-muted">You bring the footage.</p>
            </a>
            <div className="border-t border-border" />
            <a href="#creator" className="block">
              <p className="font-body text-xs font-semibold text-charcoal uppercase tracking-widest">+ Content Creator</p>
              <p className="font-heading text-2xl font-bold text-charcoal">$3,888 AUD <span className="text-sm font-normal text-muted">/ month</span></p>
              <p className="font-body text-xs text-muted">We make the footage with you.</p>
            </a>
            <a
              href={CALENDLY}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 text-center text-sm font-semibold text-primary hover:underline"
            >
              Or book a call first →
            </a>
          </div>
        }
      />

      {/* ── Choose how you want to work with us ─────────────────────────── */}
      <section className="py-16 md:py-20 bg-surface">
        <InnerContainer>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-charcoal mb-10 leading-tight">
            Choose how you want to work with us
          </h2>

          <div id="smm" className="scroll-mt-24 mb-16">
            <div className="mb-8">
              <p className="font-body text-xs font-semibold text-primary uppercase tracking-widest mb-2">Social Media Management</p>
              <p className="font-heading text-2xl font-bold text-charcoal mb-1">$3,000 AUD / month</p>
              <p className="font-body text-lg font-semibold text-charcoal mb-4">You bring the footage. We run the content.</p>
              <div className="font-body text-muted leading-relaxed space-y-3 max-w-2xl">
                <p>We turn your raw footage into 30 pieces of content every month using Culo Creatives,
                  then take care of the hooks, captions, approvals, scheduling and distribution.</p>
                <p>Your content is created across a mix of formats including Quick Rhythm, voiceover,
                  talking head and other formats that suit what you actually give us.</p>
                <p>Everything is scheduled across your connected social platforms and published into The
                  Culo Village, so the work you are putting into your socials is also building your longer
                  term founder presence.</p>
              </div>
            </div>
            <div className="bg-[#EBF2F8] border border-[#CFE0EE] rounded-2xl p-8 md:p-10 mb-6">
              <p className="font-body text-sm font-semibold text-charcoal uppercase tracking-widest mb-5">What we take care of</p>
              <IncludeList items={SMM_INCLUDES} />
            </div>
            <MarketingCheckoutButton offerId="tier2" label="Start Social Media Management →" className="max-w-sm" />
          </div>

          <div id="creator" className="scroll-mt-24">
            <p className="font-body text-lg font-semibold text-charcoal mb-2">Want us to make the footage too?</p>
            <div className="mb-8">
              <p className="font-body text-xs font-semibold text-primary uppercase tracking-widest mb-2">Social Media Management + Content Creator</p>
              <p className="font-heading text-2xl font-bold text-charcoal mb-1">$3,888 AUD / month</p>
              <p className="font-body text-lg font-semibold text-charcoal mb-4">We make the footage. Then we run the content.</p>
              <div className="font-body text-muted leading-relaxed space-y-3 max-w-2xl">
                <p>Everything in Social Media Management, plus your own Pretty Cool Marketing content day
                  each month.</p>
                <p>We spend 4 hours filming with you or your team, following the PCM content frameworks
                  so we leave with footage we actually know how to turn into a month of content. That
                  means B roll, talking heads, voiceovers, behind the scenes footage and the little
                  pieces that give us enough to work with once we get back into Culo Creatives.</p>
                <p>After the shoot, your creator backs up and organises the footage and spends the
                  following working day turning it into the content system for the month. Then our team
                  takes over approvals, scheduling, distribution and Village publishing.</p>
              </div>
            </div>
            <div className="bg-[#EBF2F8] border-2 border-primary rounded-2xl p-8 md:p-10 mb-6">
              <p className="font-body text-sm font-semibold text-charcoal uppercase tracking-widest mb-5">Your monthly content day</p>
              <IncludeList items={CREATOR_INCLUDES} />
            </div>
            <MarketingCheckoutButton offerId="tier3" label="Add a Content Creator →" className="max-w-sm" />
          </div>
        </InnerContainer>
      </section>

      {/* ── What happens after you join ────────────────────────────────── */}
      <section className="py-16 md:py-20 bg-surface border-y border-border">
        <InnerContainer className="max-w-3xl">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-charcoal mb-4 leading-tight">
            From raw footage to a month of content
          </h2>
          <p className="font-body text-muted leading-relaxed mb-8">
            We aim to have your first month of content edited, approved and scheduled within about two
            weeks of receiving everything we need from you. If you are on the Content Creator service,
            your shoot happens during that setup window.
          </p>
          <div className="border border-border rounded-2xl overflow-hidden">
            {TIMELINE.map(([when, label, body], i) => (
              <div key={when} className={`px-6 py-5 ${i % 2 ? 'bg-surface' : 'bg-background'}`}>
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <span className="font-body text-sm font-semibold text-primary w-24 shrink-0">{when}</span>
                  <span className="font-heading text-lg font-bold text-charcoal">{label}</span>
                </div>
                <p className="font-body text-muted leading-relaxed mt-1 sm:ml-[calc(6rem+0.75rem)]">{body}</p>
              </div>
            ))}
          </div>
          <p className="font-body text-xs text-muted mt-4">
            Timings are approximate and depend on footage, approvals and account access being supplied
            on time.
          </p>
        </InnerContainer>
      </section>

      {/* ── A few things worth knowing ─────────────────────────────────── */}
      <section className="py-16 md:py-20 bg-surface">
        <InnerContainer className="max-w-3xl">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-charcoal mb-8 leading-tight">
            A few things worth knowing
          </h2>
          <div className="space-y-6 font-body text-muted leading-relaxed">
            <p>
              <strong className="text-charcoal">We create it. You stay in control.</strong> You approve
              your content before we schedule it. Once your month of content has been approved and
              scheduled, your team remains responsible for day to day community management, including
              comments, messages and conversations with your audience, unless we have agreed otherwise.
            </p>
            <p>
              <strong className="text-charcoal">If a scheduled post does not go out.</strong> Platforms
              occasionally fail. If we identify a scheduling issue during our management process, we
              move the affected content to the next appropriate publishing opportunity. Once content
              has been handed over or changed directly inside your accounts, responsibility for those
              changes sits with the business.
            </p>
            <p>
              <strong className="text-charcoal">Do not need us to film?</strong> No problem. You can use
              Social Media Management without the Content Creator add on. Send us enough raw footage to
              build the month from, ranging from short B roll clips through to longer talking head and
              voiceover footage. You bring the footage. We do the rest.
            </p>
            <p>
              <strong className="text-charcoal">Three months to build the rhythm.</strong> All Pretty
              Cool Marketing monthly management services begin with a 3 month minimum partnership. That
              gives us enough time to learn your business, build the workflow, understand what works,
              and create something more useful than thirty random posts every month. After your first
              three months, your partnership continues according to the terms of your service.{' '}
              <Link to="/terms" className="text-primary underline">Read the Terms</Link>.
            </p>
          </div>
        </InnerContainer>
      </section>

      {/* ── Want your archive published too? ───────────────────────────── */}
      <section className="py-16 md:py-20 bg-surface border-t border-border">
        <InnerContainer className="max-w-3xl">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-charcoal mb-3 leading-tight">
            We can run your archive too.
          </h2>
          <p className="font-body text-lg text-muted mb-8">
            Add Blog Management and we handle both — your archive published as founder articles, your
            socials managed end to end. Just the one-off Archive Transfer, quoted from your archive size.
          </p>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-border p-7 flex flex-col">
              <p className="font-heading text-xl font-bold text-charcoal">Village Creatives</p>
              <p className="font-body text-muted text-sm mt-1 mb-2">Archive published + socials run.</p>
              <p className="font-heading text-lg font-bold text-charcoal mb-4">$3,900 AUD / month</p>
              <button onClick={() => setQuote('creatives')} className="mt-auto inline-flex w-full items-center justify-center px-7 py-3.5 bg-primary text-white text-base font-semibold rounded-xl hover:bg-[#b05a35] transition-colors">
                Get your quote →
              </button>
            </div>
            <div className="bg-white rounded-2xl border-2 border-primary p-7 flex flex-col">
              <p className="font-heading text-xl font-bold text-charcoal">Full Service</p>
              <p className="font-body text-muted text-sm mt-1 mb-2">Everything, plus a shoot every 4 weeks.</p>
              <p className="font-heading text-lg font-bold text-charcoal mb-4">$4,788 AUD / month</p>
              <button onClick={() => setQuote('full')} className="mt-auto inline-flex w-full items-center justify-center px-7 py-3.5 bg-primary text-white text-base font-semibold rounded-xl hover:bg-[#b05a35] transition-colors">
                Get your quote →
              </button>
            </div>
          </div>
        </InnerContainer>
      </section>

      {/* ── Final CTA ──────────────────────────────────────────────────── */}
      <section className="py-16 md:py-20 bg-[#EBF2F8] border-t border-[#CFE0EE]">
        <InnerContainer>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-charcoal mb-8 leading-tight text-center">
            Ready to stop managing your own content?
          </h2>
          <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div className="bg-surface rounded-2xl border border-border p-7 text-center flex flex-col">
              <p className="font-heading text-xl font-bold text-charcoal">Social Media Management</p>
              <p className="font-body text-muted text-sm mt-1 mb-2">You bring the footage.</p>
              <p className="font-heading text-lg font-bold text-charcoal mb-4">$3,000 AUD / month</p>
              <MarketingCheckoutButton offerId="tier2" label="Start Social Media Management →" className="mt-auto" />
            </div>
            <div className="bg-surface rounded-2xl border-2 border-primary p-7 text-center flex flex-col">
              <p className="font-heading text-xl font-bold text-charcoal">+ Content Creator</p>
              <p className="font-body text-muted text-sm mt-1 mb-2">We make the footage with you.</p>
              <p className="font-heading text-lg font-bold text-charcoal mb-4">$3,888 AUD / month</p>
              <MarketingCheckoutButton offerId="tier3" label="Start with a Content Creator →" className="mt-auto" />
            </div>
          </div>
          <p className="text-center mt-8 font-body text-sm text-muted">
            Want to talk it through first?{' '}
            <a href={CALENDLY} target="_blank" rel="noopener noreferrer" className="text-primary font-semibold underline">Book a 30-minute call</a>.
            {' '}All monthly services have a 3-month minimum.
          </p>
        </InnerContainer>
      </section>
    </main>
  )
}
