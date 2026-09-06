// Writes a founder's public Bio (and, if there's enough to justify one, an
// SEO Title) straight from what they've already told CULO about themselves
// in their Voice & Brand Brief — so a founder who's already written a real
// brief doesn't have to retype the same story a second time into a
// separate Bio field.
//
// Same honesty rule as generate-blog: this only ever writes down what the
// brief actually, verifiably states about the founder — their real
// business, background, experience, what they do and why. It never invents
// a detail, a number, or an achievement the brief doesn't contain, and it
// returns "insufficient_source" rather than padding a thin brief out with
// generic filler.
//
// Deploy: supabase functions deploy generate-bio --no-verify-jwt

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface RequestBody {
  voiceBrief: string
  founderName: string
  // Separate from voiceBrief for the same reason generate-blog keeps them
  // separate — this is the founder's own source-checked bank of what they
  // genuinely believe/know/can teach, real signal about who they are, not
  // a source of facts to invent from where the Voice Brief is silent.
  insightBrief?: string
  // The founder's current Bio, if they already have one — kept as context
  // so a founder who's already written something doesn't get an unrelated
  // rewrite; the model is told to preserve any real fact already stated
  // here even if the brief doesn't repeat it, and only add to it.
  existingBio?: string
}

interface GeneratedBio {
  status: 'ready' | 'insufficient_source'
  note?: string
  bio?: string
  seoTitle?: string
}

const SYSTEM_PROMPT = `You write a founder's public Bio for their CULO Village profile, using ONLY their own Voice & Brand Brief (and, if supplied, their existing Bio and Insight Brief) as source material.

THE ONE RULE THAT MATTERS: every sentence in the Bio must trace to something the founder actually, verifiably stated in the material you were given. Never invent a business name, a number, a location, a credential, a timeline, or an achievement that isn't actually there. A generic-sounding but accurate bio beats a specific-sounding but invented one, every time.

What counts as real source material:
- The Voice & Brand Brief — their own words about who they are, what they've built, what they do, their background, their values, how they talk about their work.
- Their existing Bio, if supplied — treat any fact already stated there as real, keep it, and only add to it with what the new brief material actually supports. Don't discard something true just because the brief doesn't happen to repeat it.
- The Insight Brief, if supplied — what they already, genuinely believe/know/teach. Useful for capturing their voice and perspective, but never a source of biographical facts (business names, numbers, history) that only the Voice Brief or existing Bio can supply.

Write in first person, in the founder's own voice as it comes through in the brief — not a generic "professional bio" tone. Aim for 150-350 characters if the source material only gives you a little, up to 500-700 if there's a lot of real, verified material to work with. Never pad to hit a length — a shorter, entirely true bio beats a longer one with filler ("passionate", "dedicated to excellence", "believes in the power of...") stitched in to reach a word count.

Also produce a short seoTitle ONLY if there's a genuinely distinct hook in the material worth surfacing in search results alongside their name (e.g. a specific niche, city, or credential) — otherwise omit it entirely rather than restating their name or inventing a generic-sounding title.

If the Voice Brief (and existing Bio, if any) genuinely don't contain enough real, specific material to write an honest bio beyond a single generic sentence, return status "insufficient_source" with a one-sentence note on what's missing — don't write a vague placeholder bio just to have something to show.

Respond with ONLY a JSON object, no markdown fences, no commentary:
{
  "status": "ready" or "insufficient_source",
  "note": "only when insufficient_source — one honest sentence on what's missing",
  "bio": "only when ready — the bio itself, first person, no quotation marks around it",
  "seoTitle": "only when ready AND there's a genuinely distinct hook worth it — omit the field entirely otherwise"
}`

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })

  try {
    const body = await req.json() as RequestBody
    if (!body?.voiceBrief?.trim()) throw new Error('voiceBrief is required')

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) throw new Error('AI writing is not configured yet')

    const userContent: string[] = [
      `FOUNDER'S NAME: ${body.founderName || '(not supplied)'}`,
      `\nVOICE & BRAND BRIEF:\n${body.voiceBrief}`,
    ]
    if (body.existingBio?.trim()) {
      userContent.push(`\nEXISTING BIO (preserve any real fact stated here, only add to it):\n${body.existingBio}`)
    }
    if (body.insightBrief?.trim()) {
      userContent.push(`\nINSIGHT BRIEF (voice/perspective only — never a source of biographical facts):\n${body.insightBrief}`)
    }

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-8',
        max_tokens: 1500,
        thinking: { type: 'adaptive' },
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userContent.join('\n') }],
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
    const parsed = JSON.parse(cleaned) as GeneratedBio

    return new Response(JSON.stringify({ bio: parsed }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
