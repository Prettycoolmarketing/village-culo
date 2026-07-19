// Shared RSS/Atom parsing for podcast feeds — used by resolve-podcast (to
// validate a candidate before showing it for confirmation) and
// fetch-podcast-feed (to pull the full episode catalogue once connected).
// Deliberately regex-based text extraction rather than a full XML DOM
// parser (matches the existing fetch-feed function's approach) — podcast
// RSS is a shallow, well-known shape, and this avoids pulling in a DOM
// dependency for a Deno edge runtime. Every extracted field either comes
// straight from a tag in the feed or is left undefined — nothing invented.

export interface PodcastEpisode {
  originalUrl: string
  title: string
  description?: string
  showNotes?: string
  publishedAt?: string
  thumbnailUrl?: string
  episodeGuid?: string
  enclosureUrl?: string
  enclosureType?: string
  durationSeconds?: number
  episodeNumber?: number
  seasonNumber?: number
  episodeKind?: 'full' | 'trailer' | 'bonus'
  explicit?: boolean
  chapters?: { title: string; startSeconds: number }[]
  transcriptUrl?: string
}

export interface PodcastShow {
  title: string
  description?: string
  artworkUrl?: string
  author?: string
  website?: string
  language?: string
  categories?: string[]
  lastBuildDate?: string
}

export class PodcastFeedError extends Error {}

// Defense in depth against XML entity-expansion attacks — regex extraction
// never evaluates entities, but a DOCTYPE/ENTITY declaration in a feed
// claiming to be a podcast is itself a red flag worth rejecting outright.
function rejectUnsafeXml(xml: string) {
  if (/<!DOCTYPE/i.test(xml) || /<!ENTITY/i.test(xml)) {
    throw new PodcastFeedError('This feed uses an unsupported XML feature and can’t be read safely.')
  }
}

const HTML_ENTITIES: Record<string, string> = {
  '&amp;': '&', '&nbsp;': ' ', '&quot;': '"', '&apos;': "'",
  '&lt;': '<', '&gt;': '>', '&#39;': "'", '&#8217;': '’', '&#8216;': '‘',
  '&#8220;': '“', '&#8221;': '”', '&#8211;': '–', '&#8212;': '—',
}

function decodeEntities(text: string): string {
  return text.replace(/&#?\w+;/g, m => HTML_ENTITIES[m] ?? m)
}

function textBetween(block: string, tag: string): string | undefined {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'))
  if (!match) return undefined
  return decodeEntities(
    match[1]
      // Unanchored and global — some feed generators emit trailing
      // whitespace or even a duplicated "]]>" after the real CDATA close,
      // which an anchored ^...$ match silently fails on, leaking the raw
      // "]]>" into the output.
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\]\]>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  )
}

function attrOf(block: string, tag: string, attr: string): string | undefined {
  const match = block.match(new RegExp(`<${tag}[^>]*\\b${attr}=["']([^"']+)["'][^>]*\\/?>`, 'i'))
  return match?.[1]
}

function linkOf(block: string): string | undefined {
  const rss = textBetween(block, 'link')
  if (rss) return rss
  return attrOf(block, 'link', 'href')
}

// "1:02:03", "62:03", or plain seconds ("3723") — iTunes allows any of these.
function parseDuration(raw?: string): number | undefined {
  if (!raw) return undefined
  const trimmed = raw.trim()
  if (/^\d+$/.test(trimmed)) return Number(trimmed)
  const parts = trimmed.split(':').map(Number)
  if (parts.some(Number.isNaN)) return undefined
  return parts.reduce((total, part) => total * 60 + part, 0)
}

