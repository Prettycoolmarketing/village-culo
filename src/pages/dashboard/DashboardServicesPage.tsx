import { useState } from 'react'
import { getServices, updateService, deleteService, duplicateService } from '../../services/serviceOfferings'
import { getBusinesses } from '../../services/businesses'
import { getFounders } from '../../services/founders'
import { Tabs } from '../../components/dashboard/Tabs'
import { MissingAssetsPanel } from '../../components/dashboard/MissingAssetsPanel'
import { RelationshipsPanel } from '../../components/dashboard/RelationshipsPanel'
import { HealthBadge } from '../../components/dashboard/PublishingHealth'
import { OverflowMenu } from '../../components/ui/OverflowMenu'
import { getServiceMissingItems } from '../../utils/missingAssets'
import { focusField } from '../../utils/focusField'
import type { Service } from '../../types'

// ─── Detail pane ──────────────────────────────────────────────────────────────

interface ServiceDetailPaneProps {
  service: Service
  onClose: () => void
  onSave: (s: Service) => void
  onDuplicated: (s: Service) => void
  onDeleted: () => void
}

function ServiceDetailPane({ service, onClose, onSave, onDuplicated, onDeleted }: ServiceDetailPaneProps) {
  const [draft, setDraft] = useState<Service>({ ...service })
  const [tab, setTab]     = useState('overview')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const missing    = getServiceMissingItems(draft)
  const bizOwner   = getBusinesses().find(b => b.id === draft.businessId)
  const fOwner     = getFounders().find(f => f.id === draft.founderId)

  async function handleSave() {
    setSaving(true)
    setSaveError(null)
    const result = await updateService(draft)
    setSaving(false)
    if (result.success) {
      setSaved(true)
      onSave(draft)
    } else {
      setSaveError(result.error ?? 'Save failed. Please try again.')
    }
  }

  async function handleDuplicate() {
    const result = await duplicateService(service.id)
    if (result.success) {
      const copy = getServices().find(s => s.name === `${service.name} (Copy)`)
      if (copy) onDuplicated(copy)
    } else {
      setSaveError(result.error ?? 'Could not duplicate this service.')
    }
  }

  async function handleArchiveToggle() {
    const nextStatus = draft.status === 'archived' ? 'published' : 'archived'
    const next = { ...draft, status: nextStatus as Service['status'] }
    setDraft(next)
    const result = await updateService(next)
    if (result.success) onSave(next)
    else setSaveError(result.error ?? 'Save failed. Please try again.')
  }

  async function handleDelete() {
    const result = await deleteService(service.id)
    if (result.success) onDeleted()
    else setSaveError(result.error ?? 'Could not delete this service.')
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
          <div className="flex items-center gap-2 mt-0.5">
            <HealthBadge missing={missing} />
            {draft.status === 'archived' && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[#F3EDE6] text-[#9CA3AF]">Archived</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          {saved && <span className="text-xs text-green-600">Saved ✓</span>}
          {saveError && <span className="text-xs text-red-600">{saveError}</span>}
          <button onClick={() => void handleSave()} disabled={saving}
            className="px-2.5 py-1 bg-[#C86A43] text-white text-xs font-semibold rounded-lg hover:bg-[#b05a35] disabled:opacity-60 transition-colors">
            {saving ? 'Saving…' : 'Save'}
          </button>
          <OverflowMenu
            archived={draft.status === 'archived'}
            onDuplicate={() => void handleDuplicate()}
            onArchive={() => void handleArchiveToggle()}
            onRestore={() => void handleArchiveToggle()}
            onDelete={() => void handleDelete()}
          />
          <button onClick={onClose} className="text-[#9CA3AF] hover:text-[#2D2A26] text-lg leading-none">×</button>
        </div>
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} className="px-5" />

      <div className="flex-1 overflow-y-auto px-5 py-4">

        {tab === 'overview' && (
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-medium text-[#6B7280] mb-1">Name</label>
              <input type="text" value={draft.name} onChange={e => setDraft(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-[#E8E4DD] text-sm focus:outline-none focus:ring-2 focus:ring-[#C86A43]/30 focus:border-[#C86A43]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6B7280] mb-1">Description</label>
              <textarea id="description" value={draft.description} onChange={e => setDraft(prev => ({ ...prev, description: e.target.value }))} rows={4}
                className="w-full px-3 py-2 rounded-lg border border-[#E8E4DD] text-sm resize-y focus:outline-none focus:ring-2 focus:ring-[#C86A43]/30 focus:border-[#C86A43]" />
            </div>
            <div className="flex flex-col gap-2 text-xs">
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#6B7280] mb-1">Price</label>
                <input id="price" type="text" value={draft.price ?? ''} onChange={e => setDraft(prev => ({ ...prev, price: e.target.value || undefined }))}
                  placeholder="$500"
                  className="w-full px-3 py-2 rounded-lg border border-[#E8E4DD] text-sm focus:outline-none focus:ring-2 focus:ring-[#C86A43]/30 focus:border-[#C86A43]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6B7280] mb-1">Price Type</label>
                <select value={draft.priceType ?? ''} onChange={e => setDraft(prev => ({ ...prev, priceType: (e.target.value || undefined) as Service['priceType'] }))}
                  className="w-full px-3 py-2 rounded-lg border border-[#E8E4DD] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#C86A43]/30 focus:border-[#C86A43]">
                  <option value="">—</option>
                  <option value="flat">Flat</option>
                  <option value="monthly">Monthly</option>
                  <option value="hourly">Hourly</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6B7280] mb-1">Deliverable</label>
              <input id="deliverable" type="text" value={draft.deliverable ?? ''} onChange={e => setDraft(prev => ({ ...prev, deliverable: e.target.value || undefined }))}
                placeholder="What people receive"
                className="w-full px-3 py-2 rounded-lg border border-[#E8E4DD] text-sm focus:outline-none focus:ring-2 focus:ring-[#C86A43]/30 focus:border-[#C86A43]" />
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
          <MissingAssetsPanel items={missing} onAction={item => { setTab('overview'); focusField(item.field) }} />
        )}
      </div>
    </div>
  )
}

// ─── DashboardServicesPage ────────────────────────────────────────────────────

export function DashboardServicesPage() {
  const [selectedId, setSelectedId] = useState<string | null>(() => getServices()[0]?.id ?? null)
  const [search,     setSearch]     = useState('')
  const [tick, setTick] = useState(0)
  const refresh = () => setTick(t => t + 1)
  void tick

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
                <div key={service.id} onClick={() => setSelectedId(selectedId === service.id ? null : service.id)}
                  className={`w-full text-left px-5 py-4 transition-colors cursor-pointer ${
                    selectedId === service.id ? 'bg-[#C86A43]/5 border-l-2 border-[#C86A43]' : 'hover:bg-[#FDFCFB]'
                  }`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-[#2D2A26] truncate">{service.name}</p>
                        {recommended > 0 && (
                          <span className="text-[9px] font-bold px-1 py-0.5 rounded-full bg-[#FBF1EB] text-[#C86A43] shrink-0">{recommended}</span>
                        )}
                        {service.status === 'archived' && (
                          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-[#F3EDE6] text-[#9CA3AF] shrink-0">Archived</span>
                        )}
                      </div>
                      <p className="text-xs text-[#6B7280] mt-1 line-clamp-2">{service.description}</p>
                      {service.price && (
                        <p className="text-xs text-[#C86A43] font-medium mt-1.5">{service.price}{service.priceType ? ` / ${service.priceType}` : ''}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {missing.length > 0 && <HealthBadge missing={missing} />}
                      <OverflowMenu
                        archived={service.status === 'archived'}
                        onEdit={() => setSelectedId(service.id)}
                        onDuplicate={() => { void duplicateService(service.id).then(refresh) }}
                        onArchive={() => { void updateService({ ...service, status: 'archived' }).then(refresh) }}
                        onRestore={() => { void updateService({ ...service, status: 'published' }).then(refresh) }}
                        onDelete={() => { void deleteService(service.id).then(() => { if (selectedId === service.id) setSelectedId(null); refresh() }) }}
                      />
                    </div>
                  </div>
                  {service.topicIds.length > 0 && (
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      {service.topicIds.slice(0, 4).map(tid => (
                        <span key={tid} className="text-[10px] px-1.5 py-0.5 rounded bg-[#F3EDE6] text-[#6B7280]">{tid.replace(/-/g, ' ')}</span>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Detail pane ────────────────────────────────────────────── */}
      {selected && (
        <div className="w-72 shrink-0 bg-white border-l border-[#E8E4DD] flex flex-col overflow-hidden">
          <ServiceDetailPane
            key={selected.id}
            service={selected}
            onClose={() => setSelectedId(null)}
            onSave={refresh}
            onDuplicated={copy => { setSelectedId(copy.id); refresh() }}
            onDeleted={() => { setSelectedId(null); refresh() }}
          />
        </div>
      )}
    </div>
  )
}
