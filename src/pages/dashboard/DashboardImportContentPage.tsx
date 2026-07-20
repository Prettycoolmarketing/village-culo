import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { getCurrentFounderId } from '../../services/currentFounder'
import { getBusinesses } from '../../services/businesses'
import { getFounder, updateFounder } from '../../services/founders'
import { partnerService } from '../../services/partner'
import { getStory } from '../../services/stories'
import {
  importedContentService,
  PLATFORM_LABELS,
  PLATFORM_COLORS,
} from '../../services/importedContent'
import { buildStoryFromImport, publishStoryCore, syncImportEditsToStory } from '../../services/publishStory'
import { enrichImportedContent, extractQaFromBlog, type BlogQaPair } from '../../services/importedContentEnrichment'
import { normalizeUrl } from '../../utils/url'
import { MediaUpload } from '../../components/ui/MediaUpload'
import { ConfirmButton } from '../../components/ui/ConfirmButton'
import {
  villageContentIntelligenceService,
  importedContentToInput,
} from '../../services/villageIntelligence'
import { connectedSourcesService, newConnectedSource, scanSource, importSelectedPodcastEpisodes } from '../../services/connectedSources'
import { resolveChannelId } from '../../services/connectors/youtube'
import { fetchPodcastFeed, type PodcastFeedShow, type PodcastFeedEpisode } from '../../services/connectors/podcastRss'
import { resolvePodcast, type PodcastCandidate } from '../../services/podcastResolve'
import { resolveEpisode, type ResolvedEpisode } from '../../services/episodeResolve'
import { resolveWebsiteFeed, type WebsiteFeedCandidate } from '../../services/websiteResolve'
import {
  isCanvaConfigured,
  getCanvaStatus,
  startCanvaConnect,
  listCanvaDesigns,
  importCanvaDesign,
  type CanvaDesignSummary,
  type CanvaImportResult,
} from '../../services/canva'
import type {
  ImportedContent,
  ImportedContentStatus,
  ImportedContentVisibility,
  ImportedContentPlatform,
} from '../../types/importedContent'
import type { ConnectedSource, ConnectedSourceType, PodcastSourceMeta } from '../../types/connectedSource'
import type { NormalizedImportItem } from '../../services/connectors/types'
import type { FAQ } from '../../types'
import type { VillageContentIntelligence } from '../../types/villageIntelligence'

// Comma-separated allowlist of emails allowed to pull far more than the
// normal daily import drip (see connectedSources.ts's DAILY_IMPORT_LIMIT) —
// a deliberate one-off for founders bringing in a whole channel's back
// catalogue, not a general setting. Mirrors VITE_DEV_ADMIN_EMAILS's pattern.
const HIGH_VOLUME_IMPORT_EMAILS = (import.meta.env.VITE_HIGH_VOLUME_IMPORT_EMAILS ?? '')
  .split(',')
  .map((e: string) => e.trim().toLowerCase())
  .filter(Boolean)
const HIGH_VOLUME_DAILY_LIMIT = 2000

// ─── Constants ────────────────────────────────────────────────────────────────

// 'podcast' embeds only when embedUrl is actually set — true for a
// single-episode import (Spotify/Apple embed player) but not for an
// RSS-connector-discovered episode, which never has one.
const EMBEDDABLE = new Set(['youtube', 'vimeo', 'tiktok', 'podcast'])

const STATUS_OPTIONS: { value: ImportedContentStatus; label: string }[] = [
  { value: 'draft',     label: 'Draft'     },
  { value: 'published', label: 'Published' },
  { value: 'archived',  label: 'Archived'  },
]

const VISIBILITY_OPTIONS: { value: ImportedContentVisibility; label: string; note: string }[] = [
  { value: 'private',      label: 'Private',      note: 'Only you can see this'             },
  { value: 'discoverable', label: 'Discoverable', note: 'Appears in search and topic pages' },
  { value: 'public',       label: 'Public',       note: 'Shown on your profile'             },
]

const TRANSCRIPT_STATUS_OPTIONS = [
  { value: 'none',        label: 'No transcript'                         },
  { value: 'manual',      label: 'Pasted manually'                       },
  { value: 'unavailable', label: 'Not available for this content/platform' },
]

const PLATFORM_TAB_ORDER: ImportedContentPlatform[] = ['youtube', 'podcast', 'website', 'canva']

const SOURCE_TYPE_LABELS: Record<ConnectedSourceType, string> = {
  'youtube':      'YouTube',
  'podcast-rss':  'Podcast',
  'website-rss':  'Website',
}

const SOURCE_TYPE_HINTS: Record<ConnectedSourceType, string> = {
  'youtube':      'Paste your channel URL, @handle, or channel ID.',
  'podcast-rss':  'Paste your podcast’s RSS feed URL.',
  'website-rss':  'Paste your blog’s RSS feed URL.',
}

// ─── Import from Canva ────────────────────────────────────────────────────────
// A one-off "pick a design" flow, not a connected source — no periodic
// scanning, matches how "Turn into Story" already works elsewhere in this
// app. The founder authorizes once (OAuth, see services/canva.ts), then
// picks a design each time they want to bring one in.

type CanvaPanelStep = 'connect' | 'pick' | 'importing' | 'review'

