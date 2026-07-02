import { Link } from 'react-router-dom'
import { getFounders } from '../../../services/founders'
import { getBusinesses } from '../../../services/businesses'
import { getStories } from '../../../services/stories'
import { importedContentService } from '../../../services/importedContent'
import { founderClaimService } from '../../../services/founderClaim'
import { importBatchService } from '../../../services/importBatch'

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  color = 'text-[#2D2A26]',
  to,
}: {
  label: string
  value: number | string
  color?: string
  to?: string
}) {
  const inner = (
    <div className="bg-white rounded-xl border border-[#E8E4DD] px-4 py-3 hover:border-[#C86A43]/40 transition-colors">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-[#9CA3AF] mt-0.5">{label}</p>
    </div>
  )
  return to ? <Link to={to}>{inner}</Link> : inner
}

// ─── Quick action ─────────────────────────────────────────────────────────────

function QuickAction({ label, to, sub }: { label: string; to: string; sub: string }) {
  return (
    <Link
      to={to}
      className="bg-white rounded-xl border border-[#E8E4DD] px-4 py-3.5 hover:border-[#C86A43] hover:bg-[#C86A43]/5 transition-colors group"
    >
      <p className="text-sm font-semibold text-[#2D2A26] group-hover:text-[#C86A43] transition-colors">{label} →</p>
      <p className="text-xs text-[#9CA3AF] mt-0.5">{sub}</p>
    </Link>
  )
}

// ─── Overview Page ────────────────────────────────────────────────────────────

export function VillageHQOverviewPage() {
  const founders     = getFounders()
  const businesses   = getBusinesses()
  const stories      = getStories()
  const allContent   = importedContentService.getAll()
  const allClaims    = founderClaimService.getAll()
  const pendingClaims = founderClaimService.getPending()
  const batches      = importBatchService.getAll()

  const curated  = founders.filter(f => f.profileStatus === 'village-curated')
  const claimed  = founders.filter(f => f.profileStatus === 'claimed')
  const verified = founders.filter(f => f.profileStatus === 'verified')
  const claimPending = founders.filter(f => f.profileStatus === 'claim-pending')

  const publishedStories = stories.filter(s => s.status === 'published' || s.status === 'featured')
  const publicContent    = allContent.filter(c => c.visibility === 'public')

  // Emails available (unique emails from claim requests)
  const emails = [...new Set(allClaims.map(c => c.requesterEmail.toLowerCase()).filter(Boolean))]

  // Recent activity — newest founders + newest claims
  const recentFounders = [...founders]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5)

  const recentClaims = [...allClaims]
    .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt))
    .slice(0, 3)

  const totalImported = batches.reduce((sum, b) => sum + b.created, 0)

  return (
    <div className="p-8 max-w-5xl" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <div className="mb-8">
        <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-widest mb-1">CAPO</p>
        <h1 className="text-2xl font-bold text-[#2D2A26]">Overview</h1>
        <p className="text-sm text-[#6B7280] mt-0.5">The operating system for CULO Village.</p>
      </div>

      {/* Primary stats */}
      <section className="mb-8">
        <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest mb-3">Founders</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Total Founders"    value={founders.length}     color="text-[#C86A43]" to="/dashboard/village/founders" />
          <StatCard label="Village Curated"   value={curated.length}      color="text-blue-700"   to="/dashboard/village/founders" />
          <StatCard label="Claimed"           value={claimed.length}      color="text-[#5E6B4A]"  to="/dashboard/village/founders" />
          <StatCard label="Verified"          value={verified.length}     color="text-[#D6A94D]"  to="/dashboard/village/founders" />
        </div>
      </section>

      <section className="mb-8">
        <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest mb-3">Content</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Businesses"        value={businesses.length}       color="text-[#2D2A26]" to="/dashboard/village/featured" />
          <StatCard label="Published Stories" value={publishedStories.length} color="text-[#2D2A26]" to="/dashboard/village/featured" />
          <StatCard label="Public Imports"    value={publicContent.length}    color="text-[#2D2A26]" to="/dashboard/village/featured" />
          <StatCard label="Total Imports"     value={allContent.length}       color="text-[#2D2A26]" />
        </div>
      </section>

      <section className="mb-8">
        <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest mb-3">Operations</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Pending Claims"    value={pendingClaims.length}  color={pendingClaims.length > 0 ? 'text-amber-600' : 'text-[#2D2A26]'} to="/dashboard/village/claims" />
          <StatCard label="Claim Pending"     value={claimPending.length}   color="text-amber-600"  to="/dashboard/village/claims" />
          <StatCard label="Import Batches"    value={batches.length}        color="text-[#2D2A26]"  to="/dashboard/village/imports" />
          <StatCard label="Via Bulk Import"   value={totalImported}         color="text-[#2D2A26]"  to="/dashboard/village/imports" />
        </div>
      </section>

      <section className="mb-8">
        <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest mb-3">Export</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Emails Available"  value={emails.length}         color="text-[#5E6B4A]"  to="/dashboard/village/emails" />
          <StatCard label="Claim Requests"    value={allClaims.length}      color="text-[#2D2A26]"  to="/dashboard/village/emails" />
          <StatCard label="Total All Content" value={allContent.length + publishedStories.length + businesses.length} color="text-[#2D2A26]" />
          <StatCard label="Public Founders"   value={founders.filter(f => f.status === 'published' || f.status === 'featured').length} color="text-[#2D2A26]" />
        </div>
      </section>

      {/* Quick actions */}
      <section className="mb-8">
        <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest mb-3">Quick Actions</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <QuickAction label="Add Curated Founder" to="/dashboard/curated-profiles/new"  sub="Manually add a single founder" />
          <QuickAction label="Bulk Import"         to="/dashboard/village/imports"        sub="Import founders from JSON" />
          <QuickAction label="Review Claims"       to="/dashboard/village/claims"         sub={`${pendingClaims.length} pending`} />
          <QuickAction label="Export Emails"       to="/dashboard/village/emails"         sub={`${emails.length} emails available`} />
          <QuickAction label="Feature Content"     to="/dashboard/village/featured"       sub="Pin founders, stories, businesses" />
          <QuickAction label="Village Analytics"   to="/dashboard/village/analytics"      sub="Stats and growth metrics" />
        </div>
      </section>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recent founders */}
        <section>
          <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest mb-3">Newest Founders</p>
          <div className="bg-white rounded-xl border border-[#E8E4DD] divide-y divide-[#F3EDE6]">
            {recentFounders.length === 0 ? (
              <div className="px-5 py-6 text-center">
                <p className="text-xs text-[#9CA3AF]">No founders yet.</p>
              </div>
            ) : recentFounders.map(f => (
              <div key={f.id} className="flex items-center gap-3 px-4 py-3">
                <div className="w-8 h-8 rounded-full bg-[#F3EDE6] flex items-center justify-center text-[#C86A43] text-sm font-bold flex-shrink-0">
                  {f.avatar ? <img src={f.avatar} alt="" className="w-full h-full object-cover rounded-full" /> : f.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#2D2A26] truncate">{f.name}</p>
                  <p className="text-[10px] text-[#9CA3AF]">{f.industry.name} · {f.location.name}</p>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${
                  f.profileStatus === 'village-curated' ? 'bg-blue-50 text-blue-700'
                  : f.profileStatus === 'claimed' ? 'bg-[#5E6B4A]/10 text-[#5E6B4A]'
                  : f.profileStatus === 'verified' ? 'bg-[#C86A43]/10 text-[#C86A43]'
                  : 'bg-[#F3EDE6] text-[#9CA3AF]'
                }`}>
                  {f.profileStatus ?? 'no status'}
                </span>
              </div>
            ))}
            <div className="px-4 py-2.5">
              <Link to="/dashboard/village/founders" className="text-xs text-[#C86A43] font-semibold hover:underline">
                View all founders →
              </Link>
            </div>
          </div>
        </section>

        {/* Recent claims */}
        <section>
          <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest mb-3">Recent Claim Requests</p>
          <div className="bg-white rounded-xl border border-[#E8E4DD] divide-y divide-[#F3EDE6]">
            {recentClaims.length === 0 ? (
              <div className="px-5 py-6 text-center">
                <p className="text-xs text-[#9CA3AF]">No claims yet.</p>
              </div>
            ) : recentClaims.map(c => {
              const founder = founders.find(f => f.id === c.founderId)
              return (
                <div key={c.id} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[#2D2A26]">{c.requesterName}</p>
                      <p className="text-xs text-[#9CA3AF]">
                        {founder ? `Claiming ${founder.name}` : 'Unknown profile'} ·{' '}
                        {new Date(c.requestedAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${
                      c.status === 'pending' ? 'bg-amber-50 text-amber-700'
                      : c.status === 'approved' ? 'bg-[#5E6B4A]/10 text-[#5E6B4A]'
                      : 'bg-red-50 text-red-600'
                    }`}>
                      {c.status}
                    </span>
                  </div>
                </div>
              )
            })}
            <div className="px-4 py-2.5">
              <Link to="/dashboard/village/claims" className="text-xs text-[#C86A43] font-semibold hover:underline">
                Review all claims →
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
