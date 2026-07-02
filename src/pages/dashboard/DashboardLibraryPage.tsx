import { useState } from 'react'
import { getLibraryItems, updateLibraryItem, deleteLibraryItem, duplicateLibraryItem } from '../../services/library'
import { getFounders } from '../../services/founders'
import { getBusinesses } from '../../services/businesses'
import { Tabs } from '../../components/dashboard/Tabs'
import { MissingAssetsPanel } from '../../components/dashboard/MissingAssetsPanel'
import { FeaturedInPanel } from '../../components/dashboard/FeaturedInPanel'
import { RelationshipsPanel } from '../../components/dashboard/RelationshipsPanel'
import { HealthBadge } from '../../components/dashboard/PublishingHealth'
import { OverflowMenu } from '../../components/ui/OverflowMenu'
import { getLibraryMissingItems } from '../../utils/missingAssets'
import { getLibraryItemFeaturedIn } from '../../utils/featuredIn'
import { focusField } from '../../utils/focusField'
import type { LibraryItem } from '../../types'
import { normalizeUrl } from '../../utils/url'

const inputClass =
  'w-full px-3 py-2.5 rounded-lg border border-[#E8E4DD] text-sm text-[#2D2A26] bg-white placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#C86A43]/30 focus:border-[#C86A43] transition-colors'

// ─── Detail pane ──────────────────────────────────────────────────────────────

interface LibraryDetailPaneProps {
  item: LibraryItem
  onClose: () => void
  onSave: (i: LibraryItem) => void
  onDuplicated: (i: LibraryItem) => void
  onDeleted: () => void
}

function LibraryDetailPane({ item, onClose, onSave, onDuplicated, onDeleted }: LibraryDetailPaneProps) {
  const [draft, setDraft] = useState<LibraryItem>({ ...item })
  const [tab, setTab]     = useState('overview')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const missing    = getLibraryMissingItems(draft)
  const featuredIn = getLibraryItemFeaturedIn(item.id)

  const itemFounders = getFounders().filter(f => draft.authorFounderId === f.id)
  const itemBizs     = getBusinesses().filter(b => draft.businessId === b.id)

  function set<K extends keyof LibraryItem>(key: K, value: LibraryItem[K]) {
    setDraft(prev => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    setSaveError(null)
    const result = await updateLibraryItem(draft)
    setSaving(false)
    if (result.success) {
      setSaved(true)
      onSave(draft)
    } else {
      setSaveError(result.error ?? 'Save failed. Please try again.')
    }
  }

  async function handleDuplicate() {
    const result = await duplicateLibraryItem(item.id)
    if (result.success) {
      const copy = getLibraryItems().find(i => i.title === `${item.title} (Copy)`)
      if (copy) onDuplicated(copy)
    } else {
      setSaveError(result.error ?? 'Could not duplicate this item.')
    }
  }

  async function handleArchiveToggle() {
    const nextStatus = draft.status === 'archived' ? 'coming-soon' : 'archived'
    const next = { ...draft, status: nextStatus as LibraryItem['status'] }
    setDraft(next)
    const result = await updateLibraryItem(next)
    if (result.success) onSave(next)
    else setSaveError(result.error ?? 'Save failed. Please try again.')
  }

  async function handleDelete() {
    const result = await deleteLibraryItem(item.id)
    if (result.success) onDeleted()
    else setSaveError(result.error ?? 'Could not delete this item.')
  }

  const TABS = [
    { key: 'overview',      label: 'Overview'      },
    { key: 'relationships', label: 'Relationships', badge: itemFounders.length + itemBizs.length },
    { key: 'featured-in',   label: 'Featured In',   badge: featuredIn.length },
    { key: 'improve',       label: 'Improve',        badge: missing.length },
  ]

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8E4DD]">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-[#2D2A26] truncate">{draft.title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <HealthBadge missing={missing} />
            {draft.status === 'archived' && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[#F3EDE6] text-[#9CA3AF]">Archived</span>
            )}
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
            {draft.coverImage && (
              <img src={draft.coverImage} alt="" className="w-full h-32 rounded-xl object-cover bg-[#F3EDE6]" />
            )}
            <div>
              <label className="block text-xs font-medium text-[#6B7280] mb-1">Title</label>
              <input id="title" type="text" value={draft.title} onChange={e => set('title', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6B7280] mb-1">Description</label>
              <textarea id="description" value={draft.description} onChange={e => set('description', e.target.value)} rows={4} className={inputClass + ' resize-y'} />
            </div>
            <div className="flex flex-col gap-2 text-xs">
              {[
                ['Type',   draft.productType],
                ['Status', draft.status],
                ['Price',  draft.price ?? 'Free'],
              ].map(([label, val]) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-[#9CA3AF]">{label}</span>
                  <span className={`font-medium ${
                    label === 'Status' && (draft.status === 'available' || draft.status === 'free-download') ? 'text-green-600' :
                    label === 'Status' && draft.status === 'coming-soon' ? 'text-amber-600' :
                    'text-[#2D2A26]'
                  }`}>{val}</span>
                </div>
              ))}
            </div>
            {draft.purchaseLinks.length > 0 && (
              <a href={normalizeUrl(draft.purchaseLinks[0].url)} target="_blank" rel="noopener noreferrer"
                className="text-xs text-[#C86A43] hover:underline">
                {draft.purchaseLinks[0].label} ↗
              </a>
            )}
            <a href={`/library/${draft.slug}`} target="_blank" rel="noopener noreferrer"
              className="text-xs text-[#9CA3AF] hover:text-[#C86A43] transition-colors">View on site ↗</a>
          </div>
        )}

        {tab === 'relationships' && (
          <RelationshipsPanel
            groups={[
              {
                title: 'Founder',
                items: itemFounders.map(f => ({ id: f.id, label: f.name, sublabel: f.industry.name, path: `/founders/${f.slug}`, image: f.avatar })),
              },
              {
                title: 'Business',
                items: itemBizs.map(b => ({ id: b.id, label: b.name, sublabel: b.location.name, path: `/businesses/${b.slug}`, image: b.logo })),
              },
            ]}
          />
        )}

        {tab === 'featured-in' && (
          <FeaturedInPanel locations={featuredIn} />
        )}

        {tab === 'improve' && (
          <MissingAssetsPanel items={missing} onAction={item => { setTab('overview'); focusField(item.field) }} />
        )}
      </div>
    </div>
  )
}

