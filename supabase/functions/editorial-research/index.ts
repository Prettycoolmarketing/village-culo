// Culo Editorial Engine — Stage 1: Researcher.
//
// Takes a founder's real source links (article/YouTube/podcast/product)
// and produces a structured Evidence Ledger: real, verified claims about
// them, each traceable to a real source, with an explicit distinction
// between plain fact and attributed opinion — never prose, never an
// article. Stage 2 (Profile Writer / Source Journalist, not built yet)
// reads from this and may never invent beyond it.
//
// This is deliberately the ONLY stage built so far (per the agreed build
// order: schema + risk rules, then prove Stage 1 alone before writing or
// auditing anything). Nothing here produces publishable content.
//
// NOTE before first real deploy: verify the web_search tool's exact type
// string (web_search_20250305 below) against Anthropic's current API
// docs — tool versions get bumped, and this was written from what's
// documented as of this build, not a live-verified call.
//
// Deploy: supabase functions deploy editorial-research --no-verify-jwt

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface SourceInput {
  importedContentId?: string
  url: string
  sourceType: 'article' | 'youtube' | 'podcast' | 'website' | 'other'
}

interface RequestBody {
  founderId: string
  founderName: string
  // Whatever real, curator-provided leads already exist — treated as
  // UNVERIFIED LEADS to investigate, never as facts to publish as-is. This
  // is the core discipline this whole engine exists to enforce: an
  // imported spreadsheet field is a place to start looking, not something
  // already true because it's in the database.
  existingBio?: string
  existingHeadline?: string
  // Anything else that helps identify the right person in search results
  // when there's no pre-supplied link to confirm against — business name,
  // role, location, industry. Same discipline as existingBio: a lead to
  // chase, never a fact to restate.
  identityHints?: string
  // Curator-supplied links to verify are the common case, but never a
  // hard requirement — a founder with no linked content yet still gets
  // researched from their name and whatever identity hints exist. The
  // spreadsheet a founder was curated from is there to help find the
  // right person, not to gate whether research happens at all.
  sources: SourceInput[]
}

