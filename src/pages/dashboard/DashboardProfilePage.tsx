import { useState, useEffect, type ReactNode } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { getCurrentFounder } from '../../services/currentFounder'
import { updateFounder, deleteFounder } from '../../services/founders'
import { buildStoryFromImport, publishStoryCore } from '../../services/publishStory'
import { SavedRow, isReadyToPublish } from './DashboardImportContentPage'
import { getBusinesses, updateBusiness, deleteBusiness } from '../../services/businesses'
import { EmptyState } from '../../components/ui/EmptyState'
import { ConfirmButton } from '../../components/ui/ConfirmButton'
import { MediaUpload } from '../../components/ui/MediaUpload'
import { FAQEditor } from '../../components/dashboard/FAQEditor'
import { publisherPartnerProfileService, affiliateLinkService } from '../../services/partnership'
import { getStories } from '../../services/stories'
import { importedContentService, PLATFORM_LABELS as IMPORT_PLATFORM_LABELS } from '../../services/importedContent'
import type { ImportedContentPlatform, ImportedContentStatus } from '../../types/importedContent'
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
import {
  getFounderMissingItems,
  getBusinessMissingItems,
  getStoryMissingItems,
  getMissingCounts,
  type MissingItem,
} from '../../utils/missingAssets'
import { getFounderAppearsOn } from '../../utils/appearsOn'
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

