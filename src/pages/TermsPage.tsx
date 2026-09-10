import { useState } from 'react'
import { usePageMeta } from '../utils/usePageMeta'
import { InnerContainer } from '../components/layout/PageContainer'

// Terms & Conditions — three sets, one page, tabbed. Draft for legal
// review: the substance reflects how the products actually work today, but
// have a lawyer check it before relying on it.

type TabId = 'village' | 'creatives' | 'services'

const TABS: { id: TabId; label: string }[] = [
  { id: 'village', label: 'The Culo Village' },
  { id: 'creatives', label: 'Culo Creatives' },
  { id: 'services', label: 'Pretty Cool Marketing' },
]

const LAST_UPDATED = '10 September 2026'

function Clause({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h3 className="font-heading text-lg font-bold text-charcoal mb-2">{n}. {title}</h3>
      <div className="font-body text-[15px] text-muted leading-relaxed space-y-3">{children}</div>
    </div>
  )
}

export function TermsPage() {
  const [tab, setTab] = useState<TabId>('village')

  usePageMeta({
    title: 'Terms & Conditions',
    description: 'Terms for The Culo Village, Culo Creatives in Canva, and Pretty Cool Marketing services.',
  })

  return (
    <main className="min-h-screen bg-background">
      <section className="bg-charcoal py-24 md:py-36">
        <InnerContainer>
          <h1 className="font-heading text-5xl sm:text-6xl md:text-7xl font-bold text-white leading-tight mb-4">
            Terms &amp; Conditions
          </h1>
          <p className="font-body text-white/60 text-base">Last updated {LAST_UPDATED} · Governed by the laws of Queensland, Australia</p>
        </InnerContainer>
      </section>

      <section className="py-10 md:py-14">
        <InnerContainer className="max-w-3xl">
          <div className="flex gap-2 flex-wrap mb-10 border-b border-border pb-3">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  tab === t.id ? 'bg-primary text-white' : 'text-muted hover:bg-border/60 hover:text-charcoal'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'village' && (
            <div>
              <p className="font-body text-[15px] text-charcoal leading-relaxed mb-8">
                These terms cover your use of The Culo Village at culovillage.com — your founder profile,
                content library, imported sources and published articles.
              </p>

              <Clause n="1" title="Membership">
                <p>Joining and keeping a Culo Village profile is free. Your membership includes your founder
                  profile, connecting and importing your content sources, your content library, and your
                  first <strong className="text-charcoal">10 imported</strong> and{' '}
                  <strong className="text-charcoal">10 newly created</strong> published articles at no charge.</p>
              </Clause>

              <Clause n="2" title="Publishing entitlements">
                <p>Beyond the free articles, publishing is metered by a one-off purchase:</p>
                <p><strong className="text-charcoal">Archive Unlock</strong> raises how many of your existing
                  imported pieces you can publish, priced by the size of your archive. <strong className="text-charcoal">Publishing
                  Packs</strong> add flexible publication credits for new work. Purchased credits do not expire.
                  Free entitlements are always used before paid credits.</p>
                <p>Archive Unlock and Publishing Packs are one-time digital purchases and are{' '}
                  <strong className="text-charcoal">non-refundable</strong> once applied to your account.</p>
              </Clause>

              <Clause n="3" title="Your content and licence">
                <p>You keep ownership of everything you publish. By publishing to the Village you grant CULO a
                  non-exclusive licence to host, structure, index, display and distribute that content on the
                  Village and to search engines and AI crawlers, for as long as it remains published.</p>
                <p>You are responsible for having the rights to everything you import or publish, and for its
                  accuracy. Don't publish anything misleading, unlawful, or that infringes someone else's
                  rights. CULO may remove or unpublish content that breaches these terms.</p>
              </Clause>

              <Clause n="4" title="Account and data">
                <p>You can delete your account at any time, which removes your profile and login. Published
                  articles you choose to keep public stay indexed until removed. We store imported and uploaded
                  media to process and display it.</p>
              </Clause>

              <Clause n="5" title="Service provided as is">
                <p>The Village is provided "as is". We don't guarantee uninterrupted availability, and we are
                  not liable for search engine or AI platform behaviour, algorithm changes, or lost visibility
                  or revenue. Our total liability to you for the Village is limited to any amounts you have paid
                  us in the previous 12 months.</p>
              </Clause>
            </div>
          )}

          {tab === 'creatives' && (
            <div>
              <p className="font-body text-[15px] text-charcoal leading-relaxed mb-8">
                Culo Creatives is the CULO editing app inside Canva. It is a separate, optional subscription
                from Culo Village membership — you can use either without the other.
              </p>

              <Clause n="1" title="Pricing">
                <p>Culo Creatives is free to use until <strong className="text-charcoal">1 January 2027</strong>.
                  Founders who start before that date and add payment details keep the founding rate of{' '}
                  <strong className="text-charcoal">$19 AUD/month</strong> for as long as their subscription
                  stays continuously active. If a subscription is cancelled and restarted later, it resumes at
                  the standard price then current.</p>
                <p>From 1 January 2027 the standard price is <strong className="text-charcoal">$25 AUD/month</strong>{' '}
                  with a 14-day free trial. You are billed monthly and can cancel any time; cancellation takes
                  effect at the end of the current billing period, and we don't refund part-months.</p>
              </Clause>

              <Clause n="2" title="AI-assisted content">
                <p>Culo Creatives generates drafts — blogs, carousels, captions, reels and voiceovers — from
                  your footage, notes and briefs. These are a starting point, not a finished product.{' '}
                  <strong className="text-charcoal">You are responsible for reviewing, editing and approving all
                  content before it is published or posted anywhere</strong>, including its accuracy, claims and
                  legality.</p>
              </Clause>

              <Clause n="3" title="Your media">
                <p>Media you upload stays yours. We store it securely to produce your content and for reel
                  rendering. It is not sold or shared. You must be 18 or older, or have a parent or guardian's
                  consent.</p>
              </Clause>

              <Clause n="4" title="Acceptable use and availability">
                <p>Don't use Culo Creatives to create misleading, harmful or unlawful content. The app is
                  provided "as is" with no guarantee of uptime or error-free operation. Our total liability for
                  Culo Creatives is limited to the fees you have paid in the previous 12 months.</p>
              </Clause>
            </div>
          )}

          {tab === 'services' && (
            <div>
              <p className="font-body text-[15px] text-charcoal leading-relaxed mb-8">
                Pretty Cool Marketing (PCM) is the done-for-you service arm of the Culo Village. These terms
                apply when you buy a PCM service — Blog Management, Social Media Management, Content Creator, a
                Full Service package, or an Archive Transfer.
              </p>

              <Clause n="1" title="Payment, minimum term and refunds">
                <p>All PCM services are <strong className="text-charcoal">non-refundable</strong>, including
                  deposits and payments made under a payment plan. Once work has commenced — strategy,
                  onboarding, planning or production — no refund is available.</p>
                <p>All monthly services (Blog Management, Social Media Management, Content Creator, Full Service)
                  have a <strong className="text-charcoal">minimum term of 3 months</strong>. After the minimum
                  term they continue month to month until cancelled with notice.</p>
                <p>The <strong className="text-charcoal">Archive Transfer</strong> is a one-off setup fee for PCM
                  to bring your existing body of work into the Culo Village. It is separate from any monthly
                  service and is quoted from the size of your archive.</p>
              </Clause>

              <Clause n="2" title="What each service covers">
                <p><strong className="text-charcoal">Blog Management ($900/month)</strong> — we rewrite and
                  publish up to 30 blogs per month <strong className="text-charcoal">drawn from your existing
                  archive</strong>, with SEO and human review. It does not include creating new content.</p>
                <p><strong className="text-charcoal">Social Media Management ($3,000/month)</strong> — you supply
                  footage; we edit approximately 30 new pieces per month in Culo Creatives, and schedule and
                  publish them across your social platforms and into the Culo Village.</p>
                <p><strong className="text-charcoal">Content Creator (+$888/month, add-on to Social Media
                  Management)</strong> — we run one content shoot every four weeks (a half-day session plus a
                  backup/organisation day), edited in line with your Social Media Management. Priced for local
                  shoots; travel is quoted separately.</p>
                <p><strong className="text-charcoal">Full Service ($4,788/month)</strong> — all of the above
                  combined.</p>
              </Clause>

              <Clause n="3" title="Your responsibilities">
                <p>You must complete onboarding, provide branding materials, supply footage and content on
                  time, and give timely approvals. PCM is not liable for delays caused by late responses or
                  missing materials.</p>
              </Clause>

              <Clause n="4" title="Approvals and changes">
                <p>Content is approved through a Canva edit link. Hooks and captions can be changed at your
                  request before scheduling, including adding offers or prices. Once captions are approved and a
                  post is scheduled, we make no further changes unless a post fails to publish.</p>
                <p>Once scheduling has commenced, delayed or withheld approvals may cause missed posting days.
                  Missed content due to approval delays is not recreated, carried over or rescheduled.</p>
                <p>If you don't want to shoot in a given cycle, you may instead provide 30 days' worth of raw
                  footage — 10-second B-rolls through to 1-minute talking heads — for us to edit.</p>
              </Clause>

              <Clause n="5" title="Ceasing a partnership">
                <p>You may cease a partnership at any time after the minimum term. If you do, content from
                  shoots or editing that you have not approved may not be used. Between shoots, you manage your
                  own community engagement.</p>
              </Clause>

              <Clause n="6" title="Content rights">
                <p>You receive full commercial usage rights to the edited, delivered content. Raw footage
                  remains PCM property unless otherwise agreed in writing. PCM may use selected samples of
                  delivered work for portfolio and promotional purposes.</p>
              </Clause>

              <Clause n="7" title="Limitation of liability">
                <p>PCM is not liable for platform outages, algorithm changes, lost revenue, your delays, or
                  events outside our control. Our total liability for any service will not exceed the amount you
                  have paid for that specific service.</p>
              </Clause>
            </div>
          )}

          <p className="mt-12 pt-6 border-t border-border font-body text-sm text-muted">
            Questions? Email{' '}
            <a href="mailto:support@prettycoolmarketing.com" className="text-primary font-medium hover:underline">
              support@prettycoolmarketing.com
            </a>
            .
          </p>
        </InnerContainer>
      </section>
    </main>
  )
}
