import { useState } from 'react'
import { getStories } from '../../services/stories'

export function DashboardStoriesPage() {
  const [search, setSearch] = useState('')

  const allStories = getStories()
  const stories = search
    ? allStories.filter(s =>
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        s.summary.toLowerCase().includes(search.toLowerCase())
      )
    : allStories

  return (
    <div className="p-8 max-w-4xl" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#2D2A26]">Stories</h1>
          <p className="text-sm text-[#6B7280] mt-1">{allStories.length} stories in the Village</p>
        </div>
      </div>

      <div className="mb-5">
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search stories…"
          className="w-full max-w-sm px-3 py-2.5 rounded-lg border border-[#E8E4DD] text-sm text-[#2D2A26] bg-white focus:outline-none focus:ring-2 focus:ring-[#C86A43]/30 focus:border-[#C86A43] transition-colors"
        />
      </div>

      <div className="bg-white rounded-xl border border-[#E8E4DD] overflow-hidden">
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-4 px-5 py-2.5 border-b border-[#F3EDE6] bg-[#F8F5F0]">
          <span className="w-10" />
          <span className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-widest">Title</span>
          <span className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-widest w-24">Format</span>
          <span className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-widest w-20">Status</span>
          <span className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-widest w-8" />
        </div>

        {stories.length === 0 ? (
          <p className="px-5 py-8 text-sm text-[#9CA3AF] text-center">No stories match your search.</p>
        ) : (
          <div className="divide-y divide-[#F3EDE6]">
            {stories.map(story => (
              <div key={story.id} className="grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-4 px-5 py-3.5 hover:bg-[#FDFCFB] transition-colors">
                <img
                  src={story.coverImage}
                  alt=""
                  className="w-10 h-10 rounded-lg object-cover bg-[#F3EDE6]"
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#2D2A26] truncate">{story.title}</p>
                  <p className="text-xs text-[#9CA3AF] mt-0.5">{story.createdAt}</p>
                </div>
                <span className="text-xs text-[#6B7280] w-24 truncate">
                  {story.contentTypes.join(', ')}
                </span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full w-20 text-center ${
                  story.status === 'published' || story.status === 'featured'
                    ? 'bg-green-100 text-green-700'
                    : story.status === 'draft'
                    ? 'bg-[#F3EDE6] text-[#9CA3AF]'
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {story.status}
                </span>
                <a
                  href={`/stories/${story.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#9CA3AF] hover:text-[#C86A43] transition-colors text-sm w-8 text-center"
                  title="View on site"
                >
                  ↗
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
