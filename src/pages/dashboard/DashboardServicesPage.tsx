import { useState } from 'react'
import { getServices, updateService } from '../../services/serviceOfferings'
import { getBusinesses } from '../../services/businesses'
import { getFounders } from '../../services/founders'
import { Tabs } from '../../components/dashboard/Tabs'
import { MissingAssetsPanel } from '../../components/dashboard/MissingAssetsPanel'
import { RelationshipsPanel } from '../../components/dashboard/RelationshipsPanel'
import { HealthBadge } from '../../components/dashboard/PublishingHealth'
import { getServiceMissingItems } from '../../utils/missingAssets'
import type { Service } from '../../types'

// ─── Detail pane ──────────────────────────────────────────────────────────────

function ServiceDetailPane({ service, onClose, onSave }: { service: Service; onClose: () => void; onSave: (s: Service) => void }) {
  const draft             = service
  const [tab, setTab]     = useState('overview')
  const [saved, setSaved] = useState(false)

  const missing    = getServiceMissingItems(draft)
  const bizOwner   = getBusinesses().find(b => b.id === draft.businessId)
  const fOwner     = getFounders().find(f => f.id === draft.founderId)

  function handleSave() {
    updateService(draft)
    setSaved(true)
    onSave(draft)
  }

  const TABS = [
    { key: 'overview',      label: 'Overview'      },
    { key: 'relationships', label: 'Relationships', badge: (bizOwner ? 1 : 0) + (fOwner ? 1 : 0) },
    { key: 'improve',       label: 'Improve',        badge: missing.length },
  ]

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8E4DD]">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-[#2D2A26] truncate">{draft.name}</p>
          <HealthBadge missing={missing} />
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          {saved && <span className="text-xs text-green-600">Saved ✓</span>}
          <button onClick={handleSave}
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
            <p className="text-sm text-[#4B4845] leading-relaxed">{draft.description}</p>
            <div className="flex flex-col gap-2 text-xs">
              {draft.price && (
                <div className="flex items-center justify-between">
                  <span className="text-[#9CA3AF]">Price</span>
                  <span className="font-medium text-[#C86A43]">{draft.price}{draft.priceType ? ` / ${draft.priceType}` : ''}</span>
                </div>
              )}
              {draft.deliverable && (
                <div className="flex items-center justify-between">
                  <span className="text-[#9CA3AF]">Deliverable</span>
                  <span className="font-medium text-[#2D2A26]">{draft.deliverable}</span>
                </div>
              )}
            </div>
            {draft.topicIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {draft.topicIds.map(tid => (
                  <span key={tid} className="text-[10px] px-2 py-0.5 rounded-full bg-[#F3EDE6] text-[#6B7280]">{tid.replace(/-/g, ' ')}</span>
                ))}
              </div>
            )}
            <a href={draft.ctaUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-[#C86A43] hover:underline">
              {draft.ctaLabel} ↗
            </a>
          </div>
        )}

        {tab === 'relationships' && (
          <RelationshipsPanel
            groups={[
              {
                title: 'Founder',
                items: fOwner ? [{ id: fOwner.id, label: fOwner.name, sublabel: fOwner.industry.name, path: `/founders/${fOwner.slug}`, image: fOwner.avatar }] : [],
              },
              {
                title: 'Business',
                items: bizOwner ? [{ id: bizOwner.id, label: bizOwner.name, sublabel: bizOwner.location.name, path: `/businesses/${bizOwner.slug}`, image: bizOwner.logo }] : [],
              },
            ]}
          />
        )}

        {tab === 'improve' && (
          <MissingAssetsPanel items={missing} onAction={() => setTab('overview')} />
        )}
      </div>
    </div>
  )
}

// ─── DashboardServicesPage ────────────────────────────────────────────────────

export function DashboardServicesPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search,     setSearch]     = useState('')

  const allServices = getServices()
  const filtered = search
    ? allServices.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.description.toLowerCase().includes(search.toLowerCase()))
    : allServices

  const selected = allServices.find(s => s.id === selectedId) ?? null

  return (
    <div className="flex h-full" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── List ──────────────────────────────────────────────────────── */}
      <div className={`flex flex-col overflow-hidden ${selected ? 'flex-1 min-w-0 border-r border-[#E8E4DD]' : 'w-full'}`}>
        <div className="flex items-center justify-between px-8 pt-8 pb-4 shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-[#2D2A26]">Services</h1>
            <p className="text-sm text-[#6B7280] mt-1">{allServices.length} service offerings</p>
          </div>
        </div>

        <div className="px-8 pb-5 shrink-0">
          <input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search services…"
            className="w-full max-w-sm px-3 py-2.5 rounded-lg border border-[#E8E4DD] text-sm text-[#2D2A26] bg-white focus:outline-none focus:ring-2 focus:ring-[#C86A43]/30 focus:border-[#C86A43] transition-colors"
          />
        </div>

        <div className="flex-1 overflow-y-auto px-8 pb-8">
          <div className="bg-white rounded-xl border border-[#E8E4DD] divide-y divide-[#F3EDE6]">
            {filtered.length === 0 ? (
              <p className="px-5 py-8 text-sm text-[#9CA3AF] text-center">No services match your search.</p>
            ) : filtered.map(service => {
              const missing  = getServiceMissingItems(service)
              const recommended = missing.filter(m => m.severity === 'critical').length
              return (
                <button key={service.id} onClick={() => setSelectedId(selectedId === service.id ? null : service.id)}
                  className={`w-full text-left px-5 py-4 transition-colors ${
                    selectedId === service.id ? 'bg-[#C86A43]/5 border-l-2 border-[#C86A43]' : 'hover:bg-[#FDFCFB]'
                  }`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-[#2D2A26] truncate">{service.name}</p>
                        {recommended > 0 && (
                          <span className="text-[9px] font-bold px-1 py-0.5 rounded-full bg-[#FBF1EB] text-[#C86A43] shrink-0">{recommended}</span>
                        )}
                      </div>
                      <p className="text-xs text-[#6B7280] mt-1 line-clamp-2">{service.description}</p>
                      {service.price && (
                        <p className="text-xs text-[#C86A43] font-medium mt-1.5">{service.price}{service.priceType ? ` / ${service.priceType}` : ''}</p>
                      )}
                    </div>
                    {missing.length > 0 && <HealthBadge missing={missing} />}
                  </div>
                  {service.topicIds.length > 0 && (
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      {service.topicIds.slice(0, 4).map(tid => (
                        <span key={tid} className="text-[10px] px-1.5 py-0.5 rounded bg-[#F3EDE6] text-[#6B7280]">{tid.replace(/-/g, ' ')}</span>
                      ))}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Detail pane ────────────────────────────────────────────── */}
      {selected && (
        <div className="w-72 shrink-0 bg-white border-l border-[#E8E4DD] flex flex-col overflow-hidden">
          <ServiceDetailPane key={selected.id} service={selected} onClose={() => setSelectedId(null)} onSave={() => {}} />
        </div>
      )}
    </div>
  )
}
