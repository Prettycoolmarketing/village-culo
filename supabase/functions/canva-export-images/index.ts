// CULO Village — canva-export-images Edge Function
//
// Half of what used to be canva-import-design (split to keep memory per
// invocation down — see _shared/canvaExport.ts for why): exports a Canva
// design's slides as JPEGs and re-hosts them in this app's own 'media'
// Storage bucket, since Canva's own export download links expire after 24
// hours and stories need to keep working indefinitely.
//
// Deploy: supabase functions deploy canva-export-images

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getValidCanvaAccessToken, assertOwnsFounder } from '../_shared/canva.ts'
import { createExportJob, waitForExportJob, fetchWithLimit, fetchDesignTitle } from '../_shared/canvaExport.ts'

const SUPABASE_URL          = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY     = Deno.env.get('SUPABASE_ANON_KEY')!
const SUPABASE_SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const MAX_IMAGE_BYTES = 12_000_000  // ~12MB per slide image
const MAX_SLIDES      = 30          // bounds total loop memory/time regardless of per-item size

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Not signed in.' }), {
      status: 401, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }

  try {
    const { founderId, designId } = await req.json()
    if (!founderId || !designId) throw new Error('founderId and designId are required')

    const asCaller = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: authHeader } } })
    await assertOwnsFounder(asCaller, founderId)

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)
    const accessToken = await getValidCanvaAccessToken(admin, founderId)

    const title = await fetchDesignTitle(accessToken, designId)

    // Canva's export API requires 'quality' explicitly for jpg — not
    // optional/nullable despite being undocumented as required.
    const imageJobId = await createExportJob(accessToken, designId, { type: 'jpg', quality: 100 })
    const allImageUrls = await waitForExportJob(accessToken, imageJobId)
    const imageUrls = allImageUrls.slice(0, MAX_SLIDES)
    const slidesTruncated = allImageUrls.length > imageUrls.length

    // pageNumbers[i] is the Canva page (1-indexed) that produced
    // uploadedImageUrls[i] — must be tracked explicitly, not assumed from
    // array position, since a skipped slide (too large, upload failure)
    // would otherwise silently shift every later image's index off by one
    // relative to its real page number. That misalignment broke Reel video
    // export: it was exporting the wrong page whenever an earlier slide in
    // the same design had been skipped.
    const uploadedImageUrls: string[] = []
    const pageNumbers: number[] = []
    let imagesSkipped = 0
    for (let i = 0; i < imageUrls.length; i++) {
      const url = imageUrls[i]!
      const bytes = await fetchWithLimit(url, MAX_IMAGE_BYTES)
      if (!bytes) { imagesSkipped++; continue }
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`
      const path = `${founderId}/${filename}`
      const { error: uploadError } = await admin.storage.from('media').upload(path, bytes, {
        cacheControl: '3600', upsert: false, contentType: 'image/jpeg',
      })
      if (uploadError) { imagesSkipped++; continue }
      const { data: publicUrlData } = admin.storage.from('media').getPublicUrl(path)
      uploadedImageUrls.push(publicUrlData.publicUrl)
      pageNumbers.push(i + 1)
    }

    return new Response(JSON.stringify({
      title, imageUrls: uploadedImageUrls, pageNumbers, imagesSkipped, slidesTruncated,
    }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
