// CULO Village — canva-export-text Edge Function
//
// Half of what used to be canva-import-design (split to keep memory per
// invocation down — see _shared/canvaExport.ts for why): exports a Canva
// design as PPTX and parses the real text runs straight out of the
// PowerPoint XML (reliable, not OCR) — Canva's Connect API has no "give me
// the text on slide 3" endpoint. Best-effort: if the export is too large to
// safely buffer, this reports textExtractionSkipped instead of failing —
// the founder can still write their own caption.
//
// Deploy: supabase functions deploy canva-export-text

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import JSZip from 'https://esm.sh/jszip@3.10.1'
import { getValidCanvaAccessToken, assertOwnsFounder } from '../_shared/canva.ts'
import { createExportJob, waitForExportJob, fetchWithLimit } from '../_shared/canvaExport.ts'

const SUPABASE_URL          = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY     = Deno.env.get('SUPABASE_ANON_KEY')!
const SUPABASE_SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// This function now runs in complete isolation from image processing
// (canva-export-images is a separate invocation) — it never competes for
// memory with the JPG re-upload loop, so it can afford a much higher
// ceiling than the original combined function's 25MB ever could.
const MAX_PPTX_BYTES = 80_000_000  // ~80MB — skip rather than crash on bigger

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

    const pptxJobId = await createExportJob(accessToken, designId, { type: 'pptx' })
    const pptxUrls = await waitForExportJob(accessToken, pptxJobId)

    let slideTexts: string[] = []
    let textExtractionSkipped = false
    if (pptxUrls[0]) {
      const pptxBytes = await fetchWithLimit(pptxUrls[0], MAX_PPTX_BYTES)
      if (pptxBytes) {
        slideTexts = await extractSlideTexts(pptxBytes)
      } else {
        textExtractionSkipped = true
      }
    }

    const combinedText = slideTexts.filter(Boolean).join('\n\n')

    return new Response(JSON.stringify({ slideTexts, combinedText, textExtractionSkipped }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
