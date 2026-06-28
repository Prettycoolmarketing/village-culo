import { useState, type ReactNode } from 'react'
import { getBusinesses, updateBusiness } from '../../services/businesses'
import { getStories } from '../../services/stories'
import { getServices } from '../../services/serviceOfferings'
import { getFounders } from '../../services/founders'
import { locations } from '../../data/locations'
import { industries } from '../../data/industries'
import { topics as allTopics } from '../../data/topics'
import { Tabs } from '../../components/dashboard/Tabs'
import { MissingAssetsPanel } from '../../components/dashboard/MissingAssetsPanel'
import { FeaturedInPanel } from '../../components/dashboard/FeaturedInPanel'
import { RelationshipsPanel } from '../../components/dashboard/RelationshipsPanel'
import { HealthBadge } from '../../components/dashboard/PublishingHealth'
import { getBusinessMissingItems, getMissingCounts } from '../../utils/missingAssets'
import { getBusinessFeaturedIn } from '../../utils/featuredIn'
import type { Business, Topic, Offer } from '../../types'

// ─── Shared helpers ────────────────────────────────────────────────────────────

const inputClass =
  'w-full px-3 py-2.5 rounded-lg border border-[#E8E4DD] text-sm text-[#2D2A26] bg-white placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#C86A43]/30 focus:border-[#C86A43] transition-colors'

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-[#6B7280] mb-1">{label}</label>
      {hint && <p className="text-xs text-[#9CA3AF] mb-1">{hint}</p>}
      {children}
    </div>
  )
}

// ─── Business detail pane ──────────────────────────────────────────────────────

