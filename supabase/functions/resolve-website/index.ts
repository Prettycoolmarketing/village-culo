// CULO Village — resolve-website Edge Function
//
// The website/blog equivalent of resolve-podcast's discovery step: paste a
// website URL, Village finds its RSS/Atom feed automatically (via <link
// rel="alternate"> discovery, falling back to common feed paths), instead
// of requiring the founder to already know their own feed URL. If the
// pasted input already looks like a direct feed, it's validated and
// returned immediately. No LLM — pure HTML parsing.
//
// Deploy: supabase functions deploy resolve-website --no-verify-jwt

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { safeFetchText, SafeFetchError } from '../_shared/safeFetch.ts'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface FeedCandidate {
  title: string
  feedUrl: string
  website?: string
  itemCount: number
}

type ResolveResponse =
  | { status: 'candidates'; candidates: FeedCandidate[] }
  | { status: 'manual-required'; message: string }
  | { status: 'error'; message: string }

function json(body: ResolveResponse, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } })
}

function textBetween(block: string, tag: string): string | undefined {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'))
  if (!match) return undefined
  return match[1]
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Generic RSS/Atom validity — deliberately not podcast-specific (no itunes:
// namespace / audio-enclosure requirement like resolve-podcast's
// looksLikePodcastFeed) since a blog feed never has those.
function looksLikeFeed(xml: string): boolean {
  const isRss  = /<rss[\s>]/i.test(xml) && /<item[\s>]/i.test(xml)
  const isAtom = /<feed[\s>]/i.test(xml) && /<entry[\s>]/i.test(xml)
  return isRss || isAtom
}

function countItems(xml: string): number {
  return (xml.match(/<item[\s>]/gi) ?? xml.match(/<entry[\s>]/gi) ?? []).length
}

async function validateFeed(feedUrl: string): Promise<FeedCandidate | null> {
  try {
    const xml = await safeFetchText(feedUrl, { maxBytes: 8_000_000, timeoutMs: 10_000 })
    if (!looksLikeFeed(xml)) return null
    const channelMatch = xml.match(/<channel[\s>][\s\S]*?<\/channel>/i)
    const block = channelMatch?.[0] ?? xml
    return {
      title: textBetween(block, 'title') ?? 'Untitled feed',
      feedUrl,
      website: textBetween(block, 'link'),
      itemCount: countItems(xml),
    }
  } catch {
    return null
  }
}

function discoverFeedLinksInHtml(html: string, pageUrl: string): string[] {
  const links = html.match(/<link\b[^>]*>/gi) ?? []
  const found: string[] = []
  for (const tag of links) {
    const isFeed = /rel=["']alternate["']/i.test(tag) && /type=["']application\/(rss|atom)\+xml["']/i.test(tag)
    if (!isFeed) continue
    const hrefMatch = tag.match(/href=["']([^"']+)["']/i)
    if (!hrefMatch) continue
    try { found.push(new URL(hrefMatch[1]!, pageUrl).toString()) } catch { /* ignore */ }
  }
  return found
}

const COMMON_FEED_PATHS = ['/feed', '/feed.xml', '/rss', '/rss.xml', '/blog/feed', '/index.xml', '/atom.xml']

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS })

  try {
    const { input } = await req.json()
    if (!input || typeof input !== 'string' || !input.trim()) {
      return json({ status: 'error', message: 'Enter a website or feed URL.' }, 400)
    }
    const trimmed = input.trim()

    let url: URL
    try { url = new URL(trimmed) } catch {
      return json({ status: 'error', message: 'That doesn’t look like a valid URL.' })
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return json({ status: 'error', message: 'Only http and https URLs are supported.' })
    }

    // Already a direct feed?
    const direct = await validateFeed(trimmed)
    if (direct) return json({ status: 'candidates', candidates: [direct] })

    // Otherwise treat as a website — discover its feed.
    const html = await safeFetchText(trimmed, { timeoutMs: 10_000 })
    const linkFeeds = discoverFeedLinksInHtml(html, trimmed)
    const probeFeeds = linkFeeds.length > 0 ? [] : COMMON_FEED_PATHS.map(p => `${url.origin}${p}`)
    const candidateUrls = [...new Set([...linkFeeds, ...probeFeeds])].slice(0, 8)

    const results = await Promise.all(candidateUrls.map(validateFeed))
    const candidates = results.filter((c): c is FeedCandidate => c !== null)

    if (candidates.length > 0) return json({ status: 'candidates', candidates })
    return json({ status: 'manual-required', message: 'Could not automatically find a feed on that site. Paste the direct RSS/Atom feed URL if you have it.' })
  } catch (err) {
    if (err instanceof SafeFetchError) return json({ status: 'error', message: err.message })
    return json({ status: 'error', message: err instanceof Error ? err.message : 'Could not resolve this website.' }, 500)
  }
})
