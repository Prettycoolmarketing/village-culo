import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { getStories } from '../../services/stories'
import { getFounders } from '../../services/founders'
import { getBusinesses } from '../../services/businesses'
import { getIdeas } from '../../services/ideas'
import { getLibraryItems } from '../../services/library'
import { getMedia } from '../../services/media'
import { PublishingHealthCard } from '../../components/dashboard/PublishingHealth'
import {
  getFounderMissingItems,
  getBusinessMissingItems,
  getStoryMissingItems,
  getLibraryMissingItems,
} from '../../utils/missingAssets'

// ─── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, to }: { label: string; value: number; to: string }) {
  return (
    <Link
      to={to}
      className="bg-white rounded-xl border border-[#E8E4DD] px-5 py-4 hover:border-[#C86A43]/40 hover:shadow-sm transition-all group"
    >
      <p className="text-3xl font-bold text-[#2D2A26] group-hover:text-[#C86A43] transition-colors">{value}</p>
      <p className="text-sm text-[#6B7280] mt-0.5">{label}</p>
    </Link>
  )
}

// ─── DashboardHomePage ─────────────────────────────────────────────────────────

export function DashboardHomePage() {
  const { user, isConfigured } = useAuth()

  const allStories  = getStories()
  const allFounders = getFounders()
  const allBiz      = getBusinesses()
  const allIdeas    = getIdeas()
  const allLibrary  = getLibraryItems()
  const allMedia    = getMedia()

  const recentStories = allStories.slice(0, 5)
  const firstName = user?.email?.split('@')[0] ?? 'Publisher'

  // Publishing health
  const founderHealth  = allFounders.map(f  => ({ name: f.name,    missing: getFounderMissingItems(f),  path: '/dashboard/profile'      }))
  const bizHealth      = allBiz.slice(0, 6).map(b  => ({ name: b.name,    missing: getBusinessMissingItems(b),  path: '/dashboard/businesses' }))
  const storyHealth    = allStories.slice(0, 6).map(s => ({ name: s.title,   missing: getStoryMissingItems(s),    path: '/dashboard/stories'    }))
  const libraryHealth  = allLibrary.slice(0, 4).map(l => ({ name: l.title,   missing: getLibraryMissingItems(l),  path: '/dashboard/library'    }))

  const pendingMedia = allMedia.filter(m => m.approvalStatus === 'needs-review' || m.approvalStatus === 'pending').length
  const totalIssues  = [
    ...allFounders.flatMap(f  => getFounderMissingItems(f).filter(i => i.severity === 'critical')),
    ...allBiz.flatMap(b       => getBusinessMissingItems(b).filter(i => i.severity === 'critical')),
    ...allStories.flatMap(s   => getStoryMissingItems(s).filter(i => i.severity === 'critical')),
  ].length

  return (
    <div className="p-8 max-w-5xl" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#2D2A26]">Welcome back, {firstName}</h1>
          <p className="text-sm text-[#6B7280] mt-1">Publishing Operating System</p>
        </div>
        {!isConfigured && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-700">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
            Dev mode — Supabase not connected
          </div>
        )}
      </div>

      {/* Alert bar */}
      {(totalIssues > 0 || pendingMedia > 0) && (
        <div className="mb-8 flex flex-wrap gap-3">
          {totalIssues > 0 && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 border border-red-200">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
              <p className="text-sm font-medium text-red-700">{totalIssues} critical publishing issues</p>
              <Link to="/dashboard/profile" className="text-xs text-red-600 hover:underline ml-1">Review →</Link>
            </div>
          )}
          {pendingMedia > 0 && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
              <p className="text-sm font-medium text-amber-700">{pendingMedia} media assets awaiting approval</p>
              <Link to="/dashboard/media" className="text-xs text-amber-600 hover:underline ml-1">Review →</Link>
            </div>
          )}
        </div>
      )}

      {/* Content stats */}
      <section className="mb-10" aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest mb-4">Village Content</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard label="Stories"    value={allStories.length}  to="/dashboard/stories"    />
          <StatCard label="Founders"   value={allFounders.length} to="/dashboard/profile"    />
          <StatCard label="Businesses" value={allBiz.length}      to="/dashboard/businesses" />
          <StatCard label="Ideas"      value={allIdeas.length}    to="/dashboard/ideas"      />
          <StatCard label="Library"    value={allLibrary.length}  to="/dashboard/library"    />
          <StatCard label="Media"      value={allMedia.length}    to="/dashboard/media"      />
        </div>
      </section>

      {/* Publishing health */}
      <section className="mb-10" aria-labelledby="health-heading">
        <div className="flex items-center justify-between mb-4">
          <h2 id="health-heading" className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest">Publishing Health</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Founders */}
          <div>
            <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-widest mb-2">Founders</p>
            <div className="flex flex-col gap-2">
              {founderHealth.map((h, i) => (
                <PublishingHealthCard key={i} title={h.name} missing={h.missing} editPath={h.path} />
              ))}
            </div>
          </div>

          {/* Businesses */}
          <div>
            <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-widest mb-2">Businesses</p>
            <div className="flex flex-col gap-2">
              {bizHealth.map((h, i) => (
                <PublishingHealthCard key={i} title={h.name} missing={h.missing} editPath={h.path} />
              ))}
            </div>
          </div>

          {/* Stories */}
          <div>
            <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-widest mb-2">Stories</p>
            <div className="flex flex-col gap-2">
              {storyHealth.map((h, i) => (
                <PublishingHealthCard key={i} title={h.name} missing={h.missing} editPath={h.path} />
              ))}
            </div>
          </div>

          {/* Library */}
          <div>
            <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-widest mb-2">Library</p>
            <div className="flex flex-col gap-2">
              {libraryHealth.map((h, i) => (
                <PublishingHealthCard key={i} title={h.name} missing={h.missing} editPath={h.path} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Recent stories */}
      <section aria-labelledby="recent-heading">
        <div className="flex items-center justify-between mb-4">
          <h2 id="recent-heading" className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest">Recent Stories</h2>
          <Link to="/dashboard/stories" className="text-xs text-[#C86A43] hover:underline">View all</Link>
        </div>
        <div className="bg-white rounded-xl border border-[#E8E4DD] divide-y divide-[#F3EDE6]">
          {recentStories.map(story => {
            const missing = getStoryMissingItems(story)
            const critical = missing.filter(m => m.severity === 'critical').length
            return (
              <div key={story.id} className="flex items-center gap-4 px-5 py-3.5">
                <img src={story.coverImage} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0 bg-[#F3EDE6]" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#2D2A26] truncate">{story.title}</p>
                  <p className="text-xs text-[#9CA3AF] mt-0.5">{story.contentTypes.join(' · ')} · {story.createdAt}</p>
                </div>
                {critical > 0 && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600 shrink-0">
                    {critical} critical
                  </span>
                )}
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                  story.status === 'published' || story.status === 'featured'
                    ? 'bg-green-100 text-green-700'
                    : story.status === 'draft'
                    ? 'bg-[#F3EDE6] text-[#9CA3AF]'
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {story.status}
                </span>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
