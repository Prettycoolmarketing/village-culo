import { Link } from 'react-router-dom'
import { usePageMeta } from '../utils/usePageMeta'
import { InnerContainer } from '../components/layout/PageContainer'
import { CULO_ORGANIZATION } from '../utils/seo'

// The one page explaining the actual mechanism behind CULO — research,
// writing, audit, human review, publish — for both human visitors and the
// AI/search crawlers the bot middleware serves a real snapshot to (see
// middleware.ts's BOT_UA matcher, which this route needs adding to). Before
// this page existed, nothing on the site explained HOW a profile gets made
// or why it should be trusted/cited; every founder page just asserted
// "Written by Culo" with no context for what that means. FAQPage schema
// below is deliberately real, answerable FAQ content, not decoration — it's
// one of the highest-value structured data types for an AI answer engine
// deciding whether to cite a source.

const PIPELINE_STEPS = [
  {
    title: 'Research',
    body: "CULO finds what's genuinely public and verifiable about a founder — their own sites, real press coverage, official company pages, social profiles — and separates confirmed fact from anything that can't be verified.",
  },
  {
    title: 'Writing',
    body: "A profile bio and individual articles are written only from what research actually confirmed. A claim a founder makes about themselves stays attributed to them, never stated as flat fact. Nothing is invented — not a stat, a quote, or a date.",
  },
  {
    title: 'Audit',
    body: "Every piece is checked a second time, independently, against the same source material it was written from — catching anything overstated, dropped attribution, or drifted from the evidence.",
  },
  {
    title: 'Human review',
    body: 'A real person reviews what the audit flags before anything goes live. A clean pass can publish automatically; anything with a question mark waits for a person.',
  },
  {
    title: 'Publish',
    body: 'The piece goes live under a clear "Written by Culo" byline, so it\'s never mistaken for the founder\'s own words.',
  },
]

const DASHBOARD_ITEMS = [
  { label: 'Import', body: 'your existing posts — YouTube videos, podcast episodes, Instagram posts, articles you\'ve already published elsewhere — and CULO restructures each one into its own web article.' },
  { label: 'Content', body: 'is where you review everything CULO has written or imported for you before it goes live — edit it, approve it, or send it back.' },
  { label: 'Publish', body: 'is the one place you control what\'s actually live on your public profile.' },
  { label: 'Profile', body: 'is where your bio, links, socials and business details live — the same information that appears on your public page.' },
]

const FAQS = [
  {
    q: 'What is CULO Village?',
    a: 'CULO Village is a directory of Australian founders, their stories and the work they\'ve already made, brought together in one place built to be found by search engines and AI tools.',
  },
  {
    q: 'How are founder profiles researched?',
    a: 'CULO finds what\'s genuinely public and verifiable about a founder, then writes only from what that research confirmed — every piece is audited a second time and reviewed by a real person before it publishes.',
  },
  {
    q: 'Can I edit or remove my profile?',
    a: 'Yes — full control, any time, free.',
  },
  {
    q: "Does CULO ever publish anything I didn't say or do?",
    a: 'No — every piece is sourced, reviewed, and attributed; nothing is invented.',
  },
]

