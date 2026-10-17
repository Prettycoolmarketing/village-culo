// Scans a founder's own published article text for real brand/product/
// company names mentioned in passing — the kind of thing a founder might
// actually want to turn into an affiliate link (see Affiliate Links tab,
// which calls this on demand, never automatically, to avoid burning AI
// spend on every page load). Excludes the founder's own name and business
// names, which show up constantly but aren't an "affiliate" of anything.
//
// Deploy: supabase functions deploy extract-brand-mentions --no-verify-jwt

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface RequestBody {
  text: string
  founderName?: string
  ownBusinessNames?: string[]
}

const SYSTEM_PROMPT = `You read a collection of someone's own published articles and list every real, external brand, product, tool, platform or company name mentioned in passing — the kind of name a reader might recognise, and the kind of thing the writer could reasonably turn into an affiliate link if they have a partner program.

Rules:
- Only real, specific, external brand/product/company names actually present in the text — never invent one, never generalize ("a popular editing app" doesn't count, "CapCut" does).
- Exclude the writer's own name and their own business/company name(s) — these are supplied to you, exclude them and close variants.
- Exclude generic nouns, places, people who are not brands, and platforms so ubiquitous they're not really "a brand to link" in this context unless genuinely central to the piece (use judgement — "Instagram" mentioned once in passing as "I posted this on Instagram" doesn't count, but a piece centrally about a specific tool does).
- Exact casing/spelling as it actually appears in the text.
- No duplicates.
- If nothing real qualifies, return an empty array rather than padding it.

Respond with ONLY a JSON object, no markdown fences, no commentary:
{ "brands": ["Name One", "Name Two"] }`

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })

  try {
    const body = await req.json() as RequestBody
    const text = body.text?.trim()
    if (!text) return new Response(JSON.stringify({ brands: [] }), { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } })

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured')

    const exclusions = [body.founderName, ...(body.ownBusinessNames ?? [])].filter(Boolean).join(', ')
    const userPrompt = `${exclusions ? `Exclude these names (the writer's own name/businesses): ${exclusions}\n\n` : ''}Articles:\n${text.slice(0, 20000)}`

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`AI request failed (${res.status}): ${errText}`)
    }
    const data = await res.json()
    const textBlock = (data.content ?? []).find((b: { type: string }) => b.type === 'text')
    const raw = textBlock?.text?.trim() ?? '{}'
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim()
    const parsed = JSON.parse(cleaned) as { brands?: string[] }
    const brands = Array.from(new Set((parsed.brands ?? []).map(b => b.trim()).filter(Boolean)))

    return new Response(JSON.stringify({ brands }), { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
