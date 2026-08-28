// CULO Village — backfill-youtube-descriptions Edge Function
//
// One-time (re-runnable, idempotent) fix for YouTube imports whose
// description is the truncated snippet YouTube's free RSS/Atom feed
// provides (~130-200 chars, often cut mid-sentence with "..."), instead of
// the real full video description. Uses the YouTube Data API (YOUTUBE_API_KEY)
// to fetch the actual full description per video, then:
//   1. Updates the imported_content row's description.
//   2. Only if the linked published story's blog is EXACTLY the old
//      (truncated) description — i.e. nothing the founder wrote or edited
//      themselves — replaces it with the new full description too. A
//      founder's own edit always wins and is left untouched.
//
// Deploy: supabase functions deploy backfill-youtube-descriptions --no-verify-jwt
// Invoke once, no body needed. Safe to re-run — rows already holding the
// full description just get skipped (new text isn't longer than what's there).

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

function extractVideoId(url: string | undefined): string | undefined {
  if (!url) return undefined
  const m = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/) ?? url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/)
  return m?.[1]
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })

  if (!YOUTUBE_API_KEY) {
    return new Response(JSON.stringify({ error: 'YOUTUBE_API_KEY is not set.' }), {
      status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }

  try {
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)

    const { data: rows, error: fetchError } = await admin
      .from('imported_content')
      .select('id, data')
      .eq('source_platform', 'youtube')
    if (fetchError) throw new Error(fetchError.message)

    type Row = { id: string; data: Record<string, unknown> }
    const items = (rows ?? []) as Row[]

    const idToRows = new Map<string, Row[]>()
    for (const row of items) {
      const videoId = extractVideoId(row.data.originalUrl as string | undefined)
      if (!videoId) continue
      const list = idToRows.get(videoId) ?? []
      list.push(row)
      idToRows.set(videoId, list)
    }
    const videoIds = [...idToRows.keys()]

    const descriptions = new Map<string, string>()
    for (let i = 0; i < videoIds.length; i += 50) {
      const chunk = videoIds.slice(i, i + 50)
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${chunk.join(',')}&key=${YOUTUBE_API_KEY}`,
      )
      if (!res.ok) {
        const body = await res.text()
        throw new Error(`YouTube API error ${res.status}: ${body.slice(0, 300)}`)
      }
      const json = await res.json()
      for (const video of json.items ?? []) {
        const description: string | undefined = video?.snippet?.description
        if (description) descriptions.set(video.id, description)
      }
    }

    let importsUpdated = 0
    let storiesUpdated = 0
    let skippedNoImprovement = 0

    for (const [videoId, rowsForId] of idToRows) {
      const fullDescription = descriptions.get(videoId)
      if (!fullDescription) continue

      for (const row of rowsForId) {
        const oldDescription = row.data.description as string | undefined
        if (oldDescription && oldDescription.length >= fullDescription.length) {
          skippedNoImprovement++
          continue
        }

        const newData = { ...row.data, description: fullDescription }
        const { error: updateError } = await admin
          .from('imported_content')
          .update({ data: newData })
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
          if (storyRow && storyRow.data.blog === (oldDescription ?? '')) {
            const { error: storyUpdateError } = await admin
              .from('stories')
              .update({ data: { ...storyRow.data, blog: fullDescription } })
              .eq('id', relatedStoryId)
            if (storyUpdateError) throw new Error(storyUpdateError.message)
            storiesUpdated++
          }
        }
      }
    }

    return new Response(JSON.stringify({
      videoIdsChecked: videoIds.length,
      descriptionsFetched: descriptions.size,
      importsUpdated,
      storiesUpdated,
      skippedNoImprovement,
    }), { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Backfill failed.' }), {
      status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
