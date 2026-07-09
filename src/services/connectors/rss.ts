import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import type { ConnectedSource } from '../../types/connectedSource'
import type { NormalizedImportItem } from './types'

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

/** The Connector contract: authenticate, fetch, normalize — nothing more. Used for both podcast-rss and website-rss source types. */
export async function fetchRssItems(source: ConnectedSource): Promise<NormalizedImportItem[]> {
  if (!source.config.feedUrl) throw new RssConnectorError('This feed source has no feed URL configured.')
  const items = await fetchFeed(source.config.feedUrl)
  return items.map(item => ({
    originalUrl: item.link,
    title: item.title,
    description: item.description,
    thumbnailUrl: item.imageUrl,
    publishedAt: item.publishedAt,
  }))
}
