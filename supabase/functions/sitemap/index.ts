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

interface Row { data: { slug?: string }; updated_at: string }

async function fetchSlugs(table: string): Promise<Row[]> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)
  const { data, error } = await supabase
    .from(table)
    .select('data, updated_at')
    .in('status', ['published', 'featured'])
  if (error || !data) return []
  return data as Row[]
}

function urlEntry(loc: string, lastmod?: string): string {
  return `  <url>\n    <loc>${loc}</loc>${lastmod ? `\n    <lastmod>${lastmod.slice(0, 10)}</lastmod>` : ''}\n  </url>`
}

serve(async () => {
  try {
    const [stories, founders, businesses, ideas] = await Promise.all([
      fetchSlugs('stories'),
      fetchSlugs('founders'),
      fetchSlugs('businesses'),
      fetchSlugs('ideas'),
    ])

    const entries: string[] = [
      ...STATIC_ROUTES.map(r => urlEntry(`${SITE_URL}${r}`)),
      ...stories.filter(r => r.data.slug).map(r => urlEntry(`${SITE_URL}/stories/${r.data.slug}`, r.updated_at)),
      ...founders.filter(r => r.data.slug).map(r => urlEntry(`${SITE_URL}/founders/${r.data.slug}`, r.updated_at)),
      ...businesses.filter(r => r.data.slug).map(r => urlEntry(`${SITE_URL}/businesses/${r.data.slug}`, r.updated_at)),
      ...ideas.filter(r => r.data.slug).map(r => urlEntry(`${SITE_URL}/ideas/${r.data.slug}`, r.updated_at)),
    ]

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>`

    return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } })
  } catch (err) {
    return new Response(`Sitemap generation failed: ${err instanceof Error ? err.message : 'unknown error'}`, { status: 500 })
  }
})
