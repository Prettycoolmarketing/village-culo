import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { getFounders } from '../../services/founders'
import { founderClaimService } from '../../services/founderClaim'
import { importedContentService } from '../../services/importedContent'
import { getBusiness } from '../../services/businesses'
import { ConfirmButton } from '../../components/ui/ConfirmButton'
import type { FounderClaimRequest } from '../../types/founderClaim'
import type { Founder } from '../../types'
import { normalizeUrl } from '../../utils/url'

type Tab = 'pending' | 'curated' | 'claimed' | 'all'

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    'village-curated': 'bg-blue-50 text-blue-700',
    'claim-pending':   'bg-amber-50 text-amber-700',
    'claimed':         'bg-[#5E6B4A]/10 text-[#5E6B4A]',
    'verified':        'bg-[#C86A43]/10 text-[#C86A43]',
    'pending':         'bg-amber-50 text-amber-700',
    'approved':        'bg-[#5E6B4A]/10 text-[#5E6B4A]',
    'rejected':        'bg-red-50 text-red-600',
  }
  const labels: Record<string, string> = {
    'village-curated': 'Village Curated',
    'claim-pending':   'Claim Pending',
    'claimed':         'Claimed',
    'verified':        'Verified',
    'pending':         'Pending',
    'approved':        'Approved',
    'rejected':        'Rejected',
  }
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${styles[status] ?? 'bg-[#F3EDE6] text-[#9CA3AF]'}`}>
      {labels[status] ?? status}
    </span>
  )
}

function ClaimCard({
  claim,
  founder,
  reviewedBy,
  onApprove,
  onReject,
}: {
  claim: FounderClaimRequest
  founder?: Founder
  reviewedBy: string
  onApprove: () => void
  onReject: () => void
}) {
  const [adminNotes, setAdminNotes] = useState('')
  const [showNotes, setShowNotes] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  async function handleApprove() {
    setActionError(null)
    const result = await founderClaimService.approve(claim.id, reviewedBy, adminNotes || undefined)
    if (result.success) onApprove()
    else setActionError(result.error ?? 'Failed to approve claim. Please try again.')
  }

  async function handleReject() {
    setActionError(null)
    const result = await founderClaimService.reject(claim.id, reviewedBy, adminNotes || undefined)
    if (result.success) onReject()
    else setActionError(result.error ?? 'Failed to reject claim. Please try again.')
  }

  return (
    <div className="bg-white rounded-xl border border-[#E8E4DD] p-5">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <p className="text-sm font-semibold text-[#2D2A26]">{claim.requesterName}</p>
          <p className="text-xs text-[#6B7280]">{claim.requesterEmail}</p>
          {founder && (
            <p className="text-xs text-[#9CA3AF] mt-0.5">
              Claiming:{' '}
              <Link to={`/founders/${founder.slug}`} target="_blank"
                className="text-[#C86A43] hover:underline">
                {founder.name}
              </Link>
            </p>
          )}
        </div>
        <StatusPill status={claim.status} />
      </div>

      {claim.requesterMessage && (
        <p className="text-xs text-[#6B7280] leading-relaxed mb-3 italic border-l-2 border-[#E8E4DD] pl-3">
          "{claim.requesterMessage}"
        </p>
      )}

      {claim.evidenceUrl && (
        <a href={normalizeUrl(claim.evidenceUrl)} target="_blank" rel="noopener noreferrer"
          className="text-xs text-[#C86A43] hover:underline block mb-3 truncate">
          Evidence: {claim.evidenceUrl}
        </a>
      )}

      <p className="text-[10px] text-[#9CA3AF] mb-3">
        Submitted {new Date(claim.requestedAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
      </p>

      {claim.status === 'pending' && (
        <div className="space-y-2">
          {showNotes && (
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
              onClick={() => setShowNotes(s => !s)}
              className="text-xs text-[#9CA3AF] hover:text-[#2D2A26] transition-colors"
            >
              {showNotes ? 'Hide notes' : 'Add notes'}
            </button>
            {actionError && <p className="text-xs text-red-600 font-medium w-full">{actionError}</p>}
          </div>
        </div>
      )}

      {claim.status !== 'pending' && claim.adminNotes && (
        <p className="text-xs text-[#6B7280] italic mt-1">Note: {claim.adminNotes}</p>
      )}
    </div>
  )
}

function FounderRow({ founder, onAction }: { founder: Founder; onAction: () => void }) {
  const importCount = importedContentService.getAll({ founderId: founder.id }).length
  const business    = founder.businessId ? getBusiness(founder.businessId) : undefined

  return (
    <div className="flex items-center gap-4 px-5 py-4">
      <div className="shrink-0 w-9 h-9 rounded-full overflow-hidden bg-[#F3EDE6] ring-2 ring-[#E8E4DD]">
        {founder.avatar
          ? <img src={founder.avatar} alt="" className="w-full h-full object-cover" />
          : <span className="flex items-center justify-center h-full text-[#C86A43] text-sm font-semibold">{founder.name[0]}</span>
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#2D2A26] truncate">{founder.name}</p>
        <p className="text-xs text-[#9CA3AF] truncate">
          {founder.industry.name} · {founder.location.name}
          {business && ` · ${business.name}`}
          {importCount > 0 && ` · ${importCount} import${importCount === 1 ? '' : 's'}`}
          {founder.curatedBy && ` · Curated by ${founder.curatedBy}`}
        </p>
      </div>
      <StatusPill status={founder.profileStatus ?? 'no-status'} />
      <div className="flex items-center gap-2 shrink-0">
        <Link
          to={`/founders/${founder.slug}`}
          target="_blank"
          className="text-xs text-[#9CA3AF] hover:text-[#C86A43] transition-colors"
        >
          View ↗
        </Link>
        {founder.profileStatus === 'claimed' && (
          <button
            onClick={() => { founderClaimService.markVerified(founder.id); onAction() }}
            className="text-xs text-[#C86A43] hover:underline"
          >
            Mark Verified
          </button>
        )}
        {!founder.profileStatus || founder.profileStatus === 'claimed' || founder.profileStatus === 'verified' ? null : (
          founder.profileStatus !== 'village-curated' ? (
            <button
              onClick={() => { founderClaimService.markCurated(founder.id); onAction() }}
              className="text-xs text-[#6B7280] hover:text-[#2D2A26] transition-colors"
            >
              Reset to Curated
            </button>
          ) : null
        )}
        {!founder.profileStatus && (
          <button
            onClick={() => { founderClaimService.markCurated(founder.id); onAction() }}
            className="text-xs text-[#9CA3AF] hover:text-[#C86A43] transition-colors"
          >
            Mark as Curated
          </button>
        )}
      </div>
    </div>
  )
}

export function DashboardCuratedProfilesPage() {
  const { user } = useAuth()
  const reviewedBy = user?.email || user?.id || 'admin'
  const [activeTab, setActiveTab] = useState<Tab>('pending')
  const [tick, setTick] = useState(0)
  const refresh = () => setTick(t => t + 1)
  void tick

  const allFounders = getFounders()
  const allClaims   = founderClaimService.getAll()
  const pending     = founderClaimService.getPending()

  const curated = allFounders.filter(f => f.profileStatus === 'village-curated')
  const claimed  = allFounders.filter(f => f.profileStatus === 'claimed' || f.profileStatus === 'verified')
  const claimPending = allFounders.filter(f => f.profileStatus === 'claim-pending')

  const TABS: { key: Tab; label: string; count?: number }[] = [
    { key: 'pending',  label: 'Pending Claims', count: pending.length },
    { key: 'curated',  label: 'Village Curated', count: curated.length + claimPending.length },
    { key: 'claimed',  label: 'Claimed',         count: claimed.length },
    { key: 'all',      label: 'All Claims' },
  ]

  return (
    <div className="p-8 max-w-4xl" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#2D2A26]">Curated Profiles</h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Manage Village-curated founder profiles, incoming claim requests, and profile ownership.
          </p>
        </div>
        <Link
          to="/dashboard/curated-profiles/new"
          className="flex-shrink-0 px-4 py-2.5 bg-[#C86A43] text-white text-sm font-semibold rounded-xl hover:bg-[#b05a35] transition-colors"
        >
          + Add Curated Founder
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Pending Claims', value: pending.length, color: 'text-amber-600' },
          { label: 'Village Curated', value: curated.length, color: 'text-blue-700' },
          { label: 'Claim Pending', value: claimPending.length, color: 'text-amber-600' },
          { label: 'Claimed / Verified', value: claimed.length, color: 'text-[#5E6B4A]' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-[#E8E4DD] px-4 py-3">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-[#9CA3AF] mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#F8F5F0] rounded-xl p-1 w-fit mb-6">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-[#2D2A26] shadow-sm'
                : 'text-[#6B7280] hover:text-[#2D2A26]'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="ml-1.5 text-[10px] font-semibold bg-[#C86A43]/15 text-[#C86A43] px-1.5 py-0.5 rounded-full">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Pending claims */}
      {activeTab === 'pending' && (
        <div>
          {pending.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#E8E4DD] px-5 py-10 text-center">
              <p className="text-sm font-semibold text-[#2D2A26] mb-1">No pending claims</p>
              <p className="text-xs text-[#9CA3AF]">Claim requests will appear here when submitted from public profiles.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {pending.map(claim => {
                const founder = allFounders.find(f => f.id === claim.founderId)
                return (
                  <ClaimCard
                    key={claim.id}
                    claim={claim}
                    founder={founder}
                    reviewedBy={reviewedBy}
                    onApprove={refresh}
                    onReject={refresh}
                  />
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Village curated + claim-pending */}
      {activeTab === 'curated' && (
        <div className="bg-white rounded-xl border border-[#E8E4DD] divide-y divide-[#F3EDE6]">
          {[...curated, ...claimPending].length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-sm font-semibold text-[#2D2A26] mb-1">No curated profiles</p>
              <p className="text-xs text-[#9CA3AF]">Use "Mark as Curated" on any founder to add them here.</p>
            </div>
          ) : (
            [...curated, ...claimPending].map(f => (
              <FounderRow key={f.id} founder={f} onAction={refresh} />
            ))
          )}
        </div>
      )}

      {/* Claimed */}
      {activeTab === 'claimed' && (
        <div className="bg-white rounded-xl border border-[#E8E4DD] divide-y divide-[#F3EDE6]">
          {claimed.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-sm font-semibold text-[#2D2A26] mb-1">No claimed profiles yet</p>
              <p className="text-xs text-[#9CA3AF]">Profiles appear here once a claim is approved.</p>
            </div>
          ) : (
            claimed.map(f => (
              <FounderRow key={f.id} founder={f} onAction={refresh} />
            ))
          )}
        </div>
      )}

      {/* All claims */}
      {activeTab === 'all' && (
        <div>
          {allClaims.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#E8E4DD] px-5 py-10 text-center">
              <p className="text-sm font-semibold text-[#2D2A26] mb-1">No claims yet</p>
              <p className="text-xs text-[#9CA3AF]">All claim history will appear here.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {allClaims.map(claim => {
                const founder = allFounders.find(f => f.id === claim.founderId)
                return (
                  <ClaimCard
                    key={claim.id}
                    claim={claim}
                    founder={founder}
                    reviewedBy={reviewedBy}
                    onApprove={refresh}
                    onReject={refresh}
                  />
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
