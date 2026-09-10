// CULO Village — detect-archive-size Edge Function
//
// A CHEAP count of how much historical content a founder has, WITHOUT
// importing/analysing/thumbnailing all of it. Used to price Archive Unlock
// tiers up front (self-serve) and in the Pretty Cool Marketing quote
// widget. Full import stays lazy — daily batches, or on-demand at publish.
//
//   YouTube  — 1 API call for videoCount + 1 for the ~10 most recent
//   RSS/Atom — fetch the feed once, count <item>/<entry>, sample the first few
//   Sitemap  — fetch once, count <loc>
//   Instagram — no API; the caller passes an approximate count from the
//               founder's own data export
//
// Body: { youtube?: string, feeds?: string[], sitemap?: string, instagramCount?: number }
// Returns: { total, sources: [{ type, label, count }], sample: [{ title, thumbnailUrl, source }] }
//
// Deploy: supabase functions deploy detect-archive-size --no-verify-jwt

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'

const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY')

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface Sample { title: string; thumbnailUrl?: string; source: string }
interface SourceCount { type: string; label: string; count: number }

const between = (s: string, open: string, close: string) => {
  const i = s.indexOf(open); if (i < 0) return undefined
  const j = s.indexOf(close, i + open.length); if (j < 0) return undefined
  return s.slice(i + open.length, j).trim()
}
const attr = (block: string, tag: string, name: string) => {
  const m = block.match(new RegExp(`<${tag}[^>]*\\b${name}=["']([^"']+)["']`, 'i'))
  return m?.[1]
}
const decode = (s: string) => s
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
  .trim()

async function youtube(input: string): Promise<{ count: number; sample: Sample[] } | null> {
  if (!YOUTUBE_API_KEY || !input) return null
  try {
    // Resolve to a channel id.
    let channelId = input.match(/channel\/(UC[\w-]+)/)?.[1] ?? (input.startsWith('UC') ? input : undefined)
    if (!channelId) {
      const handle = input.replace(/^.*@/, '@').replace(/[^@\w.-]/g, '') || input
      const r = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=id,contentDetails&forHandle=${encodeURIComponent(handle)}&key=${YOUTUBE_API_KEY}`)
      const j = await r.json()
      channelId = j.items?.[0]?.id
    }
    if (!channelId) return null
    const r = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=statistics,contentDetails&id=${channelId}&key=${YOUTUBE_API_KEY}`)
    const j = await r.json()
    const item = j.items?.[0]
    const count = Number(item?.statistics?.videoCount ?? 0)
    const uploads = item?.contentDetails?.relatedPlaylists?.uploads
    const sample: Sample[] = []
    if (uploads) {
      const pr = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=10&playlistId=${uploads}&key=${YOUTUBE_API_KEY}`)
      const pj = await pr.json()
      for (const p of pj.items ?? []) {
        const t = p.snippet?.thumbnails
        sample.push({
          title: p.snippet?.title ?? 'Untitled',
          thumbnailUrl: (t?.medium ?? t?.high ?? t?.default)?.url,
          source: 'YouTube',
        })
      }
    }
    return { count, sample }
  } catch { return null }
}

async function feed(url: string): Promise<{ count: number; sample: Sample[] } | null> {
  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'CuloVillage/1.0' } })
    if (!r.ok) return null
    const xml = await r.text()
    const isAtom = xml.includes('<entry') && !xml.includes('<item')
    const blocks = xml.split(isAtom ? '<entry' : '<item').slice(1)
    const label = xml.includes('itunes') ? 'Podcast' : 'Articles'
    const sample: Sample[] = blocks.slice(0, 8).map(b => {
      const raw = (isAtom ? '<entry' : '<item') + b
      return {
        title: decode(between(raw, '<title>', '</title>') ?? 'Untitled'),
        thumbnailUrl: attr(raw, 'media:thumbnail', 'url') ?? attr(raw, 'itunes:image', 'href') ?? attr(raw, 'media:content', 'url'),
        source: label,
      }
    })
    return { count: blocks.length, sample }
  } catch { return null }
}

async function sitemapCount(url: string): Promise<number> {
  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'CuloVillage/1.0' } })
    if (!r.ok) return 0
    const xml = await r.text()
    return (xml.match(/<loc>/g) ?? []).length
  } catch { return 0 }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })
  try {
    const body = await req.json().catch(() => ({})) as {
      youtube?: string; feeds?: string[]; sitemap?: string; instagramCount?: number
    }

    const sources: SourceCount[] = []
    let sample: Sample[] = []

    if (body.youtube) {
      const y = await youtube(body.youtube)
      if (y) { sources.push({ type: 'youtube', label: 'YouTube', count: y.count }); sample = sample.concat(y.sample) }
    }
    for (const f of body.feeds ?? []) {
      if (!f) continue
      const res = await feed(f)
      if (res) { sources.push({ type: 'feed', label: res.sample[0]?.source ?? 'Feed', count: res.count }); sample = sample.concat(res.sample) }
    }
    if (body.sitemap) {
      const c = await sitemapCount(body.sitemap)
      if (c > 0) sources.push({ type: 'sitemap', label: 'Website', count: c })
    }
    if (typeof body.instagramCount === 'number' && body.instagramCount > 0) {
      sources.push({ type: 'instagram', label: 'Instagram', count: Math.round(body.instagramCount) })
    }

    const total = sources.reduce((s, x) => s + x.count, 0)

    return new Response(JSON.stringify({ total, sources, sample: sample.slice(0, 10) }, null, 2), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
