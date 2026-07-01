import { useState } from 'react'
import { getIdeas, updateIdea, deleteIdea, duplicateIdea } from '../../services/ideas'
import { getStories } from '../../services/stories'
import { getFounders } from '../../services/founders'
import { getBusinesses } from '../../services/businesses'
import { Tabs } from '../../components/dashboard/Tabs'
import { FeaturedInPanel } from '../../components/dashboard/FeaturedInPanel'
import { RelationshipsPanel } from '../../components/dashboard/RelationshipsPanel'
import { OverflowMenu } from '../../components/ui/OverflowMenu'
import { getIdeaFeaturedIn } from '../../utils/featuredIn'
import type { Idea } from '../../types'

const inputClass =
  'w-full px-3 py-2.5 rounded-lg border border-[#E8E4DD] text-sm text-[#2D2A26] bg-white placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#C86A43]/30 focus:border-[#C86A43] transition-colors'

// ─── Idea detail pane ─────────────────────────────────────────────────────────

interface IdeaDetailPaneProps {
  idea: Idea
  onClose: () => void
  onSave: (idea: Idea) => void
  onDuplicated: (idea: Idea) => void
  onDeleted: () => void
}

function IdeaDetailPane({ idea, onClose, onSave, onDuplicated, onDeleted }: IdeaDetailPaneProps) {
  const [tab, setTab] = useState('overview')
  const [draft, setDraft] = useState<Idea>({ ...idea })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const featuredIn     = getIdeaFeaturedIn(idea.id)
  const relatedStories = getStories({ ids: idea.relatedStoryIds })
  const relatedFnders  = getFounders({ ids: idea.relatedFounderIds })
  const relatedBizs    = getBusinesses({ ids: idea.relatedBusinessIds })

  const TABS = [
    { key: 'overview',      label: 'Overview'      },
    { key: 'relationships', label: 'Relationships', badge: relatedStories.length + relatedFnders.length },
    { key: 'featured-in',   label: 'Featured In',   badge: featuredIn.length },
  ]

  function set<K extends keyof Idea>(key: K, value: Idea[K]) {
    setDraft(prev => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    setSaveError(null)
    const result = await updateIdea(draft)
    setSaving(false)
    if (result.success) {
      setSaved(true)
      onSave(draft)
    } else {
      setSaveError(result.error ?? 'Save failed. Please try again.')
    }
  }

  async function handleDuplicate() {
    const result = await duplicateIdea(idea.id)
    if (result.success) {
      const copy = getIdeas().find(i => i.title === `${idea.title} (Copy)`)
      if (copy) onDuplicated(copy)
    } else {
      setSaveError(result.error ?? 'Could not duplicate this idea.')
    }
  }

  async function handleArchiveToggle() {
    const nextStatus = draft.status === 'archived' ? 'published' : 'archived'
    const next = { ...draft, status: nextStatus as Idea['status'] }
    setDraft(next)
    const result = await updateIdea(next)
    if (result.success) onSave(next)
    else setSaveError(result.error ?? 'Save failed. Please try again.')
  }

  async function handleDelete() {
    const result = await deleteIdea(idea.id)
    if (result.success) onDeleted()
    else setSaveError(result.error ?? 'Could not delete this idea.')
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8E4DD]">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-[#2D2A26] truncate">{draft.title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            {draft.featured && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[#D6A94D]/15 text-[#D6A94D]">Featured</span>
            )}
            {draft.status === 'archived' && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[#F3EDE6] text-[#9CA3AF]">Archived</span>
            )}
            <span className="text-[10px] text-[#9CA3AF]">{relatedStories.length} stories</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          {saved && <span className="text-xs text-green-600">Saved ✓</span>}
          {saveError && <span className="text-xs text-red-600">{saveError}</span>}
          <button onClick={() => void handleSave()} disabled={saving}
            className="px-2.5 py-1 bg-[#C86A43] text-white text-xs font-semibold rounded-lg hover:bg-[#b05a35] disabled:opacity-60 transition-colors">
            {saving ? 'Saving…' : 'Save'}
          </button>
          <OverflowMenu
            archived={draft.status === 'archived'}
            onDuplicate={() => void handleDuplicate()}
            onArchive={() => void handleArchiveToggle()}
            onRestore={() => void handleArchiveToggle()}
            onDelete={() => void handleDelete()}
          />
          <button onClick={onClose} className="text-[#9CA3AF] hover:text-[#2D2A26] text-lg leading-none">×</button>
        </div>
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} className="px-5" />

      <div className="flex-1 overflow-y-auto px-5 py-4">

        {tab === 'overview' && (
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-medium text-[#6B7280] mb-1">Title</label>
              <input type="text" value={draft.title} onChange={e => set('title', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6B7280] mb-1">Description</label>
              <textarea value={draft.description} onChange={e => set('description', e.target.value)} rows={5} className={inputClass + ' resize-y'} />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6B7280] mb-1">Quote (optional)</label>
              <textarea value={draft.quote ?? ''} onChange={e => set('quote', e.target.value || undefined)} rows={2} className={inputClass + ' resize-y'} />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {draft.topics.map(t => (
                <span key={t.id} className="text-[10px] px-2 py-0.5 rounded-full bg-[#F3EDE6] text-[#6B7280]">{t.name}</span>
              ))}
            </div>
            <div className="bg-white rounded-xl border border-[#E8E4DD] px-4 py-3">
              <p className="text-xs font-semibold text-[#6B7280] mb-1">Created</p>
              <p className="text-xs text-[#9CA3AF]">{draft.createdAt}</p>
            </div>
            <a href={`/ideas/${draft.slug}`} target="_blank" rel="noopener noreferrer"
              className="text-xs text-[#C86A43] hover:underline">View on site ↗</a>
          </div>
        )}

        {tab === 'relationships' && (
          <RelationshipsPanel
            groups={[
              {
                title: 'Stories',
                items: relatedStories.map(s => ({ id: s.id, label: s.title, sublabel: s.contentTypes.join(' · '), path: `/stories/${s.slug}`, image: s.coverImage })),
              },
              {
                title: 'Founders',
                items: relatedFnders.map(f => ({ id: f.id, label: f.name, sublabel: f.industry.name, path: `/founders/${f.slug}`, image: f.avatar })),
              },
              {
                title: 'Businesses',
                items: relatedBizs.map(b => ({ id: b.id, label: b.name, sublabel: b.location.name, path: `/businesses/${b.slug}`, image: b.logo })),
              },
            ]}
          />
        )}

        {tab === 'featured-in' && (
          <FeaturedInPanel locations={featuredIn} />
        )}
      </div>
    </div>
  )
}

// ─── DashboardIdeasPage ────────────────────────────────────────────────────────

export function DashboardIdeasPage() {
  const [search,     setSearch]     = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [tick, setTick] = useState(0)
  const refresh = () => setTick(t => t + 1)
  void tick

  const allIdeas = getIdeas()
  const ideaList = search
    ? allIdeas.filter(i => i.title.toLowerCase().includes(search.toLowerCase()) || i.description.toLowerCase().includes(search.toLowerCase()))
    : allIdeas

  const selected = allIdeas.find(i => i.id === selectedId) ?? null

  return (
    <div className="flex h-full" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── List ──────────────────────────────────────────────────────── */}
      <div className={`flex flex-col overflow-hidden ${selected ? 'flex-1 min-w-0 border-r border-[#E8E4DD]' : 'w-full'}`}>
        <div className="flex items-center justify-between px-8 pt-8 pb-4 shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-[#2D2A26]">Ideas</h1>
            <p className="text-sm text-[#6B7280] mt-1">{allIdeas.length} ideas in the knowledge graph</p>
          </div>
        </div>

        <div className="px-8 pb-5 shrink-0">
          <input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search ideas…"
            className="w-full max-w-sm px-3 py-2.5 rounded-lg border border-[#E8E4DD] text-sm text-[#2D2A26] bg-white focus:outline-none focus:ring-2 focus:ring-[#C86A43]/30 focus:border-[#C86A43] transition-colors"
          />
        </div>

        <div className="flex-1 overflow-y-auto px-8 pb-8">
          <div className="bg-white rounded-xl border border-[#E8E4DD] divide-y divide-[#F3EDE6]">
            {ideaList.length === 0 ? (
              <p className="px-5 py-8 text-sm text-[#9CA3AF] text-center">No ideas match your search.</p>
            ) : ideaList.map(idea => {
              const relCount = idea.relatedStoryIds.length + idea.relatedFounderIds.length + idea.relatedBusinessIds.length
              return (
                <div key={idea.id}
                  onClick={() => setSelectedId(selectedId === idea.id ? null : idea.id)}
                  className={`w-full text-left flex items-start gap-4 px-5 py-4 transition-colors cursor-pointer ${
                    selectedId === idea.id ? 'bg-[#C86A43]/5 border-l-2 border-[#C86A43]' : 'hover:bg-[#FDFCFB]'
                  }`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-[#2D2A26]">{idea.title}</p>
                      {idea.featured && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#D6A94D]/15 text-[#D6A94D]">Featured</span>
                      )}
                      {idea.status === 'archived' && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F3EDE6] text-[#9CA3AF]">Archived</span>
                      )}
                    </div>
                    <p className="text-xs text-[#6B7280] mt-1 line-clamp-2">{idea.description}</p>
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      {idea.topics.slice(0, 3).map(t => (
                        <span key={t.id} className="text-[10px] px-1.5 py-0.5 rounded bg-[#F3EDE6] text-[#6B7280]">{t.name}</span>
                      ))}
                    </div>
                  </div>
                  <div className="shrink-0 text-right flex items-start gap-1">
                    <div>
                      <p className="text-xs text-[#9CA3AF]">{idea.relatedStoryIds.length} stories</p>
                      {relCount > 0 && <p className="text-[10px] text-[#9CA3AF] mt-0.5">{relCount} connected</p>}
                    </div>
                    <OverflowMenu
                      archived={idea.status === 'archived'}
                      onEdit={() => setSelectedId(idea.id)}
                      onDuplicate={() => { void duplicateIdea(idea.id).then(refresh) }}
                      onArchive={() => { void updateIdea({ ...idea, status: 'archived' }).then(refresh) }}
                      onRestore={() => { void updateIdea({ ...idea, status: 'published' }).then(refresh) }}
                      onDelete={() => { void deleteIdea(idea.id).then(() => { if (selectedId === idea.id) setSelectedId(null); refresh() }) }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Detail pane ────────────────────────────────────────────── */}
      {selected && (
        <div className="w-72 shrink-0 bg-white border-l border-[#E8E4DD] flex flex-col overflow-hidden">
          <IdeaDetailPane
            key={selected.id}
            idea={selected}
            onClose={() => setSelectedId(null)}
            onSave={refresh}
            onDuplicated={copy => { setSelectedId(copy.id); refresh() }}
            onDeleted={() => { setSelectedId(null); refresh() }}
          />
        </div>
      )}
    </div>
  )
}
