// Turns one imported piece's raw caption/metadata into a real, distinct blog
// — using the founder's own Voice & Brand Brief as the system prompt, not a
// generic template. Without a real brief behind it, every generated blog
// reads the same regardless of what video it's attached to, which is bad
// for SEO (near-duplicate content across pages) and GEO (nothing distinct
// for an AI system to cite) — see Profile > Settings > Voice & Brand Brief.
//
// Deploy: supabase functions deploy generate-blog --no-verify-jwt

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface RequestBody {
  voiceBrief: string
  founderName: string
  caption?: string
  transcript?: string
  platform: string
  kind?: string
  // When the caption/transcript are thin (common for Stories, and for any
  // YouTube import — nothing here auto-fetches captions), the actual
  // photo(s)/thumbnail are real signal Claude can look at directly instead
  // of writing blind. Capped and best-effort: a failed fetch just drops
  // that one image rather than failing the whole request.
  imageUrls?: string[]
  // The piece's original posting date — used only to place it within the
  // right chapter of the founder's chronological story per the brief,
  // never to invent what happened.
  postedAt?: string
  // Deliberately separate from voiceBrief. voiceBrief is HOW the founder
  // sounds. This is WHAT they already, genuinely believe/know/can teach —
  // their own source-checked insight bank. The two are held to different
  // standards below: this one is only ever allowed to supply a lesson the
  // founder has actually stated: it may never be used to invent what a thin
  // caption/video was actually about.
  insightBrief?: string
}

interface GeneratedBlog {
  // "ready" — enough real source material (caption/transcript/image) or a
  // genuinely applicable, already-stated insight from insightBrief exists to
  // write something true. "insufficient_source" — neither exists; every
  // field below except note is omitted rather than guessed at. A held item
  // is a correct outcome, not a failure — see the framework prompt.
  status: 'ready' | 'insufficient_source'
  note?: string
  title?: string
  blog?: string
  subtitle?: string
  insight?: string
  topics?: string[]
  questions?: string[]
}

