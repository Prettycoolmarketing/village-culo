// Turns one of a founder's own posts into a standalone article answering a
// real question THEIR OWN target audience would search — sibling to
// generate-search-answer, which does the same thing but only ever for
// CULO's own fixed Topic Bank (founders/personal branding/AI discovery).
// That makes generate-search-answer structurally unusable for a founder
// whose content has nothing to do with CULO at all (confirmed real: a
// parenting-app founder's birthday-traditions post always failed
// generate-search-answer's "connects to a Topic Bank question" check,
// because it genuinely never could). This answers a question real people
// in THIS founder's own stated target audience would plausibly search,
// using the source post as the real example, and genuinely ties back to
// the founder's own business/product where it actually helps — not CULO.
//
// Deploy: supabase functions deploy generate-audience-answer --no-verify-jwt

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'

// Same fix as generate-blog/generate-search-answer — Claude's JSON mode can
// produce real newline characters inside a string value, which is valid
// model intent but invalid JSON syntax.
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
  founderName: string
  sourceText: string
  platform?: string
  voiceBrief?: string
  insightBrief?: string
  // The real business and audience this article is actually for — without
  // this there's no "their own audience" to write for at all, so the
  // caller requires it rather than silently falling back to something
  // generic.
  businessName: string
  businessDescription?: string
  targetAudience: string
  businessWebsite?: string
  // Every primaryQuestion a past run already used for this founder, same
  // rotation mechanism as generate-search-answer's usedQuestions.
  usedQuestions?: string[]
}

interface GeneratedAudienceAnswer {
  status: 'ready' | 'insufficient_source'
  note?: string
  primaryQuestion?: string
  headline?: string
  article?: string
  relatedQuestions?: string[]
  seoTitle?: string
  seoDescription?: string
  slug?: string
  sourceUsed?: string
  businessRelevant?: boolean
  coreArgument?: string
}

