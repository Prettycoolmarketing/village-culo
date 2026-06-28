import { useState } from 'react'
import { getIdeas } from '../../services/ideas'

export function DashboardIdeasPage() {
  const [search, setSearch] = useState('')

  const allIdeas = getIdeas()
  const ideas = search
    ? allIdeas.filter(i =>
        i.title.toLowerCase().includes(search.toLowerCase()) ||
        i.description.toLowerCase().includes(search.toLowerCase())
      )
    : allIdeas

  return (
    <div className="p-8 max-w-4xl" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#2D2A26]">Ideas</h1>
          <p className="text-sm text-[#6B7280] mt-1">{allIdeas.length} ideas in the knowledge graph</p>
        </div>
      </div>

      <div className="mb-5">
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search ideas…"
          className="w-full max-w-sm px-3 py-2.5 rounded-lg border border-[#E8E4DD] text-sm text-[#2D2A26] bg-white focus:outline-none focus:ring-2 focus:ring-[#C86A43]/30 focus:border-[#C86A43] transition-colors"
        />
      </div>

      <div className="bg-white rounded-xl border border-[#E8E4DD] divide-y divide-[#F3EDE6]">
        {ideas.length === 0 ? (
          <p className="px-5 py-8 text-sm text-[#9CA3AF] text-center">No ideas match your search.</p>
        ) : ideas.map(idea => (
          <div key={idea.id} className="flex items-start gap-4 px-5 py-4 hover:bg-[#FDFCFB] transition-colors">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-medium text-[#2D2A26]">{idea.title}</p>
                {idea.featured && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#D6A94D]/15 text-[#D6A94D]">
                    Featured
                  </span>
                )}
              </div>
              <p className="text-xs text-[#6B7280] mt-1 line-clamp-2">{idea.description}</p>
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {idea.topics.slice(0, 3).map(t => (
                  <span key={t.id} className="text-[10px] px-1.5 py-0.5 rounded bg-[#F3EDE6] text-[#6B7280]">{t.name}</span>
                ))}
              </div>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xs text-[#9CA3AF]">{idea.relatedStoryIds.length} stories</p>
              <a
                href={`/ideas/${idea.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#9CA3AF] hover:text-[#C86A43] transition-colors mt-1 inline-block"
              >
                ↗ View
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
