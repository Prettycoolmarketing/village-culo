import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../../contexts/AuthContext'
import { getFounders } from '../../../services/founders'
import { founderClaimService } from '../../../services/founderClaim'
import { ConfirmButton } from '../../../components/ui/ConfirmButton'
import type { FounderClaimRequest, FounderClaimStatus } from '../../../types/founderClaim'
import type { Founder } from '../../../types'

// ─── Status pill ──────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: string }) {
  const cls: Record<string, string> = {
    pending:  'bg-amber-50 text-amber-700',
    approved: 'bg-[#5E6B4A]/10 text-[#5E6B4A]',
    rejected: 'bg-red-50 text-red-600',
  }
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${cls[status] ?? 'bg-[#F3EDE6] text-[#9CA3AF]'}`}>
      {status}
    </span>
  )
}

// ─── Claim row ────────────────────────────────────────────────────────────────

function ClaimRow({
  claim,
  founder,
  reviewedBy,
  onRefresh,
}: {
  claim: FounderClaimRequest
  founder?: Founder
  reviewedBy: string
  onRefresh: () => void
}) {
  const [adminNotes, setAdminNotes] = useState(claim.adminNotes ?? '')
  const [notesOpen, setNotesOpen]   = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  async function handleApprove() {
    setActionError(null)
    const result = await founderClaimService.approve(claim.id, reviewedBy, adminNotes || undefined)
    if (result.success) onRefresh()
    else setActionError(result.error ?? 'Failed to approve claim. Please try again.')
  }

  async function handleReject() {
    setActionError(null)
    const result = await founderClaimService.reject(claim.id, reviewedBy, adminNotes || undefined)
    if (result.success) onRefresh()
    else setActionError(result.error ?? 'Failed to reject claim. Please try again.')
  }

  return (
    <div className="bg-white rounded-xl border border-[#E8E4DD] p-5">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-bold text-[#2D2A26]">{claim.requesterName}</p>
            <StatusPill status={claim.status} />
          </div>
          <p className="text-xs text-[#6B7280]">{claim.requesterEmail}</p>
          {founder && (
            <p className="text-xs text-[#9CA3AF] mt-0.5">
              Claiming:{' '}
              <Link to={`/founders/${founder.slug}`} target="_blank" className="text-[#C86A43] hover:underline">
                {founder.name}
              </Link>
              {' '}·{' '}
              <Link to={`/claim/${founder.slug}`} target="_blank" className="text-[#6B7280] hover:underline">
                Claim page ↗
              </Link>
            </p>
          )}
        </div>
        <p className="text-[10px] text-[#9CA3AF] flex-shrink-0">
          {new Date(claim.requestedAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      </div>

      {claim.requesterMessage && (
        <p className="text-xs text-[#6B7280] leading-relaxed mb-3 italic border-l-2 border-[#E8E4DD] pl-3">
          "{claim.requesterMessage}"
        </p>
      )}

      {claim.evidenceUrl && (
        <a href={claim.evidenceUrl} target="_blank" rel="noopener noreferrer"
          className="text-xs text-[#C86A43] hover:underline block mb-3 truncate">
          Evidence: {claim.evidenceUrl}
        </a>
      )}

      {claim.status !== 'pending' && claim.adminNotes && (
        <p className="text-xs text-[#6B7280] italic mb-3">Admin note: {claim.adminNotes}</p>
      )}

      {claim.status === 'pending' && (
        <div className="space-y-2">
          {notesOpen && (
            <textarea
              value={adminNotes}
              onChange={e => setAdminNotes(e.target.value)}
              rows={2}
              className="w-full text-xs px-3 py-2 border border-[#E8E4DD] rounded-lg focus:outline-none focus:border-[#C86A43] resize-none"
              placeholder="Admin notes (optional)..."
            />
          )}
          <div className="flex items-center gap-2 flex-wrap">
            <ConfirmButton
              label="Approve"
              confirmLabel="Yes, approve"
              message="Transfer ownership to this requester?"
              onConfirm={() => void handleApprove()}
              className="px-4 py-1.5 bg-[#5E6B4A] text-white text-xs font-semibold rounded-lg hover:bg-[#4a5538] transition-colors"
            />
            <ConfirmButton
              label="Reject"
              confirmLabel="Yes, reject"
              onConfirm={() => void handleReject()}
              className="px-4 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition-colors"
            />
            <button
              onClick={() => setNotesOpen(o => !o)}
              className="text-xs text-[#9CA3AF] hover:text-[#2D2A26] transition-colors"
            >
              {notesOpen ? 'Hide notes' : 'Add notes'}
            </button>
            {actionError && <p className="text-xs text-red-600 font-medium w-full">{actionError}</p>}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Claims Page ──────────────────────────────────────────────────────────────

type FilterStatus = 'all' | FounderClaimStatus
type SortOrder = 'newest' | 'oldest'

export function VillageClaimRequestsPage() {
  const { user } = useAuth()
  const reviewedBy = user?.email || user?.id || 'admin'
  const [tick, setTick]         = useState(0)
  const [search, setSearch]     = useState('')
  const [status, setStatus]     = useState<FilterStatus>('all')
  const [sort, setSort]         = useState<SortOrder>('newest')
  void tick

  const refresh = () => setTick(t => t + 1)

  const founders  = getFounders()
  const allClaims = founderClaimService.getAll()
  const pending   = allClaims.filter(c => c.status === 'pending')

  // Filter + sort
  const filtered = allClaims
    .filter(c => {
      if (status !== 'all' && c.status !== status) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        const founder = founders.find(f => f.id === c.founderId)
        return (
          c.requesterName.toLowerCase().includes(q) ||
          c.requesterEmail.toLowerCase().includes(q) ||
          (founder?.name.toLowerCase().includes(q) ?? false)
        )
      }
      return true
    })
    .sort((a, b) => {
      const diff = a.requestedAt.localeCompare(b.requestedAt)
      return sort === 'newest' ? -diff : diff
    })

  return (
    <div className="p-8 max-w-4xl" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <div className="mb-6">
        <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-widest mb-1">Village HQ</p>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#2D2A26]">Claim Requests</h1>
            <p className="text-sm text-[#6B7280] mt-0.5">
              {pending.length > 0
                ? `${pending.length} pending claim${pending.length === 1 ? '' : 's'} — review and respond.`
                : 'All caught up. No pending claims.'}
            </p>
          </div>
          <div className="flex gap-2">
            {([['all', 'All'], ['pending', 'Pending'], ['approved', 'Approved'], ['rejected', 'Rejected']] as [FilterStatus, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setStatus(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  status === key
                    ? 'bg-[#C86A43] text-white'
                    : 'bg-white border border-[#E8E4DD] text-[#6B7280] hover:border-[#C86A43] hover:text-[#C86A43]'
                }`}
              >
                {label}
                {key === 'pending' && pending.length > 0 && (
                  <span className="ml-1.5 bg-white/25 text-[10px] px-1 rounded-full">{pending.length}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Search + sort */}
      <div className="flex gap-3 mb-6">
        <input
          className="flex-1 px-3 py-2.5 rounded-xl border border-[#E8E4DD] text-sm text-[#2D2A26] focus:outline-none focus:border-[#C86A43] bg-white placeholder:text-[#9CA3AF]"
          placeholder="Search by name, email or founder..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="px-3 py-2.5 rounded-xl border border-[#E8E4DD] text-sm text-[#2D2A26] focus:outline-none focus:border-[#C86A43] bg-white"
          value={sort}
          onChange={e => setSort(e.target.value as SortOrder)}
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>
      </div>

      {/* Count */}
      <p className="text-xs text-[#9CA3AF] mb-4">
        {filtered.length} {filtered.length === 1 ? 'request' : 'requests'}
        {status !== 'all' && ` with status: ${status}`}
        {search && ` matching "${search}"`}
      </p>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E8E4DD] px-5 py-12 text-center">
          <p className="text-sm font-semibold text-[#2D2A26] mb-1">No claim requests found</p>
          <p className="text-xs text-[#9CA3AF]">
            {search ? 'Try a different search term.' : 'Claims will appear here when founders submit them from their public profile.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map(c => (
            <ClaimRow
              key={c.id}
              claim={c}
              founder={founders.find(f => f.id === c.founderId)}
              reviewedBy={reviewedBy}
              onRefresh={refresh}
            />
          ))}
        </div>
      )}
    </div>
  )
}