function parseChapters(block: string): { title: string; startSeconds: number }[] | undefined {
  // podcast:chapters points at an external JSON file we won't fetch a second
  // time here — only inline psc:chapter elements (an older convention) are
  // parsed directly from the item itself.
  const chapterBlocks = block.match(/<psc:chapter[^>]*\/?>/gi)
  if (!chapterBlocks || chapterBlocks.length === 0) return undefined
  const chapters = chapterBlocks.map(c => {
    const title = attrOf(c, 'psc:chapter', 'title') ?? ''
    const start = attrOf(c, 'psc:chapter', 'start')
    return { title, startSeconds: parseDuration(start) ?? 0 }
  }).filter(c => c.title)
  return chapters.length > 0 ? chapters : undefined
}

/** True when the feed has real podcast signals (iTunes namespace or audio enclosures), not just a generic blog RSS. */
export function looksLikePodcastFeed(xml: string): boolean {
  return /<itunes:/i.test(xml) || /<enclosure[^>]+type=["']audio/i.test(xml) || /<enclosure[^>]+type=["']video/i.test(xml)
}

export function parsePodcastFeed(xml: string): { show: PodcastShow; episodes: PodcastEpisode[] } {
  rejectUnsafeXml(xml)

  const isAtom = /<feed[\s>]/i.test(xml) && !/<rss[\s>]/i.test(xml)
  if (isAtom) {
    throw new PodcastFeedError('This looks like an Atom feed, not a podcast RSS feed.')
  }

  const channelMatch = xml.match(/<channel[\s>][\s\S]*?<\/channel>/i)
  const channelBlock = channelMatch?.[0] ?? xml

  const categories = Array.from(channelBlock.matchAll(/<itunes:category[^>]*\btext=["']([^"']+)["']/gi)).map(m => m[1]!)

  const show: PodcastShow = {
    title: textBetween(channelBlock, 'title') ?? 'Untitled podcast',
    description: textBetween(channelBlock, 'description') ?? textBetween(channelBlock, 'itunes:summary'),
    artworkUrl: attrOf(channelBlock, 'itunes:image', 'href') ?? textBetween(channelBlock, 'url'),
    author: textBetween(channelBlock, 'itunes:author') ?? textBetween(channelBlock, 'managingEditor'),
    website: linkOf(channelBlock),
    language: textBetween(channelBlock, 'language'),
    categories: categories.length > 0 ? categories : undefined,
    lastBuildDate: textBetween(channelBlock, 'lastBuildDate') ?? textBetween(channelBlock, 'pubDate'),
  }

  const itemBlocks = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) ?? []
  const episodes: PodcastEpisode[] = itemBlocks.map(block => {
    const enclosureUrl = attrOf(block, 'enclosure', 'url')
    const episodeKindRaw = textBetween(block, 'itunes:episodeType')?.toLowerCase()
    const transcriptUrl = attrOf(block, 'podcast:transcript', 'url')

    return {
      originalUrl: linkOf(block) ?? enclosureUrl ?? '',
      title: textBetween(block, 'title') ?? 'Untitled episode',
      description: textBetween(block, 'description') ?? textBetween(block, 'itunes:summary'),
      showNotes: textBetween(block, 'content:encoded'),
      publishedAt: textBetween(block, 'pubDate'),
      thumbnailUrl: attrOf(block, 'itunes:image', 'href'),
      episodeGuid: textBetween(block, 'guid'),
      enclosureUrl,
      enclosureType: attrOf(block, 'enclosure', 'type'),
      durationSeconds: parseDuration(textBetween(block, 'itunes:duration')),
      episodeNumber: textBetween(block, 'itunes:episode') ? Number(textBetween(block, 'itunes:episode')) : undefined,
      seasonNumber: textBetween(block, 'itunes:season') ? Number(textBetween(block, 'itunes:season')) : undefined,
      episodeKind: episodeKindRaw === 'trailer' || episodeKindRaw === 'bonus' ? episodeKindRaw : episodeKindRaw === 'full' ? 'full' : undefined,
      explicit: /^(yes|true|explicit)$/i.test(textBetween(block, 'itunes:explicit') ?? ''),
      chapters: parseChapters(block),
      transcriptUrl,
    }
  }).filter(ep => ep.originalUrl)

  return { show, episodes }
}
