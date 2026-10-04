// Skips the manual "ask Claude elsewhere, paste the JSON back in" step for
// Bulk Import — staff upload a .csv straight off whatever spreadsheet tool
// they built the lead list in, and this does the column-mapping into
// Village Import Format JSON itself, server-side. Same resulting shape as
// a hand-written VIF package (see src/types/villageImport.ts) — the
// frontend's existing parseVIF/validateVIF/importVIF pipeline runs on the
// output completely unchanged, this only replaces how the JSON gets made.
//
// Deploy: supabase functions deploy convert-spreadsheet-to-vif --no-verify-jwt

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'

function sanitizeJsonControlChars(input: string): string {
  let result = ''
  let inString = false
  let escaped = false
  for (let i = 0; i < input.length; i++) {
    const ch = input[i]!
    if (!inString) {
      if (ch === '"') inString = true
      result += ch
      continue
    }
    if (escaped) { result += ch; escaped = false; continue }
    if (ch === '\\') { result += ch; escaped = true; continue }
    if (ch === '"') { inString = false; result += ch; continue }
    if (ch === '\n') { result += '\\n'; continue }
    if (ch === '\r') { result += '\\r'; continue }
    if (ch === '\t') { result += '\\t'; continue }
    result += ch
  }
  return result
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface RequestBody {
  csvText: string
  batchName?: string
}

const VIF_SCHEMA = `{
  "batchName": "string",
  "source": "csv",
  "founders": [
    {
      "fullName": "string (required)",
      "headline": "string — a short one-line role/description, if the spreadsheet has one",
      "bio": "string — only if the spreadsheet has real bio/description text, never invented",
      "country": "string",
      "state": "string",
      "city": "string",
      "website": "url",
      "linkedinUrl": "url",
      "youtubeUrl": "url",
      "instagramUrl": "url",
      "tiktokUrl": "url",
      "podcastUrl": "url",
      "newsletterUrl": "url",
      "claimEmail": "a real contact email for this person, if the spreadsheet has one",
      "topics": ["string"],
      "industries": ["string"],
      "notes": "string — fold in anything useful from the spreadsheet that doesn't map to a field above (e.g. source URL, original comment, why they were added, intent signal)",
      "sourceLinks": ["url — e.g. the original comment/post URL this lead came from, if present"]
    }
  ]
}`

const SYSTEM_PROMPT = `You convert a staff-built spreadsheet of lead/founder candidates (given as raw CSV text, headers unknown in advance) into Village Import Format (VIF) JSON for CULO's Bulk Import pipeline.

RULES
Map each spreadsheet row to one founder object. Column headers vary between spreadsheets — use your judgement to map them to the closest VIF field (e.g. "Instagram", "IG", "insta_url", "Instagram Handle" all map to instagramUrl; a bare handle like "@example" or "example" becomes "https://www.instagram.com/example/").
Only include a field when the row actually has real data for it. Never invent, guess or embellish a name, link, bio, location or any other field. An empty/missing cell means omit that field, not a placeholder.
fullName is the only required field — skip (do not fabricate) any row with no usable name.
Any spreadsheet column that doesn't map cleanly to a VIF field (e.g. "source post URL", "original comment", "why added", "score", "platform found on") should be folded into that founder's notes field as a short labelled line, not discarded.
Do not write a bio from scratch — only use bio if the spreadsheet itself already has real biographical text in a column.
batchName: a short descriptive name for this import, from any batch/list name context given, or a sensible default like "CSV Import <row count> founders" if none given.

VIF SCHEMA
${VIF_SCHEMA}

Respond with ONLY the JSON object, no markdown fences, no commentary.`

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })

  try {
    const body = await req.json() as RequestBody
    if (!body?.csvText?.trim()) throw new Error('csvText is required')

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) throw new Error('AI conversion is not configured yet')

    const userContent = [
      body.batchName?.trim() ? `BATCH NAME: ${body.batchName.trim()}` : undefined,
      `SPREADSHEET (raw CSV):\n${body.csvText}`,
    ].filter(Boolean).join('\n\n')

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 8000,
        thinking: { type: 'adaptive' },
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userContent }],
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`AI request failed (${res.status}): ${errText}`)
    }

    const data = await res.json()
    const textBlock = (data.content ?? []).find((b: { type: string }) => b.type === 'text')
    const raw = textBlock?.text?.trim()
    if (!raw) throw new Error('AI returned no text')

    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim()
    const parsed = JSON.parse(sanitizeJsonControlChars(cleaned))

    return new Response(JSON.stringify({ vif: parsed }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
