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
