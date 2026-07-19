// CULO Village — resolve-podcast Edge Function
//
// Takes whatever a founder pastes (a direct RSS URL, a podcast website URL,
// an Apple Podcasts show URL, a Spotify show URL, or a plain podcast name)
// and resolves it to one or more candidate podcasts with real, validated
// feed URLs — so the founder never has to go find their own RSS feed
// manually unless every automatic path fails. Every fetch goes through
// safeFetchText (SSRF-safe: blocks localhost/private IPs/cloud metadata,
// enforces timeouts and size caps, validates every redirect hop).
//
// No LLM anywhere in this file — every match is deterministic: direct feed
// validation, HTML <link> discovery, or the free iTunes Search API /
// Spotify oEmbed endpoint (both public, keyless, zero cost).
//
// Deploy: supabase functions deploy resolve-podcast --no-verify-jwt

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { safeFetchText, SafeFetchError } from '../_shared/safeFetch.ts'
import { parsePodcastFeed, looksLikePodcastFeed, PodcastFeedError, type PodcastShow, type PodcastEpisode } from '../_shared/podcastFeed.ts'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

type ConnectionMethod = 'direct-rss' | 'website-discovery' | 'apple-podcasts' | 'spotify' | 'name-search'

interface PodcastCandidate {
  title: string
  description?: string
  artworkUrl?: string
  author?: string
  website?: string
  feedUrl: string
  language?: string
  categories?: string[]
  episodeCount?: number
  latestEpisodeDate?: string
  appleId?: string
  appleUrl?: string
  spotifyUrl?: string
  connectionMethod: ConnectionMethod
}

type ResolveResponse =
  | { status: 'candidates'; candidates: PodcastCandidate[] }
  | { status: 'manual-required'; message: string }
  | { status: 'error'; code: string; message: string }

function json(body: ResolveResponse, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } })
}

async function validateFeed(feedUrl: string): Promise<{ show: PodcastShow; episodes: PodcastEpisode[] } | null> {
  try {
    const xml = await safeFetchText(feedUrl, { maxBytes: 8_000_000, timeoutMs: 12_000 })
    if (!looksLikePodcastFeed(xml)) return null
    return parsePodcastFeed(xml)
  } catch {
    return null
  }
}

function candidateFrom(show: PodcastShow, episodes: PodcastEpisode[], feedUrl: string, method: ConnectionMethod, extra: Partial<PodcastCandidate> = {}): PodcastCandidate {
  const latest = episodes.map(e => e.publishedAt).filter((d): d is string => !!d).sort().reverse()[0]
  return {
    title: show.title,
    description: show.description,
    artworkUrl: show.artworkUrl,
    author: show.author,
    website: show.website,
    feedUrl,
    language: show.language,
    categories: show.categories,
    episodeCount: episodes.length,
    latestEpisodeDate: latest,
    connectionMethod: method,
    ...extra,
  }
}

// ─── iTunes Search API — free, keyless, no signup ────────────────────────────

interface ITunesResult {
  collectionName?: string
  artistName?: string
  artworkUrl600?: string
  feedUrl?: string
  collectionViewUrl?: string
  collectionId?: number
  trackCount?: number
  releaseDate?: string
  genres?: string[]
}

async function itunesSearch(term: string, limit = 8): Promise<ITunesResult[]> {
  const url = `https://itunes.apple.com/search?media=podcast&entity=podcast&limit=${limit}&term=${encodeURIComponent(term)}`
  const body = await safeFetchText(url, { timeoutMs: 8000 })
  const json = JSON.parse(body) as { results?: ITunesResult[] }
  return json.results ?? []
}

async function itunesLookupById(id: string): Promise<ITunesResult | null> {
  const url = `https://itunes.apple.com/lookup?id=${encodeURIComponent(id)}&entity=podcast`
  const body = await safeFetchText(url, { timeoutMs: 8000 })
  const json = JSON.parse(body) as { results?: ITunesResult[] }
  return json.results?.[0] ?? null
}

async function candidatesFromItunesResults(results: ITunesResult[], method: ConnectionMethod, extra: (r: ITunesResult) => Partial<PodcastCandidate> = () => ({})): Promise<PodcastCandidate[]> {
  const withFeed = results.filter(r => r.feedUrl)
  // Validate a bounded number of top results against their real feed — richer
  // confirmation data (episode count, latest date), and filters out anything
  // iTunes still lists but whose feed has actually gone dead.
  const validated = await Promise.all(
    withFeed.slice(0, 5).map(async r => {
      const parsed = await validateFeed(r.feedUrl!)
      if (!parsed) return null
      return candidateFrom(parsed.show, parsed.episodes, r.feedUrl!, method, {
        title: r.collectionName ?? parsed.show.title,
        author: r.artistName ?? parsed.show.author,
        artworkUrl: r.artworkUrl600 ?? parsed.show.artworkUrl,
        appleId: r.collectionId ? String(r.collectionId) : undefined,
        appleUrl: r.collectionViewUrl,
        categories: r.genres ?? parsed.show.categories,
        ...extra(r),
      })
    })
  )
  return validated.filter((c): c is PodcastCandidate => c !== null)
}

// ─── Spotify oEmbed — public, keyless ─────────────────────────────────────────

async function spotifyOEmbedTitle(spotifyUrl: string): Promise<string | null> {
  try {
    const body = await safeFetchText(`https://open.spotify.com/oembed?url=${encodeURIComponent(spotifyUrl)}`, { timeoutMs: 8000 })
    const data = JSON.parse(body) as { title?: string }
    return data.title ?? null
  } catch {
    return null
  }
}

