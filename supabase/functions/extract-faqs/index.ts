// Turns a piece of raw content (caption/blog/transcript) into genuinely
// useful FAQ pairs — the kind a real reader, search engine or AI assistant
// would actually ask, inferred from what the piece implies as much as what
// it states outright. Replaces the old rule-based keyword-category matcher
// (extractQaFromBlog), which could only ever produce templated questions
// ("What challenges did they face?") regardless of what the piece was
// actually about.
//
// Example of the gap this closes: a caption that says "I'm editing a vlog
// on CULO" doesn't contain the word "editing app" or "software" as a
// keyword to match against, but a real reader would wonder "what editing
// tool are founders using?" — that's an inference, not a keyword hit.
//
// Deploy: supabase functions deploy extract-faqs --no-verify-jwt

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface RequestBody {
  title?: string
  text: string
  // Used so answers refer to the founder by name instead of a vague "they"/
  // "the founder" — clearer for a reader and better for AI/search discovery
  // (the founder's own name appearing next to the topic they're known for).
  founderName?: string
}

interface FaqPair {
  question: string
  answer: string
}

const SYSTEM_PROMPT = `You read one piece of founder content (a caption, blog or video transcript) and produce genuinely useful FAQ pairs from it — the real questions a curious reader, a search engine, or an AI assistant would actually ask about this specific piece.

The whole point is inference, not keyword-matching. A caption that says "I'm editing a vlog on CULO" never uses the words "editing software," but a real reader would wonder "What app do founders use to edit their videos?" — spot questions like that, implied by what's actually said, not just questions that restate a sentence with "what/why/how" bolted on.

Rules:
- Every answer must be genuinely supported by the text — either a direct quote/paraphrase, or a reasonable, honest inference a reader would also make from what's written (e.g. "CULO" mentioned as what they're editing on implies it's their video editing tool). Never invent a fact, a name, a number, or a detail that isn't in the text or a fair inference from it.
- Skip generic template questions ("What challenges did they face?") unless the text actually supports a real, specific answer to that exact question.
- Prefer questions a real person would type into Google or ask an AI assistant — specific, practical, curious — over questions that just restate the content back as a question.
- 3 to 6 pairs. Fewer good pairs beats padding with weak ones.
- Keep answers short — 1 to 2 sentences, in the founder's own voice/words where possible.
- When the founder's name is supplied and a question/answer needs to refer to them in the third person, use their actual name (e.g. "What editing app does Shakas use?" / "Shakas edits on CULO.") instead of a vague "they," "the founder," or "the creator" — it reads more specifically and gives search engines/AI assistants a real name to connect to the topic. Don't force the name into every single sentence if it reads awkwardly repeated; once naturally per pair is enough.

If the text is too thin to honestly support any real FAQ (a single generic sentence, nothing specific), return an empty pairs array rather than inventing filler.

Respond with ONLY a JSON object, no markdown fences, no commentary:
{ "pairs": [{ "question": "...", "answer": "..." }] }`

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })

  try {
    const body = await req.json() as RequestBody
    if (!body?.text?.trim()) throw new Error('text is required')

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) throw new Error('AI writing is not configured yet')

    const userContent = [
      body.founderName ? `FOUNDER NAME: ${body.founderName}` : '',
      body.title ? `TITLE: ${body.title}` : '',
      `CONTENT:\n${body.text}`,
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
        max_tokens: 1200,
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
    const parsed = JSON.parse(cleaned) as { pairs?: FaqPair[] }

    return new Response(JSON.stringify({ pairs: parsed.pairs ?? [] }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
