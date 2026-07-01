import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getFounders, updateFoundersBatch, deleteFoundersBatch } from '../../../services/founders'
import { getBusinesses } from '../../../services/businesses'
import { importedContentService } from '../../../services/importedContent'
import { founderClaimService } from '../../../services/founderClaim'
import { ConfirmButton } from '../../../components/ui/ConfirmButton'
import type { Founder } from '../../../types'

// ─── Status pill ──────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: string }) {
  const cls: Record<string, string> = {
    'village-curated': 'bg-blue-50 text-blue-700',
    'claim-pending':   'bg-amber-50 text-amber-700',
    'claimed':         'bg-[#5E6B4A]/10 text-[#5E6B4A]',
    'verified':        'bg-[#C86A43]/10 text-[#C86A43]',
    'published':       'bg-[#F3EDE6] text-[#6B7280]',
    'archived':        'bg-red-50 text-red-400',
  }
  const labels: Record<string, string> = {
    'village-curated': 'Curated', 'claim-pending': 'Pending',
    'claimed': 'Claimed', 'verified': 'Verified',
    'published': 'Published', 'archived': 'Archived',
  }
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${cls[status] ?? 'bg-[#F3EDE6] text-[#9CA3AF]'}`}>
      {labels[status] ?? status}
    </span>
  )
}

// ─── Bulk action bar ──────────────────────────────────────────────────────────

function BulkBar({
  selected,
  total,
  onSelectAll,
  onClearAll,
  onMarkCurated,
  onPublish,
  onHide,
  onArchive,
  onExport,
}: {
  selected: Set<string>
  total: number
  onSelectAll: () => void
  onClearAll: () => void
  onMarkCurated: () => void
  onPublish: () => void
  onHide: () => void
  onArchive: () => void
  onExport: () => void
}) {
  if (selected.size === 0) return null
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#2D2A26] rounded-2xl px-5 py-3 flex items-center gap-4 shadow-2xl">
      <p className="text-xs font-semibold text-white whitespace-nowrap">
        {selected.size} of {total} selected
      </p>
      <div className="flex items-center gap-2">
        <button onClick={onMarkCurated} className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors">Mark Curated</button>
        <button onClick={onPublish}     className="text-xs px-3 py-1.5 bg-[#5E6B4A] text-white rounded-lg font-semibold hover:bg-[#4a5538] transition-colors">Publish</button>
        <button onClick={onHide}        className="text-xs px-3 py-1.5 bg-[#6B7280] text-white rounded-lg font-semibold hover:bg-[#4B5563] transition-colors">Hide</button>
        <ConfirmButton
          label="Archive"
          confirmLabel="Yes, archive"
          message={`Remove ${selected.size} founder${selected.size === 1 ? '' : 's'}?`}
          onConfirm={onArchive}
          className="text-xs px-3 py-1.5 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
        />
        <button onClick={onExport}      className="text-xs px-3 py-1.5 bg-[#C86A43] text-white rounded-lg font-semibold hover:bg-[#b05a35] transition-colors">Export CSV</button>
      </div>
      <div className="flex gap-1">
        <button onClick={onSelectAll} className="text-[10px] text-[#9CA3AF] hover:text-white transition-colors">All</button>
        <span className="text-[#9CA3AF]">·</span>
        <button onClick={onClearAll}  className="text-[10px] text-[#9CA3AF] hover:text-white transition-colors">Clear</button>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function VillageCuratedFoundersPage() {
  const [tick, setTick]           = useState(0)
  const [bulkError, setBulkError] = useState<string | null>(null)
  const [search, setSearch]       = useState('')
  const [sortBy, setSortBy]       = useState<'newest' | 'oldest' | 'name-az' | 'name-za'>('newest')
  const [filterIndustry, setFilterIndustry] = useState('all')
  const [filterStatus, setFilterStatus]     = useState('all')
  const [filterHasYT, setFilterHasYT]       = useState(false)
  const [filterHasWeb, setFilterHasWeb]     = useState(false)
  const [filterHasBiz, setFilterHasBiz]     = useState(false)
  const [filterHasContent, setFilterHasContent] = useState(false)
  const [filterHasClaim, setFilterHasClaim] = useState(false)
  const [filterHasEmail, setFilterHasEmail] = useState(false)
  const [selected, setSelected]   = useState<Set<string>>(new Set())
  const [filtersOpen, setFiltersOpen] = useState(false)
  void tick

  const refresh = () => { setTick(t => t + 1); setSelected(new Set()) }

  const founders  = getFounders()
  const businesses = getBusinesses()
  const claims    = founderClaimService.getAll()

  const claimEmailByFounder = useMemo(() => {
    const map = new Map<string, string>()
    for (const c of claims) {
      if (c.requesterEmail && !map.has(c.founderId)) map.set(c.founderId, c.requesterEmail)
    }
    return map
  }, [claims])

  const claimByFounder = useMemo(() => {
    const map = new Map<string, boolean>()
    for (const c of claims) map.set(c.founderId, true)
    return map
  }, [claims])

  const contentCountByFounder = useMemo(() => {
    const all = importedContentService.getAll()
    const counts = new Map<string, number>()
    for (const c of all) counts.set(c.founderId, (counts.get(c.founderId) ?? 0) + 1)
    return counts
  }, [tick])

  const industries = useMemo(() => [...new Set(founders.map(f => f.industry.name))].sort(), [founders])

  // Filter + sort
  const filtered = useMemo(() => {
    let list = [...founders]

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(f =>
        f.name.toLowerCase().includes(q) ||
        f.industry.name.toLowerCase().includes(q) ||
        f.location.name.toLowerCase().includes(q) ||
        f.slug.toLowerCase().includes(q)
      )
    }

    if (filterIndustry !== 'all') list = list.filter(f => f.industry.name === filterIndustry)
    if (filterStatus   !== 'all') list = list.filter(f => (f.profileStatus ?? f.status) === filterStatus)
    if (filterHasYT)              list = list.filter(f => !!f.youtube)
    if (filterHasWeb)             list = list.filter(f => !!f.website)
    if (filterHasBiz)             list = list.filter(f => !!f.businessId)
    if (filterHasContent)         list = list.filter(f => (contentCountByFounder.get(f.id) ?? 0) > 0)
    if (filterHasClaim)           list = list.filter(f => claimByFounder.has(f.id))
    if (filterHasEmail)           list = list.filter(f => claimEmailByFounder.has(f.id))

    list.sort((a, b) => {
      if (sortBy === 'newest')  return b.createdAt.localeCompare(a.createdAt)
      if (sortBy === 'oldest')  return a.createdAt.localeCompare(b.createdAt)
      if (sortBy === 'name-az') return a.name.localeCompare(b.name)
      if (sortBy === 'name-za') return b.name.localeCompare(a.name)
      return 0
    })

    return list
  }, [tick, search, sortBy, filterIndustry, filterStatus, filterHasYT, filterHasWeb, filterHasBiz, filterHasContent, filterHasClaim, filterHasEmail, founders, contentCountByFounder, claimByFounder, claimEmailByFounder])

  // Bulk operations — one Supabase upsert/delete + one cache rewrite per batch,
  // not one round-trip per founder (see Sprint 19B-Fix audit for the O(n²) bug
  // this replaces).
  async function bulkUpdate(ids: Set<string>, patch: Partial<Founder>) {
    setBulkError(null)
    const allFounders = getFounders()
    const targets = Array.from(ids)
      .map(id => allFounders.find(fo => fo.id === id))
      .filter((f): f is Founder => !!f)
      .map(f => ({ ...f, ...patch }))
    const result = await updateFoundersBatch(targets)
    if (!result.success) setBulkError(result.error ?? `Failed to update ${ids.size} founder${ids.size === 1 ? '' : 's'}. Try again.`)
    refresh()
  }

  async function archiveSelected(ids: Set<string>) {
    setBulkError(null)
    const result = await deleteFoundersBatch(Array.from(ids))
    if (!result.success) setBulkError(result.error ?? `Failed to archive ${ids.size} founder${ids.size === 1 ? '' : 's'}. Try again.`)
    refresh()
  }

  function exportSelected(ids: Set<string>) {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const rows = getFounders()
      .filter(f => ids.has(f.id))
      .map(f => {
        const parts = f.name.split(' ')
        const biz   = businesses.find(b => b.id === f.businessId)
        return [
          claimEmailByFounder.get(f.id) ?? '',
          parts[0] ?? '', parts.length > 1 ? parts[parts.length - 1] : '',
          f.name, f.profileStatus ?? f.status, f.slug,
          `${origin}/founders/${f.slug}`, `${origin}/claim/${f.slug}`,
          biz?.name ?? '', 'selected-export', f.createdAt,
        ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
      })
    const csv  = ['email,firstName,lastName,fullName,profileStatus,founderSlug,profileUrl,claimUrl,businessName,tags,createdAt', ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = `village-founders-${new Date().toISOString().slice(0, 10)}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const activeFiltersCount = [filterHasYT, filterHasWeb, filterHasBiz, filterHasContent, filterHasClaim, filterHasEmail].filter(Boolean).length +
    (filterIndustry !== 'all' ? 1 : 0) + (filterStatus !== 'all' ? 1 : 0)

  return (
    <div className="p-8 max-w-5xl pb-24" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-widest mb-1">Village HQ</p>
          <h1 className="text-2xl font-bold text-[#2D2A26]">Curated Founders</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">Search, filter and bulk-manage all founders in the Village.</p>
        </div>
        <Link
          to="/dashboard/curated-profiles/new"
          className="flex-shrink-0 px-4 py-2.5 bg-[#C86A43] text-white text-sm font-semibold rounded-xl hover:bg-[#b05a35] transition-colors"
        >
          + Add Founder
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total',   value: founders.length,                                          color: 'text-[#C86A43]' },
          { label: 'Curated', value: founders.filter(f => f.profileStatus === 'village-curated').length, color: 'text-blue-700' },
          { label: 'Claimed', value: founders.filter(f => f.profileStatus === 'claimed' || f.profileStatus === 'verified').length, color: 'text-[#5E6B4A]' },
          { label: 'Filtered',value: filtered.length, color: 'text-[#2D2A26]' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-[#E8E4DD] px-3 py-2.5">
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-[#9CA3AF]">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search + sort */}
      <div className="flex gap-3 mb-3">
        <input
          className="flex-1 px-3 py-2.5 rounded-xl border border-[#E8E4DD] text-sm text-[#2D2A26] focus:outline-none focus:border-[#C86A43] bg-white placeholder:text-[#9CA3AF]"
          placeholder="Search founders by name, industry, location or slug..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="px-3 py-2.5 rounded-xl border border-[#E8E4DD] text-sm text-[#2D2A26] bg-white focus:outline-none focus:border-[#C86A43]"
          value={sortBy}
          onChange={e => setSortBy(e.target.value as typeof sortBy)}
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="name-az">Name A–Z</option>
          <option value="name-za">Name Z–A</option>
        </select>
        <button
          onClick={() => setFiltersOpen(o => !o)}
          className={`px-3 py-2.5 rounded-xl border text-sm font-semibold transition-colors ${
            activeFiltersCount > 0
              ? 'border-[#C86A43] bg-[#C86A43]/10 text-[#C86A43]'
              : 'border-[#E8E4DD] bg-white text-[#6B7280] hover:border-[#C86A43] hover:text-[#C86A43]'
          }`}
        >
          Filters{activeFiltersCount > 0 && ` (${activeFiltersCount})`}
        </button>
      </div>

      {/* Filter panel */}
      {filtersOpen && (
        <div className="bg-white rounded-xl border border-[#E8E4DD] p-4 mb-4 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide mb-1">Industry</label>
              <select
                className="w-full px-3 py-2 rounded-lg border border-[#E8E4DD] text-xs bg-white focus:outline-none focus:border-[#C86A43]"
                value={filterIndustry}
                onChange={e => setFilterIndustry(e.target.value)}
              >
                <option value="all">All industries</option>
                {industries.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide mb-1">Status</label>
              <select
                className="w-full px-3 py-2 rounded-lg border border-[#E8E4DD] text-xs bg-white focus:outline-none focus:border-[#C86A43]"
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
              >
                <option value="all">All statuses</option>
                <option value="village-curated">Village Curated</option>
                <option value="claim-pending">Claim Pending</option>
                <option value="claimed">Claimed</option>
                <option value="verified">Verified</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {([
              ['Has YouTube', filterHasYT, setFilterHasYT],
              ['Has Website', filterHasWeb, setFilterHasWeb],
              ['Has Business', filterHasBiz, setFilterHasBiz],
              ['Has Content', filterHasContent, setFilterHasContent],
              ['Has Claim',   filterHasClaim, setFilterHasClaim],
              ['Has Email',   filterHasEmail, setFilterHasEmail],
            ] as [string, boolean, (v: boolean) => void][]).map(([label, val, set]) => (
              <button
                key={label}
                onClick={() => set(!val)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  val ? 'bg-[#5E6B4A] border-[#5E6B4A] text-white' : 'bg-white border-[#E8E4DD] text-[#6B7280] hover:border-[#C86A43]'
                }`}
              >
                {label}
              </button>
            ))}
            {activeFiltersCount > 0 && (
              <button
                onClick={() => {
                  setFilterIndustry('all'); setFilterStatus('all')
                  setFilterHasYT(false); setFilterHasWeb(false); setFilterHasBiz(false)
                  setFilterHasContent(false); setFilterHasClaim(false); setFilterHasEmail(false)
                }}
                className="text-xs px-3 py-1.5 rounded-full border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#E8E4DD] overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-12 gap-3 px-5 py-2.5 bg-[#F8F5F0] border-b border-[#E8E4DD]">
          <div className="col-span-1 flex items-center">
            <input
              type="checkbox"
              checked={selected.size === filtered.length && filtered.length > 0}
              onChange={() => {
                if (selected.size === filtered.length) setSelected(new Set())
                else setSelected(new Set(filtered.map(f => f.id)))
              }}
              className="accent-[#C86A43]"
            />
          </div>
          <p className="col-span-4 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Founder</p>
          <p className="col-span-2 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Industry</p>
          <p className="col-span-1 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide text-center">Links</p>
          <p className="col-span-2 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Status</p>
          <p className="col-span-2 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Actions</p>
        </div>

        {filtered.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-sm font-semibold text-[#2D2A26] mb-1">No founders match your filters</p>
            <p className="text-xs text-[#9CA3AF]">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#F3EDE6]">
            {filtered.map(f => {
              const biz          = businesses.find(b => b.id === f.businessId)
              const contentCount = contentCountByFounder.get(f.id) ?? 0
              const hasEmail     = claimEmailByFounder.has(f.id)
              const isSelected   = selected.has(f.id)

              return (
                <div key={f.id} className={`grid grid-cols-12 gap-3 px-5 py-3.5 items-center transition-colors ${isSelected ? 'bg-[#C86A43]/5' : 'hover:bg-[#F8F5F0]'}`}>
                  <div className="col-span-1">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(f.id)}
                      className="accent-[#C86A43]"
                    />
                  </div>
                  <div className="col-span-4 flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-[#F3EDE6] flex-shrink-0 flex items-center justify-center text-[#C86A43] text-xs font-bold">
                      {f.avatar
                        ? <img src={f.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                        : f.name[0]
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#2D2A26] truncate">{f.name}</p>
                      <p className="text-[10px] text-[#9CA3AF] truncate">
                        {biz?.name ?? '—'}
                        {contentCount > 0 && ` · ${contentCount} import${contentCount !== 1 ? 's' : ''}`}
                        {hasEmail && ' · ✉'}
                      </p>
                    </div>
                  </div>
                  <p className="col-span-2 text-xs text-[#6B7280] truncate">{f.industry.name}</p>
                  <div className="col-span-1 flex gap-1 justify-center">
                    {f.youtube   && <span title="YouTube"   className="w-1.5 h-1.5 rounded-full bg-red-400"      />}
                    {f.instagram && <span title="Instagram" className="w-1.5 h-1.5 rounded-full bg-pink-400"     />}
                    {f.linkedin  && <span title="LinkedIn"  className="w-1.5 h-1.5 rounded-full bg-blue-400"     />}
                    {f.website   && <span title="Website"   className="w-1.5 h-1.5 rounded-full bg-[#C86A43]"   />}
                    {f.podcast   && <span title="Podcast"   className="w-1.5 h-1.5 rounded-full bg-purple-400"  />}
                    {f.tiktok    && <span title="TikTok"    className="w-1.5 h-1.5 rounded-full bg-neutral-500" />}
                  </div>
                  <div className="col-span-2">
                    <StatusPill status={f.profileStatus ?? f.status} />
                  </div>
                  <div className="col-span-2 flex items-center gap-2">
                    <Link
                      to={`/founders/${f.slug}`}
                      target="_blank"
                      className="text-[10px] text-[#9CA3AF] hover:text-[#C86A43] transition-colors"
                    >
                      View ↗
                    </Link>
                    {(!f.profileStatus || f.profileStatus === 'village-curated') && (
                      <button
                        onClick={() => { founderClaimService.markCurated(f.id); refresh() }}
                        className="text-[10px] text-[#9CA3AF] hover:text-[#C86A43] transition-colors"
                      >
                        {!f.profileStatus ? 'Set Curated' : 'Re-curate'}
                      </button>
                    )}
                    {f.profileStatus === 'claimed' && (
                      <button
                        onClick={() => { founderClaimService.markVerified(f.id); refresh() }}
                        className="text-[10px] text-[#C86A43] hover:underline"
                      >
                        Verify
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {bulkError && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 px-4 py-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg shadow-sm z-20">
          {bulkError}
        </div>
      )}

      {/* Bulk action bar */}
      <BulkBar
        selected={selected}
        total={filtered.length}
        onSelectAll={() => setSelected(new Set(filtered.map(f => f.id)))}
        onClearAll={() => setSelected(new Set())}
        onMarkCurated={() => void bulkUpdate(selected, { profileStatus: 'village-curated', isClaimable: true })}
        onPublish={() => void bulkUpdate(selected, { status: 'published' })}
        onHide={() => void bulkUpdate(selected, { status: 'archived' })}
        onArchive={() => void archiveSelected(selected)}
        onExport={() => exportSelected(selected)}
      />
    </div>
  )
}
