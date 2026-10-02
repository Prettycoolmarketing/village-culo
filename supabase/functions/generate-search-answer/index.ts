// Turns one of Shakas's own clips/transcripts into a standalone
// "search-answer" article — the real question a founder/creator/small
// business owner would type into Google or ask an AI system, answered
// directly using Shakas's actual argument and experience from the source
// material. Never a recap of the video itself ("In this video, Shakas
// discusses...").
//
// Rotation is enforced by the CALLER, not left to the model alone: every
// `usedQuestions` entry the client sends is a primarySearchQuestion a past
// run already used (see Founder.usedSearchQuestions) — the model is told
// to pick an unused angle from the topic bank rather than drifting toward
// the same few questions, and the client appends the new question to that
// list after a successful run.
//
// Same honesty rule as generate-blog/generate-bio: every claim traces back
// to the source material. If there isn't enough there to answer a genuinely
// useful, unused search question, this returns insufficient_source rather
// than padding out a weak article.
//
// Deploy: supabase functions deploy generate-search-answer --no-verify-jwt

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'

// Claude's own JSON mode reliably produces real, raw newline characters
// inside multi-paragraph string values (the article body especially) —
// valid as the model's intent, but invalid JSON syntax (string content must
// escape control characters as \n, not contain a literal one). That's
// exactly what threw "Bad control character in string literal" here:
// JSON.parse has zero tolerance for it. Walks the raw text once, escaping
// control characters ONLY when inside a string (tracked via unescaped
// quotes), leaving the actual JSON structure (commas, braces, insignificant
// whitespace between tokens) untouched.
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
  // The clip/transcript/caption that anchors this article's topic and
  // real-world example — see SOURCE FIDELITY: legitimate source material,
  // but not the only one.
  sourceText: string
  platform?: string
  // Her own documented story/beliefs/experience — an equally legitimate
  // source of her real opinion as the clip itself, see SOURCE FIDELITY.
  voiceBrief?: string
  insightBrief?: string
  // Every primarySearchQuestion a past run already used for this founder —
  // see Founder.usedSearchQuestions. The model picks an unused angle.
  usedQuestions?: string[]
}

interface GeneratedSearchAnswer {
  status: 'ready' | 'insufficient_source' | 'no_unused_question'
  note?: string
  primaryQuestion?: string
  headline?: string
  article?: string
  relatedQuestions?: string[]
  seoTitle?: string
  seoDescription?: string
  slug?: string
  primaryTopic?: string
  secondaryTopics?: string[]
  sourceUsed?: string
  culoRelevant?: boolean
}