// ─── DashboardLibraryPage ─────────────────────────────────────────────────────

export function DashboardLibraryPage() {
  const [selectedId, setSelectedId] = useState<string | null>(() => getLibraryItems()[0]?.id ?? null)
  const [search,     setSearch]     = useState('')
  const [tick, setTick] = useState(0)
  const refresh = () => setTick(t => t + 1)
  void tick

  const allItems = getLibraryItems()
  const filtered = search
    ? allItems.filter(i => i.title.toLowerCase().includes(search.toLowerCase()))
    : allItems

  const selected = allItems.find(i => i.id === selectedId) ?? null

  return (
    <div className="flex h-full" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── List ──────────────────────────────────────────────────────── */}
      <div className={`flex flex-col overflow-hidden ${selected ? 'flex-1 min-w-0 border-r border-[#E8E4DD]' : 'w-full'}`}>
        <div className="flex items-center justify-between px-8 pt-8 pb-4 shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-[#2D2A26]">Library</h1>
            <p className="text-sm text-[#6B7280] mt-1">{allItems.length} products, guides and resources</p>
          </div>
        </div>

        <div className="px-8 pb-5 shrink-0">
          <input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search library…"
            className="w-full max-w-sm px-3 py-2.5 rounded-lg border border-[#E8E4DD] text-sm text-[#2D2A26] bg-white focus:outline-none focus:ring-2 focus:ring-[#C86A43]/30 focus:border-[#C86A43] transition-colors"
          />
        </div>

        <div className="flex-1 overflow-y-auto px-8 pb-8">
          <div className="bg-white rounded-xl border border-[#E8E4DD] divide-y divide-[#F3EDE6]">
            {filtered.map(item => {
              const missing  = getLibraryMissingItems(item)
              const recommended = missing.filter(m => m.severity === 'critical').length
              return (
                <div key={item.id} onClick={() => setSelectedId(selectedId === item.id ? null : item.id)}
                  className={`w-full text-left flex items-center gap-4 px-5 py-4 transition-colors cursor-pointer ${
                    selectedId === item.id ? 'bg-[#C86A43]/5 border-l-2 border-[#C86A43]' : 'hover:bg-[#FDFCFB]'
                  }`}>
                  <img src={item.coverImage} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0 bg-[#F3EDE6]" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#2D2A26] truncate">{item.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-[#9CA3AF]">{item.productType}</p>
                      {recommended > 0 && (
                        <span className="text-[9px] font-bold px-1 py-0.5 rounded-full bg-[#FBF1EB] text-[#C86A43]">{recommended}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      item.status === 'available' || item.status === 'free-download' ? 'bg-green-100 text-green-700' :
                      item.status === 'coming-soon' ? 'bg-amber-100 text-amber-700' :
                      'bg-[#F3EDE6] text-[#9CA3AF]'
                    }`}>
                      {item.status}
                    </span>
                    {missing.length > 0 && <HealthBadge missing={missing} />}
                    <OverflowMenu
                      archived={item.status === 'archived'}
                      onEdit={() => setSelectedId(item.id)}
                      onDuplicate={() => { void duplicateLibraryItem(item.id).then(refresh) }}
                      onArchive={() => { void updateLibraryItem({ ...item, status: 'archived' }).then(refresh) }}
                      onRestore={() => { void updateLibraryItem({ ...item, status: 'coming-soon' }).then(refresh) }}
                      onDelete={() => { void deleteLibraryItem(item.id).then(() => { if (selectedId === item.id) setSelectedId(null); refresh() }) }}
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
          <LibraryDetailPane
            key={selected.id}
            item={selected}
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
