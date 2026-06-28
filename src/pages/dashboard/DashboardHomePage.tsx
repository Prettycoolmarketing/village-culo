import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { getStories } from '../../services/stories'
import { getFounders } from '../../services/founders'
import { getBusinesses } from '../../services/businesses'
import { getIdeas } from '../../services/ideas'
import { getLibraryItems } from '../../services/library'
import { getMedia } from '../../services/media'

// ─── Stat card ────────────────────────────────────────────────────────────────

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

// ─── Quick action ─────────────────────────────────────────────────────────────

function QuickAction({ label, description, to }: { label: string; description: string; to: string }) {
  return (
    <Link
      to={to}
      className="flex items-start gap-3 p-4 rounded-xl border border-[#E8E4DD] bg-white hover:border-[#C86A43]/40 hover:shadow-sm transition-all"
    >
      <div className="w-2 h-2 rounded-full bg-[#C86A43] mt-1.5 shrink-0" />
      <div>
        <p className="text-sm font-semibold text-[#2D2A26]">{label}</p>
        <p className="text-xs text-[#6B7280] mt-0.5">{description}</p>
      </div>
    </Link>
  )
}

// ─── DashboardHomePage ────────────────────────────────────────────────────────

export function DashboardHomePage() {
  const { user, isConfigured } = useAuth()

  const storiesCount  = getStories().length
  const foundersCount = getFounders().length
  const bizCount      = getBusinesses().length
  const ideasCount    = getIdeas().length
  const libraryCount  = getLibraryItems().length
  const mediaCount    = getMedia().length

  const recentStories = getStories({ limit: 5 })

  const firstName = user?.email?.split('@')[0] ?? 'Publisher'

  return (
    <div className="p-8 max-w-5xl" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#2D2A26]">Welcome back, {firstName}</h1>
        <p className="text-sm text-[#6B7280] mt-1">Here's a snapshot of your Village content.</p>
        {!isConfigured && (
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-700">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
            Dev mode — Supabase not connected. Changes are not persisted.
          </div>
        )}
      </div>

      {/* Stats grid */}
      <section className="mb-10" aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest mb-4">Village Content</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard label="Stories"    value={storiesCount}  to="/dashboard/stories"    />
          <StatCard label="Founders"   value={foundersCount} to="/dashboard/profile"    />
          <StatCard label="Businesses" value={bizCount}      to="/dashboard/businesses" />
          <StatCard label="Ideas"      value={ideasCount}    to="/dashboard/ideas"      />
          <StatCard label="Library"    value={libraryCount}  to="/dashboard/library"    />
          <StatCard label="Media"      value={mediaCount}    to="/dashboard/media"      />
        </div>
      </section>

      {/* Quick actions */}
      <section className="mb-10" aria-labelledby="actions-heading">
        <h2 id="actions-heading" className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <QuickAction label="Edit Profile"        description="Update your bio, photo and social links"   to="/dashboard/profile"    />
          <QuickAction label="Manage Businesses"   description="Edit your business listings and offers"    to="/dashboard/businesses" />
          <QuickAction label="Review Media"        description="Manage your media library and approvals"   to="/dashboard/media"      />
          <QuickAction label="Browse Stories"      description="View and manage your published stories"    to="/dashboard/stories"    />
          <QuickAction label="Import Sources"      description="Connect Instagram, LinkedIn, OneDrive"     to="/dashboard/import-sources" />
          <QuickAction label="Settings"            description="Manage your account and preferences"       to="/dashboard/settings"   />
        </div>
      </section>

      {/* Recent stories */}
      <section aria-labelledby="recent-heading">
        <div className="flex items-center justify-between mb-4">
          <h2 id="recent-heading" className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest">Recent Stories</h2>
          <Link to="/dashboard/stories" className="text-xs text-[#C86A43] hover:underline">View all</Link>
        </div>
        <div className="bg-white rounded-xl border border-[#E8E4DD] divide-y divide-[#F3EDE6]">
          {recentStories.map(story => (
            <div key={story.id} className="flex items-center gap-4 px-5 py-3.5">
              <img
                src={story.coverImage}
                alt=""
                className="w-10 h-10 rounded-lg object-cover shrink-0 bg-[#F3EDE6]"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#2D2A26] truncate">{story.title}</p>
                <p className="text-xs text-[#9CA3AF] mt-0.5">{story.contentTypes.join(' · ')} · {story.createdAt}</p>
              </div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                story.status === 'published' || story.status === 'featured'
                  ? 'bg-green-100 text-green-700'
                  : story.status === 'draft'
                  ? 'bg-[#F3EDE6] text-[#9CA3AF]'
                  : 'bg-amber-100 text-amber-700'
              }`}>
                {story.status}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
