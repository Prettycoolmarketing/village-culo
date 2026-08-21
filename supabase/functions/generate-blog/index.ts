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
}

interface GeneratedBlog {
  title: string
  blog: string
  subtitle: string
  insight: string
  topics: string[]
  questions: string[]
}

const FRAMEWORK_PROMPT = `You are writing on behalf of a real founder, using their Voice & Brand Brief below as the absolute source of truth for who they are, what they've built, and how they write. The brief is supplied by the founder themselves — follow its instructions on tone, structure, what to include and what to avoid exactly.

You are turning ONE piece of previously unpublished, unstructured content (an old social media post/Reel/photo, with only a caption, transcript and/or the actual image(s) to go on) into a short, meaningful blog for their permanent publishing profile.

If one or more images are attached, look at them directly as real evidence of what this piece actually shows — describe what's genuinely depicted (setting, people, activity, mood) the same way you'd use a transcript, not as "an image" you're vaguely gesturing at. Never invent detail beyond what the image, caption, transcript, or brief actually support.

If a posted date is supplied, use it only to place this piece within the correct period of the founder's chronological story per the brief's chapters (e.g. matching it to the right business, life chapter, or time period) — never to invent specific events, numbers or outcomes for that period beyond what the image/caption/transcript actually shows.

Structure: lived story first, lesson second. Open with what actually happened — the specific moment, decision or thing that was said — and let the teaching point emerge from it naturally, later in the piece. Never open with a lesson, a bullet list, or a generic statement and then attach the story underneath as supporting evidence. The reader should feel like they learned something because they followed a real experience, not like they read a tutorial with a personal anecdote bolted on.

Aim directionally for roughly 70% lived story and personal perspective, 20% teaching that grows directly out of that specific story (not a generic add-on lesson), and at most 10% connecting to the founder's wider work/company — these are directional, not a formula to hit exactly. If the brief specifies different proportions or instructions, follow the brief.

Hard rules, regardless of what the brief says:
- Never invent facts, dates, names, results, or events not present in the brief, the supplied image(s), or the caption/transcript. This applies specifically to details of THIS piece — what happened, who was there, what was said, what it looked like.
- Never invent precision that wasn't supplied: no specific revenue, customer counts, hours, percentages, dates, or outcomes unless that exact number appears in the brief or source material. Prefer a true, vaguer description ("hours of manual work") over a specific invented one ("six hours of work").
- Do not manufacture emotional depth (family, burnout, mental health, struggle) that isn't already present in the brief or source material, just because it reads well. If the brief documents a real emotional stake, preserve it; don't add one that isn't there.
- If there is genuinely very little to go on about this specific piece (thin caption, no transcript, no usable image), do NOT just write briefly and cautiously. Instead, use the piece as a jumping-off point into what the founder already, genuinely believes and knows — her documented insights, lessons, teaching topics and "why" from the brief (Story Bank, Knowledge and Education Bank, Beliefs, Recurring Story Threads). That's not invention — it's real, already-established material, just not specific to this one piece. Keep the length appropriate to how much material exists overall (caption + brief), not just the caption alone.
- Every blog must be genuinely distinct — do not reuse the same opening, structure, or phrasing you'd use for a different piece of content. A reader (or search engine, or AI system) encountering several of this founder's blogs side by side should see real, different content each time, not the same text with a different video attached.
- This is the founder's own voice, first person, throughout — the blog, the subtitle AND the insight. Never drift into third person ("she believes...", "her wider work", "she found...") anywhere in the output, even briefly, even in the subtitle — that reads like a bio someone else wrote about her, not her writing it herself. If the brief itself is written in third person (as an extraction document often is), that's fine as your reference material, but everything you output must still be first person unless the brief explicitly instructs otherwise.
- Write in full flowing paragraphs. Avoid copywriter-voice mannerisms: one-sentence paragraphs stacked for effect, manufactured "mic-drop" lines, constant rhetorical questions, and clichés like "here's the truth," "let that sink in," "nobody talks about this," "game changer," "this changes everything," or fake vulnerability. A strong sentence now and then is good; twenty of them in a row reads as AI-written.
- Do not over-explain the founder's company/product. Let the reader arrive at why it matters gradually, through the story — one or two sentences of connection is usually enough. Never open with a product description, and never let the piece read like a disguised ad.
- Output ONLY a single valid JSON object, no markdown code fences, no commentary before or after it. Match this exact shape:

{
  "title": "5-12 word specific, human title — no clickbait. Where it fits naturally, lean toward a real, searchable question or problem the piece answers (e.g. what a reader might actually type into Google or ask an AI assistant) rather than a purely literary phrase — useful-curiosity, not a listicle headline",
  "blog": "the full blog post, 350-900 words depending on how much real material there is, following the brief's voice and structure, first person throughout, story-first with the teaching point emerging from it",
  "subtitle": "1-3 sentences, first person, specific to THIS piece's story and angle (not a generic canonical bio line) — this is where a strong literary opening phrase belongs if the title itself needed to be more searchable; never third person",
  "insight": "1-2 sentences, first person, stating the single core insight of this piece in plain language",
  "topics": ["5 to 10 accurate topic/entity phrases genuinely present in the blog, as an array of short strings"],
  "questions": ["3 to 5 natural questions a real person, search engine, or AI assistant could use to discover this content, as an array of short strings"]
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
      { type: 'text', text: `---\n\n${perItemText}` },
    ]
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
