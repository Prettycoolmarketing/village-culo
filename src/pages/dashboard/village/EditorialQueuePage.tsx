import { useState } from 'react'
import { getFounder, getFounders } from '../../../services/founders'
import {
  getAllEditorialItems,
  runAudit,
  approveItem,
  approveAllPassing,
  rejectItem,
  type EditorialItemRow,
} from '../../../services/editorialItems'
import { CapoBackLink } from '../../../components/dashboard/CapoBackLink'
import { FounderEditModal, DraftBody } from '../../../components/dashboard/FounderEditModal'
import { Tabs } from '../../../components/dashboard/Tabs'
import type { Founder } from '../../../types'

// The CAPO Review Queue — build order step 5. Everywhere else in the
// editorial engine, status lives per-founder (Bulk Import's expandable
// research/audit panel, the Profile/Articles tabs' own draft blocks).
// This page is the one place that reads across every founder at once, so
// a reviewer can work through everything the pipeline has produced
// without opening founders one at a time.
//
// "Approve" here is the one human action the agreed design insists on:
// an Auditor "pass" routes to "ready for CAPO approval," never straight
// to publish — see src/services/editorialItems.ts's approveItem. Nothing
// on this page ever makes a draft go live; that still only happens
// through the founder's own Articles tab "Publish" control.

type QueueFilter = 'needs_review' | 'approved' | 'rejected' | 'all'

const STATUS_PILL: Record<EditorialItemRow['editorial_status'], string> = {
  pending: 'bg-[#F3EDE6] text-[#9CA3AF]',
  pass: 'bg-[#5E6B4A]/10 text-[#5E6B4A]',
  review: 'bg-amber-50 text-amber-700',
  reject: 'bg-red-50 text-red-600',
  approved: 'bg-[#3E6E92]/10 text-[#3E6E92]',
}

