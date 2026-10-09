// CULO Village — per-founder RSS 2.0 feed Edge Function
//
// Built for Content360 (or any other social-automation tool) to watch one
// founder's published articles and auto-post to LinkedIn etc. the moment
// something goes live — no change to the publishing workflow itself: this
// only ever reads the same `stories` table every other public page reads
// from, generated fresh on every request so it's never stale between
// deploys.
//
// Usage: GET /rss-founder?slug=<founder-slug>
//
// Deploy: supabase functions deploy rss-founder --no-verify-jwt
// (--no-verify-jwt because Content360 can't send a Supabase auth header —
// this endpoint only ever reads already-public, published data, same as
// sitemap.xml.)
//
// Optional: set a SITE_URL secret if the deployed site's domain isn't the
// Supabase project URL — `supabase secrets set SITE_URL=https://your-domain.com`

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
  createdAt: string
  publishedAt?: string
}
interface FounderData {
  name?: string
  slug?: string
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// RSS 2.0 requires RFC 822 dates, not ISO 8601.
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

serve(async (req) => {
  const url = new URL(req.url)
  const slug = url.searchParams.get('slug')?.trim()
  if (!slug) {
    return new Response('Missing required ?slug=<founder-slug> parameter.', { status: 400 })
  }

  const { data: founderRow, error: founderError } = await supabase
    .from('founders')
    .select('id, data')
    .eq('data->>slug', slug)
    .maybeSingle()
  if (founderError || !founderRow) {
    return new Response('No founder found for that slug.', { status: 404 })
  }
  const founder = founderRow.data as FounderData

  // status IN (published, featured), same gate every public page already
  // uses (StoryDetailPage's own 404 check, the public stories RLS policy)
  // — draft/archived stories never reach this feed.
  const { data: storyRows, error: storyError } = await supabase
    .from('stories')
    .select('data')
    .eq('founder_id', founderRow.id)
    .in('status', ['published', 'featured'])
  if (storyError) {
    return new Response('Could not load stories.', { status: 500 })
  }

  const stories = ((storyRows ?? []).map(r => r.data as StoryData))
    // Newest first — publishedAt (when it actually went live) beats
    // createdAt (when the draft was first made), same sort Content tab's
    // own Published list uses.
    .sort((a, b) => (b.publishedAt ?? b.createdAt).localeCompare(a.publishedAt ?? a.createdAt))

  const founderName = founder.name ?? 'Founder'
  const channelLink = `${SITE_URL}/founders/${slug}`

  const items = stories.map(s => {
    const link = `${SITE_URL}/stories/${s.slug}`
    const pubDate = toRfc822(s.publishedAt ?? s.createdAt)
    const description = escapeXml(s.summary || s.subtitle || s.title)
    // guid is the story's own stable database id, never the slug/title —
    // editing a published story's title or body doesn't change its id, so
    // Content360 (keyed off guid) sees this as the same item, not a new
    // post to re-publish. isPermaLink="false" since this id isn't itself a
    // URL — the <link> element above is the real permalink.
    const guid = escapeXml(s.id)
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
      <description>${description}</description>
      ${enclosure}
      ${imageTag}
    </item>`
  }).join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>${escapeXml(founderName)} — The Culo Village</title>
    <link>${escapeXml(channelLink)}</link>
    <description>Published articles by ${escapeXml(founderName)} on The Culo Village.</description>
    <language>en</language>
${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      // Short cache — Content360 polling can get a fresh-enough feed without
      // hammering the database on every single poll.
      'Cache-Control': 'public, max-age=300',
    },
  })
})
