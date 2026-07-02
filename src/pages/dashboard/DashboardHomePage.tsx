import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { getCurrentFounder } from '../../services/currentFounder'
import { getStories } from '../../services/stories'
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
  type MissingItem,
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

// ─── Recommendation row ─────────────────────────────────────────────────────────

interface Recommendation {
  key: string
  title: string
  action: MissingItem
  path: string
}

function RecommendationRow({ rec }: { rec: Recommendation }) {
  return (
    <Link
      to={rec.path}
      className="flex items-center gap-3 px-5 py-3.5 hover:bg-[#FBF8F4] transition-colors group"
    >
      <span className="w-5 h-5 rounded-md border-2 border-[#E8E4DD] shrink-0 group-hover:border-[#C86A43] transition-colors" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#2D2A26]">{rec.action.label}</p>
        <p className="text-xs text-[#9CA3AF] mt-0.5 truncate">{rec.title}</p>
      </div>
      <span className="text-xs font-semibold text-[#C86A43] shrink-0">{rec.action.action} →</span>
    </Link>
  )
}

// ─── DashboardHomePage ─────────────────────────────────────────────────────────
// Everything on this page is scoped to the signed-in founder and their own
// linked businesses/stories/library/media — never another founder's content.
// Cross-founder diagnostics and curation live in CAPO, not here (see
// utils/permissions.ts and the CAPO nav in DashboardLayout).