function QueueRow({ item, founder, onChanged, onOpenFounder }: { item: EditorialItemRow; founder: Founder; onChanged: (next: EditorialItemRow) => void; onOpenFounder: () => void }) {
  const [busy, setBusy] = useState<'audit' | 'approve' | 'reject' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)

  async function handleAudit() {
    setBusy('audit'); setError(null)
    const result = await runAudit(item)
    setBusy(null)
    if (!result.success) { setError(result.error ?? 'Audit failed.'); return }
    onChanged(result.item!)
  }
  async function handleApprove() {
    setBusy('approve'); setError(null)
    const result = await approveItem(item.id)
    setBusy(null)
    if (!result.success) { setError(result.error ?? 'Could not approve.'); return }
    onChanged(result.item!)
  }
  async function handleReject() {
    setBusy('reject'); setError(null)
    const result = await rejectItem(item.id)
    setBusy(null)
    if (!result.success) { setError(result.error ?? 'Could not reject.'); return }
    onChanged(result.item!)
  }

  return (
    <div className="border-b border-[#F3EDE6] last:border-b-0 px-5 py-3.5">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={onOpenFounder} className="text-sm font-semibold text-[#2D2A26] hover:text-[#3E6E92] hover:underline truncate transition-colors">
              {founder.name}
            </button>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${STATUS_PILL[item.editorial_status]}`}>
              {item.editorial_status}
            </span>
            <span className="text-[10px] text-[#9CA3AF] uppercase tracking-wide">
              {item.type === 'profile_bio' ? 'Profile bio' : 'Article'}
            </span>
          </div>
          <p className="text-xs text-[#6B7280] truncate mt-0.5">
            {item.type === 'source_article' ? item.draft_content?.title : item.draft_content?.body?.slice(0, 80)}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button onClick={() => setExpanded(o => !o)} className="text-xs font-semibold text-[#9CA3AF] hover:text-[#3E6E92] transition-colors">
            {expanded ? 'Close' : 'Read'}
          </button>
          <button onClick={() => void handleAudit()} disabled={busy !== null} className="text-xs font-semibold text-[#3E6E92] hover:underline disabled:opacity-50">
            {busy === 'audit' ? 'Auditing…' : 'Re-audit'}
          </button>
          {item.editorial_status !== 'approved' && (
            <button onClick={() => void handleApprove()} disabled={busy !== null} className="text-xs font-semibold text-white bg-[#5E6B4A] px-3 py-1.5 rounded-lg hover:bg-[#4a5538] disabled:opacity-50 transition-colors">
              {busy === 'approve' ? 'Approving…' : 'Approve'}
            </button>
          )}
          {item.editorial_status !== 'reject' && (
            <button onClick={() => void handleReject()} disabled={busy !== null} className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-50">
              Reject
            </button>
          )}
        </div>
      </div>
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
      {expanded && (
        <div className="mt-3 bg-[#F8F5F0] rounded-lg px-3 py-2.5">
          {item.draft_content?.title && item.type === 'source_article' && (
            <p className="text-xs font-semibold text-[#2D2A26] mb-1">{item.draft_content.title}</p>
          )}
          <DraftBody body={item.draft_content?.body} />
          <p className="text-[10px] text-[#9CA3AF] italic mt-1">{item.draft_content?.byline}</p>
          {item.auditor_notes && item.auditor_notes.length > 0 && (
            <ul className="mt-2 space-y-1.5">
              {item.auditor_notes.map((issue, i) => (
                <li key={i} className="border-l-2 border-red-300 pl-2">
                  <p className="text-[10px] font-semibold uppercase text-red-600">{issue.issue_type}</p>
                  <p className="text-xs text-[#2D2A26] italic">"{issue.sentence}"</p>
                  <p className="text-[10px] text-[#6B7280]">{issue.explanation}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

// A real status readout built only from what the data already records —
// not a background job queue. Nothing in this pipeline runs unattended
// yet: research, writing and auditing each still need a staff member's
// browser tab open to trigger them (see runFounderResearch,
// writeProfileBio/writeSourceArticle, runAudit). A true async queue would
// need a scheduled worker (e.g. pg_cron driving the Edge Functions
// directly) that doesn't exist in this stack — this board is honest about
// that: it's "where does each founder sit right now," not "what's
// running in the background."
function pipelineStage(founder: Founder, founderItems: EditorialItemRow[]): { label: string; color: string } {
  if (founder.researchStatus === 'researching') return { label: 'Researching…', color: 'bg-blue-50 text-blue-700' }
  if (founder.researchStatus === 'failed') return { label: 'Research failed', color: 'bg-red-50 text-red-600' }
  if (!founder.evidenceLedger) return { label: 'Not started', color: 'bg-[#F3EDE6] text-[#9CA3AF]' }
  if (founderItems.length === 0) return { label: 'Researched — ready to write', color: 'bg-blue-50 text-blue-700' }
  if (founderItems.some(i => i.editorial_status === 'approved')) return { label: 'Approved — ready to publish', color: 'bg-[#3E6E92]/10 text-[#3E6E92]' }
  if (founderItems.every(i => i.editorial_status === 'pending')) return { label: 'Written — awaiting audit', color: 'bg-amber-50 text-amber-700' }
  return { label: 'Audited — awaiting CAPO review', color: 'bg-amber-50 text-amber-700' }
}

function PipelineStatusBoard({ items }: { items: EditorialItemRow[] }) {
  const founders = getFounders().filter(f => f.researchStatus)
  if (founders.length === 0) return null
  return (
    <div className="bg-white rounded-xl border border-[#E8E4DD] overflow-hidden mb-6">
      <div className="px-5 py-3 border-b border-[#F3EDE6]">
        <p className="text-xs font-bold text-[#2D2A26]">Pipeline status</p>
        <p className="text-[11px] text-[#9CA3AF] mt-0.5">Every founder that's entered the editorial pipeline, and where they currently sit.</p>
      </div>
      {founders.map(f => {
        const stage = pipelineStage(f, items.filter(i => i.founder_id === f.id))
        return (
          <div key={f.id} className="flex items-center justify-between gap-3 px-5 py-2.5 border-b border-[#F3EDE6] last:border-b-0">
            <p className="text-sm font-semibold text-[#2D2A26] truncate">{f.name}</p>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide shrink-0 ${stage.color}`}>{stage.label}</span>
          </div>
        )
      })}
    </div>
  )
}

