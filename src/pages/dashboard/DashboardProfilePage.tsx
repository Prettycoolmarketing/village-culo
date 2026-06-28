import { useState, type ReactNode } from 'react'
import { getFounders, updateFounder } from '../../services/founders'
import { getStories } from '../../services/stories'
import { getIdeas } from '../../services/ideas'
import { getLibraryItems } from '../../services/library'
import { locations } from '../../data/locations'
import { industries } from '../../data/industries'
import { topics as allTopics } from '../../data/topics'
import { isSupabaseConfigured } from '../../lib/supabase'
import { Tabs } from '../../components/dashboard/Tabs'
import { MissingAssetsPanel } from '../../components/dashboard/MissingAssetsPanel'
import { FeaturedInPanel } from '../../components/dashboard/FeaturedInPanel'
import { RelationshipsPanel } from '../../components/dashboard/RelationshipsPanel'
import { HealthBadge } from '../../components/dashboard/PublishingHealth'
import { getFounderMissingItems, getMissingCounts } from '../../utils/missingAssets'
import { getFounderFeaturedIn } from '../../utils/featuredIn'
import type { Founder, Topic } from '../../types'

// ─── Shared form helpers ───────────────────────────────────────────────────────

const inputClass =
  'w-full px-3 py-2.5 rounded-lg border border-[#E8E4DD] text-sm text-[#2D2A26] bg-white placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#C86A43]/30 focus:border-[#C86A43] transition-colors'

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-[#2D2A26] mb-1.5">{label}</label>
      {hint && <p className="text-xs text-[#9CA3AF] mb-1.5">{hint}</p>}
      {children}
    </div>
  )
}

// ─── DashboardProfilePage ──────────────────────────────────────────────────────

