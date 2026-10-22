// Sibling to convert-spreadsheet-to-vif, for raw messy text instead of a
// CSV — the common real case: staff pasting a Facebook comment thread (or
// similar) where dozens of people replied with their name, business and a
// website/Instagram/Facebook link, mixed in with "Reply", "Edited", OG-tag
// title duplication and comments from people with no business at all. This
// does the extraction server-side into Village Import Format JSON — same
// resulting shape as a hand-written VIF package (see
// src/types/villageImport.ts), so the frontend's existing
// parseVIF/validateVIF/importVIF pipeline runs on the output completely
// unchanged, this only replaces how the JSON gets made.
//
// Deploy: supabase functions deploy convert-text-to-vif --no-verify-jwt

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
  rawText: string
  batchName?: string
}

const VIF_SCHEMA = `{
  "batchName": "string",
  "source": "other",
  "founders": [
    {
      "fullName": "string (required)",
      "headline": "string — a short one-line description of what they do, only if the text actually states it (e.g. 'Family photographer in South West Sydney')",
      "website": "url",
      "linkedinUrl": "url",
      "youtubeUrl": "url",
      "instagramUrl": "url",
      "tiktokUrl": "url",
      "topics": ["string"],
      "industries": ["string"],
      "businesses": [{ "name": "string", "website": "url", "description": "string — only real stated detail, e.g. 'Low tox chopping boards and utensils, handmade, no dropshipping'" }],
      "notes": "string — fold in anything useful that doesn't map cleanly (e.g. 'said they lost their old Facebook account', a Facebook profile/page link with no other site)",
      "sourceLinks": ["url — any Facebook profile/page link or other link that doesn't fit a field above"]
    }
  ]
}`

const SYSTEM_PROMPT = `You extract real founder/business leads from raw, messy pasted text — most often a Facebook comment thread where people replied to a post with their name, business, and a website or social link, mixed in with UI noise (the word "Reply", "Edited", repeated page-title text pulled from link previews like "RUSTICDESIGNS.COM.AU" appearing two or three times in a row, timestamps, reaction counts).

RULES
One founder object per distinct real person who actually mentions a business, website, or social account of their own. A name alone with no business/link/description of what they do (e.g. someone just saying "yay so many! keep commenting everyone") is NOT a lead — skip it entirely, do not invent a business for them.
Clean up link-preview noise: when a URL/business name is repeated two or three times in a row in slightly different capitalisation (a link-preview artifact, e.g. "RusticDesigns\\nAustralian Made Chopping Boards...\\nRUSTICDESIGNS.COM.AU\\nAustralian Made Chopping Boards...\\nAustralian Made Chopping Boards..."), treat it as ONE real signal, not several — extract the business name and description once, not duplicated.
A bare Instagram/TikTok handle like "@example" or "www.instagram.com/example" becomes a full URL: "https://www.instagram.com/example/". Strip tracking query params like "?igshid=..." or "?dlrf=..." when the base handle is clear.
Only include a field when the text actually states it. Never invent, guess or embellish a name, business name, location, or any detail not actually written. headline/businesses[].description must be built only from real stated text (a founder's own words in the comment), never a generic guess at what their business probably does.
If a name has only a Facebook profile/page link and nothing else, put that link in sourceLinks (not linkedinUrl/instagramUrl), and still extract them as a lead if they stated any real description of what they do.
If the same person appears to comment more than once in the thread, merge into one founder object rather than creating a duplicate.
fullName is the only required field — skip (do not fabricate) anyone with no usable name attached to real business/link content.
batchName: a short descriptive name from any context given (e.g. what the thread/post was about), or a sensible default like "Pasted leads — <N> found" if none given.

VIF SCHEMA
${VIF_SCHEMA}

Respond with ONLY the JSON object, no markdown fences, no commentary.`

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })

  try {
    const body = await req.json() as RequestBody
    if (!body?.rawText?.trim()) throw new Error('rawText is required')

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) throw new Error('AI conversion is not configured yet')

    const userContent = [
      body.batchName?.trim() ? `BATCH NAME: ${body.batchName.trim()}` : undefined,
      `PASTED TEXT (raw, messy — clean it up per the rules above):\n${body.rawText}`,
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
