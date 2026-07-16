import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { getCurrentFounderId } from '../../services/currentFounder'
import { connectedSourcesService, scanSource, newConnectedSource } from '../../services/connectedSources'
import { resolveChannelId } from '../../services/connectors/youtube'
import type { ConnectedSource, ConnectedSourceType } from '../../types/connectedSource'

const TYPE_LABELS: Record<ConnectedSourceType, string> = {
  'youtube':      'YouTube',
  'podcast-rss':  'Podcast',
  'website-rss':  'Website',
}

const TYPE_HINTS: Record<ConnectedSourceType, string> = {
  'youtube':      'Paste your channel URL, @handle, or channel ID.',
  'podcast-rss':  'Paste your podcast’s RSS feed URL.',
  'website-rss':  'Paste your blog’s RSS feed URL.',
}

function ConnectForm({ founderId, onConnected }: { founderId: string; onConnected: () => void }) {
  const [type, setType]       = useState<ConnectedSourceType>('youtube')
  const [value, setValue]     = useState('')
  const [busy, setBusy]       = useState(false)
  const [error, setError]     = useState<string | null>(null)

  async function handleConnect() {
    if (!value.trim()) return
    setBusy(true)
    setError(null)
    try {
      const config = type === 'youtube'
        ? { channelId: await resolveChannelId(value) }
        : { feedUrl: value.trim() }
      const label = type === 'youtube' ? value.trim() : new URL(value.trim()).hostname
      const source = newConnectedSource(founderId, type, label, config)
      await connectedSourcesService.upsert(source)
      await scanSource(source)
      setValue('')
      onConnected()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not connect this source.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-[#E8E4DD] p-5">
      <p className="text-sm font-semibold text-[#2D2A26] mb-3">Connect a source</p>
      <div className="flex flex-col sm:flex-row gap-2">
        <select
          value={type}
          onChange={e => { setType(e.target.value as ConnectedSourceType); setError(null) }}
          className="px-3 py-2 rounded-lg border border-[#E8E4DD] text-sm text-[#2D2A26] bg-white focus:outline-none focus:ring-2 focus:ring-[#C86A43]/30 focus:border-[#C86A43] transition-colors"
        >
          {(Object.keys(TYPE_LABELS) as ConnectedSourceType[]).map(t => (
            <option key={t} value={t}>{TYPE_LABELS[t]}</option>
          ))}
        </select>
        <input
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder={TYPE_HINTS[type]}
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

function SourceRow({ source, onChanged }: { source: ConnectedSource; onChanged: () => void }) {
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  async function handleScan() {
    setBusy(true)
    setNotice(null)
    try {
      const result = await scanSource(source)
      if (result.dailyLimitReached) {
        setNotice("You've added your videos for today — your next 20 unlock tomorrow.")
      } else if (result.imported === 0) {
        setNotice("You're all caught up — no new videos found.")
      } else if (result.moreAvailable) {
        setNotice(`Added ${result.imported} — your next 20 unlock tomorrow.`)
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

  return (
    <div className="flex items-center gap-3 bg-white rounded-xl border border-[#E8E4DD] px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#F3EDE6] text-[#6B7280]">
            {TYPE_LABELS[source.sourceType]}
          </span>
          <p className="text-sm font-medium text-[#2D2A26] truncate">{source.label}</p>
        </div>
        <p className="text-xs text-[#9CA3AF] mt-1">
          {source.status === 'error' && source.lastError
            ? <span className="text-red-600">{source.lastError}</span>
            : notice
              ? <span className="text-[#5E6B4A] font-medium">{notice}</span>
              : source.lastScannedAt
                ? `Last scanned ${new Date(source.lastScannedAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })} · ${source.discoveredCount} imported`
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
      <button
        onClick={() => void handleRemove()}
        className="text-xs font-semibold text-[#9CA3AF] hover:text-red-600 shrink-0"
      >
        Remove
      </button>
    </div>
  )
}

export function DashboardImportSourcesPage() {
  const { user } = useAuth()
  const founderId = getCurrentFounderId(user)
  const [tick, setTick] = useState(0)
  const refresh = () => setTick(t => t + 1)
  void tick

  const sources = founderId ? connectedSourcesService.getAll({ founderId }) : []

  return (
    <div className="p-8 max-w-3xl" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2D2A26]">Import Sources</h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Connect a channel or feed so Village can pull in your own already-public content automatically.
          </p>
        </div>
        <Link
          to="/dashboard/import-content"
          className="shrink-0 px-4 py-2.5 border border-[#E8E4DD] text-[#2D2A26] text-sm font-medium rounded-lg hover:border-[#C86A43]/40 hover:text-[#C86A43] transition-colors whitespace-nowrap"
        >
          Review imports →
        </Link>
      </div>

      {!founderId ? (
        <div className="bg-white rounded-xl border border-[#E8E4DD] px-5 py-8 text-center">
          <p className="text-sm font-medium text-[#2D2A26]">Finish setting up your profile first</p>
          <p className="text-xs text-[#9CA3AF] mt-1">Sources connect to your founder profile, which isn't set up yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <ConnectForm founderId={founderId} onConnected={refresh} />

          {sources.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#E8E4DD] px-5 py-8 text-center">
              <p className="text-sm font-medium text-[#2D2A26] mb-1">No sources connected yet</p>
              <p className="text-xs text-[#9CA3AF] max-w-sm mx-auto leading-relaxed">
                Connect your YouTube channel, podcast feed, or blog above — discovered content lands in Import above as drafts, ready to review and turn into stories.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {sources.map(source => (
                <SourceRow key={source.id} source={source} onChanged={refresh} />
              ))}
            </div>
          )}

          <p className="text-xs text-[#9CA3AF]">
            Instagram, LinkedIn, TikTok and Canva connections aren't available yet — they each require going through that platform's own app review process.
          </p>
        </div>
      )}
    </div>
  )
}
