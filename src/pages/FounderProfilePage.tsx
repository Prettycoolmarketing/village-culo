import { useParams, Link } from 'react-router-dom'
import { usePageMeta } from '../utils/usePageMeta'
import { getFounders } from '../services/founders'
import { getBusiness, getBusinesses } from '../services/businesses'
import { trustProfileService, recommendationService } from '../services/partnership'
import { importedContentService } from '../services/importedContent'
import { villageContentIntelligenceService } from '../services/villageIntelligence'
import { ImportedContentCard } from '../components/cards/ImportedContentCard'
import { CreateWithCuloCTA } from '../components/ui/CreateWithCuloCTA'
import { LEVEL_LABELS, LEVEL_COLORS } from '../services/trustEngine'
import { getFAQsForFounder } from '../data/faqs'
import { getResourcesForFounder } from '../data/resources'
import { getTalksForFounder } from '../data/talks'
import { getTestimonialsForFounder } from '../data/testimonials'
import { getExpertiseForFounder } from '../data/expertise'
import { StoryGrid } from '../widgets/StoryGrid'
import { IdeaGrid } from '../widgets/IdeaGrid'
import { LibraryGrid } from '../widgets/LibraryGrid'
import { EventGrid } from '../widgets/EventGrid'
import { BusinessCard } from '../components/cards/BusinessCard'
import { Badge } from '../components/ui/Badge'
import { Avatar } from '../components/ui/Avatar'
import { InnerContainer } from '../components/layout/PageContainer'
import { TrackedRecommendationLink } from '../components/ui/TrackedRecommendationLink'

// ─── Social icons ────────────────────────────────────────────────────────────────

function WebIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  )
}

function LinkedInIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  )
}

function YouTubeIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  )
}

function TikTokIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.14 8.14 0 004.78 1.53V6.78a4.85 4.85 0 01-1.01-.09z"/>
    </svg>
  )
}

function PodcastIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
  )
}

function NewsletterIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.988h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/>
    </svg>
  )
}

function XIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  )
}

function ThreadsIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c-5 0-8 3.5-8 9s3 9 8 9c4 0 6.5-2 6.5-5 0-2.5-2-4-4.5-4-2 0-3.5 1-3.5 2.5S11.5 17 13 17c2 0 3.5-1.5 3.5-4 0-4-3-6-6-6" />
    </svg>
  )
}

function LinkIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 010 5.656l-3 3a4 4 0 01-5.656-5.656l1.5-1.5M10.172 13.828a4 4 0 010-5.656l3-3a4 4 0 015.656 5.656l-1.5 1.5" />
    </svg>
  )
}

const SOCIAL_ICON: Record<string, () => JSX.Element> = {
  linkedin: LinkedInIcon, instagram: InstagramIcon, facebook: FacebookIcon,
  'facebook-page': FacebookIcon, youtube: YouTubeIcon, tiktok: TikTokIcon,
  x: XIcon, threads: ThreadsIcon, podcast: PodcastIcon, newsletter: NewsletterIcon, custom: LinkIcon,
}
const SOCIAL_LABEL: Record<string, string> = {
  linkedin: 'LinkedIn', instagram: 'Instagram', facebook: 'Facebook',
  'facebook-page': 'Facebook Page', youtube: 'YouTube', tiktok: 'TikTok',
  x: 'X', threads: 'Threads', podcast: 'Podcast', newsletter: 'Newsletter', custom: 'Link',
}

// ─── Resource type label ────────────────────────────────────────────────────────

const resourceTypeLabel: Record<string, string> = {
  guide: 'Guide', template: 'Template', tool: 'Tool',
  framework: 'Framework', video: 'Video', article: 'Article',
}

// ─── Not Found ──────────────────────────────────────────────────────────────────

function FounderNotFound({ slug }: { slug: string }) {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4" id="founder-not-found">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6" aria-hidden="true">
          <svg className="w-8 h-8 text-primary/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h1 className="font-heading text-2xl font-semibold text-charcoal mb-3">Founder not found</h1>
        <p className="font-body text-muted mb-2">
          We couldn't find a founder with the slug <code className="text-sm bg-border px-1.5 py-0.5 rounded">{slug}</code>.
        </p>
        <p className="font-body text-sm text-muted mb-8">They may not have published yet, or the URL may have changed.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/founders" className="px-5 py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-[#b05a35] transition-colors">Browse All Founders</Link>
          <Link to="/" className="px-5 py-2.5 border border-border text-charcoal text-sm font-medium rounded-xl hover:border-primary hover:text-primary transition-colors">Back to Village</Link>
        </div>
      </div>
    </main>
  )
}

// ─── Related Founders ────────────────────────────────────────────────────────────

function getRelatedFounders(founderId: string, industryId: string, locationId: string, topicIds: string[]) {
  return getFounders({ publicOnly: true })
    .filter(f => f.id !== founderId)
    .map(f => {
      let score = 0
      if (f.industry.id === industryId)                         score += 3
      if (f.location.id === locationId)                          score += 2
      if (f.topics.some(t => topicIds.includes(t.id)))          score += 1
      return { founder: f, score }
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ founder }) => founder)
}

