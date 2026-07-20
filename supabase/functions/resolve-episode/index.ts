// CULO Village — resolve-episode Edge Function
//
// The RSS-free path for a single podcast episode: paste one Spotify or
// Apple Podcasts *episode* URL, get back its title/artwork and a real
// embeddable player URL — no feed, no catalogue, no bulk import. For
// bringing in a whole show's back-catalogue, "Connect your podcast"
// (resolve-podcast) is still the right tool; this is for a founder who just
// wants to feature one episode and write their own blog about it.
//
// No LLM: Spotify's public oEmbed endpoint (keyless) for Spotify episodes;
// a safe server-side fetch + og:title/og:image extraction for Apple
// Podcasts episodes (which has no oEmbed equivalent).
//
// Deploy: supabase functions deploy resolve-episode --no-verify-jwt

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { safeFetchText, SafeFetchError } from '../_shared/safeFetch.ts'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

type EpisodePlatform = 'spotify' | 'apple'

interface ResolvedEpisode {
  title: string
  thumbnailUrl?: string
  embedUrl: string
  platform: EpisodePlatform
}

type ResolveResponse = { episode: ResolvedEpisode } | { error: string }

function json(body: ResolveResponse, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } })
}

function metaContent(html: string, property: string): string | undefined {
  const match = html.match(new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'))
    ?? html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, 'i'))
  return match?.[1]
}

async function resolveSpotifyEpisode(url: string, episodeId: string): Promise<ResolvedEpisode> {
  const body = await safeFetchText(`https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`, { timeoutMs: 8000 })
  const data = JSON.parse(body) as { title?: string; thumbnail_url?: string }
  return {
    title: data.title ?? 'Untitled episode',
    thumbnailUrl: data.thumbnail_url,
    embedUrl: `https://open.spotify.com/embed/episode/${episodeId}`,
    platform: 'spotify',
  }
}

async function resolveAppleEpisode(url: string): Promise<ResolvedEpisode> {
  const html = await safeFetchText(url, { timeoutMs: 8000 })
  const title = metaContent(html, 'og:title')
  if (!title) throw new Error('Could not read this Apple Podcasts episode page.')
  const thumbnailUrl = metaContent(html, 'og:image')

  const parsed = new URL(url)
  const embedUrl = `https://embed.podcasts.apple.com${parsed.pathname}${parsed.search}`

  return { title, thumbnailUrl, embedUrl, platform: 'apple' }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS })

  try {
    const { url } = await req.json()
    if (!url || typeof url !== 'string') return json({ error: 'Missing "url" in request body.' }, 400)

    let parsed: URL
    try { parsed = new URL(url) } catch { return json({ error: 'That URL is not valid.' }, 400) }
    const host = parsed.hostname.replace(/^www\./, '')

    if (host === 'open.spotify.com') {
      const episodeMatch = parsed.pathname.match(/\/episode\/([a-zA-Z0-9]+)/)
      if (!episodeMatch) {
        return json({ error: 'That looks like a Spotify link, but not to a specific episode. Paste a link to one episode (open.spotify.com/episode/...).' })
      }
      const episode = await resolveSpotifyEpisode(url, episodeMatch[1]!)
      return json({ episode })
    }

    if (host === 'podcasts.apple.com') {
      if (!parsed.searchParams.get('i')) {
        return json({ error: 'That looks like an Apple Podcasts show link, not a specific episode. Open the episode itself and copy its link (it has "?i=" in the URL).' })
      }
      const episode = await resolveAppleEpisode(url)
      return json({ episode })
    }

    return json({ error: 'Only Spotify or Apple Podcasts episode links are supported here. For a whole show, use "Connect your podcast" instead.' })
  } catch (err) {
    if (err instanceof SafeFetchError) return json({ error: err.message })
    return json({ error: err instanceof Error ? err.message : 'Could not resolve this episode.' }, 500)
  }
})
