// Generated once, automatically, the moment a piece is actually published —
// never regenerated on a later title edit, so a URL already shared, linked
// or indexed never silently breaks. Capped to a sane length: search engines
// and AI answer engines both weight the words near the start of a URL more
// than ones buried past ~80 characters, and an overlong slug reads as
// spammy rather than descriptive.
// Was 70 — confirmed real: "Inside Pructon: The Engineering Company Sam
// Gerrard Built From Mount Isa" slugified to exactly 71 characters, one
// over the old limit, so the word-boundary-safe cut below (correctly, by
// its own logic) dropped the entire last word rather than cut mid-word —
// silently losing "Isa" off "Mount Isa", a real place name, from the URL,
// while 67 of the 70 allowed characters sat unused. 80 gives enough room
// that losing a whole trailing word for being a handful of characters
// over becomes rare instead of a near-miss like this one.
const MAX_SLUG_LENGTH = 80

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
