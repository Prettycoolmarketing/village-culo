import { useState } from 'react'
import { getLibraryItems, updateLibraryItem } from '../../services/library'
import { getFounders } from '../../services/founders'
import { getBusinesses } from '../../services/businesses'
import { Tabs } from '../../components/dashboard/Tabs'
import { MissingAssetsPanel } from '../../components/dashboard/MissingAssetsPanel'
import { FeaturedInPanel } from '../../components/dashboard/FeaturedInPanel'
import { RelationshipsPanel } from '../../components/dashboard/RelationshipsPanel'
import { HealthBadge } from '../../components/dashboard/PublishingHealth'
import { getLibraryMissingItems } from '../../utils/missingAssets'
import { getLibraryItemFeaturedIn } from '../../utils/featuredIn'
import type { LibraryItem } from '../../types'

// ─── Detail pane ──────────────────────────────────────────────────────────────

function LibraryDetailPane({ item, onClose, onSave }: { item: LibraryItem; onClose: () => void; onSave: (i: LibraryItem) => void }) {
  const [tab, setTab]     = useState('overview')
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const missing    = getLibraryMissingItems(item)
  const featuredIn = getLibraryItemFeaturedIn(item.id)

  const itemFounders = getFounders().filter(f => item.authorFounderId === f.id)
  const itemBizs     = getBusinesses().filter(b => item.businessId === b.id)

  async function handleSave() {
    setSaveError(null)
    const result = await updateLibraryItem(item)
    if (result.success) {
      setSaved(true)
      onSave(item)
    } else {
      setSaveError(result.error ?? 'Save failed. Please try again.')
    }
  }

  const TABS = [
    { key: 'overview',      label: 'Overview'      },
    { key: 'relationships', label: 'Relationships', badge: itemFounders.length + itemBizs.length },
    { key: 'featured-in',   label: 'Featured In',   badge: featuredIn.length },
    { key: 'issues',        label: 'Issues',         badge: missing.length },
  ]

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8E4DD]">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-[#2D2A26] truncate">{item.title}</p>
          <HealthBadge missing={missing} />
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          {saved && <span className="text-xs text-green-600">Saved ✓</span>}
          {saveError && <span className="text-xs text-red-600">{saveError}</span>}
          <button onClick={() => void handleSave()}
            className="px-2.5 py-1 bg-[#C86A43] text-white text-xs font-semibold rounded-lg hover:bg-[#b05a35] transition-colors">
            Save
          </button>
          <button onClick={onClose} className="text-[#9CA3AF] hover:text-[#2D2A26] text-lg leading-none">×</button>
        </div>
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} className="px-5" />

      <div className="flex-1 overflow-y-auto px-5 py-4">

        {tab === 'overview' && (
          <div className="flex flex-col gap-4">
            {item.coverImage && (
              <img src={item.coverImage} alt="" className="w-full h-32 rounded-xl object-cover bg-[#F3EDE6]" />
            )}
            <p className="text-sm text-[#4B4845] leading-relaxed line-clamp-4">{item.description}</p>
            <div className="flex flex-col gap-2 text-xs">
              {[
                ['Type',   item.productType],
                ['Status', item.status],
                ['Price',  item.price ?? 'Free'],
              ].map(([label, val]) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-[#9CA3AF]">{label}</span>
                  <span className={`font-medium ${
                    label === 'Status' && (item.status === 'available' || item.status === 'free-download') ? 'text-green-600' :
                    label === 'Status' && item.status === 'coming-soon' ? 'text-amber-600' :
                    'text-[#2D2A26]'
                  }`}>{val}</span>
                </div>
              ))}
            </div>
            {item.purchaseLinks.length > 0 && (
              <a href={item.purchaseLinks[0].url} target="_blank" rel="noopener noreferrer"
                className="text-xs text-[#C86A43] hover:underline">
                {item.purchaseLinks[0].label} ↗
              </a>
            )}
            <a href={`/library/${item.slug}`} target="_blank" rel="noopener noreferrer"
              className="text-xs text-[#9CA3AF] hover:text-[#C86A43] transition-colors">View on site ↗</a>
          </div>
        )}

        {tab === 'relationships' && (
          <RelationshipsPanel
            groups={[
              {
                title: 'Founder',
                items: itemFounders.map(f => ({ id: f.id, label: f.name, sublabel: f.industry.name, path: `/founders/${f.slug}`, image: f.avatar })),
              },
              {
                title: 'Business',
                items: itemBizs.map(b => ({ id: b.id, label: b.name, sublabel: b.location.name, path: `/businesses/${b.slug}`, image: b.logo })),
              },
            ]}
          />
        )}

        {tab === 'featured-in' && (
          <FeaturedInPanel locations={featuredIn} />
        )}

        {tab === 'issues' && (
          <MissingAssetsPanel items={missing} />
        )}
      </div>
    </div>
  )
}

