// Culo Editorial Engine — Stage 2: Writer.
//
// Two distinct call shapes from the one function (via `type`), per the
// agreed build order: 2A Profile Writer (one call per founder, produces
// the bio) and 2B Source Journalist (one call per valid source, produces
// one article each) — never regenerating the bio per source, and never
// blending a founder's whole story into every single article.
//
// Reads ONLY the Evidence Ledger passed in — never re-searches, never
// invents beyond what Stage 1 already verified. This is the hard boundary
// that keeps research and writing separated.
//
// Deploy: supabase functions deploy editorial-write --no-verify-jwt

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface EvidenceClaim {
  claim: string
  claim_type: string
  verification_status: string
  confidence: string
  subject: string
  speaker?: string
  sensitive: boolean
  first_party_only: boolean
  sources: { url: string; source_type: string; publisher?: string; source_date?: string }[]
}

interface SourceAssessment {
  url: string
  source_valid: boolean
  source_valid_reason?: string
  source_title?: string
  publisher?: string
  source_date?: string
}

interface RequestBody {
  type: 'profile_bio' | 'source_article'
  founderName: string
  // First-name style after first reference — a founder's own stated
  // preference (confirmed directly this session), not a default choice.
  firstName: string
  claims: EvidenceClaim[]
  // Only for type = 'source_article' — which specific source this piece is
  // about. The writer still sees every claim for context, but the article
  // must centre on this source, not retell the whole profile.
  targetSource?: SourceAssessment
}

const SHARED_RULES = `You are the Culo Journalist, the writing stage of Culo's editorial engine for The Culo Village.

You write ONLY from the Evidence Ledger you're given below — every claim already carries its own claim_type and verification_status from a separate research stage. You never invent a new fact, statistic, date, quote, or claim not present in the ledger, and you never upgrade an attributed_statement into a plain fact.

THE CORE RULE, stated three ways because it is the one that matters most:
- A "fact" claim may be stated plainly.
- An "attributed_statement" claim must stay attributed to its speaker — write "X argues...", "X believes...", "X told...", "According to X...", never state it as if it were independently established.
- An "unverified" or "conflicting" claim must either be omitted, or explicitly flagged as unconfirmed if including it serves the piece ("this hasn't been independently confirmed, but...").
- Never convert "X says Y" into "Y is true."

NAMING: use the founder's full name on first reference, then their FIRST NAME throughout — "{firstName} argues...", "{firstName}'s work...". Never use only the surname after the first reference.

BANNED WORDS/PHRASES (do not use, in any form): "leading," "renowned," "revolutionary," "world-class," "visionary," "groundbreaking," "authenticity," "journey," "unlock," "elevate," "game-changer," "in today's world."

Never manufacture emotional depth or drama not present in the ledger. Never open with "Are you...?" or end with a generic call-to-action. No em dashes — use a full stop or a line break instead. Australian English spelling throughout.

Output ONLY a single valid JSON object, no markdown fences, no commentary before or after it.`

const PROFILE_BIO_PROMPT = `${SHARED_RULES}

TASK: write a short founder bio (roughly 3-5 sentences, one paragraph) synthesising the founder's identity, real role(s), and what their work actually focuses on — drawn only from "fact" and well-attributed claims in the ledger. Do not attempt to cover every claim; pick what actually establishes who this person is.

{
  "title": "the founder's full name, exactly as given",
  "body": "the bio, one paragraph, first reference full name then first name throughout"
}`

const SOURCE_ARTICLE_PROMPT = `${SHARED_RULES}

TASK: write one real, original article (roughly 250-500 words, 3-5 paragraphs) about the founder's appearance in ONE specific source (given below as targetSource). Centre the piece on what that source actually covers — use other ledger claims only as brief supporting context, never as the main subject. This is journalism about a real appearance, not a repeat of the founder's whole biography.

If a claim used in this article is "attributed_statement," keep it attributed throughout the piece, not just in one sentence — a reader should never come away thinking it was independently confirmed.

{
  "title": "a real, specific 5-12 word title for this piece",
  "body": "the article body, 3-5 paragraphs, first reference full name then first name throughout",
  "claim_ids_used": ["the exact claim strings from the ledger that this article actually drew on, for the Auditor's own reference"]
}`

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })

  try {
    const body = await req.json() as RequestBody
    if (!body?.founderName || !body?.claims?.length) throw new Error('founderName and claims are required')
    if (body.type === 'source_article' && !body.targetSource) throw new Error('targetSource is required for source_article')

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) throw new Error('Editorial writing is not configured yet')

    const systemPrompt = (body.type === 'profile_bio' ? PROFILE_BIO_PROMPT : SOURCE_ARTICLE_PROMPT)
      .replace(/\{firstName\}/g, body.firstName)

    const ledgerText = JSON.stringify(body.claims, null, 2)
    const targetSourceText = body.targetSource ? `\n\nTARGET SOURCE FOR THIS ARTICLE:\n${JSON.stringify(body.targetSource, null, 2)}` : ''
    const userText = `Founder: ${body.founderName}\n\nEVIDENCE LEDGER (only source of fact — never invent beyond this):\n${ledgerText}${targetSourceText}`

    const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 529])
    async function callAnthropic(): Promise<Response> {
      let lastResponse: Response | undefined
      for (let attempt = 0; attempt < 4; attempt++) {
        if (attempt > 0) {
          const retryAfterHeader = lastResponse?.headers.get('retry-after')
          const retryAfterSeconds = retryAfterHeader ? Number(retryAfterHeader) : undefined
          const delayMs = retryAfterSeconds && !Number.isNaN(retryAfterSeconds)
            ? retryAfterSeconds * 1000
            : 3000 * 2 ** (attempt - 1)
          await new Promise(r => setTimeout(r, delayMs))
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
            max_tokens: 2000,
            system: systemPrompt,
            messages: [{ role: 'user', content: userText }],
          }),
        })
        if (res.ok || !RETRYABLE_STATUS.has(res.status)) return res
        lastResponse = res
      }
      return lastResponse!
    }

    const response = await callAnthropic()
    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`Writer request failed (${response.status}): ${errText}`)
    }

    const data = await response.json()
    const textBlocks = (data.content ?? []).filter((b: { type: string }) => b.type === 'text')
    const raw = textBlocks[textBlocks.length - 1]?.text?.trim()
    if (!raw) throw new Error('Writer returned no text')

    const withoutFences = raw.replace(/```(?:json)?/gi, '').trim()
    const firstBrace = withoutFences.indexOf('{')
    if (firstBrace === -1) throw new Error(`Writer returned no JSON object: ${withoutFences.slice(0, 200)}`)
    let depth = 0
    let endIndex = -1
    for (let i = firstBrace; i < withoutFences.length; i++) {
      if (withoutFences[i] === '{') depth++
      else if (withoutFences[i] === '}') {
        depth--
        if (depth === 0) { endIndex = i; break }
      }
    }
    if (endIndex === -1) {
      throw new Error(
        `Writer returned an incomplete JSON object (stop_reason: ${data.stop_reason ?? 'unknown'}, ` +
        `length: ${withoutFences.length} chars). Tail: ...${withoutFences.slice(-300)}`,
      )
    }
    const cleaned = withoutFences.slice(firstBrace, endIndex + 1)
    const draft = JSON.parse(cleaned)

    return new Response(JSON.stringify({ draft }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
