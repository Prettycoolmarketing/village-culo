import { Link } from 'react-router-dom'
import { usePageMeta } from '../utils/usePageMeta'
import { normalizeUrl } from '../utils/url'
import { InnerContainer } from '../components/layout/PageContainer'
import { getFounderBySlug } from '../services/founders'
import { getBusinesses } from '../services/businesses'
import { getStories } from '../services/stories'
import { importedContentService } from '../services/importedContent'

// The one link handed to a podcast booker, journalist or conference
// organiser — not a funnel to click through, one page that proves who
// Shakas is by pointing straight at the real, live, operating businesses
// and the real body of work behind them. Deliberately built from live data
// (business links, story/import counts) rather than static copy, so it
// never drifts out of date the way a one-off marketing page would.
export function SpeakerPage() {
  const founder = getFounderBySlug('shakas-designer')
  const businesses = founder ? getBusinesses({ founderId: founder.id }) : []
  const publishedStories = getStories({ publicOnly: true })
  const totalImports = importedContentService.getAll().length

  const sameAs = [
    founder?.linkedin, founder?.instagram, founder?.youtube,
    ...businesses.map(b => b.website),
  ].filter((u): u is string => !!u).map(u => normalizeUrl(u))

  usePageMeta({
    title: 'Speaker & Press',
    description: "Shakas Designer — founder of The Culo Village, Culo Creatives in Canva, Pretty Cool Marketing and Billow Beach. Every business linked here is real, live and run by the same founder.",
    ogType: 'profile',
    ogImage: founder?.avatar,
    jsonLd: founder ? {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: founder.name,
      description: founder.bio,
      ...(founder.avatar ? { image: founder.avatar } : {}),
      ...(sameAs.length > 0 ? { sameAs } : {}),
      jobTitle: 'Founder',
      worksFor: businesses.map(b => ({ '@type': 'Organization', name: b.name, url: normalizeUrl(b.website) })),
    } : null,
  })

  if (!founder) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-4">
        <p className="font-body text-muted">Not available right now.</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="pt-32 pb-16 bg-surface border-b border-border">
        <InnerContainer>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-center">
            <div className="lg:col-span-2">
              <p className="font-body text-xs font-semibold text-primary uppercase tracking-widest mb-4">
                Speaker &amp; Press
              </p>
              <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold text-charcoal leading-tight mb-4">
                {founder.name.trim()}
              </h1>
              <p className="font-body text-lg text-muted leading-relaxed max-w-2xl mb-6">
                Founder of four real, operating businesses — a tour company, a beach bag brand, a
                marketing agency and a founder publishing platform — built one after the other, on
                the road, over the last seven years.
              </p>
              <div className="flex flex-wrap gap-3">
                {founder.linkedin && (
                  <a href={normalizeUrl(founder.linkedin)} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-[#b05a35] transition-colors">
                    Connect on LinkedIn ↗
                  </a>
                )}
                <a href="mailto:support@prettycoolmarketing.com?subject=Speaking%20%2F%20Press%20enquiry"
                  className="inline-flex items-center gap-2 px-5 py-2.5 border border-border text-charcoal text-sm font-semibold rounded-xl hover:border-primary hover:text-primary transition-colors">
                  Book for an interview or panel
                </a>
              </div>
            </div>
            {founder.avatar && (
              <div className="lg:col-span-1 flex justify-center lg:justify-end">
                <img src={founder.avatar} alt={founder.name} className="w-48 h-48 sm:w-56 sm:h-56 rounded-2xl object-cover shadow-lg" />
              </div>
            )}
          </div>
        </InnerContainer>
      </section>

      {/* ── The point of view ───────────────────────────────────────────── */}
      <section className="py-16">
        <InnerContainer>
          <div className="max-w-3xl">
            <p className="font-body text-xs font-semibold text-primary uppercase tracking-widest mb-3">The thesis</p>
            <blockquote className="font-heading text-2xl sm:text-3xl font-semibold text-charcoal leading-snug mb-4">
              "A founder posts something real, it performs for a day, then the algorithm moves on —
              and their whole body of work disappears underneath whatever they posted next."
            </blockquote>
            <p className="font-body text-muted leading-relaxed">
              That's the problem The Culo Village and Culo Creatives in Canva exist to fix: turning a
              founder's raw footage and everyday content into a structured, permanent, searchable body
              of work — one that search engines and AI can actually find, instead of one that only
              lives for as long as a feed algorithm decides to show it.
            </p>
          </div>
        </InnerContainer>
      </section>

      {/* ── Proof: run on real businesses, not a pitch deck ─────────────── */}
      <section className="py-16 bg-surface border-y border-border">
        <InnerContainer>
          <p className="font-body text-xs font-semibold text-primary uppercase tracking-widest mb-3">Proven on my own work first</p>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-charcoal mb-8 max-w-2xl">
            Every one of these is a real, live business — not a case study written after the fact.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {businesses.map(b => (
              <a
                key={b.id}
                href={normalizeUrl(b.website)}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-background rounded-2xl border border-border p-6 hover:border-primary/40 transition-colors"
              >
                <p className="font-heading text-lg font-semibold text-charcoal mb-1">{b.name.trim()}</p>
                <p className="font-body text-sm text-muted leading-relaxed mb-3">{b.tagline}</p>
                <span className="font-body text-xs font-semibold text-primary">{b.website} ↗</span>
              </a>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-10 max-w-2xl">
            <div className="bg-background rounded-xl border border-border px-4 py-3">
              <p className="font-heading text-2xl font-bold text-charcoal">{publishedStories.length}</p>
              <p className="font-body text-xs text-muted mt-0.5">stories published through the platform</p>
            </div>
            <div className="bg-background rounded-xl border border-border px-4 py-3">
              <p className="font-heading text-2xl font-bold text-charcoal">{totalImports}</p>
              <p className="font-body text-xs text-muted mt-0.5">pieces of raw content processed</p>
            </div>
            <div className="bg-background rounded-xl border border-border px-4 py-3">
              <p className="font-heading text-2xl font-bold text-charcoal">{businesses.length}</p>
              <p className="font-body text-xs text-muted mt-0.5">real businesses built and run</p>
            </div>
          </div>
        </InnerContainer>
      </section>

      {/* ── The journey ──────────────────────────────────────────────────── */}
      <section className="py-16">
        <InnerContainer>
          <div className="max-w-3xl">
            <p className="font-body text-xs font-semibold text-primary uppercase tracking-widest mb-3">The story</p>
            <div className="font-body text-muted leading-relaxed whitespace-pre-line">
              {founder.bio}
            </div>
          </div>
        </InnerContainer>
      </section>

      {/* ── Press / speaking CTA ─────────────────────────────────────────── */}
      <section className="py-16 bg-charcoal">
        <InnerContainer>
          <div className="max-w-2xl">
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-white mb-3">
              For podcast bookers, journalists and conference organisers
            </h2>
            <p className="font-body text-white/70 leading-relaxed mb-6">
              Happy to talk about founder-led content, building four businesses without an office,
              or what it actually takes to make a founder's work findable by search engines and AI.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="mailto:support@prettycoolmarketing.com?subject=Speaking%20%2F%20Press%20enquiry"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-[#b05a35] transition-colors">
                Email for a booking
              </a>
              {founder.linkedin && (
                <a href={normalizeUrl(founder.linkedin)} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 border border-white/20 text-white text-sm font-semibold rounded-xl hover:border-white/40 transition-colors">
                  LinkedIn ↗
                </a>
              )}
              <Link to="/founders/shakas-designer"
                className="inline-flex items-center gap-2 px-5 py-2.5 border border-white/20 text-white text-sm font-semibold rounded-xl hover:border-white/40 transition-colors">
                Full profile in the Village →
              </Link>
            </div>
          </div>
        </InnerContainer>
      </section>
    </main>
  )
}
