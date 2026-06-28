import { useState } from 'react'
import { getMedia, getMediaUsedIn } from '../../services/media'
import type { Media, ApprovalStatus } from '../../types'

// ─── Detail panel ─────────────────────────────────────────────────────────────

function MediaDetailPanel({ item, onClose }: { item: Media; onClose: () => void }) {
  const usedIn = getMediaUsedIn(item.id)

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8E4DD]">
        <p className="text-sm font-semibold text-[#2D2A26] truncate pr-2">{item.title}</p>
        <button onClick={onClose} className="text-[#9CA3AF] hover:text-[#2D2A26] transition-colors text-lg leading-none shrink-0">×</button>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {/* Preview */}
        <div className="mb-5 rounded-xl overflow-hidden bg-[#F3EDE6] aspect-video flex items-center justify-center">
          {item.mediaType === 'video' || item.mediaType === 'reel' || item.mediaType === 'youtube-video' ? (
            <div className="text-center text-[#9CA3AF] text-sm p-4">
              <p className="text-2xl mb-2">▶</p>
              <p>Video asset</p>
            </div>
          ) : (
            <img
              src={item.fileUrl}
              alt={item.altText}
              className="w-full h-full object-contain"
            />
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col gap-3 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#9CA3AF]">Type</span>
            <span className="text-xs font-medium text-[#2D2A26]">{item.mediaType}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#9CA3AF]">Role</span>
            <span className="text-xs font-medium text-[#2D2A26]">{item.assetRole}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#9CA3AF]">Source</span>
            <span className="text-xs font-medium text-[#2D2A26]">{item.sourceType}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#9CA3AF]">Status</span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              item.approvalStatus === 'approved'
                ? 'bg-green-100 text-green-700'
                : item.approvalStatus === 'needs-review' || item.approvalStatus === 'pending'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-red-100 text-red-700'
            }`}>
              {item.approvalStatus}
            </span>
          </div>
        </div>

        {/* Alt text */}
        {item.altText && (
          <div className="mb-4">
            <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-widest mb-1">Alt Text</p>
            <p className="text-xs text-[#6B7280]">{item.altText}</p>
          </div>
        )}

        {/* Caption */}
        {item.caption && (
          <div className="mb-4">
            <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-widest mb-1">Caption</p>
            <p className="text-xs text-[#6B7280]">{item.caption}</p>
          </div>
        )}

        {/* Used In */}
        <div>
          <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-widest mb-3">Used In</p>

          {usedIn.founders.length === 0 && usedIn.businesses.length === 0 && usedIn.stories.length === 0 && usedIn.library.length === 0 ? (
            <p className="text-xs text-[#9CA3AF]">Not linked to any Village content yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {usedIn.founders.length > 0 && (
                <div>
                  <p className="text-[10px] text-[#C86A43] font-semibold uppercase tracking-widest mb-1.5">Founders</p>
                  {usedIn.founders.map(f => (
                    <a key={f.id} href={`/founders/${f.id}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 py-1 text-xs text-[#2D2A26] hover:text-[#C86A43] transition-colors">
                      <img src={f.avatar} alt="" className="w-5 h-5 rounded-full object-cover" />
                      {f.name}
                    </a>
                  ))}
                </div>
              )}
              {usedIn.businesses.length > 0 && (
                <div>
                  <p className="text-[10px] text-[#C86A43] font-semibold uppercase tracking-widest mb-1.5">Businesses</p>
                  {usedIn.businesses.map(b => (
                    <a key={b.id} href={`/businesses/${b.id}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 py-1 text-xs text-[#2D2A26] hover:text-[#C86A43] transition-colors">
                      <img src={b.logo} alt="" className="w-5 h-5 rounded object-cover" />
                      {b.name}
                    </a>
                  ))}
                </div>
              )}
              {usedIn.stories.length > 0 && (
                <div>
                  <p className="text-[10px] text-[#C86A43] font-semibold uppercase tracking-widest mb-1.5">Stories</p>
                  {usedIn.stories.map(s => (
                    <a key={s.id} href={`/stories/${s.slug}`} target="_blank" rel="noopener noreferrer"
                      className="block py-1 text-xs text-[#2D2A26] hover:text-[#C86A43] transition-colors">
                      {s.title}
                    </a>
                  ))}
                </div>
              )}
              {usedIn.library.length > 0 && (
                <div>
                  <p className="text-[10px] text-[#C86A43] font-semibold uppercase tracking-widest mb-1.5">Library</p>
                  {usedIn.library.map(l => (
                    <a key={l.id} href={`/library/${l.slug}`} target="_blank" rel="noopener noreferrer"
                      className="block py-1 text-xs text-[#2D2A26] hover:text-[#C86A43] transition-colors">
                      {l.title}
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
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
  const [selected,      setSelected]      = useState<Media | null>(null)
  const [statusFilter,  setStatusFilter]  = useState<ApprovalStatus | 'all'>('all')
  const [typeFilter,    setTypeFilter]    = useState('all')

  const allMedia = getMedia()

  const filtered = allMedia.filter(m => {
    if (statusFilter !== 'all' && m.approvalStatus !== statusFilter) return false
    if (typeFilter   !== 'all' && m.mediaType !== typeFilter)        return false
    return true
  })

  const mediaTypes = [...new Set(allMedia.map(m => m.mediaType))]

  return (
    <div className="flex h-full" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Main panel ─────────────────────────────────────────────────────── */}
      <div className={`flex flex-col flex-1 min-w-0 overflow-hidden ${selected ? 'border-r border-[#E8E4DD]' : ''}`}>

        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-8 pb-5 shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-[#2D2A26]">Media</h1>
            <p className="text-sm text-[#6B7280] mt-1">{filtered.length} of {allMedia.length} assets</p>
          </div>
        </div>

        {/* Filters */}
        <div className="px-8 pb-5 flex gap-3 flex-wrap shrink-0">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as ApprovalStatus | 'all')}
            className="px-3 py-2 rounded-lg border border-[#E8E4DD] text-sm text-[#2D2A26] bg-white focus:outline-none focus:ring-2 focus:ring-[#C86A43]/30 focus:border-[#C86A43] transition-colors"
          >
            {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-[#E8E4DD] text-sm text-[#2D2A26] bg-white focus:outline-none focus:ring-2 focus:ring-[#C86A43]/30 focus:border-[#C86A43] transition-colors"
          >
            <option value="all">All Types</option>
            {mediaTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto px-8 pb-8">
          {filtered.length === 0 ? (
            <p className="text-sm text-[#9CA3AF] text-center py-12">No assets match these filters.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {filtered.map(item => (
                <button
                  key={item.id}
                  onClick={() => setSelected(item.id === selected?.id ? null : item)}
                  className={`text-left rounded-xl overflow-hidden border transition-all ${
                    selected?.id === item.id
                      ? 'border-[#C86A43] ring-2 ring-[#C86A43]/20'
                      : 'border-[#E8E4DD] hover:border-[#C86A43]/40 hover:shadow-sm'
                  }`}
                >
                  <div className="aspect-square bg-[#F3EDE6] overflow-hidden relative">
                    {item.mediaType === 'video' || item.mediaType === 'reel' || item.mediaType === 'youtube-video' ? (
                      <div className="absolute inset-0 flex items-center justify-center text-[#9CA3AF]">
                        <span className="text-2xl">▶</span>
                      </div>
                    ) : (
                      <img
                        src={item.thumbnailUrl ?? item.fileUrl}
                        alt={item.altText}
                        className="w-full h-full object-cover"
                      />
                    )}
                    <span className={`absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                      item.approvalStatus === 'approved'
                        ? 'bg-green-500 text-white'
                        : item.approvalStatus === 'needs-review' || item.approvalStatus === 'pending'
                        ? 'bg-amber-400 text-white'
                        : 'bg-red-500 text-white'
                    }`}>
                      {item.approvalStatus === 'approved' ? '✓' : item.approvalStatus === 'rejected' ? '✕' : '!'}
                    </span>
                  </div>
                  <div className="px-3 py-2.5 bg-white">
                    <p className="text-xs font-medium text-[#2D2A26] truncate">{item.title}</p>
                    <p className="text-[10px] text-[#9CA3AF] mt-0.5">{item.mediaType}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Detail panel ───────────────────────────────────────────────────── */}
      {selected && (
        <div className="w-72 shrink-0 overflow-y-auto bg-white">
          <MediaDetailPanel item={selected} onClose={() => setSelected(null)} />
        </div>
      )}
    </div>
  )
}