export function EditorialQueuePage({ embedded = false }: { embedded?: boolean } = {}) {
  const [items, setItems] = useState<EditorialItemRow[]>([])
  const [loaded, setLoaded] = useState(false)
  const [filter, setFilter] = useState<QueueFilter>('needs_review')
  const [editingFounder, setEditingFounder] = useState<Founder | null>(null)
  const [approvingAll, setApprovingAll] = useState(false)

  if (!loaded) {
    void getAllEditorialItems().then(r => { setItems(r); setLoaded(true) })
  }

  function handleItemChanged(next: EditorialItemRow) {
    setItems(prev => prev.map(i => i.id === next.id ? next : i))
  }

  const rows = items
    .map(item => ({ item, founder: getFounder(item.founder_id) }))
    .filter((r): r is { item: EditorialItemRow; founder: Founder } => !!r.founder)

  const needsReview = rows.filter(r => r.item.editorial_status === 'pending' || r.item.editorial_status === 'pass' || r.item.editorial_status === 'review')
  const approved    = rows.filter(r => r.item.editorial_status === 'approved')
  const rejected    = rows.filter(r => r.item.editorial_status === 'reject')
  const passingNow  = needsReview.filter(r => r.item.editorial_status === 'pass')

  async function handleApproveAllPassing() {
    setApprovingAll(true)
    const result = await approveAllPassing(passingNow.map(r => r.item.id))
    setApprovingAll(false)
    if (result.approved > 0) setLoaded(false)
  }

  const visible = filter === 'needs_review' ? needsReview
    : filter === 'approved' ? approved
    : filter === 'rejected' ? rejected
    : rows

  return (
    <div className={embedded ? '' : 'p-8 max-w-4xl'} style={embedded ? undefined : { fontFamily: "'DM Sans', sans-serif" }}>
      {!embedded && <CapoBackLink />}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          {!embedded && <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-widest mb-1">CAPO · Village Staff</p>}
          <h1 className="text-2xl font-bold text-[#2D2A26]">Editorial Review Queue</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">
            Every Culo-written bio and article across every founder, in one place. Approving here never publishes anything — it only marks a draft ready.
          </p>
        </div>
      </div>

      <PipelineStatusBoard items={items} />

      <div className="flex items-center justify-between gap-3 mb-5">
        <Tabs
          tabs={[
            { key: 'needs_review', label: 'Needs Review', badge: needsReview.length },
            { key: 'approved',     label: 'Approved',      badge: approved.length },
            { key: 'rejected',     label: 'Rejected',      badge: rejected.length },
            { key: 'all',          label: 'All',           badge: rows.length },
          ]}
          active={filter}
          onChange={key => setFilter(key as QueueFilter)}
        />
        {passingNow.length > 0 && (
          <button
            onClick={() => void handleApproveAllPassing()}
            disabled={approvingAll}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#5E6B4A] text-white hover:bg-[#4a5538] disabled:opacity-50 transition-colors shrink-0"
          >
            {approvingAll ? 'Approving…' : `Confirm all (${passingNow.length} passing) ✓`}
          </button>
        )}
      </div>

      {!loaded && <p className="text-sm text-[#9CA3AF]">Loading…</p>}

      {loaded && visible.length === 0 && (
        <div className="px-4 py-10 text-center bg-white rounded-xl border border-[#E8E4DD]">
          <p className="text-sm font-semibold text-[#2D2A26] mb-1">Nothing here</p>
          <p className="text-xs text-[#9CA3AF]">
            {filter === 'needs_review' ? 'No drafts waiting on a human review right now.' : 'No items in this view yet.'}
          </p>
        </div>
      )}

      {loaded && visible.length > 0 && (
        <div className="bg-white rounded-xl border border-[#E8E4DD] overflow-hidden">
          {visible.map(({ item, founder }) => (
            <QueueRow key={item.id} item={item} founder={founder} onChanged={handleItemChanged} onOpenFounder={() => setEditingFounder(founder)} />
          ))}
        </div>
      )}

      {editingFounder && (
        <FounderEditModal
          founder={editingFounder}
          onClose={() => setEditingFounder(null)}
          onChanged={() => setLoaded(false)}
        />
      )}
    </div>
  )
}
