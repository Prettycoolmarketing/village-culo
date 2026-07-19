// Client-side wrapper for the resolve-podcast Edge Function — turns
// whatever a founder pastes (URL or name) into one or more confirmable
// podcast candidates. See supabase/functions/resolve-podcast for the
// actual resolution logic (deterministic, no LLM).

import { supabase, isSupabaseConfigured } from '../lib/supabase'
import type { ConnectionMethod } from '../types/connectedSource'

export class PodcastResolveError extends Error {}

export interface PodcastCandidate {
  title: string
  description?: string
  artworkUrl?: string
  author?: string
  website?: string
  feedUrl: string
  language?: string
  categories?: string[]
  episodeCount?: number
  latestEpisodeDate?: string
  appleId?: string
  appleUrl?: string
  spotifyUrl?: string
  connectionMethod: ConnectionMethod
}

export type ResolvePodcastResult =
  | { status: 'candidates'; candidates: PodcastCandidate[] }
  | { status: 'manual-required'; message: string }
  | { status: 'error'; code: string; message: string }

export async function resolvePodcast(input: string): Promise<ResolvePodcastResult> {
  if (!isSupabaseConfigured || !supabase) {
    throw new PodcastResolveError('Podcast import needs Supabase configured.')
  }
  const { data, error } = await supabase.functions.invoke<ResolvePodcastResult>('resolve-podcast', {
    body: { input },
  })
  if (error) throw new PodcastResolveError(`Could not reach the podcast resolver: ${error.message}`)
  if (!data) throw new PodcastResolveError('The podcast resolver returned no response.')
  return data
}