export function DashboardProfilePage() {
  const [draft, setDraft]   = useState<Founder>(() => ({ ...getFounders()[0]! }))
  const [saved, setSaved]   = useState(false)
  const [saving, setSaving] = useState(false)
  const [tab, setTab]       = useState('overview')

  const missing     = getFounderMissingItems(draft)
  const counts      = getMissingCounts(missing)
  const featuredIn  = getFounderFeaturedIn(draft.id)

  // Relationships
  const founderStories  = getStories({ founderId: draft.id })
  const founderIdeas    = getIdeas({ founderId: draft.id })
  const founderLibrary  = getLibraryItems({ founderId: draft.id })

  const TABS = [
    { key: 'overview',      label: 'Overview'     },
    { key: 'content',       label: 'Content'      },
    { key: 'media',         label: 'Media'        },
    { key: 'relationships', label: 'Relationships', badge: founderStories.length + founderIdeas.length },
    { key: 'featured-in',   label: 'Featured In',  badge: featuredIn.length },
    { key: 'seo',           label: 'SEO & GEO'    },
    { key: 'publishing',    label: 'Publishing'   },
    { key: 'settings',      label: 'Settings'     },
  ]

  function set<K extends keyof Founder>(key: K, value: Founder[K]) {
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

  function handleSave() {
    setSaving(true)
    updateFounder(draft)
    setSaving(false)
    setSaved(true)
  }

  return (
    <div className="flex flex-col h-full" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* Page header */}
      <div className="flex items-center justify-between px-8 pt-8 pb-5 shrink-0">
        <div className="flex items-center gap-4">
          <img src={draft.avatar} alt="" className="w-10 h-10 rounded-full object-cover bg-[#F3EDE6]" />
          <div>
            <h1 className="text-xl font-bold text-[#2D2A26]">{draft.name}</h1>
            <div className="flex items-center gap-3 mt-0.5">
              <HealthBadge missing={missing} />
              {counts.total > 0 && (
                <span className="text-xs text-[#9CA3AF]">
                  {counts.critical > 0 ? `${counts.critical} critical, ` : ''}{counts.total} total issues
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={`/founders/${draft.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 text-sm text-[#6B7280] border border-[#E8E4DD] rounded-lg hover:border-[#C86A43]/50 hover:text-[#C86A43] transition-colors"
          >
            View on site ↗
          </a>
          {saved && <p className="text-sm text-green-600 font-medium">Saved ✓</p>}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-[#C86A43] text-white text-sm font-semibold rounded-lg hover:bg-[#b05a35] disabled:opacity-60 transition-colors"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Dev notice */}
      {!isSupabaseConfigured && (
        <div className="mx-8 mb-4 px-4 py-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-700 shrink-0">
          Dev mode — changes are saved to browser localStorage and survive page refresh. Connect Supabase to sync to the cloud.
        </div>
      )}

      {/* Tabs */}
      <Tabs tabs={TABS} active={tab} onChange={setTab} className="px-8" />

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">

        {/* ── Overview ─────────────────────────────────────────────────── */}
        {tab === 'overview' && (
          <div className="max-w-2xl flex flex-col gap-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border border-[#E8E4DD] px-4 py-4 text-center">
                <p className="text-2xl font-bold text-[#2D2A26]">{founderStories.length}</p>
                <p className="text-xs text-[#9CA3AF] mt-0.5">Stories</p>
              </div>
              <div className="bg-white rounded-xl border border-[#E8E4DD] px-4 py-4 text-center">
                <p className="text-2xl font-bold text-[#2D2A26]">{founderIdeas.length}</p>
                <p className="text-xs text-[#9CA3AF] mt-0.5">Ideas</p>
              </div>
              <div className="bg-white rounded-xl border border-[#E8E4DD] px-4 py-4 text-center">
                <p className="text-2xl font-bold text-[#2D2A26]">{founderLibrary.length}</p>
                <p className="text-xs text-[#9CA3AF] mt-0.5">Library</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest mb-3">Publishing Completeness</p>
              <MissingAssetsPanel items={missing} />
            </div>

            <div className="bg-white rounded-xl border border-[#E8E4DD] overflow-hidden">
              <div className="px-5 py-4 border-b border-[#F3EDE6]">
                <p className="text-sm font-semibold text-[#2D2A26]">Quick Preview</p>
              </div>
              <div className="px-5 py-4 flex gap-4">
                <img src={draft.avatar} alt="" className="w-16 h-16 rounded-full object-cover bg-[#F3EDE6] shrink-0" />
                <div>
                  <p className="font-semibold text-[#2D2A26]">{draft.name}</p>
                  <p className="text-sm text-[#6B7280] mt-1">{draft.location.name} · {draft.industry.name}</p>
                  <p className="text-sm text-[#6B7280] mt-2 line-clamp-2">{draft.bio}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Content ──────────────────────────────────────────────────── */}
        {tab === 'content' && (
          <div className="max-w-2xl flex flex-col gap-5">
            <Field label="Display Name">
              <input type="text" value={draft.name} onChange={e => set('name', e.target.value)} className={inputClass} />
            </Field>
            <Field label="Bio" hint="Write in your own voice — aim for 200+ characters.">
              <textarea value={draft.bio} onChange={e => set('bio', e.target.value)} rows={6} className={inputClass + ' resize-y'} />
              <p className="text-xs text-right text-[#9CA3AF] mt-1">{draft.bio.length} chars</p>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Location">
                <select
                  value={draft.location.id}
                  onChange={e => { const l = locations.find(x => x.id === e.target.value); if (l) set('location', l) }}
                  className={inputClass}
                >
                  {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </Field>
              <Field label="Primary Industry">
                <select
                  value={draft.industry.id}
                  onChange={e => { const i = industries.find(x => x.id === e.target.value); if (i) set('industry', i) }}
                  className={inputClass}
                >
                  {industries.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Topics" hint="Power the Village knowledge graph.">
              <div className="flex flex-wrap gap-2 mt-1">
                {allTopics.map(topic => {
                  const active = draft.topics.some(t => t.id === topic.id)
                  return (
                    <button
                      key={topic.id}
                      onClick={() => toggleTopic(topic)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                        active
                          ? 'bg-[#C86A43] text-white border-[#C86A43]'
                          : 'bg-white text-[#4B4845] border-[#E8E4DD] hover:border-[#C86A43]/50'
                      }`}
                    >
                      {topic.name}
                    </button>
                  )
                })}
              </div>
            </Field>
          </div>
        )}

        {/* ── Media ────────────────────────────────────────────────────── */}
        {tab === 'media' && (
          <div className="max-w-2xl flex flex-col gap-6">
            <Field label="Profile Photo" hint="Displayed as your avatar throughout the Village (square, min 400×400px).">
              <div className="flex gap-4 items-start mt-2">
                <img src={draft.avatar || '/placeholders/village-logo.svg'} alt="" className="w-20 h-20 rounded-full object-cover shrink-0 bg-[#F3EDE6] border border-[#E8E4DD]" />
                <div className="flex-1">
                  <input type="url" value={draft.avatar} onChange={e => set('avatar', e.target.value)} className={inputClass} placeholder="/assets/your-headshot.jpg" />
                  {draft.avatar.includes('/placeholders/') && (
                    <p className="text-xs text-red-600 mt-1.5">⚠ Using a placeholder — upload a real photo.</p>
                  )}
                </div>
              </div>
            </Field>

            <Field label="Cover Image" hint="Displayed at the top of your founder profile page (16:9 recommended).">
              <div className="flex flex-col gap-2 mt-2">
                {draft.coverImage && (
                  <img src={draft.coverImage} alt="" className="w-full h-32 rounded-xl object-cover bg-[#F3EDE6] border border-[#E8E4DD]" />
                )}
                <input type="url" value={draft.coverImage ?? ''} onChange={e => set('coverImage', e.target.value || undefined)} className={inputClass} placeholder="/assets/your-cover.jpg" />
                {draft.coverImage?.includes('/placeholders/') && (
                  <p className="text-xs text-amber-600">⚠ Using a placeholder — add a real cover image.</p>
                )}
              </div>
            </Field>
          </div>
        )}

        {/* ── Relationships ─────────────────────────────────────────────── */}
        {tab === 'relationships' && (
          <div className="max-w-2xl">
            <RelationshipsPanel
              groups={[
                {
                  title: 'Stories',
                  items: founderStories.map(s => ({
                    id: s.id, label: s.title, sublabel: s.contentTypes.join(' · ') + ' · ' + s.status,
                    path: `/stories/${s.slug}`, image: s.coverImage,
                  })),
                },
                {
                  title: 'Ideas',
                  items: founderIdeas.map(i => ({
                    id: i.id, label: i.title, sublabel: i.topics.map(t => t.name).join(', '),
                    path: `/ideas/${i.slug}`,
                  })),
                },
                {
                  title: 'Library',
                  items: founderLibrary.map(l => ({
                    id: l.id, label: l.title, sublabel: l.productType + ' · ' + l.status,
                    path: `/library/${l.slug}`, image: l.coverImage,
                  })),
                },
              ]}
            />
          </div>
        )}

        {/* ── Featured In ───────────────────────────────────────────────── */}
        {tab === 'featured-in' && (
          <div className="max-w-2xl">
            <p className="text-sm text-[#6B7280] mb-4">Every location in the Village where your founder profile is surfaced.</p>
            <FeaturedInPanel locations={featuredIn} />
          </div>
        )}

        {/* ── SEO & GEO ─────────────────────────────────────────────────── */}
        {tab === 'seo' && (
          <div className="max-w-2xl flex flex-col gap-5">
            <Field label="SEO Title" hint="Shown in browser tab and search results. ~60 chars.">
              <input type="text" value={draft.seoTitle ?? ''} onChange={e => set('seoTitle', e.target.value || undefined)} className={inputClass} placeholder="Shakas — Founder Storytelling &amp; Content Systems" />
              <p className="text-xs text-right text-[#9CA3AF] mt-1">{(draft.seoTitle ?? '').length}/60</p>
            </Field>
            <Field label="SEO Description" hint="Shown in search results. 140–160 chars ideal.">
              <textarea value={draft.seoDescription ?? ''} onChange={e => set('seoDescription', e.target.value || undefined)} rows={3} className={inputClass + ' resize-none'} placeholder="15+ years turning founder stories into content systems that build visibility, trust and sales." />
              <p className="text-xs text-right text-[#9CA3AF] mt-1">{(draft.seoDescription ?? '').length}/160</p>
            </Field>
            <div className="border-t border-[#E8E4DD] pt-5">
              <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest mb-3">Location Data</p>
              <div className="bg-white rounded-xl border border-[#E8E4DD] px-4 py-3 text-sm text-[#6B7280]">
                <p><span className="font-medium text-[#2D2A26]">Region:</span> {draft.location.name}, {draft.location.state}</p>
                <p className="mt-1"><span className="font-medium text-[#2D2A26]">Country:</span> {draft.location.country}</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Publishing ────────────────────────────────────────────────── */}
        {tab === 'publishing' && (
          <div className="max-w-2xl flex flex-col gap-5">
            <div className="bg-white rounded-xl border border-[#E8E4DD] px-5 py-4">
              <p className="text-sm font-semibold text-[#2D2A26] mb-3">Publishing Status</p>
              <div className="flex gap-2 flex-wrap">
                {(['draft', 'submitted', 'published', 'featured', 'archived'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => set('status', s)}
                    className={`px-3 py-1.5 rounded-lg text-sm border font-medium transition-colors capitalize ${
                      draft.status === s
                        ? 'bg-[#C86A43] text-white border-[#C86A43]'
                        : 'bg-white text-[#6B7280] border-[#E8E4DD] hover:border-[#C86A43]/50'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#E8E4DD] px-5 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#2D2A26]">Featured on Village Homepage</p>
                  <p className="text-xs text-[#9CA3AF] mt-0.5">Surfaces this founder in the Village homepage feed.</p>
                </div>
                <button
                  onClick={() => set('featured', !draft.featured)}
                  className={`w-11 h-6 rounded-full transition-colors ${draft.featured ? 'bg-[#C86A43]' : 'bg-[#E8E4DD]'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform mx-1 ${draft.featured ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#E8E4DD] px-5 py-4">
              <p className="text-sm font-semibold text-[#2D2A26] mb-2">Links</p>
              <div className="flex flex-col gap-3">
                <Field label="Website">
                  <input type="url" value={draft.website ?? ''} onChange={e => set('website', e.target.value || undefined)} className={inputClass} placeholder="https://yourwebsite.com" />
                </Field>
                <Field label="Instagram">
                  <input type="url" value={draft.instagram ?? ''} onChange={e => set('instagram', e.target.value || undefined)} className={inputClass} placeholder="https://instagram.com/handle" />
                </Field>
                <Field label="LinkedIn">
                  <input type="url" value={draft.linkedin ?? ''} onChange={e => set('linkedin', e.target.value || undefined)} className={inputClass} placeholder="https://linkedin.com/in/handle" />
                </Field>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#E8E4DD] px-5 py-4 text-sm">
              <p className="font-semibold text-[#2D2A26] mb-2">Publishing Dates</p>
              <p className="text-[#6B7280]"><span className="font-medium text-[#2D2A26]">Created:</span> {draft.createdAt}</p>
            </div>
          </div>
        )}

        {/* ── Settings ─────────────────────────────────────────────────── */}
        {tab === 'settings' && (
          <div className="max-w-2xl flex flex-col gap-4">
            <div className="bg-white rounded-xl border border-[#E8E4DD] px-5 py-4">
              <p className="text-sm font-semibold text-[#2D2A26] mb-1">Founder ID</p>
              <p className="text-xs font-mono text-[#6B7280]">{draft.id}</p>
            </div>
            <div className="bg-white rounded-xl border border-[#E8E4DD] px-5 py-4">
              <p className="text-sm font-semibold text-[#2D2A26] mb-1">Public Slug</p>
              <p className="text-xs font-mono text-[#6B7280]">/founders/{draft.slug}</p>
            </div>
            <div className="bg-white rounded-xl border border-[#E8E4DD] px-5 py-4">
              <p className="text-sm font-semibold text-[#2D2A26] mb-2">Danger Zone</p>
              <p className="text-xs text-[#9CA3AF] mb-3">Archiving removes this founder from all public directories while preserving their data.</p>
              <button
                disabled
                className="px-4 py-2 text-sm border border-[#E8E4DD] rounded-lg text-[#9CA3AF] cursor-not-allowed"
                title="Connect Supabase to enable"
              >
                Archive Founder (requires Supabase)
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Bottom save bar */}
      <div className="flex items-center justify-end gap-3 px-8 py-4 border-t border-[#E8E4DD] bg-white shrink-0">
        {saved && <p className="text-sm text-green-600 font-medium">Saved ✓</p>}
        <button onClick={handleSave} disabled={saving} className="px-5 py-2 bg-[#C86A43] text-white text-sm font-semibold rounded-lg hover:bg-[#b05a35] disabled:opacity-60 transition-colors">
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