const RESEARCHER_SYSTEM_PROMPT = `You are the Culo Researcher, the fact-finding stage of Culo's editorial engine for The Culo Village.

Your only job is to research a real, named founder using real web search, and return a structured Evidence Ledger — never prose, never an article, never a bio. A later, separate stage writes the actual piece from what you find here; you never write it yourself.

CORE RULE: treat every field provided to you (an imported bio, a headline, a business description) as an UNVERIFIED LEAD to investigate, not as an established fact. Your job is to confirm, correct, or flag each one using independent web research — never to simply restate it as verified.

Sometimes you'll be given no source URLs at all — only the founder's name and a few identifying leads. In that case, search the web yourself to find the real person and build the whole ledger from what you discover; do not refuse just because nothing was pre-supplied. Be honest about identity confidence: a common name with thin corroborating detail should get identity_confidence "low" or "medium," never "high" just because a plausible-looking result came up.

For each source URL you're given:
1. Confirm it actually, substantially features this specific founder (not someone who shares their name, not a page that merely mentions them in passing). If you cannot confirm this, or cannot access the source, set source_valid to false and give a specific reason — never invent content for an unreachable or irrelevant source.
2. Extract real, specific claims: what happened, when, with whom, what they said, what they believe or argue.
3. For every claim, classify it:
   - "fact": independently verifiable information (what happened, when, roles held, businesses founded).
   - "attributed_statement": something the person said, believes, argues, or predicts — this must stay attributed to them, never converted into an objective fact.
   - "culo_analysis_candidate": something that would require editorial interpretation to state, not a fact you found directly.
   - "unverified": you found it stated somewhere but cannot independently confirm it.
   - "conflicting": two sources disagree — describe the conflict, do not pick whichever sounds most plausible.
4. Mark first_party_only: true when only the founder's own material (their site, their own words) supports a claim — no independent corroboration exists.
5. Mark sensitive: true for anything touching health, legal, financial, criminal, reputational, or otherwise requiring heightened care.
6. Never invent a quotation. Only include a direct quote if the exact wording is genuinely present in a source you found.

You must also give an honest, holistic risk assessment across everything you found: reputational_risk (none/low/medium/high), health_science_risk, legal_risk, financial_risk (each true only if the research surfaced something in that category, not a default).

Output ONLY a single valid JSON object matching this exact shape, no markdown fences, no commentary:

{
  "claims": [
    {
      "claim": "string — the specific claim, plainly stated",
      "claim_type": "fact | attributed_statement | culo_analysis_candidate | unverified | conflicting",
      "verification_status": "verified | attributed | unverified",
      "confidence": "high | medium | low",
      "subject": "string — who this claim is about (usually the founder's name)",
      "speaker": "string — only when claim_type is attributed_statement, who said/believes it",
      "sensitive": true or false,
      "first_party_only": true or false,
      "sources": [{ "url": "string", "source_type": "article | youtube | podcast | website | other", "publisher": "string", "source_date": "YYYY-MM-DD if known" }]
    }
  ],
  "source_assessments": [
    {
      "imported_content_id": "string, if provided for this source",
      "url": "string",
      "source_valid": true or false,
      "source_valid_reason": "string — required when source_valid is false",
      "source_title": "string",
      "publisher": "string",
      "source_date": "YYYY-MM-DD if known",
      "identity_confidence": "high | medium | low — how confident you are this source is genuinely about the named founder, not someone else with the same name"
    }
  ],
  "reputational_risk": "none | low | medium | high",
  "health_science_risk": true or false,
  "legal_risk": true or false,
  "financial_risk": true or false
}`

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })

  try {
    const body = await req.json() as RequestBody
    if (!body?.founderId || !body?.founderName) throw new Error('founderId and founderName are required')

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) throw new Error('Editorial research is not configured yet')

    const leadsBlock = [
      body.existingHeadline ? `Imported headline (unverified lead): ${body.existingHeadline}` : undefined,
      body.existingBio ? `Imported bio (unverified lead — investigate, do not restate as fact): ${body.existingBio}` : undefined,
      body.identityHints ? `Other identifying info (unverified lead, to help find the right person — not a fact): ${body.identityHints}` : undefined,
    ].filter(Boolean).join('\n')

    const hasSources = body.sources && body.sources.length > 0
    const sourcesBlock = hasSources
      ? body.sources
          .map((s, i) => `${i + 1}. [${s.sourceType}] ${s.url}${s.importedContentId ? ` (imported_content_id: ${s.importedContentId})` : ''}`)
          .join('\n')
      : undefined

    const userText = hasSources
      ? `Research this founder: ${body.founderName}\n\n${leadsBlock ? leadsBlock + '\n\n' : ''}Sources to investigate:\n${sourcesBlock}\n\nSearch the web to verify who this person is and confirm each source above genuinely features them. Build the Evidence Ledger from what you actually find.`
      : `Research this founder: ${body.founderName}\n\n${leadsBlock ? leadsBlock + '\n\n' : ''}No sources were pre-supplied — search the web yourself to find real, current public information about this specific person (use the identifying info above to make sure you have the right person, not someone else with the same name). Build the Evidence Ledger entirely from what you find, including the sources you discover yourself.`

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
            // Web search consumes real output tokens on search-tool-use
            // turns before the model ever reaches the final JSON — 4000 was
            // confirmed live to truncate the ledger mid-object on a real
            // 2-source run. Raised well above what a several-claim ledger
            // actually needs.
            max_tokens: 8000,
            system: RESEARCHER_SYSTEM_PROMPT,
            // Server-side web search — Claude decides its own search queries
            // and reads results directly; this is the live-research step the
            // deterministic template path never had. See the version-check
            // note at the top of this file.
            tools: [
              { type: 'web_search_20250305', name: 'web_search', max_uses: 8 },
            ],
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
      throw new Error(`Research request failed (${response.status}): ${errText}`)
    }

    const data = await response.json()
    // With web_search enabled, Claude may return multiple content blocks
    // (search calls, results, then its final text) — the ledger is the
    // final text block, not necessarily the first one.
    const textBlocks = (data.content ?? []).filter((b: { type: string }) => b.type === 'text')
    const raw = textBlocks[textBlocks.length - 1]?.text?.trim()
    if (!raw) throw new Error('Research returned no text')

    // Despite the system prompt asking for JSON only, web_search's
    // multi-turn tool loop means the model's final text block sometimes
    // opens with a plain-language recap before the object (confirmed
    // live: a real response started "The BreakUP Buddy app..." before its
    // JSON) — extract the first balanced {...} block instead of assuming
    // the whole trimmed string is already valid JSON.
    const withoutFences = raw.replace(/```(?:json)?/gi, '').trim()
    const firstBrace = withoutFences.indexOf('{')
    if (firstBrace === -1) throw new Error(`Research returned no JSON object: ${withoutFences.slice(0, 200)}`)
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
      // Diagnostic detail on the actual failure — stop_reason distinguishes
      // "genuinely truncated by max_tokens" from some other malformed-output
      // cause, and the tail of the text shows exactly where it cut off.
      throw new Error(
        `Research returned an incomplete JSON object (stop_reason: ${data.stop_reason ?? 'unknown'}, ` +
        `length: ${withoutFences.length} chars). Tail: ...${withoutFences.slice(-300)}`,
      )
    }
    const cleaned = withoutFences.slice(firstBrace, endIndex + 1)
    const ledger = JSON.parse(cleaned)
    ledger.researched_at = new Date().toISOString()

    return new Response(JSON.stringify({ ledger }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
