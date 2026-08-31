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
    '/topics/:slug',
  ],
}

const SUPABASE_URL = 'https://vptbswxntuycbgqnduab.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_TMC5OCu3gczdMXgjoqmGnA_3W2BbJpe'
const SITE_NAME = 'CULO Village'

// Mirrors src/data/topics.ts (name + description only — `count` isn't
// needed for a crawler snapshot). Topics aren't a Supabase table: they're
// this curated list plus whatever slug/name a founder types onto their own
// Story, so a topic page can be "rich" even with no curated entry here as
// long as at least one published Story carries that topic — same rule
// TopicPage.tsx itself uses (`isRich`).
const TOPICS: Record<string, { name: string; description: string }> = {
  'ai-marketing': { name: 'AI Marketing', description: 'Using artificial intelligence to create, distribute and optimise content.' },
  'founder-storytelling': { name: 'Founder Storytelling', description: 'How founders use their personal stories to build trust and authority.' },
  'content-systems': { name: 'Content Systems', description: 'Repeatable systems that make content creation consistent and scalable.' },
  'camera-roll-marketing': { name: 'Camera Roll Marketing', description: 'Using everyday footage from your phone as marketing content.' },
  'canva-workflows': { name: 'Canva Workflows', description: 'Efficient design and publishing workflows built inside Canva.' },
  'short-form-video': { name: 'Short Form Video', description: 'Reels, TikTok and YouTube Shorts strategy for founders.' },
  'personal-brand': { name: 'Personal Brand', description: 'Building a recognised and trusted name in your industry.' },
  'local-marketing': { name: 'Local Marketing', description: 'Marketing strategies that work for location-based businesses.' },
  authenticity: { name: 'Authenticity', description: 'Why showing up as yourself builds deeper connections with your audience.' },
  'content-strategy': { name: 'Content Strategy', description: 'Planning and executing content that serves a clear business goal.' },
  'social-media': { name: 'Social Media', description: 'Platform-specific strategy and distribution.' },
  'email-marketing': { name: 'Email Marketing', description: 'Building and nurturing an audience through email.' },
  'lead-generation': { name: 'Lead Generation', description: 'Turning content into clients and customers.' },
  entrepreneurship: { name: 'Entrepreneurship', description: 'The realities and lessons of building a business.' },
  photography: { name: 'Photography', description: 'Using photography as a storytelling and marketing tool.' },
  'health-and-wellness': { name: 'Health & Wellness', description: 'Physical and mental wellbeing services, from allied health to holistic care.' },
  fitness: { name: 'Fitness', description: 'Training, coaching and movement-based businesses.' },
  'beauty-and-skincare': { name: 'Beauty & Skincare', description: 'Salons, skincare brands and beauty services.' },
  'fashion-and-retail': { name: 'Fashion & Retail', description: 'Clothing, accessories and physical or online retail.' },
  'food-and-hospitality': { name: 'Food & Hospitality', description: 'Cafes, restaurants, catering and food producers.' },
  'trades-and-construction': { name: 'Trades & Construction', description: 'Builders, tradespeople and construction businesses.' },
  'real-estate': { name: 'Real Estate', description: 'Property sales, management and investment.' },
  'finance-and-accounting': { name: 'Finance & Accounting', description: 'Bookkeeping, accounting, lending and financial advice.' },
  legal: { name: 'Legal', description: 'Legal services and advice for individuals and businesses.' },
  'education-and-training': { name: 'Education & Training', description: 'Tutoring, courses, coaching and skills training.' },
  technology: { name: 'Technology', description: 'Software, apps and tech-driven products or services.' },
  'creative-arts': { name: 'Creative Arts', description: 'Design, art, music and other creative practices.' },
  events: { name: 'Events', description: 'Event planning, styling and production.' },
  'parenting-and-family': { name: 'Parenting & Family', description: 'Products and services for parents, kids and families.' },
  'disability-support': { name: 'Disability Support', description: 'NDIS and other disability support services.' },
  sustainability: { name: 'Sustainability', description: 'Eco-conscious products, services and practices.' },
  'travel-and-tourism': { name: 'Travel & Tourism', description: 'Travel planning, tours and hospitality experiences.' },
  automotive: { name: 'Automotive', description: 'Vehicle sales, servicing and related businesses.' },
  'pets-and-animals': { name: 'Pets & Animals', description: 'Pet care, training and animal-related services.' },
  'nonprofit-and-community': { name: 'Nonprofit & Community', description: 'Charities, community groups and social enterprises.' },
  'home-and-interiors': { name: 'Home & Interiors', description: 'Interior design, homewares and home services.' },
}

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

    // Topics are an aggregation, not a single row — no `topics` table exists.
    // A topic is "real" when either it's in the curated TOPICS list above or
    // at least one published Story carries a matching topic slug, exactly
    // the same isRich/NotFound rule TopicPage.tsx applies. So this fetches
    // every published Story and filters in-memory, same as the client does.
    if (section === 'topics' && slug) {
      const curated = TOPICS[slug]
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/stories?select=data&status=in.(published,featured)&limit=500`,
        { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } },
      )
      if (!res.ok) return
      const rows: { data: any }[] = await res.json()
      const matching = rows
        .map(r => r.data)
        .filter(s => Array.isArray(s.topics) && s.topics.some((t: any) => t?.slug === slug))

      if (!curated && matching.length === 0) return // matches TopicPage's own NotFound gate

      const name = curated?.name ?? matching[0].topics.find((t: any) => t.slug === slug)?.name ?? slug
      const description = curated?.description || `Founder stories in CULO Village about ${name}.`
      const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name,
        description,
        hasPart: matching.slice(0, 50).map(s => ({
          '@type': 'Article',
          headline: s.title,
          url: `https://www.culovillage.com/stories/${s.slug}`,
        })),
      }
      const bodyHtml = `
<article>
<h1>${escapeHtml(name)}</h1>
<p>${escapeHtml(description)}</p>
${matching.length > 0 ? `<ul>
${matching.map(s => `<li><a href="/stories/${escapeHtml(s.slug)}">${escapeHtml(s.title)}</a></li>`).join('\n')}
</ul>` : ''}
</article>`
      const html = renderDocument({
        title: name, description, path: url.pathname,
        ogType: 'website', jsonLd, bodyHtml,
      })
      return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } })
    }
  } catch {
    return // any failure just falls through to the normal SPA
  }
}
