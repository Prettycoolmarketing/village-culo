// CULO Village — fetch-remote-media Edge Function
//
// Fetches one binary file (image/video) server-side and streams it back as
// the response body, with the real content-type and a permissive CORS
// header so the browser can read it directly as a Blob.
//
// Built specifically for Snapchat Memories import (see snapchatArchive.ts):
// Snapchat's export hands back signed per-memory download links, not
// bundled files — a browser calling fetch() on those directly hits CORS
// (Snapchat's server doesn't send Access-Control-Allow-Origin for this
// site), which silently fails every single one. Confirmed real: a founder
// ran a 589-item import, the progress counter moved through all of them,
// and zero rows actually saved — every fetch failed the same way. Running
// the fetch server-side here has no CORS restriction at all (CORS is a
// browser-only mechanism), so this just works.
//
// Deploy: supabase functions deploy fetch-remote-media --no-verify-jwt

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { safeFetchBinary, SafeFetchError } from '../_shared/safeFetch.ts'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Memory videos run bigger than the 5MB default other fetchers use —
// raised to sit comfortably above Supabase Storage's own upload limit
// (150MB as of this change), with headroom, rather than being the
// bottleneck itself. Still capped so one bad link can't tie up the
// function indefinitely.
const MAX_BYTES = 200_000_000

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })

  try {
    const { url } = await req.json() as { url?: string }
    if (!url?.trim()) {
      return new Response(JSON.stringify({ error: 'Missing url.' }), {
        status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    // A 200MB file genuinely takes longer to transfer than the old 30s
    // allowed for — raised alongside MAX_BYTES so a real large-but-valid
    // file doesn't get cut off mid-download.
    const { bytes, contentType } = await safeFetchBinary(url.trim(), { maxBytes: MAX_BYTES, timeoutMs: 90_000 })
    return new Response(bytes, { headers: { ...CORS_HEADERS, 'Content-Type': contentType } })
  } catch (err) {
    const message = err instanceof SafeFetchError ? err.message : (err instanceof Error ? err.message : 'Could not fetch that file.')
    return new Response(JSON.stringify({ error: message }), {
      status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
