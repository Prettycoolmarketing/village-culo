// CULO Village — fetch-feed Edge Function
//
// The ONLY reason this exists: browsers block cross-origin fetches to
// arbitrary third-party RSS/Atom feed URLs (most feeds send no CORS
// headers), so the podcast and website/blog connectors (see
// src/services/connectors/rss.ts) can't read a founder's own public feed
// directly from the dashboard. This function does a plain server-side
// fetch + parse and returns JSON — no auth, no secrets, no OAuth. It reads
// only what the feed's own owner has already published publicly.
//
// Deploy: supabase functions deploy fetch-feed

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface FeedItem {
  title: string
  link: string
  description?: string
  publishedAt?: string
  enclosureUrl?: string
  imageUrl?: string
}

function textBetween(block: string, tag: string): string | undefined {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'))
  if (!match) return undefined
  return match[1]
    .replace(/^<!\[CDATA\[([\s\S]*?)\]\]>$/, '$1')
    .replace(/<[^>]+>/g, '')
    .trim()
}

// Same idea as textBetween, but for description/summary/content fields
// specifically — those hold real HTML article bodies, and stripping tags
// with no regard for paragraph boundaries collapses a multi-paragraph blog
// post into one unreadable run-on line. Block-level closing tags become
// line breaks first, so BlogContent's per-line paragraph rendering
// downstream actually has something to split on.
function htmlBlockToText(block: string, tag: string): string | undefined {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'))
  if (!match) return undefined
  return match[1]
    .replace(/^<!\[CDATA\[([\s\S]*?)\]\]>$/, '$1')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|li|blockquote)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"').replace(/&#0?39;/gi, '\'')
    .split('\n')
    .map(line => line.replace(/[ \t]+/g, ' ').trim())
    .filter(Boolean)
    .join('\n')
    .trim()
}

function attrOf(block: string, tag: string, attr: string): string | undefined {
  const match = block.match(new RegExp(`<${tag}[^>]*\\b${attr}=["']([^"']+)["'][^>]*\\/?>`, 'i'))
  return match?.[1]
}

function linkOf(block: string): string | undefined {
  // RSS: <link>https://...</link>. Atom: <link href="https://..." />
  const rss = textBetween(block, 'link')
  if (rss) return rss
  return attrOf(block, 'link', 'href')
}

function parseFeed(xml: string): FeedItem[] {
  const isAtom = /<feed[\s>]/i.test(xml) && !/<rss[\s>]/i.test(xml)
  const blocks = isAtom
    ? xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) ?? []
    : xml.match(/<item[\s>][\s\S]*?<\/item>/gi) ?? []

  return blocks.map(block => {
    const title = textBetween(block, 'title') ?? 'Untitled'
    const link = linkOf(block) ?? ''
    const description = htmlBlockToText(block, 'description') ?? htmlBlockToText(block, 'summary') ?? htmlBlockToText(block, 'content')
    const publishedAt = textBetween(block, 'pubDate') ?? textBetween(block, 'published') ?? textBetween(block, 'updated')
    const enclosureUrl = attrOf(block, 'enclosure', 'url')
    const imageUrl = attrOf(block, 'media:thumbnail', 'url') ?? attrOf(block, 'itunes:image', 'href')
    return { title, link, description, publishedAt, enclosureUrl, imageUrl }
  }).filter(item => item.link)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS })
  }

  try {
    const { url } = await req.json()
    if (!url || typeof url !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing "url" in request body.' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    const parsed = new URL(url)
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return new Response(JSON.stringify({ error: 'Only http(s) feed URLs are supported.' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    const res = await fetch(parsed.toString(), {
      headers: { 'User-Agent': 'CULOVillageFeedFetcher/1.0' },
    })
    if (!res.ok) {
      return new Response(JSON.stringify({ error: `Feed responded with ${res.status}.` }), {
        status: 502,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    const xml = await res.text()
    const items = parseFeed(xml)

    return new Response(JSON.stringify({ items }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Could not fetch or parse this feed.' }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
