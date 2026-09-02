import { useState, useEffect, type ReactNode } from 'react'
import { useNavigate, Link, useSearchParams, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { getCurrentFounder } from '../../services/currentFounder'
import { updateFounder, deleteFounder, getFounder } from '../../services/founders'
import { buildStoryFromImport, publishStoryCore, syncImportEditsToStory } from '../../services/publishStory'
import { SavedRow, isReadyToPublish, hasRealCaption, EditForm } from './DashboardImportContentPage'
import { SeriesDetail } from './DashboardSeriesPage'
import { getSeriesList, createSeries, saveSeries } from '../../services/series'
import { villageContentIntelligenceService, importedContentToInput } from '../../services/villageIntelligence'
import type { ImportedContent } from '../../types/importedContent'
import { getBusinesses, updateBusiness, deleteBusiness } from '../../services/businesses'
import { EmptyState } from '../../components/ui/EmptyState'
import { ConfirmButton } from '../../components/ui/ConfirmButton'
import { MediaUpload } from '../../components/ui/MediaUpload'
import { SourceIcon } from '../../components/ui/SourceIcon'
import { FAQEditor } from '../../components/dashboard/FAQEditor'
import { publisherPartnerProfileService, affiliateLinkService } from '../../services/partnership'
import { getStories, getStory, updateStory, deleteStory, removeTopicFromStories } from '../../services/stories'
import { importedContentService, PLATFORM_LABELS as IMPORT_PLATFORM_LABELS } from '../../services/importedContent'
import type { ImportedContentPlatform, ImportedContentStatus } from '../../types/importedContent'
import { generateBlogFromVoiceBrief } from '../../services/blogWriter'
import { getIdeas } from '../../services/ideas'
import { getLibraryItems } from '../../services/library'
import { getMedia } from '../../services/media'
import { locations } from '../../data/locations'
import { industries } from '../../data/industries'
import { topics as allTopics } from '../../data/topics'
import { slugify } from '../../utils/slugify'
import { isSupabaseConfigured } from '../../lib/supabase'
import { Tabs } from '../../components/dashboard/Tabs'
import { MissingAssetsPanel } from '../../components/dashboard/MissingAssetsPanel'
import { AppearsOnPanel } from '../../components/dashboard/AppearsOnPanel'
import { RelationshipsPanel } from '../../components/dashboard/RelationshipsPanel'
import { HealthBadge } from '../../components/dashboard/PublishingHealth'
import { BusinessDiscoveryProfile, BusinessProgramsTab } from '../../components/dashboard/BusinessWorkspace'
import { StoryEditor } from '../../components/dashboard/StoryEditor'
import {
  getFounderMissingItems,
  getMissingCounts,
  type MissingItem,
} from '../../utils/missingAssets'
import { getFounderAppearsOn, getBusinessAppearsOn } from '../../utils/appearsOn'
import { focusField } from '../../utils/focusField'
import { loadDraft, saveDraft, clearDraft } from '../../utils/draftAutosave'
import { suggestFaqsFromFounder } from '../../services/founderEnrichment'
import type { BlogQaPair } from '../../services/importedContentEnrichment'
import type { Founder, Topic, SocialLink, SocialPlatform, Business, Location, Industry } from '../../types'
import type { PublisherPartnerProfile } from '../../types/partnership'

// Every existing field keeps its home; this map only changed which tab a
// recommendation jumps to, not what data exists.
const FIELD_TO_TAB: Record<string, string> = {
  avatar: 'overview', coverImage: 'overview', bio: 'overview', socials: 'overview',
  topics: 'expertise', faqs: 'expertise',
  website: 'overview',
}

// AI rewriting (via the founder's own Voice & Brand Brief) costs real
// Anthropic API spend per call — not something to open up to every founder
// on the free Village tier yet. Gated the same way HIGH_VOLUME_IMPORT_EMAILS
// is in DashboardImportContentPage.tsx: a plain allowlist, not a real
// billing/plan system. This is a temporary switch, not the real thing —
// the actual plan is to make AI rewriting part of a paid CULO Publish tier
// once that exists; everyone else keeps the free heuristic title/topic
// suggestions they already get on import, unchanged.
const VOICE_REWRITE_EMAILS = (import.meta.env.VITE_VOICE_REWRITE_EMAILS ?? '')
  .split(',')
  .map((e: string) => e.trim().toLowerCase())
  .filter(Boolean)

// ─── Shared form helpers ───────────────────────────────────────────────────────

const inputClass =
  'w-full px-3 py-2.5 rounded-lg border border-[#E8E4DD] text-sm text-[#2D2A26] bg-white placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#C86A43]/30 focus:border-[#C86A43] transition-colors'

// Collapses stray double-spaces/line breaks a suggestion can carry from raw
// bio/story text — used both to clean text before it's saved as a real FAQ,
// and (lowercased) to compare an existing FAQ against a fresh suggestion so
// re-running "Suggest FAQs" never re-offers something already added.
function normalizeFaqText(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-[#2D2A26] mb-1.5">{label}</label>
      {hint && <p className="text-xs text-[#9CA3AF] mb-1.5">{hint}</p>}
      {children}
    </div>
  )
}

/** Explains why a section matters for discovery, not just what it does. */
function TabIntro({ children }: { children: ReactNode }) {
  return (
    <div className="px-4 py-3 bg-[#F8F5F0] rounded-xl mb-1">
      <p className="text-xs text-[#6B7280] leading-relaxed">{children}</p>
    </div>
  )
}

// ─── Publisher Discovery Profile (opportunity matching) ───────────────────────

function DiscoverySection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-[#E8E4DD] overflow-hidden">
      <div className="px-5 py-4 border-b border-[#F3EDE6]">
        <p className="text-sm font-semibold text-[#2D2A26]">{title}</p>
        {description && <p className="text-xs text-[#9CA3AF] mt-0.5 leading-relaxed">{description}</p>}
      </div>
      <div className="px-5 py-5 flex flex-col gap-4">
        {children}
      </div>
    </div>
  )
}


