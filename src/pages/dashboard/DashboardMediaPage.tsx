import { useState } from 'react'
import { getMedia, getMediaUsedIn, updateMedia, deleteMedia, duplicateMedia } from '../../services/media'
import { Tabs } from '../../components/dashboard/Tabs'
import { getMediaMissingItems } from '../../utils/missingAssets'
import { focusField } from '../../utils/focusField'
import { HealthBadge } from '../../components/dashboard/PublishingHealth'
import { MissingAssetsPanel } from '../../components/dashboard/MissingAssetsPanel'
import { OverflowMenu } from '../../components/ui/OverflowMenu'
import type { Media, ApprovalStatus } from '../../types'

// ─── Detail panel ─────────────────────────────────────────────────────────────

const inputClass = 'w-full px-3 py-2 rounded-lg border border-[#E8E4DD] text-xs text-[#2D2A26] bg-white placeholder:text-[#9CA3AF] focus:outline-none focus:ring-1 focus:ring-[#C86A43]/30 focus:border-[#C86A43] transition-colors'

interface MediaDetailPanelProps {
  item: Media
  onClose: () => void
  onSave: (m: Media) => void
  onDuplicated: (m: Media) => void
  onDeleted: () => void
}

function MediaDetailPanel({ item, onClose, onSave, onDuplicated, onDeleted }: MediaDetailPanelProps) {
  const [draft, setDraft] = useState<Media>({ ...item })
  const [tab, setTab]     = useState('details')
  const [saved, setSaved] = useState(false)

  const usedIn  = getMediaUsedIn(draft.id)
  const missing = getMediaMissingItems(draft)

  function set<K extends keyof Media>(key: K, value: Media[K]) {
    setDraft(prev => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  function handleSave() {
    updateMedia(draft)
    setSaved(true)
    onSave(draft)
  }

  function handleDuplicate() {
    const copy = duplicateMedia(item.id)
    if (copy) onDuplicated(copy)
  }

  function handleDelete() {
    deleteMedia(item.id)
    onDeleted()
  }

  const usedCount =
    usedIn.founders.length + usedIn.businesses.length +
    usedIn.stories.length  + usedIn.library.length

  const TABS = [
    { key: 'details',   label: 'Details'        },
    { key: 'used-in',   label: 'Used In', badge: usedCount },
    { key: 'improve',   label: 'Improve', badge: missing.length },
  ]

  const isVideo = draft.mediaType === 'video' || draft.mediaType === 'reel' || draft.mediaType === 'youtube-video'

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8E4DD]">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[#2D2A26] truncate">{draft.title}</p>
          <HealthBadge missing={missing} />
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          {saved && <span className="text-xs text-green-600">Saved ✓</span>}
          <button onClick={handleSave}
            className="px-2.5 py-1 bg-[#C86A43] text-white text-xs font-semibold rounded-lg hover:bg-[#b05a35] transition-colors">
            Save
          </button>
          <OverflowMenu onDuplicate={handleDuplicate} onDelete={handleDelete} />
          <button onClick={onClose} className="text-[#9CA3AF] hover:text-[#2D2A26] transition-colors text-lg leading-none">×</button>
        </div>
      </div>

      {/* Preview */}
      <div className="mx-5 mt-4 rounded-xl overflow-hidden bg-[#F3EDE6] aspect-video flex items-center justify-center shrink-0">
        {isVideo ? (
          <div className="text-center text-[#9CA3AF] text-sm p-4">
            <p className="text-2xl mb-2">▶</p>
            <p>Video asset</p>
          </div>
        ) : (
          <img src={draft.fileUrl} alt={draft.altText} className="w-full h-full object-contain" />
        )}
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} className="px-5 mt-3" />

      <div className="flex-1 overflow-y-auto px-5 py-4">

        {/* Details */}
        {tab === 'details' && (
          <div className="flex flex-col gap-3">
            {/* Editable: File URL */}
            <div>
              <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-widest mb-1">File URL</p>
              <input type="url" value={draft.fileUrl} onChange={e => set('fileUrl', e.target.value)}
                className={inputClass} placeholder="/assets/image.jpg" />
            </div>

            {/* Editable: Alt Text */}
            <div>
              <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-widest mb-1">Alt Text</p>
              <input id="altText" type="text" value={draft.altText} onChange={e => set('altText', e.target.value)}
                className={inputClass} placeholder="Describe the image…" />
            </div>

            {/* Editable: Caption */}
            <div>
              <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-widest mb-1">Caption</p>
              <input id="caption" type="text" value={draft.caption ?? ''} onChange={e => set('caption', e.target.value || undefined)}
                className={inputClass} placeholder="Optional caption…" />
            </div>

            {/* Editable: Approval status */}
            <div id="approved">
              <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-widest mb-1">Status</p>
              <div className="flex gap-2 flex-wrap">
                {(['approved', 'needs-review', 'pending', 'rejected'] as const).map(s => (
                  <button key={s} onClick={() => set('approvalStatus', s)}
                    className={`px-2 py-1 rounded text-xs border font-medium transition-colors ${
                      draft.approvalStatus === s
                        ? s === 'approved' ? 'bg-green-500 text-white border-green-500'
                        : s === 'rejected' ? 'bg-red-500 text-white border-red-500'
                        : 'bg-amber-400 text-white border-amber-400'
                        : 'bg-white text-[#6B7280] border-[#E8E4DD] hover:border-[#C86A43]/50'
                    }`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Read-only metadata */}
            <div className="flex flex-col gap-2 pt-2 border-t border-[#F3EDE6]">
              {[['Type', draft.mediaType], ['Role', draft.assetRole], ['Source', draft.sourceType], ['Created', draft.createdAt]].map(([label, val]) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-xs text-[#9CA3AF]">{label}</span>
                  <span className="text-xs font-medium text-[#2D2A26]">{val}</span>
                </div>
              ))}
            </div>

            {draft.sourceUrl && (
              <div className="pt-2 border-t border-[#F3EDE6]">
                <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-widest mb-1">Source URL</p>
                <a href={draft.sourceUrl} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-[#C86A43] hover:underline break-all">{draft.sourceUrl}</a>
              </div>
            )}
          </div>
        )}

        {/* Used In */}
        {tab === 'used-in' && (
          <div>
            {usedCount === 0 ? (
              <p className="text-xs text-[#9CA3AF] text-center py-8">Not linked to any Village content yet.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {usedIn.founders.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-widest mb-2">Founders</p>
                    {usedIn.founders.map(f => (
                      <a key={f.id} href={`/founders/${f.slug}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 py-1.5 text-xs text-[#2D2A26] hover:text-[#C86A43] transition-colors">
                        <img src={f.avatar} alt="" className="w-5 h-5 rounded-full object-cover shrink-0" />
                        {f.name}
                      </a>
                    ))}
                  </div>
                )}
                {usedIn.businesses.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-widest mb-2">Businesses</p>
                    {usedIn.businesses.map(b => (
                      <a key={b.id} href={`/businesses/${b.slug}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 py-1.5 text-xs text-[#2D2A26] hover:text-[#C86A43] transition-colors">
                        <img src={b.logo} alt="" className="w-5 h-5 rounded object-cover shrink-0" />
                        {b.name}
                      </a>
                    ))}
                  </div>
                )}
                {usedIn.stories.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-widest mb-2">Stories</p>
                    {usedIn.stories.map(s => (
                      <a key={s.id} href={`/stories/${s.slug}`} target="_blank" rel="noopener noreferrer"
                        className="block py-1.5 text-xs text-[#2D2A26] hover:text-[#C86A43] transition-colors truncate">
                        {s.title}
                      </a>
                    ))}
                  </div>
                )}
                {usedIn.library.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-widest mb-2">Library</p>
                    {usedIn.library.map(l => (
                      <a key={l.id} href={`/library/${l.slug}`} target="_blank" rel="noopener noreferrer"
                        className="block py-1.5 text-xs text-[#2D2A26] hover:text-[#C86A43] transition-colors truncate">
                        {l.title}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Improve */}
        {tab === 'improve' && (
          <MissingAssetsPanel items={missing} onAction={item => { setTab('details'); focusField(item.field) }} />
        )}
      </div>
    </div>
  )
}

// ─── DashboardMediaPage ────────────────────────────────────────────────────────

const statusOptions: { value: ApprovalStatus | 'all'; label: string }[] = [
  { value: 'all',          label: 'All'         },
  { value: 'approved',     label: 'Approved'    },
  { value: 'needs-review', label: 'Needs Review'},
  { value: 'pending',      label: 'Pending'     },
  { value: 'rejected',     label: 'Rejected'    },
]

export function DashboardMediaPage() {
  const [selected,     setSelected]     = useState<Media | null>(() => getMedia()[0] ?? null)
  const [statusFilter, setStatusFilter] = useState<ApprovalStatus | 'all'>('all')
  const [typeFilter,   setTypeFilter]   = useState('all')
  const [tick, setTick] = useState(0)
  const refresh = () => setTick(t => t + 1)
  void tick

  const allMedia  = getMedia()
  const filtered  = allMedia.filter(m => {
    if (statusFilter !== 'all' && m.approvalStatus !== statusFilter) return false
    if (typeFilter   !== 'all' && m.mediaType !== typeFilter)        return false
    return true
  })

  const mediaTypes = [...new Set(allMedia.map(m => m.mediaType))]
  const pendingCount = allMedia.filter(m => m.approvalStatus === 'needs-review' || m.approvalStatus === 'pending').length

  return (
    <div className="flex h-full" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Main panel ────────────────────────────────────────────────── */}
      <div className={`flex flex-col flex-1 min-w-0 overflow-hidden ${selected ? 'border-r border-[#E8E4DD]' : ''}`}>

        <div className="flex items-center justify-between px-8 pt-8 pb-4 shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-[#2D2A26]">Media</h1>
            <p className="text-sm text-[#6B7280] mt-1">{filtered.length} of {allMedia.length} assets</p>
          </div>
          {pendingCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-700">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
              {pendingCount} need review
            </div>
          )}
        </div>

        <div className="px-8 pb-5 flex gap-3 flex-wrap shrink-0">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as ApprovalStatus | 'all')}
            className="px-3 py-2 rounded-lg border border-[#E8E4DD] text-sm text-[#2D2A26] bg-white focus:outline-none focus:ring-2 focus:ring-[#C86A43]/30 focus:border-[#C86A43] transition-colors">
            {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-[#E8E4DD] text-sm text-[#2D2A26] bg-white focus:outline-none focus:ring-2 focus:ring-[#C86A43]/30 focus:border-[#C86A43] transition-colors">
            <option value="all">All Types</option>
            {mediaTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto px-8 pb-8">
          {filtered.length === 0 ? (
            <p className="text-sm text-[#9CA3AF] text-center py-12">No assets match these filters.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {filtered.map(item => {
                const missing  = getMediaMissingItems(item)
                const recommended = missing.filter(m => m.severity === 'critical').length
                const isVideo2 = item.mediaType === 'video' || item.mediaType === 'reel' || item.mediaType === 'youtube-video'
                return (
                  <div key={item.id} onClick={() => setSelected(item.id === selected?.id ? null : item)}
                    className={`text-left rounded-xl overflow-hidden border transition-all cursor-pointer ${
                      selected?.id === item.id
                        ? 'border-[#C86A43] ring-2 ring-[#C86A43]/20'
                        : 'border-[#E8E4DD] hover:border-[#C86A43]/40 hover:shadow-sm'
                    }`}>
                    <div className="aspect-square bg-[#F3EDE6] overflow-hidden relative">
                      {isVideo2 ? (
                        <div className="absolute inset-0 flex items-center justify-center text-[#9CA3AF]">
                          <span className="text-2xl">▶</span>
                        </div>
                      ) : (
                        <img src={item.thumbnailUrl ?? item.fileUrl} alt={item.altText} className="w-full h-full object-cover" />
                      )}
                      <span className={`absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                        item.approvalStatus === 'approved'   ? 'bg-green-500 text-white' :
                        item.approvalStatus === 'rejected'   ? 'bg-red-500 text-white' :
                                                               'bg-amber-400 text-white'
                      }`}>
                        {item.approvalStatus === 'approved' ? '✓' : item.approvalStatus === 'rejected' ? '✕' : '!'}
                      </span>
                      {recommended > 0 && (
                        <span className="absolute bottom-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#C86A43] text-white">
                          {recommended}
                        </span>
                      )}
                    </div>
                    <div className="px-3 py-2.5 bg-white flex items-center justify-between gap-1">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-[#2D2A26] truncate">{item.title}</p>
                        <p className="text-[10px] text-[#9CA3AF] mt-0.5">{item.mediaType}</p>
                      </div>
                      <OverflowMenu
                        onEdit={() => setSelected(item)}
                        onDuplicate={() => { duplicateMedia(item.id); refresh() }}
                        onDelete={() => { deleteMedia(item.id); if (selected?.id === item.id) setSelected(null); refresh() }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Detail panel ──────────────────────────────────────────────── */}
      {selected && (
        <div className="w-72 shrink-0 overflow-y-auto bg-white flex flex-col">
          <MediaDetailPanel
            item={selected}
            onClose={() => setSelected(null)}
            onSave={refresh}
            onDuplicated={copy => { setSelected(copy); refresh() }}
            onDeleted={() => { setSelected(null); refresh() }}
          />
        </div>
      )}
    </div>
  )
}