// ─── Website feed discovery ───────────────────────────────────────────────────

function discoverFeedLinksInHtml(html: string, pageUrl: string): string[] {
  const links = html.match(/<link\b[^>]*>/gi) ?? []
  const found: string[] = []
  for (const tag of links) {
    const isFeed = /rel=["']alternate["']/i.test(tag) && /type=["']application\/(rss|atom)\+xml["']/i.test(tag)
    if (!isFeed) continue
    const hrefMatch = tag.match(/href=["']([^"']+)["']/i)
    if (!hrefMatch) continue
    try {
      found.push(new URL(hrefMatch[1]!, pageUrl).toString())
    } catch { /* ignore malformed href */ }
  }
  return found
}

const COMMON_FEED_PATHS = ['/feed', '/feed.xml', '/rss', '/rss.xml', '/podcast.rss', '/feed/podcast']

async function discoverWebsiteFeeds(pageUrl: string): Promise<PodcastCandidate[]> {
  const html = await safeFetchText(pageUrl, { timeoutMs: 10000 })
  const linkFeeds = discoverFeedLinksInHtml(html, pageUrl)

  const origin = new URL(pageUrl).origin
  const probeFeeds = linkFeeds.length > 0 ? [] : COMMON_FEED_PATHS.map(p => `${origin}${p}`)

  const candidateUrls = [...new Set([...linkFeeds, ...probeFeeds])].slice(0, 8)
  const results = await Promise.all(candidateUrls.map(async feedUrl => {
    const parsed = await validateFeed(feedUrl)
    if (!parsed) return null
    return candidateFrom(parsed.show, parsed.episodes, feedUrl, 'website-discovery', { website: pageUrl })
  }))
  return results.filter((c): c is PodcastCandidate => c !== null)
}

// ─── Main resolution ───────────────────────────────────────────────────────────

async function resolve(input: string): Promise<ResolveResponse> {
  const trimmed = input.trim()
  if (!trimmed) return { status: 'error', code: 'empty-input', message: 'Enter a podcast URL or name.' }

  let url: URL | null = null
  try { url = new URL(trimmed) } catch { url = null }

  if (url && (url.protocol === 'http:' || url.protocol === 'https:')) {
    // A. Apple Podcasts
    if (/podcasts\.apple\.com$/i.test(url.hostname.replace(/^www\./, ''))) {
      const idMatch = trimmed.match(/id(\d+)/)
      if (!idMatch) return { status: 'error', code: 'apple-id-not-found', message: 'Could not find a podcast ID in that Apple Podcasts URL.' }
      const result = await itunesLookupById(idMatch[1]!)
      if (!result?.feedUrl) return { status: 'manual-required', message: 'Found this podcast on Apple Podcasts but couldn’t confirm its RSS feed. Paste the feed URL manually.' }
      const candidates = await candidatesFromItunesResults([result], 'apple-podcasts')
      return candidates.length > 0
        ? { status: 'candidates', candidates }
        : { status: 'manual-required', message: 'Found this podcast on Apple Podcasts but its feed didn’t validate. Paste the RSS feed manually.' }
    }

    // B. Spotify
    if (/open\.spotify\.com$/i.test(url.hostname.replace(/^www\./, '')) && /\/show\//.test(url.pathname)) {
      const title = await spotifyOEmbedTitle(trimmed)
      if (!title) return { status: 'manual-required', message: 'Could not read this Spotify show. Paste the RSS feed manually if you have it, or try the podcast name instead.' }
      const results = await itunesSearch(title, 5)
      const candidates = await candidatesFromItunesResults(results, 'spotify', () => ({ spotifyUrl: trimmed }))
      return candidates.length > 0
        ? { status: 'candidates', candidates }
        : { status: 'manual-required', message: `Found "${title}" on Spotify but couldn’t match it to a podcast directory feed. Paste the RSS feed manually.` }
    }

    // C. Try as a direct feed first
    const direct = await validateFeed(trimmed)
    if (direct) {
      return { status: 'candidates', candidates: [candidateFrom(direct.show, direct.episodes, trimmed, 'direct-rss')] }
    }

    // D. Fall back to website feed discovery
    try {
      const discovered = await discoverWebsiteFeeds(trimmed)
      if (discovered.length > 0) return { status: 'candidates', candidates: discovered }
    } catch { /* fall through to manual */ }

    return { status: 'manual-required', message: 'Could not automatically find a podcast feed on that page. Paste the RSS feed URL manually if you have it.' }
  }

  // E. Treat as a podcast name
  const results = await itunesSearch(trimmed, 8)
  if (results.length === 0) return { status: 'manual-required', message: `No podcasts found for "${trimmed}". Try pasting the show's URL or RSS feed instead.` }
  const candidates = await candidatesFromItunesResults(results, 'name-search')
  return candidates.length > 0
    ? { status: 'candidates', candidates }
    : { status: 'manual-required', message: `Found possible matches for "${trimmed}" but none had a working feed. Try pasting the show's URL or RSS feed instead.` }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS })

  try {
    const { input } = await req.json()
    if (!input || typeof input !== 'string') {
      return json({ status: 'error', code: 'missing-input', message: 'Missing "input" in request body.' }, 400)
    }
    const result = await resolve(input)
    return json(result)
  } catch (err) {
    if (err instanceof SafeFetchError || err instanceof PodcastFeedError) {
      return json({ status: 'error', code: 'fetch-failed', message: err.message }, 200)
    }
    return json({ status: 'error', code: 'unknown', message: err instanceof Error ? err.message : 'Could not resolve this podcast.' }, 500)
  }
})
