import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getFounders } from '../../../services/founders'
import { getBusinesses } from '../../../services/businesses'
import { getStories } from '../../../services/stories'
import { importedContentService } from '../../../services/importedContent'
import { founderClaimService } from '../../../services/founderClaim'
import { importBatchService } from '../../../services/importBatch'
import { Tabs, type DashTab } from '../../../components/dashboard/Tabs'
import { useAuth } from '../../../contexts/AuthContext'
import { canAccessCapoSection } from '../../../utils/permissions'
import { JOIN_SOURCE_LABELS } from '../../../constants/joinSource'

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  color = 'text-[#2D2A26]',
  to,
  sub,
}: {
  label: string
  value: number | string
  color?: string
  to?: string
  sub?: string
}) {
  const inner = (
    <div className="bg-white rounded-xl border border-[#E8E4DD] px-4 py-3 hover:border-[#C86A43]/40 transition-colors">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-[#9CA3AF] mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-[#C8C3BC] mt-0.5">{sub}</p>}
    </div>
  )
  return to ? <Link to={to}>{inner}</Link> : inner
}

// ─── Bar row (for distributions) ───────────────────────────────────────────────

function BarRow({ label, count, max }: { label: string; count: number; max: number }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <p className="text-xs text-[#2D2A26] w-36 flex-shrink-0 truncate">{label}</p>
      <div className="flex-1 bg-[#F3EDE6] rounded-full h-2 overflow-hidden">
        <div className="h-full bg-[#C86A43] rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs font-semibold text-[#2D2A26] w-6 text-right">{count}</p>
    </div>
  )
}

function topN<T>(items: T[], key: (item: T) => string, n = 6): { label: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const item of items) {
    const k = key(item)
    if (k) counts.set(k, (counts.get(k) ?? 0) + 1)
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([label, count]) => ({ label, count }))
}

// ─── Overview Page ────────────────────────────────────────────────────────────