function PublisherDiscoveryProfile({ founderId }: {
  founderId: string
}) {
  const [profile, setProfile] = useState<PublisherPartnerProfile>(
    () => publisherPartnerProfileService.getOrCreate(founderId)
  )
  const [saved, setSaved] = useState(false)
  const [affiliateLinks, setAffiliateLinks] = useState(() => affiliateLinkService.getAll({ founderId }))
  const [newAffiliateBusinessName, setNewAffiliateBusinessName] = useState('')
  const [newAffiliateUrl, setNewAffiliateUrl] = useState('')

  const allBusinesses = getBusinesses({ founderId })

  async function handleAddAffiliateLink() {
    if (!newAffiliateBusinessName.trim() || !newAffiliateUrl.trim()) return
    // If the typed name matches one of the founder's own Village businesses,
    // link it properly (so CULO's auto-detection in stories still works) —
    // otherwise it's just a name, no businessId, and that's fine.
    const matched = allBusinesses.find(b => b.name.trim().toLowerCase() === newAffiliateBusinessName.trim().toLowerCase())
    const link = {
      id: crypto.randomUUID(),
      founderId,
      businessId: matched?.id,
      businessName: newAffiliateBusinessName.trim(),
      businessWebsite: matched?.website,
      affiliateUrl: newAffiliateUrl.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    const result = await affiliateLinkService.upsert(link)
    if (result.success) {
      setAffiliateLinks(affiliateLinkService.getAll({ founderId }))
      setNewAffiliateBusinessName('')
      setNewAffiliateUrl('')
    }
  }

  async function handleUpdateAffiliateUrl(id: string, url: string) {
    const link = affiliateLinks.find(l => l.id === id)
    if (!link) return
    setAffiliateLinks(prev => prev.map(l => l.id === id ? { ...l, affiliateUrl: url } : l))
    await affiliateLinkService.upsert({ ...link, affiliateUrl: url })
  }

  async function handleDeleteAffiliateLink(id: string) {
    const result = await affiliateLinkService.delete(id)
    if (result.success) setAffiliateLinks(affiliateLinkService.getAll({ founderId }))
  }

  function setP<K extends keyof PublisherPartnerProfile>(key: K, value: PublisherPartnerProfile[K]) {
    setProfile(prev => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  function handleSave() {
    publisherPartnerProfileService.upsert(profile)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const discoveryInputClass = inputClass

  return (
    <div className="flex flex-col gap-5">

      {/* Status */}
      <DiscoverySection
        title="Village Partner"
        description="Join to get the Partner badge on your public profile and become eligible for collaborations across the Village."
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-[#2D2A26]">Join the Village Partner program</p>
            <p className="text-xs text-[#9CA3AF] mt-0.5">Free to join — you can leave any time</p>
          </div>
          <button
            onClick={() => setP('enabled', !profile.enabled)}
            className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${profile.enabled ? 'bg-[#C86A43]' : 'bg-[#E8E4DD]'}`}
            aria-label="Toggle discovery"
          >
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${profile.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        {profile.enabled && (
          <div className="flex items-center gap-4 px-4 py-3 bg-[#F8F5F0] rounded-xl">
            <img src="/village-partnership-logo.png" alt="Village Partnership Program badge" className="w-14 h-14 rounded-full shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#2D2A26]">You're a Village Partner</p>
              <p className="text-xs text-[#9CA3AF] mt-0.5">This badge shows on your public profile automatically — download it to add to your own website too.</p>
            </div>
            <a href="/village-partnership-logo.png" download="village-partnership-badge.png"
              className="text-xs font-semibold px-3 py-2 rounded-lg bg-[#2D2A26] text-white hover:bg-[#1a1815] transition-colors shrink-0">
              Download badge
            </a>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-[#2D2A26] mb-1.5">Availability</label>
          <p className="text-xs text-[#9CA3AF] mb-2">Let businesses know how open you are right now</p>
          <div className="flex gap-2 flex-wrap">
            {([
              { value: 'available',    label: 'Available',     desc: 'Open to new opportunities' },
              { value: 'limited',      label: 'Limited',       desc: 'Selective — right opportunities only' },
              { value: 'unavailable',  label: 'Not Available', desc: 'Not looking right now' },
            ] as const).map(opt => (
              <button
                key={opt.value}
                onClick={() => setP('availability', opt.value)}
                title={opt.desc}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  (profile.availability ?? 'available') === opt.value
                    ? 'bg-[#C86A43] text-white border-[#C86A43]'
                    : 'bg-white text-[#6B7280] border-[#E8E4DD] hover:border-[#C86A43]/50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </DiscoverySection>

      {/* Book a Call */}
      <DiscoverySection
        title="Book a Call"
        description="Optional — add a Calendly, Cal.com or other booking link. It'll show as a 'Book a call' link on your public profile and on stories you publish, so anyone who discovers you can grab time with you directly."
      >
        <div>
          <label className="block text-sm font-medium text-[#2D2A26] mb-1.5">Booking link</label>
          <input
            type="url"
            value={profile.bookingUrl ?? ''}
            onChange={e => setP('bookingUrl', e.target.value || undefined)}
            className={discoveryInputClass}
            placeholder="https://calendly.com/your-name"
          />
          <p className="text-xs text-[#9CA3AF] mt-1.5">
            One link, everywhere — update it here and it changes instantly on your profile and on every story you've published, no need to update anything else.
          </p>
        </div>
      </DiscoverySection>

      {/* What I Genuinely Use & Recommend — now primarily an affiliate link
          manager: a real affiliate link IS a genuine recommendation, and
          CULO already auto-detects the business in your stories once one
          exists. The free-text box below is only for outside tools that
          will never have a Village business/affiliate link at all. */}
      <DiscoverySection
        title="What I Genuinely Use & Recommend"
        description="Your affiliate links — CULO detects these businesses in your stories automatically once a link exists here."
      >
        {affiliateLinks.length > 0 && (
          <div className="flex flex-col gap-2">
            {affiliateLinks.map(link => {
              const biz = allBusinesses.find(b => b.id === link.businessId)
              return (
                <div key={link.id} className="flex items-center gap-2 border border-[#E8E4DD] rounded-lg px-3 py-2">
                  <p className="text-xs font-medium text-[#2D2A26] w-32 shrink-0 truncate">{link.businessName || biz?.name || 'Unknown business'}</p>
                  <input type="url" value={link.affiliateUrl}
                    onChange={e => void handleUpdateAffiliateUrl(link.id, e.target.value)}
                    className="flex-1 px-2 py-1 text-xs border border-[#E8E4DD] rounded-md focus:outline-none focus:border-[#C86A43]"
                    placeholder="https://…" />
                  <button onClick={() => void handleDeleteAffiliateLink(link.id)}
                    className="text-xs text-[#9CA3AF] hover:text-red-500 shrink-0 px-1">✕</button>
                </div>
              )
            })}
          </div>
        )}

        <div className="flex items-center gap-2">
          <input type="text" value={newAffiliateBusinessName} onChange={e => setNewAffiliateBusinessName(e.target.value)}
            placeholder="Business name"
            className="w-36 shrink-0 px-2 py-2 text-xs border border-[#E8E4DD] rounded-lg focus:outline-none focus:border-[#C86A43]" />
          <input type="url" value={newAffiliateUrl} onChange={e => setNewAffiliateUrl(e.target.value)}
            placeholder="Their affiliate link"
            className="flex-1 px-2 py-2 text-xs border border-[#E8E4DD] rounded-lg focus:outline-none focus:border-[#C86A43]" />
          <button onClick={() => void handleAddAffiliateLink()} disabled={!newAffiliateBusinessName.trim() || !newAffiliateUrl.trim()}
            className="text-xs font-semibold px-3 py-2 rounded-lg bg-[#C86A43] text-white hover:bg-[#B15C38] disabled:opacity-40 transition-colors shrink-0">
            Add
          </button>
        </div>

      </DiscoverySection>

      <div className="flex items-center gap-3">
        <button onClick={handleSave} className="px-5 py-2.5 bg-[#C86A43] text-white text-sm font-semibold rounded-xl hover:bg-[#b05a35] transition-colors">
          Save
        </button>
        {saved && <p className="text-sm text-[#5E6B4A] font-medium">Saved ✓</p>}
      </div>
    </div>
  )
}

// ─── Businesses tab ─────────────────────────────────────────────────────────
// Deliberately simple — the same shape of fields as the Profile tab's Identity
// card (name, tagline/bio-equivalent, photos, location, industry, topics,
// links). Anything deeper (Discovery Profile, Partner Programs, Services,
// Offers) stays on the full Businesses workspace — linked out, not duplicated
// here. Multiple businesses switch via pills, same pattern as the platform
// filters on Import Content.

function BusinessesTab({ founderId, founderLocation, founderIndustry }: {
  founderId: string
  founderLocation: Location
  founderIndustry: Industry
}) {
  const [businesses, setBusinesses] = useState<Business[]>(() => getBusinesses({ founderId }))
  const [searchParams] = useSearchParams()
  const [activeId, setActiveId] = useState<string | null>(() => {
    const requested = searchParams.get('businessId')
    if (requested && businesses.some(b => b.id === requested)) return requested
    return businesses[0]?.id ?? null
  })
  const [draft, setDraft] = useState<Business | null>(() => {
    const requested = searchParams.get('businessId')
    const first = (requested && businesses.find(b => b.id === requested)) || businesses[0]
    if (!first) return null
    return loadDraft<Business>(`culo_v1_business_draft_${first.id}`) ?? first
  })
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [appearsOnTick, setAppearsOnTick] = useState(0)

  async function handleRemoveTopicFeature(key: string) {
    if (!draft || !key.startsWith('topic:')) return
    const slug = key.slice('topic:'.length)
    const storyIds = getStories({ businessId: draft.id }).map(s => s.id)
    await removeTopicFromStories(storyIds, slug)
    setAppearsOnTick(t => t + 1)
  }

  // Autosave to localStorage as the founder types — if they navigate away or
  // the tab closes before hitting Save, their edits are still there next time.
  useEffect(() => {
    if (!draft) return
    const key = `culo_v1_business_draft_${draft.id}`
    const t = setTimeout(() => saveDraft(key, draft), 600)
    return () => clearTimeout(t)
  }, [draft])

  function selectBusiness(id: string) {
    setActiveId(id)
    const match = businesses.find(b => b.id === id) ?? null
    setDraft(match ? (loadDraft<Business>(`culo_v1_business_draft_${id}`) ?? match) : null)
    setSaved(false)
  }

  async function handleAddBusiness() {
    // Persisted immediately (not just held in local state) — this tab
    // unmounts whenever the founder switches to a different top-level tab
    // (Content, Partners, etc.), which was silently discarding any business
    // added but not yet saved. A blank business is harmless: it has no name
    // or slug yet, so getBusinesses({ publicOnly: true }) won't surface it
    // even though it's technically "published" by default.
    const now = new Date().toISOString()
    const newBiz: Business = {
      id: crypto.randomUUID(),
      slug: '',
      name: '',
      tagline: '',
      description: '',
      logo: '',
      coverImage: '',
      founderId,
      location: founderLocation,
      industry: founderIndustry,
      topics: [],
      offers: [],
      status: 'published',
      featured: false,
      createdAt: now,
    }
    const result = await updateBusiness(newBiz)
    if (result.success) {
      setBusinesses(getBusinesses({ founderId }))
      setActiveId(newBiz.id)
      setDraft(newBiz)
    }
  }

  async function handleDelete() {
    if (!draft) return
    // Never actually saved (still just a local "+ Add business" draft) —
    // nothing in the database to delete, just drop it locally.
    const persisted = getBusinesses({ founderId }).some(b => b.id === draft.id)
    if (!persisted) {
      clearDraft(`culo_v1_business_draft_${draft.id}`)
      const remaining = businesses.filter(b => b.id !== draft.id)
      setBusinesses(remaining)
      setActiveId(remaining[0]?.id ?? null)
      setDraft(remaining[0] ?? null)
      return
    }
    const result = await deleteBusiness(draft.id)
    if (result.success) {
      clearDraft(`culo_v1_business_draft_${draft.id}`)
      const refreshed = getBusinesses({ founderId })
      setBusinesses(refreshed)
      setActiveId(refreshed[0]?.id ?? null)
      setDraft(refreshed[0] ?? null)
    }
  }

  function set<K extends keyof Business>(key: K, value: Business[K]) {
    setDraft(prev => prev ? { ...prev, [key]: value } : prev)
    setSaved(false)
  }

  async function handleSave() {
    if (!draft) return
    setSaving(true)
    const withSlug = { ...draft, slug: draft.slug || slugify(draft.name) }
    const result = await updateBusiness(withSlug)
    setSaving(false)
    if (result.success) {
      setDraft(withSlug)
      setBusinesses(getBusinesses({ founderId }))
      setSaved(true)
      clearDraft(`culo_v1_business_draft_${withSlug.id}`)
      setTimeout(() => setSaved(false), 2500)
    }
  }

  function toggleTopic(topic: Topic) {
    if (!draft) return
    const has = draft.topics.some(t => t.id === topic.id)
    set('topics', has ? draft.topics.filter(t => t.id !== topic.id) : [...draft.topics, topic])
  }

  return (
    <div className="flex flex-col gap-5">
      <TabIntro>
        Every business you run — logo, description, where you work, what you're about.
      </TabIntro>

      <div className="flex flex-wrap gap-2">
        {businesses.map(b => {
          // Read the live draft's name — for the active tab, straight from
          // state; for any other tab, from its autosaved draft (same one
          // selectBusiness reloads) — the businesses array itself only
          // refreshes after Save, so switching tabs without saving used to
          // make an in-progress name flash back to "Untitled business".
          const liveName = activeId === b.id
            ? draft?.name
            : (loadDraft<Business>(`culo_v1_business_draft_${b.id}`) ?? b).name
          return (
            <button key={b.id} onClick={() => selectBusiness(b.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                activeId === b.id ? 'bg-[#C86A43] text-white border-[#C86A43]' : 'bg-white text-[#6B7280] border-[#E8E4DD] hover:border-[#C86A43]/50'
              }`}>
              {liveName || 'Untitled business'}
            </button>
          )
        })}
        <button onClick={() => void handleAddBusiness()}
          className="px-3 py-1.5 rounded-lg text-sm font-semibold text-[#C86A43] border border-dashed border-[#C86A43]/50 hover:bg-[#FDF6F3] transition-colors">
          + Add business
        </button>
      </div>

      {!draft ? (
        <div className="bg-white rounded-xl border border-[#E8E4DD] px-5 py-8 text-center">
          <p className="text-sm font-semibold text-[#2D2A26]">No businesses yet.</p>
          <p className="text-xs text-[#9CA3AF] mt-1">Add one above to get started.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#E8E4DD] px-5 py-5 flex flex-col gap-5">
          <Field label="Business Name">
            <input type="text" value={draft.name} onChange={e => set('name', e.target.value)} className={inputClass} />
          </Field>
          <Field label="Tagline">
            <input type="text" value={draft.tagline} onChange={e => set('tagline', e.target.value)} className={inputClass} placeholder="One line — what you do, in plain words" />
          </Field>
          <Field label="Description">
            <textarea value={draft.description} onChange={e => set('description', e.target.value)} rows={4} className={inputClass + ' resize-y'} />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Logo">
              <MediaUpload value={draft.logo} onChange={v => set('logo', v)} label="Upload logo" aspect="logo"
                uploadOptions={{ founderId, businessId: draft.id, usageType: 'business-logo' }} />
            </Field>
            <Field label="Cover Image">
              <MediaUpload value={draft.coverImage} onChange={v => set('coverImage', v)} label="Upload cover" aspect="wide"
                uploadOptions={{ founderId, businessId: draft.id, usageType: 'business-cover' }} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
            <div className="flex flex-wrap gap-2 mt-1">
              {allTopics.map(topic => {
                const active = draft.topics.some(t => t.id === topic.id)
                return (
                  <button key={topic.id} onClick={() => toggleTopic(topic)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                      active ? 'bg-[#C86A43] text-white border-[#C86A43]' : 'bg-white text-[#4B4845] border-[#E8E4DD] hover:border-[#C86A43]/50'
                    }`}>
                    {topic.name}
                  </button>
                )
              })}
            </div>
          </Field>

          <Field label="Target Audience" hint="Who this business is actually for, in your own words — e.g. 'busy mums in their 30s-40s' or 'trades businesses under 10 staff'.">
            <input type="text" value={draft.targetAudience ?? ''} onChange={e => set('targetAudience', e.target.value || undefined)} className={inputClass} placeholder="Who you serve…" />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Website">
              <input type="url" value={draft.website ?? ''} onChange={e => set('website', e.target.value || undefined)} className={inputClass} placeholder="https://…" />
            </Field>
            <Field label="Instagram">
              <input type="url" value={draft.instagram ?? ''} onChange={e => set('instagram', e.target.value || undefined)} className={inputClass} placeholder="https://…" />
            </Field>
          </div>

          <Field label="Additional links" hint="Add more accounts, including more than one of the same kind.">
            <SocialLinksEditor links={draft.socialLinks ?? []} onChange={v => set('socialLinks', v)} />
          </Field>

          <div className="flex items-center justify-between pt-2 border-t border-[#E8E4DD]">
            <div>
              <p className="text-sm font-medium text-[#2D2A26]">Visible on the public site</p>
              <p className="text-xs text-[#9CA3AF] mt-0.5">Takes effect when you hit Save.</p>
            </div>
            <button
              onClick={() => set('status', draft.status === 'published' || draft.status === 'featured' ? 'draft' : 'published')}
              className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                draft.status === 'published' || draft.status === 'featured' ? 'bg-[#C86A43]' : 'bg-[#E8E4DD]'
              }`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                draft.status === 'published' || draft.status === 'featured' ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#E8E4DD]">
            <div className="flex items-center gap-3">
              <button onClick={() => void handleSave()} disabled={saving}
                className="px-5 py-2.5 bg-[#C86A43] text-white text-sm font-semibold rounded-xl hover:bg-[#b05a35] disabled:opacity-60 transition-colors">
                {saving ? 'Saving…' : 'Save'}
              </button>
              {saved && <p className="text-sm text-[#5E6B4A] font-medium">Saved ✓</p>}
            </div>
            <ConfirmButton
              label="Delete"
              confirmLabel="Yes, delete"
              message={`Delete ${draft.name || 'this business'}? This can't be undone.`}
              onConfirm={() => void handleDelete()}
              className="text-xs text-[#9CA3AF] hover:text-red-500 transition-colors"
            />
          </div>
        </div>
      )}

      {/* Appears On — read-only, where this business is already surfaced. */}
      {draft && (() => {
        void appearsOnTick
        const appearsOn = getBusinessAppearsOn(draft.id)
        return appearsOn.length > 0 ? (
          <div className="bg-white rounded-xl border border-[#E8E4DD] px-5 py-5 flex flex-col gap-3">
            <div>
              <p className="text-sm font-semibold text-[#2D2A26]">Appears On</p>
              <p className="text-xs text-[#9CA3AF] mt-0.5">
                Every public page this business currently shows up on — its own page, the Businesses
                directory (the full list of every Village business), the owning founder's profile,
                any topic pages its stories are actually tagged with (only shown once that topic page
                is live), and the homepage if featured. These are different pages, not duplicates.
              </p>
            </div>
            <AppearsOnPanel locations={appearsOn} onToggle={key => void handleRemoveTopicFeature(key)} />
          </div>
        ) : null
      })()}

      {/* Discovery & Partnerships now live under the Partners tab, alongside
          the founder's own discovery settings, instead of being buried here. */}
      {draft && (
        <Link
          to="/dashboard/profile?tab=discovery"
          className="text-sm font-semibold text-[#C86A43] hover:underline"
        >
          Manage Discovery &amp; Partnerships for this business →
        </Link>
      )}

      {/* Content — same idea as Profile's Content tab, scoped to this
          business. No connector forms here: bring content in from Import,
          this is just where it shows up once it's tagged to this business. */}
      {draft && (() => {
        const businessStories = getStories({ businessId: draft.id })
        const businessImports = importedContentService.getAll({ businessId: draft.id })
        if (businessImports.length === 0 && businessStories.length === 0) return null
        return (
          <div className="bg-white rounded-xl border border-[#E8E4DD] px-5 py-5 flex flex-col gap-4">
            <div>
              <p className="text-sm font-semibold text-[#2D2A26]">Content</p>
              <p className="text-xs text-[#9CA3AF] mt-0.5">Imported and published content tagged to this business.</p>
            </div>
            <div className="flex flex-col gap-3">
                {businessImports.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide mb-1.5">Imported</p>
                    <div className="border border-[#E8E4DD] rounded-lg divide-y divide-[#F3EDE6]">
                      {businessImports.map(item => (
                        <Link key={item.id} to={`/dashboard/import-content?edit=${item.id}`}
                          className="flex items-center gap-3 px-3 py-2.5 hover:bg-[#FBF8F4] transition-colors">
                          {item.thumbnailUrl && <img src={item.thumbnailUrl} alt="" className="w-8 h-8 rounded object-cover shrink-0 bg-[#F3EDE6]" />}
                          <p className="text-xs font-medium text-[#2D2A26] truncate flex-1">{item.title}</p>
                          <span className="text-[10px] text-[#9CA3AF] shrink-0">{IMPORT_PLATFORM_LABELS[item.sourcePlatform]}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                {businessStories.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide mb-1.5">Published</p>
                    <div className="border border-[#E8E4DD] rounded-lg divide-y divide-[#F3EDE6]">
                      {businessStories.map(story => (
                        <Link key={story.id} to={`/dashboard/profile?tab=content&contentSubTab=published&storyId=${story.id}`}
                          className="flex items-center gap-3 px-3 py-2.5 hover:bg-[#FBF8F4] transition-colors">
                          <img src={story.coverImage} alt="" className="w-8 h-8 rounded object-cover shrink-0 bg-[#F3EDE6]" />
                          <p className="text-xs font-medium text-[#2D2A26] truncate flex-1">{story.title}</p>
                          <span className="text-[10px] text-[#9CA3AF] shrink-0">{story.status}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </div>
        )
      })()}

      {/* Bottom Save — the page got long enough (Services, Appears On,
          Discovery & Partnerships) that Save being only at the top meant
          scrolling all the way back up after editing anything further down. */}
      {draft && (
        <div className="flex items-center gap-3 pt-2">
          <button onClick={() => void handleSave()} disabled={saving}
            className="px-5 py-2.5 bg-[#C86A43] text-white text-sm font-semibold rounded-xl hover:bg-[#b05a35] disabled:opacity-60 transition-colors">
            {saving ? 'Saving…' : 'Save'}
          </button>
          {saved && <p className="text-sm text-[#5E6B4A] font-medium">Saved ✓</p>}
        </div>
      )}
    </div>
  )
}

// ─── Social links (multi-entry) ────────────────────────────────────────────────

const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  linkedin: 'LinkedIn', instagram: 'Instagram', facebook: 'Facebook',
  'facebook-page': 'Facebook Page', youtube: 'YouTube', tiktok: 'TikTok',
  x: 'X', threads: 'Threads', podcast: 'Podcast', newsletter: 'Newsletter', custom: 'Custom Link',
}
const PLATFORM_ORDER: SocialPlatform[] = ['linkedin', 'instagram', 'facebook', 'facebook-page', 'youtube', 'tiktok', 'x', 'threads', 'podcast', 'newsletter', 'custom']

function SocialLinksEditor({ links, onChange }: { links: SocialLink[]; onChange: (links: SocialLink[]) => void }) {
  function add() {
    onChange([...links, { id: `link-${Date.now()}`, platform: 'instagram', url: '' }])
  }
  function update(i: number, patch: Partial<SocialLink>) {
    onChange(links.map((l, idx) => idx === i ? { ...l, ...patch } : l))
  }
  function remove(i: number) {
    onChange(links.filter((_, idx) => idx !== i))
  }
  return (
    <div className="flex flex-col gap-2">
      {links.map((link, i) => (
        <div key={link.id} className="flex items-center gap-2">
          <select
            value={link.platform}
            onChange={e => update(i, { platform: e.target.value as SocialPlatform })}
            className="border border-[#E8E4DD] rounded-lg px-2 py-2 text-xs bg-white shrink-0"
          >
            {PLATFORM_ORDER.map(p => <option key={p} value={p}>{PLATFORM_LABELS[p]}</option>)}
          </select>
          {link.platform === 'custom' && (
            <input type="text" value={link.label ?? ''} onChange={e => update(i, { label: e.target.value })}
              placeholder="Label" className={inputClass + ' max-w-[120px]'} />
          )}
          <input type="url" value={link.url} onChange={e => update(i, { url: e.target.value })}
            placeholder="https://…" className={inputClass} />
          <button onClick={() => remove(i)} className="text-xs text-[#9CA3AF] hover:text-red-500 shrink-0 px-1">✕</button>
        </div>
      ))}
      <button onClick={add} className="text-xs font-semibold text-[#C86A43] hover:underline text-left mt-1">
        + Add a link
      </button>
    </div>
  )
}

// FAQEditor is now the shared components/dashboard/FAQEditor.tsx — used here
// and under each Service in the Business workspace.

// ─── DashboardProfilePage ──────────────────────────────────────────────────────

export function DashboardProfilePage() {
  const { user } = useAuth()
  const canUseVoiceRewrite = VOICE_REWRITE_EMAILS.includes(user?.email?.trim().toLowerCase() ?? '')
  const navigate = useNavigate()
  const location = useLocation()
  const welcomeBack = Boolean((location.state as { welcomeBack?: boolean } | null)?.welcomeBack)
  const currentFounder = getCurrentFounder(user)
  const [draft, setDraft]   = useState<Founder | null>(() => {
    if (!currentFounder) return null
    const saved = loadDraft<Founder>(`culo_v1_profile_draft_${currentFounder.id}`)
    return saved ?? { ...currentFounder }
  })
  const [saved, setSaved]   = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const [tab, setTabState]  = useState(() => searchParams.get('tab') ?? 'overview')
  // Keeps the URL's ?tab= in sync with whichever tab is actually showing —
  // the sidebar's "Content" vs "Profile" links tell which one is active by
  // reading this param, so without this they'd both go stale (or both read
  // as active) the moment a founder clicks a tab inside the page itself
  // rather than arriving via a link that already set it.
  function setTab(next: string) {
    setTabState(next)
    setSearchParams(prev => {
      const p = new URLSearchParams(prev)
      if (next === 'overview') p.delete('tab')
      else p.set('tab', next)
      return p
    }, { replace: true })
  }
  const [faqSuggestions, setFaqSuggestions] = useState<BlogQaPair[] | null>(null)
  const [contentSubTab, setContentSubTab] = useState<'imported' | 'published'>(() =>
    searchParams.get('contentSubTab') === 'published' || searchParams.get('storyId') ? 'published' : 'imported'
  )
  const [editingStoryId, setEditingStoryId] = useState<string | null>(() => searchParams.get('storyId'))
  const [editingImportedId, setEditingImportedId] = useState<string | null>(null)
  const [importedEditDraft, setImportedEditDraft] = useState<ImportedContent | null>(null)
  const [importedSaveError, setImportedSaveError] = useState<string | null>(null)
  const [importedPlatformFilter, setImportedPlatformFilter] = useState<ImportedContentPlatform | 'all'>(
    () => (searchParams.get('platform') as ImportedContentPlatform | null) ?? 'all'
  )
  // Series is its own filter mode within Imported (not just the platform
  // filter's 'all') — series groupings apply to unpublished drafts too, see
  // ImportedContent.seriesId, so browsing by series shouldn't require
  // leaving the Imported list or publishing anything first.
  const [importedFilterMode, setImportedFilterMode] = useState<'platform' | 'series'>('platform')
  const [importedSeriesFilter, setImportedSeriesFilter] = useState<string | 'unassigned' | null>(null)
  // Creating a series used to only be possible from Published > Series —
  // a founder browsing their raw imports by platform had no way to start
  // one without leaving this list first. This lets them create it right
  // here, then move selected drafts into it with the existing dropdown.
  const [addingImportedSeries, setAddingImportedSeries] = useState(false)
  const [newImportedSeriesTitle, setNewImportedSeriesTitle] = useState('')
  // Instagram brings in both feed Posts (which almost always have a real
  // caption) and Stories (which structurally never do) as one undifferentiated
  // pile — this sub-filter, shown only while the Instagram platform pill is
  // active, splits them so a founder isn't hunting through no-caption Stories
  // to find the Posts that are actually one click from being publishable.
  const [instagramCaptionFilter, setInstagramCaptionFilter] = useState<'all' | 'has' | 'none'>('all')
  const [autoPublishingCaptioned, setAutoPublishingCaptioned] = useState(false)
  const [importedChecked, setImportedChecked] = useState<Set<string>>(new Set())
  const [importedBulkPublishing, setImportedBulkPublishing] = useState(false)
  const [importedRegenProgress, setImportedRegenProgress] = useState<{ done: number; total: number } | null>(null)
  const [importedTick, setImportedTick] = useState(0)
  const [discoveryBizId, setDiscoveryBizId] = useState<string | null>(null)
  const [publishedSort, setPublishedSort] = useState<'newest' | 'oldest'>('newest')
  const [publishedView, setPublishedView] = useState<'stories' | 'series'>('stories')
  const [activeSeriesId, setActiveSeriesId] = useState<string | null>(null)
  const [addingSeries, setAddingSeries] = useState(false)
  const [newSeriesTitle, setNewSeriesTitle] = useState('')
  const [, forceBusinessRefresh] = useState(0)

  // A recommendation link can point back at this same page with new query
  // params (e.g. "?tab=content&storyId=X") — since it's the same route,
  // React Router doesn't remount us, so the `useState(() => searchParams...)`
  // initializers above only ever fire once. Without this, clicking such a
  // link while already on Profile silently does nothing.
  useEffect(() => {
    // Always sync exactly to the URL, including the "no ?tab= at all" case
    // (the bare Profile link) — only reacting when a value is present meant
    // clicking Profile from Content (or any other tab) left the page still
    // showing whatever tab was active before, since the param was simply
    // absent rather than set to 'overview'.
    setTabState(searchParams.get('tab') ?? 'overview')
    const storyId = searchParams.get('storyId')
    const editImportedId = searchParams.get('editImportedId')
    if (storyId) {
      setContentSubTab('published')
      setEditingStoryId(storyId)
    } else if (editImportedId) {
      setContentSubTab('imported')
      const item = importedContentService.get(editImportedId)
      if (item) {
        setImportedEditDraft(item)
        setEditingImportedId(editImportedId)
      }
    } else if (searchParams.get('contentSubTab') === 'published') {
      setContentSubTab('published')
    } else if (searchParams.get('contentSubTab') === 'imported') {
      setContentSubTab('imported')
    }
    const platform = searchParams.get('platform')
    if (platform) setImportedPlatformFilter(platform as ImportedContentPlatform)
  }, [searchParams])

  // Autosave to localStorage as the founder types — if they navigate away or
  // the tab closes before hitting Save, their edits are still there next time.
  useEffect(() => {
    if (!draft) return
    const key = `culo_v1_profile_draft_${draft.id}`
    const t = setTimeout(() => saveDraft(key, draft), 600)
    return () => clearTimeout(t)
  }, [draft])

  if (!draft) {
    return (
      <div className="p-8">
        <EmptyState
          title="No founder profile yet"
          message="Create your founder profile to start publishing to the Village."
          action={{ label: 'Start onboarding', href: '/onboarding' }}
        />
      </div>
    )
  }

  const missing     = getFounderMissingItems(draft)
  const counts      = getMissingCounts(missing)
  const appearsOn  = getFounderAppearsOn(draft.id)

  // Relationships — everything this founder is connected to across the Village.
  const founderBusinesses = getBusinesses().filter(b => b.founderId === draft.id)
  const founderStories    = getStories({ founderId: draft.id })

  async function handleRemoveFounderTopicFeature(key: string) {
    if (!key.startsWith('topic:')) return
    const slug = key.slice('topic:'.length)
    await removeTopicFromStories(founderStories.map(s => s.id), slug)
    setImportedTick(t => t + 1)
  }
  // Only ideas still backed by a live, published story — an idea whose
  // source story was deleted or unpublished shouldn't keep showing here.
  const publishedStoryIds = new Set(getStories({ founderId: draft.id, publicOnly: true }).map(s => s.id))
  const founderIdeas      = getIdeas({ founderId: draft.id })
    .filter(i => i.relatedStoryIds.some(sid => publishedStoryIds.has(sid)))
  const founderLibrary    = getLibraryItems({ founderId: draft.id })
  const founderMedia      = getMedia({ founderId: draft.id })

  const TABS = [
    { key: 'overview',      label: 'Profile'       },
    { key: 'businesses',    label: 'Businesses'    },
    { key: 'expertise',     label: 'FAQ'           },
    { key: 'discovery',     label: 'Partners' },
    { key: 'settings',      label: 'Settings'      },
  ]

  function set<K extends keyof Founder>(key: K, value: Founder[K]) {
    setDraft(prev => prev ? { ...prev, [key]: value } : prev)
    setSaved(false)
  }

  // Shared with the Profile tab (rendered right under Explore Your Life's Work) so editing
  // your name/photo/links doesn't require a separate tab — same draft/set, one
  // source of truth, just shown in two places.
  function renderIdentityFields(draft: Founder) {
    return (
      <>
        <Field label="Display Name" hint="Your name as it appears everywhere on the Village — headings, cards, breadcrumbs. Keep it short and real (e.g. your actual name), not a full descriptor.">
          <input type="text" value={draft.name} onChange={e => set('name', e.target.value)} className={inputClass} />
        </Field>
        <Field label="SEO Title" hint="Optional — extra keywords added alongside your Display Name in Google search results and browser tabs (shown as 'SEO Title — Display Name'). Leave blank to just show your Display Name. Keeps your Display Name short everywhere else on the Village, without repeating a long phrase on every page.">
          <input type="text" value={draft.seoTitle ?? ''} onChange={e => set('seoTitle', e.target.value || undefined)} className={inputClass} placeholder="e.g. Australian Tech Founder & Content Creator" />
        </Field>
        <Field label="Bio" hint="Write in your own voice — aim for 200+ characters. This is what search engines and the Village show publicly — no separate SEO text to fill in.">
          <textarea id="bio" value={draft.bio} onChange={e => set('bio', e.target.value)} rows={6} className={inputClass + ' resize-y'} />
          <p className="text-xs text-right text-[#9CA3AF] mt-1">{draft.bio.length} chars</p>
        </Field>

        <div>
          <p className="text-sm font-medium text-[#2D2A26] mb-1.5">Search Preview</p>
          <div className="border border-[#E8E4DD] rounded-xl px-4 py-3 bg-white">
            <p className="text-xs text-[#5E6B4A] truncate">culovillage.com/founders/{draft.slug}</p>
            <p className="text-[#1a0dab] text-base leading-snug mt-0.5 truncate">
              {draft.seoTitle && draft.seoTitle !== draft.name ? `${draft.seoTitle} — ${draft.name}` : draft.name}
            </p>
            <p className="text-xs text-[#4d5156] mt-0.5 line-clamp-2">{draft.seoDescription || draft.bio}</p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-[#E8E4DD] pt-5">
          <div>
            <p className="text-sm font-semibold text-[#2D2A26]">Public</p>
            <p className="text-xs text-[#9CA3AF] mt-0.5">
              {isPublic ? 'Your profile is public — indexed by search and visible across the Village.' : 'Your profile is hidden from search and the Village directories.'}
            </p>
          </div>
          <button
            onClick={() => set('status', isPublic ? 'draft' : 'published')}
            className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${isPublic ? 'bg-[#C86A43]' : 'bg-[#E8E4DD]'}`}
            aria-label="Toggle public visibility"
          >
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${isPublic ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Profile Photo" hint="Square, min 400×400px.">
            <MediaUpload
              value={draft.avatar}
              onChange={v => set('avatar', v)}
              label="Upload photo"
              aspect="wide"
              uploadOptions={{ founderId: draft.id, usageType: 'profile-photo' }}
            />
            {draft.avatar.includes('/placeholders/') && (
              <p className="text-xs text-red-600 mt-1.5">Using a placeholder. Upload a real photo.</p>
            )}
          </Field>
          <Field label="Cover Image" hint="16:9 recommended.">
            <MediaUpload
              value={draft.coverImage}
              onChange={v => set('coverImage', v || undefined)}
              label="Upload cover"
              aspect="wide-contain"
              uploadOptions={{ founderId: draft.id, usageType: 'founder-cover' }}
            />
          </Field>
        </div>

        <div className="border-t border-[#E8E4DD] pt-5">
          <p className="text-sm font-semibold text-[#2D2A26] mb-1">Links</p>
          <p className="text-xs text-[#9CA3AF] mb-3">Where people can follow you. A business website belongs on the Business profile, not here.</p>
          <div className="flex flex-col gap-3 mb-4">
            <Field label="Website">
              <input id="website" type="url" value={draft.website ?? ''} onChange={e => set('website', e.target.value || undefined)} className={inputClass} placeholder="https://yourwebsite.com" />
            </Field>
            <Field label="Instagram">
              <input id="socials" type="url" value={draft.instagram ?? ''} onChange={e => set('instagram', e.target.value || undefined)} className={inputClass} placeholder="https://instagram.com/handle" />
            </Field>
            <Field label="LinkedIn">
              <input type="url" value={draft.linkedin ?? ''} onChange={e => set('linkedin', e.target.value || undefined)} className={inputClass} placeholder="https://linkedin.com/in/handle" />
            </Field>
          </div>
          <Field label="Additional links" hint="Add more accounts, including more than one of the same kind.">
            <SocialLinksEditor links={draft.socialLinks ?? []} onChange={v => set('socialLinks', v)} />
          </Field>
        </div>
      </>
    )
  }


  async function handleDelete() {
    if (!draft) return
    const result = await deleteFounder(draft.id)
    if (result.success) navigate('/dashboard/home')
    else setSaveError(result.error ?? 'Could not delete this profile.')
  }

  async function handleSave() {
    if (!draft) return
    setSaving(true)
    setSaveError(null)
    // `draft` is a full clone of Founder, seeded once at mount (or from a
    // stale localStorage autosave) — it never re-syncs if the record
    // changes elsewhere in the meantime. Voice & Brand Brief / Insight
    // Brain are edited exclusively on the Import page, so a save here on a
    // stale draft used to silently wipe whatever was saved there since —
    // pulling the live values for the fields this page never edits itself
    // closes that gap regardless of how old the rest of draft is.
    const live = getFounder(draft.id)
    const toSave: Founder = live
      ? {
          ...draft,
          voiceBrief: live.voiceBrief,
          voiceBriefUpdatedAt: live.voiceBriefUpdatedAt,
          insightBrief: live.insightBrief,
          insightBriefUpdatedAt: live.insightBriefUpdatedAt,
        }
      : draft
    const result = await updateFounder(toSave)
    setSaving(false)
    if (result.success) {
      setSaved(true)
      clearDraft(`culo_v1_profile_draft_${draft.id}`)
    } else {
      setSaveError(result.error ?? 'Save failed. Please try again.')
    }
  }

  const isPublic = draft.status === 'published' || draft.status === 'featured'

  return (
    <div className="flex flex-col h-full" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {welcomeBack && (
        <div className="mx-8 mt-6 px-4 py-3 bg-[#5E6B4A]/10 border border-[#5E6B4A]/20 text-[#5E6B4A] text-sm rounded-lg">
          Welcome back — this is your existing Village profile. Everything below is already yours to edit.
        </div>
      )}

      {/* Page header — hidden on Content, which is a focused view of just
          your imported/published items, not the rest of the profile. */}
      {tab !== 'content' && (
        <div className="flex items-center justify-between px-8 pt-8 pb-5 shrink-0">
          <div className="flex items-center gap-4">
            <img src={draft.avatar} alt="" className="w-10 h-10 rounded-full object-cover bg-[#F3EDE6]" />
            <div>
              <h1 className="text-xl font-bold text-[#2D2A26]">{draft.name}</h1>
              <div className="flex items-center gap-3 mt-0.5">
                <HealthBadge missing={missing} />
                {counts.total > 0 && (
                  <span className="text-xs text-[#9CA3AF]">
                    {counts.total} {counts.total === 1 ? 'recommendation' : 'recommendations'} to grow your profile
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
            {/* Content, Businesses and Partners each save themselves inline —
                this button only ever touches founder-profile fields (Profile,
                FAQ, Settings), so it only shows there. Showing it everywhere
                made it look like it should save whatever tab you were on. */}
            {(tab === 'overview' || tab === 'expertise' || tab === 'settings') && (
              <>
                {saved && <p className="text-sm text-green-600 font-medium">Saved ✓</p>}
                {saveError && <p className="text-sm text-red-600 font-medium">{saveError}</p>}
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-[#C86A43] text-white text-sm font-semibold rounded-lg hover:bg-[#b05a35] disabled:opacity-60 transition-colors"
                >
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Dev notice */}
      {!isSupabaseConfigured && (
        <div className="mx-8 mb-4 px-4 py-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-700 shrink-0">
          Dev mode — changes are saved to browser localStorage and survive page refresh. Connect Supabase to sync to the cloud.
        </div>
      )}

      {/* Tabs — Content is reached from its own sidebar link now and shows
          only the content section, not the rest of the profile's tabs. */}
      {tab !== 'content' && (
        <Tabs tabs={TABS} active={tab} onChange={setTab} className="px-8" />
      )}

      {/* Tab content */}
      <div className={`flex-1 overflow-y-auto px-8 py-6 ${tab === 'content' ? 'pt-8' : ''}`}>

        {/* ── Overview (Profile) ───────────────────────────────────────── */}
        {tab === 'overview' && (
          <div className="flex flex-col gap-6">

            <a
              href={`/founders/${draft.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-white rounded-xl border border-[#E8E4DD] overflow-hidden hover:border-[#C86A43]/40 transition-colors"
            >
              <div className="px-5 py-4 border-b border-[#F3EDE6] flex items-center justify-between">
                <p className="text-sm font-semibold text-[#2D2A26]">Explore Your Life's Work</p>
                <span className="text-xs text-[#C86A43] font-medium">View public profile ↗</span>
              </div>
              <div className="px-5 py-4 flex gap-4">
                <img src={draft.avatar} alt="" className="w-16 h-16 rounded-full object-cover bg-[#F3EDE6] shrink-0" />
                <div>
                  <p className="font-semibold text-[#2D2A26]">{draft.name}</p>
                  <p className="text-sm text-[#6B7280] mt-1">{draft.location.name} · {draft.industry.name}</p>
                  <p className="text-sm text-[#6B7280] mt-2 line-clamp-2">{draft.bio}</p>
                </div>
              </div>
            </a>

            <div className="bg-white rounded-xl border border-[#E8E4DD] px-5 py-5 flex flex-col gap-5">
              <p className="text-sm font-semibold text-[#2D2A26]">Identity</p>
              {renderIdentityFields(draft)}
            </div>

            {/* Featured Video — pick a published story with a video to spotlight at the bottom of the public profile */}
            <div className="bg-white rounded-xl border border-[#E8E4DD] px-5 py-5 flex flex-col gap-3">
              <div>
                <p className="text-sm font-semibold text-[#2D2A26]">Featured Video</p>
                <p className="text-xs text-[#9CA3AF] mt-0.5">Pick your best story with a video — it'll feature at the bottom of your public profile.</p>
              </div>
              {(() => {
                const eligible = founderStories.filter(s => (s.status === 'published' || s.status === 'featured') && s.reelUrl)
                if (eligible.length === 0) {
                  return <p className="text-xs text-[#9CA3AF]">Publish a story with a video attached to feature it here.</p>
                }
                const selectedIds = draft.featuredVideoStoryIds ?? []
                const selectedCount = eligible.filter(s => selectedIds.includes(s.id)).length
                return (
                  <details className="group rounded-lg border border-[#E8E4DD]">
                    <summary className="flex items-center justify-between gap-2.5 px-3 py-2.5 cursor-pointer list-none text-sm text-[#2D2A26]">
                      <span>{selectedCount === 0 ? 'Choose a video…' : `${selectedCount} video${selectedCount === 1 ? '' : 's'} selected`}</span>
                      <svg className="w-4 h-4 text-[#9CA3AF] transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>
                    <div className="flex flex-col gap-1 px-2 pb-2 pt-1 border-t border-[#E8E4DD]">
                      {eligible.map(story => {
                        const checked = selectedIds.includes(story.id)
                        return (
                          <label key={story.id} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-[#F8F5F0] transition-colors">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => set('featuredVideoStoryIds', checked
                                ? selectedIds.filter(id => id !== story.id)
                                : [...selectedIds, story.id])}
                            />
                            <span className="text-sm text-[#2D2A26] truncate">{story.title}</span>
                          </label>
                        )
                      })}
                    </div>
                  </details>
                )
              })()}
            </div>


            <div className="grid grid-cols-5 gap-3">
              <Link to="/dashboard/profile?tab=businesses" className="bg-white rounded-xl border border-[#E8E4DD] px-4 py-4 text-center hover:border-[#C86A43]/40 transition-colors">
                <p className="text-2xl font-bold text-[#2D2A26]">{founderBusinesses.length}</p>
                <p className="text-xs text-[#9CA3AF] mt-0.5">Businesses</p>
              </Link>
              <Link to="/dashboard/profile?tab=content&contentSubTab=published" className="bg-white rounded-xl border border-[#E8E4DD] px-4 py-4 text-center hover:border-[#C86A43]/40 transition-colors">
                <p className="text-2xl font-bold text-[#2D2A26]">{founderStories.length}</p>
                <p className="text-xs text-[#9CA3AF] mt-0.5">Stories</p>
              </Link>
              <Link to="/dashboard/ideas" className="bg-white rounded-xl border border-[#E8E4DD] px-4 py-4 text-center hover:border-[#C86A43]/40 transition-colors">
                <p className="text-2xl font-bold text-[#2D2A26]">{founderIdeas.length}</p>
                <p className="text-xs text-[#9CA3AF] mt-0.5">Ideas</p>
              </Link>
              <Link to="/dashboard/library" className="bg-white rounded-xl border border-[#E8E4DD] px-4 py-4 text-center hover:border-[#C86A43]/40 transition-colors">
                <p className="text-2xl font-bold text-[#2D2A26]">{founderLibrary.length}</p>
                <p className="text-xs text-[#9CA3AF] mt-0.5">Library</p>
              </Link>
              <Link to="/dashboard/media" className="bg-white rounded-xl border border-[#E8E4DD] px-4 py-4 text-center hover:border-[#C86A43]/40 transition-colors">
                <p className="text-2xl font-bold text-[#2D2A26]">{founderMedia.length}</p>
                <p className="text-xs text-[#9CA3AF] mt-0.5">Media</p>
              </Link>
            </div>

            <div>
              <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest mb-3">Profile Progress</p>
              <MissingAssetsPanel
                items={missing}
                onAction={(item: MissingItem) => { setTab(FIELD_TO_TAB[item.field] ?? 'overview'); focusField(item.field) }}
              />
            </div>

          </div>
        )}

        {/* ── My Life's Work ───────────────────────────────────────────── */}
        {tab === 'content' && (() => {
          void importedTick
          const allImportedForStats = importedContentService.getAll({ founderId: draft.id })
          const statsPlatforms = Array.from(new Set(allImportedForStats.map(i => i.sourcePlatform)))
          // Reads the live, persisted founder record rather than `draft` —
          // `draft` seeds from a local, unsaved profile-edit autosave
          // (culo_v1_profile_draft_*) that can predate or simply never
          // include a brief saved from Import Content, which silently
          // disabled Rewrite with no visible reason beyond a hover tooltip.
          const liveVoiceBrief = getFounder(draft.id)?.voiceBrief
          const liveInsightBrief = getFounder(draft.id)?.insightBrief
          return (
          <div className="flex flex-col gap-5">
            <Link
              to="/creatives"
              className="block bg-[#2D2A26] rounded-2xl px-8 py-8 hover:bg-[#1a1815] transition-colors"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                <div>
                  <p className="font-heading text-2xl font-semibold text-white leading-snug">
                    CULO Creatives helps founders turn their messy thoughts and raw footage into different formats of content, exclusively in Canva.
                  </p>
                </div>
                <span className="flex-shrink-0 inline-flex items-center gap-2 px-6 py-3 bg-[#C86A43] text-white text-base font-semibold rounded-xl">
                  Create with CULO in Canva
                </span>
              </div>
            </Link>
            {/* Real counts only — no invented "storage used" or "last scan"
                stats, just what's actually in this founder's own content. */}
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => { setContentSubTab('imported'); setImportedPlatformFilter('all') }}
                className={`flex-1 min-w-[9rem] flex items-center justify-between gap-3 px-6 py-5 rounded-2xl border bg-white transition-colors ${
                  contentSubTab === 'imported' && importedPlatformFilter === 'all' ? 'border-[#C86A43] ring-1 ring-[#C86A43]/30' : 'border-[#E8E4DD] hover:border-[#C86A43]/40'
                }`}
              >
                <div className="text-left">
                  <p className="text-sm text-[#9CA3AF]">All content</p>
                  <p className="text-3xl font-bold text-[#2D2A26] mt-0.5">{allImportedForStats.length}</p>
                </div>
                <SourceIcon platform="all" size="lg" />
              </button>
              {statsPlatforms.map(p => (
                <button
                  key={p}
                  onClick={() => { setContentSubTab('imported'); setImportedPlatformFilter(p) }}
                  className={`flex-1 min-w-[9rem] flex items-center justify-between gap-3 px-6 py-5 rounded-2xl border bg-white transition-colors ${
                    contentSubTab === 'imported' && importedPlatformFilter === p ? 'border-[#C86A43] ring-1 ring-[#C86A43]/30' : 'border-[#E8E4DD] hover:border-[#C86A43]/40'
                  }`}
                >
                  <div className="text-left">
                    <p className="text-sm text-[#9CA3AF]">{IMPORT_PLATFORM_LABELS[p]}</p>
                    <p className="text-3xl font-bold text-[#2D2A26] mt-0.5">{allImportedForStats.filter(i => i.sourcePlatform === p).length}</p>
                  </div>
                  <SourceIcon platform={p} size="lg" />
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              {(['imported', 'published'] as const).map(t => (
                <button key={t} onClick={() => setContentSubTab(t)}
                  className={`px-4 py-2 rounded-lg text-base font-semibold border transition-colors ${
                    contentSubTab === t ? 'bg-[#C86A43] text-white border-[#C86A43]' : 'bg-white text-[#6B7280] border-[#E8E4DD] hover:border-[#C86A43]/50'
                  }`}>
                  {t === 'imported' ? 'Imported content' : 'Published Content'}
                </button>
              ))}
            </div>

            {contentSubTab === 'imported' && (() => {
              void importedTick
              const allImported = importedContentService.getAll({ founderId: draft.id })
              const platforms = Array.from(new Set(allImported.map(i => i.sourcePlatform)))
              const shownByPlatform = importedFilterMode === 'series'
                ? (importedSeriesFilter === null
                    ? allImported
                    : importedSeriesFilter === 'unassigned'
                      ? allImported.filter(i => !i.seriesId)
                      : allImported.filter(i => i.seriesId === importedSeriesFilter))
                : importedPlatformFilter === 'all'
                  ? allImported
                  // Once something's been moved into a series, it drops out of
                  // its platform tab — the tab is "what's still unsorted from
                  // this platform," not a permanent record of where it came
                  // from. "All" is the only view that always shows everything.
                  : allImported.filter(i => i.sourcePlatform === importedPlatformFilter && !i.seriesId)
              // Only meaningful (and only shown) while filtering to Instagram
              // specifically — Posts vs Stories is an Instagram-shaped
              // distinction, not a general one.
              const isInstagramView = importedFilterMode === 'platform' && importedPlatformFilter === 'instagram'
              const shown = isInstagramView && instagramCaptionFilter !== 'all'
                ? shownByPlatform.filter(i => instagramCaptionFilter === 'has' ? hasRealCaption(i) : !hasRealCaption(i))
                : shownByPlatform
              const instagramHasCaptionCount = isInstagramView ? shownByPlatform.filter(hasRealCaption).length : 0
              const instagramNoCaptionCount  = isInstagramView ? shownByPlatform.filter(i => !hasRealCaption(i)).length : 0
              // Flagged items (title/caption mismatch etc.) are excluded from
              // every "select all" pool below — still individually
              // selectable via their own row checkbox, just never swept into
              // a bulk rewrite/publish without a human actually looking.
              const readyItems = shown.filter(i => !i.relatedStoryId && !i.flaggedForReview && isReadyToPublish(i))
              // Superset of readyItems — includes drafts that still just carry
              // their original caption/title and haven't been touched yet.
              // "Select all ready to publish" only grabs items already fit to
              // publish; rewriting with the Voice Brief is exactly for the
              // ones that aren't yet, so it needs its own, wider selection.
              const unpublishedItems = shown.filter(i => !i.relatedStoryId && !i.flaggedForReview)
              const founderSeries = getSeriesList({ founderId: draft.id })

              function refreshImported() { setImportedTick(t => t + 1) }

              function toggleImportedChecked(id: string) {
                setImportedChecked(prev => {
                  const next = new Set(prev)
                  if (next.has(id)) next.delete(id); else next.add(id)
                  return next
                })
              }

              function toggleSelectAllReady() {
                setImportedChecked(prev => prev.size === readyItems.length ? new Set() : new Set(readyItems.map(i => i.id)))
              }

              function toggleSelectAllUnpublished() {
                setImportedChecked(prev => prev.size === unpublishedItems.length ? new Set() : new Set(unpublishedItems.map(i => i.id)))
              }

              async function handleImportedStatusChange(id: string, status: ImportedContentStatus) {
                const item = importedContentService.get(id)
                if (status === 'published' || status === 'featured') {
                  if (item && draft && !item.relatedStoryId && isReadyToPublish(item)) {
                    const story = buildStoryFromImport(item, draft)
                    story.status = status
                    const result = await publishStoryCore(story)
                    if (!result.success) {
                      setSaveError(result.error ?? 'Could not publish. Please try again.')
                    } else {
                      // Only now is there a real, live Story behind this
                      // status — flipping the badge before this succeeded
                      // used to leave the import saying "Published" with no
                      // story to show for it (View button had nowhere real
                      // to point).
                      await importedContentService.updateStatus(id, status)
                    }
                  } else if (item && item.relatedStoryId) {
                    // Already published once before — flipping back to
                    // Published/Featured here should re-show the existing
                    // story, not silently do nothing.
                    const existing = getStory(item.relatedStoryId)
                    if (existing) await updateStory({ ...existing, status })
                    await importedContentService.updateStatus(id, status)
                  } else if (item && !isReadyToPublish(item)) {
                    setSaveError('Give this a real title before publishing it.')
                  }
                } else {
                  await importedContentService.updateStatus(id, status)
                }
                if (item?.relatedStoryId && status !== 'published' && status !== 'featured') {
                  // Switched back to Draft/Archived after having been
                  // published — the live story must stop being publicly
                  // visible too, not just this import record.
                  const existing = getStory(item.relatedStoryId)
                  if (existing) await updateStory({ ...existing, status })
                }
                refreshImported()
              }

              async function handleImportedBulkPublish() {
                if (!draft) return
                setImportedBulkPublishing(true)
                const targets = readyItems.filter(i => importedChecked.has(i.id))
                for (const item of targets) {
                  const story = buildStoryFromImport(item, draft)
                  const result = await publishStoryCore(story)
                  // Same rule as the single-item publish path: only mark the
                  // import Published once a real Story actually exists behind
                  // it — otherwise the row keeps saying Draft here forever
                  // even though a story went live, because nothing else ever
                  // wrote the status back onto the import record.
                  if (result.success) await importedContentService.updateStatus(item.id, 'published')
                  else setSaveError(result.error ?? `Could not publish "${item.title}". Please try again.`)
                }
                setImportedChecked(new Set())
                setImportedBulkPublishing(false)
                refreshImported()
              }

              // One click, not select-then-publish: publishes every currently
              // shown item that already has both a real title and a real
              // caption straight from its source, with nothing rewritten.
              // Deliberately stricter than "Select all ready to publish"
              // (title only) — this is the "just get the ones that don't
              // need me to look at them" button.
              const autoPublishCandidates = shown.filter(i => !i.relatedStoryId && !i.flaggedForReview && isReadyToPublish(i) && hasRealCaption(i))
              async function handleAutoPublishCaptioned() {
                if (!draft || autoPublishCandidates.length === 0) return
                if (!window.confirm(`Publish ${autoPublishCandidates.length} item${autoPublishCandidates.length === 1 ? '' : 's'} that already ${autoPublishCandidates.length === 1 ? 'has' : 'have'} a real caption? Nothing will be rewritten first.`)) return
                setAutoPublishingCaptioned(true)
                for (const item of autoPublishCandidates) {
                  const story = buildStoryFromImport(item, draft)
                  const result = await publishStoryCore(story)
                  if (result.success) await importedContentService.updateStatus(item.id, 'published')
                  else setSaveError(result.error ?? `Could not publish "${item.title}". Please try again.`)
                }
                setAutoPublishingCaptioned(false)
                refreshImported()
              }

              // Rewrites already-imported drafts with the founder's Voice &
              // Brand Brief, the same real-per-item AI call the Instagram
              // archive importer uses — for content that was imported before
              // a brief existed, or that just kept its original caption.
              // Sequential (each is a real AI call) with visible progress,
              // same pattern as the Instagram importer; one failure doesn't
              // stop the rest, it just leaves that item as it was.
              async function handleRegenerateSelected() {
                if (!canUseVoiceRewrite || !draft || !liveVoiceBrief?.trim()) return
                const ids = Array.from(importedChecked)
                if (ids.length === 0) return
                setImportedRegenProgress({ done: 0, total: ids.length })
                let held = 0
                // Same rolling-memory fix as the Instagram archive importer —
                // without this, every item in the batch is rewritten with no
                // awareness of what any other item in the same batch just
                // became, which is exactly what made bulk rewrites read as
                // repetitive.
                const recentAngles: { title?: string; articleShape?: string; generationType?: string; insightSource?: string; primaryQuestion?: string }[] = []
                for (let i = 0; i < ids.length; i++) {
                  // Same reasoning as the Instagram archive importer: each
                  // call resends the full Voice + Insight Brief, and firing
                  // them with too little gap was tripping Anthropic's
                  // token-throughput rate limits in testing, reproducibly,
                  // even with a cold rate window — it's real per-batch
                  // volume for founders with a large brief, not leftover
                  // load from an earlier run.
                  if (i > 0) await new Promise(r => setTimeout(r, 1500))
                  const item = importedContentService.get(ids[i]!)
                  if (item) {
                    const { blog } = await generateBlogFromVoiceBrief({
                      voiceBrief: liveVoiceBrief,
                      founderName: draft.name ?? '',
                      caption: item.description,
                      transcript: item.transcriptText,
                      platform: IMPORT_PLATFORM_LABELS[item.sourcePlatform] ?? item.sourcePlatform,
                      kind: item.contentTypeHint?.[0],
                      imageUrls: item.imageUrls?.length ? item.imageUrls : item.thumbnailUrl ? [item.thumbnailUrl] : undefined,
                      postedAt: item.publishedAt ?? item.importedAt,
                      insightBrief: liveInsightBrief,
                      recentAngles: recentAngles.slice(-8),
                    })
                    if (blog?.status === 'ready') {
                      await importedContentService.upsert({
                        ...item,
                        title: blog.title ?? item.title,
                        description: blog.blog ?? item.description,
                        subtitle: blog.subtitle ?? item.subtitle,
                        topics: Array.from(new Set([...item.topics, ...(blog.topics ?? [])])),
                        generationType: blog.generationType,
                        insightConfidence: blog.insightConfidence,
                        insightSource: blog.insightSource,
                        factSources: blog.factSources,
                        primaryQuestion: blog.primaryQuestion,
                        decision: blog.decision,
                        possibleGroupHint: blog.possibleGroupHint,
                        articleShape: blog.articleShape,
                      })
                      recentAngles.push({
                        title: blog.title, articleShape: blog.articleShape, generationType: blog.generationType,
                        insightSource: blog.insightSource, primaryQuestion: blog.primaryQuestion,
                      })
                    } else if (blog?.status === 'insufficient_source') {
                      // Held, not failed — the model correctly declined to
                      // invent a story the source material doesn't support.
                      // Flagged the same way a title/caption mismatch is, so
                      // it shows an asterisk and drops out of bulk actions
                      // until a human adds real context.
                      held++
                      await importedContentService.upsert({
                        ...item,
                        flaggedForReview: true,
                        flagReason: blog.note ?? 'Not enough source material to rewrite without inventing detail.',
                      })
                    }
                  }
                  setImportedRegenProgress({ done: i + 1, total: ids.length })
                }
                setImportedChecked(new Set())
                setImportedRegenProgress(null)
                setSaveError(held > 0 ? `${held} item${held === 1 ? '' : 's'} had too little to go on and ${held === 1 ? 'was' : 'were'} held for review instead of guessed at.` : null)
                refreshImported()
              }

              async function handleMergeSelected() {
                // Draft-only — merging a published item would leave its live
                // Story pointing at nothing, or wrongly combine two published
                // pieces. Checked published rows are just silently excluded.
                const ids = shown.filter(i => importedChecked.has(i.id) && !i.relatedStoryId).map(i => i.id)
                if (ids.length < 2) return
                if (!window.confirm(`Merge these ${ids.length} items into one? The others will be deleted — this can't be undone.`)) return
                const result = await importedContentService.merge(ids)
                if (!result.success) setSaveError(result.error ?? 'Could not merge those items.')
                setImportedChecked(new Set())
                refreshImported()
              }

              // Tags the selected drafts with a series — no publishing involved.
              // Series is being used as an unpublished sorting/grouping layer
              // for now (see ImportedContent.seriesId); episode order and the
              // Story-level series/episode fields only come into play once
              // something is actually published.
              async function handleAddToSeries(seriesId: string) {
                if (!seriesId) return
                // Published items are included here — the checkbox now shows
                // on every row, and moving something into a series shouldn't
                // require it to still be a draft. Delete/Merge below stay
                // scoped to drafts only, since those are destructive and
                // published items already have a live Story to worry about.
                const targets = shown.filter(i => importedChecked.has(i.id))
                if (targets.length === 0) return
                for (const item of targets) {
                  await importedContentService.upsert({ ...item, seriesId })
                }
                setImportedChecked(new Set())
                refreshImported()
              }

              // Same "create then drop straight into it" flow as Published >
              // Series, but reachable without leaving the raw imports list —
              // creates the series, switches into the Series filter on it,
              // and (if anything's already checked) moves those drafts in
              // immediately so creating and organising is one motion.
              async function handleCreateSeriesFromImported() {
                if (!newImportedSeriesTitle.trim()) return
                const series = createSeries(draft!.id, newImportedSeriesTitle.trim())
                const result = await saveSeries(series)
                if (!result.success) {
                  setSaveError(result.error ?? 'Could not create that series. Please try again.')
                  return
                }
                setAddingImportedSeries(false)
                setNewImportedSeriesTitle('')
                setImportedFilterMode('series')
                setImportedSeriesFilter(series.id)
                if (importedChecked.size > 0) {
                  const targets = shown.filter(i => importedChecked.has(i.id))
                  for (const item of targets) await importedContentService.upsert({ ...item, seriesId: series.id })
                  setImportedChecked(new Set())
                }
                refreshImported()
              }

              function handleImportedDelete(id: string) {
                importedContentService.delete(id)
                refreshImported()
              }

              async function handleDeleteSelected() {
                const ids = Array.from(importedChecked)
                if (ids.length === 0) return
                if (!window.confirm(`Delete ${ids.length} selected item${ids.length === 1 ? '' : 's'}? This can't be undone.`)) return
                for (const id of ids) await importedContentService.delete(id)
                setImportedChecked(new Set())
                refreshImported()
              }

              function handleOpenAdvancedEdit(id: string) {
                const item = importedContentService.get(id)
                if (!item) return
                setImportedSaveError(null)
                setImportedEditDraft(item)
                setEditingImportedId(id)
              }

              function handleCancelAdvancedEdit() {
                setEditingImportedId(null)
                setImportedEditDraft(null)
              }

              async function handleSaveAdvancedEdit() {
                if (!importedEditDraft) return
                setImportedSaveError(null)
                const result = await importedContentService.upsert(importedEditDraft)
                if (!result.success) {
                  setImportedSaveError(result.error ?? 'Save failed. Please try again.')
                  return
                }
                const input = importedContentToInput(importedEditDraft)
                const intel = villageContentIntelligenceService.analyse(input)
                void villageContentIntelligenceService.upsert(intel)
                if (importedEditDraft.relatedStoryId) await syncImportEditsToStory(importedEditDraft)
                handleCancelAdvancedEdit()
                refreshImported()
              }

              return (
                <div className="flex gap-6 items-start">
                <div className="flex-1 min-w-0">
                  {platforms.length > 0 && (
                    <div className="mb-3">
                      <div className="flex flex-wrap gap-1.5 mb-1.5">
                        <button onClick={() => { setImportedFilterMode('platform'); setImportedPlatformFilter('all') }}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${importedFilterMode === 'platform' && importedPlatformFilter === 'all' ? 'bg-[#2D2A26] text-white border-[#2D2A26]' : 'bg-white text-[#6B7280] border-[#E8E4DD] hover:border-[#C86A43]/50'}`}>
                          All {allImported.length}
                        </button>
                        <button
                          onClick={() => { setImportedFilterMode('series'); setImportedSeriesFilter(founderSeries[0]?.id ?? 'unassigned') }}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${importedFilterMode === 'series' ? 'bg-[#2D2A26] text-white border-[#2D2A26]' : 'bg-white text-[#6B7280] border-[#E8E4DD] hover:border-[#C86A43]/50'}`}
                        >
                          Series
                        </button>
                      </div>
                      {importedFilterMode === 'series' && founderSeries.length === 0 && (
                        <p className="text-xs text-[#9CA3AF]">No series yet — create one from Published &gt; Series, then tag drafts here once you've got one.</p>
                      )}
                      {importedFilterMode === 'series' && founderSeries.length > 0 && (
                        // Same row layout/styling as the platform pills below —
                        // one consistent way of switching what's shown, whether
                        // by platform or by series.
                        <div className="flex flex-wrap gap-1.5">
                          {founderSeries.map(s => (
                            <button key={s.id} onClick={() => setImportedSeriesFilter(s.id)}
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${importedSeriesFilter === s.id ? 'bg-[#2D2A26] text-white border-[#2D2A26]' : 'bg-white text-[#6B7280] border-[#E8E4DD] hover:border-[#C86A43]/50'}`}>
                              {s.title || 'Untitled series'} {allImported.filter(i => i.seriesId === s.id).length}
                            </button>
                          ))}
                          <button onClick={() => setImportedSeriesFilter('unassigned')}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${importedSeriesFilter === 'unassigned' ? 'bg-[#2D2A26] text-white border-[#2D2A26]' : 'bg-white text-[#6B7280] border-[#E8E4DD] hover:border-[#C86A43]/50'}`}>
                            Unassigned {allImported.filter(i => !i.seriesId).length}
                          </button>
                        </div>
                      )}
                      {importedFilterMode === 'platform' && (
                        <div className="flex flex-wrap gap-1.5">
                          {platforms.map(p => (
                            <button key={p} onClick={() => { setImportedPlatformFilter(p); setInstagramCaptionFilter('all') }}
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${importedPlatformFilter === p ? 'bg-[#2D2A26] text-white border-[#2D2A26]' : 'bg-white text-[#6B7280] border-[#E8E4DD] hover:border-[#C86A43]/50'}`}>
                              {IMPORT_PLATFORM_LABELS[p]} {allImported.filter(i => i.sourcePlatform === p && !i.seriesId).length}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Instagram brings in Posts (almost always captioned)
                          and Stories (structurally never captioned) as one
                          pile — this splits them so the ones worth a quick
                          publish aren't buried among ones that need writing
                          from scratch. */}
                      {isInstagramView && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {([
                            ['all',  `All ${shownByPlatform.length}`],
                            ['has',  `Has caption ${instagramHasCaptionCount}`],
                            ['none', `No caption ${instagramNoCaptionCount}`],
                          ] as const).map(([value, label]) => (
                            <button key={value} onClick={() => setInstagramCaptionFilter(value)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${instagramCaptionFilter === value ? 'bg-[#C86A43] text-white border-[#C86A43]' : 'bg-white text-[#6B7280] border-[#E8E4DD] hover:border-[#C86A43]/50'}`}>
                              {label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {autoPublishCandidates.length > 0 && (
                    <div className="flex items-center justify-between gap-3 mb-4 px-4 py-2.5 bg-[#5E6B4A]/10 border border-[#5E6B4A]/20 rounded-lg flex-wrap">
                      <p className="text-xs text-[#5E6B4A] font-medium">
                        {autoPublishCandidates.length} {autoPublishCandidates.length === 1 ? 'item' : 'items'} here already {autoPublishCandidates.length === 1 ? 'has' : 'have'} a real caption — ready to go live as-is.
                      </p>
                      <button
                        onClick={() => void handleAutoPublishCaptioned()}
                        disabled={autoPublishingCaptioned}
                        className="shrink-0 px-4 py-2 bg-[#5E6B4A] text-white text-xs font-semibold rounded-lg hover:bg-[#4a5539] disabled:opacity-50 transition-colors"
                      >
                        {autoPublishingCaptioned ? 'Publishing…' : `Auto-publish ${autoPublishCandidates.length} captioned`}
                      </button>
                    </div>
                  )}

                  {/* Series creation used to only live in Published > Series —
                      a founder browsing raw imports had no way to organise them
                      into a series without leaving this list. Now it's right
                      here: tick the pieces below, create a series, done. */}
                  <div className="mb-4 pb-4 border-b border-[#E8E4DD]">
                    <p className="text-lg font-bold text-[#2D2A26] mb-1">Restructure your content as a series</p>
                    <p className="text-xs text-[#9CA3AF] mb-3">
                      Group episodes, posts or videos that belong together — a season, a project, a recurring
                      segment — into their own series. Tick the pieces below, then create or choose a series to
                      move them into.
                    </p>
                    {addingImportedSeries ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          autoFocus
                          value={newImportedSeriesTitle}
                          onChange={e => setNewImportedSeriesTitle(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') void handleCreateSeriesFromImported()
                            if (e.key === 'Escape') { setAddingImportedSeries(false); setNewImportedSeriesTitle('') }
                          }}
                          placeholder="e.g. Van Life"
                          className="px-3 py-1.5 rounded-lg text-sm border border-[#C86A43]/50 text-[#2D2A26] bg-white focus:outline-none focus:ring-2 focus:ring-[#C86A43]/30 w-48"
                        />
                        <button
                          onClick={() => void handleCreateSeriesFromImported()}
                          disabled={!newImportedSeriesTitle.trim()}
                          className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-[#C86A43] text-white hover:bg-[#b05a35] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          {importedChecked.size > 0 ? `Create & move ${importedChecked.size}` : 'Create series'}
                        </button>
                        <button
                          onClick={() => { setAddingImportedSeries(false); setNewImportedSeriesTitle('') }}
                          className="px-2 py-1.5 text-sm text-[#9CA3AF] hover:text-[#2D2A26] transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setAddingImportedSeries(true)}
                        className="px-3 py-1.5 rounded-lg text-sm font-semibold border border-dashed border-[#E8E4DD] text-[#C86A43] hover:border-[#C86A43]/50 transition-colors">
                        + New Series
                      </button>
                    )}
                  </div>

                  {saveError && <p className="text-xs text-red-600 font-medium mb-3">{saveError}</p>}

                  {(unpublishedItems.length > 0 || importedChecked.size > 0) && (
                    <div className="flex items-center justify-between gap-3 mb-3 px-4 py-2.5 bg-[#FBF1EB] border border-[#F0DDD2] rounded-lg flex-wrap">
                      <div className="flex items-center gap-3 flex-wrap">
                        <label className="flex items-center gap-2 text-xs font-medium text-[#2D2A26] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={importedChecked.size > 0 && importedChecked.size === readyItems.length}
                            onChange={toggleSelectAllReady}
                            disabled={readyItems.length === 0}
                            className="w-4 h-4 accent-[#C86A43]"
                          />
                          Select all ready to publish ({readyItems.length})
                        </label>
                        <button
                          type="button"
                          onClick={toggleSelectAllUnpublished}
                          disabled={unpublishedItems.length === 0}
                          className="text-xs text-[#9CA3AF] hover:text-[#C86A43] underline decoration-dotted disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          or select all {unpublishedItems.length} unpublished
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        {importedChecked.size >= 2 && (
                          <button
                            onClick={() => void handleMergeSelected()}
                            title="Combine the selected items into one — for clips posted the same day that didn't group automatically"
                            className="px-3 py-2 bg-white border border-[#E8E4DD] text-[#2D2A26] text-xs font-semibold rounded-lg hover:border-[#C86A43]/40 hover:text-[#C86A43] transition-colors shrink-0"
                          >
                            Merge {importedChecked.size} selected
                          </button>
                        )}
                        {importedChecked.size > 0 && founderSeries.length > 0 && (
                          <select
                            value=""
                            onChange={e => { if (e.target.value) void handleAddToSeries(e.target.value) }}
                            title="Moves the selected drafts into a series — nothing gets published"
                            className="px-3 py-2 bg-white border border-[#E8E4DD] text-[#2D2A26] text-xs font-semibold rounded-lg hover:border-[#C86A43]/40 hover:text-[#C86A43] transition-colors shrink-0 cursor-pointer"
                          >
                            <option value="" disabled>Move {importedChecked.size} to series…</option>
                            {founderSeries.map(s => (
                              <option key={s.id} value={s.id}>{s.title || 'Untitled series'}</option>
                            ))}
                          </select>
                        )}
                        {importedChecked.size > 0 && (
                          <button
                            onClick={() => void handleDeleteSelected()}
                            className="px-3 py-2 bg-white border border-[#E8E4DD] text-red-600 text-xs font-semibold rounded-lg hover:border-red-300 hover:bg-red-50 transition-colors shrink-0"
                          >
                            Delete {importedChecked.size} selected
                          </button>
                        )}
                        {canUseVoiceRewrite && importedChecked.size > 0 && (
                          <button
                            onClick={() => void handleRegenerateSelected()}
                            disabled={!liveVoiceBrief?.trim() || !!importedRegenProgress}
                            title={!liveVoiceBrief?.trim() ? 'Add your Voice & Brand Brief from Import Content first' : 'Rewrite the selected drafts using your Voice & Brand Brief'}
                            className="px-3 py-2 bg-white border border-[#E8E4DD] text-[#2D2A26] text-xs font-semibold rounded-lg hover:border-[#C86A43]/40 hover:text-[#C86A43] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
                          >
                            {importedRegenProgress
                              ? `Rewriting ${importedRegenProgress.done}/${importedRegenProgress.total}…`
                              : `Rewrite ${importedChecked.size} with Voice Brief`}
                          </button>
                        )}
                        <button
                          onClick={() => void handleImportedBulkPublish()}
                          disabled={importedChecked.size === 0 || importedBulkPublishing}
                          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors shrink-0 ${
                            importedChecked.size === 0
                              ? 'bg-[#E8E4DD] text-[#9CA3AF] cursor-not-allowed'
                              : 'bg-[#C86A43] text-white hover:bg-[#b05a35] disabled:opacity-50 disabled:cursor-not-allowed'
                          }`}
                        >
                          {importedBulkPublishing ? 'Publishing…' : `Publish ${importedChecked.size || ''} selected`}
                        </button>
                      </div>
                    </div>
                  )}

                  {shown.length === 0 ? (
                    <div className="bg-white rounded-xl border border-[#E8E4DD] px-5 py-8 text-center">
                      <p className="text-sm font-semibold text-[#2D2A26]">Nothing imported yet.</p>
                      <Link to="/dashboard/import-content" className="inline-flex mt-3 px-4 py-2 bg-[#C86A43] text-white text-xs font-semibold rounded-lg hover:bg-[#b05a35] transition-colors">
                        Import content
                      </Link>
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl border border-[#E8E4DD] divide-y divide-[#F3EDE6]">
                      {shown.map(item => (
                        <SavedRow
                          key={item.id}
                          item={item}
                          checked={importedChecked.has(item.id)}
                          onToggleCheck={() => toggleImportedChecked(item.id)}
                          onAdvancedEdit={() => handleOpenAdvancedEdit(item.id)}
                          onDelete={() => handleImportedDelete(item.id)}
                          onStatusChange={status => void handleImportedStatusChange(item.id, status)}
                        />
                      ))}
                    </div>
                  )}
                </div>
                {editingImportedId && importedEditDraft && (
                  // sticky alone doesn't give an element its own scroll — its
                  // content just gets pinned/clipped once taller than the
                  // viewport, with no way to reach anything past the fold.
                  // max-h + overflow-y-auto makes the panel scroll
                  // independently instead.
                  <div className="w-full max-w-xl shrink-0 bg-white rounded-xl border border-[#E8E4DD] p-5 sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm font-semibold text-[#2D2A26]">Advanced edit</p>
                      <button
                        onClick={handleCancelAdvancedEdit}
                        aria-label="Close"
                        className="text-[#9CA3AF] hover:text-[#2D2A26] transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    {importedSaveError && <p className="text-sm text-red-600 font-medium mb-2">{importedSaveError}</p>}
                    <EditForm
                      draft={importedEditDraft}
                      onChange={setImportedEditDraft}
                      onSave={() => void handleSaveAdvancedEdit()}
                      onCancel={handleCancelAdvancedEdit}
                    />
                  </div>
                )}
                </div>
              )
            })()}

            {contentSubTab === 'published' && (() => {
              const editingStory = editingStoryId ? founderStories.find(s => s.id === editingStoryId) : undefined
              if (editingStory) {
                return (
                  <StoryEditor
                    key={editingStory.id}
                    story={editingStory}
                    onSave={() => setImportedTick(t => t + 1)}
                    onDelete={() => { setEditingStoryId(null); setImportedTick(t => t + 1) }}
                    onClose={() => setEditingStoryId(null)}
                  />
                )
              }
              const sortedStories = [...founderStories].sort((a, b) =>
                publishedSort === 'newest' ? b.createdAt.localeCompare(a.createdAt) : a.createdAt.localeCompare(b.createdAt)
              )
              const founderSeries = getSeriesList({ founderId: draft.id })
              const activeSeries = activeSeriesId ? founderSeries.find(s => s.id === activeSeriesId) : undefined

              async function handleAddSeries() {
                if (!newSeriesTitle.trim()) return
                const series = createSeries(draft!.id, newSeriesTitle.trim())
                const result = await saveSeries(series)
                if (result.success) {
                  setActiveSeriesId(series.id)
                  setImportedTick(t => t + 1)
                  setAddingSeries(false)
                  setNewSeriesTitle('')
                } else {
                  setSaveError(result.error ?? 'Could not create that series. Please try again.')
                }
              }

              return (
                <div>
                  <div className="flex gap-2 mb-4">
                    <button onClick={() => setPublishedView('stories')}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                        publishedView === 'stories' ? 'bg-[#2D2A26] text-white border-[#2D2A26]' : 'bg-white text-[#6B7280] border-[#E8E4DD] hover:border-[#C86A43]/50'
                      }`}>
                      Stories
                    </button>
                    <button onClick={() => setPublishedView('series')}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                        publishedView === 'series' ? 'bg-[#2D2A26] text-white border-[#2D2A26]' : 'bg-white text-[#6B7280] border-[#E8E4DD] hover:border-[#C86A43]/50'
                      }`}>
                      Series
                    </button>
                  </div>

                  {publishedView === 'series' ? (
                    <div className="flex flex-col gap-5">
                      <div className="flex flex-wrap gap-2">
                        {founderSeries.map(s => (
                          <button key={s.id} onClick={() => setActiveSeriesId(s.id)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                              activeSeriesId === s.id ? 'bg-[#C86A43] text-white border-[#C86A43]' : 'bg-white text-[#6B7280] border-[#E8E4DD] hover:border-[#C86A43]/50'
                            }`}>
                            {s.title || 'Untitled series'}
                          </button>
                        ))}
                        {addingSeries ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              autoFocus
                              value={newSeriesTitle}
                              onChange={e => setNewSeriesTitle(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') void handleAddSeries()
                                if (e.key === 'Escape') { setAddingSeries(false); setNewSeriesTitle('') }
                              }}
                              placeholder="e.g. Van Life"
                              className="px-3 py-1.5 rounded-lg text-sm border border-[#C86A43]/50 text-[#2D2A26] bg-white focus:outline-none focus:ring-2 focus:ring-[#C86A43]/30 w-40"
                            />
                            <button
                              onClick={() => void handleAddSeries()}
                              disabled={!newSeriesTitle.trim()}
                              className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-[#C86A43] text-white hover:bg-[#b05a35] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                              Create
                            </button>
                            <button
                              onClick={() => { setAddingSeries(false); setNewSeriesTitle('') }}
                              className="px-2 py-1.5 text-sm text-[#9CA3AF] hover:text-[#2D2A26] transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => setAddingSeries(true)}
                            className="px-3 py-1.5 rounded-lg text-sm font-semibold border border-dashed border-[#E8E4DD] text-[#C86A43] hover:border-[#C86A43]/50 transition-colors">
                            + New Series
                          </button>
                        )}
                      </div>

                      {activeSeries ? (
                        <SeriesDetail
                          key={activeSeries.id}
                          series={activeSeries}
                          founderId={draft.id}
                          onBack={() => setActiveSeriesId(null)}
                          onChanged={() => setImportedTick(t => t + 1)}
                          onDeleted={() => setActiveSeriesId(null)}
                        />
                      ) : founderSeries.length === 0 ? (
                        <div className="bg-white rounded-xl border border-[#E8E4DD] px-5 py-8 text-center">
                          <p className="text-sm font-semibold text-[#2D2A26]">No series yet.</p>
                          <p className="text-xs text-[#9CA3AF] mt-1">Start one above — name it, then add your published stories as episodes.</p>
                        </div>
                      ) : (
                        <p className="text-xs text-[#9CA3AF]">Pick a series above to manage it.</p>
                      )}
                    </div>
                  ) : founderStories.length === 0 ? (
                    <div className="bg-white rounded-xl border border-[#E8E4DD] px-5 py-8 text-center">
                      <p className="text-sm font-semibold text-[#2D2A26]">Everyone starts with one story. Let's publish yours.</p>
                      <Link to="/dashboard/publish" className="inline-flex mt-3 px-4 py-2 bg-[#C86A43] text-white text-xs font-semibold rounded-lg hover:bg-[#b05a35] transition-colors">
                        Publish Story
                      </Link>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-end mb-2">
                        <select
                          value={publishedSort}
                          onChange={e => setPublishedSort(e.target.value as 'newest' | 'oldest')}
                          className="text-xs px-2 py-1.5 rounded-lg border border-[#E8E4DD] bg-white text-[#6B7280] focus:outline-none focus:border-[#C86A43]"
                        >
                          <option value="newest">Newest first</option>
                          <option value="oldest">Oldest first</option>
                        </select>
                      </div>
                      <div className="bg-white rounded-xl border border-[#E8E4DD] divide-y divide-[#F3EDE6]">
                      {sortedStories.map(story => {
                        return (
                          <div key={story.id} className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-[#FBF8F4] transition-colors">
                            <button onClick={() => setEditingStoryId(story.id)} className="flex items-center gap-4 flex-1 min-w-0 text-left">
                              <img src={story.coverImage} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0 bg-[#F3EDE6]" />
                              <div className="flex-1 min-w-0">
                                <p className="text-base font-medium text-[#2D2A26] truncate">{story.title}</p>
                                <p className="text-xs text-[#9CA3AF] mt-0.5">{story.contentTypes.join(' · ')} · {story.createdAt}</p>
                              </div>
                            </button>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                              story.status === 'published' || story.status === 'featured'
                                ? 'bg-green-100 text-green-700'
                                : story.status === 'draft'
                                ? 'bg-[#F3EDE6] text-[#9CA3AF]'
                                : 'bg-amber-100 text-amber-700'
                            }`}>
                              {story.status}
                            </span>
                            <ConfirmButton
                              label="Delete"
                              confirmLabel="Confirm"
                              onConfirm={() => { void deleteStory(story.id).then(() => setImportedTick(t => t + 1)) }}
                              className="text-xs text-[#9CA3AF] hover:text-red-500 shrink-0"
                            />
                          </div>
                        )
                      })}
                      </div>
                    </>
                  )}
                </div>
              )
            })()}
          </div>
          )
        })()}

        {/* ── Businesses ────────────────────────────────────────────────── */}
        {tab === 'businesses' && (
          <BusinessesTab founderId={draft.id} founderLocation={draft.location} founderIndustry={draft.industry} />
        )}

        {/* ── FAQ ──────────────────────────────────────────────────────────── */}
        {tab === 'expertise' && (
          <div className="flex flex-col gap-5">
            <TabIntro>
              Real questions people ask you, with real answers. These help both search engines and
              AI systems understand what you know.
            </TabIntro>

            <div>
              <Field label="Frequently Asked Questions" hint="Real questions people ask you. These help both search engines and AI systems understand what you know.">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <p className="text-[11px] text-[#9CA3AF]">Pull real questions and answers straight from your bio and published stories.</p>
                  <button type="button"
                    onClick={() => setFaqSuggestions(suggestFaqsFromFounder(draft, founderStories, founderBusinesses))}
                    className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#C86A43] text-white hover:bg-[#B15C38] transition-colors">
                    Suggest FAQs
                  </button>
                </div>
                {faqSuggestions && (
                  <div className="mb-4 flex flex-col gap-2">
                    {faqSuggestions.length === 0 ? (
                      <p className="text-xs text-[#9CA3AF] italic">Nothing found yet — write a bit more in your Bio, or publish a story with a Blog, then try again.</p>
                    ) : faqSuggestions
                      .filter(p => !(draft.faqs ?? []).some(f => normalizeFaqText(f.question).toLowerCase() === normalizeFaqText(p.question).toLowerCase()))
                      .map(pair => (
                        <div key={pair.question} className="flex items-start justify-between gap-3 p-3 rounded-lg bg-[#F8F5F0] border border-[#E8E4DD]">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-[#2D2A26]">{pair.question}</p>
                            <p className="text-xs text-[#6B7280] mt-0.5 leading-relaxed">{pair.answer}</p>
                          </div>
                          <button type="button"
                            onClick={() => set('faqs', [...(draft.faqs ?? []), {
                              id: `faq-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                              question: normalizeFaqText(pair.question), answer: normalizeFaqText(pair.answer),
                              topicIds: [], expertiseIds: [], relatedStoryIds: [], relatedIdeaIds: [],
                            }])}
                            className="shrink-0 text-[10px] font-semibold px-2.5 py-1 rounded-md bg-[#2D2A26] text-white hover:bg-[#1a1815] transition-colors">
                            Add
                          </button>
                        </div>
                      ))}
                  </div>
                )}
                <FAQEditor faqs={draft.faqs ?? []} onChange={v => set('faqs', v)} />
              </Field>
            </div>

            <div className="border-t border-[#E8E4DD] pt-5">
              <RelationshipsPanel
                groups={[
                  {
                    title: 'Featured pages due to expertise',
                    items: founderIdeas.map(i => ({
                      id: i.id, label: i.title, sublabel: i.topics.map(t => t.name).join(', '),
                      path: `/ideas/${i.slug}`,
                    })),
                  },
                ]}
              />
            </div>

            <div className="border-t border-[#E8E4DD] pt-5">
              <p className="text-sm font-semibold text-[#2D2A26] mb-2">Appears On</p>
              <AppearsOnPanel locations={appearsOn} onToggle={key => void handleRemoveFounderTopicFeature(key)} />
            </div>
          </div>
        )}

        {/* ── Discovery: SEO, GEO, search preview, visibility ─────────────── */}
        {tab === 'discovery' && (
          <div className="flex flex-col gap-5">
            <TabIntro>
              Join the Village Partner program, link the brands you genuinely use, and set up your own
              affiliate program and pitch so other founders can promote you.
            </TabIntro>

            <PublisherDiscoveryProfile founderId={draft.id} />

            {founderBusinesses.length > 0 && (() => {
              const activeBizId = discoveryBizId && founderBusinesses.some(b => b.id === discoveryBizId)
                ? discoveryBizId
                : founderBusinesses[0]!.id
              const activeBiz = founderBusinesses.find(b => b.id === activeBizId)!
              return (
                <div className="border-t border-[#E8E4DD] pt-5 flex flex-col gap-4">
                  <TabIntro>
                    Everything above is about you as a publisher. Below is the same idea, but for
                    a business you run — how CULO matches publishers to it, separately from you.
                  </TabIntro>

                  {founderBusinesses.length > 1 && (
                    <div className="flex flex-wrap gap-2">
                      {founderBusinesses.map(b => (
                        <button key={b.id} onClick={() => setDiscoveryBizId(b.id)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                            activeBizId === b.id ? 'bg-[#C86A43] text-white border-[#C86A43]' : 'bg-white text-[#6B7280] border-[#E8E4DD] hover:border-[#C86A43]/50'
                          }`}>
                          {b.name || 'Untitled business'}
                        </button>
                      ))}
                    </div>
                  )}

                  <BusinessDiscoveryProfile
                    key={activeBiz.id}
                    businessId={activeBiz.id}
                    business={activeBiz}
                    onBusinessUpdate={() => forceBusinessRefresh(n => n + 1)}
                  />
                  <BusinessProgramsTab
                    key={activeBiz.id}
                    businessId={activeBiz.id}
                    partnerEnabled={!!activeBiz.partnerEnabled}
                  />
                </div>
              )
            })()}
          </div>
        )}

        {/* ── Settings: publishing preferences, account-level settings ────── */}
        {tab === 'settings' && (
          <div className="flex flex-col gap-4">
            <TabIntro>
              Account-level details and publishing preferences that don't affect how you're discovered,
              just how your profile behaves.
            </TabIntro>

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

            <div className="bg-white rounded-xl border border-[#E8E4DD] px-5 py-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[#2D2A26]">Voice &amp; Brand Brief</p>
                <p className="text-xs text-[#9CA3AF] mt-0.5">Managed from Import Content, next to the imports it writes for.</p>
              </div>
              <Link
                to="/dashboard/import-content"
                className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#2D2A26] text-white hover:bg-[#1a1815] transition-colors"
              >
                Open Import Content →
              </Link>
            </div>

            <div className="bg-white rounded-xl border border-[#E8E4DD] px-5 py-4">
              <p className="text-sm font-semibold text-[#2D2A26] mb-1">Founder ID</p>
              <p className="text-xs font-mono text-[#6B7280]">{draft.id}</p>
            </div>
            <div className="bg-white rounded-xl border border-[#E8E4DD] px-5 py-4">
              <p className="text-sm font-semibold text-[#2D2A26] mb-1">Public Slug</p>
              <p className="text-xs font-mono text-[#6B7280]">/founders/{draft.slug}</p>
            </div>
            <div className="bg-white rounded-xl border border-[#E8E4DD] px-5 py-4 text-sm">
              <p className="font-semibold text-[#2D2A26] mb-1">Created</p>
              <p className="text-[#6B7280]">{draft.createdAt}</p>
            </div>

            <div className="bg-white rounded-xl border border-[#E8E4DD] px-5 py-4">
              <p className="text-sm font-semibold text-[#2D2A26] mb-2">Danger Zone</p>
              <p className="text-xs text-[#9CA3AF] mb-3">
                To hide your profile from public directories while keeping your data, set visibility to
                Archived in the Discovery tab instead. Deleting removes your founder profile permanently
                and can't be undone.
              </p>
              {saveError && <p className="text-xs text-red-600 mb-2">{saveError}</p>}
              <ConfirmButton
                label="Delete Profile"
                confirmLabel="Yes, delete permanently"
                message="This can't be undone."
                onConfirm={() => void handleDelete()}
                className="px-4 py-2 text-sm border border-red-200 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
              />
            </div>
          </div>
        )}

      </div>

      {/* Bottom save bar — same founder-fields-only scope as the top one.
          Left-aligned to match the Save button pattern used on the
          Businesses tab, instead of tucked away on the right. */}
      {(tab === 'overview' || tab === 'expertise' || tab === 'settings') && (
        <div className="flex items-center gap-3 px-8 py-4 border-t border-[#E8E4DD] bg-white shrink-0">
          <button onClick={handleSave} disabled={saving} className="px-5 py-2 bg-[#C86A43] text-white text-sm font-semibold rounded-lg hover:bg-[#b05a35] disabled:opacity-60 transition-colors">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
          {saved && <p className="text-sm text-green-600 font-medium">Saved ✓</p>}
          {saveError && <p className="text-sm text-red-600 font-medium">{saveError}</p>}
        </div>
      )}
    </div>
  )
}
