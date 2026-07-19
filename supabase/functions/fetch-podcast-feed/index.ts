// CULO Village — fetch-podcast-feed Edge Function
//
// Given an already-confirmed podcast RSS feed URL, fetches the full episode
// catalogue plus current show metadata. Used both right after a founder
// confirms a podcast (to populate the episode-selection screen) and on every
// subsequent manual/auto sync (services/connectors/podcastRss.ts). Distinct
// from the older generic fetch-feed function — this one returns podcast-
// specific fields (GUID, enclosure, duration, season/episode, transcript,
// chapters) that a generic blog/website feed will never have.
//
// Deploy: supabase functions deploy fetch-podcast-feed --no-verify-jwt

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { safeFetchText, SafeFetchError } from '../_shared/safeFetch.ts'
import { parsePodcastFeed, looksLikePodcastFeed, PodcastFeedError } from '../_shared/podcastFeed.ts'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS })

  try {
    const { feedUrl } = await req.json()
    if (!feedUrl || typeof feedUrl !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing "feedUrl" in request body.' }), {
        status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    const xml = await safeFetchText(feedUrl, { maxBytes: 15_000_000, timeoutMs: 15_000 })
    if (!looksLikePodcastFeed(xml)) {
      return new Response(JSON.stringify({ error: 'This feed doesn’t look like a podcast feed.' }), {
        status: 422, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    const { show, episodes } = parsePodcastFeed(xml)
    return new Response(JSON.stringify({ show, episodes }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof SafeFetchError || err instanceof PodcastFeedError
      ? err.message
      : err instanceof Error ? err.message : 'Could not fetch or parse this podcast feed.'
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