function CanvaImportPanel({ founderId, onImported }: { founderId: string; onImported: () => void }) {
  const [step, setStep] = useState<CanvaPanelStep>('connect')
  const [checkedConnection, setCheckedConnection] = useState(false)
  const [designs, setDesigns] = useState<CanvaDesignSummary[]>([])
  const [result, setResult] = useState<CanvaImportResult | null>(null)
  const [coverIndex, setCoverIndex] = useState(0)
  const [editableTitle, setEditableTitle] = useState('')
  const [editableText, setEditableText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [designId, setDesignId] = useState('')

  useEffect(() => {
    void getCanvaStatus(founderId).then(connected => {
      setStep(connected ? 'pick' : 'connect')
      setCheckedConnection(true)
    })
  }, [founderId])

  async function handleBrowse() {
    setError(null)
    try {
      setDesigns(await listCanvaDesigns(founderId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load your Canva designs.')
    }
  }

  async function handlePick(id: string) {
    setError(null)
    setDesignId(id)
    setStep('importing')
    try {
      const imported = await importCanvaDesign(founderId, id)
      setResult(imported)
      setEditableTitle(imported.title)
      setEditableText(imported.combinedText)
      setCoverIndex(0)
      setStep('review')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not import that design.')
      setStep('pick')
    }
  }

  async function handleSaveAsImport() {
    if (!result) return
    const now = new Date().toISOString()
    const item: ImportedContent = {
      id: `imp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      founderId,
      sourcePlatform: 'canva',
      originalUrl: `https://www.canva.com/design/${designId}/view`,
      thumbnailUrl: result.imageUrls[coverIndex] ?? result.imageUrls[0],
      imageUrls: result.imageUrls,
      title: editableTitle || result.title,
      // The full text, not truncated — this is what shows in the Blog field
      // and what publishes as the story body. Previously stored the full
      // text separately as diaryNote (truncating description to 400 chars),
      // which meant editing Blog afterward had no effect since diaryNote
      // silently outranked description at publish time.
      description: editableText,
      importedAt: now,
      status: 'draft',
      topics: [],
      locations: [],
      visibility: 'private',
    }
    const saveResult = await importedContentService.upsert(item)
    if (!saveResult.success) { setError(saveResult.error ?? 'Could not save. Please try again.'); return }
    setStep('pick')
    setResult(null)
    onImported()
  }

  if (!isCanvaConfigured()) return null
  if (!checkedConnection) return null

  return (
    <div className="bg-white rounded-xl border border-[#E8E4DD] p-5 mb-4">
      <p className="text-sm font-semibold text-[#2D2A26] mb-1">Import from Canva</p>
      <p className="text-xs text-[#9CA3AF] mb-3">Bring in a Canva project's slides as a carousel or static photo — the words on each slide become your blog/caption copy.</p>

      {error && <p className="text-xs text-red-600 mb-3">{error}</p>}

      {step === 'connect' && (
        <button
          onClick={() => void startCanvaConnect(founderId)}
          className="px-4 py-2 bg-[#00C4CC] text-white text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity"
        >
          Connect Canva
        </button>
      )}

      {step === 'pick' && (
        <div>
          {designs.length === 0 ? (
            <button
              onClick={() => void handleBrowse()}
              className="px-4 py-2 text-sm font-semibold text-white bg-[#C86A43] rounded-lg hover:bg-[#B15C38] transition-colors"
            >
              Browse my Canva designs
            </button>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {designs.map(d => (
                <button
                  key={d.id}
                  onClick={() => void handlePick(d.id)}
                  className="text-left rounded-lg overflow-hidden border border-[#E8E4DD] hover:border-[#C86A43]/40 transition-colors"
                >
                  {d.thumbnailUrl && <img src={d.thumbnailUrl} alt="" className="w-full aspect-video object-cover bg-[#F3EDE6]" />}
                  <p className="text-[11px] text-[#2D2A26] px-2 py-1.5 truncate">{d.title}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {step === 'importing' && (
        <p className="text-xs text-[#9CA3AF]">Importing your slides — this can take a moment…</p>
      )}

      {step === 'review' && result && (
        <div>
          {(result.textExtractionSkipped || (result.imagesSkipped ?? 0) > 0 || result.slidesTruncated) && (
            <div className="mb-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-700 leading-relaxed">
                This design was large, so {[
                  result.textExtractionSkipped && 'the slide text couldn’t be pulled in automatically — write your own below',
                  (result.imagesSkipped ?? 0) > 0 && `${result.imagesSkipped} image${result.imagesSkipped === 1 ? '' : 's'} couldn't be imported`,
                  result.slidesTruncated && 'only the first 30 slides were brought in',
                ].filter(Boolean).join('; ')}.
              </p>
            </div>
          )}
          <label className="text-[10px] text-[#9CA3AF] uppercase tracking-wide block mb-1">Title</label>
          <input
            type="text" value={editableTitle} onChange={e => setEditableTitle(e.target.value)}
            className="w-full mb-3 px-3 py-2 rounded-lg border border-[#E8E4DD] text-sm text-[#2D2A26] bg-white focus:outline-none focus:ring-2 focus:ring-[#C86A43]/30 focus:border-[#C86A43]"
          />

          {result.imageUrls.length > 0 && (
            <>
              <label className="text-[10px] text-[#9CA3AF] uppercase tracking-wide block mb-1">Slides — click one to use as the cover photo</label>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mb-3">
                {result.imageUrls.map((url, i) => (
                  <button
                    key={url}
                    onClick={() => setCoverIndex(i)}
                    className={`rounded-lg overflow-hidden border-2 transition-colors ${coverIndex === i ? 'border-[#C86A43]' : 'border-transparent'}`}
                  >
                    <img src={url} alt="" className="w-full aspect-square object-cover bg-[#F3EDE6]" />
                  </button>
                ))}
              </div>
            </>
          )}

          <label className="text-[10px] text-[#9CA3AF] uppercase tracking-wide block mb-1">Words from your slides — becomes your caption/blog copy</label>
          <textarea
            value={editableText} onChange={e => setEditableText(e.target.value)} rows={5}
            className="w-full mb-3 px-3 py-2 rounded-lg border border-[#E8E4DD] text-sm text-[#2D2A26] bg-white focus:outline-none focus:ring-2 focus:ring-[#C86A43]/30 focus:border-[#C86A43]"
          />

          <div className="flex items-center gap-3">
            <button
              onClick={() => void handleSaveAsImport()}
              className="px-4 py-2 bg-[#C86A43] text-white text-xs font-semibold rounded-lg hover:bg-[#b05a35] transition-colors"
            >
              Save to Import Content
            </button>
            <button onClick={() => { setStep('pick'); setResult(null) }} className="text-xs text-[#9CA3AF] hover:text-[#6B7280] transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Connect a podcast ────────────────────────────────────────────────────────
// Guided resolution (URL or name → confirm → full episode catalogue → pick
// episodes) instead of requiring the founder to find their own RSS feed.
// Manual RSS entry is still reachable as the explicit fallback (spec: "do
// not leave the user at a generic error screen"), never the default path.

type PodcastPanelStep = 'input' | 'resolving' | 'candidates' | 'manual' | 'connecting' | 'episodes' | 'importing'

function PodcastConnectPanel({ founderId, isHighVolume, onConnected }: { founderId: string; isHighVolume: boolean; onConnected: () => void }) {
  const [step, setStep] = useState<PodcastPanelStep>('input')
  const [input, setInput] = useState('')
  const [candidates, setCandidates] = useState<PodcastCandidate[]>([])
  const [manualMessage, setManualMessage] = useState<string | null>(null)
  const [manualFeedUrl, setManualFeedUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [connectedSource, setConnectedSource] = useState<ConnectedSource | null>(null)
  const [show, setShow] = useState<PodcastFeedShow | null>(null)
  const [episodes, setEpisodes] = useState<PodcastFeedEpisode[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [episodeSearch, setEpisodeSearch] = useState('')
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')
  const [doneCount, setDoneCount] = useState<number | null>(null)

  function reset() {
    setStep('input'); setInput(''); setCandidates([]); setManualMessage(null); setManualFeedUrl('')
    setError(null); setConnectedSource(null); setShow(null); setEpisodes([]); setSelected(new Set())
    setEpisodeSearch(''); setDoneCount(null)
  }

  async function handleFind() {
    if (!input.trim()) return
    setStep('resolving')
    setError(null)
    try {
      const result = await resolvePodcast(input)
      if (result.status === 'candidates') {
        setCandidates(result.candidates)
        setStep('candidates')
      } else if (result.status === 'manual-required') {
        setManualMessage(result.message)
        setStep('manual')
      } else {
        setError(result.message)
        setStep('manual')
        setManualMessage(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not resolve this podcast.')
      setStep('manual')
    }
  }

  async function connectFromFeed(feedUrl: string, meta: Partial<PodcastSourceMeta> | undefined, connectionMethod: ConnectedSource['connectionMethod']) {
    setStep('connecting')
    setError(null)
    try {
      const { show: fetchedShow, episodes: fetchedEpisodes } = await fetchPodcastFeed(feedUrl)
      const label = meta?.title || fetchedShow.title
      const source = newConnectedSource(founderId, 'podcast-rss', label, { feedUrl })
      source.podcast = {
        title: fetchedShow.title,
        description: fetchedShow.description,
        artworkUrl: meta?.artworkUrl ?? fetchedShow.artworkUrl,
        author: fetchedShow.author,
        website: fetchedShow.website,
        language: fetchedShow.language,
        categories: fetchedShow.categories,
        feedLastBuildDate: fetchedShow.lastBuildDate,
        appleId: meta?.appleId,
        appleUrl: meta?.appleUrl,
        spotifyUrl: meta?.spotifyUrl,
      }
      source.connectionMethod = connectionMethod
      if (isHighVolume) source.dailyLimitOverride = HIGH_VOLUME_DAILY_LIMIT
      await connectedSourcesService.upsert(source)
      setConnectedSource(source)
      setShow(fetchedShow)
      setEpisodes(fetchedEpisodes)
      setStep('episodes')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not connect this podcast.')
      setStep('manual')
    }
  }

  async function handleConfirm(candidate: PodcastCandidate) {
    await connectFromFeed(candidate.feedUrl, {
      title: candidate.title,
      artworkUrl: candidate.artworkUrl,
      appleId: candidate.appleId,
      appleUrl: candidate.appleUrl,
      spotifyUrl: candidate.spotifyUrl,
    }, candidate.connectionMethod)
  }

  async function handleManualConnect() {
    if (!manualFeedUrl.trim()) return
    await connectFromFeed(manualFeedUrl.trim(), undefined, 'manual')
  }

  function toggleEpisode(key: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key); else next.add(key)
      return next
    })
  }

  const filteredEpisodes = episodes
    .filter(ep => !episodeSearch.trim() || ep.title.toLowerCase().includes(episodeSearch.trim().toLowerCase()))
    .sort((a, b) => {
      const da = a.publishedAt ? new Date(a.publishedAt).getTime() : 0
      const db = b.publishedAt ? new Date(b.publishedAt).getTime() : 0
      return sortOrder === 'newest' ? db - da : da - db
    })

  async function handleImportSelected() {
    if (!connectedSource || selected.size === 0) return
    setStep('importing')
    const chosen = episodes.filter(ep => selected.has(ep.episodeGuid || ep.originalUrl))
    const items: NormalizedImportItem[] = chosen.map(ep => ({
      originalUrl: ep.originalUrl,
      title: ep.title,
      description: ep.description,
      thumbnailUrl: ep.thumbnailUrl ?? show?.artworkUrl,
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
      podcastTitle: show?.title,
    }))
    const result = await importSelectedPodcastEpisodes(connectedSource, items)
    setDoneCount(result.imported)
    onConnected()
  }

  return (
    <div className="bg-white rounded-xl border border-[#E8E4DD] p-5 mb-4">
      <p className="text-sm font-semibold text-[#2D2A26] mb-1">Connect your podcast channel</p>
      <p className="text-xs text-[#9CA3AF] mb-3">
        Paste your Spotify, Apple Podcasts, website or RSS URL — or just the podcast name — and Village will find the show and its episode catalogue.
      </p>

      {error && <p className="text-xs text-red-600 mb-3">{error}</p>}

      {step === 'input' && (
        <div className="flex flex-col sm:flex-row gap-2">
          <input type="text" value={input} onChange={e => setInput(e.target.value)}
            placeholder="Podcast URL or name"
            className="flex-1 px-3 py-2 rounded-lg border border-[#E8E4DD] text-sm text-[#2D2A26] bg-white placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#C86A43]/30 focus:border-[#C86A43] transition-colors" />
          <button onClick={() => void handleFind()} disabled={!input.trim()}
            className="px-4 py-2 rounded-lg bg-[#C86A43] text-white text-sm font-semibold hover:bg-[#b05a35] disabled:opacity-50 transition-colors shrink-0">
            Find my podcast
          </button>
        </div>
      )}

      {step === 'resolving' && <p className="text-xs text-[#9CA3AF]">Looking for your podcast…</p>}
      {step === 'connecting' && <p className="text-xs text-[#9CA3AF]">Connecting and reading the episode catalogue…</p>}
      {step === 'importing' && <p className="text-xs text-[#9CA3AF]">Importing selected episodes…</p>}

      {step === 'candidates' && (
        <div>
          <div className="space-y-2 mb-3">
            {candidates.map((c, i) => (
              <div key={i} className="flex items-start gap-3 border border-[#E8E4DD] rounded-lg p-3">
                {c.artworkUrl && <img src={c.artworkUrl} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0" />}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#2D2A26] truncate">{c.title}</p>
                  {c.author && <p className="text-xs text-[#9CA3AF]">{c.author}</p>}
                  {c.description && <p className="text-xs text-[#6B7280] mt-1 line-clamp-2">{c.description}</p>}
                  <p className="text-[10px] text-[#9CA3AF] mt-1">
                    {c.episodeCount !== undefined ? `${c.episodeCount} episodes` : ''}
                    {c.latestEpisodeDate ? ` · latest ${new Date(c.latestEpisodeDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
                  </p>
                </div>
                <button onClick={() => void handleConfirm(c)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#2D2A26] text-white hover:bg-[#1a1815] transition-colors shrink-0">
                  Confirm and connect
                </button>
              </div>
            ))}
          </div>
          <button onClick={() => { setStep('manual'); setManualMessage(null) }} className="text-xs text-[#9CA3AF] hover:text-[#6B7280] transition-colors">
            None of these — enter RSS feed manually
          </button>
        </div>
      )}

      {step === 'manual' && (
        <div>
          {manualMessage && <p className="text-xs text-amber-700 mb-3">{manualMessage}</p>}
          <div className="flex flex-col sm:flex-row gap-2">
            <input type="url" value={manualFeedUrl} onChange={e => setManualFeedUrl(e.target.value)}
              placeholder="https://yourpodcast.com/feed.xml"
              className="flex-1 px-3 py-2 rounded-lg border border-[#E8E4DD] text-sm text-[#2D2A26] bg-white placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#C86A43]/30 focus:border-[#C86A43] transition-colors" />
            <button onClick={() => void handleManualConnect()} disabled={!manualFeedUrl.trim()}
              className="px-4 py-2 rounded-lg bg-[#C86A43] text-white text-sm font-semibold hover:bg-[#b05a35] disabled:opacity-50 transition-colors shrink-0">
              Connect
            </button>
          </div>
          <button onClick={reset} className="text-xs text-[#9CA3AF] hover:text-[#6B7280] transition-colors mt-2">
            Start over
          </button>
        </div>
      )}

      {step === 'episodes' && (
        <div>
          <div className="flex items-center gap-3 mb-3">
            {show?.artworkUrl && <img src={show.artworkUrl} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#2D2A26] truncate">{show?.title}</p>
              <p className="text-xs text-[#9CA3AF]">{episodes.length} episodes found — pick which ones to bring in</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 mb-3">
            <input type="text" value={episodeSearch} onChange={e => setEpisodeSearch(e.target.value)}
              placeholder="Search episodes…"
              className="flex-1 px-3 py-2 rounded-lg border border-[#E8E4DD] text-sm text-[#2D2A26] bg-white placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#C86A43]/30 focus:border-[#C86A43]" />
            <select value={sortOrder} onChange={e => setSortOrder(e.target.value as 'newest' | 'oldest')}
              className="px-3 py-2 rounded-lg border border-[#E8E4DD] text-sm text-[#2D2A26] bg-white">
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
            <button onClick={() => setSelected(new Set(filteredEpisodes.map(ep => ep.episodeGuid || ep.originalUrl)))}
              className="text-xs font-semibold px-3 py-2 rounded-lg border border-[#E8E4DD] text-[#6B7280] hover:border-[#C86A43] hover:text-[#C86A43] transition-colors shrink-0">
              Select all visible
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto space-y-1.5 mb-3">
            {filteredEpisodes.map(ep => {
              const key = ep.episodeGuid || ep.originalUrl
              const isSelected = selected.has(key)
              return (
                <label key={key} className={`flex items-start gap-3 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${isSelected ? 'border-[#C86A43] bg-[#C86A43]/5' : 'border-[#E8E4DD]'}`}>
                  <input type="checkbox" checked={isSelected} onChange={() => toggleEpisode(key)} className="mt-1 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-[#2D2A26] truncate">{ep.title}</p>
                    <p className="text-[10px] text-[#9CA3AF] mt-0.5">
                      {ep.publishedAt ? new Date(ep.publishedAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                      {ep.durationSeconds ? ` · ${Math.round(ep.durationSeconds / 60)} min` : ''}
                      {ep.episodeNumber ? ` · Ep ${ep.episodeNumber}` : ''}
                    </p>
                    {ep.description && <p className="text-[10px] text-[#6B7280] mt-1 line-clamp-1">{ep.description}</p>}
                  </div>
                </label>
              )
            })}
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => void handleImportSelected()} disabled={selected.size === 0}
              className="px-4 py-2 rounded-lg bg-[#C86A43] text-white text-sm font-semibold hover:bg-[#b05a35] disabled:opacity-50 transition-colors">
              Import {selected.size > 0 ? selected.size : ''} selected episode{selected.size === 1 ? '' : 's'}
            </button>
            <button onClick={reset} className="text-xs text-[#9CA3AF] hover:text-[#6B7280] transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {doneCount !== null && (
        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-[#5E6B4A] font-medium">
            Added {doneCount} episode{doneCount === 1 ? '' : 's'} to Imported Content — private until you review and publish.
          </p>
          <button onClick={reset} className="text-xs font-semibold text-[#C86A43] hover:underline shrink-0">
            Connect another podcast
          </button>
        </div>
      )}

      <div className="border-t border-[#E8E4DD] mt-5 pt-4">
        <EpisodeEmbedPanel founderId={founderId} onImported={onConnected} />
      </div>
    </div>
  )
}

// ─── Add a single episode (no RSS) ───────────────────────────────────────────
// The RSS-free complement to "Connect your podcast channel" above — one
// Spotify or Apple Podcasts episode link, a real embedded player, and the
// founder writes their own blog. No catalogue, no feed, just like a single
// YouTube video or website article import. Nested inside the same card
// rather than its own box, since it's the same "podcast" job, just a
// lighter-weight path.

type EpisodePanelStep = 'input' | 'resolving' | 'review'

function EpisodeEmbedPanel({ founderId, onImported }: { founderId: string; onImported: () => void }) {
  const [step, setStep] = useState<EpisodePanelStep>('input')
  const [url, setUrl] = useState('')
  const [episode, setEpisode] = useState<ResolvedEpisode | null>(null)
  const [editableTitle, setEditableTitle] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  async function handleResolve() {
    if (!url.trim()) return
    setStep('resolving')
    setError(null)
    try {
      const result = await resolveEpisode(url.trim())
      setEpisode(result)
      setEditableTitle(result.title)
      setStep('review')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not resolve this episode.')
      setStep('input')
    }
  }

  async function handleSave() {
    if (!episode) return
    const item: ImportedContent = {
      id: crypto.randomUUID(),
      founderId,
      sourcePlatform: 'podcast',
      originalUrl: url.trim(),
      embedUrl: episode.embedUrl,
      thumbnailUrl: episode.thumbnailUrl,
      title: editableTitle || episode.title,
      importedAt: new Date().toISOString(),
      status: 'draft',
      topics: [],
      locations: [],
      visibility: 'private',
    }
    const result = await importedContentService.upsert(item)
    if (!result.success) { setError(result.error ?? 'Could not save. Please try again.'); return }
    setSaved(true)
    onImported()
  }

  function reset() {
    setStep('input'); setUrl(''); setEpisode(null); setEditableTitle(''); setError(null); setSaved(false)
  }

  return (
    <div>
      <p className="text-sm font-semibold text-[#2D2A26] mb-1">Or add a single episode</p>
      <p className="text-xs text-[#9CA3AF] mb-3">
        Paste a link to one Spotify or Apple Podcasts episode — no feed needed. Village embeds the player and you write the blog.
      </p>

      {error && <p className="text-xs text-red-600 mb-3">{error}</p>}

      {step === 'input' && (
        <div className="flex flex-col sm:flex-row gap-2">
          <input type="url" value={url} onChange={e => setUrl(e.target.value)}
            placeholder="https://open.spotify.com/episode/... or https://podcasts.apple.com/.../id...?i=..."
            className="flex-1 px-3 py-2 rounded-lg border border-[#E8E4DD] text-sm text-[#2D2A26] bg-white placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#C86A43]/30 focus:border-[#C86A43] transition-colors" />
          <button onClick={() => void handleResolve()} disabled={!url.trim()}
            className="px-4 py-2 rounded-lg bg-[#C86A43] text-white text-sm font-semibold hover:bg-[#b05a35] disabled:opacity-50 transition-colors shrink-0">
            Add episode
          </button>
        </div>
      )}

      {step === 'resolving' && <p className="text-xs text-[#9CA3AF]">Looking up that episode…</p>}

      {step === 'review' && episode && !saved && (
        <div>
          <div className="relative w-full max-w-sm rounded-lg overflow-hidden bg-black mb-3" style={{ paddingTop: episode.platform === 'spotify' ? '40%' : '56.25%' }}>
            <iframe src={episode.embedUrl} title={editableTitle}
              allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
              className="absolute inset-0 w-full h-full" />
          </div>
          <label className="text-[10px] text-[#9CA3AF] uppercase tracking-wide block mb-1">Title</label>
          <input type="text" value={editableTitle} onChange={e => setEditableTitle(e.target.value)}
            className="w-full mb-3 px-3 py-2 rounded-lg border border-[#E8E4DD] text-sm text-[#2D2A26] bg-white focus:outline-none focus:ring-2 focus:ring-[#C86A43]/30 focus:border-[#C86A43]" />
          <div className="flex items-center gap-3">
            <button onClick={() => void handleSave()}
              className="px-4 py-2 bg-[#C86A43] text-white text-xs font-semibold rounded-lg hover:bg-[#b05a35] transition-colors">
              Save to Import Content
            </button>
            <button onClick={reset} className="text-xs text-[#9CA3AF] hover:text-[#6B7280] transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {saved && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-[#5E6B4A] font-medium">Added to Imported Content — private until you review and publish.</p>
          <button onClick={reset} className="text-xs font-semibold text-[#C86A43] hover:underline shrink-0">
            Add another episode
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Connect your YouTube channel ────────────────────────────────────────────

function YouTubeConnectForm({ founderId, isHighVolume, onConnected }: { founderId: string; isHighVolume: boolean; onConnected: () => void }) {
  const [value, setValue] = useState('')
  const [busy, setBusy]   = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConnect() {
    if (!value.trim()) return
    setBusy(true)
    setError(null)
    try {
      const config = { channelId: await resolveChannelId(value) }
      const source = newConnectedSource(founderId, 'youtube', value.trim(), config)
      if (isHighVolume) source.dailyLimitOverride = HIGH_VOLUME_DAILY_LIMIT
      await connectedSourcesService.upsert(source)
      await scanSource(source)
      setValue('')
      onConnected()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not connect this channel.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-[#E8E4DD] p-5 mb-4">
      <p className="text-sm font-semibold text-[#2D2A26] mb-3">Connect your YouTube channel</p>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder={SOURCE_TYPE_HINTS.youtube}
          className="flex-1 px-3 py-2 rounded-lg border border-[#E8E4DD] text-sm text-[#2D2A26] bg-white placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#C86A43]/30 focus:border-[#C86A43] transition-colors"
        />
        <button
          onClick={() => void handleConnect()}
          disabled={busy || !value.trim()}
          className="px-4 py-2 rounded-lg bg-[#C86A43] text-white text-sm font-semibold hover:bg-[#b05a35] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
        >
          {busy ? 'Connecting…' : 'Connect'}
        </button>
      </div>
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
    </div>
  )
}

// ─── Connect your website ────────────────────────────────────────────────────

function WebsiteConnectForm({ founderId, isHighVolume, onConnected }: { founderId: string; isHighVolume: boolean; onConnected: () => void }) {
  const [value, setValue] = useState('')
  const [busy, setBusy]   = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [candidates, setCandidates] = useState<WebsiteFeedCandidate[]>([])

  async function connectWithFeedUrl(feedUrl: string, label: string) {
    const source = newConnectedSource(founderId, 'website-rss', label, { feedUrl })
    if (isHighVolume) source.dailyLimitOverride = HIGH_VOLUME_DAILY_LIMIT
    await connectedSourcesService.upsert(source)
    await scanSource(source)
    setValue('')
    setCandidates([])
    onConnected()
  }

  async function handleConnect() {
    if (!value.trim()) return
    setBusy(true)
    setError(null)
    setCandidates([])
    try {
      // Try auto-discovery first (paste the site itself, not necessarily the
      // exact feed URL) — falls back cleanly to treating the input as a
      // direct feed URL when it already is one.
      const result = await resolveWebsiteFeed(value.trim())
      if (result.status === 'candidates') {
        if (result.candidates.length === 1) {
          await connectWithFeedUrl(result.candidates[0]!.feedUrl, result.candidates[0]!.title)
        } else {
          setCandidates(result.candidates)
        }
      } else {
        setError(result.message)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not connect this website.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-[#E8E4DD] p-5">
      <p className="text-sm font-semibold text-[#2D2A26] mb-1">Connect your website</p>
      <p className="text-xs text-[#9CA3AF] mb-3">Paste your blog or website URL — Village finds the feed automatically.</p>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder="Paste your website URL"
          className="flex-1 px-3 py-2 rounded-lg border border-[#E8E4DD] text-sm text-[#2D2A26] bg-white placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#C86A43]/30 focus:border-[#C86A43] transition-colors"
        />
        <button
          onClick={() => void handleConnect()}
          disabled={busy || !value.trim()}
          className="px-4 py-2 rounded-lg bg-[#C86A43] text-white text-sm font-semibold hover:bg-[#b05a35] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
        >
          {busy ? 'Connecting…' : 'Connect'}
        </button>
      </div>
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
      {candidates.length > 0 && (
        <div className="mt-3 space-y-1.5">
          <p className="text-xs text-[#9CA3AF]">Found {candidates.length} feeds on that site — which one?</p>
          {candidates.map(c => (
            <div key={c.feedUrl} className="flex items-center gap-2 border border-[#E8E4DD] rounded-lg px-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-[#2D2A26] truncate">{c.title}</p>
                <p className="text-[10px] text-[#9CA3AF] truncate">{c.feedUrl} · {c.itemCount} items</p>
              </div>
              <button onClick={() => void connectWithFeedUrl(c.feedUrl, c.title)}
                className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-[#2D2A26] text-white hover:bg-[#1a1815] transition-colors shrink-0">
                Use this
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ConnectedSourceRow({ source, isHighVolume, onChanged }: { source: ConnectedSource; isHighVolume: boolean; onChanged: () => void }) {
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  async function handleScan() {
    setBusy(true)
    setNotice(null)
    try {
      // A source connected before the allowlist was set (or before this
      // founder was added to it) won't have the override on it yet —
      // apply it here so re-scanning an already-connected channel benefits
      // too, not just brand-new connections.
      let target = source
      if (isHighVolume && source.dailyLimitOverride !== HIGH_VOLUME_DAILY_LIMIT) {
        target = { ...source, dailyLimitOverride: HIGH_VOLUME_DAILY_LIMIT }
        await connectedSourcesService.upsert(target)
      }
      const limitLabel = isHighVolume ? String(HIGH_VOLUME_DAILY_LIMIT) : '20'
      const result = await scanSource(target)
      if (result.dailyLimitReached) {
        setNotice(`You've added your videos for today — your next ${limitLabel} unlock tomorrow.`)
      } else if (result.imported === 0) {
        setNotice("You're all caught up — no new videos found.")
      } else if (result.moreAvailable) {
        setNotice(`Added ${result.imported} — your next ${limitLabel} unlock tomorrow.`)
      } else {
        setNotice(`Added ${result.imported} — you're all caught up!`)
      }
    } catch {
      // error state is persisted on the source itself and rendered below
    } finally {
      setBusy(false)
      onChanged()
    }
  }

  async function handleRemove() {
    await connectedSourcesService.delete(source.id)
    onChanged()
  }

  async function handleTogglePause() {
    await connectedSourcesService.upsert({ ...source, autoSyncPaused: !source.autoSyncPaused })
    onChanged()
  }

  const awaitingReview = source.sourceType === 'podcast-rss'
    ? importedContentService.getAll().filter(i => i.connectedSourceId === source.id && i.status === 'draft').length
    : undefined

  return (
    <div className="flex items-center gap-3 bg-white rounded-xl border border-[#E8E4DD] px-4 py-3">
      {source.podcast?.artworkUrl && (
        <img src={source.podcast.artworkUrl} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#F3EDE6] text-[#6B7280]">
            {SOURCE_TYPE_LABELS[source.sourceType]}
          </span>
          <p className="text-sm font-medium text-[#2D2A26] truncate">{source.label}</p>
          {source.autoSyncPaused && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Paused</span>
          )}
        </div>
        <p className="text-xs text-[#9CA3AF] mt-1">
          {source.status === 'error' && source.lastError
            ? <span className="text-red-600">{source.lastError}</span>
            : notice
              ? <span className="text-[#5E6B4A] font-medium">{notice}</span>
              : source.lastScannedAt
                ? `Last scanned ${new Date(source.lastScannedAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })} · ${source.discoveredCount} imported${awaitingReview ? ` · ${awaitingReview} awaiting review` : ''}`
                : 'Not scanned yet'}
        </p>
      </div>
      <button
        onClick={() => void handleScan()}
        disabled={busy}
        className="text-xs font-semibold text-[#C86A43] hover:underline disabled:opacity-50 shrink-0"
      >
        {busy ? 'Scanning…' : 'Scan now'}
      </button>
      {source.sourceType === 'podcast-rss' && (
        <button
          onClick={() => void handleTogglePause()}
          className="text-xs font-semibold text-[#9CA3AF] hover:text-[#6B7280] shrink-0"
        >
          {source.autoSyncPaused ? 'Resume' : 'Pause'}
        </button>
      )}
      <button
        onClick={() => void handleRemove()}
        className="text-xs font-semibold text-[#9CA3AF] hover:text-red-600 shrink-0"
      >
        Remove
      </button>
    </div>
  )
}

// ─── Small display components ─────────────────────────────────────────────────

function PlatformBadge({ platform }: { platform: string }) {
  return (
    <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${PLATFORM_COLORS[platform as keyof typeof PLATFORM_COLORS] ?? 'bg-[#F3EDE6] text-[#9CA3AF]'}`}>
      {PLATFORM_LABELS[platform as keyof typeof PLATFORM_LABELS] ?? platform}
    </span>
  )
}

function EmbedPreview({ content }: { content: ImportedContent }) {
  const canEmbed = EMBEDDABLE.has(content.sourcePlatform) && !!content.embedUrl
  if (canEmbed) {
    return (
      <div className="relative w-full rounded-lg overflow-hidden bg-black" style={{ paddingTop: '56.25%' }}>
        <iframe
          src={content.embedUrl}
          title={content.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      </div>
    )
  }
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#F8F5F0] border border-[#E8E4DD]">
      <PlatformBadge platform={content.sourcePlatform} />
      <span className="text-xs text-[#6B7280] truncate flex-1">{content.originalUrl}</span>
      <a href={normalizeUrl(content.originalUrl)} target="_blank" rel="noopener noreferrer"
         className="text-xs text-[#C86A43] hover:underline shrink-0">
        View ↗
      </a>
    </div>
  )
}

// ─── Village Intelligence Preview ────────────────────────────────────────────

function VillageIntelligencePreview({ draft, onAddTopic, onRemoveTopic, onAddLocation, onAddFAQ, shapeTrigger }: {
  draft: ImportedContent
  onAddTopic: (t: string) => void
  onRemoveTopic: (t: string) => void
  onAddLocation: (l: string) => void
  onAddFAQ: (question: string, answer: string) => void
  shapeTrigger: number
}) {
  const [open, setOpen] = useState(false)
  const [intel, setIntel] = useState<VillageContentIntelligence | null>(null)
  const [analysing, setAnalysing] = useState(false)
  const [answerDrafts, setAnswerDrafts] = useState<Record<string, string>>({})
  const [savedFAQs, setSavedFAQs] = useState<Set<string>>(new Set())
  const [blogQaPairs, setBlogQaPairs] = useState<BlogQaPair[]>([])
  const [customQuestion, setCustomQuestion] = useState('')
  const [customAnswer, setCustomAnswer] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  // Runs analysis immediately rather than waiting for a manual "Analyse
  // Content" click — a founder opening the edit panel should see Village
  // Intelligence already filled in, not an empty section they have to know
  // to trigger themselves.
  useEffect(() => {
    let result = villageContentIntelligenceService.getByContent('imported', draft.id)
    if (!result) {
      result = villageContentIntelligenceService.analyse(importedContentToInput(draft))
      void villageContentIntelligenceService.upsert(result)
    }
    setIntel(result)
    setOpen(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.id])

  // "Shape these as Q&As" (under the Blog field) re-analyses the founder's
  // current Blog text, auto-adds every detected topic (founder un-ticks any
  // that don't fit rather than having to hunt for and click each one), and
  // extracts real Q&A pairs straight from the Blog/transcript text itself —
  // never a topic-templated question, never a fabricated answer.
  useEffect(() => {
    if (shapeTrigger === 0) return
    const result = villageContentIntelligenceService.analyse(importedContentToInput(draft))
    void villageContentIntelligenceService.upsert(result)
    setIntel(result)
    setOpen(true)
    for (const t of [...result.primaryTopics, ...result.secondaryTopics]) onAddTopic(t)
    const combinedText = [draft.description, draft.transcriptText].filter(Boolean).join(' ')
    const pairs = extractQaFromBlog(draft.title, combinedText)
    setBlogQaPairs(pairs)
    setAnswerDrafts(prev => {
      const next = { ...prev }
      pairs.forEach(p => { if (!savedFAQs.has(p.question)) next[p.question] = p.answer })
      return next
    })
    requestAnimationFrame(() => containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shapeTrigger])

  function handleAnalyse() {
    setAnalysing(true)
    const input = importedContentToInput(draft)
    const result = villageContentIntelligenceService.analyse(input)
    void villageContentIntelligenceService.upsert(result)
    setIntel(result)
    setAnalysing(false)
    if (!open) setOpen(true)
  }

  const Chip = ({ label, color = 'bg-[#F3EDE6] text-[#6B7280]' }: { label: string; color?: string }) => (
    <span className={`text-[10px] px-2 py-0.5 rounded-full ${color}`}>{label}</span>
  )

  const Section = ({ title, items, color }: { title: string; items: string[]; color?: string }) =>
    items.length > 0 ? (
      <div className="mb-3">
        <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wide mb-1.5">{title}</p>
        <div className="flex flex-wrap gap-1.5">
          {items.map(item => <Chip key={item} label={item} color={color} />)}
        </div>
      </div>
    ) : null

  const AddableSection = ({ title, items, added, onAdd }: { title: string; items: string[]; added: string[]; onAdd: (v: string) => void }) =>
    items.length > 0 ? (
      <div className="mb-3">
        <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wide mb-1.5">{title} <span className="font-normal normal-case">— tap to add</span></p>
        <div className="flex flex-wrap gap-1.5">
          {items.map(item => {
            const isAdded = added.includes(item)
            return (
              <button key={item} type="button" onClick={() => onAdd(item)} disabled={isAdded}
                className={`text-[10px] px-2.5 py-1 rounded-full border transition-colors ${
                  isAdded
                    ? 'border-[#5E6B4A]/40 bg-[#5E6B4A]/10 text-[#5E6B4A] cursor-default'
                    : 'border-[#E8E4DD] text-[#6B7280] hover:border-[#C86A43] hover:text-[#C86A43]'
                }`}>
                {isAdded ? '✓ ' : '+ '}{item}
              </button>
            )
          })}
        </div>
      </div>
    ) : null

  // Used for topics — Shape already auto-added every detected one to
  // draft.topics, so the natural interaction here is "un-tick what doesn't
  // fit" rather than "click to add each one yourself."
  const ToggleSection = ({ title, items, added, onAdd, onRemove }: { title: string; items: string[]; added: string[]; onAdd: (v: string) => void; onRemove: (v: string) => void }) =>
    items.length > 0 ? (
      <div className="mb-3">
        <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wide mb-1.5">{title} <span className="font-normal normal-case">— tap to remove</span></p>
        <div className="flex flex-wrap gap-1.5">
          {items.map(item => {
            const isAdded = added.includes(item)
            return (
              <button key={item} type="button" onClick={() => isAdded ? onRemove(item) : onAdd(item)}
                className={`text-[10px] px-2.5 py-1 rounded-full border transition-colors ${
                  isAdded
                    ? 'border-[#5E6B4A]/40 bg-[#5E6B4A]/10 text-[#5E6B4A] hover:border-red-300 hover:text-red-500'
                    : 'border-[#E8E4DD] text-[#6B7280] hover:border-[#C86A43] hover:text-[#C86A43]'
                }`}>
                {isAdded ? '✓ ' : '+ '}{item}
              </button>
            )
          })}
        </div>
      </div>
    ) : null

  return (
    <div ref={containerRef} className="border-t border-[#E8E4DD] pt-4 mt-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOpen(o => !o)}
            className="text-xs font-semibold text-[#2D2A26] flex items-center gap-1"
          >
            <span className={`inline-block transition-transform ${open ? 'rotate-90' : ''}`}>›</span>
            Village Intelligence
            {intel && <span className="font-normal text-[#9CA3AF] ml-1">— {intel.primaryTopics.length} topics{intel.intent ? ` · ${intel.intent}` : ''}</span>}
          </button>
        </div>
        <button
          type="button"
          onClick={handleAnalyse}
          disabled={analysing}
          className="px-3 py-1.5 text-[10px] font-semibold border border-[#E8E4DD] text-[#6B7280] rounded-lg hover:border-[#C86A43] hover:text-[#C86A43] transition-colors disabled:opacity-50"
        >
          {analysing ? 'Analysing…' : intel ? 'Re-analyse' : 'Analyse Content'}
        </button>
      </div>

      {open && intel && (
        <div className="bg-[#F8F5F0] rounded-lg p-4 mt-2 space-y-1">
          {/* Intent / Stage / Tone — omitted rather than shown blank when Village
              couldn't confidently classify the content */}
          {(intel.intent || intel.contentStage || intel.emotionalTone) && (
            <div className="flex flex-wrap gap-2 mb-3">
              {intel.intent && <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-[#C86A43]/15 text-[#C86A43]">{intel.intent}</span>}
              {intel.contentStage && <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-[#2D2A26]/10 text-[#2D2A26]">{intel.contentStage}</span>}
              {intel.emotionalTone && <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-[#D6A94D]/20 text-amber-700">{intel.emotionalTone}</span>}
            </div>
          )}

          <ToggleSection title="Primary Topics" items={intel.primaryTopics} added={draft.topics} onAdd={onAddTopic} onRemove={onRemoveTopic} />
          <ToggleSection title="Related Topics" items={intel.secondaryTopics} added={draft.topics} onAdd={onAddTopic} onRemove={onRemoveTopic} />
          <AddableSection title="Locations" items={intel.locations} added={draft.locations} onAdd={onAddLocation} />
          <Section title="Industries" items={intel.industries} />
          <Section title="People" items={intel.people} />
          <Section title="Businesses" items={intel.businesses} />
          <Section title="Software" items={intel.software} />

          {intel.lessons.length > 0 && (
            <div className="mb-3">
              <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wide mb-1.5">Lessons</p>
              <ul className="space-y-1">
                {intel.lessons.slice(0, 3).map((l, i) => (
                  <li key={i} className="text-[10px] text-[#6B7280] leading-relaxed pl-2 border-l border-[#E8E4DD]">{l}</li>
                ))}
              </ul>
            </div>
          )}

          {intel.problems.length > 0 && (
            <div className="mb-3">
              <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wide mb-1.5">Problems</p>
              <ul className="space-y-1">
                {intel.problems.slice(0, 2).map((p, i) => (
                  <li key={i} className="text-[10px] text-[#6B7280] leading-relaxed pl-2 border-l border-[#E8E4DD]">{p}</li>
                ))}
              </ul>
            </div>
          )}

          {intel.solutions.length > 0 && (
            <div className="mb-3">
              <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wide mb-1.5">Solutions</p>
              <ul className="space-y-1">
                {intel.solutions.slice(0, 2).map((s, i) => (
                  <li key={i} className="text-[10px] text-[#6B7280] leading-relaxed pl-2 border-l border-[#E8E4DD]">{s}</li>
                ))}
              </ul>
            </div>
          )}

          {blogQaPairs.length > 0 && (
            <div className="mb-3">
              <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wide mb-1.5">
                Questions this content answers
              </p>
              <p className="text-[10px] text-[#9CA3AF] mb-2 leading-relaxed">
                Pulled straight from what you wrote in the Blog — edit the answer if you like, then save. Only saved FAQs become public, and only once this story is published.
              </p>
              <ul className="space-y-2">
                {blogQaPairs.map((pair, i) => {
                  const isSaved = savedFAQs.has(pair.question)
                  return (
                    <li key={i} className="border border-[#E8E4DD] rounded-lg p-2.5 bg-white">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[11px] font-medium text-[#2D2A26] flex-1">{pair.question}</span>
                        {isSaved && (
                          <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full border shrink-0 border-[#5E6B4A]/40 bg-[#5E6B4A]/10 text-[#5E6B4A]">
                            ✓ Saved
                          </span>
                        )}
                      </div>
                      {!isSaved && (
                        <div className="flex flex-col gap-1.5">
                          <textarea rows={2}
                            value={answerDrafts[pair.question] ?? pair.answer}
                            onChange={e => setAnswerDrafts(prev => ({ ...prev, [pair.question]: e.target.value }))}
                            placeholder="Write the answer…"
                            className="w-full px-2 py-1.5 text-[11px] border border-[#E8E4DD] rounded-md resize-none focus:outline-none focus:border-[#C86A43]" />
                          <button type="button"
                            disabled={!(answerDrafts[pair.question] ?? pair.answer).trim()}
                            onClick={() => { onAddFAQ(pair.question, (answerDrafts[pair.question] ?? pair.answer).trim()); setSavedFAQs(prev => new Set(prev).add(pair.question)) }}
                            className="self-end text-[9px] font-semibold px-2.5 py-1 rounded-md bg-[#2D2A26] text-white disabled:opacity-40">
                            Save FAQ
                          </button>
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>

              {/* Manual addition — for a question the founder wants to answer that
                  Shape didn't pick up, written entirely in their own words. */}
              <div className="border border-dashed border-[#E8E4DD] rounded-lg p-2.5 mt-2">
                <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wide mb-1.5">Add your own</p>
                <input type="text" value={customQuestion} onChange={e => setCustomQuestion(e.target.value)}
                  placeholder="A question you want to answer…"
                  className="w-full mb-1.5 px-2 py-1.5 text-[11px] border border-[#E8E4DD] rounded-md focus:outline-none focus:border-[#C86A43]" />
                <textarea rows={2} value={customAnswer} onChange={e => setCustomAnswer(e.target.value)}
                  placeholder="Your answer…"
                  className="w-full mb-1.5 px-2 py-1.5 text-[11px] border border-[#E8E4DD] rounded-md resize-none focus:outline-none focus:border-[#C86A43]" />
                <button type="button"
                  disabled={!customQuestion.trim() || !customAnswer.trim()}
                  onClick={() => {
                    onAddFAQ(customQuestion.trim(), customAnswer.trim())
                    setBlogQaPairs(prev => [...prev, { question: customQuestion.trim(), answer: customAnswer.trim() }])
                    setSavedFAQs(prev => new Set(prev).add(customQuestion.trim()))
                    setCustomQuestion(''); setCustomAnswer('')
                  }}
                  className="text-[9px] font-semibold px-2.5 py-1 rounded-md bg-[#2D2A26] text-white disabled:opacity-40">
                  Add FAQ
                </button>
              </div>
            </div>
          )}

          {intel.relatedContentIds.length > 0 && (
            <p className="text-[10px] text-[#9CA3AF]">
              {intel.relatedContentIds.length} related piece{intel.relatedContentIds.length !== 1 ? 's' : ''} found in Village
            </p>
          )}

          <p className="text-[9px] text-[#C4BDB4] pt-1">
            Analysed {new Date(intel.generatedAt).toLocaleDateString('en-AU')} · Engine v{intel.engineVersion}
          </p>
        </div>
      )}

      {open && !intel && (
        <p className="text-xs text-[#9CA3AF] mt-2 px-1">Click "Analyse Content" to generate intelligence for this item.</p>
      )}
    </div>
  )
}

// ─── EditForm ─────────────────────────────────────────────────────────────────

interface EditFormProps {
  draft: ImportedContent
  onChange: (updated: ImportedContent) => void
  onSave: () => void
  onCancel: () => void
}

function EditForm({ draft, onChange, onSave, onCancel }: EditFormProps) {
  const businesses = getBusinesses()
  const activePartners = partnerService.getAll({ status: 'active' })
  const [transcriptFlash, setTranscriptFlash] = useState(false)
  const [shapeTrigger, setShapeTrigger] = useState(0)

  function field<K extends keyof ImportedContent>(key: K, value: ImportedContent[K]) {
    onChange({ ...draft, [key]: value })
  }

  // A blank Blog box — or one that's just the platform's own raw, often
  // unfinished description (cut off mid-sentence with "...") — is a missed
  // SEO/GEO opportunity, so it's enhanced once with real supporting context
  // (rule-based, no API cost) instead of requiring a click. Runs once per
  // item (guarded by diaryGeneratedAt) so it never clobbers what a founder
  // writes afterwards.
  useEffect(() => {
    if (!draft.diaryGeneratedAt) {
      const result = enrichImportedContent(draft)
      const bullets = result.keyMoments.length > 0
        ? `\n\nKey moments:\n${result.keyMoments.map(m => `- ${m}`).join('\n')}`
        : ''
      onChange({ ...draft, description: `${result.diaryNote}${bullets}`, diaryGeneratedAt: new Date().toISOString() })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.id])

  function parseList(raw: string): string[] {
    return raw.split(',').map(s => s.trim()).filter(Boolean)
  }

  function handleSaveTranscript() {
    const updated: ImportedContent = {
      ...draft,
      transcriptStatus:     'manual',
      transcriptSource:     'manual',
      transcriptImportedAt: new Date().toISOString(),
    }
    onChange(updated)
    // Re-analyse immediately with the transcript included — the knowledge graph
    // shouldn't wait for a full form save to pick up what's likely the richest
    // text this item will ever have.
    const intel = villageContentIntelligenceService.analyse(importedContentToInput(updated))
    void villageContentIntelligenceService.upsert(intel)
    setTranscriptFlash(true)
    setTimeout(() => setTranscriptFlash(false), 2000)
  }

  function handleClearTranscript() {
    onChange({
      ...draft,
      transcriptText:        undefined,
      transcriptStatus:      'none',
      transcriptSource:      undefined,
      transcriptImportedAt:  undefined,
    })
  }

  function addTopic(t: string) {
    if (!draft.topics.includes(t)) onChange({ ...draft, topics: [...draft.topics, t] })
  }

  function removeTopic(t: string) {
    onChange({ ...draft, topics: draft.topics.filter(existing => existing !== t) })
  }

  function addLocation(l: string) {
    if (!draft.locations.includes(l)) onChange({ ...draft, locations: [...draft.locations, l] })
  }

  function addFAQ(question: string, answer: string) {
    const founder = getFounder(draft.founderId)
    if (!founder) return
    const faq: FAQ = { id: crypto.randomUUID(), question, answer, topicIds: [], expertiseIds: [], relatedStoryIds: [], relatedIdeaIds: [] }
    void updateFounder({ ...founder, faqs: [...(founder.faqs ?? []), faq] })
  }

  const INPUT = 'w-full px-3 py-2 text-sm border border-[#E8E4DD] rounded-lg focus:outline-none focus:border-[#C86A43]'
  const TEXTAREA = `${INPUT} resize-none`
  const SELECT = `${INPUT} bg-white`

  return (
    <div className="bg-white rounded-xl border border-[#E8E4DD] p-5">

      {/* Platform + URL */}
      <div className="flex items-center gap-2 mb-5">
        <PlatformBadge platform={draft.sourcePlatform} />
        <span className="text-xs text-[#9CA3AF] truncate">{draft.originalUrl}</span>
      </div>

      {/* Embed preview */}
      <div className="mb-5">
        <EmbedPreview content={draft} />
      </div>

      {/* Title */}
      <div className="mb-4">
        <label className="block text-xs font-semibold text-[#2D2A26] mb-1">Title</label>
        <input type="text" value={draft.title}
          onChange={e => field('title', e.target.value)}
          className={INPUT} placeholder="Title for this imported piece" />
      </div>

      {/* Blog */}
      <div className="mb-4">
        <label className="block text-xs font-semibold text-[#2D2A26] mb-1">Blog</label>
        <textarea value={draft.description ?? ''}
          onChange={e => field('description', e.target.value || undefined)}
          rows={6} className={TEXTAREA} placeholder="Tell us about your experience with this — what happened, what you learned, why it's worth sharing." />
        {(draft.description ?? '').trim().length > 0 && (
          <button type="button" onClick={() => setShapeTrigger(t => t + 1)}
            className="mt-2 px-4 py-2 text-sm font-semibold text-white bg-[#C86A43] rounded-lg hover:bg-[#B15C38] transition-colors">
            Shape these as Q&A to boost your online presence
          </button>
        )}
      </div>

      {/* Thumbnail */}
      <div className="mb-4">
        <label className="block text-xs font-semibold text-[#2D2A26] mb-1">Thumbnail</label>
        <MediaUpload
          value={draft.thumbnailUrl}
          onChange={v => field('thumbnailUrl', v || undefined)}
          label="Upload thumbnail"
          aspect="wide"
          uploadOptions={{ founderId: draft.founderId, businessId: draft.businessId }}
        />
        <p className="text-[10px] text-[#9CA3AF] mt-1.5 mb-1">Or use the thumbnail from the original source:</p>
        <input type="url" value={draft.thumbnailUrl ?? ''}
          onChange={e => field('thumbnailUrl', e.target.value || undefined)}
          className={INPUT} placeholder="https://..." />
      </div>

      {/* Business + Published At */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-xs font-semibold text-[#2D2A26] mb-1">Related Business</label>
          <select value={draft.businessId ?? ''}
            onChange={e => field('businessId', e.target.value || undefined)}
            className={SELECT}>
            <option value="">None</option>
            {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#2D2A26] mb-1">Original Publish Date</label>
          <input type="date" value={draft.publishedAt ? draft.publishedAt.slice(0, 10) : ''}
            onChange={e => field('publishedAt', e.target.value || undefined)}
            className={INPUT} />
        </div>
      </div>

      {/* ── Affiliate / Partner link ───────────────────────────────────────── */}
      <div className="border-t border-[#E8E4DD] pt-4 mt-1 mb-4">
        <p className="text-sm font-semibold text-[#2D2A26] mb-1">Affiliate Link</p>
        <p className="text-xs text-[#9CA3AF] mb-3 leading-relaxed">
          Attach a partner from your Partnership Program to turn this into a tracked affiliate story, or set a custom link.
        </p>
        <div className="mb-3">
          <label className="block text-xs font-semibold text-[#2D2A26] mb-1">Partner</label>
          <select value={draft.partnerId ?? ''}
            onChange={e => {
              const partnerId = e.target.value || undefined
              if (!partnerId) { onChange({ ...draft, partnerId: undefined }); return }
              const partner = partnerService.get(partnerId)
              onChange({
                ...draft,
                partnerId,
                ctaLabel: draft.ctaLabel || (partner ? `Visit ${partner.name}` : draft.ctaLabel),
                ctaUrl: partner?.affiliateUrl || partner?.website || draft.ctaUrl,
              })
            }}
            className={SELECT}>
            <option value="">None — custom link</option>
            {activePartners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          {activePartners.length === 0 && (
            <p className="text-[10px] text-[#9CA3AF] mt-1">No active partners yet — add one in the Partnership Program tab.</p>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#2D2A26] mb-1">Link Label</label>
            <input type="text" value={draft.ctaLabel ?? ''}
              onChange={e => field('ctaLabel', e.target.value || undefined)}
              className={INPUT} placeholder="e.g. Visit Partner Co" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#2D2A26] mb-1">Link URL</label>
            <input type="url" value={draft.ctaUrl ?? ''}
              onChange={e => field('ctaUrl', e.target.value || undefined)}
              className={INPUT} placeholder="https://..." />
          </div>
        </div>
      </div>

      {/* ── Transcript section ─────────────────────────────────────────────── */}
      <div className="border-t border-[#E8E4DD] pt-5 mt-1 mb-1">
        <p className="text-sm font-semibold text-[#2D2A26] mb-1">Transcript</p>
        <p className="text-xs text-[#9CA3AF] mb-4 leading-relaxed">
          Paste a transcript to unlock richer diary generation. On YouTube, click ··· below any video → <em>Show transcript</em> → copy and paste here.
        </p>

        {/* Status selector */}
        <div className="mb-3">
          <label className="block text-xs font-semibold text-[#2D2A26] mb-1">Transcript Status</label>
          <select
            value={draft.transcriptStatus ?? 'none'}
            onChange={e => onChange({ ...draft, transcriptStatus: e.target.value as ImportedContent['transcriptStatus'] })}
            className={SELECT}
          >
            {TRANSCRIPT_STATUS_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Transcript textarea — shown when status is manual */}
        {(draft.transcriptStatus === 'manual' || draft.transcriptStatus === 'available' || draft.transcriptStatus === 'generated') && (
          <div className="mb-3">
            <textarea
              value={draft.transcriptText ?? ''}
              onChange={e => onChange({ ...draft, transcriptText: e.target.value || undefined })}
              rows={9}
              className={`${TEXTAREA} font-mono text-xs`}
              placeholder="Paste transcript text here..."
            />
            {draft.transcriptText && (
              <p className="text-[10px] text-[#9CA3AF] mt-1">
                {draft.transcriptText.trim().split(/\s+/).length.toLocaleString()} words
              </p>
            )}
          </div>
        )}

        {/* Transcript actions */}
        <div className="flex items-center gap-3">
          {draft.transcriptStatus !== 'unavailable' && (
            <button
              type="button"
              onClick={handleSaveTranscript}
              className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                transcriptFlash
                  ? 'border-[#5E6B4A]/40 bg-[#5E6B4A]/10 text-[#5E6B4A]'
                  : 'border-[#E8E4DD] text-[#6B7280] hover:border-[#C86A43] hover:text-[#C86A43]'
              }`}
            >
              {transcriptFlash ? '✓ Transcript saved' : 'Save Transcript'}
            </button>
          )}
          {draft.transcriptText && (
            <button type="button" onClick={handleClearTranscript}
              className="text-xs text-[#9CA3AF] hover:text-red-500 transition-colors">
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Village Intelligence Preview ───────────────────────────────────── */}
      {shapeTrigger > 0 && (
        <VillageIntelligencePreview key={draft.transcriptImportedAt ?? 'no-transcript'} draft={draft} onAddTopic={addTopic} onRemoveTopic={removeTopic} onAddLocation={addLocation} onAddFAQ={addFAQ} shapeTrigger={shapeTrigger} />
      )}

      {/* ── Publishing fields ──────────────────────────────────────────────── */}
      <div className="border-t border-[#E8E4DD] pt-5 mt-4">

        {/* Topics + Locations */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-semibold text-[#2D2A26] mb-1">
              Topics <span className="font-normal text-[#9CA3AF]">comma-separated</span>
            </label>
            <input type="text" value={draft.topics.join(', ')}
              onChange={e => field('topics', parseList(e.target.value))}
              className={INPUT} placeholder="e.g. marketing, content, strategy" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#2D2A26] mb-1">
              Locations <span className="font-normal text-[#9CA3AF]">comma-separated</span>
            </label>
            <input type="text" value={draft.locations.join(', ')}
              onChange={e => field('locations', parseList(e.target.value))}
              className={INPUT} placeholder="e.g. Sydney, Melbourne" />
          </div>
        </div>

        {/* Status + Visibility */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-xs font-semibold text-[#2D2A26] mb-1">Status</label>
            <select value={draft.status}
              onChange={e => field('status', e.target.value as ImportedContentStatus)}
              className={SELECT}>
              {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#2D2A26] mb-1">Visibility</label>
            <select value={draft.visibility}
              onChange={e => field('visibility', e.target.value as ImportedContentVisibility)}
              className={SELECT}>
              {VISIBILITY_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label} — {o.note}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Save / Cancel */}
        <div className="flex items-center gap-3">
          <button onClick={onSave}
            className="px-5 py-2.5 bg-[#C86A43] text-white text-sm font-semibold rounded-lg hover:bg-[#b05a35] transition-colors">
            Save Changes
          </button>
          <button onClick={onCancel}
            className="px-4 py-2.5 text-sm text-[#6B7280] hover:text-[#2D2A26] transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Saved content row ────────────────────────────────────────────────────────

// An item is ready to quick-publish once it's no longer just the auto-generated
// placeholder — i.e. a founder (or a connector's auto-analysis) has actually
// given it real content, not "we don't know anything about this yet."
function isReadyToPublish(item: ImportedContent): boolean {
  return item.title.trim().length > 0 && item.title !== `Imported from ${PLATFORM_LABELS[item.sourcePlatform]}`
}

function SavedRow({
  item,
  checked,
  onToggleCheck,
  onAdvancedEdit,
  onDelete,
  onStatusChange,
}: {
  item: ImportedContent
  checked: boolean
  onToggleCheck: () => void
  onAdvancedEdit: () => void
  onDelete: () => void
  onStatusChange: (status: ImportedContentStatus) => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const ready = isReadyToPublish(item)
  const publishedStory = item.relatedStoryId ? getStory(item.relatedStoryId) : undefined

  const statusColors: Record<ImportedContentStatus, string> = {
    draft:     'bg-[#F3EDE6] text-[#9CA3AF]',
    published: 'bg-[#5E6B4A]/10 text-[#5E6B4A]',
    featured:  'bg-[#D6A94D]/20 text-amber-700',
    archived:  'bg-[#F3EDE6] text-[#6B7280]',
  }

  return (
    <div className="flex items-start gap-4 px-5 py-4">
      {!item.relatedStoryId && (
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggleCheck}
          disabled={!ready}
          className="shrink-0 w-4 h-4 mt-1.5 accent-[#C86A43] disabled:opacity-30"
          aria-label={ready ? `Select "${item.title}" to publish` : 'Not ready to publish yet'}
        />
      )}
      <a
        href={normalizeUrl(item.originalUrl)}
        target="_blank"
        rel="noopener noreferrer"
        title="Open original"
        className="shrink-0 w-14 h-14 rounded-lg overflow-hidden bg-[#F3EDE6] flex items-center justify-center hover:opacity-80 transition-opacity"
      >
        {item.thumbnailUrl ? (
          <img src={item.thumbnailUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <span className="text-[#C4BDB4]">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M4 6h16M4 6a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V8a2 2 0 00-2-2H4z" />
            </svg>
          </span>
        )}
      </a>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <PlatformBadge platform={item.sourcePlatform} />
          <a href={normalizeUrl(item.originalUrl)} target="_blank" rel="noopener noreferrer"
            className="text-sm font-semibold text-[#2D2A26] truncate hover:text-[#C86A43] transition-colors">
            {item.title}
          </a>
          {!item.relatedStoryId && !ready && (
            <span className="text-[10px] text-amber-600 shrink-0">needs a title before it can publish</span>
          )}
        </div>

        <p className="text-xs text-[#6B7280] mt-0.5 line-clamp-2 max-w-xl">
          {item.description || <span className="text-[#C4BDB4] italic">No description yet.</span>}
        </p>
      </div>
      <select
        value={item.status}
        onChange={e => onStatusChange(e.target.value as ImportedContentStatus)}
        className={`text-[10px] font-semibold px-2 py-1 rounded-full border-0 focus:outline-none cursor-pointer shrink-0 ${statusColors[item.status]}`}
      >
        {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <div className="flex items-center gap-2 shrink-0 pt-0.5">
        {item.relatedStoryId && (
          publishedStory ? (
            <Link to={`/stories/${publishedStory.slug}`} className="text-xs text-[#5E6B4A] font-medium hover:underline">
              ✓ View published story →
            </Link>
          ) : (
            <span className="text-xs text-[#5E6B4A] font-medium">✓ Story published</span>
          )
        )}
        <button onClick={onAdvancedEdit} className="text-xs text-[#9CA3AF] hover:text-[#C86A43] transition-colors">
          Edit your story
        </button>
        {confirmDelete ? (
          <>
            <button onClick={onDelete} className="text-xs text-red-600 font-semibold">Confirm</button>
            <button onClick={() => setConfirmDelete(false)} className="text-xs text-[#9CA3AF]">Cancel</button>
          </>
        ) : (
          <button onClick={() => setConfirmDelete(true)}
            className="text-xs text-[#9CA3AF] hover:text-red-500 transition-colors">
            Delete
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function DashboardImportContentPage() {
  const { user } = useAuth()
  const founderId = getCurrentFounderId(user) ?? 'dev-user'
  const isHighVolume = HIGH_VOLUME_IMPORT_EMAILS.includes(user?.email?.trim().toLowerCase() ?? '')

  const [draft, setDraft]       = useState<ImportedContent | null>(null)
  const [allItems, setAllItems] = useState<ImportedContent[]>([])
  const [sources, setSources]   = useState<ConnectedSource[]>([])
  const [saveError, setSaveError] = useState<string | null>(null)
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [bulkPublishing, setBulkPublishing] = useState(false)
  const [bulkResult, setBulkResult] = useState<{ published: { title: string; slug: string }[]; failed: { title: string; error: string }[] } | null>(null)
  const [activeTab, setActiveTab] = useState<ImportedContentPlatform>('youtube')

  function switchTab(tab: ImportedContentPlatform) {
    setActiveTab(tab)
    setChecked(new Set())
  }

  function loadItems() {
    setAllItems(
      importedContentService.getByFounderId(founderId)
        .sort((a, b) => b.importedAt.localeCompare(a.importedAt))
    )
  }

  function loadSources() {
    setSources(connectedSourcesService.getAll({ founderId }))
  }

  useEffect(() => { loadItems(); loadSources() }, [founderId])

  async function handleSave() {
    if (!draft) return
    setSaveError(null)
    const result = await importedContentService.upsert(draft)
    if (!result.success) {
      setSaveError(result.error ?? 'Save failed. Please try again.')
      return
    }
    // Village should do the work first — analyse on every save, not just once
    // published, so the review screen always has fresh suggestions to show.
    const input = importedContentToInput(draft)
    const intel = villageContentIntelligenceService.analyse(input)
    void villageContentIntelligenceService.upsert(intel)
    // Already published from this import? Push the edit through to the live
    // story too — otherwise "Edit your story" silently only touches the
    // import record and the founder's edit never actually shows up.
    if (draft.relatedStoryId) await syncImportEditsToStory(draft)
    setDraft(null)
    loadItems()
  }

  function handleCancel() { setDraft(null) }

  function handleAdvancedEdit(item: ImportedContent) {
    setDraft(item)
  }

  function handleDelete(id: string) {
    importedContentService.delete(id)
    loadItems()
  }

  // Only clears the import record for the currently-viewed platform tab —
  // never touches a Story that was already published from one of these
  // (importedContentService.delete only removes the import, not the Story).
  function handleDeleteAll() {
    for (const item of visibleItems) importedContentService.delete(item.id)
    setChecked(new Set())
    loadItems()
  }

  function handleStatusChange(id: string, status: ImportedContentStatus) {
    importedContentService.updateStatus(id, status)
    loadItems()
  }

  function toggleChecked(id: string) {
    setChecked(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  // Base tabs always show (they're the three connector types founders can
  // actually create today); any platform an older/legacy item still carries
  // gets its own tab too, so nothing already imported becomes unreachable.
  const tabs = [
    ...PLATFORM_TAB_ORDER,
    ...Array.from(new Set(allItems.map(i => i.sourcePlatform))).filter(p => !PLATFORM_TAB_ORDER.includes(p)),
  ]
  const visibleItems = allItems.filter(i => i.sourcePlatform === activeTab)
  const readyItems = visibleItems.filter(i => !i.relatedStoryId && isReadyToPublish(i))

  function toggleSelectAllReady() {
    setChecked(prev => prev.size === readyItems.length ? new Set() : new Set(readyItems.map(i => i.id)))
  }

  // Publishes every checked, reviewed import directly — no wizard. Each item's
  // format/fields are derived entirely from its source platform (buildStoryFromImport),
  // since the founder already told Village what this is by importing it.
  async function handleBulkPublish() {
    const founder = getFounder(founderId)
    if (!founder) return
    setBulkPublishing(true)
    setBulkResult(null)

    const targets = readyItems.filter(i => checked.has(i.id))
    const published: { title: string; slug: string }[] = []
    const failed: { title: string; error: string }[] = []

    for (const item of targets) {
      const story = buildStoryFromImport(item, founder)
      const result = await publishStoryCore(story)
      if (result.success && result.story) {
        published.push({ title: result.story.title, slug: result.story.slug })
      } else {
        failed.push({ title: item.title, error: result.error ?? 'Could not publish.' })
      }
    }

    setBulkResult({ published, failed })
    setChecked(new Set())
    setBulkPublishing(false)
    loadItems()
  }

  return (
    <div className="p-8 max-w-3xl" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#2D2A26]">Import Content</h1>
        <p className="text-sm text-[#6B7280] mt-1">
          Bring your old YouTube videos, LinkedIn articles, podcasts and more into the Village — so they can become searchable, connected and discoverable again.
        </p>
      </div>

      {/* Ethics notice */}
      <div className="mb-6 px-4 py-3 rounded-lg bg-[#5E6B4A]/10 border border-[#5E6B4A]/20 text-xs text-[#5E6B4A] leading-relaxed">
        CULO Village embeds content from its original platform and always links back to the source. Your content is not downloaded or re-uploaded. Authorship and platform attribution are preserved.
      </div>

      {/* Connect a channel or feed */}
      {!draft && (
        <div className="mb-8">
          <p className="text-sm text-[#6B7280] mb-4">
            Connect a channel or feed so Village can pull in your own already-public content automatically.
          </p>

          <CanvaImportPanel founderId={founderId} onImported={loadItems} />

          <PodcastConnectPanel founderId={founderId} isHighVolume={isHighVolume} onConnected={() => { loadSources(); loadItems() }} />

          <YouTubeConnectForm founderId={founderId} isHighVolume={isHighVolume} onConnected={() => { loadSources(); loadItems() }} />

          <WebsiteConnectForm founderId={founderId} isHighVolume={isHighVolume} onConnected={() => { loadSources(); loadItems() }} />

          {sources.length > 0 && (
            <div className="flex flex-col gap-2 mt-3">
              {sources.map(source => (
                <ConnectedSourceRow
                  key={source.id}
                  source={source}
                  isHighVolume={isHighVolume}
                  onChanged={() => { loadSources(); loadItems() }}
                />
              ))}
            </div>
          )}

          {saveError && <p className="text-xs text-red-600 font-medium mt-3">{saveError}</p>}

          <p className="text-xs text-[#9CA3AF] mt-3">
            Instagram, LinkedIn, TikTok and Canva connections aren't available yet — they each require going through that platform's own app review process.
          </p>
        </div>
      )}

      {/* Advanced edit — a right-side slide-over rather than an inline block, so
          opening it from row 300 of a long list doesn't yank the founder back
          to the top of the page to find it. */}
      {draft && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={handleCancel}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[520px] bg-[#F8F5F0] shadow-2xl overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-[#2D2A26]">Advanced edit</p>
                <button
                  onClick={handleCancel}
                  aria-label="Close"
                  className="text-[#9CA3AF] hover:text-[#2D2A26] transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {saveError && (
                <p className="text-sm text-red-600 font-medium mb-2">{saveError}</p>
              )}
              <EditForm
                draft={draft}
                onChange={setDraft}
                onSave={() => void handleSave()}
                onCancel={handleCancel}
              />
            </div>
          </div>
        </>
      )}

      {/* Bulk publish result */}
      {bulkResult && (
        <div className="mb-6 bg-white rounded-xl border border-[#E8E4DD] p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-[#2D2A26]">
              {bulkResult.published.length} {bulkResult.published.length === 1 ? 'story' : 'stories'} published
            </p>
            <button onClick={() => setBulkResult(null)} className="text-xs text-[#9CA3AF] hover:text-[#2D2A26]">
              Dismiss
            </button>
          </div>
          {bulkResult.published.length > 0 && (
            <ul className="flex flex-col gap-1.5 mb-3">
              {bulkResult.published.map(p => (
                <li key={p.slug}>
                  <Link to={`/stories/${p.slug}`} className="text-xs text-[#C86A43] font-medium hover:underline">
                    {p.title} →
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {bulkResult.failed.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-red-600 mb-1">{bulkResult.failed.length} couldn't publish</p>
              <ul className="flex flex-col gap-1">
                {bulkResult.failed.map((f, i) => (
                  <li key={i} className="text-xs text-red-500">{f.title} — {f.error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Saved imports list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-[#2D2A26]">Imported Content</p>
          {visibleItems.length > 0 && (
            <ConfirmButton
              label={`Delete all ${visibleItems.length}`}
              confirmLabel="Yes, delete all"
              message={`Delete all ${visibleItems.length} ${PLATFORM_LABELS[activeTab]} imports? This can't be undone.`}
              onConfirm={handleDeleteAll}
              className="text-xs text-[#9CA3AF] hover:text-red-500 transition-colors"
            />
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {tabs.map(platform => {
            const count = allItems.filter(i => i.sourcePlatform === platform).length
            const active = activeTab === platform
            return (
              <button
                key={platform}
                onClick={() => switchTab(platform)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                  active
                    ? 'bg-[#C86A43] text-white border-[#C86A43]'
                    : 'bg-white text-[#6B7280] border-[#E8E4DD] hover:border-[#C86A43]/50'
                }`}
              >
                {PLATFORM_LABELS[platform]}
                {count > 0 && <span className={active ? 'text-white/70' : 'text-[#9CA3AF]'}> {count}</span>}
              </button>
            )
          })}
        </div>

        {readyItems.length > 0 && (
          <div className="flex items-center justify-between gap-3 mb-3 px-4 py-2.5 bg-[#FBF1EB] border border-[#F0DDD2] rounded-lg">
            <label className="flex items-center gap-2 text-xs font-medium text-[#2D2A26] cursor-pointer">
              <input
                type="checkbox"
                checked={checked.size > 0 && checked.size === readyItems.length}
                onChange={toggleSelectAllReady}
                className="w-4 h-4 accent-[#C86A43]"
              />
              Select all ready to publish ({readyItems.length})
            </label>
            <button
              onClick={() => void handleBulkPublish()}
              disabled={checked.size === 0 || bulkPublishing}
              className="px-4 py-2 bg-[#C86A43] text-white text-xs font-semibold rounded-lg hover:bg-[#b05a35] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
            >
              {bulkPublishing ? 'Publishing…' : `Publish ${checked.size || ''} selected`}
            </button>
          </div>
        )}

        {visibleItems.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#E8E4DD] px-5 py-10 text-center">
            <p className="text-sm font-semibold text-[#2D2A26] mb-2">No {PLATFORM_LABELS[activeTab]} imports yet</p>
            <p className="text-xs text-[#9CA3AF] leading-relaxed max-w-sm mx-auto">
              Bring your old content into the Village so it can become searchable, connected and discoverable again.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-[#E8E4DD] divide-y divide-[#F3EDE6]">
            {visibleItems.map(item => (
              <SavedRow
                key={item.id}
                item={item}
                checked={checked.has(item.id)}
                onToggleCheck={() => toggleChecked(item.id)}
                onAdvancedEdit={() => handleAdvancedEdit(item)}
                onDelete={() => handleDelete(item.id)}
                onStatusChange={status => handleStatusChange(item.id, status)}
              />
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
