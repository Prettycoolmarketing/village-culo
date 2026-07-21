// CULO Village — canva-export-reel-video Edge Function
//
// Exports a single page of a Canva design as an actual video (Canva's
// export API supports `{type:'mp4', pages:[N]}` — confirmed via their
// Connect API docs; no per-page metadata exists to detect "is this page a
// video" automatically, so the founder marks it via the slide-grouping UI
// in CanvaImportPanel and this only ever runs for a page they've explicitly
// flagged as a Reel).
//
// Video files are much larger than the slide JPEGs the other Canva
// functions handle — buffering a whole video in memory the way images are
// re-uploaded risks the exact WORKER_RESOURCE_LIMIT crash that splitting
// canva-import-design into two functions just fixed, likely worse. A true
// streaming re-upload (piping Canva's response straight into Supabase
// Storage with no buffering) would be the ideal fix, but whether
// supabase-js's storage upload actually handles a raw ReadableStream body
// without buffering internally isn't something this codebase has verified —
// given how many undocumented Canva API surprises this integration has
// already hit, guessing on another unverified behaviour isn't worth it.
// Uses the same proven bounded-buffer technique (fetchWithLimit) already
// confirmed working for images, just with a cap sized for short vertical
// video instead — a video over the cap reports a clear error rather than
// crashing.
//
// Deploy: supabase functions deploy canva-export-reel-video

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getValidCanvaAccessToken, assertOwnsFounder } from '../_shared/canva.ts'
import { createExportJob, fetchWithLimit } from '../_shared/canvaExport.ts'

const MAX_VIDEO_BYTES = 60_000_000  // ~60MB — generous for a short vertical reel at 1080p

const SUPABASE_URL          = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY     = Deno.env.get('SUPABASE_ANON_KEY')!
const SUPABASE_SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Video export takes noticeably longer than image/text export (real
// encoding time on Canva's side) — a longer ceiling than the 90s used
// elsewhere, but still bounded so a stuck job fails clearly instead of
// hanging the request indefinitely.
async function waitForVideoJob(accessToken: string, jobId: string): Promise<string[]> {
  for (let attempt = 0; attempt < 70; attempt++) {
    const res = await fetch(`https://api.canva.com/rest/v1/exports/${jobId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const body = await res.json()
    if (!res.ok) throw new Error(body.message ?? 'Canva video export failed.')
    const job = body.job
    if (job.status === 'success') return (job.urls ?? []) as string[]
    if (job.status === 'failed') throw new Error(job.error?.message ?? 'Canva video export failed.')
    await new Promise(r => setTimeout(r, 2500))
  }
  throw new Error('Video export took too long — try again, or attach the video manually in the Publish wizard.')
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Not signed in.' }), {
      status: 401, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }

  try {
    const { founderId, designId, pageNumber, orientation } = await req.json()
    if (!founderId || !designId || !pageNumber) throw new Error('founderId, designId and pageNumber are required')

    const asCaller = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: authHeader } } })
    await assertOwnsFounder(asCaller, founderId)

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)
    const accessToken = await getValidCanvaAccessToken(admin, founderId)

    const quality = orientation === 'horizontal' ? 'horizontal_1080p' : 'vertical_1080p'
    const jobId = await createExportJob(accessToken, designId, { type: 'mp4', quality, pages: [pageNumber] })
    const urls = await waitForVideoJob(accessToken, jobId)
    const videoUrl = urls[0]
    if (!videoUrl) throw new Error('Canva did not return a video for that slide.')

    // Canva's export URLs expire in 24h, same reason every other Canva
    // asset in this app gets re-hosted into our own Storage.
    const bytes = await fetchWithLimit(videoUrl, MAX_VIDEO_BYTES)
    if (!bytes) throw new Error('That video was too large to import automatically — download it from Canva and attach it manually in the Publish wizard instead.')

    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.mp4`
    const path = `${founderId}/${filename}`
    const { error: uploadError } = await admin.storage.from('media').upload(path, bytes, {
      cacheControl: '3600', upsert: false, contentType: 'video/mp4',
    })
    if (uploadError) throw new Error(uploadError.message)

    const { data: publicUrlData } = admin.storage.from('media').getPublicUrl(path)

    return new Response(JSON.stringify({ videoUrl: publicUrlData.publicUrl }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