function BusinessDetailPane({ biz, onSave }: { biz: Business; onSave: (b: Business) => void }) {
  const [draft, setDraft]   = useState<Business>({ ...biz })
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [tab, setTab]       = useState('overview')

  const missing    = getBusinessMissingItems(draft)
  const counts     = getMissingCounts(missing)
  const featuredIn = getBusinessFeaturedIn(draft.id)

  // Relationships
  const bizStories  = getStories({ businessId: draft.id })
  const bizServices = getServices(undefined, draft.id)
  const owner       = getFounders().find(f => f.businessId === draft.id)

  const TABS = [
    { key: 'overview',      label: 'Overview'      },
    { key: 'content',       label: 'Content'       },
    { key: 'brand',         label: 'Brand & Media' },
    { key: 'offers',        label: 'Offers',        badge: draft.offers.length },
    { key: 'relationships', label: 'Relationships', badge: bizStories.length + bizServices.length },
    { key: 'featured-in',   label: 'Featured In',  badge: featuredIn.length },
    { key: 'seo',           label: 'SEO & GEO'     },
    { key: 'publishing',    label: 'Publishing'    },
  ]

  function set<K extends keyof Business>(key: K, value: Business[K]) {
    setDraft(prev => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  function toggleTopic(topic: Topic) {
    setDraft(prev => {
      const has = prev.topics.some(t => t.id === topic.id)
      setSaved(false)
      return { ...prev, topics: has ? prev.topics.filter(t => t.id !== topic.id) : [...prev.topics, topic] }
    })
  }

  function setOffer<K extends keyof Omit<Offer, 'id'>>(index: number, key: K, value: string) {
    setDraft(prev => {
      const next = [...prev.offers]
      next[index] = { ...next[index], [key]: value }
      setSaved(false)
      return { ...prev, offers: next }
    })
  }

  function addOffer() {
    setDraft(prev => ({
      ...prev,
      offers: [...prev.offers, { id: `offer-${Date.now()}`, title: '', description: '', ctaLabel: 'Learn more', ctaUrl: '' }],
    }))
    setSaved(false)
  }

  function removeOffer(index: number) {
    setDraft(prev => {
      const next = prev.offers.filter((_, i) => i !== index)
      setSaved(false)
      return { ...prev, offers: next }
    })
  }

  function moveOffer(index: number, direction: -1 | 1) {
    setDraft(prev => {
      const next = [...prev.offers]
      const target = index + direction
      if (target < 0 || target >= next.length) return prev
      ;[next[index], next[target]] = [next[target], next[index]]
      setSaved(false)
      return { ...prev, offers: next }
    })
  }

  function handleSave() {
    setSaving(true)
    updateBusiness(draft)
    setSaving(false)
    setSaved(true)
    onSave(draft)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Detail header */}
      <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
        <div className="flex items-center gap-3">
          <img src={draft.logo} alt="" className="w-9 h-9 rounded-lg object-cover bg-[#F3EDE6] shrink-0" />
          <div>
            <p className="text-base font-bold text-[#2D2A26] truncate max-w-[200px]">{draft.name}</p>
            <HealthBadge missing={missing} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {saved && <span className="text-xs text-green-600 font-medium">Saved ✓</span>}
          <a href={`/businesses/${draft.slug}`} target="_blank" rel="noopener noreferrer"
            className="px-2.5 py-1.5 text-xs text-[#6B7280] border border-[#E8E4DD] rounded-lg hover:text-[#C86A43] hover:border-[#C86A43]/40 transition-colors">
            View ↗
          </a>
          <button onClick={handleSave} disabled={saving}
            className="px-3 py-1.5 bg-[#C86A43] text-white text-xs font-semibold rounded-lg hover:bg-[#b05a35] disabled:opacity-60 transition-colors">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} className="px-6" />

      <div className="flex-1 overflow-y-auto px-6 py-5">

        {/* Overview */}
        {tab === 'overview' && (
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-xl border border-[#E8E4DD] px-3 py-3 text-center">
                <p className="text-xl font-bold text-[#2D2A26]">{bizStories.length}</p>
                <p className="text-xs text-[#9CA3AF]">Stories</p>
              </div>
              <div className="bg-white rounded-xl border border-[#E8E4DD] px-3 py-3 text-center">
                <p className="text-xl font-bold text-[#2D2A26]">{bizServices.length}</p>
                <p className="text-xs text-[#9CA3AF]">Services</p>
              </div>
              <div className="bg-white rounded-xl border border-[#E8E4DD] px-3 py-3 text-center">
                <p className="text-xl font-bold text-[#2D2A26]">{counts.total > 0 ? counts.total : '✓'}</p>
                <p className="text-xs text-[#9CA3AF]">Issues</p>
              </div>
            </div>
            <MissingAssetsPanel items={missing} />
          </div>
        )}

        {/* Content */}
        {tab === 'content' && (
          <div className="flex flex-col gap-4">
            <Field label="Business Name">
              <input type="text" value={draft.name} onChange={e => set('name', e.target.value)} className={inputClass} />
            </Field>
            <Field label="Tagline">
              <input type="text" value={draft.tagline} onChange={e => set('tagline', e.target.value)} className={inputClass} />
            </Field>
            <Field label="Description">
              <textarea value={draft.description} onChange={e => set('description', e.target.value)} rows={5} className={inputClass + ' resize-y'} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Location">
                <select value={draft.location.id} onChange={e => { const l = locations.find(x => x.id === e.target.value); if (l) set('location', l) }} className={inputClass}>
                  {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </Field>
              <Field label="Industry">
                <select value={draft.industry.id} onChange={e => { const i = industries.find(x => x.id === e.target.value); if (i) set('industry', i) }} className={inputClass}>
                  {industries.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Topics">
              <div className="flex flex-wrap gap-1.5 mt-1">
                {allTopics.map(topic => {
                  const active = draft.topics.some(t => t.id === topic.id)
                  return (
                    <button key={topic.id} onClick={() => toggleTopic(topic)}
                      className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${active ? 'bg-[#C86A43] text-white border-[#C86A43]' : 'bg-white text-[#4B4845] border-[#E8E4DD] hover:border-[#C86A43]/50'}`}>
                      {topic.name}
                    </button>
                  )
                })}
              </div>
            </Field>
            <div className="flex flex-col gap-3 pt-3 border-t border-[#E8E4DD]">
              <Field label="Website">
                <input type="url" value={draft.website ?? ''} onChange={e => set('website', e.target.value || undefined)} className={inputClass} placeholder="https://" />
              </Field>
              <Field label="Instagram">
                <input type="url" value={draft.instagram ?? ''} onChange={e => set('instagram', e.target.value || undefined)} className={inputClass} placeholder="https://instagram.com/" />
              </Field>
              <Field label="LinkedIn">
                <input type="url" value={draft.linkedin ?? ''} onChange={e => set('linkedin', e.target.value || undefined)} className={inputClass} placeholder="https://linkedin.com/" />
              </Field>
            </div>
          </div>
        )}

        {/* Brand & Media */}
        {tab === 'brand' && (
          <div className="flex flex-col gap-5">
            <Field label="Primary Logo" hint="Square, min 400×400px. Used in directories and profile pages.">
              <div className="flex gap-3 items-center mt-1">
                <img src={draft.logo || '/placeholders/village-logo.svg'} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0 bg-[#F3EDE6] border border-[#E8E4DD]" />
                <input type="url" value={draft.logo} onChange={e => set('logo', e.target.value)} className={inputClass} placeholder="/assets/brand-logo.jpg" />
              </div>
              {draft.logo.includes('/placeholders/') && <p className="text-xs text-red-600 mt-1.5">⚠ Using placeholder — add your real logo.</p>}
            </Field>

            <Field label="Cover Image" hint="Shown at the top of your business profile page (16:9 or wider).">
              <div className="flex flex-col gap-2 mt-1">
                {draft.coverImage && <img src={draft.coverImage} alt="" className="w-full h-28 rounded-xl object-cover bg-[#F3EDE6] border border-[#E8E4DD]" />}
                <input type="url" value={draft.coverImage} onChange={e => set('coverImage', e.target.value)} className={inputClass} placeholder="/assets/brand-cover.jpg" />
                {draft.coverImage.includes('/placeholders/') && <p className="text-xs text-amber-600">⚠ Using placeholder — add a real cover image.</p>}
              </div>
            </Field>

            <div className="bg-[#F8F5F0] rounded-xl border border-[#E8E4DD] px-4 py-4">
              <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest mb-2">Coming Next Sprint</p>
              <p className="text-xs text-[#6B7280]">Full brand management — light/dark logos, brand colours, media kit, gallery, and downloadable brand assets — will be added when the Brand field model is finalised.</p>
            </div>
          </div>
        )}

        {/* Relationships */}
        {tab === 'relationships' && (
          <RelationshipsPanel
            groups={[
              {
                title: 'Founder',
                items: owner ? [{ id: owner.id, label: owner.name, sublabel: owner.industry.name, path: `/founders/${owner.slug}`, image: owner.avatar }] : [],
              },
              {
                title: 'Stories',
                items: bizStories.map(s => ({ id: s.id, label: s.title, sublabel: s.status, path: `/stories/${s.slug}`, image: s.coverImage })),
              },
              {
                title: 'Services',
                items: bizServices.map(s => ({ id: s.id, label: s.name, sublabel: s.price ?? '', path: `#` })),
              },
            ]}
          />
        )}

        {/* Featured In */}
        {tab === 'featured-in' && (
          <div>
            <p className="text-sm text-[#6B7280] mb-4">Every location where this business is surfaced in the Village.</p>
            <FeaturedInPanel locations={featuredIn} />
          </div>
        )}

        {/* SEO & GEO */}
        {tab === 'seo' && (
          <div className="flex flex-col gap-4">
            <Field label="SEO Title" hint="~60 chars">
              <input type="text" value={draft.seoTitle ?? ''} onChange={e => set('seoTitle', e.target.value || undefined)} className={inputClass} />
              <p className="text-xs text-right text-[#9CA3AF] mt-1">{(draft.seoTitle ?? '').length}/60</p>
            </Field>
            <Field label="SEO Description" hint="140–160 chars">
              <textarea value={draft.seoDescription ?? ''} onChange={e => set('seoDescription', e.target.value || undefined)} rows={3} className={inputClass + ' resize-none'} />
              <p className="text-xs text-right text-[#9CA3AF] mt-1">{(draft.seoDescription ?? '').length}/160</p>
            </Field>
            <div className="bg-white rounded-xl border border-[#E8E4DD] px-4 py-3 text-sm">
              <p className="font-medium text-[#2D2A26] mb-1.5">Location</p>
              <p className="text-[#6B7280]">{draft.location.name}, {draft.location.state} · {draft.location.country}</p>
            </div>
          </div>
        )}

        {/* Offers */}
        {tab === 'offers' && (
          <div className="flex flex-col gap-3">
            {draft.offers.length === 0 && (
              <p className="text-xs text-[#9CA3AF] text-center py-4">No offers yet. Add one below.</p>
            )}
            {draft.offers.map((offer, i) => (
              <div key={offer.id} className="bg-white rounded-xl border border-[#E8E4DD] px-4 py-4 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-widest">Offer {i + 1}</p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => moveOffer(i, -1)}
                      disabled={i === 0}
                      className="px-1.5 py-0.5 text-xs text-[#9CA3AF] hover:text-[#2D2A26] disabled:opacity-30 transition-colors"
                      title="Move up"
                    >↑</button>
                    <button
                      onClick={() => moveOffer(i, 1)}
                      disabled={i === draft.offers.length - 1}
                      className="px-1.5 py-0.5 text-xs text-[#9CA3AF] hover:text-[#2D2A26] disabled:opacity-30 transition-colors"
                      title="Move down"
                    >↓</button>
                    <button
                      onClick={() => removeOffer(i)}
                      className="px-1.5 py-0.5 text-xs text-[#9CA3AF] hover:text-red-500 transition-colors"
                      title="Remove offer"
                    >✕</button>
                  </div>
                </div>
                <Field label="Title">
                  <input type="text" value={offer.title} onChange={e => setOffer(i, 'title', e.target.value)} className={inputClass} placeholder="e.g. Brand Strategy Session" />
                </Field>
                <Field label="Description">
                  <textarea value={offer.description} onChange={e => setOffer(i, 'description', e.target.value)} rows={2} className={inputClass + ' resize-none'} placeholder="What does this offer include?" />
                </Field>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="CTA Label">
                    <input type="text" value={offer.ctaLabel} onChange={e => setOffer(i, 'ctaLabel', e.target.value)} className={inputClass} placeholder="Book now" />
                  </Field>
                  <Field label="CTA URL">
                    <input type="url" value={offer.ctaUrl} onChange={e => setOffer(i, 'ctaUrl', e.target.value)} className={inputClass} placeholder="https://" />
                  </Field>
                </div>
              </div>
            ))}
            <button
              onClick={addOffer}
              className="w-full py-2.5 rounded-xl border border-dashed border-[#C86A43]/40 text-xs font-semibold text-[#C86A43] hover:bg-[#C86A43]/5 transition-colors"
            >
              + Add Offer
            </button>
          </div>
        )}

        {/* Publishing */}
        {tab === 'publishing' && (
          <div className="flex flex-col gap-4">
            <div className="bg-white rounded-xl border border-[#E8E4DD] px-5 py-4">
              <p className="text-sm font-semibold text-[#2D2A26] mb-3">Status</p>
              <div className="flex gap-2 flex-wrap">
                {(['draft', 'submitted', 'published', 'featured', 'archived'] as const).map(s => (
                  <button key={s} onClick={() => set('status', s)}
                    className={`px-3 py-1.5 rounded-lg text-sm border font-medium transition-colors capitalize ${draft.status === s ? 'bg-[#C86A43] text-white border-[#C86A43]' : 'bg-white text-[#6B7280] border-[#E8E4DD] hover:border-[#C86A43]/50'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-[#E8E4DD] px-5 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#2D2A26]">Featured</p>
                  <p className="text-xs text-[#9CA3AF] mt-0.5">Show in Village homepage</p>
                </div>
                <button onClick={() => set('featured', !draft.featured)}
                  className={`w-11 h-6 rounded-full transition-colors ${draft.featured ? 'bg-[#C86A43]' : 'bg-[#E8E4DD]'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform mx-1 ${draft.featured ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-[#E8E4DD] px-5 py-4 text-sm">
              <p className="font-semibold text-[#2D2A26] mb-1">Created</p>
              <p className="text-[#6B7280]">{draft.createdAt}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── DashboardBusinessesPage ───────────────────────────────────────────────────

export function DashboardBusinessesPage() {
  const [bizList,    setBizList]    = useState<Business[]>(() => getBusinesses())
  const [selectedId, setSelectedId] = useState<string | null>(() => getBusinesses()[0]?.id ?? null)

  const selected = bizList.find(b => b.id === selectedId) ?? null

  function handleSave(updated: Business) {
    setBizList(prev => prev.map(b => b.id === updated.id ? updated : b))
  }

  return (
    <div className="flex h-full" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── List ──────────────────────────────────────────────────────── */}
      <div className="w-64 shrink-0 border-r border-[#E8E4DD] bg-white flex flex-col overflow-hidden">
        <div className="px-4 pt-5 pb-3 shrink-0">
          <h1 className="text-base font-bold text-[#2D2A26]">Businesses</h1>
          <p className="text-xs text-[#9CA3AF] mt-0.5">{bizList.length} total</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {bizList.map(biz => {
            const missing = getBusinessMissingItems(biz)
            const critical = missing.filter(m => m.severity === 'critical').length
            return (
              <button
                key={biz.id}
                onClick={() => setSelectedId(biz.id)}
                className={`w-full text-left flex items-center gap-3 px-4 py-3 border-b border-[#F3EDE6] transition-colors ${
                  selectedId === biz.id ? 'bg-[#C86A43]/5 border-l-2 border-l-[#C86A43]' : 'hover:bg-[#F8F5F0]'
                }`}
              >
                <img src={biz.logo} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0 bg-[#F3EDE6]" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#2D2A26] truncate">{biz.name}</p>
                  <HealthBadge missing={missing} />
                </div>
                {critical > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 shrink-0">{critical}</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Detail ────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden bg-[#F8F5F0]">
        {selected ? (
          <BusinessDetailPane
            key={selected.id}
            biz={selected}
            onSave={handleSave}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-[#9CA3AF]">Select a business to edit</p>
          </div>
        )}
      </div>
    </div>
  )
}
