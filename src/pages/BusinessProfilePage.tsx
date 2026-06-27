import type { ReactNode }             from 'react'
import { useParams, Link }           from 'react-router-dom'
import { usePageTitle }               from '../utils/usePageTitle'
import { businesses, getBusinessBySlug } from '../data/businesses'
import { getFounder }                 from '../data/founders'
import { getFAQsForBusiness }         from '../data/faqs'
import { getServicesForBusiness }     from '../data/services'
import { getTestimonialsForBusiness } from '../data/testimonials'
import { getCaseStudiesForBusiness }  from '../data/caseStudies'
import { getResourcesForBusiness }    from '../data/resources'
import { getExpertiseForBusiness }    from '../data/expertise'
import { StoryGrid }                  from '../widgets/StoryGrid'
import { IdeaGrid }                   from '../widgets/IdeaGrid'
import { LibraryGrid }               from '../widgets/LibraryGrid'
import { FounderCard }                from '../components/cards/FounderCard'
import { BusinessCard }               from '../components/cards/BusinessCard'
import { Badge }                      from '../components/ui/Badge'
import { InnerContainer }             from '../components/layout/PageContainer'
import { formatDate }                 from '../utils/slugify'
import type { Business }              from '../types'

// ─── Not found ──────────────────────────────────────────────────────────────────

function BusinessNotFound({ slug }: { slug: string }) {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6" aria-hidden="true">
          <svg className="w-8 h-8 text-accent/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h1 className="font-heading text-2xl font-semibold text-charcoal mb-3">Business not found</h1>
        <p className="font-body text-muted mb-2">
          We couldn't find a business with the slug{' '}
          <code className="text-sm bg-border px-1.5 py-0.5 rounded">{slug}</code>.
        </p>
        <p className="font-body text-sm text-muted mb-8">It may not have been published yet, or the URL may have changed.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/mercato" className="px-5 py-2.5 bg-accent text-charcoal text-sm font-semibold rounded-xl hover:bg-[#c4963e] transition-colors">
            Browse Mercato
          </Link>
          <Link to="/" className="px-5 py-2.5 border border-border text-charcoal text-sm font-medium rounded-xl hover:border-accent hover:text-accent transition-colors">
            Back to Village
          </Link>
        </div>
      </div>
    </main>
  )
}

// ─── Offer card ──────────────────────────────────────────────────────────────────