export function DashboardHomePage() {
  const { user, isConfigured } = useAuth()
  const founder = getCurrentFounder(user)
  const firstName = user?.email?.split('@')[0] ?? 'Publisher'

  if (!founder) {
    return (
      <div className="p-8 max-w-2xl" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <h1 className="text-2xl font-bold text-[#2D2A26] mb-1">Welcome back, {firstName}</h1>
        <p className="text-sm text-[#6B7280] mb-8">Publishing Operating System</p>
        <div className="bg-white rounded-xl border border-[#E8E4DD] px-6 py-8 text-center">
          <p className="text-sm font-semibold text-[#2D2A26] mb-2">Create your founder profile to get started</p>
          <p className="text-xs text-[#9CA3AF] mb-4">Tell readers who you are so your stories and ideas have a home in the Village.</p>
          <Link to="/onboarding" className="inline-flex px-5 py-2.5 bg-[#C86A43] text-white text-sm font-semibold rounded-xl hover:bg-[#b05a35] transition-colors">
            Create Profile
          </Link>
        </div>
      </div>
    )
  }

  const myBusinesses = getBusinesses().filter(b => b.founderId === founder.id)
  const myStories    = getStories({ founderId: founder.id })
  const myIdeas      = getIdeas({ founderId: founder.id })
  const myLibrary    = getLibraryItems({ founderId: founder.id })
  const myMedia      = getMedia({ founderId: founder.id })

  const recentStories = myStories.slice(0, 5)

  // Today's recommendations — the single most valuable next action for THIS
  // founder's own content, never another founder's.
  const recommendations: Recommendation[] = []
  const [founderTop] = getFounderMissingItems(founder)
  if (founderTop) recommendations.push({ key: `founder-${founder.id}`, title: 'Your founder profile', action: founderTop, path: '/dashboard/profile' })
  for (const b of myBusinesses) {
    const [top] = getBusinessMissingItems(b)
    if (top) recommendations.push({ key: `biz-${b.id}`, title: b.name, action: top, path: '/dashboard/businesses' })
  }
  for (const s of myStories) {
    const [top] = getStoryMissingItems(s)
    if (top) recommendations.push({ key: `story-${s.id}`, title: s.title, action: top, path: '/dashboard/stories' })
  }
  if (myStories.length === 0) {
    recommendations.push({
      key: 'first-story',
      title: 'You haven\'t published a story yet',
      action: { field: 'first-story', label: 'Publish your first story to start growing your presence', action: 'Publish Story', severity: 'critical' },
      path: '/dashboard/publish',
    })
  }
  const myPendingMedia = myMedia.filter(m => m.approvalStatus === 'needs-review' || m.approvalStatus === 'pending').length
  if (myPendingMedia > 0) {
    recommendations.push({
      key: 'media-review',
      title: `${myPendingMedia} ${myPendingMedia === 1 ? 'asset' : 'assets'} uploaded`,
      action: { field: 'media', label: 'Review your uploaded media', action: 'Review Media', severity: 'important' },
      path: '/dashboard/media',
    })
  }
  const topRecommendations = recommendations.slice(0, 6)

  // Profile progress — this founder and their own businesses/stories/library only.
  const founderHealth = [{ name: founder.name, missing: getFounderMissingItems(founder), path: '/dashboard/profile' }]
  const bizHealth      = myBusinesses.map(b => ({ name: b.name,  missing: getBusinessMissingItems(b), path: '/dashboard/businesses' }))
  const storyHealth    = myStories.slice(0, 6).map(s => ({ name: s.title, missing: getStoryMissingItems(s), path: '/dashboard/stories' }))
  const libraryHealth  = myLibrary.slice(0, 4).map(l => ({ name: l.title, missing: getLibraryMissingItems(l), path: '/dashboard/library' }))

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

      {/* Today's recommendations */}
      <section className="mb-10" aria-labelledby="recs-heading">
        <h2 id="recs-heading" className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest mb-4">Today's Recommendations</h2>
        {topRecommendations.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#E8E4DD] px-5 py-8 text-center">
            <p className="text-sm font-semibold text-[#2D2A26]">You're all caught up.</p>
            <p className="text-xs text-[#9CA3AF] mt-1">Nothing needs your attention right now — great work.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-[#E8E4DD] divide-y divide-[#F3EDE6]">
            {topRecommendations.map(rec => <RecommendationRow key={rec.key} rec={rec} />)}
          </div>
        )}
      </section>

      {/* Content stats — this founder's own content only */}
      <section className="mb-10" aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest mb-4">Your Content</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <StatCard label="Stories"    value={myStories.length}    to="/dashboard/stories"    />
          <StatCard label="Businesses" value={myBusinesses.length} to="/dashboard/businesses" />
          <StatCard label="Ideas"      value={myIdeas.length}      to="/dashboard/ideas"      />
          <StatCard label="Library"    value={myLibrary.length}    to="/dashboard/library"    />
          <StatCard label="Media"      value={myMedia.length}      to="/dashboard/media"      />
        </div>
      </section>

      {/* Profile progress */}
      <section className="mb-10" aria-labelledby="progress-heading">
        <div className="flex items-center justify-between mb-4">
          <h2 id="progress-heading" className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest">Profile Progress</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Founder */}
          <div>
            <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-widest mb-2">Founder Profile</p>
            <div className="flex flex-col gap-2">
              {founderHealth.map((h, i) => (
                <PublishingHealthCard key={i} title={h.name} missing={h.missing} editPath={h.path} />
              ))}
            </div>
          </div>

          {/* Businesses */}
          {myBusinesses.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-widest mb-2">Businesses</p>
              <div className="flex flex-col gap-2">
                {bizHealth.map((h, i) => (
                  <PublishingHealthCard key={i} title={h.name} missing={h.missing} editPath={h.path} />
                ))}
              </div>
            </div>
          )}

          {/* Stories */}
          {myStories.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-widest mb-2">Stories</p>
              <div className="flex flex-col gap-2">
                {storyHealth.map((h, i) => (
                  <PublishingHealthCard key={i} title={h.name} missing={h.missing} editPath={h.path} />
                ))}
              </div>
            </div>
          )}

          {/* Library */}
          {myLibrary.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-widest mb-2">Library</p>
              <div className="flex flex-col gap-2">
                {libraryHealth.map((h, i) => (
                  <PublishingHealthCard key={i} title={h.name} missing={h.missing} editPath={h.path} />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Recent stories */}
      <section aria-labelledby="recent-heading">
        <div className="flex items-center justify-between mb-4">
          <h2 id="recent-heading" className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest">Your Recent Stories</h2>
          <Link to="/dashboard/stories" className="text-xs text-[#C86A43] hover:underline">View all</Link>
        </div>
        {recentStories.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#E8E4DD] px-5 py-8 text-center">
            <p className="text-sm font-semibold text-[#2D2A26]">Everyone starts with one story. Let's publish yours.</p>
            <Link to="/dashboard/publish" className="inline-flex mt-3 px-4 py-2 bg-[#C86A43] text-white text-xs font-semibold rounded-lg hover:bg-[#b05a35] transition-colors">
              Publish Story
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-[#E8E4DD] divide-y divide-[#F3EDE6]">
            {recentStories.map(story => {
              const missing = getStoryMissingItems(story)
              return (
                <div key={story.id} className="flex items-center gap-4 px-5 py-3.5">
                  <img src={story.coverImage} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0 bg-[#F3EDE6]" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#2D2A26] truncate">{story.title}</p>
                    <p className="text-xs text-[#9CA3AF] mt-0.5">{story.contentTypes.join(' · ')} · {story.createdAt}</p>
                  </div>
                  {missing.length === 0 ? (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 shrink-0">
                      Ready to publish
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#FBF1EB] text-[#C86A43] shrink-0">
                      {missing.length} recommended
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
        )}
      </section>
    </div>
  )
}
