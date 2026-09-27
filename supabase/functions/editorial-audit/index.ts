// Culo Editorial Engine — Stage 3: Auditor.
//
// Reads a Writer draft AND the Evidence Ledger it was supposed to be
// written from, and checks the draft against the ledger — not the other
// way around. The Auditor never re-researches and never rewrites; it only
// verifies that every substantive claim in the draft actually traces back
// to a real ledger claim, with attribution preserved where the ledger
// required it.
//
// This is a separate model call from the Writer on purpose — the same
// model that wrote a sentence is a poor judge of whether it quietly
// overstepped the source. A second, independent pass reading the same
// ledger is what catches an invented fact or a dropped "argues"/"believes."
//
// Deploy: supabase functions deploy editorial-audit --no-verify-jwt

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
}

interface RequestBody {
  founderName: string
  draftTitle?: string
  draftBody: string
  claims: EvidenceClaim[]
}

const AUDITOR_SYSTEM_PROMPT = `You are the Culo Auditor, the fact-checking stage of Culo's editorial engine for The Culo Village.

You are given a draft article/bio and the Evidence Ledger it was supposed to be written from. Your only job is to check the draft against the ledger — you never rewrite it, never do new research, and never add your own outside knowledge of the subject.

For every substantive claim in the draft (a fact, date, number, role, quote, or attributed opinion), check:
1. Does this claim actually appear in the ledger, in substance? A claim not traceable to any ledger entry is an INVENTED FACT — the most serious issue, always "reject".
2. If the matching ledger claim has claim_type "attributed_statement", does the draft sentence keep it attributed to the speaker (e.g. "X argues", "X believes", "according to X")? A dropped attribution that lets an opinion read as an established fact is a DROPPED_ATTRIBUTION issue.
3. If the matching ledger claim has claim_type "unverified" or "conflicting", has the draft stated it as if confirmed? That is an OVERSTATED_CONFIDENCE issue.
4. Names, numbers, dates and titles must match the ledger exactly — any drift (wrong year, wrong company, misspelled name) is a FACTUAL_DRIFT issue.

Do not flag stylistic choices, phrasing, word count, or which claims were chosen to include — only flag genuine mismatches against the ledger.

If you consider flagging something and then conclude on reflection that it's actually fine, do not include it in "issues" at all — not even to note that it turned out to be correct. Every entry in "issues" must be a real, standing problem; the array should be empty when nothing is wrong.

Give a holistic verdict:
- "pass": every claim in the draft traces cleanly to the ledger with attribution intact.
- "review": at least one issue found, but none is an invented fact — a human should look before this goes further.
- "reject": at least one invented fact, or a factual drift serious enough that the piece is not trustworthy as written.

Output ONLY a single valid JSON object, no markdown fences, no commentary:

{
  "verdict": "pass | review | reject",
  "issues": [
    {
      "sentence": "the exact sentence or clause from the draft with the issue",
      "issue_type": "INVENTED_FACT | DROPPED_ATTRIBUTION | OVERSTATED_CONFIDENCE | FACTUAL_DRIFT",
      "explanation": "one sentence on what's wrong and what the ledger actually supports"
    }
  ]
}`

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })

  try {
    const body = await req.json() as RequestBody
    if (!body?.founderName || !body?.draftBody) throw new Error('founderName and draftBody are required')
    if (!body.claims?.length) throw new Error('claims are required')

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) throw new Error('Editorial auditing is not configured yet')

    const ledgerText = JSON.stringify(body.claims, null, 2)
    const userText = `Founder: ${body.founderName}\n\nEVIDENCE LEDGER (the only source of truth — check the draft against this, never against your own outside knowledge):\n${ledgerText}\n\nDRAFT TO AUDIT:\nTitle: ${body.draftTitle ?? '(none)'}\nBody:\n${body.draftBody}`

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
            system: AUDITOR_SYSTEM_PROMPT,
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
      throw new Error(`Audit request failed (${response.status}): ${errText}`)
    }

    const data = await response.json()
    const textBlocks = (data.content ?? []).filter((b: { type: string }) => b.type === 'text')
    const raw = textBlocks[textBlocks.length - 1]?.text?.trim()
    if (!raw) throw new Error('Audit returned no text')

    const withoutFences = raw.replace(/```(?:json)?/gi, '').trim()
    const firstBrace = withoutFences.indexOf('{')
    if (firstBrace === -1) throw new Error(`Audit returned no JSON object: ${withoutFences.slice(0, 200)}`)
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
        `Audit returned an incomplete JSON object (stop_reason: ${data.stop_reason ?? 'unknown'}, ` +
        `length: ${withoutFences.length} chars). Tail: ...${withoutFences.slice(-300)}`,
      )
    }
    const cleaned = withoutFences.slice(firstBrace, endIndex + 1)
    const result = JSON.parse(cleaned)

    return new Response(JSON.stringify({ result }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
