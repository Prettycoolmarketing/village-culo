// CULO Village — extract-profile Edge Function
//
// Reads a founder's Voice & Brand Brief / MD file and pulls out the
// plain-text profile fields it can answer, so the profile is pre-filled by
// the time the founder lands on it. Same one rule as generate-bio: every
// value must trace to something the founder actually stated — never invent
// a business name, a location, a number or a claim. Fields it can't
// confidently answer are simply omitted.
//
// Body: { voiceBrief: string, founderName?: string, current?: {...} }
// Returns: { fields: { businessName?, businessTagline?, businessDescription?,
//   targetAudience?, city?, topics?: string[] }, note?: string }
//
// Deploy: supabase functions deploy extract-profile --no-verify-jwt

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const SYSTEM_PROMPT = `You extract a founder's CULO Village profile fields from their own Voice & Brand Brief (an MD document they generated about themselves, their story and their business).

THE ONE RULE: every value must trace to something the founder actually, verifiably stated in the brief. Never invent a business name, a location, a number, a founding year, an audience or a claim. If the brief doesn't clearly answer a field, OMIT that field — a missing field is always better than a guessed one.

Return ONLY a JSON object, no prose, with this shape (include only the keys you can answer):
{
  "businessName": string,          // the founder's primary business, exactly as they name it
  "businessTagline": string,       // one plain line: what the business does, in their words. No buzzwords.
  "businessDescription": string,   // 2-4 sentences describing the business, drawn from what they said. Their voice, not marketing gloss.
  "targetAudience": string,        // who the business is actually for, in plain words (e.g. "trades businesses under 10 staff")
  "city": string,                  // the city/town they're based in, if stated
  "topics": string[]               // up to 6 short topic phrases they should be associated with, only ones the brief supports
}

Write in the founder's own voice as it comes through in the brief. Keep it honest and specific. If the brief has almost nothing usable, return {} with a "note" field explaining what's missing.`

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })
  try {
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) throw new Error('AI is not configured yet')

    const body = await req.json() as {
      voiceBrief?: string
      founderName?: string
      current?: Record<string, unknown>
    }
    if (!body.voiceBrief?.trim()) throw new Error('voiceBrief is required')

    const userContent = [
      `FOUNDER'S NAME: ${body.founderName || '(not supplied)'}`,
      body.current && Object.keys(body.current).length
        ? `\nCURRENT PROFILE VALUES (only fill blanks — never contradict a value the founder already set):\n${JSON.stringify(body.current, null, 2)}`
        : '',
      `\nVOICE & BRAND BRIEF:\n${body.voiceBrief}`,
    ].join('\n')

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-opus-5',
        max_tokens: 1500,
        thinking: { type: 'adaptive' },
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userContent }],
      }),
    })
    if (!res.ok) throw new Error(`AI request failed (${res.status}): ${await res.text()}`)

    const data = await res.json()
    const text = (data.content ?? []).find((b: { type: string }) => b.type === 'text')?.text?.trim()
    if (!text) throw new Error('AI returned no text')

    const jsonStr = text.startsWith('{') ? text : text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1)
    const parsed = JSON.parse(jsonStr) as Record<string, unknown>
    const { note, ...fields } = parsed

    return new Response(JSON.stringify({ fields, note }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
