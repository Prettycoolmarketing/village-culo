// CULO Village — canva-import-design Edge Function
//
// The actual "bring a Canva design into Village" pipeline. Canva's Connect
// API doesn't expose a "give me the text on slide 3" endpoint — it only
// exports finished assets (images/PDF/PPTX/MP4) — so getting real slide
// text means: export the design as PPTX, then parse the text runs straight
// out of the PowerPoint XML (reliable, not OCR). Separately, export the
// same design as JPEGs (one per slide) for the actual carousel/cover
// images, and re-upload those into this app's own 'media' Storage bucket
// (matching src/lib/storage.ts's convention) since Canva's own export
// download links expire after 24 hours and stories need to keep working
// long after that.
//
// Deploy: supabase functions deploy canva-import-design

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import JSZip from 'https://esm.sh/jszip@3.10.1'
import { getValidCanvaAccessToken, assertOwnsFounder } from '../_shared/canva.ts'

const SUPABASE_URL          = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY     = Deno.env.get('SUPABASE_ANON_KEY')!
const SUPABASE_SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// ─── Canva export job helpers ──────────────────────────────────────────────

async function createExportJob(accessToken: string, designId: string, format: Record<string, unknown>): Promise<string> {
  const res = await fetch('https://api.canva.com/rest/v1/exports', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ design_id: designId, format }),
  })
  const body = await res.json()
  if (!res.ok) throw new Error(body.message ?? 'Canva export failed to start.')
  return body.job.id as string
}

async function waitForExportJob(accessToken: string, jobId: string): Promise<string[]> {
  for (let attempt = 0; attempt < 30; attempt++) {
    const res = await fetch(`https://api.canva.com/rest/v1/exports/${jobId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const body = await res.json()
    if (!res.ok) throw new Error(body.message ?? 'Canva export failed.')
    const job = body.job
    if (job.status === 'success') return (job.urls ?? []) as string[]
    if (job.status === 'failed') throw new Error(job.error?.message ?? 'Canva export failed.')
    await new Promise(r => setTimeout(r, 2000))
  }
  throw new Error('Canva export took too long — try again.')
}

// ─── PPTX text extraction (no OCR — real text runs from the XML) ──────────

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&apos;/g, '\'')
}

function parseRelationships(relsXml: string): Record<string, string> {
  const map: Record<string, string> = {}
  const tagPattern = /<Relationship\b[^>]*\/?>/g
  for (const tag of relsXml.match(tagPattern) ?? []) {
    const id = tag.match(/\bId="([^"]+)"/)?.[1]
    const target = tag.match(/\bTarget="([^"]+)"/)?.[1]
    if (id && target) map[id] = target
  }
  return map
}

function slideTextFromXml(slideXml: string): string {
  const paragraphs = slideXml.match(/<a:p\b[^>]*>[\s\S]*?<\/a:p>/g) ?? []
  const lines: string[] = []
  for (const para of paragraphs) {
    const runs = [...para.matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)].map(m => decodeXmlEntities(m[1] ?? ''))
    const line = runs.join('').trim()
    if (line) lines.push(line)
  }
  return lines.join('\n')
}

async function extractSlideTexts(pptxBytes: ArrayBuffer): Promise<string[]> {
  const zip = await JSZip.loadAsync(pptxBytes)
  const presentationXml = await zip.file('ppt/presentation.xml')?.async('string')
  const relsXml = await zip.file('ppt/_rels/presentation.xml.rels')?.async('string')
  if (!presentationXml || !relsXml) return []

  const rIds = [...presentationXml.matchAll(/<p:sldId\b[^>]*r:id="([^"]+)"/g)].map(m => m[1]!)
  const rels = parseRelationships(relsXml)

  const texts: string[] = []
  for (const rId of rIds) {
    const target = rels[rId]
    if (!target) continue
    const path = `ppt/${target.replace(/^\.?\//, '')}`
    const slideXml = await zip.file(path)?.async('string')
    texts.push(slideXml ? slideTextFromXml(slideXml) : '')
  }
  return texts
}

// ─── Handler ────────────────────────────────────────────────────────────────

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

    // Title
    const designRes = await fetch(`https://api.canva.com/rest/v1/designs/${designId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const designBody = await designRes.json()
    if (!designRes.ok) throw new Error(designBody.message ?? 'Could not load that Canva design.')
    const title: string = designBody.design?.title || 'Untitled design'

    // Slide text, via PPTX export
    const pptxJobId = await createExportJob(accessToken, designId, { type: 'pptx' })
    const pptxUrls = await waitForExportJob(accessToken, pptxJobId)
    let slideTexts: string[] = []
    if (pptxUrls[0]) {
      const pptxRes = await fetch(pptxUrls[0])
      const pptxBytes = await pptxRes.arrayBuffer()
      slideTexts = await extractSlideTexts(pptxBytes)
    }

    // Slide images, via JPG export — one URL per page, in page order
    const imageJobId = await createExportJob(accessToken, designId, { type: 'jpg' })
    const imageUrls = await waitForExportJob(accessToken, imageJobId)

    // Canva's export URLs expire in 24h — re-host each image in our own
    // Storage so the story keeps working indefinitely.
    const uploadedImageUrls: string[] = []
    for (const url of imageUrls) {
      const imgRes = await fetch(url)
      if (!imgRes.ok) continue
      const bytes = await imgRes.arrayBuffer()
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`
      const path = `${founderId}/${filename}`
      const { error: uploadError } = await admin.storage.from('media').upload(path, bytes, {
        cacheControl: '3600', upsert: false, contentType: 'image/jpeg',
      })
      if (uploadError) continue
      const { data: publicUrlData } = admin.storage.from('media').getPublicUrl(path)
      uploadedImageUrls.push(publicUrlData.publicUrl)
    }

    const combinedText = slideTexts.filter(Boolean).join('\n\n')

    return new Response(JSON.stringify({ title, imageUrls: uploadedImageUrls, slideTexts, combinedText }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
