// Generated once, automatically, the moment a piece is actually published —
// never regenerated on a later title edit, so a URL already shared, linked
// or indexed never silently breaks. Capped to a sane length: search engines
// and AI answer engines both weight the words near the start of a URL more
// than ones buried past ~70 characters, and an overlong slug reads as
// spammy rather than descriptive.
const MAX_SLUG_LENGTH = 70

export function slugify(text: string): string {
  const full = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .trim()
  if (full.length <= MAX_SLUG_LENGTH) return full
  // Cut at the last whole word inside the limit rather than mid-word.
  const cut = full.slice(0, MAX_SLUG_LENGTH)
  const lastDash = cut.lastIndexOf('-')
  return (lastDash > 0 ? cut.slice(0, lastDash) : cut).replace(/-+$/g, '')
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function contentTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    blog:             'Blog',
    reel:             'Reel',
    carousel:         'Carousel',
    podcast:          'Podcast',
    'talking-head':   'Talking Head',
    'voice-over':     'Voice Over',
    'photo-story':    'Photo Story',
    document:         'Document',
    'external-article': 'External Article',
    'youtube-video':  'YouTube Video',
    'social-post':    'Social Post',
  }
  return labels[type] ?? type
}

export function noticeTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    event: 'Event',
    collaboration: 'Collaboration',
    opportunity: 'Opportunity',
    request: 'Request',
  }
  return labels[type] ?? type
}