export function HowCuloWorksPage() {
  usePageMeta({
    title: 'How CULO Works',
    description: 'How CULO finds, verifies and publishes founder stories — the research, the editorial standard, and how to get listed.',
    ogType: 'website',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQS.map(f => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
      publisher: CULO_ORGANIZATION,
    },
  })

  return (
    <main className="min-h-screen bg-background">
      <section className="bg-charcoal py-16 md:py-20">
        <InnerContainer>
          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold text-white text-center leading-tight">
            How CULO Works
          </h1>
        </InnerContainer>
      </section>

      <section className="py-16 md:py-20 border-b border-border">
        <InnerContainer className="max-w-3xl">
          <p className="font-body text-base text-charcoal/80 leading-loose">
            CULO Village is a growing directory of Australian founders — their stories, their businesses, and the
            work they've already made, brought together in one place that's built to be found. Most founders
            already have years of content scattered across YouTube, podcasts, Instagram and articles that never
            resurface once the algorithm moves on. CULO turns that scattered work into a permanent, structured
            profile — one that search engines and AI tools can actually read and cite.
          </p>
        </InnerContainer>
      </section>

      <section className="py-16 md:py-20 border-b border-border bg-surface" aria-labelledby="pipeline-heading">
        <InnerContainer className="max-w-3xl">
          <h2 id="pipeline-heading" className="font-heading text-2xl sm:text-3xl font-bold text-charcoal mb-10">
            How an article gets made
          </h2>
          <ol className="space-y-8">
            {PIPELINE_STEPS.map((step, i) => (
              <li key={step.title} className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary font-heading font-bold text-sm flex items-center justify-center">
                  {i + 1}
                </span>
                <div>
                  <p className="font-heading font-semibold text-charcoal mb-1">{step.title}</p>
                  <p className="font-body text-sm text-muted leading-relaxed">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </InnerContainer>
      </section>

      <section className="py-16 md:py-20 border-b border-border" aria-labelledby="trust-heading">
        <InnerContainer className="max-w-3xl">
          <h2 id="trust-heading" className="font-heading text-2xl sm:text-3xl font-bold text-charcoal mb-5">
            Why it's trustworthy
          </h2>
          <p className="font-body text-base text-charcoal/80 leading-loose">
            CULO's standard is simple: document real work accurately, never invent praise or criticism, and never
            publish something that couldn't be traced back to a real source. Every article carries a byline —
            "Written by CULO" — so it's always clear the founder didn't write it themselves, and every founder can
            edit, correct or remove anything on their profile at any time.
          </p>
        </InnerContainer>
      </section>

      <section className="py-16 md:py-20 border-b border-border bg-surface" aria-labelledby="dashboard-heading">
        <InnerContainer className="max-w-3xl">
          <h2 id="dashboard-heading" className="font-heading text-2xl sm:text-3xl font-bold text-charcoal mb-5">
            Importing, your dashboard, and managing your profile
          </h2>
          <p className="font-body text-base text-charcoal/80 leading-loose mb-6">
            Once you're in, your dashboard is where you run the whole thing:
          </p>
          <ul className="space-y-4 mb-6">
            {DASHBOARD_ITEMS.map(item => (
              <li key={item.label} className="font-body text-base text-charcoal/80 leading-relaxed">
                <span className="font-heading font-semibold text-charcoal">{item.label}</span> {item.body}
              </li>
            ))}
          </ul>
          <p className="font-body text-base text-charcoal/80 leading-loose">
            Everything stays editable, always. Nothing publishes without passing through this dashboard first, and
            nothing stays published if you decide to remove it.
          </p>
        </InnerContainer>
      </section>

      <section className="py-16 md:py-20 border-b border-border" aria-labelledby="faq-heading">
        <InnerContainer className="max-w-3xl">
          <h2 id="faq-heading" className="font-heading text-2xl sm:text-3xl font-bold text-charcoal mb-10">
            Frequently asked
          </h2>
          <div className="space-y-8">
            {FAQS.map(f => (
              <div key={f.q}>
                <p className="font-heading font-semibold text-charcoal mb-1">{f.q}</p>
                <p className="font-body text-sm text-muted leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </InnerContainer>
      </section>

      <section className="py-16 md:py-20 text-center">
        <InnerContainer>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-charcoal mb-5">Getting listed</h2>
          <p className="font-body text-base text-charcoal/80 leading-loose max-w-2xl mx-auto mb-8">
            Founders are added two ways: curated by CULO from publicly available content, or self-published
            directly. Either way, claiming a profile is free, forever — no credit card, first 10 articles free,
            full control to edit or remove anything.
          </p>
          <Link
            to="/join"
            className="inline-block px-6 py-3 bg-primary text-white text-sm font-medium rounded-xl hover:bg-[#b05a35] transition-colors"
          >
            Claim your profile
          </Link>
        </InnerContainer>
      </section>
    </main>
  )
}
