// CULO Village — per-founder RSS feed Edge Function
//
// Serves a standard RSS 2.0 feed of one founder's own published/featured
// stories — so a founder can hand their feed URL to anything that reads
// RSS (a newsletter tool, another site, a reader), same idea as
// sitemap/index.ts but scoped to one founder instead of the whole site.
// Reached at /founders/:slug/rss.xml via vercel.json's rewrite, which
// passes the slug through as a query param.
//
// Deploy: supabase functions deploy founder-rss --no-verify-jwt
// (crawlers/feed readers can't send a Supabase auth header, and this only
// ever reads already-public data — same reasoning as sitemap.)

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL          = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const SITE_URL              = Deno.env.get('SITE_URL') ?? 'https://village-culo.vercel.app'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)

interface FounderRow { id: string; data: { slug?: string; name?: string; bio?: string } }
interface StoryRow { data: { slug?: string; title?: string; summary?: string; publishedAt?: string; createdAt?: string }; updated_at: string }

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}

function itemEntry(story: StoryRow['data'], lastmod: string): string {
  const link = `${SITE_URL}/stories/${story.slug}`
  const pubDate = new Date(story.publishedAt ?? story.createdAt ?? lastmod).toUTCString()
  return [
    '  <item>',
    `    <title>${escapeXml(story.title ?? '')}</title>`,
    `    <link>${link}</link>`,
    `    <guid isPermaLink="true">${link}</guid>`,
    `    <pubDate>${pubDate}</pubDate>`,
    story.summary ? `    <description>${escapeXml(story.summary)}</description>` : '',
    '  </item>',
  ].filter(Boolean).join('\n')
}

serve(async req => {
  try {
    const slug = new URL(req.url).searchParams.get('slug')?.trim()
    if (!slug) return new Response('Missing slug', { status: 400 })

    const { data: founderRows, error: founderErr } = await supabase
      .from('founders')
      .select('id, data')
      .eq('data->>slug', slug)
      .in('status', ['published', 'featured'])
      .limit(1)
    if (founderErr) throw new Error(founderErr.message)
    const founderRow = (founderRows as FounderRow[] | null)?.[0]
    if (!founderRow) return new Response('Founder not found', { status: 404 })
    const founder = founderRow.data
    // founderId on a story is the founder's id, not slug — a curated
    // founder's slug isn't guaranteed to match their id.
    const founderId = founderRow.id

    const { data: stories, error: storiesErr } = await supabase
      .from('stories')
      .select('data, updated_at')
      .eq('data->>founderId', founderId)
      .in('status', ['published', 'featured'])
      .order('updated_at', { ascending: false })
      .limit(100)
    if (storiesErr) throw new Error(storiesErr.message)

    const items = ((stories as StoryRow[] | null) ?? [])
      .filter(s => s.data.slug && s.data.title)
      .map(s => itemEntry(s.data, s.updated_at))

    const feedUrl = `${SITE_URL}/founders/${slug}/rss.xml`
    const siteLink = `${SITE_URL}/founders/${slug}`
    const title = `${founder.name ?? slug} — The Culo Village`
    const description = founder.bio?.trim() || `Articles by ${founder.name ?? slug} on The Culo Village.`

    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<rss version="2.0">',
      '<channel>',
      `  <title>${escapeXml(title)}</title>`,
      `  <link>${siteLink}</link>`,
      `  <atom:link xmlns:atom="http://www.w3.org/2005/Atom" href="${feedUrl}" rel="self" type="application/rss+xml" />`,
      `  <description>${escapeXml(description)}</description>`,
      items.join('\n'),
      '</channel>',
      '</rss>',
    ].join('\n')

    return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8', 'Cache-Control': 'public, max-age=1800' } })
  } catch (err) {
    return new Response(`RSS generation failed: ${err instanceof Error ? err.message : 'unknown error'}`, { status: 500 })
  }
})
