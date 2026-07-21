// Free, deterministic (no API) generator for YouTube channel / podcast show
// descriptions — built from a handful of short answers instead of a blank
// page. Village has no write access to YouTube Studio or a podcast host, so
// this can't push the result live; it produces text the founder copies in
// themselves. Optimised for each platform's own conventions: YouTube's first
// ~150 characters are what show before "...more", so the pitch goes first;
// podcast descriptions read as a pitch for a show, not a channel.

export interface DescriptionAnswers {
  whatItsAbout: string  // one-sentence pitch
  audience: string      // who it's for
  uniqueAngle: string   // what makes it different / the format
  keywords: string      // comma-separated topics/keywords, for search
  cta: string           // what you want a viewer/listener to do
  ctaUrl: string         // link for the CTA, optional
}

function keywordList(keywords: string): string[] {
  return keywords.split(',').map(k => k.trim()).filter(Boolean)
}

function clean(text: string): string {
  return text.trim().replace(/\s+/g, ' ')
}

export function generateYouTubeDescription(a: DescriptionAnswers, name: string): string {
  const lines: string[] = []

  lines.push(clean(a.whatItsAbout))

  const audienceLine = [
    a.audience && `Made for ${clean(a.audience)}.`,
    a.uniqueAngle && clean(a.uniqueAngle),
  ].filter(Boolean).join(' ')
  if (audienceLine) lines.push(audienceLine)

  const kws = keywordList(a.keywords)
  if (kws.length > 0) {
    lines.push(`On this channel, ${name} covers: ${kws.join(', ')}.`)
  }

  if (a.cta) {
    lines.push(`${clean(a.cta)}${a.ctaUrl ? ` → ${a.ctaUrl.trim()}` : ''}`)
  }

  if (kws.length > 0) {
    lines.push(kws.map(k => `#${k.replace(/[^a-zA-Z0-9]/g, '')}`).filter(h => h.length > 1).slice(0, 5).join(' '))
  }

  return lines.join('\n\n')
}

export function generatePodcastDescription(a: DescriptionAnswers, name: string): string {
  const lines: string[] = []

  lines.push(clean(a.whatItsAbout))

  const hostLine = [
    `Hosted by ${name}${a.audience ? `, for ${clean(a.audience)}` : ''}.`,
    a.uniqueAngle && clean(a.uniqueAngle),
  ].filter(Boolean).join(' ')
  lines.push(hostLine)

  const kws = keywordList(a.keywords)
  if (kws.length > 0) {
    lines.push(`Topics covered: ${kws.join(', ')}.`)
  }

  if (a.cta) {
    lines.push(`${clean(a.cta)}${a.ctaUrl ? ` ${a.ctaUrl.trim()}` : ''}`)
  }

  return lines.join('\n\n')
}