function OpportunityGroup({ title, description, items, profile, onToggle }: {
  title: string
  description: string
  items: Array<{ key: keyof PublisherPartnerProfile; label: string }>
  profile: PublisherPartnerProfile
  onToggle: (key: keyof PublisherPartnerProfile) => void
}) {
  const activeCount = items.filter(i => profile[i.key] as boolean).length
  return (
    <div className="border border-[#E8E4DD] rounded-xl overflow-hidden">
      <div className={`px-4 py-3 flex items-center justify-between gap-3 ${activeCount > 0 ? 'bg-[#5E6B4A]/5' : 'bg-[#F8F5F0]'}`}>
        <div>
          <p className="text-xs font-semibold text-[#2D2A26]">{title}</p>
          <p className="text-xs text-[#9CA3AF] mt-0.5">{description}</p>
        </div>
        {activeCount > 0 && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#5E6B4A]/10 text-[#5E6B4A] font-semibold shrink-0 whitespace-nowrap">
            {activeCount} active
          </span>
        )}
      </div>
      <div className="divide-y divide-[#F3EDE6]">
        {items.map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between gap-4 px-4 py-3">
            <p className="text-xs text-[#4B4845]">{label}</p>
            <button
              onClick={() => onToggle(key)}
              className={`w-9 h-5 rounded-full transition-colors relative shrink-0 ${(profile[key] as boolean) ? 'bg-[#5E6B4A]' : 'bg-[#E8E4DD]'}`}
              aria-label={`Toggle ${label}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${(profile[key] as boolean) ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

const SPEAKING_OPPS = [
  { key: 'openToSpeaking'  as const, label: 'Speaking at events and conferences' },
  { key: 'openToPodcasts'  as const, label: 'Podcast guest appearances' },
  { key: 'openToWorkshops' as const, label: 'Running workshops or masterclasses' },
]

const CONTENT_OPPS = [
  { key: 'openToGuestBlogs' as const, label: 'Guest blog posts and editorial' },
  { key: 'openToCampaigns'  as const, label: 'Brand campaign collaborations' },
]

const BUSINESS_OPPS = [
  { key: 'openToConsulting' as const, label: 'Consulting and strategy work' },
  { key: 'openToAdvisory'   as const, label: 'Board and advisory roles' },
  { key: 'openToFreelance'  as const, label: 'Freelance and contract projects' },
]

const COMMUNITY_OPPS = [
  { key: 'openToCollaboration' as const, label: 'Publisher and creator collaborations' },
  { key: 'openToMentoring'     as const, label: 'Mentoring founders and creators' },
  { key: 'openToAffiliates'    as const, label: 'Genuine affiliate partnerships' },
  { key: 'openToReferrals'     as const, label: 'Business referral partnerships' },
]

function PublisherDiscoveryProfile({ founderId, founderTopics, onEditTopics }: {
  founderId: string
  founderTopics: Topic[]
  onEditTopics: () => void
}) {
  const [profile, setProfile] = useState<PublisherPartnerProfile>(
    () => publisherPartnerProfileService.getOrCreate(founderId)
  )
  const [saved, setSaved] = useState(false)
  const [affiliateLinks, setAffiliateLinks] = useState(() => affiliateLinkService.getAll({ founderId }))
  const [newAffiliateBusinessId, setNewAffiliateBusinessId] = useState('')
  const [newAffiliateUrl, setNewAffiliateUrl] = useState('')

  const allBusinesses = getBusinesses({ founderId })
  const linkedBusinessIds = new Set(affiliateLinks.map(l => l.businessId))
  const unlinkedBusinesses = allBusinesses.filter(b => !linkedBusinessIds.has(b.id))

  async function handleAddAffiliateLink() {
    if (!newAffiliateBusinessId || !newAffiliateUrl.trim()) return
    const biz = allBusinesses.find(b => b.id === newAffiliateBusinessId)
    const link = {
      id: crypto.randomUUID(),
      founderId,
      businessId: newAffiliateBusinessId,
      businessWebsite: biz?.website,
      affiliateUrl: newAffiliateUrl.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    const result = await affiliateLinkService.upsert(link)
    if (result.success) {
      setAffiliateLinks(affiliateLinkService.getAll({ founderId }))
      setNewAffiliateBusinessId('')
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

  function toggleP(key: keyof PublisherPartnerProfile) {
    setProfile(prev => ({ ...prev, [key]: !(prev[key] as boolean) }))
    setSaved(false)
  }

  function turnAllOpportunitiesOn() {
    const allKeys = [...SPEAKING_OPPS, ...CONTENT_OPPS, ...BUSINESS_OPPS, ...COMMUNITY_OPPS].map(o => o.key)
    setProfile(prev => {
      const next = { ...prev } as unknown as Record<string, unknown>
      for (const key of allKeys) next[key] = true
      return next as unknown as PublisherPartnerProfile
    })
    setSaved(false)
  }

  function toggleIdealIndustry(name: string) {
    setProfile(prev => {
      const has = (prev.idealIndustries ?? []).includes(name)
      const idealIndustries = has
        ? (prev.idealIndustries ?? []).filter(i => i !== name)
        : [...(prev.idealIndustries ?? []), name]
      return { ...prev, idealIndustries: idealIndustries.length > 0 ? idealIndustries : undefined }
    })
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
        title="Discovery Status"
        description="Control whether CULO actively matches you with opportunities and recommendations"
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-[#2D2A26]">Enable Discovery Profile</p>
            <p className="text-xs text-[#9CA3AF] mt-0.5">Turn on matching — CULO will start surfacing relevant opportunities</p>
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

      {/* For the Record */}
      <DiscoverySection
        title="For the Record"
        description="Write this for CULO's matching engine and for businesses reviewing your profile, not for the public. Be specific and honest."
      >
        <div>
          <label className="block text-sm font-medium text-[#2D2A26] mb-1.5">What do you want to be known for?</label>
          <p className="text-xs text-[#9CA3AF] mb-2">Your professional focus, the problem you solve, or what you'd want a business to know before working with you</p>
          <textarea
            value={profile.professionalBio ?? ''}
            onChange={e => setP('professionalBio', e.target.value || undefined)}
            rows={4}
            className={discoveryInputClass + ' resize-y'}
            placeholder="I help founders tell the story behind their business, not the polished version, the real one. I've published 200+ stories about building slowly, using fewer tools better, and running businesses on your own terms."
          />
        </div>

        {founderTopics.length > 0 && (
          <div>
            <p className="text-xs font-medium text-[#6B7280] mb-2">Your topics (from the Expertise tab)</p>
            <div className="flex flex-wrap gap-1.5">
              {founderTopics.map(t => (
                <span key={t.id} className="px-2.5 py-1 rounded-full text-xs bg-[#C86A43]/10 text-[#C86A43] border border-[#C86A43]/20">
                  {t.name}
                </span>
              ))}
            </div>
            <p className="text-xs text-[#9CA3AF] mt-2">
              CULO uses these for opportunity matching.{' '}
              <button type="button" onClick={onEditTopics} className="text-[#C86A43] underline-offset-2 hover:underline">
                Edit in Expertise →
              </button>
            </p>
          </div>
        )}
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
                  <p className="text-xs font-medium text-[#2D2A26] w-32 shrink-0 truncate">{biz?.name ?? 'Unknown business'}</p>
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

        {unlinkedBusinesses.length > 0 && (
          <div className="flex items-center gap-2">
            <select value={newAffiliateBusinessId} onChange={e => setNewAffiliateBusinessId(e.target.value)}
              className="text-xs border border-[#E8E4DD] rounded-lg px-2 py-2 bg-white shrink-0">
              <option value="">Add a business…</option>
              {unlinkedBusinesses.map(b => <option key={b.id} value={b.id}>{b.name || 'Untitled business'}</option>)}
            </select>
            <input type="url" value={newAffiliateUrl} onChange={e => setNewAffiliateUrl(e.target.value)}
              placeholder="Their affiliate link"
              className="flex-1 px-2 py-2 text-xs border border-[#E8E4DD] rounded-lg focus:outline-none focus:border-[#C86A43]" />
            <button onClick={() => void handleAddAffiliateLink()} disabled={!newAffiliateBusinessId || !newAffiliateUrl.trim()}
              className="text-xs font-semibold px-3 py-2 rounded-lg bg-[#C86A43] text-white hover:bg-[#B15C38] disabled:opacity-40 transition-colors shrink-0">
              Add
            </button>
          </div>
        )}

        <div className="border-t border-[#E8E4DD] pt-4">
          <label className="block text-sm font-medium text-[#2D2A26] mb-1.5">Outside tools &amp; software I use</label>
          <p className="text-xs text-[#9CA3AF] mb-2">For things that will never have a Village business or affiliate link. One per line — "Content 360" not "marketing tools."</p>
          <textarea
            value={(profile.genuineRecommendations ?? []).join('\n')}
            onChange={e => {
              const vals = e.target.value.split('\n').map(v => v.trim()).filter(Boolean)
              setP('genuineRecommendations', vals.length > 0 ? vals : undefined)
            }}
            rows={4}
            className={discoveryInputClass + ' resize-y'}
            placeholder={'Content 360\nCanva\nStripe\nMailchimp\nClaude\nXero\nSquarespace'}
          />
        </div>
      </DiscoverySection>

      {/* Opportunities I'm Open To */}
      <DiscoverySection
        title="Opportunities I'm Open To"
        description="Be selective. Only turn on what you'd genuinely say yes to. Businesses see this when deciding whether to reach out."
      >
        <button type="button" onClick={turnAllOpportunitiesOn}
          className="self-start text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#E8E4DD] text-[#6B7280] hover:border-[#C86A43] hover:text-[#C86A43] transition-colors">
          Turn all on
        </button>
        <OpportunityGroup title="Speaking &amp; Events" description="Keynotes, podcasts, workshops, live appearances" items={SPEAKING_OPPS} profile={profile} onToggle={toggleP} />
        <OpportunityGroup title="Content &amp; Campaigns" description="Guest posts, brand collaborations, sponsored content" items={CONTENT_OPPS} profile={profile} onToggle={toggleP} />
        <OpportunityGroup title="Business &amp; Advisory" description="Consulting, advisory, freelance and strategy work" items={BUSINESS_OPPS} profile={profile} onToggle={toggleP} />
        <OpportunityGroup title="Collaboration &amp; Community" description="Publisher partnerships, mentoring, referral programs" items={COMMUNITY_OPPS} profile={profile} onToggle={toggleP} />
      </DiscoverySection>

      {/* Who I Want to Connect With */}
      <DiscoverySection title="Who I Want to Connect With" description="Click the niches you'd most like CULO to match you with — businesses in these industries see you as a fit.">
        <div className="flex flex-wrap gap-2">
          {[...industries.map(i => ({ id: i.id, name: i.name })), { id: 'investors', name: 'Investors' }].map(ind => {
            const active = (profile.idealIndustries ?? []).includes(ind.name)
            return (
              <button
                key={ind.id}
                type="button"
                onClick={() => toggleIdealIndustry(ind.name)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  active
                    ? 'bg-[#C86A43] text-white border-[#C86A43]'
                    : 'bg-white text-[#4B4845] border-[#E8E4DD] hover:border-[#C86A43]/50'
                }`}
              >
                {ind.name}
              </button>
            )
          })}
        </div>
        <div>
          <label className="block text-xs font-medium text-[#6B7280] mb-1.5 mt-1">Anything more specific? (optional)</label>
          <textarea
            value={profile.idealCollaborator ?? ''}
            onChange={e => setP('idealCollaborator', e.target.value || undefined)}
            rows={2}
            className={discoveryInputClass + ' resize-none'}
            placeholder="Bootstrapped, founder-led, not VC-funded."
          />
        </div>
      </DiscoverySection>

      {/* Locations & Markets */}
      <DiscoverySection title="Locations &amp; Markets" description="Where can you work with businesses? Your primary location is already on your profile, add any additional markets here.">
        <div>
          <label className="block text-sm font-medium text-[#2D2A26] mb-1.5">Markets I serve</label>
          <p className="text-xs text-[#9CA3AF] mb-2">Countries or regions, comma separated</p>
          <input
            type="text"
            value={(profile.countries ?? []).join(', ')}
            onChange={e => {
              const vals = e.target.value.split(',').map(v => v.trim()).filter(Boolean)
              setP('countries', vals.length > 0 ? vals : undefined)
            }}
            className={discoveryInputClass}
            placeholder="Australia, New Zealand, UK, Remote — Worldwide"
          />
        </div>
      </DiscoverySection>

      {/* Contact Preference */}
      <DiscoverySection title="Contact Preference" description="How should businesses and collaborators reach out to you?">
        <div className="flex flex-col gap-2.5">
          {([
            { value: 'open',             label: 'Open',             desc: 'Reach out however you prefer — email, DM, form' },
            { value: 'direct-message',   label: 'Direct message',   desc: 'Message me through the CULO platform first' },
            { value: 'email',            label: 'Email',            desc: 'Contact me via email' },
            { value: 'application-form', label: 'Application form', desc: 'Complete a form before I consider it' },
          ] as const).map(opt => (
            <label key={opt.value} className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                name={`contact-${founderId}`}
                value={opt.value}
                checked={(profile.contactPreference ?? 'open') === opt.value}
                onChange={() => setP('contactPreference', opt.value)}
                className="mt-0.5 accent-[#C86A43]"
              />
              <div>
                <p className="text-sm font-medium text-[#2D2A26]">{opt.label}</p>
                <p className="text-xs text-[#9CA3AF]">{opt.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </DiscoverySection>

      <div className="flex items-center gap-3">
        <button onClick={handleSave} className="px-5 py-2.5 bg-[#C86A43] text-white text-sm font-semibold rounded-xl hover:bg-[#b05a35] transition-colors">
          Save Opportunity Matching
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
  const [activeId, setActiveId] = useState<string | null>(() => businesses[0]?.id ?? null)
  const [draft, setDraft] = useState<Business | null>(() => {
    const first = businesses[0]
    if (!first) return null
    return loadDraft<Business>(`culo_v1_business_draft_${first.id}`) ?? first
  })
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

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
      status: 'draft',
      featured: false,
      createdAt: now,
    }
    const result = await updateBusiness(newBiz)
    if (result.success) {
      const refreshed = getBusinesses({ founderId })
      setBusinesses(refreshed)
      setActiveId(newBiz.id)
      setDraft(newBiz)
    }
  }

  async function handleDelete() {
    if (!draft) return
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
    <div className="max-w-2xl flex flex-col gap-5">
      <TabIntro>
        Every business you run. Keep it simple here — logo, description, where you work, what you're
        about. Discovery Profile, Partner Programs and Services live in the full Businesses workspace.
      </TabIntro>

      <div className="flex flex-wrap gap-2">
        {businesses.map(b => {
          // Read the live draft's name for whichever business is active —
          // the businesses array itself only refreshes after Save, so the
          // pill used to keep showing "Untitled business" while typing.
          const liveName = activeId === b.id ? draft?.name : b.name
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
              <MediaUpload value={draft.logo} onChange={v => set('logo', v)} label="Upload logo" aspect="wide"
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
            <div className="flex items-center gap-3">
              <button onClick={() => void handleSave()} disabled={saving}
                className="px-5 py-2.5 bg-[#C86A43] text-white text-sm font-semibold rounded-xl hover:bg-[#b05a35] disabled:opacity-60 transition-colors">
                {saving ? 'Saving…' : 'Save'}
              </button>
              {saved && <p className="text-sm text-[#5E6B4A] font-medium">Saved ✓</p>}
              <Link to={`/dashboard/businesses`} className="text-xs text-[#C86A43] hover:underline font-medium">
                Advanced settings →
              </Link>
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

      {/* Content — same idea as Profile's Content tab, scoped to this
          business. No connector forms here: bring content in from Import,
          this is just where it shows up once it's tagged to this business. */}
      {draft && (() => {
        const businessStories = getStories({ businessId: draft.id })
        const businessImports = importedContentService.getAll({ businessId: draft.id })
        return (
          <div className="bg-white rounded-xl border border-[#E8E4DD] px-5 py-5 flex flex-col gap-4">
            <div>
              <p className="text-sm font-semibold text-[#2D2A26]">Content</p>
              <p className="text-xs text-[#9CA3AF] mt-0.5">Imported and published content tagged to this business.</p>
            </div>
            {businessImports.length === 0 && businessStories.length === 0 ? (
              <p className="text-xs text-[#9CA3AF]">Nothing tagged to this business yet.</p>
            ) : (
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
                        <Link key={story.id} to={`/dashboard/stories?edit=${story.id}`}
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
            )}
          </div>
        )
      })()}
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
  const navigate = useNavigate()
  const currentFounder = getCurrentFounder(user)
  const [draft, setDraft]   = useState<Founder | null>(() => {
    if (!currentFounder) return null
    const saved = loadDraft<Founder>(`culo_v1_profile_draft_${currentFounder.id}`)
    return saved ?? { ...currentFounder }
  })
  const [saved, setSaved]   = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [tab, setTab]       = useState('overview')
  const [faqSuggestions, setFaqSuggestions] = useState<BlogQaPair[] | null>(null)
  const [contentSubTab, setContentSubTab] = useState<'imported' | 'published'>('imported')
  const [importedPlatformFilter, setImportedPlatformFilter] = useState<ImportedContentPlatform | 'all'>('all')
  const [importedChecked, setImportedChecked] = useState<Set<string>>(new Set())
  const [importedBulkPublishing, setImportedBulkPublishing] = useState(false)
  const [importedTick, setImportedTick] = useState(0)

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
  // Only ideas still backed by a live, published story — an idea whose
  // source story was deleted or unpublished shouldn't keep showing here.
  const publishedStoryIds = new Set(getStories({ founderId: draft.id, publicOnly: true }).map(s => s.id))
  const founderIdeas      = getIdeas({ founderId: draft.id })
    .filter(i => i.relatedStoryIds.some(sid => publishedStoryIds.has(sid)))
  const founderLibrary    = getLibraryItems({ founderId: draft.id })
  const founderMedia      = getMedia({ founderId: draft.id })

  // "Today's Recommendations" + "Recent Stories" — folded in from the old
  // standalone Overview/home page (/dashboard/home), merged here so the
  // founder only has one landing place instead of two.
  interface Recommendation { key: string; title: string; action: MissingItem; path: string }
  const recommendations: Recommendation[] = []
  const [founderTop] = missing
  if (founderTop) recommendations.push({ key: `founder-${draft.id}`, title: 'Your founder profile', action: founderTop, path: '/dashboard/profile' })
  for (const b of founderBusinesses) {
    const [top] = getBusinessMissingItems(b)
    if (top) recommendations.push({ key: `biz-${b.id}`, title: b.name, action: top, path: '/dashboard/businesses' })
  }
  for (const s of founderStories) {
    const [top] = getStoryMissingItems(s)
    if (top) recommendations.push({ key: `story-${s.id}`, title: s.title, action: top, path: '/dashboard/stories' })
  }
  if (founderStories.length === 0) {
    recommendations.push({
      key: 'first-story',
      title: 'You haven\'t published a story yet',
      action: { field: 'first-story', label: 'Publish your first story to start growing your presence', action: 'Publish Story', severity: 'critical' },
      path: '/dashboard/publish',
    })
  }
  const pendingMedia = founderMedia.filter(m => m.approvalStatus === 'needs-review' || m.approvalStatus === 'pending').length
  if (pendingMedia > 0) {
    recommendations.push({
      key: 'media-review',
      title: `${pendingMedia} ${pendingMedia === 1 ? 'asset' : 'assets'} uploaded`,
      action: { field: 'media', label: 'Review your uploaded media', action: 'Review Media', severity: 'important' },
      path: '/dashboard/media',
    })
  }
  const topRecommendations = recommendations.slice(0, 6)

  const TABS = [
    { key: 'overview',      label: 'Profile'       },
    { key: 'content',       label: "Content" },
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
        <Field label="Display Name">
          <input type="text" value={draft.name} onChange={e => set('name', e.target.value)} className={inputClass} />
        </Field>
        <Field label="Bio" hint="Write in your own voice — aim for 200+ characters. This is what search engines and the Village show publicly — no separate SEO text to fill in.">
          <textarea id="bio" value={draft.bio} onChange={e => set('bio', e.target.value)} rows={6} className={inputClass + ' resize-y'} />
          <p className="text-xs text-right text-[#9CA3AF] mt-1">{draft.bio.length} chars</p>
        </Field>

        <div>
          <p className="text-sm font-medium text-[#2D2A26] mb-1.5">Search Preview</p>
          <div className="border border-[#E8E4DD] rounded-xl px-4 py-3 bg-white">
            <p className="text-xs text-[#5E6B4A] truncate">culovillage.com/founders/{draft.slug}</p>
            <p className="text-[#1a0dab] text-base leading-snug mt-0.5 truncate">{draft.name}</p>
            <p className="text-xs text-[#4d5156] mt-0.5 line-clamp-2">{draft.bio}</p>
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
              aspect="wide"
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
    const result = await updateFounder(draft)
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
          {saved && <p className="text-sm text-green-600 font-medium">Saved ✓</p>}
          {saveError && <p className="text-sm text-red-600 font-medium">{saveError}</p>}
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

        {/* ── Overview (Profile) ───────────────────────────────────────── */}
        {tab === 'overview' && (
          <div className="max-w-2xl flex flex-col gap-6">

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

            {/* Today's Recommendations */}
            <div>
              <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest mb-3">Today's Recommendations</p>
              {topRecommendations.length === 0 ? (
                <div className="bg-white rounded-xl border border-[#E8E4DD] px-5 py-8 text-center">
                  <p className="text-sm font-semibold text-[#2D2A26]">You're all caught up.</p>
                  <p className="text-xs text-[#9CA3AF] mt-1">Nothing needs your attention right now — great work.</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-[#E8E4DD] divide-y divide-[#F3EDE6]">
                  {topRecommendations.map(rec => (
                    <Link
                      key={rec.key}
                      to={rec.path}
                      className="flex items-center gap-3 px-5 py-3.5 hover:bg-[#FBF8F4] transition-colors group"
                    >
                      <span className="w-5 h-5 rounded-md border-2 border-[#E8E4DD] shrink-0 group-hover:border-[#C86A43] transition-colors" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#2D2A26]">{rec.action.label}</p>
                        <p className="text-xs text-[#9CA3AF] mt-0.5 truncate">{rec.title}</p>
                      </div>
                      <span className="text-xs font-semibold text-[#C86A43] shrink-0">{rec.action.action} →</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-5 gap-3">
              <Link to="/dashboard/businesses" className="bg-white rounded-xl border border-[#E8E4DD] px-4 py-4 text-center hover:border-[#C86A43]/40 transition-colors">
                <p className="text-2xl font-bold text-[#2D2A26]">{founderBusinesses.length}</p>
                <p className="text-xs text-[#9CA3AF] mt-0.5">Businesses</p>
              </Link>
              <Link to="/dashboard/stories" className="bg-white rounded-xl border border-[#E8E4DD] px-4 py-4 text-center hover:border-[#C86A43]/40 transition-colors">
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
        {tab === 'content' && (
          <div className="max-w-4xl flex flex-col gap-5">
            <TabIntro>
              Everything you've brought into the Village, and everything you've published from it — in one place.
            </TabIntro>

            <div className="flex gap-2">
              {(['imported', 'published'] as const).map(t => (
                <button key={t} onClick={() => setContentSubTab(t)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
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
              const shown = importedPlatformFilter === 'all' ? allImported : allImported.filter(i => i.sourcePlatform === importedPlatformFilter)
              const readyItems = shown.filter(i => !i.relatedStoryId && isReadyToPublish(i))

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

              async function handleImportedStatusChange(id: string, status: ImportedContentStatus) {
                importedContentService.updateStatus(id, status)
                if (status === 'published' || status === 'featured') {
                  const item = importedContentService.get(id)
                  if (item && draft && !item.relatedStoryId && isReadyToPublish(item)) {
                    const story = buildStoryFromImport(item, draft)
                    story.status = status
                    const result = await publishStoryCore(story)
                    if (!result.success) setSaveError(result.error ?? 'Could not publish. Please try again.')
                  } else if (item && !isReadyToPublish(item)) {
                    setSaveError('Give this a real title before publishing it.')
                  }
                }
                refreshImported()
              }

              async function handleImportedBulkPublish() {
                if (!draft) return
                setImportedBulkPublishing(true)
                const targets = readyItems.filter(i => importedChecked.has(i.id))
                for (const item of targets) {
                  const story = buildStoryFromImport(item, draft)
                  await publishStoryCore(story)
                }
                setImportedChecked(new Set())
                setImportedBulkPublishing(false)
                refreshImported()
              }

              function handleImportedDelete(id: string) {
                importedContentService.delete(id)
                refreshImported()
              }

              return (
                <div>
                  {platforms.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      <button onClick={() => setImportedPlatformFilter('all')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${importedPlatformFilter === 'all' ? 'bg-[#2D2A26] text-white border-[#2D2A26]' : 'bg-white text-[#6B7280] border-[#E8E4DD] hover:border-[#C86A43]/50'}`}>
                        All {allImported.length}
                      </button>
                      {platforms.map(p => (
                        <button key={p} onClick={() => setImportedPlatformFilter(p)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${importedPlatformFilter === p ? 'bg-[#2D2A26] text-white border-[#2D2A26]' : 'bg-white text-[#6B7280] border-[#E8E4DD] hover:border-[#C86A43]/50'}`}>
                          {IMPORT_PLATFORM_LABELS[p]} {allImported.filter(i => i.sourcePlatform === p).length}
                        </button>
                      ))}
                    </div>
                  )}

                  {saveError && <p className="text-xs text-red-600 font-medium mb-3">{saveError}</p>}

                  {readyItems.length > 0 && (
                    <div className="flex items-center justify-between gap-3 mb-3 px-4 py-2.5 bg-[#FBF1EB] border border-[#F0DDD2] rounded-lg">
                      <label className="flex items-center gap-2 text-xs font-medium text-[#2D2A26] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={importedChecked.size > 0 && importedChecked.size === readyItems.length}
                          onChange={toggleSelectAllReady}
                          className="w-4 h-4 accent-[#C86A43]"
                        />
                        Select all ready to publish ({readyItems.length})
                      </label>
                      <button
                        onClick={() => void handleImportedBulkPublish()}
                        disabled={importedChecked.size === 0 || importedBulkPublishing}
                        className="px-4 py-2 bg-[#C86A43] text-white text-xs font-semibold rounded-lg hover:bg-[#b05a35] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
                      >
                        {importedBulkPublishing ? 'Publishing…' : `Publish ${importedChecked.size || ''} selected`}
                      </button>
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
                          onAdvancedEdit={() => navigate(`/dashboard/import-content?edit=${item.id}`)}
                          onDelete={() => handleImportedDelete(item.id)}
                          onStatusChange={status => void handleImportedStatusChange(item.id, status)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            })()}

            {contentSubTab === 'published' && (
              <div>
                {founderStories.length === 0 ? (
                  <div className="bg-white rounded-xl border border-[#E8E4DD] px-5 py-8 text-center">
                    <p className="text-sm font-semibold text-[#2D2A26]">Everyone starts with one story. Let's publish yours.</p>
                    <Link to="/dashboard/publish" className="inline-flex mt-3 px-4 py-2 bg-[#C86A43] text-white text-xs font-semibold rounded-lg hover:bg-[#b05a35] transition-colors">
                      Publish Story
                    </Link>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border border-[#E8E4DD] divide-y divide-[#F3EDE6]">
                    {founderStories.map(story => {
                      const storyMissing = getStoryMissingItems(story)
                      return (
                        <Link key={story.id} to={`/dashboard/stories?edit=${story.id}`}
                          className="flex items-center gap-4 px-5 py-3.5 hover:bg-[#FBF8F4] transition-colors">
                          <img src={story.coverImage} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0 bg-[#F3EDE6]" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[#2D2A26] truncate">{story.title}</p>
                            <p className="text-xs text-[#9CA3AF] mt-0.5">{story.contentTypes.join(' · ')} · {story.createdAt}</p>
                          </div>
                          {storyMissing.length === 0 ? (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 shrink-0">
                              Ready to publish
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#FBF1EB] text-[#C86A43] shrink-0">
                              {storyMissing.length} recommended
                            </span>
                          )}
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                            story.status === 'published' || story.status === 'featured'
                              ? 'bg-green-100 text-green-700'
                              : story.status === 'draft'
                              ? 'bg-[#F3EDE6] text-[#9CA3AF]'
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            {story.status}
                          </span>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Businesses ────────────────────────────────────────────────── */}
        {tab === 'businesses' && (
          <BusinessesTab founderId={draft.id} founderLocation={draft.location} founderIndustry={draft.industry} />
        )}

        {/* ── FAQ ──────────────────────────────────────────────────────────── */}
        {tab === 'expertise' && (
          <div className="max-w-2xl flex flex-col gap-5">
            <TabIntro>
              Real questions people ask you, with real answers. These help both search engines and
              AI systems understand what you know.
            </TabIntro>

            <div>
              <Field label="Frequently Asked Questions" hint="Real questions people ask you. These help both search engines and AI systems understand what you know.">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <p className="text-[11px] text-[#9CA3AF]">Pull real questions and answers straight from your bio and published stories.</p>
                  <button type="button"
                    onClick={() => setFaqSuggestions(suggestFaqsFromFounder(draft, founderStories))}
                    className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#C86A43] text-white hover:bg-[#B15C38] transition-colors">
                    Suggest FAQs
                  </button>
                </div>
                {faqSuggestions && (
                  <div className="mb-4 flex flex-col gap-2">
                    {faqSuggestions.length === 0 ? (
                      <p className="text-xs text-[#9CA3AF] italic">Nothing found yet — write a bit more in your Bio, or publish a story with a Blog, then try again.</p>
                    ) : faqSuggestions
                      .filter(p => !(draft.faqs ?? []).some(f => f.question === p.question))
                      .map(pair => (
                        <div key={pair.question} className="flex items-start justify-between gap-3 p-3 rounded-lg bg-[#F8F5F0] border border-[#E8E4DD]">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-[#2D2A26]">{pair.question}</p>
                            <p className="text-xs text-[#6B7280] mt-0.5 leading-relaxed">{pair.answer}</p>
                          </div>
                          <button type="button"
                            onClick={() => set('faqs', [...(draft.faqs ?? []), {
                              id: `faq-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                              question: pair.question, answer: pair.answer,
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
              <AppearsOnPanel locations={appearsOn} />
            </div>
          </div>
        )}

        {/* ── Discovery: SEO, GEO, search preview, visibility ─────────────── */}
        {tab === 'discovery' && (
          <div className="max-w-2xl flex flex-col gap-5">
            <TabIntro>
              This is how CULO matches you to businesses, speaking invites and collaborations, based on
              what you're genuinely open to.
            </TabIntro>

            <PublisherDiscoveryProfile
              founderId={draft.id}
              founderTopics={draft.topics ?? []}
              onEditTopics={() => setTab('expertise')}
            />
          </div>
        )}

        {/* ── Settings: publishing preferences, account-level settings ────── */}
        {tab === 'settings' && (
          <div className="max-w-2xl flex flex-col gap-4">
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

      {/* Bottom save bar */}
      <div className="flex items-center justify-end gap-3 px-8 py-4 border-t border-[#E8E4DD] bg-white shrink-0">
        {saved && <p className="text-sm text-green-600 font-medium">Saved ✓</p>}
        {saveError && <p className="text-sm text-red-600 font-medium">{saveError}</p>}
        <button onClick={handleSave} disabled={saving} className="px-5 py-2 bg-[#C86A43] text-white text-sm font-semibold rounded-lg hover:bg-[#b05a35] disabled:opacity-60 transition-colors">
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
