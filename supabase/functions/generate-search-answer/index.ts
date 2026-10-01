// Turns one of Shakas's own clips/transcripts into a standalone
// "search-answer" article — the real question a founder/creator/small
// business owner would type into Google or ask ChatGPT, answered directly
// using Shakas's actual argument and experience from the source material.
// Never a recap of the video itself ("In this video, Shakas discusses...").
//
// Same honesty rule as generate-blog/generate-bio: every claim traces back
// to the source material. If there isn't enough there to answer a genuinely
// useful search question, this returns insufficient_source rather than
// padding out a weak article.
//
// Deploy: supabase functions deploy generate-search-answer --no-verify-jwt

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface RequestBody {
  founderName: string
  // The clip/transcript/caption this article is built from — the only
  // allowed source of fact, argument and experience.
  sourceText: string
  platform?: string
}

interface GeneratedSearchAnswer {
  status: 'ready' | 'insufficient_source'
  note?: string
  primaryQuestion?: string
  relatedQuestions?: string[]
  headline?: string
  article?: string
  seoTitle?: string
  seoDescription?: string
  slug?: string
  // True only when the article actually ties back to The Culo Village or
  // Culo Creatives somewhere in the body — a visible signal so a reviewer
  // can tell at a glance whether the model forced a connection that wasn't
  // genuinely there, or correctly left it out.
  culoConnectionMade?: boolean
}

const SYSTEM_PROMPT = `You turn one CULO clip or transcript into a standalone "search-answer" article — content built to be found through search and AI answer engines, not a recap of the video it came from.

THE LOGIC:
clip/transcript -> identify the real question being answered -> rewrite as a clear search-style article -> use the speaker's own experience/opinion from the clip as the answer -> naturally connect to CULO only where genuinely relevant.

STEP 1 — Find the question.
Identify the strongest real question that a founder, creator or small business owner would realistically search online, based on what's actually discussed in the source. Examples of the kind of question (do not reuse these verbatim unless they genuinely match — find the real one in THIS source):
- Is Substack good for founders?
- Is LinkedIn enough for building a personal brand?
- Should founders start a blog in 2026?
- How do you get discovered by AI search?
- What happens to old social media posts?
- Should founders repurpose their podcast appearances?
- Do founders need their own website?
- What is the best way to organise years of content?
- Is AI-generated content bad for SEO?
- Should you post the same content on multiple platforms?
- How do you build authority online as a founder?
- What is the difference between social media reach and discoverability?
- How do founders get mentioned by ChatGPT?
- Should I use Medium, Substack, LinkedIn or my own website?
- How do I make my content searchable after I post it?

STEP 2 — Write the article.
- The headline should be written as that question wherever possible.
- Open with a direct answer to the question in the first paragraph.
- Use the speaker's actual argument, experience and perspective from the source material as the basis of the answer — never invent a fact, experience, opinion or claim that isn't actually there.
- Do NOT turn the article into a story about the video itself. Never begin with phrases like "In this video, [name] discusses..." or "In this clip...". The article must stand alone as a useful answer someone could discover through search, with no reference to it having come from a video/clip at all.
- Structure: question as headline -> direct answer in the opening paragraph -> explain why -> explain the problem or trade-off -> relevant examples/context from the speaker only where supported by the source -> practical guidance -> where GENUINELY relevant, explain how The Culo Village or Culo Creatives addresses part of the problem (set culoConnectionMade true only if you actually did this) -> a clear conclusion answering the original question.
- Do not force a CULO connection into every article — if there's no genuine, specific tie-in, leave it out entirely and set culoConnectionMade to false.

STEP 3 — Bail out honestly.
If the source material does not contain enough real information to answer a worthwhile search question, return status "insufficient_source" with a one-sentence note on what's missing. Do not create a weak, generic article just to have something to show.

Also generate: three related questions people may realistically search alongside the primary one, a suggested SEO title, a suggested meta description (under 160 characters), and a suggested URL slug (lowercase, hyphenated, no stop words beyond what reads naturally).

Respond with ONLY a JSON object, no markdown fences, no commentary:
{
  "status": "ready" or "insufficient_source",
  "note": "only when insufficient_source — one honest sentence on what's missing",
  "primaryQuestion": "only when ready — the real question, worded the way someone would actually search it",
  "relatedQuestions": ["only when ready — exactly three related questions"],
  "headline": "only when ready — the article headline, written as the question wherever possible",
  "article": "only when ready — the full article body, plain text with blank lines between paragraphs, no markdown headers",
  "seoTitle": "only when ready",
  "seoDescription": "only when ready — under 160 characters",
  "slug": "only when ready — lowercase, hyphenated",
  "culoConnectionMade": true or false
}`

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })

  try {
    const body = await req.json() as RequestBody
    if (!body?.sourceText?.trim()) throw new Error('sourceText is required')

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) throw new Error('AI writing is not configured yet')

    const userContent = [
      `SPEAKER'S NAME: ${body.founderName || '(not supplied)'}`,
      body.platform ? `SOURCE PLATFORM: ${body.platform}` : undefined,
      `\nSOURCE CLIP/TRANSCRIPT:\n${body.sourceText}`,
    ].filter(Boolean).join('\n')

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 3000,
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
    const parsed = JSON.parse(cleaned) as GeneratedSearchAnswer

    return new Response(JSON.stringify({ result: parsed }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
