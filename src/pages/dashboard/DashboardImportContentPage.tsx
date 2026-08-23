import { useState, useEffect, useRef } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { CanvaImportCard } from '../../components/dashboard/CanvaImportCard'
import { InstagramArchiveImportCard } from '../../components/dashboard/InstagramArchiveImportCard'
import { VoiceBriefEditor } from '../../components/dashboard/VoiceBriefEditor'
import { InsightBriefEditor } from '../../components/dashboard/InsightBriefEditor'
import { SourceIcon } from '../../components/ui/SourceIcon'
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
import { syncImportEditsToStory } from '../../services/publishStory'
import { enrichImportedContent, extractQaFromBlog, type BlogQaPair } from '../../services/importedContentEnrichment'
import { normalizeUrl } from '../../utils/url'
import { CreateWithCuloCTA } from '../../components/ui/CreateWithCuloCTA'
import { deriveSeoTitle, deriveSeoDescription } from '../../utils/seo'
import { MediaUpload, inferKindFromUrl } from '../../components/ui/MediaUpload'
import {
  villageContentIntelligenceService,
  importedContentToInput,
} from '../../services/villageIntelligence'
import { connectedSourcesService, newConnectedSource, scanSource } from '../../services/connectedSources'
import { resolveChannelId } from '../../services/connectors/youtube'
import { resolveEpisode, type ResolvedEpisode } from '../../services/episodeResolve'
import { resolveWebsiteFeed, type WebsiteFeedCandidate } from '../../services/websiteResolve'
import type {
  ImportedContent,
  ImportedContentStatus,
} from '../../types/importedContent'
import type { ConnectedSource, ConnectedSourceType } from '../../types/connectedSource'
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

// AI rewriting via the founder's Voice & Brand Brief costs real API spend
// per call — allowlisted for now rather than open to every founder on the
// free tier, same pattern as HIGH_VOLUME_IMPORT_EMAILS above. Temporary
// switch, not a real plan/billing system — the intent is for this to
// become a paid CULO Publish tier feature. Everyone else's Instagram
// import still works exactly as before: original captions kept as-is.
const VOICE_REWRITE_EMAILS = (import.meta.env.VITE_VOICE_REWRITE_EMAILS ?? '')
  .split(',')
  .map((e: string) => e.trim().toLowerCase())
  .filter(Boolean)

// ─── Constants ────────────────────────────────────────────────────────────────

// 'podcast' embeds only when embedUrl is actually set — true for a
// single-episode import (Spotify/Apple embed player) but not for an
// RSS-connector-discovered episode, which never has one.
const EMBEDDABLE = new Set(['youtube', 'vimeo', 'tiktok', 'podcast'])

export const STATUS_OPTIONS: { value: ImportedContentStatus; label: string }[] = [
  { value: 'draft',     label: 'Draft'     },
  { value: 'published', label: 'Published' },
  { value: 'archived',  label: 'Archived'  },
]

const TRANSCRIPT_STATUS_OPTIONS = [
  { value: 'none',   label: 'No transcript'     },
  { value: 'manual', label: 'Pasted manually'   },
]

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

// ─── Connect a podcast ────────────────────────────────────────────────────────
// Single-episode only (see EpisodeEmbedPanel below) — the whole-feed
// resolve-by-URL-or-name flow never reliably found a real feed, so it's
// gone rather than left as a broken "Find my podcast" button.

function PodcastConnectPanel({ founderId, isHighVolume, sources, onConnected }: { founderId: string; isHighVolume: boolean; sources: ConnectedSource[]; onConnected: () => void }) {
  return (
    <div className="bg-white rounded-2xl border-2 border-[#E8E4DD] p-6">
      <div className="flex items-center gap-4 mb-2">
        <SourceIcon platform="podcast" size="lg" />
        <p className="text-base font-semibold text-[#2D2A26]">Add a podcast episode</p>
      </div>
      <p className="text-sm text-[#9CA3AF] mb-4">
        Paste a Spotify or Apple Podcasts episode link to bring that episode into the Village, embed the
        original player and add your story around it.
      </p>

      <EpisodeEmbedPanel founderId={founderId} onImported={onConnected} />

      <ConnectedSourcesSection sources={sources} isHighVolume={isHighVolume} onChanged={onConnected} />
    </div>
  )
}

