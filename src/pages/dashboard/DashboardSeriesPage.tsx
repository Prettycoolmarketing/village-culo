import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getStories } from '../../services/stories'
import {
  getSeriesEpisodes, saveSeries, deleteSeries,
  assignEpisode, removeEpisode, reorderEpisodes, buildSeriesBible,
} from '../../services/series'
import { getFounder } from '../../services/founders'
import { ConfirmButton } from '../../components/ui/ConfirmButton'
import { MediaUpload } from '../../components/ui/MediaUpload'
import type { Series } from '../../types'

const inputClass =
  'w-full px-3 py-2.5 rounded-lg border border-[#E8E4DD] text-sm text-[#2D2A26] bg-white placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#C86A43]/30 focus:border-[#C86A43] transition-colors'

// ─── Series detail — rename, cover, publish toggle, episode ordering ────────
// Used from Profile > Content > Published > Series — the one place series
// are managed, alongside the Businesses tab's pill-then-editor pattern.

export function SeriesDetail({ series, founderId, onBack, onChanged, onDeleted }: {
  series: Series
  founderId: string
  onBack: () => void
  onChanged: () => void
  onDeleted: () => void
}) {
  const [draft, setDraft] = useState<Series>(series)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [addingId, setAddingId] = useState('')

  const episodes = getSeriesEpisodes(series.id)
  const availableStories = getStories({ founderId, publicOnly: true }).filter(s => s.seriesId !== series.id)

  function set<K extends keyof Series>(key: K, value: Series[K]) {
    setDraft(prev => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    setSaveError(null)
    const result = await saveSeries(draft)
    setSaving(false)
    if (result.success) { setSaved(true); onChanged() }
    else setSaveError(result.error ?? 'Save failed. Please try again.')
  }

  async function handleAddEpisode() {
    if (!addingId) return
    const result = await assignEpisode(addingId, series.id)
    if (!result.success) { setSaveError(result.error ?? 'Could not add that episode.'); return }
    setAddingId('')
    onChanged()
  }

  async function handleRemoveEpisode(storyId: string) {
    await removeEpisode(storyId)
    onChanged()
  }

  async function handleMove(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= episodes.length) return
    const reordered = episodes.map(e => e.id)
    const tmp = reordered[index]!
    reordered[index] = reordered[target]!
    reordered[target] = tmp
    await reorderEpisodes(series.id, reordered)
    onChanged()
  }

  async function handleDelete() {
    const result = await deleteSeries(series.id)
    if (result.success) onDeleted()
    else setSaveError(result.error ?? 'Could not delete this series.')
  }

  function handleDownloadBible() {
    const founderName = getFounder(founderId)?.name ?? 'A CULO Village founder'
    const bible = buildSeriesBible(series, episodes, founderName, window.location.origin)
    const blob = new Blob([bible], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${series.slug || 'series'}-bible.md`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <button onClick={onBack} className="text-sm text-[#9CA3AF] hover:text-[#C86A43] transition-colors text-left w-fit">
          ← All series
        </button>
        {episodes.length > 0 && (
          <button onClick={handleDownloadBible}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#E8E4DD] text-[#2D2A26] bg-white hover:border-[#C86A43]/50 transition-colors">
            Download series bible (.md)
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-[#E8E4DD] p-5 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <MediaUpload
            value={draft.coverImage}
            onChange={v => set('coverImage', v)}
            accept="image"
            aspect="square"
            label="Cover"
            uploadOptions={{ founderId, usageType: 'series-cover' }}
            className="w-28 shrink-0"
          />
          <div className="flex-1 flex flex-col gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide mb-1">Series name</label>
              <input type="text" value={draft.title} onChange={e => set('title', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide mb-1">Description</label>
              <textarea value={draft.description ?? ''} onChange={e => set('description', e.target.value)} rows={2}
                placeholder="What this series is about, for anyone browsing before they watch."
                className={inputClass + ' resize-none'} />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#F3EDE6]">
          <label className="flex items-center gap-2 text-sm text-[#2D2A26] cursor-pointer">
            <input
              type="checkbox"
              checked={draft.status === 'published'}
              onChange={e => set('status', e.target.checked ? 'published' : 'draft')}
              className="w-4 h-4 accent-[#C86A43]"
            />
            Published — visible on your profile and in the Village
          </label>
          <ConfirmButton
            label="Delete series"
            confirmLabel="Yes, delete"
            message={`Delete "${series.title}"? Episodes stay published, they just leave this series.`}
            onConfirm={() => void handleDelete()}
            className="text-xs text-[#9CA3AF] hover:text-red-500 transition-colors shrink-0"
          />
        </div>

        {saveError && <p className="text-sm text-red-600 font-medium">{saveError}</p>}

        <div className="flex items-center gap-3">
          <button onClick={() => void handleSave()} disabled={saving}
            className="px-5 py-2 bg-[#C86A43] text-white text-sm font-semibold rounded-lg hover:bg-[#b05a35] disabled:opacity-60 transition-colors">
            {saving ? 'Saving…' : 'Save'}
          </button>
          {saved && <p className="text-sm text-green-600 font-medium">Saved ✓</p>}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#E8E4DD] p-5 flex flex-col gap-3">
        <p className="text-sm font-semibold text-[#2D2A26]">Episodes</p>

        {episodes.length === 0 ? (
          <p className="text-xs text-[#9CA3AF]">No episodes yet — add one of your published stories below.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {episodes.map((ep, i) => (
              <div key={ep.id} className="flex items-center gap-3 border border-[#E8E4DD] rounded-lg px-3 py-2.5">
                <span className="text-xs font-semibold text-[#9CA3AF] w-6 text-center shrink-0">{i + 1}</span>
                <img src={ep.coverImage} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0 bg-[#F3EDE6]" />
                <p className="text-sm font-medium text-[#2D2A26] truncate flex-1">{ep.title}</p>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => void handleMove(i, -1)} disabled={i === 0}
                    className="w-7 h-7 rounded-lg border border-[#E8E4DD] text-[#6B7280] hover:border-[#C86A43]/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors" aria-label="Move up">↑</button>
                  <button onClick={() => void handleMove(i, 1)} disabled={i === episodes.length - 1}
                    className="w-7 h-7 rounded-lg border border-[#E8E4DD] text-[#6B7280] hover:border-[#C86A43]/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors" aria-label="Move down">↓</button>
                </div>
                <Link to={`/dashboard/profile?tab=content&contentSubTab=published&storyId=${ep.id}`}
                  className="text-xs font-semibold text-[#C86A43] hover:underline shrink-0">
                  Edit episode →
                </Link>
                <button onClick={() => void handleRemoveEpisode(ep.id)} className="text-xs text-[#9CA3AF] hover:text-red-500 transition-colors shrink-0">
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        {availableStories.length > 0 ? (
          <div className="flex items-center gap-2 pt-2 border-t border-[#F3EDE6] mt-1">
            <select value={addingId} onChange={e => setAddingId(e.target.value)} className={inputClass}>
              <option value="">Add a published story as the next episode…</option>
              {availableStories.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
            </select>
            <button onClick={() => void handleAddEpisode()} disabled={!addingId}
              className="px-4 py-2.5 bg-[#2D2A26] text-white text-sm font-semibold rounded-lg hover:bg-[#1a1815] disabled:opacity-40 transition-colors shrink-0">
              Add
            </button>
          </div>
        ) : (
          <p className="text-xs text-[#9CA3AF] pt-2 border-t border-[#F3EDE6] mt-1">
            Every published story is already in a series, or you haven't published one yet — {' '}
            <Link to="/dashboard/publish" className="text-[#C86A43] hover:underline font-medium">publish one</Link> to add it here.
          </p>
        )}
      </div>
    </div>
  )
}