const TOPIC_BANK = `FOUNDERS AND PERSONAL BRANDING
Is personal branding important for founders?
Do founders need a personal brand?
How do you build authority online as a founder?
How do you become known for your expertise online?
Should the founder be the face of the business?
How much should a founder share online?
Should founders post about themselves or their business?
How do you build credibility online as a new founder?
How can founders show expertise without sounding self-promotional?
What should founders publish online?
How do people find out what a founder is known for?
What makes someone an authority in their industry?
How do you build a founder profile online?
Is LinkedIn enough for a founder's personal brand?
Should founders have their own website?
Should founders have a personal website and a business website?
What should appear when someone Googles your name?
How do you make your professional experience easier to find online?
How do you connect multiple businesses to one personal brand?
How do you build a digital footprint as a founder?

CONTENT DISCOVERY
What happens to old social media posts?
Why does good social media content disappear so quickly?
How do you make social media content searchable?
How do you make old content useful again?
Should you republish old social media posts?
Can you turn social media posts into blog articles?
Is republishing content bad for SEO?
Should you post the same content on different platforms?
How do you repurpose content without creating more work?
What is the best way to organise years of content?
How do you create a content archive?
Should founders archive their social media content?
How do you turn existing content into a body of work?
What is the difference between publishing and posting?
Why should founders own a permanent version of their content?
Is social media enough for long-term discoverability?
What happens to your content if a social platform disappears?
Should businesses rely entirely on social media?
Why is evergreen content important for founders?
How can one piece of content keep working after it is posted?

LINKEDIN
Is LinkedIn worth it for founders?
Is LinkedIn enough for building a personal brand?
Should founders publish LinkedIn articles?
Are LinkedIn posts searchable on Google?
What happens to old LinkedIn posts?
Should you turn LinkedIn posts into blog articles?
Is posting every day on LinkedIn necessary?
How often should founders post on LinkedIn?
Should you write long posts or short posts on LinkedIn?
Does LinkedIn content help with Google visibility?
Does LinkedIn help with AI discovery?
Should founders build an audience on LinkedIn or their own website?
Is LinkedIn rented land?
What should you do with your best LinkedIn posts?

SUBSTACK, BLOGGING AND NEWSLETTERS
Is Substack good for founders?
Should founders start a Substack?
Is Substack better than having your own blog?
Should you use Substack or your own website?
Is Substack good for SEO?
Can Substack help you get discovered by AI?
Should founders write a newsletter?
Do founders still need blogs?
Is blogging still worth it in 2026?
Are blogs still useful now that people use AI search?
Should founders publish articles if they already post on LinkedIn?
Where should founders publish long-form content?
What is better for personal branding: LinkedIn, Medium, Substack or your own website?
Should you publish the same article on Substack and your website?
Do newsletters help build authority?

AI DISCOVERY AND SEARCH
How do you get discovered by AI?
How do you get mentioned by ChatGPT?
Can you make ChatGPT know who you are?
How does AI decide which experts to mention?
How do AI systems understand a personal brand?
How do founders become visible in AI search?
What is AI discoverability?
What is generative engine optimisation?
What is the difference between SEO and AI discovery?
Do you still need SEO if people are using ChatGPT?
Does publishing more content help AI understand your business?
Can AI find information inside Instagram or LinkedIn?
Does structured content help AI understand who you are?
How do you help search engines understand your expertise?
How do you build an online identity that AI can understand?
Can a founder improve how ChatGPT describes them?
Why does consistent information about a founder matter online?
Do backlinks still matter for AI search?
Does third-party content affect AI visibility?
Why do search engines need multiple sources about a person or business?

AI CONTENT
Is AI-generated content bad for SEO?
Does Google penalise AI-written content?
Should founders use AI to write articles?
Can AI rewrite your existing content safely?
Is AI content less trustworthy than human-created content?
What is the difference between AI-generated content and AI-assisted content?
Should AI invent personal-brand content?
How do you use AI without losing your own voice?
Can AI turn videos into articles?
Can AI turn social posts into blogs?
Should founders use AI to repurpose content?
How do you make AI-assisted content sound human?
Why should AI content be based on real source material?
Is human experience more valuable now that AI can generate content?

PODCASTS
Are podcasts good for personal branding?
Do podcast appearances help SEO?
Do podcast appearances help AI discovery?
What should you do with a podcast appearance after it is published?
How do you repurpose a podcast interview?
Should podcast guests turn episodes into articles?
How can founders get more value from podcast appearances?
Do podcast interviews help build authority?
How do you make old podcast appearances easier to find?
Should every podcast appearance have its own webpage?
Can podcast transcripts help with search visibility?
How do you connect podcast appearances back to your personal brand?

WEBSITES AND PUBLISHING
Does every founder need a website?
What should a founder website contain?
Should your founder profile be separate from your company website?
What is a founder publishing platform?
What is a founder knowledge profile?
What is a digital body of work?
What is the difference between a profile and a portfolio?
Should founders publish articles under their own name?
How many articles should a founder have online?
How do you organise founder content across multiple businesses?
What makes a founder profile useful?
Should founder stories be searchable individually?
Why should each piece of content have its own webpage?
How does internal linking help a personal brand?
Why should founder content link back to the founder?

CONTENT STRATEGY
Do you need to create new content every day?
How much content does a founder actually need?
What should founders talk about online?
Where do content ideas come from?
How do you create content when you think you have nothing to say?
Can your existing experience become content?
Should founders answer customer questions as content?
What are the best content topics for founders?
Should you create content around questions people actually ask?
How do you turn expertise into searchable content?
How do you turn one idea into multiple pieces of content?
Should one video become a blog, carousel and reel?
What is content repurposing?
Is content repurposing worth it?
How do you repurpose content without sounding repetitive?
Do you need different content for every platform?

SOCIAL MEDIA AND OWNERSHIP
Do you own your social media content?
Why shouldn't businesses rely only on Instagram?
What happens if your Instagram account disappears?
Should your best content live somewhere outside social media?
Are social media platforms good archives?
Is Instagram searchable enough for business content?
Can Google find Instagram content?
Can AI understand Instagram posts?
Should creators move their content off closed platforms?
What does rented audience mean?
What is the difference between audience reach and discoverability?
Is social media reach the same as search visibility?
Why does content need a permanent URL?

CULO AND THE VILLAGE
What is The Culo Village?
How is The Culo Village different from LinkedIn?
How is The Culo Village different from Substack?
How is The Culo Village different from Medium?
Why would a founder use The Culo Village if they already have a website?
What does The Culo Village do with existing content?
Can founders republish their old posts in The Culo Village?
Why does The Culo Village publish individual pieces of content as webpages?
How does The Culo Village help organise a founder's body of work?
Is The Culo Village another social network?
Does The Culo Village replace your website?
Does The Culo Village replace LinkedIn?
How does The Culo Village help with discoverability?
Why was The Culo Village created?
What problem is The Culo Village solving?

CULO CREATIVES
What is Culo Creatives?
Why is Culo Creatives built inside Canva?
Can Canva turn raw footage into social media content?
How can founders turn raw footage into multiple content formats?
What is the easiest way to repurpose raw footage?
How do you turn talking-head footage into social media posts?
How do you turn B-roll into content?
Can one piece of raw footage become a blog, reel and carousel?
How do founders create consistent content without editing everything manually?
What is the difference between Culo Creatives and The Culo Village?`

