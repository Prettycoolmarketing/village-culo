// CULO Village — voice-brief-interview
//
// For a founder with no existing STORY_VOICE_AND_INSIGHT_PROFILE.md and no
// AI chat history to mine (unlike VOICE_BRIEF_INTERVIEW_PROMPT in
// src/services/blogWriter.ts, which asks an outside AI to extract from
// months of prior conversation), this runs a short, real, one-question-at-a-
// time interview in the app itself. Each turn sends the whole conversation
// back; the model either asks the next question or — once it has enough —
// returns the finished Voice & Brand Brief, in the same shape the pasted-in
// or uploaded version produces, so downstream (generate-blog) can't tell
// the difference.
//
// Deploy: supabase functions deploy voice-brief-interview --no-verify-jwt

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface TurnMessage {
  role: 'user' | 'assistant'
  content: string
}

interface RequestBody {
  founderName?: string
  messages: TurnMessage[]
}

interface TurnResult {
  done: boolean
  message: string
  brief?: string
}

const MAX_QUESTIONS = 14

const SYSTEM_PROMPT = `You are interviewing a founder, one question at a time, to build their permanent "Voice & Brand Brief" — the reference document CULO Village uses to write blogs, captions and stories in their real voice instead of generic AI writing.

You have no prior context on this person beyond what they tell you in this conversation. Everything in the final brief must come from their own answers — never invent a business name, date, number, story detail or belief they haven't stated.

## How to run the interview

Ask exactly one question per turn, in plain conversational language — not a form, not a numbered list. Read their previous answer before asking the next question: reference what they said, dig one level deeper when something sounds like a real story worth capturing, and move on when it doesn't. Cover, roughly in this order, but adapt naturally based on their answers:

1. Who they are and what they've built (name, business(es), what it actually does)
2. The real chapters of their story so far — how they got here, in rough chronological order
3. One or two specific stories/moments they'd want told (a turning point, a mistake, a customer moment, a decision)
4. What they can genuinely teach someone else — their real expertise, not aspirational
5. How they naturally talk — ask them to just answer like they're texting a friend, then note the rhythm/vocabulary yourself from HOW they answer rather than asking them to describe their own "brand voice"
6. What they'd never want said about them, or any topics that are off-limits or need care
7. What they want to eventually become known for

Ask at most ${MAX_QUESTIONS} questions total. Stop earlier if you already have enough real material for a genuinely useful brief — don't pad the interview out. If an answer is thin, you may ask one natural follow-up, but don't interrogate; move on and note the gap in the brief instead.

## When to finish

Once you have enough — or you've reached the question limit — stop asking and produce the finished brief instead.

## Output format

Respond with ONLY a single valid JSON object, no markdown fences, no commentary outside it, matching exactly one of these two shapes:

While still interviewing:
{"done": false, "message": "<your next question, warm and conversational, 1-3 sentences>"}

When finished:
{"done": true, "message": "<a short, warm one-line wrap-up telling them their brief is ready>", "brief": "<the full Voice & Brand Brief as markdown>"}

## The brief itself

When producing "brief", write a genuinely useful markdown document with these sections, using only what they actually told you (mark anything you're inferring rather than were told directly, e.g. voice patterns you noticed rather than were described, as "(inferred from how they answered)"):

# Voice & Brand Brief

## Who they are
## Their story so far (chronological)
## Stories worth telling (each with: what happened, why it matters, what a reader takes from it)
## What they can genuinely teach
## Voice — how they actually talk (sentence rhythm, vocabulary, tone, what to avoid)
## Sensitive topics / boundaries
## Where they're headed / what they want to be known for

If an interview only produced thin material for a section, say so plainly in that section (e.g. "Not yet covered — worth revisiting") rather than inventing content to fill it.

Never break character to explain what you're doing — every response is pure JSON, nothing else.`

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })

  try {
    const body = await req.json() as RequestBody
    if (!Array.isArray(body?.messages)) throw new Error('messages is required')

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) throw new Error('AI writing is not configured yet')

    const messages = body.messages.length > 0
      ? body.messages
      : [{ role: 'user' as const, content: `I'm ${body.founderName?.trim() || 'ready'} — let's start.` }]

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-8',
        max_tokens: 4000,
        thinking: { type: 'adaptive' },
        system: SYSTEM_PROMPT,
        messages,
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`AI request failed (${response.status}): ${errText}`)
    }

    const data = await response.json()
    const textBlock = (data.content ?? []).find((b: { type: string }) => b.type === 'text')
    const raw = textBlock?.text?.trim()
    if (!raw) throw new Error('AI returned no text')

    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim()
    const parsed = JSON.parse(cleaned) as TurnResult

    return new Response(JSON.stringify(parsed), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
