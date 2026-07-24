import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getFounders, updateFounder } from '../../../services/founders'
import { getBusinesses, updateBusiness } from '../../../services/businesses'
import { getStories, updateStory } from '../../../services/stories'
import { importedContentService } from '../../../services/importedContent'
import { normalizeUrl } from '../../../utils/url'
import { editorialService, newEditorialFeature } from '../../../services/editorial'
import { slugify } from '../../../utils/slugify'
import { MediaUpload } from '../../../components/ui/MediaUpload'
import { ConfirmButton } from '../../../components/ui/ConfirmButton'
import type { EditorialFeature, EditorialPick, EditorialTemplate } from '../../../types/editorial'
import { CapoBackLink } from '../../../components/dashboard/CapoBackLink'
import { Tabs, type DashTab } from '../../../components/dashboard/Tabs'

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

// ─── "Feature toggle" sub-tab — pin existing founders/businesses/stories/imports ──

function FeatureTogglePanel() {
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

  const SUBTABS: { key: ContentTab; label: string; featured: number; total: number }[] = [
    { key: 'founders',   label: 'Founders',        featured: featuredFounders.length,   total: founders.length   },
    { key: 'businesses', label: 'Businesses',       featured: featuredBusinesses.length, total: businesses.length },
    { key: 'stories',    label: 'Stories',          featured: featuredStories.length,    total: stories.length    },
    { key: 'imports',    label: 'Imported Content', featured: featuredImports.length,    total: imports.length    },
  ]

  return (
    <div>
      <p className="text-sm text-[#6B7280] mb-6">
        Pin founders, businesses, stories and imported content for homepage and discovery visibility.
      </p>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {SUBTABS.map(t => (
          <div key={t.key} className="bg-white rounded-xl border border-[#E8E4DD] px-4 py-3">
            <p className="text-xl font-bold text-[#D6A94D]">{t.featured}</p>
            <p className="text-[10px] text-[#9CA3AF]">{t.label} featured</p>
            <p className="text-[10px] text-[#C8C3BC]">of {t.total} total</p>
          </div>
        ))}
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 bg-[#F8F5F0] rounded-xl p-1 w-fit mb-6">
        {SUBTABS.map(t => (
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

      {tab === 'businesses' && (
        <div className="bg-white rounded-xl border border-[#E8E4DD] divide-y divide-[#F3EDE6]">
          {businesses.length === 0 ? (
            <div className="px-5 py-8 text-center"><p className="text-sm text-[#9CA3AF]">No businesses yet.</p></div>
          ) : businesses.map(b => (
            <div key={b.id} className="flex items-center gap-4 px-5 py-3.5">
              <div className="w-9 h-9 rounded-lg bg-[#F3EDE6] flex-shrink-0 flex items-center justify-center text-[#C86A43] text-sm font-bold overflow-hidden p-1">
                {b.logo ? <img src={b.logo} alt="" className="w-full h-full object-contain" /> : b.name[0]}
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
                <a href={normalizeUrl(c.originalUrl)} target="_blank" rel="noopener noreferrer" className="text-xs text-[#9CA3AF] hover:text-[#C86A43]">Source ↗</a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── "Editorial" sub-tab — curated long-form write-ups ──────────────────────────

const TEMPLATE_LABELS: Record<EditorialTemplate, string> = {
  'founder-spotlight': 'Founder Spotlight',
  'industry-roundup':  'Industry Roundup',
  'weekly-collection': 'Weekly Collection',
}

const inputClass = 'w-full px-3 py-2.5 rounded-lg border border-[#E8E4DD] text-sm text-[#2D2A26] bg-white placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#C86A43]/30 focus:border-[#C86A43] transition-colors'

function PickRow({ pick, onChange, onRemove }: { pick: EditorialPick; onChange: (p: EditorialPick) => void; onRemove: () => void }) {
  const founders = getFounders({ publicOnly: true })
  const stories = getStories({ publicOnly: true })

  return (
    <div className="bg-[#F8F5F0] rounded-lg p-3 flex flex-col gap-2">
      <div className="flex gap-2">
        <select value={pick.founderId ?? ''} onChange={e => onChange({ ...pick, founderId: e.target.value || undefined })} className={inputClass}>
          <option value="">— Founder (optional) —</option>
          {founders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
        <select value={pick.storyId ?? ''} onChange={e => onChange({ ...pick, storyId: e.target.value || undefined })} className={inputClass}>
          <option value="">— Story (optional) —</option>
          {stories.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
        </select>
      </div>
      <textarea
        value={pick.note}
        onChange={e => onChange({ ...pick, note: e.target.value })}
        rows={2}
        placeholder="Why this pick is featured — your own words, not a summary of their content"
        className={inputClass}
      />
      <button onClick={onRemove} className="text-xs text-red-500 hover:underline self-start">Remove pick</button>
    </div>
  )
}

function EditorialForm({ draft, onChange, onSave, onCancel }: {
  draft: EditorialFeature
  onChange: (f: EditorialFeature) => void
  onSave: () => void
  onCancel: () => void
}) {
  function set<K extends keyof EditorialFeature>(key: K, value: EditorialFeature[K]) {
    onChange({ ...draft, [key]: value })
  }

  function addPick() {
    set('picks', [...draft.picks, { note: '' }])
  }

  function updatePick(i: number, pick: EditorialPick) {
    set('picks', draft.picks.map((p, idx) => idx === i ? pick : p))
  }

  function removePick(i: number) {
    set('picks', draft.picks.filter((_, idx) => idx !== i))
  }

  return (
    <div className="bg-white rounded-xl border border-[#E8E4DD] p-5 flex flex-col gap-4">
      <div>
        <label className="block text-xs font-semibold text-[#2D2A26] mb-1">Template</label>
        <select value={draft.template} onChange={e => set('template', e.target.value as EditorialTemplate)} className={inputClass}>
          {(Object.keys(TEMPLATE_LABELS) as EditorialTemplate[]).map(t => <option key={t} value={t}>{TEMPLATE_LABELS[t]}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-[#2D2A26] mb-1">Title</label>
        <input type="text" value={draft.title}
          onChange={e => onChange({ ...draft, title: e.target.value, slug: draft.slug || slugify(e.target.value) })}
          className={inputClass} placeholder="e.g. Five founders changing disability support" />
      </div>

      <div>
        <label className="block text-xs font-semibold text-[#2D2A26] mb-1">Slug</label>
        <input type="text" value={draft.slug} onChange={e => set('slug', slugify(e.target.value))} className={inputClass} />
      </div>

      <div>
        <label className="block text-xs font-semibold text-[#2D2A26] mb-1">Dek <span className="font-normal text-[#9CA3AF]">— short subtitle</span></label>
        <input type="text" value={draft.dek ?? ''} onChange={e => set('dek', e.target.value || undefined)} className={inputClass} />
      </div>

      <div>
        <label className="block text-xs font-semibold text-[#2D2A26] mb-1">Cover image</label>
        <MediaUpload value={draft.coverImage} onChange={v => set('coverImage', v || undefined)} label="Upload cover" aspect="wide" />
      </div>

      <div>
        <label className="block text-xs font-semibold text-[#2D2A26] mb-1">Intro <span className="font-normal text-[#9CA3AF]">— PCM's own editorial framing, not a summary of any founder's work</span></label>
        <textarea value={draft.intro} onChange={e => set('intro', e.target.value)} rows={5} className={inputClass} />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-semibold text-[#2D2A26]">Picks</label>
          <button onClick={addPick} className="text-xs font-semibold text-[#C86A43] hover:underline">+ Add pick</button>
        </div>
        <div className="flex flex-col gap-2">
          {draft.picks.map((pick, i) => (
            <PickRow key={i} pick={pick} onChange={p => updatePick(i, p)} onRemove={() => removePick(i)} />
          ))}
          {draft.picks.length === 0 && <p className="text-xs text-[#9CA3AF]">No picks yet — every feature should reference at least one real founder or story.</p>}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-[#2D2A26] mb-1">Status</label>
        <select value={draft.status} onChange={e => set('status', e.target.value as EditorialFeature['status'])} className={inputClass}>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </div>

      <div className="flex items-center gap-3 pt-2 border-t border-[#E8E4DD]">
        <button onClick={onSave} className="px-5 py-2.5 bg-[#C86A43] text-white text-sm font-semibold rounded-lg hover:bg-[#b05a35] transition-colors">
          Save
        </button>
        <button onClick={onCancel} className="px-4 py-2.5 text-sm text-[#6B7280] hover:text-[#2D2A26] transition-colors">
          Cancel
        </button>
      </div>
    </div>
  )
}

function EditorialPanel() {
  const [draft, setDraft] = useState<EditorialFeature | null>(null)
  const [items, setItems] = useState<EditorialFeature[]>(() => editorialService.getAll())
  const [saveError, setSaveError] = useState<string | null>(null)

  function refresh() {
    setItems(editorialService.getAll())
  }

  async function handleSave() {
    if (!draft) return
    if (!draft.title.trim() || !draft.slug.trim()) {
      setSaveError('Title and slug are required.')
      return
    }
    setSaveError(null)
    const result = await editorialService.upsert(draft)
    if (!result.success) {
      setSaveError(result.error ?? 'Save failed.')
      return
    }
    setDraft(null)
    refresh()
  }

  async function handleDelete(id: string) {
    await editorialService.delete(id)
    refresh()
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-[#6B7280] max-w-lg">
          Curated features — spotlights, roundups, collections. Always authored by Pretty Cool Marketing, always linked back to the founders and stories they reference.
        </p>
        {!draft && (
          <button
            onClick={() => setDraft(newEditorialFeature('founder-spotlight'))}
            className="px-4 py-2.5 bg-[#C86A43] text-white text-sm font-semibold rounded-lg hover:bg-[#b05a35] transition-colors shrink-0"
          >
            + New Feature
          </button>
        )}
      </div>

      {draft && (
        <div className="mb-8">
          {saveError && <p className="text-sm text-red-600 font-medium mb-2">{saveError}</p>}
          <EditorialForm draft={draft} onChange={setDraft} onSave={() => void handleSave()} onCancel={() => setDraft(null)} />
        </div>
      )}

      {items.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E8E4DD] px-5 py-10 text-center">
          <p className="text-sm font-semibold text-[#2D2A26] mb-2">No editorial features yet</p>
          <p className="text-xs text-[#9CA3AF]">Curate a spotlight once there's a founder or story worth drawing attention to.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#E8E4DD] divide-y divide-[#F3EDE6]">
          {items.map(item => (
            <div key={item.id} className="flex items-center gap-4 px-5 py-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#2D2A26] truncate">{item.title || '(untitled)'}</p>
                <p className="text-xs text-[#9CA3AF] mt-0.5">{TEMPLATE_LABELS[item.template]} · {item.status} · {item.picks.length} pick{item.picks.length !== 1 ? 's' : ''}</p>
              </div>
              <button onClick={() => setDraft(item)} className="text-xs text-[#6B7280] hover:text-[#C86A43] transition-colors shrink-0">Edit</button>
              <ConfirmButton label="Delete" confirmLabel="Confirm" onConfirm={() => void handleDelete(item.id)} className="text-xs text-red-600 hover:underline shrink-0" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Spotlight page — Featured toggles + Editorial write-ups, one place ─────────

export function VillageSpotlightPage() {
  const [tab, setTab] = useState('toggle')
  const TABS: DashTab[] = [
    { key: 'toggle', label: 'Featured Content' },
    { key: 'editorial', label: 'Editorial' },
  ]

  return (
    <div className="p-8 max-w-4xl" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <CapoBackLink />
      <div className="mb-6">
        <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-widest mb-1">CAPO</p>
        <h1 className="text-2xl font-bold text-[#2D2A26]">Spotlight</h1>
        <p className="text-sm text-[#6B7280] mt-0.5">
          Everything that puts content in front of visitors — pinning existing work, and writing new curated features.
        </p>
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} className="mb-6" />

      {tab === 'toggle' && <FeatureTogglePanel />}
      {tab === 'editorial' && <EditorialPanel />}
    </div>
  )
}
