// YouTube connector — reads a founder's own public channel via the YouTube
// Data API v3 using a public, HTTP-referrer-restricted API key (no OAuth).
// A founder is only ever importing videos they've already published publicly,
// so a read-only key (same trust model as the Supabase anon key, protected by
// referrer restriction in Google Cloud Console rather than by RLS) is enough —
// there's no need for a per-user consent flow to read public data.

import type { ConnectedSource } from '../../types/connectedSource'
import type { NormalizedImportItem } from './types'

export interface YouTubeVideo {
  videoId: string
  title: string
  description: string
  thumbnailUrl?: string
  publishedAt: string
}

export class YouTubeConnectorError extends Error {}

function getApiKey(): string {
  const key = import.meta.env.VITE_YOUTUBE_API_KEY as string | undefined
  if (!key) {
    throw new YouTubeConnectorError('YouTube import isn’t configured yet — VITE_YOUTUBE_API_KEY is missing.')
  }
  return key
}

/** Accepts a channel ID (UC...), a full channel URL, or an @handle, and resolves it to a channel ID. */
export async function resolveChannelId(input: string): Promise<string> {
  const apiKey = getApiKey()
  const trimmed = input.trim()

  const idMatch = trimmed.match(/^UC[\w-]{20,}$/) ?? trimmed.match(/\/channel\/(UC[\w-]{20,})/)
  if (idMatch) return idMatch[1] ?? idMatch[0]

  const handleMatch = trimmed.match(/(?:^@|youtube\.com\/@)([\w.-]+)/)
  const handle = handleMatch ? handleMatch[1] : trimmed.replace(/^@/, '')

  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${encodeURIComponent(handle)}&key=${apiKey}`
  )
  if (!res.ok) throw new YouTubeConnectorError(`YouTube API error (${res.status}). Check the channel handle and try again.`)
  const json = await res.json()
  const channelId = json.items?.[0]?.id
  if (!channelId) throw new YouTubeConnectorError('Couldn’t find a YouTube channel for that handle or URL.')
  return channelId
}

// 50 is YouTube Data API's hard per-request cap on search.list, so pulling
// more means paging through nextPageToken. Each page still costs 100 quota
// units (search.list is expensive relative to the default 10,000/day quota).
// Raised well past "the last while" so a founder's — or a curated profile's
// — entire back-catalogue can come in during one scan instead of trickling
// in a couple hundred at a time; 1000 videos is 20 requests (2,000 quota
// units), still comfortably inside the default 10,000/day quota.
const MAX_VIDEOS_PER_SCAN = 1000

type YouTubeSearchItem = {
  id?: { videoId?: string }
  snippet: { title: string; description: string; publishedAt: string; thumbnails?: Record<string, { url: string }> }
}

// YouTube's API returns whatever sizes actually exist for a video — 'high'
// (480x360) is only middling once stretched to fill a large card, so prefer
// the sharper sizes when they're available and fall back down the chain.
function bestThumbnail(thumbnails?: Record<string, { url: string }>): string | undefined {
  return thumbnails?.maxres?.url
    ?? thumbnails?.standard?.url
    ?? thumbnails?.high?.url
    ?? thumbnails?.medium?.url
    ?? thumbnails?.default?.url
}

function mapSearchItem(item: YouTubeSearchItem & { id: { videoId: string } }): YouTubeVideo {
  return {
    videoId: item.id.videoId,
    title: item.snippet.title,
    description: item.snippet.description,
    thumbnailUrl: bestThumbnail(item.snippet.thumbnails),
    publishedAt: item.snippet.publishedAt,
  }
}

export async function fetchChannelVideos(channelId: string, maxTotal = MAX_VIDEOS_PER_SCAN): Promise<YouTubeVideo[]> {
  const apiKey = getApiKey()
  const videos: YouTubeVideo[] = []
  let pageToken: string | undefined

  do {
    const pageParam = pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${encodeURIComponent(channelId)}&order=date&type=video&maxResults=50&key=${apiKey}${pageParam}`
    )
    if (!res.ok) throw new YouTubeConnectorError(`YouTube API error (${res.status}). The channel may be private or the key misconfigured.`)
    const json = await res.json()
    const items: YouTubeSearchItem[] = Array.isArray(json.items) ? json.items : []

    videos.push(
      ...items
        .filter((item): item is YouTubeSearchItem & { id: { videoId: string } } => !!item.id?.videoId)
        .map(mapSearchItem)
    )
    pageToken = json.nextPageToken
  } while (pageToken && videos.length < maxTotal)

  return videos.slice(0, maxTotal)
}

/** The Connector contract: authenticate, fetch, normalize — nothing more. */
export async function fetchYouTubeItems(source: ConnectedSource): Promise<NormalizedImportItem[]> {
  if (!source.config.channelId) throw new YouTubeConnectorError('This YouTube source has no channel configured.')
  // A raised dailyLimitOverride (see connectedSources.ts) implies the founder
  // wants deep history, not just new uploads — fetch further than the normal
  // 200-video ceiling to actually reach it, instead of quietly capping the
  // pool the daily drip draws from.
  const fetchCeiling = source.dailyLimitOverride
    ? Math.max(source.dailyLimitOverride, MAX_VIDEOS_PER_SCAN)
    : undefined
  const videos = await fetchChannelVideos(source.config.channelId, fetchCeiling)
  return videos.map(v => ({
    originalUrl: `https://www.youtube.com/watch?v=${v.videoId}`,
    title: v.title,
    description: v.description,
    thumbnailUrl: v.thumbnailUrl,
    publishedAt: v.publishedAt,
    embedUrl: `https://www.youtube.com/embed/${v.videoId}`,
  }))
}