// ─── Add a single podcast episode ────────────────────────────────────────────
// One Spotify or Apple Podcasts episode link, a real embedded player, and the
// founder writes their own blog — no RSS feed, no whole-catalogue connect
// (that flow never reliably resolved a feed from a bare URL/name, so it was
// removed rather than left half-working).

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
      {error && <p className="text-xs text-red-600 mb-3">{error}</p>}

      {step === 'input' && (
        <div className="flex flex-col sm:flex-row gap-2">
          <input type="url" value={url} onChange={e => setUrl(e.target.value)}
            placeholder="https://open.spotify.com/episode/... or https://podcasts.apple.com/.../id...?i=..."
            className="flex-1 px-3 py-2.5 rounded-lg border border-[#E8E4DD] text-sm text-[#2D2A26] bg-white placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#C86A43]/30 focus:border-[#C86A43] transition-colors" />
          <button onClick={() => void handleResolve()} disabled={!url.trim()}
            className="px-4 py-2.5 rounded-lg bg-[#C86A43] text-white text-sm font-semibold hover:bg-[#b05a35] disabled:opacity-50 transition-colors shrink-0">
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

/** Connected sources for one connector, nested inside that connector's own
 * card — title, input and status all read as one unit instead of a floating
 * box underneath. */
function ConnectedSourcesSection({ sources, isHighVolume, onChanged }: { sources: ConnectedSource[]; isHighVolume: boolean; onChanged: () => void }) {
  const [expanded, setExpanded] = useState(false)
  if (sources.length === 0) return null
  return (
    <div className="border-t border-[#E8E4DD] mt-4 pt-3">
      <button
        type="button"
        onClick={() => setExpanded(e => !e)}
        className="flex items-center gap-1.5 text-xs font-semibold text-[#6B7280] hover:text-[#C86A43] transition-colors"
      >
        {sources.length} connected source{sources.length === 1 ? '' : 's'}
        <svg className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {expanded && (
        <div className="mt-2 divide-y divide-[#F3EDE6]">
          {sources.map(source => (
            <ConnectedSourceRow key={source.id} source={source} isHighVolume={isHighVolume} onChanged={onChanged} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Connect your YouTube channel ────────────────────────────────────────────

function YouTubeConnectForm({ founderId, isHighVolume, sources, onConnected }: { founderId: string; isHighVolume: boolean; sources: ConnectedSource[]; onConnected: () => void }) {
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
    <div className="bg-white rounded-2xl border-2 border-[#E8E4DD] p-8 h-full">
      <div className="flex items-center gap-4 mb-2">
        <SourceIcon platform="youtube" size="lg" />
        <p className="text-base font-semibold text-[#2D2A26]">Connect YouTube</p>
      </div>
      <p className="text-sm text-[#9CA3AF] mb-4">
        Bring your YouTube back catalogue into the Village and turn old videos into new stories, blogs and ideas.
        {isHighVolume
          ? ` Up to ${HIGH_VOLUME_DAILY_LIMIT.toLocaleString()} videos a day.`
          : ' Up to 20 previous videos a day — enough to write a real story about each one, not just dump years of content at once.'}
      </p>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder={SOURCE_TYPE_HINTS.youtube}
          className="flex-1 px-3 py-2.5 rounded-lg border border-[#E8E4DD] text-sm text-[#2D2A26] bg-white placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#C86A43]/30 focus:border-[#C86A43] transition-colors"
        />
        <button
          onClick={() => void handleConnect()}
          disabled={busy || !value.trim()}
          className="px-4 py-2.5 rounded-lg bg-[#C86A43] text-white text-sm font-semibold hover:bg-[#b05a35] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
        >
          {busy ? 'Connecting…' : 'Connect channel'}
        </button>
      </div>
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
      {!isHighVolume && (
        <p className="text-[11px] text-[#9CA3AF] mt-2">
          Once these are in, tell the real story behind each one — what happened, what you learned — for visibility that actually means something.
        </p>
      )}
      <ConnectedSourcesSection sources={sources} isHighVolume={isHighVolume} onChanged={onConnected} />
    </div>
  )
}

// ─── Connect your website ────────────────────────────────────────────────────

function WebsiteConnectForm({ founderId, isHighVolume, sources, onConnected }: { founderId: string; isHighVolume: boolean; sources: ConnectedSource[]; onConnected: () => void }) {
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
    <div className="bg-white rounded-2xl border-2 border-[#E8E4DD] p-6">
      <div className="flex items-center gap-4 mb-2">
        <SourceIcon platform="website" size="lg" />
        <p className="text-base font-semibold text-[#2D2A26]">Connect your blogs</p>
      </div>
      <p className="text-sm text-[#9CA3AF] mb-4">Paste your website or blog link and CULO will find your feed and bring your existing posts into the Village.</p>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder="Paste your website URL"
          className="flex-1 px-3 py-2.5 rounded-lg border border-[#E8E4DD] text-sm text-[#2D2A26] bg-white placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#C86A43]/30 focus:border-[#C86A43] transition-colors"
        />
        <button
          onClick={() => void handleConnect()}
          disabled={busy || !value.trim()}
          className="px-4 py-2.5 rounded-lg bg-[#C86A43] text-white text-sm font-semibold hover:bg-[#b05a35] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
        >
          {busy ? 'Connecting…' : 'Connect website'}
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
      <ConnectedSourcesSection sources={sources} isHighVolume={isHighVolume} onChanged={onConnected} />
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

  // Matches the platform values ImportedContent uses, so the link can
  // pre-filter Content down to just what this connector brought in.
  const contentPlatform = source.sourceType === 'website-rss' ? 'website' : source.sourceType === 'podcast-rss' ? 'podcast' : 'youtube'

  return (
    <div className="flex items-center gap-3 py-3">
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
      <Link
        to={`/dashboard/profile?tab=content&contentSubTab=imported&platform=${contentPlatform}`}
        className="text-xs font-semibold text-[#6B7280] hover:text-[#2D2A26] shrink-0"
      >
        View content
      </Link>
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

export function PlatformBadge({ platform }: { platform: string }) {
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
      <div className="relative w-full rounded-lg overflow-hidden bg-black" style={{ paddingTop: '56.25%', touchAction: 'pan-y' }}>
        <iframe
          src={content.embedUrl}
          title={content.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
          style={{ touchAction: 'pan-y' }}
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
            Analysed {new Date(intel.generatedAt).toLocaleDateString('en-AU')}
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

export function EditForm({ draft, onChange, onSave, onCancel }: EditFormProps) {
  const businesses = getBusinesses()
  const activePartners = partnerService.getAll({ status: 'active' })
  const [transcriptFlash, setTranscriptFlash] = useState(false)
  const [shapeTrigger, setShapeTrigger] = useState(0)
  // Raw text, not derived from draft.topics.join(', ') on every keystroke —
  // typing a trailing comma (about to start the next item) was getting
  // immediately stripped back out because parseList().filter(Boolean) drops
  // the empty segment after it, and the input's value snapped straight back
  // to the rejoined array. Only the array is kept in sync as the founder
  // types; the raw text stays exactly what they typed.
  const [topicsText, setTopicsText] = useState(() => draft.topics.join(', '))
  const [locationsText, setLocationsText] = useState(() => draft.locations.join(', '))

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
    // Tagged to the story this piece publishes as (once it exists) so it only
    // shows on that story's page, not every story this founder has ever
    // published — FAQs shaped from one post's content aren't about the rest.
    const faq: FAQ = {
      id: crypto.randomUUID(), question, answer, topicIds: [], expertiseIds: [],
      relatedStoryIds: draft.relatedStoryId ? [draft.relatedStoryId] : [],
      relatedIdeaIds: [],
    }
    void updateFounder({ ...founder, faqs: [...(founder.faqs ?? []), faq] })
  }

  const INPUT = 'w-full px-3 py-2 text-sm border border-[#E8E4DD] rounded-lg focus:outline-none focus:border-[#C86A43]'
  const TEXTAREA = `${INPUT} resize-none`
  const SELECT = `${INPUT} bg-white`

  return (
    <div className="bg-white rounded-xl border border-[#E8E4DD] p-5">

      {/* Platform + URL + View — the real published story once one exists,
          otherwise a live preview so it's viewable before ever publishing. */}
      <div className="flex items-center gap-2 mb-5">
        <PlatformBadge platform={draft.sourcePlatform} />
        {draft.originalUrl && <span className="text-xs text-[#9CA3AF] truncate">{draft.originalUrl}</span>}
        <a
          href={draft.relatedStoryId ? `/stories/${getStory(draft.relatedStoryId)?.slug ?? ''}` : `/dashboard/preview/${draft.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto shrink-0 text-xs font-semibold text-[#C86A43] hover:underline"
        >
          {draft.relatedStoryId ? 'View published story →' : 'Preview →'}
        </a>
        <button onClick={onSave}
          className="shrink-0 px-4 py-2 bg-[#C86A43] text-white text-xs font-semibold rounded-lg hover:bg-[#b05a35] transition-colors">
          Save Changes
        </button>
      </div>

      {/* Embed preview */}
      <div className="mb-5">
        <EmbedPreview content={draft} />
      </div>

      {/* Title + Subtitle */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-xs font-semibold text-[#2D2A26] mb-1">Title</label>
          <input type="text" value={draft.title}
            onChange={e => field('title', e.target.value)}
            className={INPUT} placeholder="Title for this imported piece" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#2D2A26] mb-1">Subtitle</label>
          <input type="text" value={draft.subtitle ?? ''}
            onChange={e => field('subtitle', e.target.value || undefined)}
            className={INPUT} placeholder="A short line under the title — optional" />
        </div>
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

      {/* Search & AI preview — always derived from Title + Subtitle/Blog, no
          separate field to fill in and keep in sync by hand. */}
      <div className="mb-4 bg-[#F8F5F0] rounded-lg px-4 py-3">
        <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-widest mb-1.5">What search engines and AI will show</p>
        <p className="text-sm text-[#C86A43] font-medium truncate">{deriveSeoTitle(draft.title)}</p>
        <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">{deriveSeoDescription(draft.subtitle, draft.description)}</p>
      </div>

      {/* Video — its own section, not the Thumbnail field. A video was
          previously only visible because it got stuffed into thumbnailUrl
          (with no real cover image), which just looked like a video sitting
          in the wrong place instead of a proper Video field. */}
      {draft.reelVideoUrl && (
        <div className="mb-4">
          <label className="block text-xs font-semibold text-[#2D2A26] mb-1">Video</label>
          <video src={draft.reelVideoUrl} controls className="w-full max-h-96 rounded-lg bg-black" />
          <div className="mt-2">
            <MediaUpload
              value={draft.reelVideoUrl}
              onChange={v => field('reelVideoUrl', v || undefined)}
              accept="video"
              label="Replace video"
              aspect="auto"
              uploadOptions={{ founderId: draft.founderId, businessId: draft.businessId, usageType: 'reel-preview' }}
            />
          </div>

          {/* Video orientation — a YouTube Short is still vertical despite
              being a "youtube-video", which otherwise defaults to landscape;
              no reliable way to detect that from the URL alone. */}
          <div className="mt-3">
            <label className="block text-xs font-semibold text-[#2D2A26] mb-1.5">Landscape or vertical?</label>
            <div className="flex gap-2">
              {(['vertical', 'landscape'] as const).map(o => (
                <button
                  key={o}
                  type="button"
                  onClick={() => field('videoOrientation', o)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors capitalize ${
                    (draft.videoOrientation ?? 'vertical') === o
                      ? 'bg-[#C86A43] text-white border-[#C86A43]'
                      : 'bg-white text-[#6B7280] border-[#E8E4DD] hover:border-[#C86A43]/50'
                  }`}
                >
                  {o}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

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

      {/* Extra media — add more beyond what came in with the original
          import, same "just add more" pattern as publishing directly. */}
      <div className="mb-4 border-t border-[#E8E4DD] pt-4">
        <p className="text-sm font-semibold text-[#2D2A26] mb-1">Extra Media</p>
        <p className="text-xs text-[#9CA3AF] mb-3">Add extra photos, a carousel, or another reel/video to go with this piece.</p>

        {(draft.imageUrls ?? []).length > 0 && (
          <div className="flex flex-col gap-1.5 mb-2">
            {(draft.imageUrls ?? []).map((url, i) => (
              <div key={i} className="flex items-center gap-2 bg-[#F8F5F0] rounded-lg border border-[#E8E4DD] p-2">
                <img src={url} alt="" className="w-9 h-9 rounded object-cover shrink-0 bg-[#F3EDE6]" />
                <span className="text-xs text-[#9CA3AF] truncate flex-1">{url}</span>
                <button
                  onClick={() => field('imageUrls', (draft.imageUrls ?? []).filter((_, j) => j !== i))}
                  className="shrink-0 text-xs text-[#9CA3AF] hover:text-red-500 px-1">✕</button>
              </div>
            ))}
          </div>
        )}
        {(draft.additionalVideoUrls ?? []).length > 0 && (
          <div className="flex flex-col gap-1.5 mt-3 mb-2">
            {(draft.additionalVideoUrls ?? []).map((url, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="url"
                  value={url}
                  onChange={e => {
                    const next = [...(draft.additionalVideoUrls ?? [])]
                    next[i] = e.target.value
                    field('additionalVideoUrls', next)
                  }}
                  className={INPUT}
                  placeholder={`Video ${i + 1} URL`}
                />
                <button
                  onClick={() => field('additionalVideoUrls', (draft.additionalVideoUrls ?? []).filter((_, j) => j !== i))}
                  className="shrink-0 text-xs text-[#9CA3AF] hover:text-red-500 px-2">✕</button>
              </div>
            ))}
          </div>
        )}
        <div className="mt-3 flex flex-col gap-2">
          <button
            onClick={() => field('additionalVideoUrls', [...(draft.additionalVideoUrls ?? []), ''])}
            className="text-xs text-[#C86A43] hover:underline text-left w-fit">
            + Add another reel/video (by URL)
          </button>
          {/* One dropzone for both — a mixed batch (a carousel plus a video
              clip) used to need two separate uploaders; each file now routes
              itself to the right field by its own type. */}
          <MediaUpload
            onChange={v => field(
              inferKindFromUrl(v) === 'video' ? 'additionalVideoUrls' : 'imageUrls',
              inferKindFromUrl(v) === 'video'
                ? [...(draft.additionalVideoUrls ?? []).filter(Boolean), v]
                : [...(draft.imageUrls ?? []), v],
            )}
            onChangeMultiple={urls => {
              const videos = urls.filter(u => inferKindFromUrl(u) === 'video')
              const images = urls.filter(u => inferKindFromUrl(u) !== 'video')
              if (videos.length > 0) field('additionalVideoUrls', [...(draft.additionalVideoUrls ?? []).filter(Boolean), ...videos])
              if (images.length > 0) field('imageUrls', [...(draft.imageUrls ?? []), ...images])
            }}
            multiple
            accept="media"
            label="Add photos or a video"
            aspect="auto"
            uploadOptions={{ founderId: draft.founderId, businessId: draft.businessId, usageType: 'carousel-slide' }}
          />
        </div>
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

        {/* Additional links — beyond the one primary CTA above, for a piece
            that genuinely mentions more than one partner/product. */}
        {(draft.additionalLinks ?? []).length > 0 && (
          <div className="flex flex-col gap-2 mt-3">
            {(draft.additionalLinks ?? []).map((link, i) => (
              <div key={i} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 items-center bg-[#F8F5F0] rounded-lg border border-[#E8E4DD] p-2">
                <input type="text" value={link.label}
                  onChange={e => {
                    const next = [...(draft.additionalLinks ?? [])]
                    next[i] = { ...next[i]!, label: e.target.value }
                    field('additionalLinks', next)
                  }}
                  className={INPUT} placeholder="Link label" />
                <input type="url" value={link.url}
                  onChange={e => {
                    const next = [...(draft.additionalLinks ?? [])]
                    next[i] = { ...next[i]!, url: e.target.value }
                    field('additionalLinks', next)
                  }}
                  className={INPUT} placeholder="https://..." />
                <button
                  onClick={() => field('additionalLinks', (draft.additionalLinks ?? []).filter((_, j) => j !== i))}
                  className="shrink-0 text-xs text-[#9CA3AF] hover:text-red-500 px-2">✕</button>
              </div>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={() => field('additionalLinks', [...(draft.additionalLinks ?? []), { label: '', url: '' }])}
          className="text-xs text-[#C86A43] hover:underline text-left w-fit mt-3">
          + Add another affiliate link
        </button>
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
            <input type="text" value={topicsText}
              onChange={e => { setTopicsText(e.target.value); field('topics', parseList(e.target.value)) }}
              className={INPUT} placeholder="e.g. marketing, content, strategy" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#2D2A26] mb-1">
              Locations <span className="font-normal text-[#9CA3AF]">comma-separated</span>
            </label>
            <input type="text" value={locationsText}
              onChange={e => { setLocationsText(e.target.value); field('locations', parseList(e.target.value)) }}
              className={INPUT} placeholder="e.g. Sydney, Melbourne" />
          </div>
        </div>

        {/* Status — Publish is what actually controls visibility, so there's
            no separate Visibility field here to fall out of sync with it. */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-xs font-semibold text-[#2D2A26] mb-1">Status</label>
            <select value={draft.status}
              onChange={e => field('status', e.target.value as ImportedContentStatus)}
              className={SELECT}>
              {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          {draft.sourcePlatform !== 'canva' && (
            <div className="flex flex-col justify-end">
              <CreateWithCuloCTA variant="button" label="Create with CULO Creatives exclusively in Canva" />
            </div>
          )}
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
export function isReadyToPublish(item: ImportedContent): boolean {
  return item.title.trim().length > 0 && item.title !== `Imported from ${PLATFORM_LABELS[item.sourcePlatform]}`
}

export function SavedRow({
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
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggleCheck}
        className="shrink-0 w-4 h-4 mt-1.5 accent-[#C86A43]"
        aria-label={`Select "${item.title}"`}
      />
      {/* Real external source wins when there is one. Once a real Story
          exists (relatedStoryId), that's the accurate thing to show —
          otherwise, an in-memory preview (no external link to point to at
          all, e.g. a raw Instagram archive file with no post URL). */}
      {(() => {
        const viewHref = item.originalUrl
          ? normalizeUrl(item.originalUrl)
          : publishedStory ? `/stories/${publishedStory.slug}` : `/dashboard/preview/${item.id}`
        const isExternal = !!item.originalUrl
        const linkProps = isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {}
        return (
          <>
            <a
              href={viewHref}
              {...linkProps}
              title={isExternal ? 'Open original' : 'Preview'}
              className="shrink-0 w-24 h-16 rounded-lg overflow-hidden bg-[#F3EDE6] flex items-center justify-center hover:opacity-80 transition-opacity"
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
                <a href={viewHref} {...linkProps}
                  className="text-base font-semibold text-[#2D2A26] truncate hover:text-[#C86A43] transition-colors">
                  {item.title}{item.flaggedForReview && (
                    <span className="text-amber-600" title={item.flagReason ?? 'Flagged for review — excluded from bulk actions'}>*</span>
                  )}
                </a>
                {!item.relatedStoryId && !ready && (
                  <span className="text-[10px] text-amber-600 shrink-0">needs a title before it can publish</span>
                )}
                {item.flaggedForReview && (
                  <span
                    className="text-[10px] text-amber-600 shrink-0"
                    title={item.flagReason ?? 'Flagged for review'}
                  >
                    needs review — excluded from bulk actions
                  </span>
                )}
              </div>

              <p className="text-xs text-[#6B7280] mt-0.5 line-clamp-2 max-w-xl">
                {item.description || <span className="text-[#C4BDB4] italic">No description yet.</span>}
              </p>
            </div>
          </>
        )
      })()}
      <select
        value={item.status}
        onChange={e => {
          const next = e.target.value as ImportedContentStatus
          const goingLive = (next === 'published' || next === 'featured')
            && item.status !== 'published' && item.status !== 'featured'
          if (goingLive && !window.confirm('Publish this to the live Village site? It will be publicly visible immediately.')) return
          onStatusChange(next)
        }}
        className={`text-[10px] font-semibold px-2 py-1 rounded-full border-0 focus:outline-none cursor-pointer shrink-0 ${statusColors[item.status]}`}
      >
        {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <div className="flex items-center gap-2 shrink-0 pt-0.5">
        {item.relatedStoryId && (
          publishedStory ? (
            <Link to={`/stories/${publishedStory.slug}`} target="_blank" rel="noopener noreferrer" className="text-xs text-[#5E6B4A] font-medium hover:underline">
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
  const navigate = useNavigate()
  const founderId = getCurrentFounderId(user) ?? 'dev-user'
  const isHighVolume = HIGH_VOLUME_IMPORT_EMAILS.includes(user?.email?.trim().toLowerCase() ?? '')
  const canUseVoiceRewrite = VOICE_REWRITE_EMAILS.includes(user?.email?.trim().toLowerCase() ?? '')
  const founder = getFounder(founderId)
  // Local, instant copy of the brief — getFounder() is a plain synchronous
  // store read, not React state, so without this the textarea's value prop
  // never actually changed after typing or uploading a file: the save to
  // Supabase went through fine, but nothing re-rendered this component with
  // the new text, so a file upload looked like it silently did nothing.
  // Keeping it local (not synced to a slow network round-trip on every
  // keystroke) also means typing itself never lags waiting on the backend.
  const [voiceBriefDraft, setVoiceBriefDraft] = useState(() => founder?.voiceBrief)
  const [insightBriefDraft, setInsightBriefDraft] = useState(() => founder?.insightBrief)

  const [draft, setDraft]       = useState<ImportedContent | null>(null)
  const [sources, setSources]   = useState<ConnectedSource[]>([])
  const [saveError, setSaveError] = useState<string | null>(null)
  // Set the moment any connector below reports a successful import — swaps
  // in a "go review it" prompt instead of also duplicating the full list of
  // everything ever imported here (that list lives in Profile → Content now).
  const [justImportedCount, setJustImportedCount] = useState<number | null>(null)
  const [canvaExpanded, setCanvaExpanded] = useState(false)
  const canvaCardRef = useRef<HTMLDivElement>(null)
  const [instagramExpanded, setInstagramExpanded] = useState(false)
  const instagramCardRef = useRef<HTMLDivElement>(null)

  function reportImported(count: number) {
    setJustImportedCount(count)
  }

  function loadSources() {
    setSources(connectedSourcesService.getAll({ founderId }))
  }

  useEffect(() => { loadSources() }, [founderId])

  // Deep link from Profile → Content ("?edit=<id>") — opens straight into
  // advance edit instead of making the founder find the item themselves.
  const [searchParams] = useSearchParams()
  useEffect(() => {
    const editId = searchParams.get('edit')
    if (!editId) return
    const item = importedContentService.get(editId)
    if (!item) return
    setDraft(item)
  }, [searchParams])

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
    // Saving an edit is a mid-task action, not an end state — send them back
    // to where they'd actually continue publishing this piece, instead of
    // leaving them stranded on the now-empty Import page.
    navigate('/dashboard/profile?tab=content')
  }

  function handleCancel() { setDraft(null) }

  return (
    <div className={`p-8 ${draft ? 'max-w-4xl' : 'max-w-[1600px]'}`} style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#2D2A26]">Bring your work into the Village</h1>
        <p className="text-sm text-[#6B7280] mt-1.5 leading-relaxed">
          Your best ideas are probably already out there. Connect your YouTube, podcast or blog and CULO will
          bring your existing work into one place — embedded from the original source, never re-uploaded or
          copied away from it. Then give CULO a little context about who you are, so the stories it pulls
          from that work still sound like you.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5">
          {[
            { title: 'Add your Voice & Brand Brief', desc: 'Give CULO the context it needs to sound like you.' },
            { title: 'Import all content across channels', desc: 'YouTube, podcasts, blogs, Instagram, Canva — bring it all in.' },
            { title: 'Organise your series', desc: "Sort what you've imported into the chapters of your story." },
            { title: 'Publish for discovery', desc: 'Put it live so people, search engines and AI can find it.' },
          ].map((s, i) => (
            <div key={s.title} className="bg-white rounded-xl border border-[#E8E4DD] px-4 py-4">
              <div className="w-7 h-7 rounded-full bg-[#FBF1EB] text-[#C86A43] flex items-center justify-center text-xs font-bold shrink-0 mb-2">
                {i + 1}
              </div>
              <p className="text-sm font-semibold text-[#2D2A26] mb-0.5">{s.title}</p>
              <p className="text-xs text-[#9CA3AF] leading-snug">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Real numbers only, straight from this founder's own sources/imports —
          no invented storage quota or "of N available" ceiling. */}
      {!draft && (() => {
        const itemsImported = importedContentService.getAll({ founderId }).length
        const lastScan = sources.reduce<string | undefined>((latest, s) => {
          if (!s.lastScannedAt) return latest
          return !latest || s.lastScannedAt > latest ? s.lastScannedAt : latest
        }, undefined)
        return (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="flex items-center justify-between gap-3 bg-white rounded-xl border border-[#E8E4DD] px-5 py-4">
              <div>
                <p className="text-xs text-[#9CA3AF]">Sources connected</p>
                <p className="text-2xl font-bold text-[#2D2A26]">{sources.length}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#FBF1EB] text-[#C86A43] flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.9A5.5 5.5 0 0117.9 8.5 4.5 4.5 0 0117 16H7z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 12v6m0-6l-2.5 2.5M12 12l2.5 2.5" /></svg>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 bg-white rounded-xl border border-[#E8E4DD] px-5 py-4">
              <div>
                <p className="text-xs text-[#9CA3AF]">Pieces brought in</p>
                <p className="text-2xl font-bold text-[#2D2A26]">{itemsImported}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#5E6B4A]/10 text-[#5E6B4A] flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 bg-white rounded-xl border border-[#E8E4DD] px-5 py-4">
              <div>
                <p className="text-xs text-[#9CA3AF]">Last checked</p>
                <p className="text-2xl font-bold text-[#2D2A26]">
                  {lastScan ? new Date(lastScan).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }) : 'Never'}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M4.5 9a7.5 7.5 0 0113-4.5L20 7M19.5 15a7.5 7.5 0 01-13 4.5L4 17" /></svg>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Just-imported prompt — the full list of everything imported lives in
          Profile → Content now, not duplicated here. This page is purely
          "bring things in." */}
      {justImportedCount !== null && (
        <div className="mb-6 flex items-center justify-between gap-4 bg-[#5E6B4A]/10 border border-[#5E6B4A]/20 rounded-xl px-5 py-4">
          <p className="text-sm text-[#5E6B4A] font-medium">
            {justImportedCount} {justImportedCount === 1 ? 'item' : 'items'} imported. Review and publish it from Content.
          </p>
          <Link
            to="/dashboard/profile?tab=content"
            className="shrink-0 px-4 py-2 bg-[#C86A43] text-white text-sm font-semibold rounded-lg hover:bg-[#b05a35] transition-colors"
          >
            Go to Content →
          </Link>
        </div>
      )}

      {/* Connect a channel or feed */}
      {!draft && (
        <div>
          {founder && (
            <div className="mb-8">
              <VoiceBriefEditor
                value={voiceBriefDraft}
                updatedAt={founder.voiceBriefUpdatedAt}
                onChange={v => {
                  setVoiceBriefDraft(v)
                  void updateFounder({ ...founder, voiceBrief: v, voiceBriefUpdatedAt: new Date().toISOString() })
                }}
              />
            </div>
          )}
          {founder && (
            <div className="mb-8">
              <InsightBriefEditor
                value={insightBriefDraft}
                updatedAt={founder.insightBriefUpdatedAt}
                onChange={v => {
                  setInsightBriefDraft(v)
                  void updateFounder({ ...founder, insightBrief: v, insightBriefUpdatedAt: new Date().toISOString() })
                }}
              />
            </div>
          )}

          <p className="text-sm font-semibold text-[#2D2A26] mb-3">Bring in your content</p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 items-stretch">
            <YouTubeConnectForm
              founderId={founderId}
              isHighVolume={isHighVolume}
              sources={sources.filter(s => s.sourceType === 'youtube')}
              onConnected={() => { loadSources(); reportImported(1) }}
            />

            <div className="flex flex-col gap-6">
              <div ref={instagramCardRef}>
                <InstagramArchiveImportCard
                  founderId={founderId}
                  voiceBrief={canUseVoiceRewrite ? founder?.voiceBrief : undefined}
                  insightBrief={canUseVoiceRewrite ? founder?.insightBrief : undefined}
                  expanded={instagramExpanded}
                  onExpandedChange={setInstagramExpanded}
                  onImported={count => reportImported(count)}
                />
              </div>

              <div ref={canvaCardRef}>
                <CanvaImportCard
                  founderId={founderId}
                  expanded={canvaExpanded}
                  onExpandedChange={setCanvaExpanded}
                  onImported={() => reportImported(1)}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <WebsiteConnectForm
              founderId={founderId}
              isHighVolume={isHighVolume}
              sources={sources.filter(s => s.sourceType === 'website-rss')}
              onConnected={() => { loadSources(); reportImported(1) }}
            />

            <PodcastConnectPanel
              founderId={founderId}
              isHighVolume={isHighVolume}
              sources={sources.filter(s => s.sourceType === 'podcast-rss')}
              onConnected={() => { loadSources(); reportImported(1) }}
            />
          </div>

          {saveError && <p className="text-xs text-red-600 font-medium mt-4">{saveError}</p>}

          <div className="mt-6 pt-6 border-t border-[#E8E4DD]">
            <Link to="/dashboard/profile?tab=content" className="text-sm font-semibold text-[#C86A43] hover:underline">
              View everything you've imported so far →
            </Link>
          </div>
        </div>
      )}

      {/* Advanced edit — inline, using the same width the page's connector
          cards would otherwise take up, instead of a narrow drawer floating
          over a dimmed, mostly-empty desktop. */}
      {draft && (
        <div>
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
      )}

    </div>
  )
}
