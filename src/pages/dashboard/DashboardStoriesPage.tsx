import { useState, type ReactNode } from 'react'
import { getStories, updateStory } from '../../services/stories'
import { villageContentIntelligenceService, storyToInput } from '../../services/villageIntelligence'
import { getFounders } from '../../services/founders'
import { getBusinesses } from '../../services/businesses'
import { getIdeas } from '../../services/ideas'
import { locations } from '../../data/locations'
import { industries } from '../../data/industries'
import { topics as allTopics } from '../../data/topics'
import { Tabs } from '../../components/dashboard/Tabs'
import { MissingAssetsPanel } from '../../components/dashboard/MissingAssetsPanel'
import { FeaturedInPanel } from '../../components/dashboard/FeaturedInPanel'
import { RelationshipsPanel } from '../../components/dashboard/RelationshipsPanel'
import { HealthBadge } from '../../components/dashboard/PublishingHealth'
import { getStoryMissingItems, getMissingCounts } from '../../utils/missingAssets'
import { getStoryFeaturedIn } from '../../utils/featuredIn'
import type { Story, ContentType, Topic } from '../../types'

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

const CONTENT_TYPES: ContentType[] = ['blog', 'reel', 'carousel']
const PUBLISHING_SOURCES = [
  'manual-dashboard', 'piazza-form', 'canva-api',
  'website-import', 'youtube-import', 'one-drive-import', 'system-generated',
] as const

// ─── Detail pane ──────────────────────────────────────────────────────────────

