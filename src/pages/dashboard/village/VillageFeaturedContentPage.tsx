import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getFounders, updateFounder } from '../../../services/founders'
import { getBusinesses, updateBusiness } from '../../../services/businesses'
import { getStories, updateStory } from '../../../services/stories'
import { importedContentService } from '../../../services/importedContent'

type ContentTab = 'founders' | 'businesses' | 'stories' | 'imports'

function ToggleButton({
  active,
  onToggle,
  activeLabel = 'Featured',
  inactiveLabel = 'Feature',
}: {
  active: boolean
  onToggle: () => void
  activeLabel?: string
  inactiveLabel?: string
}) {
  return (
    <button
      onClick={onToggle}
      className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
        active
          ? 'bg-[#D6A94D]/15 text-[#D6A94D] border border-[#D6A94D]/30 hover:bg-red-50 hover:text-red-500 hover:border-red-200'
          : 'bg-[#F3EDE6] text-[#C86A43] hover:bg-[#C86A43] hover:text-white'
      }`}
    >
      {active ? activeLabel : inactiveLabel}
    </button>
  )
}

export function VillageFeaturedContentPage() {
  const [tab, setTab]   = useState<ContentTab>('founders')
  const [tick, setTick] = useState(0)
  const [toggleError, setToggleError] = useState<string | null>(null)
  const refresh = () => setTick(t => t + 1)
  void tick

  async function handleToggle(write: Promise<{ success: boolean; error?: string }>) {
    setToggleError(null)
    const result = await write
    if (!result.success) setToggleError(result.error ?? 'Failed to update. Please try again.')
    refresh()
  }

  const founders  = getFounders()
  const businesses = getBusinesses()
  const stories   = getStories()
  const imports   = importedContentService.getAll()

  const featuredFounders   = founders.filter(f => f.featured)
  const featuredBusinesses = businesses.filter(b => b.featured)
  const featuredStories    = stories.filter(s => s.featured)
  const featuredImports    = imports.filter(c => c.status === 'featured')

  const TABS: { key: ContentTab; label: string; featured: number; total: number }[] = [
    { key: 'founders',   label: 'Founders',        featured: featuredFounders.length,   total: founders.length   },
    { key: 'businesses', label: 'Businesses',       featured: featuredBusinesses.length, total: businesses.length },
    { key: 'stories',    label: 'Stories',          featured: featuredStories.length,    total: stories.length    },
    { key: 'imports',    label: 'Imported Content', featured: featuredImports.length,    total: imports.length    },
  ]

  return (
    <div className="p-8 max-w-4xl" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <div className="mb-8">
        <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-widest mb-1">CAPO</p>
        <h1 className="text-2xl font-bold text-[#2D2A26]">Featured Content</h1>
        <p className="text-sm text-[#6B7280] mt-0.5">
          Pin founders, businesses, stories and imported content for homepage and discovery visibility.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {TABS.map(t => (
          <div key={t.key} className="bg-white rounded-xl border border-[#E8E4DD] px-4 py-3">
            <p className="text-xl font-bold text-[#D6A94D]">{t.featured}</p>
            <p className="text-[10px] text-[#9CA3AF]">{t.label} featured</p>
            <p className="text-[10px] text-[#C8C3BC]">of {t.total} total</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#F8F5F0] rounded-xl p-1 w-fit mb-6">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-white text-[#2D2A26] shadow-sm' : 'text-[#6B7280] hover:text-[#2D2A26]'
            }`}
          >
            {t.label}
            {t.featured > 0 && (
              <span className="ml-1.5 text-[10px] font-bold text-[#D6A94D]">★ {t.featured}</span>
            )}
          </button>
        ))}
      </div>

      {toggleError && (
        <div className="mb-4 px-4 py-2.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {toggleError}
        </div>
      )}

      {/* Founders */}
      {tab === 'founders' && (
        <div className="bg-white rounded-xl border border-[#E8E4DD] divide-y divide-[#F3EDE6]">
          {founders.length === 0 ? (
            <div className="px-5 py-8 text-center"><p className="text-sm text-[#9CA3AF]">No founders yet.</p></div>
          ) : founders.map(f => (
            <div key={f.id} className="flex items-center gap-4 px-5 py-3.5">
              <div className="w-9 h-9 rounded-full bg-[#F3EDE6] flex-shrink-0 flex items-center justify-center text-[#C86A43] text-sm font-bold">
                {f.avatar ? <img src={f.avatar} alt="" className="w-full h-full rounded-full object-cover" /> : f.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#2D2A26] truncate">{f.name}</p>
                <p className="text-xs text-[#9CA3AF]">{f.industry.name} · {f.location.name}</p>
              </div>
              {f.featured && (
                <span className="text-[10px] font-bold text-[#D6A94D] px-2 py-0.5 bg-[#D6A94D]/10 rounded-full">★ Featured</span>
              )}
              <div className="flex items-center gap-2">
                <ToggleButton
                  active={f.featured}
                  onToggle={() => void handleToggle(updateFounder({ ...f, featured: !f.featured, status: !f.featured ? 'featured' : 'published' }))}
                />
                <Link to={`/founders/${f.slug}`} target="_blank" className="text-xs text-[#9CA3AF] hover:text-[#C86A43]">View ↗</Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Businesses */}
      {tab === 'businesses' && (
        <div className="bg-white rounded-xl border border-[#E8E4DD] divide-y divide-[#F3EDE6]">
          {businesses.length === 0 ? (
            <div className="px-5 py-8 text-center"><p className="text-sm text-[#9CA3AF]">No businesses yet.</p></div>
          ) : businesses.map(b => (
            <div key={b.id} className="flex items-center gap-4 px-5 py-3.5">
              <div className="w-9 h-9 rounded-lg bg-[#F3EDE6] flex-shrink-0 flex items-center justify-center text-[#C86A43] text-sm font-bold overflow-hidden">
                {b.logo ? <img src={b.logo} alt="" className="w-full h-full object-cover" /> : b.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#2D2A26] truncate">{b.name}</p>
                <p className="text-xs text-[#9CA3AF]">{b.industry.name} · {b.location.name}</p>
              </div>
              {b.featured && (
                <span className="text-[10px] font-bold text-[#D6A94D] px-2 py-0.5 bg-[#D6A94D]/10 rounded-full">★ Featured</span>
              )}
              <div className="flex items-center gap-2">
                <ToggleButton
                  active={b.featured}
                  onToggle={() => void handleToggle(updateBusiness({ ...b, featured: !b.featured, status: !b.featured ? 'featured' : 'published' }))}
                />
                <Link to={`/businesses/${b.slug}`} target="_blank" className="text-xs text-[#9CA3AF] hover:text-[#C86A43]">View ↗</Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stories */}
      {tab === 'stories' && (
        <div className="bg-white rounded-xl border border-[#E8E4DD] divide-y divide-[#F3EDE6]">
          {stories.length === 0 ? (
            <div className="px-5 py-8 text-center"><p className="text-sm text-[#9CA3AF]">No stories yet.</p></div>
          ) : stories.map(s => (
            <div key={s.id} className="flex items-center gap-4 px-5 py-3.5">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#2D2A26] truncate">{s.title}</p>
                <p className="text-xs text-[#9CA3AF] truncate">{s.summary?.slice(0, 80) ?? s.slug}</p>
              </div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${
                s.status === 'featured' ? 'bg-[#D6A94D]/10 text-[#D6A94D]'
                : s.status === 'published' ? 'bg-[#5E6B4A]/10 text-[#5E6B4A]'
                : 'bg-[#F3EDE6] text-[#9CA3AF]'
              }`}>
                {s.status}
              </span>
              {s.featured && (
                <span className="text-[10px] font-bold text-[#D6A94D] px-2 py-0.5 bg-[#D6A94D]/10 rounded-full">★ Featured</span>
              )}
              <div className="flex items-center gap-2">
                <ToggleButton
                  active={s.featured}
                  onToggle={() => void handleToggle(updateStory({ ...s, featured: !s.featured, status: !s.featured ? 'featured' : 'published' }))}
                />
                <Link to={`/stories/${s.slug}`} target="_blank" className="text-xs text-[#9CA3AF] hover:text-[#C86A43]">View ↗</Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Imported content */}
      {tab === 'imports' && (
        <div className="bg-white rounded-xl border border-[#E8E4DD] divide-y divide-[#F3EDE6]">
          {imports.length === 0 ? (
            <div className="px-5 py-8 text-center"><p className="text-sm text-[#9CA3AF]">No imported content yet.</p></div>
          ) : imports.map(c => (
            <div key={c.id} className="flex items-center gap-4 px-5 py-3.5">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#2D2A26] truncate">{c.title}</p>
                <p className="text-xs text-[#9CA3AF]">{c.sourcePlatform} · {c.visibility}</p>
              </div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${
                c.status === 'featured' ? 'bg-[#D6A94D]/10 text-[#D6A94D]'
                : c.status === 'published' ? 'bg-[#5E6B4A]/10 text-[#5E6B4A]'
                : 'bg-[#F3EDE6] text-[#9CA3AF]'
              }`}>
                {c.status}
              </span>
              <div className="flex items-center gap-2">
                <ToggleButton
                  active={c.status === 'featured'}
                  onToggle={() => {
                    const next = c.status === 'featured' ? 'published' : 'featured'
                    void handleToggle(importedContentService.upsert({ ...c, status: next, visibility: 'public' }))
                  }}
                />
                <a href={c.originalUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-[#9CA3AF] hover:text-[#C86A43]">Source ↗</a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