function OfferCard({ offer, businessName }: { offer: Business['offers'][number]; businessName: string }) {
  return (
    <article className="bg-surface rounded-2xl p-5 border border-border flex flex-col gap-3" aria-label={`Offer: ${offer.title}`}>
      <h3 className="font-heading text-base font-semibold text-charcoal leading-snug">{offer.title}</h3>
      <p className="font-body text-sm text-muted leading-relaxed flex-1">{offer.description}</p>
      <a
        href={offer.ctaUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-accent text-charcoal text-sm font-semibold rounded-xl hover:bg-[#c4963e] transition-colors self-start"
        aria-label={`${offer.ctaLabel} — ${businessName}`}
      >
        {offer.ctaLabel}
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
    </article>
  )
}

// ─── Social link ─────────────────────────────────────────────────────────────────

function SocialLink({ href, label, icon }: { href: string; label: string; icon: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm text-muted hover:border-accent hover:text-charcoal transition-colors"
      aria-label={label}
    >
      {icon}
      <span className="font-body text-sm">{label}</span>
    </a>
  )
}

const resourceTypeLabel: Record<string, string> = {
  guide: 'Guide', template: 'Template', tool: 'Tool',
  framework: 'Framework', video: 'Video', article: 'Article',
}

// ─── Business Profile Page ────────────────────────────────────────────────────────

export function BusinessProfilePage() {
  const { slug } = useParams<{ slug: string }>()
  const business = getBusinessBySlug(slug ?? '')
  usePageTitle(business ? [business.name, 'Mercato'] : 'Mercato')

  if (!business) return <BusinessNotFound slug={slug ?? ''} />

  const founder        = getFounder(business.founderId)
  const faqs           = getFAQsForBusiness(business.id)
  const services       = getServicesForBusiness(business.id)
  const testimonials   = getTestimonialsForBusiness(business.id)
  const caseStudies    = getCaseStudiesForBusiness(business.id)
  const resources      = getResourcesForBusiness(business.id)
  const expertiseAreas = getExpertiseForBusiness(business.id)

  const businessTopicIds = new Set(business.topics.map(t => t.id))
  const related = businesses
    .filter(b => b.id !== business.id)
    .map(b => {
      let score = 0
      if (b.industry.id === business.industry.id)         score += 3
      if (b.location.id  === business.location.id)        score += 2
      if (b.topics.some(t => businessTopicIds.has(t.id))) score += 1
      return { business: b, score }
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ business: b }) => b)

  const websiteHostname = business.website
    ? new URL(business.website).hostname.replace('www.', '')
    : null

  return (
    <main className="min-h-screen bg-background">

      {/* ── Breadcrumb ──────────────────────────────────────────────────────── */}
      <nav className="bg-surface border-b border-border pt-20 pb-4" aria-label="Breadcrumb">
        <InnerContainer>
          <ol className="flex items-center gap-2 text-sm font-body text-muted flex-wrap" role="list">
            <li><Link to="/" className="hover:text-primary transition-colors">Village</Link></li>
            <li aria-hidden="true" className="text-border">›</li>
            <li><Link to="/mercato" className="hover:text-primary transition-colors">Mercato</Link></li>
            <li aria-hidden="true" className="text-border">›</li>
            <li className="text-charcoal font-medium line-clamp-1" aria-current="page">{business.name}</li>
          </ol>
        </InnerContainer>
      </nav>

      {/* ── Business hero ───────────────────────────────────────────────────── */}
      <section aria-labelledby="business-title">
        <div className="relative h-56 sm:h-72 md:h-80 overflow-hidden bg-charcoal">
          <img src={business.coverImage} alt={`${business.name} cover image`}
            className="w-full h-full object-cover opacity-70" loading="eager" />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/20 to-transparent" aria-hidden="true" />
          {business.featured && (
            <span className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-medium bg-accent text-charcoal">Featured</span>
          )}
        </div>

        <div className="bg-surface border-b border-border pb-10">
          <InnerContainer>
            <div className="flex items-end gap-5 -mt-10 relative z-10 mb-6">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden ring-4 ring-surface shadow-lg bg-background flex-shrink-0">
                <img src={business.logo} alt={`${business.name} logo`} className="w-full h-full object-cover" loading="eager" />
              </div>
              <div className="pb-1">
                <span className="font-body text-xs font-semibold text-accent uppercase tracking-widest">
                  {business.industry.name}
                </span>
              </div>
            </div>

            <h1 id="business-title" className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold text-charcoal leading-tight mb-2">
              {business.name}
            </h1>
            <p className="font-heading text-lg text-muted italic mb-4">{business.tagline}</p>
            <p className="font-body text-base text-muted leading-relaxed mb-6 max-w-2xl">{business.description}</p>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-body text-muted mb-5">
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-primary/50 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                {business.location.name}, {business.location.state}
              </span>
              {founder && (
                <span className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-primary/50 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Founded by{' '}
                    <Link to={`/founders/${founder.slug}`} className="font-medium text-charcoal hover:text-primary transition-colors">
                      {founder.name}
                    </Link>
                  </span>
                </span>
              )}
              <time dateTime={business.createdAt} className="text-muted">Joined {formatDate(business.createdAt)}</time>
            </div>

            <div className="flex flex-wrap gap-2 mb-6" aria-label="Topics">
              {business.topics.map(t => (
                <Badge key={t.id} label={t.name} variant="mercato" />
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {business.website && (
                <SocialLink href={business.website} label={websiteHostname ?? 'Website'} icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                } />
              )}
              {business.instagram && (
                <SocialLink href={business.instagram} label="Instagram" icon={
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                } />
              )}
              {business.linkedin && (
                <SocialLink href={business.linkedin} label="LinkedIn" icon={
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                } />
              )}
            </div>
          </InnerContainer>
        </div>
      </section>

      {/* ── Evidence strip ──────────────────────────────────────────────────── */}
      <section className="bg-charcoal py-5" aria-label="Business credibility metrics">
        <InnerContainer>
          <div className="flex flex-wrap gap-6 sm:gap-10">
            {expertiseAreas.length > 0 && (
              <div className="flex flex-col">
                <span className="font-heading text-2xl font-bold text-white">{expertiseAreas.length}</span>
                <span className="font-body text-xs text-white/50 uppercase tracking-wide">Expertise areas</span>
              </div>
            )}
            {services.length > 0 && (
              <div className="flex flex-col">
                <span className="font-heading text-2xl font-bold text-white">{services.length}</span>
                <span className="font-body text-xs text-white/50 uppercase tracking-wide">Services</span>
              </div>
            )}
            {faqs.length > 0 && (
              <div className="flex flex-col">
                <span className="font-heading text-2xl font-bold text-white">{faqs.length}</span>
                <span className="font-body text-xs text-white/50 uppercase tracking-wide">FAQs answered</span>
              </div>
            )}
            {testimonials.length > 0 && (
              <div className="flex flex-col">
                <span className="font-heading text-2xl font-bold text-white">{testimonials.length}</span>
                <span className="font-body text-xs text-white/50 uppercase tracking-wide">Testimonials</span>
              </div>
            )}
            {caseStudies.length > 0 && (
              <div className="flex flex-col">
                <span className="font-heading text-2xl font-bold text-white">{caseStudies.length}</span>
                <span className="font-body text-xs text-white/50 uppercase tracking-wide">Case studies</span>
              </div>
            )}
            {business.topics.length > 0 && (
              <div className="flex flex-col">
                <span className="font-heading text-2xl font-bold text-white">{business.topics.length}</span>
                <span className="font-body text-xs text-white/50 uppercase tracking-wide">Topics</span>
              </div>
            )}
          </div>
        </InnerContainer>
      </section>

      {/* ── Main body ───────────────────────────────────────────────────────── */}
      <div className="py-12 md:py-16">
        <InnerContainer>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-14">

            {/* ── Left: content ─────────────────────────────────────────────── */}
            <div className="lg:col-span-2 flex flex-col gap-14">

              {/* Expertise areas */}
              {expertiseAreas.length > 0 && (
                <section aria-labelledby="business-expertise-heading">
                  <h2 id="business-expertise-heading" className="font-heading text-2xl font-semibold text-charcoal mb-2">
                    Expertise
                  </h2>
                  <p className="font-body text-sm text-muted mb-5">
                    The domains {business.name} operates in.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {expertiseAreas.map(area => (
                      <Link
                        key={area.id}
                        to={`/expertise/${area.slug}`}
                        className="group flex flex-col bg-surface rounded-2xl border border-border p-5 hover:border-accent hover:shadow-sm transition-all"
                        aria-label={`Explore ${area.name} expertise`}
                      >
                        <h3 className="font-heading text-base font-semibold text-charcoal group-hover:text-accent transition-colors mb-1">
                          {area.name}
                        </h3>
                        <p className="font-body text-xs text-accent font-medium mb-2">{area.tagline}</p>
                        <p className="font-body text-xs text-muted leading-relaxed line-clamp-2">{area.description}</p>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* Services */}
              {services.length > 0 && (
                <section aria-labelledby="business-services-heading">
                  <h2 id="business-services-heading" className="font-heading text-2xl font-semibold text-charcoal mb-2">
                    Services
                  </h2>
                  <p className="font-body text-sm text-muted mb-6">
                    What {business.name} offers to clients and businesses.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {services.map(service => (
                      <article key={service.id} className="bg-surface rounded-2xl border border-border p-5 flex flex-col gap-3">
                        <h3 className="font-heading text-base font-semibold text-charcoal leading-snug">{service.name}</h3>
                        <p className="font-body text-sm text-muted leading-relaxed flex-1">{service.description}</p>
                        {service.deliverable && (
                          <div className="bg-background rounded-xl p-3 border border-border">
                            <p className="font-body text-xs font-semibold text-muted uppercase tracking-wide mb-1">What you get</p>
                            <p className="font-body text-xs text-charcoal/80 leading-relaxed">{service.deliverable}</p>
                          </div>
                        )}
                        <div className="flex items-center justify-between mt-auto">
                          {service.price && (
                            <span className="font-heading text-base font-semibold text-accent">{service.price}</span>
                          )}
                          <a
                            href={service.ctaUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-4 py-2 bg-accent text-charcoal text-sm font-semibold rounded-xl hover:bg-[#c4963e] transition-colors"
                            aria-label={`${service.ctaLabel} — ${service.name}`}
                          >
                            {service.ctaLabel}
                          </a>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              )}

              {/* Offers (legacy) */}
              {business.offers.length > 0 && (
                <section aria-labelledby="business-offers-heading">
                  <h2 id="business-offers-heading" className="font-heading text-2xl font-semibold text-charcoal mb-2">
                    What {business.name} offers
                  </h2>
                  <p className="font-body text-sm text-muted mb-6">Services and products available directly from this business.</p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4" role="list" aria-label={`Offers from ${business.name}`}>
                    {business.offers.map(offer => (
                      <li key={offer.id}><OfferCard offer={offer} businessName={business.name} /></li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Case Studies */}
              {caseStudies.length > 0 && (
                <section aria-labelledby="business-case-studies-heading">
                  <h2 id="business-case-studies-heading" className="font-heading text-2xl font-semibold text-charcoal mb-2">
                    Case Studies
                  </h2>
                  <p className="font-body text-sm text-muted mb-6">Documented results from working with {business.name}.</p>
                  <div className="flex flex-col gap-6">
                    {caseStudies.map(cs => (
                      <article key={cs.id} className="bg-surface rounded-2xl border border-border p-6" aria-label={cs.title}>
                        <h3 className="font-heading text-lg font-semibold text-charcoal mb-3 leading-snug">{cs.title}</h3>
                        <p className="font-body text-sm text-muted leading-relaxed mb-4">{cs.summary}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="font-body text-xs font-semibold text-muted uppercase tracking-wide mb-1">Challenge</p>
                            <p className="font-body text-sm text-charcoal/80 leading-relaxed">{cs.challenge}</p>
                          </div>
                          <div>
                            <p className="font-body text-xs font-semibold text-muted uppercase tracking-wide mb-1">Outcome</p>
                            <p className="font-body text-sm text-charcoal/80 leading-relaxed">{cs.outcome}</p>
                          </div>
                        </div>
                        {cs.result && (
                          <div className="bg-accent/5 border border-accent/20 rounded-xl px-4 py-3">
                            <p className="font-body text-sm font-semibold text-accent">Result: {cs.result}</p>
                          </div>
                        )}
                      </article>
                    ))}
                  </div>
                </section>
              )}

              {/* Testimonials */}
              {testimonials.length > 0 && (
                <section aria-labelledby="business-testimonials-heading">
                  <h2 id="business-testimonials-heading" className="font-heading text-2xl font-semibold text-charcoal mb-2">
                    Testimonials
                  </h2>
                  <p className="font-body text-sm text-muted mb-6">What clients say about working with {business.name}.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {testimonials.map(t => (
                      <blockquote key={t.id} className="bg-surface rounded-2xl border border-border p-6 flex flex-col gap-4">
                        <p className="font-body text-sm text-charcoal/80 leading-relaxed italic">"{t.quote}"</p>
                        <footer className="flex items-center gap-2.5 mt-auto">
                          {t.authorAvatar && (
                            <img src={t.authorAvatar} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" loading="lazy" />
                          )}
                          <div>
                            <p className="font-body text-sm font-semibold text-charcoal">{t.authorName}</p>
                            {(t.authorRole || t.authorCompany) && (
                              <p className="font-body text-xs text-muted">
                                {[t.authorRole, t.authorCompany].filter(Boolean).join(', ')}
                              </p>
                            )}
                          </div>
                        </footer>
                      </blockquote>
                    ))}
                  </div>
                </section>
              )}

              {/* FAQ */}
              {faqs.length > 0 && (
                <section aria-labelledby="business-faq-heading">
                  <h2 id="business-faq-heading" className="font-heading text-2xl font-semibold text-charcoal mb-2">
                    Frequently Asked Questions
                  </h2>
                  <p className="font-body text-sm text-muted mb-6">
                    Common questions about {business.name} and how they work.
                  </p>
                  <div className="flex flex-col gap-4">
                    {faqs.map(faq => (
                      <details key={faq.id} className="group bg-surface rounded-2xl border border-border">
                        <summary className="flex items-center justify-between gap-4 px-6 py-5 cursor-pointer list-none">
                          <h3 className="font-heading text-base font-semibold text-charcoal leading-snug">{faq.question}</h3>
                          <svg className="w-5 h-5 text-muted flex-shrink-0 transition-transform group-open:rotate-180"
                            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </summary>
                        <div className="px-6 pb-5">
                          <p className="font-body text-sm text-charcoal/80 leading-relaxed">{faq.answer}</p>
                          {faq.topicIds.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {faq.topicIds.map(tid => (
                                <span key={tid} className="font-body text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">
                                  {tid.replace(/-/g, ' ')}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </details>
                    ))}
                  </div>
                </section>
              )}

              {/* Stories */}
              <section aria-labelledby="business-stories-heading">
                <h2 id="business-stories-heading" className="font-heading text-2xl font-semibold text-charcoal mb-2">
                  Stories from {business.name}
                </h2>
                <p className="font-body text-sm text-muted mb-6">Published founder stories connected to this business.</p>
                <StoryGrid
                  filter={{ businessId: business.id }}
                  columns={2}
                  cardVariant="compact"
                  showSummary
                  showFounder
                  showTopics={false}
                  showCTA={false}
                  emptyTitle="No stories published yet"
                  emptyMessage="Stories will appear here as the founder publishes and connects them to this business."
                />
              </section>

              {/* Ideas */}
              <section aria-labelledby="business-ideas-heading">
                <h2 id="business-ideas-heading" className="font-heading text-2xl font-semibold text-charcoal mb-2">
                  Ideas connected to {business.name}
                </h2>
                <p className="font-body text-sm text-muted mb-6">Knowledge extracted from this business's stories.</p>
                <IdeaGrid
                  filter={{ businessId: business.id }}
                  columns={2}
                  cardVariant="default"
                  emptyTitle="No ideas linked yet"
                  emptyMessage="Ideas will appear here as stories are published and knowledge is extracted."
                />
              </section>

              {/* Founder */}
              {founder && (
                <section aria-labelledby="business-founder-heading">
                  <h2 id="business-founder-heading" className="font-heading text-2xl font-semibold text-charcoal mb-2">
                    The Founder
                  </h2>
                  <p className="font-body text-sm text-muted mb-6">The person behind {business.name}.</p>
                  <div className="max-w-sm">
                    <FounderCard founder={founder} business={business} variant="default" />
                  </div>
                </section>
              )}

              {/* Library */}
              <LibraryGrid
                heading="Library"
                subheading={`Resources, templates and products published by ${business.name}.`}
                filter={{ businessId: business.id }}
                columns={2}
                emptyTitle="Nothing published yet"
                emptyMessage={`${business.name} hasn't added any Library items yet.`}
              />

              {/* Related businesses */}
              {related.length > 0 && (
                <section aria-labelledby="related-businesses-heading">
                  <h2 id="related-businesses-heading" className="font-heading text-2xl font-semibold text-charcoal mb-2">
                    Related Businesses
                  </h2>
                  <p className="font-body text-sm text-muted mb-6">
                    Businesses in the Village that share industry, location or topics.
                  </p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-5" role="list" aria-label="Related businesses">
                    {related.map(rel => {
                      const relFounder = getFounder(rel.founderId)
                      return (
                        <li key={rel.id}>
                          <BusinessCard business={rel} founder={relFounder} variant="default" />
                        </li>
                      )
                    })}
                  </ul>
                  <div className="mt-6">
                    <Link to="/mercato" className="text-sm font-medium text-primary hover:text-[#b05a35] transition-colors">
                      Browse all businesses →
                    </Link>
                  </div>
                </section>
              )}

            </div>

            {/* ── Right: sidebar ─────────────────────────────────────────────── */}
            <aside className="lg:col-span-1" aria-label="Business details">
              <div className="sticky top-24 flex flex-col gap-6">

                {/* Primary offer CTA */}
                {business.offers[0] && (
                  <div className="bg-accent/10 rounded-2xl p-5 border border-accent/30">
                    <p className="font-body text-xs font-semibold text-accent uppercase tracking-wide mb-2">Top Offer</p>
                    <p className="font-heading text-base font-semibold text-charcoal mb-1 leading-snug">
                      {business.offers[0].title}
                    </p>
                    <p className="font-body text-sm text-muted leading-relaxed mb-4">{business.offers[0].description}</p>
                    <a
                      href={business.offers[0].ctaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-center px-4 py-2.5 bg-accent text-charcoal text-sm font-semibold rounded-xl hover:bg-[#c4963e] transition-colors"
                      aria-label={`${business.offers[0].ctaLabel} — ${business.name}`}
                    >
                      {business.offers[0].ctaLabel}
                    </a>
                  </div>
                )}

                {/* Resources */}
                {resources.length > 0 && (
                  <section aria-labelledby="business-resources-heading">
                    <h2 id="business-resources-heading" className="font-heading text-base font-semibold text-charcoal mb-3">
                      Resources
                    </h2>
                    <div className="flex flex-col gap-2">
                      {resources.map(resource => (
                        <a
                          key={resource.id}
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex flex-col bg-surface rounded-xl border border-border p-4 hover:border-accent hover:shadow-sm transition-all"
                          aria-label={resource.title}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-body text-xs font-semibold text-muted uppercase tracking-wide">
                              {resourceTypeLabel[resource.type] ?? resource.type}
                            </span>
                            {resource.free && (
                              <span className="font-body text-xs font-semibold text-secondary bg-secondary/10 px-2 py-0.5 rounded-full">Free</span>
                            )}
                          </div>
                          <h3 className="font-heading text-sm font-semibold text-charcoal group-hover:text-accent transition-colors mb-1 leading-snug">
                            {resource.title}
                          </h3>
                          <p className="font-body text-xs text-muted leading-relaxed line-clamp-2">{resource.description}</p>
                        </a>
                      ))}
                    </div>
                  </section>
                )}

                {/* Context panel */}
                <section className="bg-surface rounded-2xl p-5 border border-border" aria-labelledby="business-context-heading">
                  <h2 id="business-context-heading" className="font-heading text-base font-semibold text-charcoal mb-4">
                    Business Details
                  </h2>
                  <dl className="space-y-4 font-body text-sm">
                    {founder && (
                      <div>
                        <dt className="text-muted text-xs font-medium uppercase tracking-wide mb-1">Founder</dt>
                        <dd>
                          <Link to={`/founders/${founder.slug}`} className="text-charcoal font-medium hover:text-primary transition-colors">
                            {founder.name}
                          </Link>
                        </dd>
                      </div>
                    )}
                    <div>
                      <dt className="text-muted text-xs font-medium uppercase tracking-wide mb-1">Location</dt>
                      <dd className="text-charcoal">{business.location.name}, {business.location.state}</dd>
                    </div>
                    <div>
                      <dt className="text-muted text-xs font-medium uppercase tracking-wide mb-1">Industry</dt>
                      <dd className="text-charcoal">{business.industry.name}</dd>
                    </div>
                    {expertiseAreas.length > 0 && (
                      <div>
                        <dt className="text-muted text-xs font-medium uppercase tracking-wide mb-1">Expertise</dt>
                        <dd className="flex flex-wrap gap-1.5">
                          {expertiseAreas.map(area => (
                            <Link
                              key={area.id}
                              to={`/expertise/${area.slug}`}
                              className="font-body text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full hover:bg-accent/20 transition-colors"
                            >
                              {area.name}
                            </Link>
                          ))}
                        </dd>
                      </div>
                    )}
                    {business.topics.length > 0 && (
                      <div>
                        <dt className="text-muted text-xs font-medium uppercase tracking-wide mb-1">Topics</dt>
                        <dd className="flex flex-wrap gap-1.5">
                          {business.topics.map(t => (
                            <Badge key={t.id} label={t.name} variant="mercato" />
                          ))}
                        </dd>
                      </div>
                    )}
                    {business.offers.length > 0 && (
                      <div>
                        <dt className="text-muted text-xs font-medium uppercase tracking-wide mb-1">
                          {business.offers.length === 1 ? 'Offer' : 'Offers'}
                        </dt>
                        <dd className="space-y-1">
                          {business.offers.map(o => (
                            <div key={o.id}>
                              <a href={o.ctaUrl} target="_blank" rel="noopener noreferrer"
                                className="text-charcoal hover:text-primary transition-colors text-sm">
                                {o.title}
                              </a>
                            </div>
                          ))}
                        </dd>
                      </div>
                    )}
                    <div>
                      <dt className="text-muted text-xs font-medium uppercase tracking-wide mb-1">In the Village since</dt>
                      <dd>
                        <time dateTime={business.createdAt} className="text-charcoal">{formatDate(business.createdAt)}</time>
                      </dd>
                    </div>
                    {(business.website || business.instagram || business.linkedin) && (
                      <div>
                        <dt className="text-muted text-xs font-medium uppercase tracking-wide mb-2">Links</dt>
                        <dd className="flex flex-col gap-1.5">
                          {business.website && (
                            <a href={business.website} target="_blank" rel="noopener noreferrer"
                              className="text-primary hover:text-[#b05a35] transition-colors text-sm font-medium">
                              {websiteHostname} ↗
                            </a>
                          )}
                          {business.instagram && (
                            <a href={business.instagram} target="_blank" rel="noopener noreferrer"
                              className="text-primary hover:text-[#b05a35] transition-colors text-sm">
                              Instagram ↗
                            </a>
                          )}
                          {business.linkedin && (
                            <a href={business.linkedin} target="_blank" rel="noopener noreferrer"
                              className="text-primary hover:text-[#b05a35] transition-colors text-sm">
                              LinkedIn ↗
                            </a>
                          )}
                        </dd>
                      </div>
                    )}
                  </dl>
                </section>

              </div>
            </aside>

          </div>
        </InnerContainer>
      </div>

    </main>
  )
}
