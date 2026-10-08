import { useState, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getFounders, getFounder, updateFoundersBatch, deleteFoundersBatch, deleteFounderAccount } from '../../../services/founders'
import { getCurrentFounder } from '../../../services/currentFounder'
import { getBusinesses } from '../../../services/businesses'
import { importedContentService } from '../../../services/importedContent'
import { founderClaimService } from '../../../services/founderClaim'
import { ConfirmButton } from '../../../components/ui/ConfirmButton'
import type { Founder } from '../../../types'
import { CapoBackLink } from '../../../components/dashboard/CapoBackLink'
import { Tabs } from '../../../components/dashboard/Tabs'
import { FounderEditModal } from '../../../components/dashboard/FounderEditModal'
import { VillageBulkImportPage } from './VillageBulkImportPage'
import { LeadSourcesPage } from './LeadSourcesPage'
import { useAuth } from '../../../contexts/AuthContext'
import { canAccessCapoSection } from '../../../utils/permissions'
import { getAllEditorialItems, type EditorialItemRow } from '../../../services/editorialItems'
import { runFounderResearch } from '../../../services/editorialResearch'
import { publishFounderArticles } from '../../../services/publishStory'

// ─── Status pill ──────────────────────────────────────────────────────────────

// One word, one pill — draft vs. published, claim-pending, and every
// pipeline sub-stage all used to show as separate/stacked pills on the same
// row, which was more status detail than staff scanning this list at a
// glance actually needed. This page is curated founders only (see the
// `founders` filter below) regardless of draft/published, so there's really
// just one normal state ("Curated") plus two that need attention.
// Nothing to flag is nothing shown — no "Curated" pill for the normal
// case. Publish is what clears a row out of "Review": once it's published
// there's nothing left needing a look, so this renders nothing at all.
function SimpleStatus({ founder, items }: { founder: Founder; items: EditorialItemRow[] }) {
  // Published is the final word — a leftover 'review'/'pending' editorial
  // item (e.g. the audit never got a chance to auto-approve before staff
  // published anyway) shouldn't keep showing "Review" on something that's
  // actually live. Checked first, before Failed/Review, so it always wins.
  // Once the founder claims the profile, "Published" stops being accurate —
  // it's their profile now, not a curated one staff is still tending.
  if (founder.status === 'published') {
    if (founder.profileStatus === 'claimed') {
      return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide bg-[#3E6E92]/10 text-[#3E6E92]">Claimed</span>
    }
    return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide bg-[#5E6B4A]/10 text-[#5E6B4A]">Published</span>
  }
  if (founder.researchStatus === 'failed') {
    return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide bg-red-50 text-red-600">Failed</span>
  }
  const needsReview = founder.researchStatus === 'researching'
    || items.some(i => i.editorial_status === 'review' || i.editorial_status === 'pending' || i.editorial_status === 'reject')
  if (needsReview) {
    return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide bg-amber-50 text-amber-700">Review</span>
  }
  return null
}

// ─── Bulk action bar ──────────────────────────────────────────────────────────

function BulkBar({
  selected,
  total,
  researching,
  researchProgress,
  onSelectAll,
  onClearAll,
  onPublish,
  onArchive,
  onResearch,
}: {
  selected: Set<string>
  total: number
  researching: boolean
  researchProgress: { done: number; total: number } | null
  onSelectAll: () => void
  onClearAll: () => void
  onPublish: () => void
  onArchive: () => void
  onResearch: () => void
}) {
  if (selected.size === 0) return null
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#2D2A26] rounded-2xl px-5 py-3 flex items-center gap-4 shadow-2xl">
      <p className="text-xs font-semibold text-white whitespace-nowrap">
        {researching && researchProgress ? `Researching… (${researchProgress.done}/${researchProgress.total})` : `${selected.size} of ${total} selected`}
      </p>
      <div className="flex items-center gap-2">
        {/* Runs (or re-runs, for anything failed/unresearched in the
            selection) Stage 1 research — works on any selection, not just
            failed ones, so this is also how staff kick off research on a
            batch that was just imported. Skips anything already mid-run. */}
        <button
          onClick={onResearch}
          disabled={researching}
          className="text-xs px-3 py-1.5 bg-[#3E6E92] text-white rounded-lg font-semibold hover:bg-[#345c7a] disabled:opacity-50 transition-colors"
        >
          {researching ? 'Researching…' : 'Research'}
        </button>
        <button onClick={onPublish}     className="text-xs px-3 py-1.5 bg-[#5E6B4A] text-white rounded-lg font-semibold hover:bg-[#4a5538] transition-colors">Publish</button>
        <ConfirmButton
          label="Delete"
          confirmLabel="Yes, delete"
          message={`Delete ${selected.size} founder${selected.size === 1 ? '' : 's'}?`}
          onConfirm={onArchive}
          className="text-xs px-3 py-1.5 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
        />
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
  const { user } = useAuth()
  const canSeeFounders = canAccessCapoSection(user?.role, 'founders')
  const canSeeImports  = canAccessCapoSection(user?.role, 'imports')
  const canSeeLeadSources = canAccessCapoSection(user?.role, 'leadSources')
  // Deleting an account (not just a curated profile) gets a tighter bar
  // than the founders section itself — matches the edge function's own
  // admin/owner check, this is just so the button isn't shown to editors
  // who'd get a permission error clicking it.
  const canDeleteAccounts = user?.role === 'admin' || user?.role === 'owner'
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [searchParams] = useSearchParams()
  // Export moved to Village Overview — no longer a tab here. The separate
  // Editorial Queue tab/page is gone too — it was a cross-founder review
  // board for the human "approve" step, which auto-approves on a clean
  // audit now (see runAudit); everything it did is already visible right
  // here per-row (the pipeline stage pill) and per-founder (Edit modal's
  // research/audit dropdown). This tab takes its name instead, since this
  // list — filtered to curated founders only, see `founders` below — is
  // effectively what "the editorial queue" now means.
  const [pageTab, setPageTab]     = useState<'founders' | 'published' | 'claimed' | 'imports' | 'leadSources'>(
    searchParams.get('tab') === 'imports' ? 'imports'
    : searchParams.get('tab') === 'leadSources' ? 'leadSources'
    : searchParams.get('tab') === 'published' ? 'published'
    : searchParams.get('tab') === 'claimed' ? 'claimed'
    : !canSeeFounders ? 'imports' : 'founders',
  )
  const [tick, setTick]           = useState(0)
  // Research/write/audit status per founder — shown right here, not only
  // in Bulk Import's own session view, since this list is where staff
  // actually come back to review and publish. Re-fetched whenever tick
  // bumps (an edit/publish/delete already does).
  const [editorialItemsAll, setEditorialItemsAll] = useState<EditorialItemRow[]>([])
  const [editorialItemsTick, setEditorialItemsTick] = useState(-1)
  if (editorialItemsTick !== tick) {
    setEditorialItemsTick(tick)
    void getAllEditorialItems().then(setEditorialItemsAll)
  }
  const [bulkError, setBulkError] = useState<string | null>(null)
  const [copiedId, setCopiedId]   = useState<string | null>(null)

  function copyProfileLink(f: { id: string; slug: string }) {
    void navigator.clipboard.writeText(`${window.location.origin}/founders/${f.slug}`)
    setCopiedId(f.id)
    setTimeout(() => setCopiedId(prev => prev === f.id ? null : prev), 2000)
  }
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
  const [researching, setResearching] = useState(false)
  const [researchProgress, setResearchProgress] = useState<{ done: number; total: number } | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [editingFounder, setEditingFounder] = useState<Founder | null>(null)
  void tick

  const refresh = () => { setTick(t => t + 1); setSelected(new Set()) }

  async function handleDeleteAccount(f: Founder) {
    setBulkError(null)
    setDeletingId(f.id)
    const result = await deleteFounderAccount(f.id)
    setDeletingId(null)
    if (!result.success) { setBulkError(result.error ?? 'Could not delete this account. Try again.'); return }
    refresh()
  }

  // This whole page manages CULO's own curated batch — a real founder who's
  // claimed and verified their profile manages it themselves through their
  // own dashboard, and isn't part of what staff need to bulk-review/publish/
  // research here. Scoping the base dataset itself (not just a sub-tab)
  // means every stat, filter and bulk action below is already curated-only.
  // 'claimed' stays in — otherwise a founder who claims a published profile
  // just vanishes from the Published tab instead of showing as Claimed.
  const founders  = getFounders().filter(f => f.profileStatus === 'village-curated' || f.profileStatus === 'claim-pending' || f.profileStatus === 'claimed')
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

  const curatedDraftFounders = useMemo(() => founders.filter(f => f.status === 'draft'), [founders])
  const publishedFounders    = useMemo(() => founders.filter(f => f.status !== 'draft'), [founders])
  const claimedFounders      = useMemo(() => founders.filter(f => f.profileStatus === 'claimed'), [founders])

  // Filter + sort
  const filtered = useMemo(() => {
    // Published founders have their own tab now — the queue itself is only
    // ever the ones still needing work.
    let list = [...(pageTab === 'published' ? publishedFounders : pageTab === 'claimed' ? claimedFounders : curatedDraftFounders)]

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(f =>
        f.name.toLowerCase().includes(q) ||
        f.industry.name.toLowerCase().includes(q) ||
        f.location.name.toLowerCase().includes(q) ||
        f.slug.toLowerCase().includes(q) ||
        f.signupEmail?.toLowerCase().includes(q)
      )
    }

    if (filterIndustry !== 'all') list = list.filter(f => f.industry.name === filterIndustry)
    if (filterStatus   !== 'all') list = list.filter(f => (f.profileStatus ?? f.status) === filterStatus)
    if (filterHasYT)              list = list.filter(f => !!f.youtube)
    if (filterHasWeb)             list = list.filter(f => !!f.website)
    if (filterHasBiz)             list = list.filter(f => businesses.some(b => b.founderId === f.id))
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

    // Queue order regardless of the chosen sort: needs-review on top (the
    // actual work waiting on staff), failed research at the very bottom
    // (needs attention, but nothing to review yet), everything else in the
    // middle. Array.sort is stable, so this second pass only reorders by
    // that priority without disturbing the order above within each group.
    const priority = (f: Founder): number => {
      if (f.researchStatus === 'failed') return 2
      const items = editorialItemsAll.filter(i => i.founder_id === f.id)
      const needsReview = f.researchStatus === 'researching'
        || items.some(i => i.editorial_status === 'review' || i.editorial_status === 'pending' || i.editorial_status === 'reject')
      return needsReview ? 0 : 1
    }
    list.sort((a, b) => priority(a) - priority(b))

    return list
  }, [tick, search, sortBy, filterIndustry, filterStatus, filterHasYT, filterHasWeb, filterHasBiz, filterHasContent, filterHasClaim, filterHasEmail, curatedDraftFounders, publishedFounders, claimedFounders, pageTab, businesses, contentCountByFounder, claimByFounder, claimEmailByFounder, editorialItemsAll])

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

  // Same fix as the Edit modal's own Publish button (see publishFounderArticles) —
  // publishing a founder from this list is the same human approval moment,
  // so their still-draft articles need to go live with them here too, not
  // just when publishing happens to go through the modal instead.
  async function publishSelected(ids: Set<string>) {
    const allFounders = getFounders()
    const targets = Array.from(ids).map(id => allFounders.find(fo => fo.id === id)).filter((f): f is Founder => !!f)
    await bulkUpdate(ids, { status: 'published' })
    for (const f of targets) await publishFounderArticles(f)
  }

  async function archiveSelected(ids: Set<string>) {
    setBulkError(null)
    const result = await deleteFoundersBatch(Array.from(ids))
    if (!result.success) setBulkError(result.error ?? `Failed to archive ${ids.size} founder${ids.size === 1 ? '' : 's'}. Try again.`)
    refresh()
  }

  // Runs (or re-runs) Stage 1 research for whatever's selected — covers a
  // freshly imported batch with no research yet, a mix of failed ones to
  // retry, or both at once, all from this list directly (staff often
  // notice status here first, via the pipeline pill on each row) instead
  // of needing to go back to the import screen. Skips anything already
  // mid-run so re-clicking a selection that includes in-progress founders
  // doesn't fire a second overlapping request for them.
  async function runResearchSelected(ids: Set<string>) {
    const targets = Array.from(ids).filter(id => getFounder(id)?.researchStatus !== 'researching')
    if (targets.length === 0) return
    setResearching(true)
    setResearchProgress({ done: 0, total: targets.length })
    for (let i = 0; i < targets.length; i++) {
      await runFounderResearch(targets[i]!)
      setResearchProgress({ done: i + 1, total: targets.length })
    }
    setResearching(false)
    setResearchProgress(null)
    refresh()
  }


  // The Pretty Cool Marketing staff account itself sometimes shows up in
  // this list (it's a real founder record) — it must never be selectable
  // for bulk archive/delete, so it's excluded from selection entirely and
  // never shows a checkbox. Same for the real owner's own personal founder
  // profile ("Shakas Designer", slug shakas-designer) — nobody but the
  // owner logged in as themselves manages that row, ever.
  const PROTECTED_EMAIL = 'support@prettycoolmarketing.com'
  const PROTECTED_FOUNDER_SLUG = 'shakas-designer'
  const isProtectedFounder = (f: Founder) => f.signupEmail?.toLowerCase() === PROTECTED_EMAIL || f.slug === PROTECTED_FOUNDER_SLUG

  function toggleSelect(id: string) {
    if (founders.find(f => f.id === id && isProtectedFounder(f))) return
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const activeFiltersCount = [filterHasYT, filterHasWeb, filterHasBiz, filterHasContent, filterHasClaim, filterHasEmail].filter(Boolean).length +
    (filterIndustry !== 'all' ? 1 : 0) + (filterStatus !== 'all' ? 1 : 0)

  const selectableFiltered = filtered.filter(f => !isProtectedFounder(f))

  // Resolves to the real personal founder account of whoever is logged in
  // right now (null for a staff account with no founder profile of its
  // own) — used so the owner's protected row (shakas-designer) only ever
  // shows manage actions when the person viewing it really is the owner.
  const ownFounderId = useMemo(() => getCurrentFounder(user)?.id ?? null, [user, tick])
  const isLockedFromViewer = (f: Founder) => f.slug === PROTECTED_FOUNDER_SLUG && f.id !== ownFounderId

  return (
    <div className="p-8 max-w-5xl pb-24" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <CapoBackLink />

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-widest mb-1">CAPO · Village Staff</p>
          <h1 className="text-2xl font-bold text-[#2D2A26]">Curated Founders</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">Search, filter and bulk-manage all founders in the Village.</p>
        </div>
        {pageTab === 'founders' && (
          <Link
            to="/dashboard/curated-profiles/new"
            className="flex-shrink-0 px-4 py-2.5 bg-[#C86A43] text-white text-sm font-semibold rounded-xl hover:bg-[#b05a35] transition-colors"
          >
            + Add Founder
          </Link>
        )}
      </div>

      <Tabs
        tabs={[
          ...(canSeeImports ? [{ key: 'imports', label: 'Bulk Import' }] : []),
          ...(canSeeFounders ? [{ key: 'founders', label: 'Editorial Queue' }] : []),
          ...(canSeeFounders ? [{ key: 'published', label: 'Published', badge: publishedFounders.length }] : []),
          ...(canSeeFounders ? [{ key: 'claimed', label: 'Claimed', badge: claimedFounders.length }] : []),
          ...(canSeeLeadSources ? [{ key: 'leadSources', label: 'Lead Sources' }] : []),
        ]}
        active={pageTab}
        onChange={key => setPageTab(key as 'founders' | 'published' | 'claimed' | 'imports' | 'leadSources')}
        className="mb-6"
      />

      {pageTab === 'imports' && canSeeImports && <VillageBulkImportPage embedded />}
      {pageTab === 'leadSources' && canSeeLeadSources && <LeadSourcesPage embedded />}

      {(pageTab === 'founders' || pageTab === 'published' || pageTab === 'claimed') && canSeeFounders && (
      <>
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total',         value: founders.length,                color: 'text-[#C86A43]' },
          { label: 'Awaiting review', value: curatedDraftFounders.length,  color: 'text-amber-600' },
          { label: 'Published',     value: publishedFounders.length,       color: 'text-[#5E6B4A]' },
          { label: 'Filtered',      value: filtered.length,                color: 'text-[#2D2A26]' },
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

      {/* Table — a fixed 12-column grid like this doesn't survive a phone
          screen (every cell squeezes past readable), so it scrolls
          sideways on mobile at a fixed minimum width instead of squishing.
          Desktop never notices since it's already wider than the min. */}
      <div className="bg-white rounded-xl border border-[#E8E4DD] overflow-hidden overflow-x-auto">
      <div className="min-w-[880px]">
        {/* Header */}
        <div className="grid grid-cols-12 gap-3 px-5 py-2.5 bg-[#F8F5F0] border-b border-[#E8E4DD]">
          <div className="col-span-1 flex items-center">
            <input
              type="checkbox"
              checked={selectableFiltered.length > 0 && selected.size === selectableFiltered.length}
              onChange={() => {
                if (selected.size === selectableFiltered.length) setSelected(new Set())
                else setSelected(new Set(selectableFiltered.map(f => f.id)))
              }}
              className="accent-[#C86A43]"
            />
          </div>
          <p className="col-span-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Founder</p>
          <p className="col-span-2 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Industry</p>
          <p className="col-span-1 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide text-center">Links</p>
          <p className="col-span-2 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Status</p>
          <p className="col-span-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Actions</p>
        </div>

        {filtered.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-sm font-semibold text-[#2D2A26] mb-1">No founders match your filters</p>
            <p className="text-xs text-[#9CA3AF]">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#F3EDE6]">
            {filtered.map(f => {
              const biz          = businesses.find(b => b.founderId === f.id)
              const contentCount = contentCountByFounder.get(f.id) ?? 0
              const hasEmail     = claimEmailByFounder.has(f.id)
              const isSelected   = selected.has(f.id)

              return (
                <div key={f.id} className={`grid grid-cols-12 gap-3 px-5 py-3.5 items-center transition-colors ${isSelected ? 'bg-[#C86A43]/5' : 'hover:bg-[#F8F5F0]'}`}>
                  <div className="col-span-1">
                    {!isProtectedFounder(f) && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(f.id)}
                        className="accent-[#C86A43]"
                      />
                    )}
                  </div>
                  <div className="col-span-3 flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-[#F3EDE6] flex-shrink-0 flex items-center justify-center text-[#C86A43] text-xs font-bold">
                      {f.avatar
                        ? <img src={f.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                        : f.name[0]
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#2D2A26] truncate">{f.name}</p>
                      <p className="text-[10px] text-[#9CA3AF] truncate">
                        {f.signupEmail ?? biz?.name ?? '—'}
                        {contentCount > 0 && ` · ${contentCount} import${contentCount !== 1 ? 's' : ''}`}
                        {hasEmail && ' · ✉'}
                        {f.signupProduct && ` · via ${f.signupProduct === 'canva' ? 'Canva' : 'Village'}`}
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
                  <div className="col-span-2 flex flex-wrap gap-1">
                    <SimpleStatus founder={f} items={editorialItemsAll.filter(i => i.founder_id === f.id)} />
                  </div>
                  <div className="col-span-3 flex items-center justify-between gap-2">
                    {isLockedFromViewer(f) ? (
                      <p className="text-[10px] text-[#9CA3AF] italic">Owner-managed — no CAPO actions</p>
                    ) : (
                    <>
                    {/* View sits alone on the far left, well clear of the
                        destructive actions on the right — deliberately not
                        next to Delete, so the two are never in easy reach
                        of the same misclick. */}
                    <div className="flex items-center gap-3 shrink-0">
                      <Link
                        to={`/founders/${f.slug}`}
                        target="_blank"
                        className="text-[10px] text-[#9CA3AF] hover:text-[#C86A43] transition-colors"
                      >
                        View ↗
                      </Link>
                      <button
                        onClick={() => setEditingFounder(f)}
                        className="text-[10px] font-semibold text-[#C86A43] hover:underline"
                      >
                        Edit
                      </button>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
                      {/* Copy this curated profile's public link to send to
                          the real founder so they can claim it — only makes
                          sense before they actually have (claimed). */}
                      {!f.userId && f.profileStatus === 'village-curated' && (
                        <button
                          onClick={() => copyProfileLink(f)}
                          className="text-[10px] text-[#9CA3AF] hover:text-[#C86A43] transition-colors"
                        >
                          {copiedId === f.id ? 'Copied ✓' : 'Copy link to claim'}
                        </button>
                      )}
                      {f.profileStatus === 'claimed' && (
                        <button
                          onClick={() => void founderClaimService.markVerified(f.id).then(result => {
                            if (!result.success) { alert(result.error ?? 'Could not update. Please try again.'); return }
                            refresh()
                          })}
                          className="text-[10px] text-[#C86A43] hover:underline"
                        >
                          Verify
                        </button>
                      )}
                      {canDeleteAccounts && (
                        <ConfirmButton
                          label="Delete"
                          confirmLabel="Yes, delete"
                          message="Delete permanently?"
                          onConfirm={() => void handleDeleteAccount(f)}
                          disabled={deletingId === f.id}
                          className="text-[10px] text-red-500 hover:text-red-600 transition-colors"
                        />
                      )}
                    </div>
                    </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      </div>

      {bulkError && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 px-4 py-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg shadow-sm z-20">
          {bulkError}
        </div>
      )}

      {/* Bulk action bar */}
      <BulkBar
        selected={selected}
        total={selectableFiltered.length}
        researching={researching}
        researchProgress={researchProgress}
        onSelectAll={() => setSelected(new Set(selectableFiltered.map(f => f.id)))}
        onClearAll={() => setSelected(new Set())}
        onPublish={() => void publishSelected(selected)}
        onArchive={() => void archiveSelected(selected)}
        onResearch={() => void runResearchSelected(selected)}
      />
      </>
      )}

      {editingFounder && (
        <FounderEditModal
          founder={editingFounder}
          onClose={() => setEditingFounder(null)}
          onChanged={refresh}
        />
      )}
    </div>
  )
}