// ─── DashboardLibraryPage ─────────────────────────────────────────────────────

export function DashboardLibraryPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search,     setSearch]     = useState('')

  const allItems = getLibraryItems()
  const filtered = search
    ? allItems.filter(i => i.title.toLowerCase().includes(search.toLowerCase()))
    : allItems

  const selected = allItems.find(i => i.id === selectedId) ?? null

  return (
    <div className="flex h-full" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── List ──────────────────────────────────────────────────────── */}
      <div className={`flex flex-col overflow-hidden ${selected ? 'flex-1 min-w-0 border-r border-[#E8E4DD]' : 'w-full'}`}>
        <div className="flex items-center justify-between px-8 pt-8 pb-4 shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-[#2D2A26]">Library</h1>
            <p className="text-sm text-[#6B7280] mt-1">{allItems.length} products, guides and resources</p>
          </div>
        </div>

        <div className="px-8 pb-5 shrink-0">
          <input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search library…"
            className="w-full max-w-sm px-3 py-2.5 rounded-lg border border-[#E8E4DD] text-sm text-[#2D2A26] bg-white focus:outline-none focus:ring-2 focus:ring-[#C86A43]/30 focus:border-[#C86A43] transition-colors"
          />
        </div>

        <div className="flex-1 overflow-y-auto px-8 pb-8">
          <div className="bg-white rounded-xl border border-[#E8E4DD] divide-y divide-[#F3EDE6]">
            {filtered.map(item => {
              const missing  = getLibraryMissingItems(item)
              const critical = missing.filter(m => m.severity === 'critical').length
              return (
                <button key={item.id} onClick={() => setSelectedId(selectedId === item.id ? null : item.id)}
                  className={`w-full text-left flex items-center gap-4 px-5 py-4 transition-colors ${
                    selectedId === item.id ? 'bg-[#C86A43]/5 border-l-2 border-[#C86A43]' : 'hover:bg-[#FDFCFB]'
                  }`}>
                  <img src={item.coverImage} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0 bg-[#F3EDE6]" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#2D2A26] truncate">{item.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-[#9CA3AF]">{item.productType}</p>
                      {critical > 0 && (
                        <span className="text-[9px] font-bold px-1 py-0.5 rounded-full bg-red-100 text-red-600">{critical}!</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      item.status === 'available' || item.status === 'free-download' ? 'bg-green-100 text-green-700' :
                      item.status === 'coming-soon' ? 'bg-amber-100 text-amber-700' :
                      'bg-[#F3EDE6] text-[#9CA3AF]'
                    }`}>
                      {item.status}
                    </span>
                    {missing.length > 0 && <HealthBadge missing={missing} />}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Detail pane ────────────────────────────────────────────── */}
      {selected && (
        <div className="w-72 shrink-0 bg-white border-l border-[#E8E4DD] flex flex-col overflow-hidden">
          <LibraryDetailPane key={selected.id} item={selected} onClose={() => setSelectedId(null)} onSave={() => {}} />
        </div>
      )}
    </div>
  )
}
