// CULO Village — backfill-youtube-thumbnails Edge Function
//
// One-time (re-runnable, idempotent) fix for YouTube-sourced imported_content
// rows saved with no thumbnailUrl — the VIF/bulk-import path never derived
// one (self-serve YouTube connector always did, since it has a real video ID
// from the YouTube Data API; bulk import only had buildDraftImport's
// same-day regex, and never refreshed it on re-import). Same shape as
// backfill-youtube-descriptions: derive from the stored originalUrl with the
// same regex the app already uses (no API key needed, thumbnails are just a
// predictable URL), update the row, and only touch a linked published
// Story's coverImage if it's still exactly the old brand placeholder — a
// founder/staff who already set a real cover themselves is left untouched.
//
// Deploy: supabase functions deploy backfill-youtube-thumbnails --no-verify-jwt
// Invoke once, no body needed. Safe to re-run — rows that already have a
// real thumbnailUrl are skipped.

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL          = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const YOUTUBE_API_KEY       = Deno.env.get('YOUTUBE_API_KEY')

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const BRAND_PLACEHOLDER = '/assets/culo-brand-cover.png'

// Same logic as src/services/importedContent.ts's youtubeThumbnailUrl —
// duplicated rather than imported since edge functions can't reach into
// the frontend src tree. Keep these two in sync if the URL-shape matching
// there ever changes.
function youtubeThumbnailUrl(url: string | undefined): string | undefined {
  if (!url) return undefined
  try {
    const u = new URL(url)
    let videoId: string | null = null
    const host = u.hostname.replace(/^www\./, '')
    if (host === 'youtu.be') {
      videoId = u.pathname.slice(1).split('?')[0] || null
    } else if (host === 'youtube.com') {
      const shortsMatch = u.pathname.match(/^\/shorts\/([\w-]+)/)
      videoId = shortsMatch ? shortsMatch[1]! : u.searchParams.get('v')
    }
    return videoId ? `https://i.ytimg.com/vi/${videoId}/sddefault.jpg` : undefined
  } catch {
    return undefined
  }
}

// A curated article can cite a whole channel (e.g.
// youtube.com/@rohitbhargava9072) rather than one specific video — no video
// ID exists to build a thumbnail from at all in that case. Falls back to
// the channel's own avatar via the YouTube Data API, which is at least a
// real image tied to the actual source instead of the generic brand cover.
function extractChannelHandle(url: string | undefined): string | undefined {
  if (!url) return undefined
  try {
    const u = new URL(url)
    if (u.hostname.replace(/^www\./, '') !== 'youtube.com') return undefined
    const m = u.pathname.match(/^\/@([\w.-]+)/)
    return m?.[1]
  } catch {
    return undefined
  }
}

const channelAvatarCache = new Map<string, string | undefined>()
async function channelAvatarUrl(handle: string): Promise<string | undefined> {
  if (channelAvatarCache.has(handle)) return channelAvatarCache.get(handle)
  if (!YOUTUBE_API_KEY) return undefined
  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet&forHandle=${encodeURIComponent(handle)}&key=${YOUTUBE_API_KEY}`,
    )
    if (!res.ok) { channelAvatarCache.set(handle, undefined); return undefined }
    const json = await res.json()
    const avatar: string | undefined = json?.items?.[0]?.snippet?.thumbnails?.high?.url
      ?? json?.items?.[0]?.snippet?.thumbnails?.default?.url
    channelAvatarCache.set(handle, avatar)
    return avatar
  } catch {
    channelAvatarCache.set(handle, undefined)
    return undefined
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })

  try {
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)

    const { data: rows, error: fetchError } = await admin
      .from('imported_content')
      .select('id, data')
      .eq('source_platform', 'youtube')
    if (fetchError) throw new Error(fetchError.message)

    type Row = { id: string; data: Record<string, unknown> }
    const items = (rows ?? []) as Row[]

    let importsUpdated = 0
    let storiesUpdated = 0
    let skippedAlreadyHadOne = 0
    let skippedNoVideoId = 0

    for (const row of items) {
      const existingThumb = row.data.thumbnailUrl as string | undefined
      if (existingThumb) { skippedAlreadyHadOne++; continue }

      const originalUrl = row.data.originalUrl as string | undefined
      let derived = youtubeThumbnailUrl(originalUrl)
      if (!derived) {
        const handle = extractChannelHandle(originalUrl)
        if (handle) derived = await channelAvatarUrl(handle)
      }
      if (!derived) { skippedNoVideoId++; continue }

      const { error: updateError } = await admin
        .from('imported_content')
        .update({ data: { ...row.data, thumbnailUrl: derived } })
        .eq('id', row.id)
      if (updateError) throw new Error(updateError.message)
      importsUpdated++

      const relatedStoryId = row.data.relatedStoryId as string | undefined
      if (relatedStoryId) {
        const { data: storyRow, error: storyFetchError } = await admin
          .from('stories')
          .select('id, data')
          .eq('id', relatedStoryId)
          .maybeSingle()
        if (storyFetchError) throw new Error(storyFetchError.message)
        const currentCover = storyRow?.data?.coverImage as string | undefined
        if (storyRow && (!currentCover || currentCover === BRAND_PLACEHOLDER)) {
          const { error: storyUpdateError } = await admin
            .from('stories')
            .update({ data: { ...storyRow.data, coverImage: derived } })
            .eq('id', relatedStoryId)
          if (storyUpdateError) throw new Error(storyUpdateError.message)
          storiesUpdated++
        }
      }
    }

    return new Response(JSON.stringify({
      rowsChecked: items.length,
      importsUpdated,
      storiesUpdated,
      skippedAlreadyHadOne,
      skippedNoVideoId,
    }), { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Backfill failed.' }), {
      status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
