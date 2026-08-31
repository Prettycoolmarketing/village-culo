// Vercel Edge Middleware — serves a real, server-rendered snapshot of
// public content pages to search/AI crawlers, while every human browser
// still gets the normal React SPA untouched.
//
// Why this exists: this app is a pure client-rendered SPA (Vite + React,
// no SSR/prerendering). Every page's actual title, meta description and
// JSON-LD structured data are injected by usePageMeta() *after* React
// mounts and runs. A crawler that doesn't execute JavaScript — which
// includes most AI/LLM crawlers (GPTBot, ClaudeBot, PerplexityBot, etc.)
// and, at scale, a meaningful share of traditional search crawlers too —
// sees nothing but the one generic title/description in index.html for
// every single URL on the site. No amount of per-page SEO work in the
// React code reaches them. This middleware is the fix: for known bot
// user agents requesting a public content route, it fetches the same
// row the client would (using the public anon key, respecting the exact
// same RLS "published only" policies already in place) and returns a
// minimal real HTML document with the actual title, description,
// Open Graph tags, JSON-LD, and visible text content already in the
// response body — no JavaScript execution required to see any of it.
//
// Anon key + URL below are intentionally not secret — they're the same
// values already shipped in the public client JS bundle, protected by
// Supabase RLS rather than by being hidden.

export const config = {
  matcher: [
    '/stories/:slug', '/founders/:slug', '/businesses/:slug',
    '/ideas/:slug', '/series/:slug', '/editorial/:slug', '/library/:slug',
  ],
}

const SUPABASE_URL = 'https://vptbswxntuycbgqnduab.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_TMC5OCu3gczdMXgjoqmGnA_3W2BbJpe'
const SITE_NAME = 'CULO Village'

// Matches the crawlers that actually can't (or don't reliably) execute
// JavaScript — this is the whole reason this middleware exists. Extend
// this list as new AI/search crawlers show up.
const BOT_UA = /bot|crawl|spider|slurp|facebookexternalhit|linkedinbot|twitterbot|slackbot|discordbot|whatsapp|telegrambot|embedly|quora link preview|pinterest|gptbot|chatgpt-user|oai-searchbot|claudebot|claude-web|anthropic-ai|perplexitybot|ccbot|google-extended|applebot|bytespider|diffbot|yandex|baiduspider/i

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

async function fetchPublicRow(table, slug, extraFilter) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?select=data&slug=eq.${encodeURIComponent(slug)}${extraFilter}&limit=1`
  const res = await fetch(url, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
  })
  if (!res.ok) return null
  const rows = await res.json()
  return rows[0]?.data ?? null
}

function renderDocument({ title, description, path, ogType, jsonLd, bodyHtml }) {
  const canonical = `https://www.culovillage.com${path}`
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapeHtml(fullTitle)}</title>
<meta name="description" content="${escapeHtml((description || '').slice(0, 160))}" />
<link rel="canonical" href="${escapeHtml(canonical)}" />
<meta property="og:type" content="${ogType}" />
<meta property="og:title" content="${escapeHtml(title || SITE_NAME)}" />
<meta property="og:description" content="${escapeHtml((description || '').slice(0, 200))}" />
<meta property="og:url" content="${escapeHtml(canonical)}" />
${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : ''}
</head>
<body>
${bodyHtml}
</body>
</html>`
}

function textToParagraphs(text) {
  return (text || '')
    .split(/\n{2,}/)
    .map(p => p.trim())
    .filter(Boolean)
    .map(p => `<p>${escapeHtml(p)}</p>`)
    .join('\n')
}

export default async function middleware(request) {
  const ua = request.headers.get('user-agent') || ''
  if (!BOT_UA.test(ua)) return // humans (and unrecognised UAs) get the normal SPA

  const url = new URL(request.url)
  const [, section, slug] = url.pathname.split('/')

  try {
    if (section === 'stories' && slug) {
      const story = await fetchPublicRow('stories', slug, '&status=in.(published,featured)')
      if (!story) return
      const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: story.title,
        description: (story.summary || '').slice(0, 200),
        datePublished: story.createdAt,
        ...(story.coverImage ? { image: story.coverImage } : {}),
      }
      const bodyHtml = `
<article>
<h1>${escapeHtml(story.title)}</h1>
${story.subtitle ? `<p><em>${escapeHtml(story.subtitle)}</em></p>` : ''}
${story.summary ? `<p>${escapeHtml(story.summary)}</p>` : ''}
${textToParagraphs(story.blog)}
</article>`
      const html = renderDocument({
        title: story.title, description: story.summary || story.blog, path: url.pathname,
        ogType: 'article', jsonLd, bodyHtml,
      })
      return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } })
    }

    if (section === 'founders' && slug) {
      const founder = await fetchPublicRow('founders', slug, '&status=in.(published,featured)')
      if (!founder) return
      const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: founder.name,
        description: founder.bio,
        ...(founder.avatar ? { image: founder.avatar } : {}),
        ...(founder.location?.name ? { homeLocation: founder.location.name } : {}),
      }
      const bodyHtml = `
