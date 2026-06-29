import { getFounders } from '../../../services/founders'
import { getBusinesses } from '../../../services/businesses'
import { getStories } from '../../../services/stories'
import { importedContentService } from '../../../services/importedContent'
import { founderClaimService } from '../../../services/founderClaim'
import { importBatchService } from '../../../services/importBatch'

function StatCard({ label, value, sub, color = 'text-[#2D2A26]' }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-white rounded-xl border border-[#E8E4DD] px-4 py-3">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-[#9CA3AF] mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-[#C8C3BC] mt-0.5">{sub}</p>}
    </div>
  )
}

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

export function VillageAnalyticsPage() {
  const founders   = getFounders()
  const businesses = getBusinesses()
  const stories    = getStories({ publicOnly: true })
  const allContent = importedContentService.getAll()
  const claims     = founderClaimService.getAll()
  const batches    = importBatchService.getAll()

  const published  = founders.filter(f => f.status === 'published' || f.status === 'featured')
  const curated    = founders.filter(f => f.profileStatus === 'village-curated')
  const claimed    = founders.filter(f => f.profileStatus === 'claimed' || f.profileStatus === 'verified')
  const withBiz    = founders.filter(f => !!f.businessId)
  const withYT     = founders.filter(f => !!f.youtube)
  const withPodcast = founders.filter(f => !!f.podcast)

  const claimRate = founders.length > 0
    ? `${Math.round((claimed.length / founders.length) * 100)}%`
    : '0%'

  const avgStoriesPerFounder = founders.length > 0
    ? (stories.length / founders.length).toFixed(1)
    : '0'

  const avgBizPerFounder = founders.length > 0
    ? (businesses.length / founders.length).toFixed(1)
    : '0'

  const avgContentPerFounder = founders.length > 0
    ? (allContent.length / founders.length).toFixed(1)
    : '0'

  const totalPublicPages = published.length + businesses.length + stories.length

  // Top distributions
  const topIndustries = topN(founders, f => f.industry.name)
  const topLocations  = topN(founders, f => f.location.name)
  const topTopics     = topN(founders.flatMap(f => f.topics), t => t.name)
  const maxInd = topIndustries[0]?.count ?? 1
  const maxLoc = topLocations[0]?.count ?? 1
  const maxTop = topTopics[0]?.count ?? 1

  // Import batch stats
  const totalBatchCreated = batches.reduce((s, b) => s + b.created, 0)
  const totalBatchSkipped = batches.reduce((s, b) => s + b.skipped, 0)
  const totalBatchErrors  = batches.reduce((s, b) => s + b.errored, 0)

  // Newest founders
  const newestFounders = [...founders]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 8)

  return (
    <div className="p-8 max-w-5xl" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      <div className="mb-8">
        <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-widest mb-1">Village HQ</p>
        <h1 className="text-2xl font-bold text-[#2D2A26]">Village Analytics</h1>
        <p className="text-sm text-[#6B7280] mt-0.5">Internal metrics. No external analytics required.</p>
      </div>

      {/* Public pages */}
      <section className="mb-8">
        <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest mb-3">Public Pages</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Total Public Pages"  value={totalPublicPages}        color="text-[#C86A43]" />
          <StatCard label="Published Founders"  value={published.length}        color="text-[#C86A43]" />
          <StatCard label="Businesses"          value={businesses.length}       color="text-[#2D2A26]" />
          <StatCard label="Published Stories"   value={stories.length}          color="text-[#2D2A26]" />
        </div>
      </section>

      {/* Founder breakdown */}
      <section className="mb-8">
        <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest mb-3">Founder Breakdown</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Village Curated"     value={curated.length}          color="text-blue-700"  />
          <StatCard label="Claimed / Verified"  value={claimed.length}          color="text-[#5E6B4A]" />
          <StatCard label="Claim Rate"          value={claimRate}               color="text-[#5E6B4A]" />
          <StatCard label="Pending Claims"      value={claims.filter(c => c.status === 'pending').length} color="text-amber-600" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
          <StatCard label="With Business"       value={withBiz.length}          sub={`${Math.round((withBiz.length / Math.max(founders.length, 1)) * 100)}% of founders`} />
          <StatCard label="With YouTube"        value={withYT.length}           />
          <StatCard label="With Podcast"        value={withPodcast.length}      />
          <StatCard label="Imported Content"    value={allContent.length}       />
        </div>
      </section>

      {/* Averages */}
      <section className="mb-8">
        <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest mb-3">Averages per Founder</p>
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Avg Stories"   value={avgStoriesPerFounder}  color="text-[#2D2A26]" />
          <StatCard label="Avg Businesses" value={avgBizPerFounder}     color="text-[#2D2A26]" />
          <StatCard label="Avg Imports"   value={avgContentPerFounder}  color="text-[#2D2A26]" />
        </div>
      </section>

      {/* Import batches */}
      <section className="mb-8">
        <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest mb-3">Bulk Import Stats</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Total Batches"  value={batches.length}       color="text-[#2D2A26]" />
          <StatCard label="Created"        value={totalBatchCreated}    color="text-[#5E6B4A]" />
          <StatCard label="Skipped"        value={totalBatchSkipped}    color="text-[#9CA3AF]" />
          <StatCard label="Errors"         value={totalBatchErrors}     color={totalBatchErrors > 0 ? 'text-red-500' : 'text-[#9CA3AF]'} />
        </div>
      </section>

      {/* Distributions */}
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

      {/* Newest founders */}
      <section>
        <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest mb-3">Newest Founders</p>
        <div className="bg-white rounded-xl border border-[#E8E4DD] divide-y divide-[#F3EDE6]">
          {newestFounders.length === 0 ? (
            <div className="px-5 py-6 text-center"><p className="text-xs text-[#9CA3AF]">No founders yet.</p></div>
          ) : newestFounders.map(f => (
            <div key={f.id} className="flex items-center gap-3 px-5 py-3">
              <div className="w-7 h-7 rounded-full bg-[#F3EDE6] flex-shrink-0 flex items-center justify-center text-[#C86A43] text-xs font-bold">
                {f.avatar ? <img src={f.avatar} alt="" className="w-full h-full rounded-full object-cover" /> : f.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#2D2A26] truncate">{f.name}</p>
                <p className="text-[10px] text-[#9CA3AF]">{f.industry.name} · {new Date(f.createdAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              </div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${
                f.profileStatus === 'village-curated' ? 'bg-blue-50 text-blue-700'
                : f.profileStatus === 'claimed' ? 'bg-[#5E6B4A]/10 text-[#5E6B4A]'
                : 'bg-[#F3EDE6] text-[#9CA3AF]'
              }`}>
                {f.profileStatus ?? f.status}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Placeholders for future growth charts */}
      <div className="mt-8 bg-[#F8F5F0] rounded-xl px-5 py-4">
        <p className="text-xs font-semibold text-[#9CA3AF] mb-1">Growth Charts — Coming in Sprint 21</p>
        <p className="text-[10px] text-[#C8C3BC]">Founder growth over time, claim rate trend, content velocity. Planned for Discovery Engine sprint.</p>
      </div>
    </div>
  )
}
