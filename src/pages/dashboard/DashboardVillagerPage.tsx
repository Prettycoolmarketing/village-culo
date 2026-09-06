import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { getCurrentFounderId } from '../../services/currentFounder'
import { getFounder } from '../../services/founders'
import { buildStoryFromImport, publishStoryCore } from '../../services/publishStory'
import { importedContentService } from '../../services/importedContent'
import { SavedRow, isReadyToPublish, hasRealCaption } from './DashboardImportContentPage'
import type { ImportedContent } from '../../types/importedContent'

// Villager — where a founder lands right after importing (see the "Go to
// Content" banner on Import Content). Its own sidebar page, not a tab buried
// inside Content/Profile, so it doesn't get crowded next to Imported/
// Published/Series — this is meant to be the very next stop after
// importing, not one browsing option among several.
//
// Splits every unpublished import into what's already captioned and ready
// to check off (Ready) and what still needs a caption/blog before it can go
// out (Review), across every platform at once — not a filter buried
// per-platform inside Imported content.
export function DashboardVillagerPage() {
  const { user } = useAuth()
  const founderId = getCurrentFounderId(user) ?? 'dev-user'
  const founder = getFounder(founderId)
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [view, setView] = useState<'ready' | 'review'>(() => (searchParams.get('view') === 'review' ? 'review' : 'ready'))
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [bulkPublishing, setBulkPublishing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  void tick
  const allImported = importedContentService.getAll({ founderId })
  const notPublished = allImported.filter(i => !i.relatedStoryId)
  const isReady = (i: ImportedContent) => !i.flaggedForReview && isReadyToPublish(i) && hasRealCaption(i)
  const readyItems = notPublished.filter(isReady)
  const reviewItems = notPublished.filter(i => !isReady(i))
  const shown = view === 'ready' ? readyItems : reviewItems

  function setViewAndUrl(v: 'ready' | 'review') {
    setView(v)
    setSearchParams(prev => {
      const p = new URLSearchParams(prev)
      p.set('view', v)
      return p
    }, { replace: true })
  }

  function toggleChecked(id: string) {
    setChecked(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  function handleDelete(id: string) {
    importedContentService.delete(id)
    setTick(t => t + 1)
  }

  async function publishItems(items: ImportedContent[]) {
    if (!founder || items.length === 0) return
    setBulkPublishing(true)
    setError(null)
    for (const item of items) {
      const story = buildStoryFromImport(item, founder)
      const result = await publishStoryCore(story)
      if (result.success) await importedContentService.updateStatus(item.id, 'published')
      else setError(result.error ?? `Could not publish "${item.title}". Please try again.`)
    }
    setChecked(new Set())
    setBulkPublishing(false)
    setTick(t => t + 1)
  }

  if (!founder) return null

  return (
    <div className="p-8" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <h1 className="text-2xl font-bold text-[#2D2A26] mb-1">Villager</h1>
      <p className="text-sm text-[#9CA3AF] mb-6">
        Everything you've imported, sorted into what's ready to publish right now and what still needs a caption or title first.
      </p>

      <div className="flex gap-2 mb-4">
        {(['ready', 'review'] as const).map(v => (
          <button key={v} onClick={() => setViewAndUrl(v)}
            className={`px-4 py-2 rounded-lg text-base font-semibold border transition-colors ${
              view === v ? 'bg-[#2D2A26] text-white border-[#2D2A26]' : 'bg-white text-[#6B7280] border-[#E8E4DD] hover:border-[#C86A43]/50'
            }`}>
            {v === 'ready' ? `Ready ${readyItems.length}` : `Review ${reviewItems.length}`}
          </button>
        ))}
      </div>

      {error && <p className="text-xs text-red-600 font-medium mb-3">{error}</p>}

      {view === 'ready' && readyItems.length > 0 && (
        <div className="flex items-center justify-between gap-3 mb-4 px-4 py-2.5 bg-[#5E6B4A]/10 border border-[#5E6B4A]/20 rounded-lg flex-wrap">
          <p className="text-xs text-[#5E6B4A] font-medium">
            {readyItems.length} {readyItems.length === 1 ? 'item' : 'items'} already {readyItems.length === 1 ? 'has' : 'have'} a real caption — ready to go live as-is.
          </p>
          <div className="flex items-center gap-2">
            {checked.size > 0 && (
              <button
                onClick={() => void publishItems(readyItems.filter(i => checked.has(i.id)))}
                disabled={bulkPublishing}
                className="shrink-0 px-4 py-2 bg-white border border-[#5E6B4A]/40 text-[#5E6B4A] text-xs font-semibold rounded-lg hover:bg-[#5E6B4A]/10 disabled:opacity-50 transition-colors"
              >
                Publish {checked.size} selected
              </button>
            )}
            <button
              onClick={() => void publishItems(readyItems)}
              disabled={bulkPublishing}
              className="shrink-0 px-4 py-2 bg-[#5E6B4A] text-white text-xs font-semibold rounded-lg hover:bg-[#4a5539] disabled:opacity-50 transition-colors"
            >
              {bulkPublishing ? 'Publishing…' : `Publish all ${readyItems.length} ready`}
            </button>
          </div>
        </div>
      )}

      {view === 'review' && reviewItems.length > 0 && (
        <p className="text-xs text-[#9CA3AF] mb-4">
          Missing a real caption, a title, or flagged for a look — open one to fix it up, then it'll move to Ready on its own.
        </p>
      )}

      {shown.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E8E4DD] px-5 py-8 text-center">
          <p className="text-sm font-semibold text-[#2D2A26]">
            {view === 'ready' ? 'Nothing ready to publish yet.' : 'Nothing needs review — everything imported is ready to go.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#E8E4DD] divide-y divide-[#F3EDE6]">
          {shown.map(item => (
            <SavedRow
              key={item.id}
              item={item}
              checked={checked.has(item.id)}
              onToggleCheck={() => toggleChecked(item.id)}
              onAdvancedEdit={() => navigate(`/dashboard/profile?tab=content&editImportedId=${item.id}`)}
              onDelete={() => handleDelete(item.id)}
              onStatusChange={status => void importedContentService.updateStatus(item.id, status).then(() => setTick(t => t + 1))}
            />
          ))}
        </div>
      )}
    </div>
  )
}