const SYSTEM_PROMPT = `You are writing a CULO search-answer article using Shakas's existing published clip, transcript or source content.

The goal is to create a useful article around a real question founders, creators, experts and small business owners are likely to search in Google, ChatGPT, Gemini, Perplexity or other search/AI systems.

The source content is the primary source for Shakas's opinion, experience and perspective.

Do not write an article about the video itself. Do not say "In this video Shakas says...", "In this clip...", or "Shakas recently posted...". Instead, identify the strongest audience question that the source can genuinely answer. The article must be answer-first, detailed and useful.

ROTATE THROUGH THE TOPIC BANK BELOW. Do not repeatedly choose the same topic or closely related question when another suitable angle exists. You will be given a list of primary questions already used for this founder in PREVIOUSLY USED QUESTIONS below — never choose one of those, and prefer questions that are meaningfully different from them, not just reworded.

If several questions fit the source, choose the one that: 1) best matches what Shakas is actually discussing, 2) is most useful to founders or creators, 3) has the clearest search intent, 4) allows a substantive answer, 5) is meaningfully different from already-used questions.

If every suitable question for this source has already been used, return status "no_unused_question" with a note explaining why, rather than forcing a near-duplicate.

TOPIC BANK

${TOPIC_BANK}

ARTICLE DEPTH
Most questions are fully answered in 900-1,100 strong words. Only go up to roughly 1,400 when the question genuinely needs a framework plus a wide spread of examples to be useful. Never pad to hit a word count — if you notice yourself restating the same point (e.g. "experience is content", "founders think they need new ideas") in more than one place, cut all but the strongest version and spend the words on examples and practical substance instead.

ARTICLE STRUCTURE
Headline: the actual search question, worded naturally.
Direct answer: answer the question in 2-3 sentences, immediately. Do not build up to it. Follow with one short paragraph of context, then move straight into substance — do not spend a paragraph restating the answer before earning its keep with specifics.
What this looks like in practice: a short section giving 5-8 concrete, varied examples of how this question plays out across DIFFERENT kinds of founders/businesses (e.g. a consultant, an agency founder, a product founder, a tradesperson, a SaaS founder, a community founder, a creator, a service/lifestyle business) — not all drawn from Shakas's own world. Keep each example to 1-2 sentences: a specific situation and what it becomes. This section is what makes the article useful to a stranger searching the question, not just a Shakas story — prioritise it over general argument.
A practical framework: where the question suits it, give the reader a short, usable method (a numbered list of 3-5 questions or steps they can apply themselves right now) rather than only an argument. Not every question needs this — use it when the question is fundamentally a "how do I..." rather than a "should I..." or "is X true" question.
Shakas's own example: ONE real example from the source material (the clip, her Voice Brief or her Insight Brief), used once, briefly, as proof/illustration of the framework or point above — not as the spine the whole article hangs on. If the source is about one specific story (e.g. a trip, a launch, a client), use it here and do not keep returning to it elsewhere in the article.
Nuance: a short, honest section on the limitation, exception, or "this doesn't mean X" side of the answer — avoid false balance, but a real caveat makes the article more trustworthy than one-sided advocacy.
Where CULO fits: see CULO PLACEMENT below for exactly how to frame this — it is two distinct products solving two distinct problems, not one generic plug.
Conclusion: a short, direct recommendation — what the reader should actually do. Do not restate the opening answer again; move the reader forward instead of circling back.

SEARCH AND AI WRITING RULES
Write for humans first. Use the main question naturally throughout the article. Every subheading must itself be phrased as a real, searchable question (e.g. "How do you turn an experience into content?" not "What is actually happening") — plain lines of text, not markdown #, since this renders as plain text. These subheadings are themselves related-search-question coverage, so treat choosing them as part of answering the brief, not decoration. Use plain language. Avoid keyword stuffing.

Do not claim that publishing in The Culo Village guarantees Google rankings, ChatGPT mentions or AI recommendations. Use wording such as "helps create clearer public context", "makes the information easier to discover and understand", "creates structured, crawlable webpages", "can contribute to a stronger public digital footprint". Do not write "this will make ChatGPT recommend you", "you will rank", or "AI will find you".

FACTUAL RESEARCH
Where the article includes current claims about platforms, search engines, AI behaviour, SEO, social media, Substack, LinkedIn, Google, ChatGPT, Canva or other changing products, only state claims you are genuinely confident are accurate as of a recent, reputable understanding of these systems — if uncertain, keep the claim general rather than specific. Keep Shakas's opinions clearly separate from externally-grounded fact.

SOURCE FIDELITY
Do not invent personal experiences, opinions or claims for Shakas — but "the source" is broader than just the clip's own caption/transcript. You have three legitimate sources of her real, already-established opinions and experience, and may draw on any of them:
1. The clip/transcript itself.
2. Her VOICE & BRAND BRIEF, if supplied — her own documented story, beliefs, experience and how she explains things. This is exactly as legitimate a source as the transcript, not a fallback.
3. Her INSIGHT BRIEF, if supplied — her own source-checked bank of what she genuinely believes/knows/teaches.
Treat the clip as the trigger and topic anchor for the article, not the only place you're allowed to find her actual opinion. If the clip itself is thin (a promotional caption, a short description with no real stated opinion) but her Voice/Insight Brief genuinely covers a Topic Bank question the clip's subject connects to, write the article from the brief, using the clip as the real-world example/context it provides. Only return "insufficient_source" when NONE of the three sources together give you enough to honestly answer a real question — not just because the clip's own caption alone was thin.

CULO PLACEMENT
CULO is two separate products solving two separate problems, and when you mention it, frame it as exactly that distinction rather than one generic plug:
1. Extraction/creation problem: a founder has lived or made something useful but hasn't turned it into content yet. Culo Creatives (built inside Canva) is what helps structure raw material — footage, thoughts, expertise — into usable formats.
2. Permanence/discoverability problem: a founder DID turn something into a post or reel, but it's already buried a few months later with no lasting home. The Culo Village is what gives that resulting work a permanent, individually-discoverable webpage.
A natural bridge between the two, when you use it: creating the content is only half the problem — what happens to it after it's published is the other half.
Only bring this in within the body where it genuinely helps answer the question, and only name the ONE of the two problems (or the bridge between them) that's actually relevant to this specific question — do not force both into every article. Some articles should mention CULO briefly, some not at all in the body. The article must remain useful even if every promotional reference were removed. Set culoRelevant to whether you genuinely included a CULO tie-in in the body (true) or correctly left it out (false) — never force one just to set this true.

Do not write your own closing call-to-action inviting the reader to join The Culo Village or try Culo Creatives — a standard closing CTA for both is appended automatically after your article. End the article itself with the conclusion only.

If none of the three sources together contain enough real information to answer a worthwhile, genuinely unused search question, return status "insufficient_source" with a one-sentence note on what's missing. Do not create a weak, generic article just to have something to show.

Respond with ONLY a JSON object, no markdown fences, no commentary:
{
  "status": "ready" or "insufficient_source" or "no_unused_question",
  "note": "only when not ready — one honest sentence why",
  "primaryQuestion": "only when ready — the real question, worded the way someone would actually search it",
  "headline": "only when ready — the article headline",
  "article": "only when ready — the full article body, plain text with blank lines between paragraphs, subheadings as their own plain line, no markdown syntax",
  "relatedQuestions": ["only when ready — exactly three related questions this article also answers"],
  "seoTitle": "only when ready",
  "seoDescription": "only when ready — under 160 characters",
  "slug": "only when ready — lowercase, hyphenated",
  "primaryTopic": "only when ready — the Topic Bank category this question came from",
  "secondaryTopics": ["only when ready — up to 3 other Topic Bank categories this article genuinely also touches"],
  "sourceUsed": "only when ready — one line describing what in the source material this was built from",
  "culoRelevant": true or false
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
      `\nPREVIOUSLY USED QUESTIONS (never choose one of these again):\n${
        body.usedQuestions?.length ? body.usedQuestions.map(q => `- ${q}`).join('\n') : '(none yet)'
      }`,
      `\nSOURCE CLIP/TRANSCRIPT (the topic anchor):\n${body.sourceText}`,
      body.voiceBrief?.trim() ? `\nHER VOICE & BRAND BRIEF (an equally legitimate source of her real opinion/experience):\n${body.voiceBrief}` : undefined,
      body.insightBrief?.trim() ? `\nHER INSIGHT BRIEF (what she genuinely believes/knows/teaches):\n${body.insightBrief}` : undefined,
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
        max_tokens: 6000,
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
    const parsed = JSON.parse(sanitizeJsonControlChars(cleaned)) as GeneratedSearchAnswer

    // culoRelevant governs whether the model's own body organically ties
    // the question's actual answer back to CULO — that stays honest and
    // conditional, never forced. But the two product CTAs at the very end
    // are deliberately NOT left to the model's discretion each run: every
    // ready article gets both, appended here in code, so staff get a
    // consistent, guaranteed close instead of whatever the model happened
    // to decide that time.
    if (parsed.status === 'ready' && parsed.article) {
      parsed.article = `${parsed.article}\n\nJoin The Culo Village to republish your own existing content as web articles for discovery, built from the work you've already done.\n\nStart with Culo Creatives in Canva to shape your raw footage into content like this one.`
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
