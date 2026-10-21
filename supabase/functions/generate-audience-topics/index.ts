// Generates a short content-strategy list — up to 10 real, distinct
// questions a founder's own target audience would search — as a planning
// aid for staff working through Culo Members' "Manage content." This is a
// PLAN, not full articles: one cheap call returning headlines/angles only,
// which staff then work through one at a time using "Rewrite for My
// Audience" (generate-audience-answer) against whichever of the founder's
// own imported pieces actually fits each idea — matching an idea to a real
// post is a human judgment call, not something this call tries to do.
//
// Deploy: supabase functions deploy generate-audience-topics --no-verify-jwt

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
  founderName: string
  businessName: string
  businessDescription?: string
  targetAudience?: string
  voiceBrief?: string
  insightBrief?: string
  // Titles/captions of this founder's own unpublished archive — real
  // evidence of what they actually have to work with, so ideas aren't
  // pure invention disconnected from anything they could realistically
  // write using "Rewrite for My Audience" against a real piece.
  archiveSample?: string[]
  usedQuestions?: string[]
}

interface AudienceTopicIdea {
  question: string
  angle: string
}

interface GeneratedAudienceTopics {
  status: 'ready' | 'insufficient_source'
  note?: string
  audienceUsed?: string
  topics?: AudienceTopicIdea[]
}

const SYSTEM_PROMPT = `You are planning a 10-article content series for a real founder's own business, aimed squarely at their real target audience.

If a real target audience is stated below, plan for exactly that audience. If none is stated, work it out yourself from the business description and Voice/Insight Brief — state who you're planning for in audienceUsed, as specifically as the material actually supports.

Your job: generate up to 10 real, genuinely distinct questions this specific audience would plausibly search in Google or ask an AI system — the kind of series a smart content strategist for this exact business would plan, not generic topics that could apply to any business. Each one should be something this founder's real business/experience could genuinely help answer (grounded in the business description and Voice/Insight Brief), not just topically adjacent.

If a sample of the founder's own unpublished archive (post titles/captions) is supplied, prefer angles a strong reader of that list could see this founder plausibly writing about — real signal of what they actually have material for — without being limited only to literal rewrites of those titles.

Never repeat a question in PREVIOUSLY USED QUESTIONS below, and avoid anything too close to one of them in substance.

Each idea needs:
- question: the real, natural search question, worded the way the audience would actually type or ask it.
- angle: one sentence on the real, specific angle THIS founder/business would bring to it — not a generic answer anyone could give.

Return fewer than 10 only if you genuinely cannot find 10 real, distinct, honestly-groundable angles for this specific business and audience — never pad with generic or repetitive ideas to hit the number.

Respond with ONLY a JSON object, no markdown fences, no commentary:
{
  "status": "ready" or "insufficient_source",
  "note": "only when not ready, or when returning fewer than 10 — one honest sentence why",
  "audienceUsed": "the specific audience these topics were planned for",
  "topics": [{"question": "...", "angle": "..."}]
}`

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })

  try {
    const body = await req.json() as RequestBody
    if (!body?.businessName?.trim()) throw new Error('businessName is required')

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) throw new Error('AI writing is not configured yet')

    const userContent = [
      `FOUNDER'S NAME: ${body.founderName || '(not supplied)'}`,
      `BUSINESS: ${body.businessName}${body.businessDescription ? ` — ${body.businessDescription}` : ''}`,
      `REAL TARGET AUDIENCE: ${body.targetAudience?.trim() || '(not specified — work this out yourself from the business description and Voice/Insight Brief below)'}`,
      body.archiveSample?.length ? `\nSAMPLE OF THE FOUNDER'S OWN UNPUBLISHED ARCHIVE (real signal of what they have material for):\n${body.archiveSample.slice(0, 30).map(t => `- ${t}`).join('\n')}` : undefined,
      `\nPREVIOUSLY USED QUESTIONS (never repeat these or anything too close):\n${
        body.usedQuestions?.length ? body.usedQuestions.map(q => `- ${q}`).join('\n') : '(none yet)'
      }`,
      body.voiceBrief?.trim() ? `\nFOUNDER'S VOICE & BRAND BRIEF:\n${body.voiceBrief}` : undefined,
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
          max_tokens: 3000,
          thinking: { type: 'adaptive' },
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: userContent }],
        }),
      })
    }

    async function generateOnce(): Promise<GeneratedAudienceTopics> {
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
      return JSON.parse(sanitizeJsonControlChars(cleaned)) as GeneratedAudienceTopics
    }

    let parsed: GeneratedAudienceTopics
    try {
      parsed = await generateOnce()
    } catch (firstErr) {
      if (!(firstErr instanceof SyntaxError)) throw firstErr
      parsed = await generateOnce()
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