export function VillageHQOverviewPage() {
  const { user } = useAuth()
  const canSeeAnalytics = canAccessCapoSection(user?.role, 'analytics')

  const founders     = getFounders()
  const businesses   = getBusinesses()
  const stories      = getStories()
  const allContent   = importedContentService.getAll()
  const allClaims    = founderClaimService.getAll()
  const pendingClaims = founderClaimService.getPending()
  const batches      = importBatchService.getAll()

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

  // ── Admin/owner-only analytics (merged in from the former standalone
  // Village Analytics page — kept behind the same 'analytics' permission it
  // always required, not opened up just because it now lives on a page
  // moderators/editors can also reach). Trimmed to what isn't already shown
  // elsewhere: no Newest Founders (Recent Activity tab has that), no
  // storage/hosting cost estimate (Village Usage page covers content-volume
  // decisions now), no raw founder/claimed counts (Founders page owns those).
  // Anyone with signupProduct set came through /join (village or canva source)
  // rather than the older Onboarding wizard or a curated/claimed profile —
  // see JoinVillagePage/JoinConfirmPage/ensureJoinedFounder.
  const joinedViaJoinFlow   = founders.filter(f => !!f.signupProduct)
  const passwordSetCount    = joinedViaJoinFlow.filter(f => f.passwordSet).length
  const lockedInCollaborators = founders.filter(f => f.creativeSubscription?.tier === 'collaborator' && !!f.creativeSubscription.stripeSubscriptionId).length
  const fromCanva   = joinedViaJoinFlow.filter(f => f.signupProduct === 'canva')
  const fromVillage = joinedViaJoinFlow.filter(f => f.signupProduct === 'village')

  const claimed    = founders.filter(f => f.profileStatus === 'claimed' || f.profileStatus === 'verified')
  const selfJoined = founders.filter(f => !!f.userId && f.profileStatus !== 'village-curated')
  const curatedByStaff = founders.filter(f => f.profileStatus === 'village-curated')
  const joinSourceCounts = topN(selfJoined.filter(f => f.joinSource), f => JOIN_SOURCE_LABELS[f.joinSource!] ?? f.joinSource!, 8)
  const maxJoinSource = joinSourceCounts[0]?.count ?? 1
  const noSourceGiven = selfJoined.filter(f => !f.joinSource).length
  const withBiz     = founders.filter(f => businesses.some(b => b.founderId === f.id))
  const withYT      = founders.filter(f => !!f.youtube)
  const withPodcast = founders.filter(f => !!f.podcast)

  const claimRate = founders.length > 0
    ? `${Math.round((claimed.length / founders.length) * 100)}%`
    : '0%'
  const avgStoriesPerFounder = founders.length > 0 ? (stories.length / founders.length).toFixed(1) : '0'
  const avgBizPerFounder     = founders.length > 0 ? (businesses.length / founders.length).toFixed(1) : '0'
  const avgContentPerFounder = founders.length > 0 ? (allContent.length / founders.length).toFixed(1) : '0'

  const topIndustries = topN(founders, f => f.industry.name)
  const topLocations  = topN(founders, f => f.location.name)
  const topTopics     = topN(founders.flatMap(f => f.topics), t => t.name)
  const maxInd = topIndustries[0]?.count ?? 1
  const maxLoc = topLocations[0]?.count ?? 1
  const maxTop = topTopics[0]?.count ?? 1

  const [tab, setTab] = useState('analytics')
  const TABS: DashTab[] = [
    { key: 'analytics', label: 'Analytics' },
    { key: 'activity', label: 'Recent Activity' },
  ]

  return (
    <div className="p-8 max-w-5xl" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <div className="mb-6">
        <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-widest mb-1">CAPO · Village Staff</p>
        <h1 className="text-2xl font-bold text-[#2D2A26]">Overview</h1>
        <p className="text-sm text-[#6B7280] mt-0.5">The operating system for CULO Village.</p>
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} className="mb-8" />

      {tab === 'analytics' && (
      <>
      {/* Founder stats live on the Founders page itself now (Total/Curated/
          Claimed/Filtered) — this used to duplicate them here with slightly
          different numbers depending on which page you checked. */}
      <p className="text-xs text-[#9CA3AF] -mt-4 mb-6">
        Founder counts (total, curated, claimed) live on the{' '}
        <Link to="/dashboard/village/founders" className="text-[#C86A43] font-semibold hover:underline">Founders page</Link> now.
      </p>

      <section className="mb-8">
        <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest mb-3">Content</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Businesses"        value={businesses.length}       color="text-[#2D2A26]" to="/dashboard/village/opportunities?tab=spotlight" />
          <StatCard label="Published Stories" value={publishedStories.length} color="text-[#2D2A26]" to="/dashboard/village/opportunities?tab=spotlight" />
          <StatCard label="Public Imports"    value={publicContent.length}    color="text-[#2D2A26]" to="/dashboard/village/opportunities?tab=spotlight" />
          <StatCard label="Total Imports"     value={allContent.length}       color="text-[#2D2A26]" />
        </div>
      </section>

      <section className="mb-8">
        <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest mb-3">Operations</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Pending Claims"    value={pendingClaims.length}  color={pendingClaims.length > 0 ? 'text-amber-600' : 'text-[#2D2A26]'} to="/dashboard/village/opportunities?tab=claims" />
          <StatCard label="Claim Pending"     value={claimPending.length}   color="text-amber-600"  to="/dashboard/village/opportunities?tab=claims" />
          <StatCard label="Import Batches"    value={batches.length}        color="text-[#2D2A26]"  to="/dashboard/village/founders?tab=imports" />
          <StatCard label="Via Bulk Import"   value={totalImported}         color="text-[#2D2A26]"  to="/dashboard/village/founders?tab=imports" />
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

      {/* Everything below here is admin/owner only — same 'analytics'
          permission the standalone page always required. */}
      {canSeeAnalytics && (
      <>
      <section className="mb-8">
        <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest mb-3">CULO Creatives Join Funnel</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Joined via /join"  value={joinedViaJoinFlow.length}   color="text-[#2D2A26]" to="/dashboard/village/founders" />
          <StatCard label="Password Set"      value={passwordSetCount}           color="text-[#2D2A26]" sub={`of ${joinedViaJoinFlow.length} joined`} />
          <StatCard label="Locked In $19/mo"  value={lockedInCollaborators}      color="text-[#5E6B4A]" to="/dashboard/village/creative-feedback" />
          <StatCard label="From Canva"        value={fromCanva.length}          color="text-[#2D2A26]" sub={`vs ${fromVillage.length} from Village`} />
        </div>
      </section>

      <section className="mb-8">
        <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest mb-3">Founder Health</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Claim Rate"    value={claimRate}          color="text-[#5E6B4A]" />
          <StatCard label="With Business" value={withBiz.length}     sub={`${Math.round((withBiz.length / Math.max(founders.length, 1)) * 100)}% of founders`} />
          <StatCard label="With YouTube"  value={withYT.length}      />
          <StatCard label="With Podcast"  value={withPodcast.length} />
        </div>
        <div className="grid grid-cols-3 gap-3 mt-3">
          <StatCard label="Avg Stories"    value={avgStoriesPerFounder}  color="text-[#2D2A26]" />
          <StatCard label="Avg Businesses" value={avgBizPerFounder}      color="text-[#2D2A26]" />
          <StatCard label="Avg Imports"    value={avgContentPerFounder}  color="text-[#2D2A26]" />
        </div>
      </section>

      <section className="mb-8">
        <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest mb-3">How Founders Joined</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          <StatCard label="Curated by Staff"  value={curatedByStaff.length} color="text-blue-700"  sub="Village found and added them" />
          <StatCard label="Joined Themselves" value={selfJoined.length}     color="text-[#5E6B4A]" sub="Signed up via Onboarding" />
          <StatCard label="No Source Given"   value={noSourceGiven}         color="text-[#9CA3AF]" sub="Self-joined, skipped the question" />
        </div>
        <div className="bg-white rounded-xl border border-[#E8E4DD] px-5 py-4 space-y-3">
          <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-widest mb-1">Where self-joined founders heard about us</p>
          {joinSourceCounts.length === 0
            ? <p className="text-xs text-[#9CA3AF]">No data yet — founders haven't answered this on signup, or none have self-joined.</p>
            : joinSourceCounts.map(d => <BarRow key={d.label} label={d.label} count={d.count} max={maxJoinSource} />)
          }
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <section>
          <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest mb-3">Top Industries</p>
          <div className="bg-white rounded-xl border border-[#E8E4DD] px-5 py-4 space-y-3">
            {topIndustries.length === 0
              ? <p className="text-xs text-[#9CA3AF]">No data yet.</p>
              : topIndustries.map(d => <BarRow key={d.label} label={d.label} count={d.count} max={maxInd} />)
            }
          </div>
        </section>
        <section>
          <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest mb-3">Top Locations</p>
          <div className="bg-white rounded-xl border border-[#E8E4DD] px-5 py-4 space-y-3">
            {topLocations.length === 0
              ? <p className="text-xs text-[#9CA3AF]">No data yet.</p>
              : topLocations.map(d => <BarRow key={d.label} label={d.label} count={d.count} max={maxLoc} />)
            }
          </div>
        </section>
        <section>
          <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest mb-3">Top Topics</p>
          <div className="bg-white rounded-xl border border-[#E8E4DD] px-5 py-4 space-y-3">
            {topTopics.length === 0
              ? <p className="text-xs text-[#9CA3AF]">No data yet.</p>
              : topTopics.map(d => <BarRow key={d.label} label={d.label} count={d.count} max={maxTop} />)
            }
          </div>
        </section>
      </div>
      </>
      )}
      </>
      )}

      {tab === 'activity' && (
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
      )}
    </div>
  )
}
