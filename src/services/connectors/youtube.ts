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

// 50 is YouTube Data API's hard per-request cap on search.list — pulling more
// than that in one scan would need paging through nextPageToken across
// multiple requests, which isn't implemented yet.
export async function fetchChannelVideos(channelId: string, maxResults = 50): Promise<YouTubeVideo[]> {
  const apiKey = getApiKey()
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${encodeURIComponent(channelId)}&order=date&type=video&maxResults=${maxResults}&key=${apiKey}`
  )
  if (!res.ok) throw new YouTubeConnectorError(`YouTube API error (${res.status}). The channel may be private or the key misconfigured.`)
  const json = await res.json()
  const items = Array.isArray(json.items) ? json.items : []

  return items
    .filter((item: { id?: { videoId?: string } }) => item.id?.videoId)
    .map((item: { id: { videoId: string }; snippet: { title: string; description: string; publishedAt: string; thumbnails?: Record<string, { url: string }> } }) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnailUrl: item.snippet.thumbnails?.high?.url ?? item.snippet.thumbnails?.default?.url,
      publishedAt: item.snippet.publishedAt,
    }))
}

/** The Connector contract: authenticate, fetch, normalize — nothing more. */
export async function fetchYouTubeItems(source: ConnectedSource): Promise<NormalizedImportItem[]> {
  if (!source.config.channelId) throw new YouTubeConnectorError('This YouTube source has no channel configured.')
  const videos = await fetchChannelVideos(source.config.channelId)
  return videos.map(v => ({
    originalUrl: `https://www.youtube.com/watch?v=${v.videoId}`,
    title: v.title,
    description: v.description,
    thumbnailUrl: v.thumbnailUrl,
    publishedAt: v.publishedAt,
    embedUrl: `https://www.youtube.com/embed/${v.videoId}`,
  }))
}
