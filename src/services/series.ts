import { readCache, writeEntity, deleteEntity, type WriteResult } from '../lib/entityStore'
import { getStories, updateStory } from './stories'
import { slugify } from '../utils/slugify'
import type { Series, Story } from '../types'

const KEY = 'series'
const TABLE = 'series'

function live(): Series[] {
  return readCache<Series>(KEY)
}

export interface SeriesFilter {
  founderId?: string
  status?: Series['status']
  publicOnly?: boolean
}

// Pulls the leading "Season N" number out of a title like "Season 7 - Truck
// Life..." so seasons sort in real order instead of whatever order the
// cache happened to fetch them in. Titles without a leading season number
// sort after every numbered one, alphabetically among themselves.
function seasonNumber(title: string): number {
  const match = title.match(/^season\s+(\d+)/i)
  return match ? parseInt(match[1]!, 10) : Infinity
}

export function getSeriesList(filter?: SeriesFilter): Series[] {
  let result = live()
  if (filter) {
    if (filter.founderId)  result = result.filter(s => s.founderId === filter.founderId)
    if (filter.status)     result = result.filter(s => s.status === filter.status)
    if (filter.publicOnly) result = result.filter(s => s.status === 'published')
  }
  return result.slice().sort((a, b) => seasonNumber(a.title) - seasonNumber(b.title) || a.title.localeCompare(b.title))
}

export function getSeries(id: string): Series | undefined {
  return live().find(s => s.id === id)
}

export function getSeriesBySlug(slug: string): Series | undefined {
  return live().find(s => s.slug === slug)
}

/** Every episode (Story) in a series, in episode order — undefined episodeNumber sorts last. */
export function getSeriesEpisodes(seriesId: string): Story[] {
  return getStories({ seriesId })
    .slice()
    .sort((a, b) => (a.episodeNumber ?? Infinity) - (b.episodeNumber ?? Infinity))
}

function uniqueSlug(base: string, ignoreId?: string): string {
  const root = slugify(base) || 'series'
  const taken = new Set(live().filter(s => s.id !== ignoreId).map(s => s.slug))
  if (!taken.has(root)) return root
  let n = 2
  while (taken.has(`${root}-${n}`)) n++
  return `${root}-${n}`
}

export function createSeries(founderId: string, title: string): Series {
  const now = new Date().toISOString()
  const series: Series = {
    id: crypto.randomUUID(),
    slug: uniqueSlug(title),
    founderId,
    title,
    status: 'draft',
    createdAt: now,
    updatedAt: now,
  }
  return series
}

export async function saveSeries(series: Series): Promise<WriteResult> {
  const toSave: Series = { ...series, slug: uniqueSlug(series.slug || series.title, series.id), updatedAt: new Date().toISOString() }
  return writeEntity<Series>({
    cacheKey: KEY,
    item: toSave,
    table: TABLE,
    toRow: (s, userId) => ({
      id: s.id,
      user_id: userId,
      founder_id: s.founderId,
      status: s.status,
      slug: s.slug,
      data: s,
    }),
  })
}

/** Deletes the series itself and un-assigns every episode currently in it — episodes stay published, they just lose their series/episode number. */
export async function deleteSeries(id: string): Promise<WriteResult> {
  const episodes = getSeriesEpisodes(id)
  await Promise.all(episodes.map(ep => updateStory({ ...ep, seriesId: undefined, episodeNumber: undefined })))
  return deleteEntity({ cacheKey: KEY, id, table: TABLE })
}

/** Assigns a story to a series at the next open episode slot, or moves it if already assigned elsewhere. */
export async function assignEpisode(storyId: string, seriesId: string): Promise<WriteResult> {
  const story = getStories({ ids: [storyId] })[0]
  if (!story) return { success: false, error: 'Story not found.' }
  const existing = getSeriesEpisodes(seriesId)
  const nextNumber = existing.length > 0 ? Math.max(...existing.map(e => e.episodeNumber ?? 0)) + 1 : 1
  return updateStory({ ...story, seriesId, episodeNumber: nextNumber })
}

export async function removeEpisode(storyId: string): Promise<WriteResult> {
  const story = getStories({ ids: [storyId] })[0]
  if (!story) return { success: false, error: 'Story not found.' }
  return updateStory({ ...story, seriesId: undefined, episodeNumber: undefined })
}

/**
 * A plain-text "series bible" — title, logline, and every episode with its
 * synopsis, thumbnail and link — built entirely from data that already
 * exists once a series has episodes assigned. This is the artifact that
 * actually gets sent when pitching a series anywhere (Netflix included),
 * so it stays a formatted export rather than a rebuild later.
 */
export function buildSeriesBible(series: Series, episodes: Story[], founderName: string, siteOrigin: string): string {
  const lines: string[] = []
  lines.push(`# ${series.title}`)
  lines.push('')
  lines.push(`A series by ${founderName} — CULO Village`)
  if (series.description) {
    lines.push('')
    lines.push(series.description)
  }
  lines.push('')
  lines.push(`${episodes.length} episode${episodes.length === 1 ? '' : 's'}`)
  lines.push(`${siteOrigin}/series/${series.slug}`)
  lines.push('')
  lines.push('---')
  lines.push('')
  episodes.forEach((ep, i) => {
    lines.push(`## Episode ${i + 1}: ${ep.title}`)
    lines.push('')
    if (ep.subtitle) lines.push(`_${ep.subtitle}_`)
    if (ep.summary) { lines.push(''); lines.push(ep.summary) }
    lines.push('')
    if (ep.coverImage) lines.push(`Thumbnail: ${ep.coverImage}`)
    if (ep.reelUrl) lines.push(`Video: ${ep.reelUrl}`)
    lines.push(`Watch: ${siteOrigin}/stories/${ep.slug}`)
    lines.push('')
  })
  return lines.join('\n')
}

/** Renumbers a series' episodes to match the given story-id order exactly (1-indexed). */
export async function reorderEpisodes(seriesId: string, orderedStoryIds: string[]): Promise<WriteResult> {
  const results = await Promise.all(orderedStoryIds.map((id, i) => {
    const story = getStories({ ids: [id] })[0]
    if (!story) return Promise.resolve<WriteResult>({ success: true })
    return updateStory({ ...story, seriesId, episodeNumber: i + 1 })
  }))
  const failed = results.find(r => !r.success)
  return failed ?? { success: true }
}
