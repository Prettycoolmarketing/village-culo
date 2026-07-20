// Client wrapper for resolve-episode — the RSS-free single-episode path.
// See supabase/functions/resolve-episode for the actual resolution logic.

import { supabase, isSupabaseConfigured } from '../lib/supabase'

export class EpisodeResolveError extends Error {}

export interface ResolvedEpisode {
  title: string
  thumbnailUrl?: string
  embedUrl: string
  platform: 'spotify' | 'apple'
}

export async function resolveEpisode(url: string): Promise<ResolvedEpisode> {
  if (!isSupabaseConfigured || !supabase) {
    throw new EpisodeResolveError('Episode import needs Supabase configured.')
  }
  const { data, error } = await supabase.functions.invoke<{ episode?: ResolvedEpisode; error?: string }>('resolve-episode', {
    body: { url },
  })
  if (error) throw new EpisodeResolveError(`Could not reach the episode resolver: ${error.message}`)
  if (data?.error) throw new EpisodeResolveError(data.error)
  if (!data?.episode) throw new EpisodeResolveError('The episode resolver returned no result.')
  return data.episode
}
