import { normalizeUrl } from '../../utils/url'
import type { Founder } from '../../types'

// Extracted out of FounderProfilePage so the exact same social-links row
// (website/Instagram/LinkedIn/YouTube/TikTok/podcast/newsletter/custom
// links, all pulled from the same Founder fields CAPO fills in on the
// Founder Management edit form) can also appear on a founder's individual
// article pages, not just their main profile — a reader who lands on one
// article via search/AI citation never sees the founder's own links
// otherwise, since they may never click through to the full profile.

function WebIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
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

export function FounderSocialLinks({ founder, bookingUrl }: { founder: Founder; bookingUrl?: string }) {
  const hasAny = bookingUrl || founder.website || founder.instagram || founder.linkedin || founder.youtube
    || founder.tiktok || founder.podcast || founder.newsletter || (founder.socialLinks && founder.socialLinks.length > 0)
  if (!hasAny) return null

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {bookingUrl && (
        <a href={normalizeUrl(bookingUrl)} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-[#b05a35] transition-colors"
          aria-label={`Book a call with ${founder.name}`}>
          <CalendarIcon /><span>Book a call</span>
        </a>
      )}
      {founder.website && (
        <a href={normalizeUrl(founder.website)} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-charcoal text-sm font-medium hover:border-primary hover:text-primary transition-colors"
          aria-label={`Visit ${founder.name}'s website`}>
          <WebIcon /><span className="hidden sm:inline">Website</span>
        </a>
      )}
      {founder.instagram && (
        <a href={normalizeUrl(founder.instagram)} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-charcoal text-sm hover:border-primary hover:text-primary transition-colors"
          aria-label={`${founder.name} on Instagram`}>
          <InstagramIcon />
        </a>
      )}
      {founder.linkedin && (
        <a href={normalizeUrl(founder.linkedin)} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-charcoal text-sm hover:border-primary hover:text-primary transition-colors"
          aria-label={`${founder.name} on LinkedIn`}>
          <LinkedInIcon />
        </a>
      )}
      {founder.youtube && (
        <a href={normalizeUrl(founder.youtube)} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-charcoal text-sm hover:border-red-500 hover:text-red-500 transition-colors"
          aria-label={`${founder.name} on YouTube`}>
          <YouTubeIcon />
        </a>
      )}
      {founder.tiktok && (
        <a href={normalizeUrl(founder.tiktok)} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-charcoal text-sm hover:border-primary hover:text-primary transition-colors"
          aria-label={`${founder.name} on TikTok`}>
          <TikTokIcon />
        </a>
      )}
      {founder.podcast && (
        <a href={normalizeUrl(founder.podcast)} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-charcoal text-sm hover:border-purple-500 hover:text-purple-500 transition-colors"
          aria-label={`${founder.name}'s podcast`}>
          <PodcastIcon />
        </a>
      )}
      {founder.newsletter && (
        <a href={normalizeUrl(founder.newsletter)} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-charcoal text-sm hover:border-primary hover:text-primary transition-colors"
          aria-label={`${founder.name}'s newsletter`}>
          <NewsletterIcon />
        </a>
      )}
      {founder.socialLinks?.map(link => {
        const Icon = SOCIAL_ICON[link.platform] ?? LinkIcon
        const label = link.platform === 'custom' ? (link.label || 'Link') : SOCIAL_LABEL[link.platform]
        return (
          <a key={link.id} href={normalizeUrl(link.url)} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-charcoal text-sm hover:border-primary hover:text-primary transition-colors"
            aria-label={`${founder.name} on ${label}`}>
            <Icon />{link.platform === 'custom' && <span className="hidden sm:inline">{label}</span>}
          </a>
        )
      })}
    </div>
  )
}
