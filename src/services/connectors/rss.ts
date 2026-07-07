import { supabase, isSupabaseConfigured } from '../../lib/supabase'

export interface FeedItem {
  title: string
  link: string
  description?: string
  publishedAt?: string
  enclosureUrl?: string
  imageUrl?: string
}

export class RssConnectorError extends Error {}

/**
 * Fetches and parses an RSS/Atom feed via the fetch-feed Edge Function.
 * Feeds can't be read directly from the browser — most send no CORS
 * headers — so this always goes through the deployed function, never a
 * direct client-side fetch(feedUrl).
 */
export async function fetchFeed(feedUrl: string): Promise<FeedItem[]> {
  if (!isSupabaseConfigured || !supabase) {
    throw new RssConnectorError('Feed import needs Supabase configured — this only works once the app is connected to a real project.')
  }

  const { data, error } = await supabase.functions.invoke<{ items?: FeedItem[]; error?: string }>('fetch-feed', {
    body: { url: feedUrl },
  })

  if (error) {
    throw new RssConnectorError(`Could not reach the feed fetcher: ${error.message}`)
  }
  if (data?.error) {
    throw new RssConnectorError(data.error)
  }
  return data?.items ?? []
}
