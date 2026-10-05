// Client wrapper for resolve-website — auto-finds a blog/website's RSS or
// Atom feed instead of requiring the founder to paste the exact feed URL.
// See supabase/functions/resolve-website for the discovery logic.

import { supabase, isSupabaseConfigured } from '../lib/supabase'

export class WebsiteResolveError extends Error {}

export interface WebsiteFeedCandidate {
  title: string
  feedUrl: string
  website?: string
  itemCount: number
}

export type ResolveWebsiteResult =
  | { status: 'candidates'; candidates: WebsiteFeedCandidate[] }
  | { status: 'manual-required'; message: string }
  | { status: 'error'; message: string }

export async function resolveWebsiteFeed(input: string): Promise<ResolveWebsiteResult> {
  if (!isSupabaseConfigured || !supabase) {
    throw new WebsiteResolveError('Website import needs Supabase configured.')
  }
  const { data, error } = await supabase.functions.invoke<ResolveWebsiteResult>('resolve-website', {
    body: { input },
  })
  if (error) throw new WebsiteResolveError(`Could not reach the website resolver: ${error.message}`)
  if (!data) throw new WebsiteResolveError('The website resolver returned no response.')
  return data
}

// Client wrapper for resolve-article — the single-article counterpart to
// resolveWebsiteFeed above, for "I was featured on someone else's blog"
// where the founder doesn't control that site and can't be expected to
// find its RSS feed. No feed discovery — just reads the one page.
export interface ArticleExcerpt {
  title: string
  siteName: string
  image?: string
  excerpt: string
  url: string
}

export type ResolveArticleResult =
  | { status: 'ok'; article: ArticleExcerpt }
  | { status: 'error'; message: string }

export async function resolveArticle(url: string): Promise<ResolveArticleResult> {
  if (!isSupabaseConfigured || !supabase) {
    throw new WebsiteResolveError('Article import needs Supabase configured.')
  }
  const { data, error } = await supabase.functions.invoke<ArticleExcerpt & { error?: string }>('resolve-article', {
    body: { url },
  })
  if (error) throw new WebsiteResolveError(`Could not reach the article resolver: ${error.message}`)
  if (!data) throw new WebsiteResolveError('The article resolver returned no response.')
  if (data.error) return { status: 'error', message: data.error }
  return { status: 'ok', article: data }
}
