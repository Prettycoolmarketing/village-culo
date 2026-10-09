// CULO Village — platform-wide RSS 2.0 feed Edge Function
//
// Same idea as rss-founder, but every published article across every
// founder — for future platform-wide integrations (not currently wired to
// anything, built ahead of need per request). See rss-founder/index.ts for
// the per-founder version Content360 actually uses today.
//
// Usage: GET /rss-platform
//
// Deploy: supabase functions deploy rss-platform --no-verify-jwt

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL          = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const SITE_URL              = Deno.env.get('SITE_URL') ?? 'https://village-culo.vercel.app'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)

interface StoryData {
  id: string
  slug: string
  title: string
  summary?: string
  subtitle?: string
  coverImage?: string
  founderId: string
  createdAt: string
  publishedAt?: string
}
interface FounderData {
  name?: string
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function toRfc822(iso: string): string {
  return new Date(iso).toUTCString()
}

// coverImage can be a same-origin relative path (brand fallback images,
// e.g. "/assets/culo-brand-cover.png") rather than an absolute URL — fine
// for the site's own <img src>, but Content360 reading this feed from
// outside needs a real, fetchable URL.
function absoluteImageUrl(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `${SITE_URL}${url.startsWith('/') ? '' : '/'}${url}`
}

function guessImageType(url: string): string {
  if (/\.png($|\?)/i.test(url)) return 'image/png'
  if (/\.webp($|\?)/i.test(url)) return 'image/webp'
  if (/\.gif($|\?)/i.test(url)) return 'image/gif'
  return 'image/jpeg'
}

// Most-recent-N, same reasoning sitemap.xml and every other feed/listing in
// this codebase uses a cap for — an unbounded platform-wide feed only grows,
// forever, and no consumer needs the entire site's history on every poll.
const MAX_ITEMS = 200

serve(async () => {
  const { data: storyRows, error: storyError } = await supabase
    .from('stories')
    .select('data')
    .in('status', ['published', 'featured'])
  if (storyError) {
    return new Response('Could not load stories.', { status: 500 })
  }

  const { data: founderRows } = await supabase.from('founders').select('id, data')
  const founderNameById = new Map<string, string>(
    (founderRows ?? []).map(f => [f.id as string, ((f.data as FounderData)?.name) ?? 'A founder'])
  )

  const stories = ((storyRows ?? []).map(r => r.data as StoryData))
    .sort((a, b) => (b.publishedAt ?? b.createdAt).localeCompare(a.publishedAt ?? a.createdAt))
    .slice(0, MAX_ITEMS)

  const items = stories.map(s => {
    const link = `${SITE_URL}/stories/${s.slug}`
    const pubDate = toRfc822(s.publishedAt ?? s.createdAt)
    const description = escapeXml(s.summary || s.subtitle || s.title)
    const guid = escapeXml(s.id)
    const authorName = founderNameById.get(s.founderId)
    const absImage = s.coverImage ? absoluteImageUrl(s.coverImage) : undefined
    const enclosure = absImage
      ? `<enclosure url="${escapeXml(absImage)}" type="${guessImageType(absImage)}" length="0" />`
      : ''
    const imageTag = absImage
      ? `<media:content url="${escapeXml(absImage)}" medium="image" />`
      : ''
    return `    <item>
      <title>${escapeXml(s.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="false">${guid}</guid>
      <pubDate>${pubDate}</pubDate>
      ${authorName ? `<author>${escapeXml(authorName)}</author>` : ''}
      <description>${description}</description>
      ${enclosure}
      ${imageTag}
    </item>`
  }).join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>The Culo Village</title>
    <link>${escapeXml(SITE_URL)}</link>
    <description>Published articles across every founder on The Culo Village.</description>
    <language>en</language>
${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300',
    },
  })
})