const FRAMEWORK_PROMPT = `You are writing on behalf of a real founder, drawing on three separate documents that must never be blended into one undifferentiated pile of context:

1. SOURCE MATERIAL (the caption/transcript/image(s)/date for this one piece) — this is the ONLY source of fact about what actually happened in this specific piece. Names, events, decisions, numbers, outcomes: if it isn't here, it isn't a fact you can use.
2. VOICE & BRAND BRIEF — this establishes HOW the founder sounds: sentence rhythm, vocabulary, structure, tone. It does not supply facts about this piece either.
3. INSIGHT BRIEF (if supplied) — this establishes WHAT the founder already, genuinely believes, knows and can teach, in their own words, organised however they chose to organise it. It exists for exactly one situation: when the source material is too thin to carry a real lesson on its own, you may draw the teaching portion of the piece from something the founder has already, actually stated here.

The critical rule connecting all three: **the Insight Brief may supply a lesson. It may never supply a fact.** If the source material doesn't tell you what happened, the Insight Brief doesn't get to fill that gap either — it can only tell you what the founder already believes in general, which you may connect to the one true thing the source gives you (a title, a topic, a date). Do not let a plausible-sounding connection stand in for an actual answer.

A title is evidence of what the founder intended to talk about. It is NOT evidence of the argument she made, what happened, how it resolved, or what she concluded. Never infer the missing content of a video from its title alone, even when a connection to an established belief would be easy to write.

Before writing, work through this silently:
- What does the source material actually, verifiably establish about this piece? (Keep this list short and honest — most thin captions establish almost nothing beyond a title and a date.)
- Is there a real story here, or just a label for a story that's been lost?
- If the story itself is thin: does the Insight Brief contain an established belief (not a guess) that genuinely fits this piece's topic, without needing you to invent what specifically happened?
- If neither the source nor the Insight Brief gives you enough to write something true and specific, the correct output is status "insufficient_source" — not a plausible-sounding piece built around an invented interpretation. A rejected item is a better outcome than a fabricated one.

If one or more images are attached, look at them directly as real evidence of what this piece actually shows — describe what's genuinely depicted (setting, people, activity, mood) the same way you'd use a transcript, not as "an image" you're vaguely gesturing at. Never invent detail beyond what the image, caption, transcript, or brief actually support.

If a posted date is supplied, use it only to place this piece within the correct period of the founder's chronological story per the brief's chapters (e.g. matching it to the right business, life chapter, or time period) — never to invent specific events, numbers or outcomes for that period beyond what the image/caption/transcript actually shows.

Structure (when there's enough to write): lived story first, lesson second. Open with what actually happened — the specific moment, decision or thing that was said — and let the teaching point emerge from it naturally, later in the piece. Never open with a lesson, a bullet list, or a generic statement and then attach the story underneath as supporting evidence.

Aim directionally for roughly 70% lived story and personal perspective, 20% teaching that grows directly out of that specific story (not a generic add-on lesson), and at most 10% connecting to the founder's wider work/company — these are directional, not a formula to hit exactly. If the brief specifies different proportions or instructions, follow the brief.

Hard rules, regardless of what the brief says:
- Never invent facts, dates, names, results, or events not present in the source material or the Insight Brief's own stated experience. This applies specifically to details of THIS piece — what happened, who was there, what was said, what it looked like.
- Never invent precision that wasn't supplied: no specific revenue, customer counts, hours, percentages, dates, or outcomes unless that exact number appears in the source material. Prefer a true, vaguer description ("hours of manual work") over a specific invented one ("six hours of work").
- Do not manufacture emotional depth (family, burnout, mental health, struggle) that isn't already present in the source material or Insight Brief, just because it reads well. If real emotional stakes are documented, preserve them; don't add ones that aren't there.
- Every blog must be genuinely distinct — do not reuse the same opening, structure, phrasing, or underlying belief (e.g. leaning on the same Insight Brief entry) you'd use for a different piece of content. A reader encountering several of this founder's blogs side by side should see real, different content and different teaching points each time.
- This is the founder's own voice, first person, throughout — the blog, the subtitle AND the insight. Never drift into third person ("she believes...", "her wider work", "she found...") anywhere in the output, even briefly, even in the subtitle. If the brief or Insight Brief is written in third person (as an extraction document often is), that's fine as reference material, but everything you output must still be first person unless explicitly instructed otherwise.
- Write in full flowing paragraphs. Avoid copywriter-voice mannerisms: one-sentence paragraphs stacked for effect, manufactured "mic-drop" lines, constant rhetorical questions, and clichés like "here's the truth," "let that sink in," "nobody talks about this," "game changer," "this changes everything," or fake vulnerability.
- Do not over-explain the founder's company/product. Let the reader arrive at why it matters gradually, through the story — one or two sentences of connection is usually enough. Never open with a product description, and never let the piece read like a disguised ad.
- Output ONLY a single valid JSON object, no markdown code fences, no commentary before or after it. Match this exact shape:

{
  "status": "\"ready\" if there's enough real source material or a genuinely applicable Insight Brief entry to write something true, or \"insufficient_source\" if neither exists — see the reasoning steps above",
  "note": "only when status is insufficient_source: one honest sentence on what's missing (e.g. 'the title names a specific frustration but the caption doesn't say what it was, and nothing in the Insight Brief covers this angle') — omit this field entirely when status is ready",
  "title": "only when status is ready — 5-12 word specific, human title — no clickbait. Where it fits naturally, lean toward a real, searchable question or problem the piece answers rather than a purely literary phrase",
  "blog": "only when status is ready — the full blog post, 350-900 words depending on how much real material there is, following the brief's voice and structure, first person throughout, story-first with the teaching point emerging from it",
  "subtitle": "only when status is ready — 1-3 sentences, first person, specific to THIS piece's story and angle — never third person",
  "insight": "only when status is ready — 1-2 sentences, first person, stating the single core insight of this piece in plain language",
  "topics": ["only when status is ready — 5 to 10 accurate topic/entity phrases genuinely present in the blog"],
  "questions": ["only when status is ready — 3 to 5 natural questions a real person, search engine, or AI assistant could use to discover this content"]
}`

// Only worth attaching images when there's little real text to go on — a
// caption/transcript that's already substantial is stronger, cheaper
// signal than a photo. Capped at 4: enough to cover a carousel/Story
// without ballooning the request.
const THIN_TEXT_THRESHOLD = 80
const MAX_IMAGES = 4
const MAX_IMAGE_BYTES = 5_000_000