const SYSTEM_PROMPT = `You are writing an article on behalf of a real founder, aimed squarely at THEIR OWN real target audience — not a generic reader, and not about the founder's own business/brand-building. The goal is to answer a real question people in that specific audience are likely to search in Google, ChatGPT, Gemini, Perplexity or other search/AI systems.

You are given one real post from the founder (the source material) and their business's real target audience. Your job: find the genuine question that audience would ask that THIS source material can honestly help answer, then answer it directly, using the source post as the real example/evidence.

Do not write an article about the post itself. Do not say "In this post I said...", "I recently posted...", or describe the post as a post. Identify the strongest real audience question the source can genuinely answer, and write the article as a direct answer to that question, using the post's own content and any real material in the Voice/Insight Brief as your source of what actually happened or what you genuinely believe.

ROTATE: you will be given a list of primary questions already used for this founder below — never choose one of those, and prefer a genuinely different angle, not just a reworded version of one.

If the source material doesn't actually connect to anything this specific audience would realistically search, or there isn't enough real material to answer a question honestly, return status "insufficient_source" with a one-sentence note on what's missing. Do not force a connection to the audience that the source doesn't actually support.

ARTICLE DEPTH
Most questions are fully answered in 350-700 strong words — this is a real, useful answer to one audience question, not a comprehensive guide. Never pad to hit a word count.

ARTICLE STRUCTURE
Headline: the actual search question, worded naturally, the way this audience would actually type or ask it.
Direct answer: answer the question in 2-3 sentences immediately, no build-up.
The real example: draw directly on the source post (and Voice/Insight Brief, if they genuinely add something) as the concrete illustration — specific, not generic.
A short practical takeaway: one or two sentences the reader can actually act on.
Where it fits: see BUSINESS PLACEMENT below.

SEARCH AND AI WRITING RULES
Write for humans first. Use the main question naturally throughout. Any subheadings must themselves be phrased as real, searchable questions — plain lines of text, not markdown #. Plain language, no keyword stuffing.

VOICE: first-person throughout, in the founder's own voice. Never third person ("she believes...", "her experience shows...") anywhere, including the subtitle/seoDescription.

Never use a literal double-quote character (") anywhere inside a JSON string value — use single quotes (') instead. This output is parsed as strict JSON and an unescaped double quote breaks the parser.

SOURCE FIDELITY
Do not invent personal experiences, opinions, facts, numbers or outcomes for the founder. You have up to three legitimate sources of their real, already-established opinion and experience:
1. The source post itself.
2. Their VOICE & BRAND BRIEF, if supplied — their own documented story, beliefs and how they explain things.
3. Their INSIGHT BRIEF, if supplied — their own source-checked bank of what they genuinely believe/know/teach.
Only return "insufficient_source" when none of these together give you enough to honestly answer a real question this audience would ask.

BUSINESS PLACEMENT
This article should genuinely help market the founder's real business to their real target audience — not as a bolted-on sales pitch, but the way the best version of this already works: the article's own insight naturally connects back to why the founder built what they built, and what it actually does for people like the reader. Mention the business by name at most once, where it's genuinely earned by what was just said — e.g. "I built [business] after talking to [X] about exactly this" or an equivalent natural, specific connection — never a generic "check out my product" line, and never more than once. If the source material genuinely gives you nothing to connect to the business honestly, it is fine to leave the mention out entirely rather than forcing one. Set businessRelevant to whether you genuinely included a real business tie-in (true) or correctly left it out (false).

Do not write a closing call-to-action list, button text, or sign-off line — end on the practical takeaway or the business connection itself, not a separate "visit us at..." line.

Respond with ONLY a JSON object, no markdown fences, no commentary:
{
  "status": "ready" or "insufficient_source",
  "note": "only when not ready — one honest sentence why",
  "primaryQuestion": "only when ready — the real question, worded the way this audience would actually search it",
  "headline": "only when ready — the article headline",
  "article": "only when ready — the full article body, plain text with blank lines between paragraphs, subheadings as their own plain line, no markdown syntax",
  "relatedQuestions": ["only when ready — exactly three related questions this article also answers for this audience"],
  "seoTitle": "only when ready",
  "seoDescription": "only when ready — under 160 characters",
  "slug": "only when ready — lowercase, hyphenated",
  "sourceUsed": "only when ready — one line describing what in the source material this was built from",
  "businessRelevant": true or false,
  "coreArgument": "only when ready — one sentence stating the actual underlying argument/claim this article hangs on, checked against future runs so a genuine repeat is recognisable"
}`

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })

  try {
    const body = await req.json() as RequestBody
    if (!body?.sourceText?.trim()) throw new Error('sourceText is required')
    if (!body?.targetAudience?.trim()) throw new Error('targetAudience is required — set a target audience on this business first')
    if (!body?.businessName?.trim()) throw new Error('businessName is required')

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) throw new Error('AI writing is not configured yet')

    const userContent = [
      `FOUNDER'S NAME: ${body.founderName || '(not supplied)'}`,
      `BUSINESS: ${body.businessName}${body.businessDescription ? ` — ${body.businessDescription}` : ''}${body.businessWebsite ? ` (${body.businessWebsite})` : ''}`,
      `REAL TARGET AUDIENCE: ${body.targetAudience}`,
      body.platform ? `SOURCE PLATFORM: ${body.platform}` : undefined,
      `\nPREVIOUSLY USED QUESTIONS (never choose one of these again):\n${
        body.usedQuestions?.length ? body.usedQuestions.map(q => `- ${q}`).join('\n') : '(none yet)'
      }`,
      `\nSOURCE POST (the topic anchor and real example):\n${body.sourceText}`,
      body.voiceBrief?.trim() ? `\nFOUNDER'S VOICE & BRAND BRIEF (an equally legitimate source of their real opinion/experience):\n${body.voiceBrief}` : undefined,
      body.insightBrief?.trim() ? `\nFOUNDER'S INSIGHT BRIEF (what they genuinely believe/know/teach):\n${body.insightBrief}` : undefined,
    ].filter(Boolean).join('\n')

    async function callAnthropic(): Promise<Response> {
      return fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-5',
          max_tokens: 4000,
          thinking: { type: 'adaptive' },
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: userContent }],
        }),
      })
    }

    async function generateOnce(): Promise<GeneratedAudienceAnswer> {
      const res = await callAnthropic()
      if (!res.ok) {
        const errText = await res.text()
        throw new Error(`AI request failed (${res.status}): ${errText}`)
      }
      const data = await res.json()
      const textBlock = (data.content ?? []).find((b: { type: string }) => b.type === 'text')
      const raw = textBlock?.text?.trim()
      if (!raw) throw new Error('AI returned no text')
      const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim()
      return JSON.parse(sanitizeJsonControlChars(cleaned)) as GeneratedAudienceAnswer
    }

    let parsed: GeneratedAudienceAnswer
    try {
      parsed = await generateOnce()
    } catch (firstErr) {
      if (!(firstErr instanceof SyntaxError)) throw firstErr
      try {
        parsed = await generateOnce()
      } catch (secondErr) {
        if (secondErr instanceof SyntaxError) {
          throw new Error('The AI\'s response came back malformed twice in a row — please try again.')
        }
        throw secondErr
      }
    }

    return new Response(JSON.stringify({ result: parsed }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
