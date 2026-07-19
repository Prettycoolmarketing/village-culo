import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import type { ConnectedSource } from '../../types/connectedSource'
import type { NormalizedImportItem } from './types'

export class PodcastConnectorError extends Error {}

export interface PodcastFeedEpisode {
  originalUrl: string
  title: string
  description?: string
  showNotes?: string
  publishedAt?: string
  thumbnailUrl?: string
  episodeGuid?: string
  enclosureUrl?: string
  enclosureType?: string
  durationSeconds?: number
  episodeNumber?: number
  seasonNumber?: number
  episodeKind?: 'full' | 'trailer' | 'bonus'
  explicit?: boolean
  chapters?: { title: string; startSeconds: number }[]
  transcriptUrl?: string
}

export interface PodcastFeedShow {
  title: string
  description?: string
  artworkUrl?: string
  author?: string
  website?: string
  language?: string
  categories?: string[]
  lastBuildDate?: string
}

/** Fetches and parses a podcast RSS feed via the fetch-podcast-feed Edge Function — same CORS constraint as the generic RSS connector. */
export async function fetchPodcastFeed(feedUrl: string): Promise<{ show: PodcastFeedShow; episodes: PodcastFeedEpisode[] }> {
  if (!isSupabaseConfigured || !supabase) {
    throw new PodcastConnectorError('Podcast import needs Supabase configured — this only works once the app is connected to a real project.')
  }
  const { data, error } = await supabase.functions.invoke<{ show?: PodcastFeedShow; episodes?: PodcastFeedEpisode[]; error?: string }>('fetch-podcast-feed', {
    body: { feedUrl },
  })
  if (error) throw new PodcastConnectorError(`Could not reach the podcast feed fetcher: ${error.message}`)
  if (data?.error) throw new PodcastConnectorError(data.error)
  if (!data?.show || !data.episodes) throw new PodcastConnectorError('The podcast feed returned no episodes.')
  return { show: data.show, episodes: data.episodes }
}

/** The Connector contract: authenticate, fetch, normalize — nothing more. Podcast-specific fields ride along for connectedSources.ts to carry onto ImportedContent. */
export async function fetchPodcastItems(source: ConnectedSource): Promise<NormalizedImportItem[]> {
  if (!source.config.feedUrl) throw new PodcastConnectorError('This podcast source has no feed URL configured.')
  const { show, episodes } = await fetchPodcastFeed(source.config.feedUrl)
  return episodes.map(ep => ({
    originalUrl: ep.originalUrl,
    title: ep.title,
    description: ep.description,
    thumbnailUrl: ep.thumbnailUrl ?? show.artworkUrl,
    publishedAt: ep.publishedAt,
    episodeGuid: ep.episodeGuid,
    enclosureUrl: ep.enclosureUrl,
    enclosureType: ep.enclosureType,
    durationSeconds: ep.durationSeconds,
    episodeNumber: ep.episodeNumber,
    seasonNumber: ep.seasonNumber,
    episodeKind: ep.episodeKind,
    explicit: ep.explicit,
    showNotes: ep.showNotes,
    chapters: ep.chapters,
    transcriptUrl: ep.transcriptUrl,
    podcastTitle: show.title,
  }))
}