// ─── Founder Profile ─────────────────────────────────────────────────────────────

export function FounderProfilePage() {
  const { slug } = useParams<{ slug: string }>()
  const founder = getFounders().find(f => f.slug === slug)

  // Pre-guard lookups — hooks must be called unconditionally before any early return
  const business           = founder ? getBusiness(founder.businessId) : undefined
  const founderIntelRecords = founder ? villageContentIntelligenceService.getByFounder(founder.id) : []

  usePageMeta({
    title:       founder?.name,
    description: founder?.bio?.slice(0, 160),
    keywords:    [
      ...(founder?.topics.map(t => t.name) ?? []),
      ...[...new Set(founderIntelRecords.flatMap(r => r.seoKeywords))].slice(0, 8),
    ].slice(0, 15),
    ogType:  'profile',
    ogImage: founder?.coverImage ?? founder?.avatar,
    jsonLd:  founder && (founder.status === 'published' || founder.status === 'featured') ? {
      '@context':   'https://schema.org',
      '@type':      'Person',
      name:         founder.name,
      description:  founder.bio ?? '',
      url:          `${window.location.origin}/founders/${founder.slug}`,
      ...(founder.avatar ? { image: founder.avatar } : {}),
      sameAs:       [founder.website, founder.instagram, founder.linkedin, founder.youtube, founder.tiktok, founder.podcast, founder.newsletter].filter(Boolean),
      knowsAbout:   [
        ...founder.topics.map(t => t.name),
        ...[...new Set(founderIntelRecords.flatMap(r => r.primaryTopics))].slice(0, 5),
      ].slice(0, 10),
      ...(business ? { affiliation: { '@type': 'Organization', name: business.name } } : {}),
      homeLocation: {
        '@type': 'Place',
        name: `${founder.location.name}, ${founder.location.state}, Australia`,
      },
    } : undefined,
  })

  if (!founder || (founder.status !== 'published' && founder.status !== 'featured')) return <FounderNotFound slug={slug ?? ''} />
  const faqs             = getFAQsForFounder(founder.id)
  const resources        = getResourcesForFounder(founder.id)
  const talks            = getTalksForFounder(founder.id)
  const testimonials     = getTestimonialsForFounder(founder.id)
  const expertiseAreas   = getExpertiseForFounder(founder.id)
  const relatedFounders  = getRelatedFounders(
    founder.id, founder.industry.id, founder.location.id, founder.topics.map(t => t.id)
  )

  const trustProfile    = trustProfileService.get(founder.id)
  const approvedRecs    = recommendationService.getAll({ founderId: founder.id, status: 'approved' })
    .filter(r => r.disclosureVisible)
  const publicImports   = importedContentService.getAll({ founderId: founder.id, publicOnly: true })

  // ── Village Intelligence — aggregate across all content ───────────────────
  const aggregatedIntel = founderIntelRecords.length > 0 ? {
    topics:    [...new Set(founderIntelRecords.flatMap(r => r.primaryTopics))].slice(0, 10),
    locations: [...new Set(founderIntelRecords.flatMap(r => [...r.cities, ...r.regions]))].slice(0, 8),
    questions: [...new Set(founderIntelRecords.flatMap(r => [...r.searchQuestions, ...r.geoQuestions]))].slice(0, 6),
    lessons:   [...new Set(founderIntelRecords.flatMap(r => r.lessons))].slice(0, 4),
    relatedFounderIds:   [...new Set(founderIntelRecords.flatMap(r => r.relatedFounderIds))].filter(id => id !== founder.id).slice(0, 3),
    relatedBusinessIds:  [...new Set(founderIntelRecords.flatMap(r => r.relatedBusinessIds))].slice(0, 3),
  } : null

  // Intel-driven related founders (supplement existing scoring-based related founders)
  const intelRelatedFounders = aggregatedIntel
    ? aggregatedIntel.relatedFounderIds
        .map(id => getFounders({ publicOnly: true }).find(f => f.id === id))
        .filter((f): f is NonNullable<typeof f> => !!f && f.id !== founder.id)
    : []

  // Intel-driven related businesses
  const intelRelatedBusinesses = aggregatedIntel
    ? aggregatedIntel.relatedBusinessIds
        .map(id => getBusinesses({ publicOnly: true }).find(b => b.id === id))
        .filter((b): b is NonNullable<typeof b> => !!b)
    : []

  // ── Evidence metrics (computed) ──────────────────────────────────────────────
  const yearsPublishing = new Date().getFullYear() - new Date(founder.createdAt).getFullYear() || 1

  return (
    <main className="min-h-screen bg-background" id="founder-profile">

      {/* ── Breadcrumb ──────────────────────────────────────────────────────── */}
      <nav className="bg-surface border-b border-border pt-20 pb-4" aria-label="Breadcrumb">
        <InnerContainer>
          <ol className="flex items-center gap-2 text-sm font-body text-muted" role="list">
            <li><Link to="/" className="hover:text-primary transition-colors">Village</Link></li>
            <li aria-hidden="true" className="text-border">›</li>
            <li><Link to="/founders" className="hover:text-primary transition-colors">Founders</Link></li>
            <li aria-hidden="true" className="text-border">›</li>
            <li className="text-charcoal font-medium truncate" aria-current="page">{founder.name}</li>
          </ol>
        </InnerContainer>
      </nav>

      {/* ── Profile ownership banner ──────────────────────────────────────── */}
      {founder.profileStatus === 'village-curated' && (
        <div className="bg-blue-50 border-b border-blue-100" role="note" aria-label="Curated profile notice">
          <InnerContainer>
            <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <svg className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <p className="font-body text-sm text-blue-800 leading-relaxed">
                  This profile has been curated by CULO Village using publicly available content and original source links.{' '}
                  <span className="text-blue-600">
                    If this is your profile and you would like changes, you can claim it or request removal.
                  </span>
                </p>
              </div>
              <Link
                to={`/claim/${founder.slug}`}
                className="flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition-colors"
              >
                Is this you? Claim this profile →
              </Link>
            </div>
          </InnerContainer>
        </div>
      )}

      {founder.profileStatus === 'claim-pending' && (
        <div className="bg-amber-50 border-b border-amber-100" role="note">
          <InnerContainer>
            <div className="py-3 flex items-center gap-2.5">
              <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <p className="font-body text-sm text-amber-800">
                A claim for this profile is currently under review by CULO Village.
              </p>
            </div>
          </InnerContainer>
        </div>
      )}

      {(founder.profileStatus === 'claimed' || founder.profileStatus === 'verified') && (
        <div className="bg-[#5E6B4A]/10 border-b border-[#5E6B4A]/20" role="note">
          <InnerContainer>
            <div className="py-3 flex items-center gap-2.5">
              <svg className="w-4 h-4 text-[#5E6B4A] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <p className="font-body text-sm text-[#5E6B4A] font-semibold">
                {founder.profileStatus === 'verified' ? '✓ Verified Founder' : '✓ Claimed Founder'}
              </p>
            </div>
          </InnerContainer>
        </div>
      )}

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section aria-labelledby="founder-name">
        {founder.coverImage ? (
          <div className="relative h-56 sm:h-72 md:h-80 overflow-hidden bg-charcoal">
            <img src={founder.coverImage} alt={`${founder.name}'s cover photo`} className="w-full h-full object-cover opacity-70" loading="eager" />
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/20 to-transparent" aria-hidden="true" />
          </div>
        ) : (
          <div className="h-32 bg-gradient-to-br from-primary/20 to-secondary/10" aria-hidden="true" />
        )}

        <div className="bg-surface border-b border-border pb-10">
          <InnerContainer>
            <div className="flex flex-col sm:flex-row sm:items-end gap-6 -mt-12 sm:-mt-16">
              <Avatar src={founder.avatar} alt={founder.name} size="xl"
                className="ring-4 ring-surface shadow-lg flex-shrink-0 w-24 h-24 sm:w-28 sm:h-28 text-2xl" />
              <div className="flex-1 min-w-0 pt-2">
                <h1 id="founder-name" className="font-heading text-3xl sm:text-4xl font-bold text-charcoal leading-tight">
                  {founder.name}
                </h1>
                <p className="font-body text-base text-primary font-medium mt-1" aria-label="Industry">
                  {founder.industry.name}
                </p>
                <p className="font-body text-sm text-muted mt-0.5 flex items-center gap-1.5" aria-label="Location">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  {founder.location.name}, {founder.location.state}, Australia
                </p>
              </div>
              {(founder.website || founder.instagram || founder.linkedin || founder.youtube || founder.tiktok || founder.podcast || founder.newsletter || (founder.socialLinks && founder.socialLinks.length > 0)) && (
                <div className="flex items-center gap-2 flex-shrink-0 pb-1 flex-wrap">
                  {founder.website && (
                    <a href={founder.website} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-charcoal text-sm font-medium hover:border-primary hover:text-primary transition-colors"
                      aria-label={`Visit ${founder.name}'s website`}>
                      <WebIcon /><span className="hidden sm:inline">Website</span>
                    </a>
                  )}
                  {founder.instagram && (
                    <a href={founder.instagram} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-charcoal text-sm hover:border-primary hover:text-primary transition-colors"
                      aria-label={`${founder.name} on Instagram`}>
                      <InstagramIcon />
                    </a>
                  )}
                  {founder.linkedin && (
                    <a href={founder.linkedin} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-charcoal text-sm hover:border-primary hover:text-primary transition-colors"
                      aria-label={`${founder.name} on LinkedIn`}>
                      <LinkedInIcon />
                    </a>
                  )}
                  {founder.youtube && (
                    <a href={founder.youtube} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-charcoal text-sm hover:border-red-500 hover:text-red-500 transition-colors"
                      aria-label={`${founder.name} on YouTube`}>
                      <YouTubeIcon />
                    </a>
                  )}
                  {founder.tiktok && (
                    <a href={founder.tiktok} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-charcoal text-sm hover:border-primary hover:text-primary transition-colors"
                      aria-label={`${founder.name} on TikTok`}>
                      <TikTokIcon />
                    </a>
                  )}
                  {founder.podcast && (
                    <a href={founder.podcast} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-charcoal text-sm hover:border-purple-500 hover:text-purple-500 transition-colors"
                      aria-label={`${founder.name}'s podcast`}>
                      <PodcastIcon />
                    </a>
                  )}
                  {founder.newsletter && (
                    <a href={founder.newsletter} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-charcoal text-sm hover:border-primary hover:text-primary transition-colors"
                      aria-label={`${founder.name}'s newsletter`}>
                      <NewsletterIcon />
                    </a>
                  )}
                  {founder.socialLinks?.map(link => {
                    const Icon = SOCIAL_ICON[link.platform] ?? LinkIcon
                    const label = link.platform === 'custom' ? (link.label || 'Link') : SOCIAL_LABEL[link.platform]
                    return (
                      <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-charcoal text-sm hover:border-primary hover:text-primary transition-colors"
                        aria-label={`${founder.name} on ${label}`}>
                        <Icon />{link.platform === 'custom' && <span className="hidden sm:inline">{label}</span>}
                      </a>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="mt-6 max-w-2xl">
              <p className="font-body text-base text-charcoal/80 leading-relaxed">{founder.bio}</p>
            </div>

            {founder.topics.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2" aria-label="Topics">
                {founder.topics.map(topic => (
                  <Badge key={topic.id} label={topic.name} variant="secondary" />
                ))}
              </div>
            )}

            {business && (
              <div className="mt-5">
                <Link to={`/businesses/${business.slug}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-background rounded-xl border border-border text-sm font-medium text-charcoal hover:border-primary hover:text-primary transition-colors"
                  aria-label={`View ${business.name} business profile`}>
                  <div className="w-6 h-6 rounded overflow-hidden flex-shrink-0 bg-border">
                    <img src={business.logo} alt="" className="w-full h-full object-cover" />
                  </div>
                  {business.name}
                  <span className="text-muted text-xs">→</span>
                </Link>
              </div>
            )}

            {/* Create with CULO CTA */}
            <div className="mt-6">
              <CreateWithCuloCTA variant="inline" label="Continue your story with CULO" />
            </div>
          </InnerContainer>
        </div>
      </section>

      {/* ── Evidence strip ──────────────────────────────────────────────────── */}
      <section className="bg-charcoal py-5" aria-label="Authority metrics">
        <InnerContainer>
          <div className="flex flex-wrap gap-6 sm:gap-10">
            {expertiseAreas.length > 0 && (
              <div className="flex flex-col">
                <span className="font-heading text-2xl font-bold text-white">{expertiseAreas.length}</span>
                <span className="font-body text-xs text-white/50 uppercase tracking-wide">Expertise areas</span>
              </div>
            )}
            {resources.length > 0 && (
              <div className="flex flex-col">
                <span className="font-heading text-2xl font-bold text-white">{resources.length}</span>
                <span className="font-body text-xs text-white/50 uppercase tracking-wide">Resources</span>
              </div>
            )}
            {faqs.length > 0 && (
              <div className="flex flex-col">
                <span className="font-heading text-2xl font-bold text-white">{faqs.length}</span>
                <span className="font-body text-xs text-white/50 uppercase tracking-wide">FAQs answered</span>
              </div>
            )}
            {talks.length > 0 && (
              <div className="flex flex-col">
                <span className="font-heading text-2xl font-bold text-white">{talks.length}</span>
                <span className="font-body text-xs text-white/50 uppercase tracking-wide">Talks</span>
              </div>
            )}
            {testimonials.length > 0 && (
              <div className="flex flex-col">
                <span className="font-heading text-2xl font-bold text-white">{testimonials.length}</span>
                <span className="font-body text-xs text-white/50 uppercase tracking-wide">Testimonials</span>
              </div>
            )}
            <div className="flex flex-col">
              <span className="font-heading text-2xl font-bold text-white">{yearsPublishing}+</span>
              <span className="font-body text-xs text-white/50 uppercase tracking-wide">Years publishing</span>
            </div>
            {founder.topics.length > 0 && (
              <div className="flex flex-col">
                <span className="font-heading text-2xl font-bold text-white">{founder.topics.length}</span>
                <span className="font-body text-xs text-white/50 uppercase tracking-wide">Topics</span>
              </div>
            )}
            {trustProfile && trustProfile.overallScore > 0 && (
              <div className="flex flex-col">
                <span
                  className="font-heading text-sm font-bold px-2 py-0.5 rounded-full w-fit"
                  style={{ color: LEVEL_COLORS[trustProfile.trustLevel], backgroundColor: `${LEVEL_COLORS[trustProfile.trustLevel]}22` }}
                >
                  {LEVEL_LABELS[trustProfile.trustLevel]}
                </span>
                <span className="font-body text-xs text-white/50 uppercase tracking-wide mt-1">CULO Trust</span>
              </div>
            )}
          </div>
        </InnerContainer>
      </section>

      {/* ── Main content + sidebar ───────────────────────────────────────────── */}
      <div className="py-14 md:py-16">
        <InnerContainer>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-14">

            {/* ── Left: Primary content ─────────────────────────────────────── */}
            <div className="lg:col-span-2 flex flex-col gap-14">

              {/* Expertise areas */}
              {expertiseAreas.length > 0 && (
                <section aria-labelledby="founder-expertise-heading">
                  <h2 id="founder-expertise-heading" className="font-heading text-2xl font-semibold text-charcoal mb-2">
                    Expertise
                  </h2>
                  <p className="font-body text-sm text-muted mb-5">
                    The domains {founder.name} is known for in CULO Village.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {expertiseAreas.map(area => (
                      <Link
                        key={area.id}
                        to={`/expertise/${area.slug}`}
                        className="group flex flex-col bg-surface rounded-2xl border border-border p-5 hover:border-primary hover:shadow-sm transition-all"
                        aria-label={`Explore ${area.name} expertise`}
                      >
                        <h3 className="font-heading text-base font-semibold text-charcoal group-hover:text-primary transition-colors mb-1">
                          {area.name}
                        </h3>
                        <p className="font-body text-xs text-primary font-medium mb-2">{area.tagline}</p>
                        <p className="font-body text-xs text-muted leading-relaxed line-clamp-2">{area.description}</p>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* FAQ */}
              {faqs.length > 0 && (
                <section aria-labelledby="founder-faq-heading">
                  <h2 id="founder-faq-heading" className="font-heading text-2xl font-semibold text-charcoal mb-2">
                    Questions &amp; Answers
                  </h2>
                  <p className="font-body text-sm text-muted mb-6">
                    Questions {founder.name} answers about their work and expertise.
                  </p>
                  <div className="flex flex-col gap-4">
                    {faqs.map(faq => (
                      <details
                        key={faq.id}
                        className="group bg-surface rounded-2xl border border-border"
                      >
                        <summary className="flex items-center justify-between gap-4 px-6 py-5 cursor-pointer list-none">
                          <h3 className="font-heading text-base font-semibold text-charcoal leading-snug">
                            {faq.question}
                          </h3>
                          <svg
                            className="w-5 h-5 text-muted flex-shrink-0 transition-transform group-open:rotate-180"
                            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </summary>
                        <div className="px-6 pb-5">
                          <p className="font-body text-sm text-charcoal/80 leading-relaxed">{faq.answer}</p>
                          {faq.topicIds.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {faq.topicIds.map(tid => (
                                <span key={tid} className="font-body text-xs bg-secondary/10 text-secondary px-2 py-0.5 rounded-full">
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
              <StoryGrid
                heading={`Stories by ${founder.name}`}
                subheading={`Blogs, reels and carousels published by ${founder.name} through CULO Village.`}
                filter={{ founderId: founder.id, publicOnly: true }}
                columns={2}
                cardVariant="vertical"
                showSummary
                showFounder={false}
                showTopics
                showCTA
                emptyTitle={`No stories yet from ${founder.name}`}
                emptyMessage="This founder hasn't published their first story yet. Check back soon."
              />

              {/* Talks */}
              {talks.length > 0 && (
                <section aria-labelledby="founder-talks-heading">
                  <h2 id="founder-talks-heading" className="font-heading text-2xl font-semibold text-charcoal mb-2">
                    Talks &amp; Presentations
                  </h2>
                  <p className="font-body text-sm text-muted mb-6">
                    Speaking appearances and presentations by {founder.name}.
                  </p>
                  <div className="flex flex-col gap-4">
                    {talks.map(talk => (
                      <article key={talk.id} className="bg-surface rounded-xl border border-border p-5">
                        <h3 className="font-heading text-base font-semibold text-charcoal mb-1 leading-snug">
                          {talk.title}
                        </h3>
                        <p className="font-body text-xs text-primary font-medium mb-2">
                          {talk.event}
                          {talk.location ? ` · ${talk.location}` : ''}
                          {talk.date ? ` · ${new Date(talk.date).toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })}` : ''}
                        </p>
                        <p className="font-body text-sm text-muted leading-relaxed">{talk.description}</p>
                        {talk.videoUrl && (
                          <a href={talk.videoUrl} target="_blank" rel="noopener noreferrer"
                            className="mt-3 inline-block text-sm font-medium text-primary hover:text-[#b05a35] transition-colors">
                            Watch recording →
                          </a>
                        )}
                      </article>
                    ))}
                  </div>
                </section>
              )}

              {/* Testimonials */}
              {testimonials.length > 0 && (
                <section aria-labelledby="founder-testimonials-heading">
                  <h2 id="founder-testimonials-heading" className="font-heading text-2xl font-semibold text-charcoal mb-2">
                    Testimonials
                  </h2>
                  <p className="font-body text-sm text-muted mb-6">
                    What clients and collaborators say about working with {founder.name}.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {testimonials.map(t => (
                      <blockquote key={t.id} className="bg-surface rounded-2xl border border-border p-6 flex flex-col gap-4">
                        <p className="font-body text-sm text-charcoal/80 leading-relaxed italic">
                          "{t.quote}"
                        </p>
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

              {/* Ideas */}
              <IdeaGrid
                heading={`Ideas ${founder.name} talks about`}
                subheading={`Knowledge and insights connected to ${founder.name}'s stories and experiences.`}
                filter={{ founderId: founder.id, publicOnly: true }}
                columns={2}
                cardVariant="default"
                emptyTitle="No ideas linked yet"
                emptyMessage={`Ideas are extracted from published stories. Check back once ${founder.name} publishes more.`}
              />

              {/* Timeline */}
              {founder.timeline && founder.timeline.length > 0 && (
                <section aria-labelledby="founder-timeline-heading">
                  <h2 id="founder-timeline-heading" className="font-heading text-2xl font-semibold text-charcoal mb-6">
                    Timeline
                  </h2>
                  <ol className="relative border-l border-border space-y-8 pl-6" role="list">
                    {[...founder.timeline].sort((a, b) => b.date.localeCompare(a.date)).map(entry => (
                      <li key={entry.id} className="relative" role="listitem">
                        <div className="absolute -left-[1.625rem] top-0.5 w-3 h-3 rounded-full bg-primary ring-4 ring-surface" aria-hidden="true" />
                        <time className="font-body text-xs text-muted font-medium block mb-1" dateTime={entry.date}>
                          {new Date(entry.date).toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })}
                        </time>
                        <h3 className="font-heading text-base font-semibold text-charcoal mb-1">{entry.title}</h3>
                        <p className="font-body text-sm text-muted leading-relaxed">{entry.description}</p>
                        {entry.linkUrl && (
                          <a href={entry.linkUrl} target="_blank" rel="noopener noreferrer"
                            className="mt-1.5 inline-block text-sm font-medium text-primary hover:text-[#b05a35] transition-colors">
                            {entry.linkLabel ?? 'Learn more'} →
                          </a>
                        )}
                      </li>
                    ))}
                  </ol>
                </section>
              )}

              {/* Library */}
              <LibraryGrid
                heading="Library"
                subheading={`Everything ${founder.name} has intentionally published — free and paid.`}
                filter={{ founderId: founder.id }}
                columns={2}
                emptyTitle="Nothing published yet"
                emptyMessage={`${founder.name} hasn't added any Library items yet.`}
              />

              {/* Events */}
              <EventGrid
                heading="Events &amp; Opportunities"
                subheading={`Events, collaborations and opportunities from ${founder.name}.`}
                filter={{ founderId: founder.id }}
                columns={2}
                cardVariant="default"
                emptyTitle="Nothing on the board yet"
                emptyMessage={`${founder.name} hasn't posted any events or opportunities yet.`}
              />

            </div>

            {/* ── Right sidebar ─────────────────────────────────────────────── */}
            <aside className="lg:col-span-1 flex flex-col gap-8" aria-label="Founder details">

              {/* Business card */}
              {business && (
                <section aria-labelledby="founder-business-heading">
                  <h2 id="founder-business-heading" className="font-heading text-lg font-semibold text-charcoal mb-4">Business</h2>
                  <BusinessCard business={business} founder={founder} variant="default" />
                </section>
              )}

              {/* Resources */}
              {resources.length > 0 && (
                <section aria-labelledby="founder-resources-heading">
                  <h2 id="founder-resources-heading" className="font-heading text-lg font-semibold text-charcoal mb-4">Resources</h2>
                  <div className="flex flex-col gap-3">
                    {resources.map(resource => (
                      <a
                        key={resource.id}
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex flex-col bg-surface rounded-xl border border-border p-4 hover:border-primary hover:shadow-sm transition-all"
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
                        <h3 className="font-heading text-sm font-semibold text-charcoal group-hover:text-primary transition-colors mb-1 leading-snug">
                          {resource.title}
                        </h3>
                        <p className="font-body text-xs text-muted leading-relaxed line-clamp-2">{resource.description}</p>
                      </a>
                    ))}
                  </div>
                </section>
              )}

              {/* About */}
              <section className="bg-surface rounded-2xl p-5 border border-border" aria-labelledby="founder-about-heading">
                <h2 id="founder-about-heading" className="font-heading text-base font-semibold text-charcoal mb-4">
                  About {founder.name}
                </h2>
                <dl className="space-y-3 font-body text-sm">
                  <div>
                    <dt className="text-muted text-xs font-medium uppercase tracking-wide mb-1">Location</dt>
                    <dd className="text-charcoal">{founder.location.name}, {founder.location.state}, Australia</dd>
                  </div>
                  <div>
                    <dt className="text-muted text-xs font-medium uppercase tracking-wide mb-1">Industry</dt>
                    <dd className="text-charcoal">{founder.industry.name}</dd>
                  </div>
                  {founder.topics.length > 0 && (
                    <div>
                      <dt className="text-muted text-xs font-medium uppercase tracking-wide mb-1">Topics</dt>
                      <dd>
                        <ul className="flex flex-wrap gap-1.5" role="list">
                          {founder.topics.map(t => (
                            <li key={t.id}><Badge label={t.name} variant="secondary" /></li>
                          ))}
                        </ul>
                      </dd>
                    </div>
                  )}
                  {expertiseAreas.length > 0 && (
                    <div>
                      <dt className="text-muted text-xs font-medium uppercase tracking-wide mb-1">Expertise</dt>
                      <dd>
                        <ul className="flex flex-wrap gap-1.5" role="list">
                          {expertiseAreas.map(area => (
                            <li key={area.id}>
                              <Link
                                to={`/expertise/${area.slug}`}
                                className="font-body text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full hover:bg-primary/20 transition-colors"
                              >
                                {area.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </dd>
                    </div>
                  )}
                  {founder.website && (
                    <div>
                      <dt className="text-muted text-xs font-medium uppercase tracking-wide mb-1">Website</dt>
                      <dd>
                        <a href={founder.website} target="_blank" rel="noopener noreferrer"
                          className="text-primary hover:underline break-all">
                          {founder.website.replace(/^https?:\/\//, '')}
                        </a>
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-muted text-xs font-medium uppercase tracking-wide mb-1">Publishing since</dt>
                    <dd className="text-charcoal">
                      {new Date(founder.createdAt).toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })}
                    </dd>
                  </div>
                </dl>
              </section>

              {/* Approved recommendations */}
              {approvedRecs.length > 0 && (
                <section aria-labelledby="founder-recs-heading">
                  <h2 id="founder-recs-heading" className="font-heading text-lg font-semibold text-charcoal mb-4">
                    Genuine Recommendations
                  </h2>
                  <p className="font-body text-xs text-muted mb-3 leading-relaxed">
                    Tools and businesses {founder.name} has mentioned in stories and approved with a disclosure.
                  </p>
                  <ul className="flex flex-col gap-2.5" role="list">
                    {approvedRecs.map(rec => (
                      <li key={rec.id} className="bg-surface rounded-xl border border-border px-4 py-3">
                        <p className="font-body text-sm font-semibold text-charcoal leading-snug">{rec.entityName}</p>
                        {rec.disclosureText && (
                          <p className="font-body text-xs text-muted mt-1 leading-relaxed line-clamp-2 italic">
                            {rec.disclosureText}
                          </p>
                        )}
                        {rec.businessId && (
                          <TrackedRecommendationLink
                            founderId={rec.founderId}
                            businessId={rec.businessId}
                            recommendationId={rec.id}
                            storyId={rec.storyId}
                            businessWebsite={getBusiness(rec.businessId)?.website}
                            sourcePage="founder"
                            className="font-body text-xs font-semibold text-primary hover:text-[#b05a35] transition-colors mt-2 block"
                          />
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Imported content */}
              {publicImports.length > 0 && (
                <section aria-labelledby="founder-imports-heading">
                  <h2 id="founder-imports-heading" className="font-heading text-lg font-semibold text-charcoal mb-3">
                    From Around the Web
                  </h2>
                  <div className="flex flex-col gap-3">
                    {publicImports.map(item => (
                      <ImportedContentCard key={item.id} content={item} compact />
                    ))}
                  </div>
                </section>
              )}

              {/* Village Intelligence — aggregated across founder's content */}
              {aggregatedIntel && (aggregatedIntel.topics.length > 0 || aggregatedIntel.questions.length > 0) && (
                <section aria-labelledby="founder-intel-heading">
                  <h2 id="founder-intel-heading" className="font-heading text-lg font-semibold text-charcoal mb-4">
                    Village Intelligence
                  </h2>

                  {aggregatedIntel.topics.length > 0 && (
                    <div className="mb-4">
                      <p className="font-body text-[10px] font-medium text-muted uppercase tracking-wide mb-2">Topics covered</p>
                      <div className="flex flex-wrap gap-1.5">
                        {aggregatedIntel.topics.map(t => (
                          <span key={t} className="font-body text-xs px-2.5 py-0.5 rounded-full bg-secondary/10 text-secondary">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {aggregatedIntel.locations.length > 0 && (
                    <div className="mb-4">
                      <p className="font-body text-[10px] font-medium text-muted uppercase tracking-wide mb-2">Locations</p>
                      <div className="flex flex-wrap gap-1.5">
                        {aggregatedIntel.locations.map(l => (
                          <span key={l} className="font-body text-xs px-2.5 py-0.5 rounded-full bg-border text-charcoal/70">
                            {l}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {aggregatedIntel.questions.length > 0 && (
                    <div>
                      <p className="font-body text-[10px] font-medium text-muted uppercase tracking-wide mb-2">Questions this founder answers</p>
                      <ul className="space-y-1.5">
                        {aggregatedIntel.questions.slice(0, 4).map((q, i) => (
                          <li key={i} className="font-body text-xs text-muted leading-relaxed italic pl-2 border-l border-border">
                            {q}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </section>
              )}

              {/* Intel-driven related businesses */}
              {intelRelatedBusinesses.length > 0 && (
                <section aria-labelledby="founder-intel-businesses-heading">
                  <h2 id="founder-intel-businesses-heading" className="font-heading text-lg font-semibold text-charcoal mb-4">
                    Related Businesses
                  </h2>
                  <div className="flex flex-col gap-2">
                    {intelRelatedBusinesses.map(b => {
                      const bFounder = getFounders({ publicOnly: true }).find(f => f.id === b.founderId)
                      return (
                        <Link
                          key={b.id}
                          to={`/businesses/${b.slug}`}
                          className="flex items-center gap-3 bg-surface rounded-xl p-3 border border-border hover:border-primary hover:shadow-sm transition-all group"
                          aria-label={`View ${b.name}`}
                        >
                          <div className="flex-shrink-0 w-9 h-9 rounded-lg overflow-hidden bg-background ring-2 ring-border">
                            {b.logo
                              ? <img src={b.logo} alt="" className="w-full h-full object-cover" loading="lazy" />
                              : <span className="flex items-center justify-center h-full text-muted font-heading text-sm font-semibold">{b.name[0]}</span>
                            }
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-body text-sm font-semibold text-charcoal group-hover:text-primary transition-colors truncate">{b.name}</p>
                            <p className="font-body text-xs text-muted truncate">{bFounder?.name ?? b.industry.name}</p>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </section>
              )}

              {/* Related founders */}
              {(relatedFounders.length > 0 || intelRelatedFounders.length > 0) && (
                <section aria-labelledby="related-founders-heading">
                  <h2 id="related-founders-heading" className="font-heading text-lg font-semibold text-charcoal mb-4">
                    Related Founders
                  </h2>
                  <div className="flex flex-col gap-3" role="list">
                    {[
                      ...relatedFounders,
                      ...intelRelatedFounders.filter(f => !relatedFounders.some(r => r.id === f.id)),
                    ].slice(0, 5).map(related => {
                      const relatedBiz = getBusiness(related.businessId)
                      const isIntelOnly = !relatedFounders.some(r => r.id === related.id)
                      const sharedLocation = related.location.id === founder.location.id
                      const sharedIndustry = related.industry.id === founder.industry.id
                      const sharedLabel = isIntelOnly
                        ? 'Similar topics'
                        : sharedIndustry
                          ? related.industry.name
                          : sharedLocation
                            ? related.location.name
                            : related.topics.find(t => founder.topics.some(ft => ft.id === t.id))?.name ?? ''
                      return (
                        <div key={related.id} role="listitem">
                          <Link
                            to={`/founders/${related.slug}`}
                            className="flex items-center gap-3 bg-surface rounded-xl p-3 border border-border hover:border-primary hover:shadow-sm transition-all group"
                            aria-label={`View ${related.name}'s profile`}
                          >
                            <div className="flex-shrink-0 w-10 h-10 rounded-full overflow-hidden bg-primary/10 ring-2 ring-border">
                              {related.avatar ? (
                                <img src={related.avatar} alt="" className="w-full h-full object-cover" loading="lazy" />
                              ) : (
                                <span className="flex items-center justify-center h-full text-primary font-heading text-sm font-semibold">
                                  {related.name[0]}
                                </span>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-body text-sm font-semibold text-charcoal group-hover:text-primary transition-colors truncate">
                                {related.name}
                              </p>
                              <p className="font-body text-xs text-muted truncate">
                                {relatedBiz?.name ?? related.industry.name}
                              </p>
                            </div>
                            {sharedLabel && (
                              <Badge label={sharedLabel} variant="neutral" className="flex-shrink-0 text-xs" />
                            )}
                          </Link>
                        </div>
                      )
                    })}
                  </div>
                  <Link to="/founders" className="mt-4 block text-center text-sm font-medium text-primary hover:text-[#b05a35] transition-colors">
                    Browse all founders →
                  </Link>
                </section>
              )}

            </aside>
          </div>
        </InnerContainer>
      </div>

    </main>
  )
}
