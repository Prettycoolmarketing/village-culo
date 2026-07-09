// CULO Village — sitemap.xml Edge Function
//
// Nothing in this codebase previously told search engines what public pages
// exist. This queries published/featured rows directly (service role, so it
// sees everything regardless of RLS) and serves a standard sitemap. Generated
// on every request rather than at build time, so it never goes stale between
// deploys as new stories/founders/businesses/ideas publish.
//
// Deploy: supabase functions deploy sitemap --no-verify-jwt
// (--no-verify-jwt because search engine crawlers can't send a Supabase auth
// header — this endpoint only ever reads already-public data.)
//
// Optional: set a SITE_URL secret if the deployed site's domain isn't the
// Supabase project URL — `supabase secrets set SITE_URL=https://your-domain.com`

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL          = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const SITE_URL              = Deno.env.get('SITE_URL') ?? 'https://village-culo.vercel.app'

const STATIC_ROUTES = ['/', '/founders', '/stories', '/ideas', '/mercato', '/map', '/noticeboard', '/archive', '/expertise', '/library']

// Keep in sync with MIN_SOURCE_PLATFORM_STORIES in src/pages/SourcePlatformPage.tsx —
// a Collection page never goes in the sitemap while it's this thin (see Village
// Content Principles: "avoid thin pages"). Note this Edge Function only sees
// database-backed entities; Expertise/Map pages are keyed off the frontend's
// static taxonomy data (data/expertise.ts etc.), which isn't reachable from
// here, so they're deliberately not included yet.
const MIN_SOURCE_PLATFORM_STORIES = 3

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)

interface Row { data: { slug?: string }; updated_at: string }
interface StoryRow { data: { slug?: string; importedContentId?: string }; updated_at: string }
interface ImportedContentRow { id: string; data: { sourcePlatform?: string } }

async function fetchSlugs<T = Row>(table: string, select = 'data, updated_at'): Promise<T[]> {
  const { data, error } = await supabase
    .from(table)
    .select(select)
    .in('status', ['published', 'featured'])
  if (error || !data) return []
  return data as T[]
}

function urlEntry(loc: string, lastmod?: string): string {
  return `  <url>\n    <loc>${loc}</loc>${lastmod ? `\n    <lastmod>${lastmod.slice(0, 10)}</lastmod>` : ''}\n  </url>`
}

serve(async () => {
  try {
    const [stories, founders, businesses, ideas, importedContent] = await Promise.all([
      fetchSlugs<StoryRow>('stories'),
      fetchSlugs('founders'),
      fetchSlugs('businesses'),
      fetchSlugs('ideas'),
      fetchSlugs<ImportedContentRow>('imported_content', 'id, data'),
    ])

    // Source-by-platform Collection pages (/from/:platform) — only once a
    // platform has enough preserved stories to be worth its own page.
    const platformById = new Map(importedContent.map(ic => [ic.id, ic.data.sourcePlatform]))
    const platformCounts = new Map<string, number>()
    for (const s of stories) {
      const platform = s.data.importedContentId ? platformById.get(s.data.importedContentId) : undefined
      if (platform) platformCounts.set(platform, (platformCounts.get(platform) ?? 0) + 1)
    }
    const richPlatforms = [...platformCounts.entries()].filter(([, count]) => count >= MIN_SOURCE_PLATFORM_STORIES).map(([platform]) => platform)

    const entries: string[] = [
      ...STATIC_ROUTES.map(r => urlEntry(`${SITE_URL}${r}`)),
      ...stories.filter(r => r.data.slug).map(r => urlEntry(`${SITE_URL}/stories/${r.data.slug}`, r.updated_at)),
      ...founders.filter(r => r.data.slug).map(r => urlEntry(`${SITE_URL}/founders/${r.data.slug}`, r.updated_at)),
      ...businesses.filter(r => r.data.slug).map(r => urlEntry(`${SITE_URL}/businesses/${r.data.slug}`, r.updated_at)),
      ...ideas.filter(r => r.data.slug).map(r => urlEntry(`${SITE_URL}/ideas/${r.data.slug}`, r.updated_at)),
      ...richPlatforms.map(p => urlEntry(`${SITE_URL}/from/${p}`)),
    ]

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>`

    return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } })
  } catch (err) {
    return new Response(`Sitemap generation failed: ${err instanceof Error ? err.message : 'unknown error'}`, { status: 500 })
  }
})
