// CULO Village — resolve-article Edge Function
//
// The single-article counterpart to resolve-website — that one discovers a
// whole blog's RSS feed (for "connect my own blog"); this one is for "I was
// featured in ONE specific article on someone else's site," where the
// founder doesn't own that site and can't be expected to find its feed URL
// (see WebsiteConnectForm's "single article" mode). Fetches exactly one
// page and extracts what a human reading it would see: title, a readable
// text excerpt (NOT the full body — just enough for the Writer stage to
// work from, never stored or republished as-is), site name and a cover
// image. No feed discovery, no RSS.
//
// Deliberately returns an excerpt, not the full article text — this feeds
// editorial-write's new 'mention_article' type, which writes an ORIGINAL
// piece about the mention rather than reusing the source's own sentences.
// Storing/returning the whole body here would just move the copyright risk
// one step earlier instead of removing it.
//
// Deploy: supabase functions deploy resolve-article --no-verify-jwt

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { safeFetchText, SafeFetchError } from '../_shared/safeFetch.ts'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Enough text for the Writer to understand what the piece says about the
// founder — not a full-text mirror of the article.
const MAX_EXCERPT_CHARS = 3000

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } })
}

function metaContent(html: string, attr: 'property' | 'name', key: string): string | undefined {
  const re = new RegExp(`<meta[^>]+${attr}=["']${key}["'][^>]+content=["']([^"']*)["']`, 'i')
  const altRe = new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+${attr}=["']${key}["']`, 'i')
  const match = html.match(re) ?? html.match(altRe)
  return match?.[1]?.trim() || undefined
}

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&nbsp;/g, ' ')
}

// Strips tags/scripts/styles down to plain readable text — a rough
// extraction, not a real readability parser, which is fine here since this
// only needs to be good enough for the Writer to summarise, not to display.
function extractReadableText(html: string): string {
  const body = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] ?? html
  const stripped = body
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<header[\s\S]*?<\/header>/gi, ' ')
    .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
  return decodeEntities(stripped).replace(/\s+/g, ' ').trim()
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS })

  try {
    const { url: input } = await req.json()
    if (!input || typeof input !== 'string' || !input.trim()) {
      return json({ error: 'Paste the article URL.' }, 400)
    }

    let url: URL
    try { url = new URL(input.trim()) } catch {
      return json({ error: 'That doesn’t look like a valid URL.' }, 400)
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return json({ error: 'Only http and https URLs are supported.' }, 400)
    }

    const html = await safeFetchText(url.toString(), { timeoutMs: 10_000 })

    const title = metaContent(html, 'property', 'og:title')
      ?? html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]
      ?? 'Untitled page'
    const image = metaContent(html, 'property', 'og:image')
    const siteName = metaContent(html, 'property', 'og:site_name') ?? url.hostname.replace(/^www\./, '')
    const description = metaContent(html, 'property', 'og:description') ?? metaContent(html, 'name', 'description')

    const bodyText = extractReadableText(html)
    // Prefer the real body text (more for the Writer to draw on than a
    // one-line meta description), falling back to the meta description for
    // a page that's mostly JS-rendered and yields little readable HTML.
    const excerptSource = bodyText.length > (description?.length ?? 0) ? bodyText : (description ?? bodyText)
    const excerpt = excerptSource.slice(0, MAX_EXCERPT_CHARS)

    // A page that needs JavaScript to render its real content (common on
    // modern sites — Webflow, Framer, React/Vue SPAs, even this app's own
    // site) returns almost nothing from a plain HTML fetch: just nav/footer
    // boilerplate. That's indistinguishable from "nothing" by length alone,
    // so this errors clearly instead of silently handing the Writer a thin
    // excerpt it would have to pad with invented detail to meet its word
    // count — better to fail loudly here than produce a vague article.
    const MIN_USABLE_EXCERPT_CHARS = 200
    if (excerpt.trim().length < MIN_USABLE_EXCERPT_CHARS) {
      return json({ error: 'Could not read enough real text from that page — it may require JavaScript to load its content. Try a different link, or paste the article text directly if you have it.' }, 400)
    }

    return json({
      title: decodeEntities(title.trim()),
      siteName,
      image,
      excerpt,
      url: url.toString(),
    })
  } catch (err) {
    if (err instanceof SafeFetchError) return json({ error: err.message }, 400)
    return json({ error: err instanceof Error ? err.message : 'Could not read that page.' }, 500)
  }
})