function StoryDetailPane({ story, onSave }: { story: Story; onSave: (s: Story) => void }) {
  const [draft, setDraft]   = useState<Story>({ ...story })
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [tab, setTab]       = useState('overview')

  const missing    = getStoryMissingItems(draft)
  const counts     = getMissingCounts(missing)
  const featuredIn = getStoryFeaturedIn(draft.id)

  const storyFounder   = getFounders().find(f => f.id === draft.founderId)
  const storyBusiness  = getBusinesses().find(b => b.id === draft.businessId)
  const relatedIdeas   = getIdeas().filter(i => draft.ideaIds.includes(i.id))
  const relatedStories = getStories().filter(s => draft.relatedStoryIds.includes(s.id))

  const TABS = [
    { key: 'overview',      label: 'Overview'     },
    { key: 'content',       label: 'Content'      },
    { key: 'media',         label: 'Media'        },
    { key: 'relationships', label: 'Relationships', badge: relatedIdeas.length + relatedStories.length },
    { key: 'featured-in',   label: 'Featured In',   badge: featuredIn.length },
    { key: 'seo',           label: 'SEO & GEO'    },
    { key: 'publishing',    label: 'Publishing'   },
  ]

  function set<K extends keyof Story>(key: K, value: Story[K]) {
    setDraft(prev => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  function toggleContentType(ct: ContentType) {
    setDraft(prev => {
      const has = prev.contentTypes.includes(ct)
      setSaved(false)
      return { ...prev, contentTypes: has ? prev.contentTypes.filter(x => x !== ct) : [...prev.contentTypes, ct] }
    })
  }

  function toggleTopic(topic: Topic) {
    setDraft(prev => {
      const has = prev.topics.some(t => t.id === topic.id)
      setSaved(false)
      return { ...prev, topics: has ? prev.topics.filter(t => t.id !== topic.id) : [...prev.topics, topic] }
    })
  }

  async function handleSave() {
    setSaving(true)
    setSaveError(null)
    const result = await updateStory(draft)
    setSaving(false)
    if (result.success) {
      // Editing a published story regenerates intelligence — same engine,
      // same call shape as publishing it the first time (DashboardPublishPage),
      // so SEO/GEO/related-content all stay current with no separate refresh.
      if (draft.status === 'published' || draft.status === 'featured') {
        const intel = villageContentIntelligenceService.analyse(storyToInput(draft))
        void villageContentIntelligenceService.upsert(intel)
      }
      setSaved(true)
      onSave(draft)
    } else {
      setSaveError(result.error ?? 'Save failed. Please try again.')
    }
  }

  const hasCarousel = draft.contentTypes.includes('carousel')
  const hasReel     = draft.contentTypes.includes('reel')
  const hasBlog     = draft.contentTypes.includes('blog')

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="flex items-start justify-between px-6 pt-6 pb-4 shrink-0 gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <img src={draft.coverImage} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0 bg-[#F3EDE6]" />
          <div className="min-w-0">
            <p className="text-sm font-bold text-[#2D2A26] leading-tight">{draft.title}</p>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {draft.contentTypes.map(ct => (
                <span key={ct} className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#F3EDE6] text-[#C86A43] uppercase">{ct}</span>
              ))}
              <HealthBadge missing={missing} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {saved && <span className="text-xs text-green-600 font-medium">Saved ✓</span>}
          {saveError && <span className="text-xs text-red-600 font-medium">{saveError}</span>}
          <a href={`/stories/${draft.slug}`} target="_blank" rel="noopener noreferrer"
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
                <p className="text-xl font-bold text-[#2D2A26]">{draft.contentTypes.length}</p>
                <p className="text-xs text-[#9CA3AF]">Content types</p>
              </div>
              <div className="bg-white rounded-xl border border-[#E8E4DD] px-3 py-3 text-center">
                <p className="text-xl font-bold text-[#2D2A26]">{relatedIdeas.length}</p>
                <p className="text-xs text-[#9CA3AF]">Related ideas</p>
              </div>
              <div className="bg-white rounded-xl border border-[#E8E4DD] px-3 py-3 text-center">
                <p className="text-xl font-bold text-[#2D2A26]">{counts.total > 0 ? counts.total : '✓'}</p>
                <p className="text-xs text-[#9CA3AF]">To Improve</p>
              </div>
            </div>
            <MissingAssetsPanel items={missing} onAction={() => setTab('content')} />
          </div>
        )}

        {/* Content */}
        {tab === 'content' && (
          <div className="flex flex-col gap-5">
            <Field label="Title">
              <input type="text" value={draft.title} onChange={e => set('title', e.target.value)} className={inputClass} />
            </Field>
            <Field label="Summary">
              <textarea value={draft.summary} onChange={e => set('summary', e.target.value)} rows={3} className={inputClass + ' resize-y'} />
            </Field>

            <Field label="Content Types" hint="Select all formats this story is published in">
              <div className="flex gap-2 flex-wrap mt-1">
                {CONTENT_TYPES.map(ct => (
                  <button key={ct} onClick={() => toggleContentType(ct)}
                    className={`px-3 py-1.5 rounded-lg text-sm border font-medium transition-colors capitalize ${draft.contentTypes.includes(ct) ? 'bg-[#C86A43] text-white border-[#C86A43]' : 'bg-white text-[#6B7280] border-[#E8E4DD] hover:border-[#C86A43]/50'}`}>
                    {ct}
                  </button>
                ))}
              </div>
            </Field>

            {/* Blog content */}
            {hasBlog && (
              <div className="border border-[#E8E4DD] rounded-xl overflow-hidden">
                <div className="bg-[#F8F5F0] px-4 py-2 border-b border-[#E8E4DD]">
                  <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-widest">Blog</p>
                </div>
                <div className="px-4 py-3">
                  <textarea
                    value={draft.blog ?? ''}
                    onChange={e => set('blog', e.target.value || undefined)}
                    rows={8}
                    placeholder="Paste or write full blog content here…"
                    className={inputClass + ' resize-y'}
                  />
                </div>
              </div>
            )}

            {/* Reel content */}
            {hasReel && (
              <div className="border border-[#E8E4DD] rounded-xl overflow-hidden">
                <div className="bg-[#F8F5F0] px-4 py-2 border-b border-[#E8E4DD]">
                  <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-widest">Reel</p>
                </div>
                <div className="px-4 py-3">
                  <Field label="Reel URL">
                    <input type="url" value={draft.reelUrl ?? ''} onChange={e => set('reelUrl', e.target.value || undefined)} className={inputClass} placeholder="https://…" />
                  </Field>
                  {draft.reelUrl && (
                    <a href={draft.reelUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-[#C86A43] hover:underline mt-1 inline-block">Preview ↗</a>
                  )}
                </div>
              </div>
            )}

            {/* Carousel content */}
            {hasCarousel && (
              <div className="border border-[#E8E4DD] rounded-xl overflow-hidden">
                <div className="bg-[#F8F5F0] px-4 py-2 border-b border-[#E8E4DD]">
                  <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-widest">Carousel</p>
                </div>
                <div className="px-4 py-3 flex flex-col gap-3">
                  {(draft.carouselImages ?? []).map((img, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <img src={img} alt="" className="w-10 h-10 rounded object-cover shrink-0 bg-[#F3EDE6]" />
                      <input
                        type="url"
                        value={img}
                        onChange={e => {
                          const next = [...(draft.carouselImages ?? [])]
                          next[i] = e.target.value
                          set('carouselImages', next)
                        }}
                        className={inputClass}
                        placeholder={`Slide ${i + 1} URL`}
                      />
                      <button
                        onClick={() => set('carouselImages', (draft.carouselImages ?? []).filter((_, j) => j !== i))}
                        className="shrink-0 text-xs text-[#9CA3AF] hover:text-red-500 px-2">✕</button>
                    </div>
                  ))}
                  <button
                    onClick={() => set('carouselImages', [...(draft.carouselImages ?? []), ''])}
                    className="text-xs text-[#C86A43] hover:underline text-left mt-1">
                    + Add slide
                  </button>
                </div>
              </div>
            )}

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
              <Field label="CTA Label">
                <input type="text" value={draft.ctaLabel} onChange={e => set('ctaLabel', e.target.value)} className={inputClass} placeholder="Read more" />
              </Field>
              <Field label="CTA URL">
                <input type="url" value={draft.ctaUrl} onChange={e => set('ctaUrl', e.target.value)} className={inputClass} placeholder="https://" />
              </Field>
            </div>
          </div>
        )}

        {/* Media */}
        {tab === 'media' && (
          <div className="flex flex-col gap-4">
            <Field label="Cover Image" hint="Used on story card, story page header, and social share.">
              <div className="flex flex-col gap-2">
                {draft.coverImage && <img src={draft.coverImage} alt="" className="w-full h-36 rounded-xl object-cover bg-[#F3EDE6] border border-[#E8E4DD]" />}
                <input type="url" value={draft.coverImage} onChange={e => set('coverImage', e.target.value)} className={inputClass} placeholder="/assets/story-cover.jpg" />
                {draft.coverImage.includes('/placeholders/') && <p className="text-xs text-red-600">⚠ Using placeholder — add a real cover image.</p>}
              </div>
            </Field>
          </div>
        )}

        {/* Relationships */}
        {tab === 'relationships' && (
          <RelationshipsPanel
            groups={[
              {
                title: 'Founder',
                items: storyFounder ? [{ id: storyFounder.id, label: storyFounder.name, sublabel: storyFounder.industry.name, path: `/founders/${storyFounder.slug}`, image: storyFounder.avatar }] : [],
              },
              {
                title: 'Business',
                items: storyBusiness ? [{ id: storyBusiness.id, label: storyBusiness.name, sublabel: storyBusiness.location.name, path: `/businesses/${storyBusiness.slug}`, image: storyBusiness.logo }] : [],
              },
              {
                title: 'Ideas',
                items: relatedIdeas.map(i => ({ id: i.id, label: i.title, sublabel: i.topics.map(t => t.name).join(', '), path: `/ideas/${i.slug}` })),
              },
              {
                title: 'Related Stories',
                items: relatedStories.map(s => ({ id: s.id, label: s.title, sublabel: s.contentTypes.join(' · '), path: `/stories/${s.slug}`, image: s.coverImage })),
              },
            ]}
          />
        )}

        {/* Featured In */}
        {tab === 'featured-in' && (
          <div>
            <p className="text-sm text-[#6B7280] mb-4">Every location where this story is surfaced in the Village.</p>
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
            <div className="bg-white rounded-xl border border-[#E8E4DD] px-4 py-3">
              <p className="text-xs font-semibold text-[#6B7280] mb-1.5">Location</p>
              <p className="text-sm text-[#2D2A26]">{draft.location.name}, {draft.location.state} · {draft.location.country}</p>
            </div>
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
                  <p className="text-xs text-[#9CA3AF] mt-0.5">Show in Village homepage and featured sections</p>
                </div>
                <button onClick={() => set('featured', !draft.featured)}
                  className={`w-11 h-6 rounded-full transition-colors ${draft.featured ? 'bg-[#C86A43]' : 'bg-[#E8E4DD]'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform mx-1 ${draft.featured ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#E8E4DD] px-5 py-4">
              <p className="text-sm font-semibold text-[#2D2A26] mb-3">Publishing Source</p>
              <div className="flex flex-wrap gap-2">
                {PUBLISHING_SOURCES.map(src => (
                  <button key={src} onClick={() => set('publishingSource', src)}
                    className={`px-2.5 py-1 rounded-lg text-xs border transition-colors ${draft.publishingSource === src ? 'bg-[#5E6B4A] text-white border-[#5E6B4A]' : 'bg-white text-[#6B7280] border-[#E8E4DD] hover:border-[#5E6B4A]/50'}`}>
                    {src.replace(/-/g, ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-xl border border-[#E8E4DD] px-4 py-3 text-sm">
                <p className="font-semibold text-[#2D2A26] mb-1">Created</p>
                <p className="text-[#6B7280]">{draft.createdAt}</p>
              </div>
              <div className="bg-white rounded-xl border border-[#E8E4DD] px-4 py-3 text-sm">
                <p className="font-semibold text-[#2D2A26] mb-1">Updated</p>
                <p className="text-[#6B7280]">{draft.updatedAt}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── DashboardStoriesPage ──────────────────────────────────────────────────────

export function DashboardStoriesPage() {
  const [storyList,  setStoryList]  = useState<Story[]>(() => getStories())
  const [selectedId, setSelectedId] = useState<string | null>(() => getStories()[0]?.id ?? null)
  const [search,     setSearch]     = useState('')

  const filtered = search ? storyList.filter(s => s.title.toLowerCase().includes(search.toLowerCase())) : storyList
  const selected = storyList.find(s => s.id === selectedId) ?? null

  function handleSave(updated: Story) {
    setStoryList(prev => prev.map(s => s.id === updated.id ? updated : s))
  }

  return (
    <div className="flex h-full" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── List ──────────────────────────────────────────────────────── */}
      <div className="w-72 shrink-0 border-r border-[#E8E4DD] bg-white flex flex-col overflow-hidden">
        <div className="px-4 pt-5 pb-3 shrink-0">
          <h1 className="text-base font-bold text-[#2D2A26]">Stories</h1>
          <p className="text-xs text-[#9CA3AF] mt-0.5 mb-3">{storyList.length} total</p>
          <input
            type="search"
            placeholder="Search stories…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[#E8E4DD] text-sm placeholder:text-[#9CA3AF] focus:outline-none focus:ring-1 focus:ring-[#C86A43]/30"
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.map(story => {
            const missing  = getStoryMissingItems(story)
            const recommended = missing.filter(m => m.severity === 'critical').length
            return (
              <button key={story.id} onClick={() => setSelectedId(story.id)}
                className={`w-full text-left flex items-center gap-3 px-4 py-3 border-b border-[#F3EDE6] transition-colors ${
                  selectedId === story.id ? 'bg-[#C86A43]/5 border-l-2 border-l-[#C86A43]' : 'hover:bg-[#F8F5F0]'
                }`}>
                <img src={story.coverImage} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0 bg-[#F3EDE6]" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#2D2A26] truncate">{story.title}</p>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    {story.contentTypes.map(ct => (
                      <span key={ct} className="text-[9px] font-semibold px-1 py-0.5 rounded bg-[#F3EDE6] text-[#C86A43] uppercase">{ct}</span>
                    ))}
                    {recommended > 0 && (
                      <span className="text-[9px] font-bold px-1 py-0.5 rounded-full bg-[#FBF1EB] text-[#C86A43]">{recommended}</span>
                    )}
                  </div>
                </div>
                <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${
                  story.status === 'published' || story.status === 'featured' ? 'bg-green-100 text-green-700' :
                  story.status === 'draft' ? 'bg-[#F3EDE6] text-[#9CA3AF]' : 'bg-amber-100 text-amber-700'
                }`}>
                  {story.status}
                </span>
              </button>
            )
          })}
          {filtered.length === 0 && (
            <p className="text-xs text-[#9CA3AF] px-4 py-6 text-center">No stories match "{search}"</p>
          )}
        </div>
      </div>

      {/* ── Detail ────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden bg-[#F8F5F0]">
        {selected ? (
          <StoryDetailPane key={selected.id} story={selected} onSave={handleSave} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-[#9CA3AF]">Select a story to edit</p>
          </div>
        )}
      </div>
    </div>
  )
}