async function fetchImageAsBase64(url: string): Promise<{ media_type: string; data: string } | undefined> {
  try {
    const res = await fetch(url)
    if (!res.ok) return undefined
    const contentType = res.headers.get('content-type') ?? 'image/jpeg'
    if (!contentType.startsWith('image/')) return undefined
    const buf = await res.arrayBuffer()
    if (buf.byteLength > MAX_IMAGE_BYTES) return undefined
    let binary = ''
    const bytes = new Uint8Array(buf)
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!)
    return { media_type: contentType, data: btoa(binary) }
  } catch {
    return undefined
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })

  try {
    const body = await req.json() as RequestBody
    if (!body?.voiceBrief?.trim()) throw new Error('voiceBrief is required')

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) throw new Error('AI writing is not configured yet')

    const rawText = [body.transcript, body.caption].filter(Boolean).join(' ').trim()
    const sourceMaterial = [
      body.transcript ? `TRANSCRIPT:\n${body.transcript}` : undefined,
      body.caption ? `CAPTION:\n${body.caption}` : undefined,
    ].filter(Boolean).join('\n\n') || '(No caption or transcript was captured for this piece.)'

    // Thin text is exactly when a photo/thumbnail is worth the extra fetch —
    // a caption/transcript that already has real substance is stronger,
    // cheaper signal than asking the model to look at a picture.
    const candidateImageUrls = (body.imageUrls ?? []).filter(Boolean).slice(0, MAX_IMAGES)
    const shouldAttachImages = rawText.length < THIN_TEXT_THRESHOLD && candidateImageUrls.length > 0
    const fetchedImages = shouldAttachImages
      ? (await Promise.all(candidateImageUrls.map(fetchImageAsBase64))).filter((i): i is { media_type: string; data: string } => !!i)
      : []

    const postedLine = body.postedAt ? `\nOriginally posted: ${body.postedAt} — use this only to place the piece in the right period of the founder's story per the brief, never to invent what happened.` : ''
    const imagesNote = fetchedImages.length > 0
      ? `\n\n${fetchedImages.length} image${fetchedImages.length === 1 ? '' : 's'} from this piece ${fetchedImages.length === 1 ? 'is' : 'are'} attached below — use ${fetchedImages.length === 1 ? 'it' : 'them'} as real evidence of what this piece shows.`
      : ''

    // The brief is identical across every item in a founder's batch — often
    // tens of thousands of tokens, resent in full on every call. Splitting
    // it into its own cache_control block means a rewrite run over many
    // items only pays full input price on the first call; every call after
    // that within the 5-minute cache window reads the brief back at a
    // fraction of the cost instead of re-billing the whole document. The
    // per-item source material stays outside the cached block since it's
    // different every time and would just bust the cache.
    const perItemText = `SOURCE MATERIAL FOR THIS PIECE (originally posted on ${body.platform}${body.kind ? ` as a ${body.kind}` : ''}):${postedLine}\n${sourceMaterial}${imagesNote}`

    const userContent: unknown[] = [
      {
        type: 'text',
        text: `FOUNDER'S VOICE & BRAND BRIEF:\n${body.voiceBrief}`,
        cache_control: { type: 'ephemeral' },
      },
    ]
    // Separate cached block, only when supplied — see FRAMEWORK_PROMPT for
    // the hard boundary on how this may be used (meaning, never facts).
    if (body.insightBrief?.trim()) {
      userContent.push({
        type: 'text',
        text: `FOUNDER'S INSIGHT BRIEF (what she already believes/knows/can teach — never a source of facts about this specific piece):\n${body.insightBrief}`,
        cache_control: { type: 'ephemeral' },
      })
    }
    userContent.push({ type: 'text', text: `---\n\n${perItemText}` })
    for (const img of fetchedImages) {
      userContent.push({ type: 'image', source: { type: 'base64', media_type: img.media_type, data: img.data } })
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        // Prompt caching is GA on current API versions, but sending the
        // beta header too costs nothing and guarantees the cache_control
        // blocks below actually take effect rather than being silently
        // ignored on some older account/version combination.
        'anthropic-beta': 'prompt-caching-2024-07-31',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-8',
        max_tokens: 4000,
        thinking: { type: 'adaptive' },
        // Cached too — identical on every call, any founder, any item — but
        // the real saving is the brief block above; this one is small
        // enough it may fall under the minimum cacheable size on its own.
        system: [{ type: 'text', text: FRAMEWORK_PROMPT, cache_control: { type: 'ephemeral' } }],
        messages: [{ role: 'user', content: userContent }],
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

    // Strip accidental markdown fences even though the prompt asks for none.
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim()
    const parsed = JSON.parse(cleaned) as GeneratedBlog

    return new Response(JSON.stringify({ blog: parsed }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