<article>
<h1>${escapeHtml(founder.name)}</h1>
${founder.industry?.name ? `<p>${escapeHtml(founder.industry.name)}</p>` : ''}
${founder.location?.name ? `<p>${escapeHtml(founder.location.name)}</p>` : ''}
${textToParagraphs(founder.bio)}
</article>`
      const html = renderDocument({
        title: founder.name, description: founder.bio, path: url.pathname,
        ogType: 'profile', jsonLd, bodyHtml,
      })
      return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } })
    }

    if (section === 'businesses' && slug) {
      const biz = await fetchPublicRow('businesses', slug, '&status=in.(published,featured)')
      if (!biz) return
      const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: biz.name,
        description: biz.description,
        ...(biz.logo ? { logo: biz.logo } : {}),
        ...(biz.website ? { url: biz.website } : {}),
      }
      const bodyHtml = `
<article>
<h1>${escapeHtml(biz.name)}</h1>
${biz.tagline ? `<p><em>${escapeHtml(biz.tagline)}</em></p>` : ''}
${textToParagraphs(biz.description)}
</article>`
      const html = renderDocument({
        title: biz.name, description: biz.description || biz.tagline, path: url.pathname,
        ogType: 'website', jsonLd, bodyHtml,
      })
      return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } })
    }

    if (section === 'ideas' && slug) {
      const idea = await fetchPublicRow('ideas', slug, '&status=in.(published,featured)')
      if (!idea) return
      const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'CreativeWork',
        headline: idea.title,
        description: (idea.description || '').slice(0, 200),
        ...(idea.createdAt ? { dateCreated: idea.createdAt } : {}),
      }
      const bodyHtml = `
<article>
<h1>${escapeHtml(idea.title)}</h1>
${idea.description ? `<p>${escapeHtml(idea.description)}</p>` : ''}
${idea.quote ? `<blockquote>${escapeHtml(idea.quote)}</blockquote>` : ''}
</article>`
      const html = renderDocument({
        title: idea.title, description: idea.description, path: url.pathname,
        ogType: 'article', jsonLd, bodyHtml,
      })
      return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } })
    }

    if (section === 'series' && slug) {
      const series = await fetchPublicRow('series', slug, '&status=eq.published')
      if (!series) return
      const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'CreativeWorkSeries',
        name: series.title,
        description: series.description,
        ...(series.coverImage ? { image: series.coverImage } : {}),
      }
      const bodyHtml = `
<article>
<h1>${escapeHtml(series.title)}</h1>
${series.description ? `<p>${escapeHtml(series.description)}</p>` : ''}
</article>`
      const html = renderDocument({
        title: series.title, description: series.description, path: url.pathname,
        ogType: 'article', jsonLd, bodyHtml,
      })
      return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } })
    }

    if (section === 'editorial' && slug) {
      const feature = await fetchPublicRow('editorial_features', slug, '&status=eq.published')
      if (!feature) return
      const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: feature.title,
        description: (feature.dek || feature.intro || '').slice(0, 200),
        ...(feature.publishedAt ? { datePublished: feature.publishedAt } : {}),
        ...(feature.coverImage ? { image: feature.coverImage } : {}),
      }
      const bodyHtml = `
<article>
<h1>${escapeHtml(feature.title)}</h1>
${feature.dek ? `<p><em>${escapeHtml(feature.dek)}</em></p>` : ''}
${textToParagraphs(feature.intro)}
</article>`
      const html = renderDocument({
        title: feature.title, description: feature.dek || feature.intro, path: url.pathname,
        ogType: 'article', jsonLd, bodyHtml,
      })
      return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } })
    }

    if (section === 'library' && slug) {
      // Every status except 'archived' is publicly visible for Library
      // items (coming-soon, available, pre-order, free-download, etc. all
      // show on the site) — mirrors LibraryPage/LibraryDetailPage's own
      // "hide only archived" rule, since LibraryStatus has no 'published'.
      const item = await fetchPublicRow('library_items', slug, '&status=neq.archived')
      if (!item) return
      const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: item.title,
        description: item.description,
        ...(item.coverImage ? { image: item.coverImage } : {}),
        ...(item.price != null ? { offers: { '@type': 'Offer', price: item.price, priceCurrency: item.currency || 'USD' } } : {}),
      }
      const bodyHtml = `
<article>
<h1>${escapeHtml(item.title)}</h1>
${item.subtitle ? `<p><em>${escapeHtml(item.subtitle)}</em></p>` : ''}
${item.description ? `<p>${escapeHtml(item.description)}</p>` : ''}
${item.why ? `<p>${escapeHtml(item.why)}</p>` : ''}
</article>`
      const html = renderDocument({
        title: item.title, description: item.description, path: url.pathname,
        ogType: 'product', jsonLd, bodyHtml,
      })
      return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } })
    }
  } catch {
    return // any failure just falls through to the normal SPA
  }
}
