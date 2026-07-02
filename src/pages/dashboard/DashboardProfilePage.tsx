import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { getCurrentFounder } from '../../services/currentFounder'
import { updateFounder, deleteFounder } from '../../services/founders'
import { getBusinesses } from '../../services/businesses'
import { EmptyState } from '../../components/ui/EmptyState'
import { ConfirmButton } from '../../components/ui/ConfirmButton'
import { publisherPartnerProfileService } from '../../services/partnership'
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
import { getFounderMissingItems, getMissingCounts, type MissingItem } from '../../utils/missingAssets'
import { getFounderFeaturedIn } from '../../utils/featuredIn'
import { focusField } from '../../utils/focusField'
import type { Founder, Topic, FAQ, SocialLink, SocialPlatform, Status } from '../../types'
import type { PublisherPartnerProfile } from '../../types/partnership'

// Every existing field keeps its home; this map only changed which tab a
// recommendation jumps to, not what data exists.
const FIELD_TO_TAB: Record<string, string> = {
  avatar: 'identity', coverImage: 'identity', bio: 'identity', socials: 'identity',
  topics: 'expertise', faqs: 'expertise',
  website: 'identity',
  seoTitle: 'discovery', seoDescription: 'discovery',
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

  function setP<K extends keyof PublisherPartnerProfile>(key: K, value: PublisherPartnerProfile[K]) {
    setProfile(prev => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  function toggleP(key: keyof PublisherPartnerProfile) {
    setProfile(prev => ({ ...prev, [key]: !(prev[key] as boolean) }))
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

      {/* What I Genuinely Use & Recommend */}
      <DiscoverySection
        title="What I Genuinely Use & Recommend"
        description="List the tools, products, services and businesses you actually use and would genuinely recommend to others. One per line. CULO uses this to detect future recommendations in your stories."
      >
        <div>
          <label className="block text-sm font-medium text-[#2D2A26] mb-1.5">Tools &amp; products I use</label>
          <p className="text-xs text-[#9CA3AF] mb-2">One per line, be specific. "Notion" not "productivity tools."</p>
          <textarea
            value={(profile.genuineRecommendations ?? []).join('\n')}
            onChange={e => {
              const vals = e.target.value.split('\n').map(v => v.trim()).filter(Boolean)
              setP('genuineRecommendations', vals.length > 0 ? vals : undefined)
            }}
            rows={6}
            className={discoveryInputClass + ' resize-y'}
            placeholder={'Notion\nCanva\nStripe\nMailchimp\nClaude\nXero\nSquarespace'}
          />
          <p className="text-xs text-[#9CA3AF] mt-1.5">These are the businesses CULO will look for in your stories first.</p>
        </div>
      </DiscoverySection>

      {/* Opportunities I'm Open To */}
      <DiscoverySection
        title="Opportunities I'm Open To"
        description="Be selective. Only turn on what you'd genuinely say yes to. Businesses see this when deciding whether to reach out."
      >
        <OpportunityGroup title="Speaking &amp; Events" description="Keynotes, podcasts, workshops, live appearances" items={SPEAKING_OPPS} profile={profile} onToggle={toggleP} />
        <OpportunityGroup title="Content &amp; Campaigns" description="Guest posts, brand collaborations, sponsored content" items={CONTENT_OPPS} profile={profile} onToggle={toggleP} />
        <OpportunityGroup title="Business &amp; Advisory" description="Consulting, advisory, freelance and strategy work" items={BUSINESS_OPPS} profile={profile} onToggle={toggleP} />
        <OpportunityGroup title="Collaboration &amp; Community" description="Publisher partnerships, mentoring, referral programs" items={COMMUNITY_OPPS} profile={profile} onToggle={toggleP} />
      </DiscoverySection>

      {/* Who I Want to Connect With */}
      <DiscoverySection title="Who I Want to Connect With" description="Describe the types of businesses, founders or collaborators you'd most like CULO to match you with">
        <textarea
          value={profile.idealCollaborator ?? ''}
          onChange={e => setP('idealCollaborator', e.target.value || undefined)}
          rows={3}
          className={discoveryInputClass + ' resize-none'}
          placeholder="Bootstrapped software businesses that genuinely care about their customers. Not VC-funded, not growth-at-all-costs. Ideally founder-led with a small team."
        />
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

// ─── FAQ editor ─────────────────────────────────────────────────────────────────

function FAQEditor({ faqs, onChange }: { faqs: FAQ[]; onChange: (faqs: FAQ[]) => void }) {
  function add() {
    onChange([...faqs, { id: `faq-${Date.now()}`, question: '', answer: '', topicIds: [], expertiseIds: [], relatedStoryIds: [], relatedIdeaIds: [] }])
  }
  function update(i: number, patch: Partial<FAQ>) {
    onChange(faqs.map((f, idx) => idx === i ? { ...f, ...patch } : f))
  }
  function remove(i: number) {
    onChange(faqs.filter((_, idx) => idx !== i))
  }
  return (
    <div className="flex flex-col gap-3">
      {faqs.map((faq, i) => (
        <div key={faq.id} className="border border-[#E8E4DD] rounded-xl p-3 flex flex-col gap-2 bg-white">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-widest">Question {i + 1}</span>
            <button onClick={() => remove(i)} className="text-xs text-[#9CA3AF] hover:text-red-500">Remove</button>
          </div>
          <input type="text" value={faq.question} onChange={e => update(i, { question: e.target.value })}
            placeholder="A question people ask you" className={inputClass} />
          <textarea value={faq.answer} onChange={e => update(i, { answer: e.target.value })} rows={2}
            placeholder="Your answer" className={inputClass + ' resize-none'} />
        </div>
      ))}
      <button onClick={add} className="text-xs font-semibold text-[#C86A43] hover:underline text-left">
        + Add a question
      </button>
    </div>
  )
}

// ─── DashboardProfilePage ──────────────────────────────────────────────────────

export function DashboardProfilePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const currentFounder = getCurrentFounder(user)
  const [draft, setDraft]   = useState<Founder | null>(() => currentFounder ? { ...currentFounder } : null)
  const [saved, setSaved]   = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [tab, setTab]       = useState('overview')

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
  const featuredIn  = getFounderFeaturedIn(draft.id)

  // Relationships — everything this founder is connected to across the Village.
  const founderBusinesses = getBusinesses().filter(b => b.founderId === draft.id)
  const founderStories    = getStories({ founderId: draft.id })
  const founderIdeas      = getIdeas({ founderId: draft.id })
  const founderLibrary    = getLibraryItems({ founderId: draft.id })

  const TABS = [
    { key: 'overview',      label: 'Overview'      },
    { key: 'identity',      label: 'Identity'      },
    { key: 'expertise',     label: 'Expertise'     },
    { key: 'discovery',     label: 'Discovery'     },
    { key: 'relationships', label: 'Relationships', badge: founderBusinesses.length + founderStories.length + founderIdeas.length + founderLibrary.length + featuredIn.length },
    { key: 'settings',      label: 'Settings'      },
  ]

  function set<K extends keyof Founder>(key: K, value: Founder[K]) {
    setDraft(prev => prev ? { ...prev, [key]: value } : prev)
    setSaved(false)
  }

  function toggleTopic(topic: Topic) {
    setDraft(prev => {
      if (!prev) return prev
      const has = prev.topics.some(t => t.id === topic.id)
      setSaved(false)
      return { ...prev, topics: has ? prev.topics.filter(t => t.id !== topic.id) : [...prev.topics, topic] }
    })
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
    if (result.success) setSaved(true)
    else setSaveError(result.error ?? 'Save failed. Please try again.')
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

        {/* ── Overview ─────────────────────────────────────────────────── */}
        {tab === 'overview' && (
          <div className="max-w-2xl flex flex-col gap-6">
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-[#E8E4DD] px-4 py-4 text-center">
                <p className="text-2xl font-bold text-[#2D2A26]">{founderBusinesses.length}</p>
                <p className="text-xs text-[#9CA3AF] mt-0.5">Businesses</p>
              </div>
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
              <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest mb-3">Profile Progress</p>
              <MissingAssetsPanel
                items={missing}
                onAction={(item: MissingItem) => { setTab(FIELD_TO_TAB[item.field] ?? 'identity'); focusField(item.field) }}
              />
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

        {/* ── Identity: name, bio, photo, cover, links ────────────────────── */}
        {tab === 'identity' && (
          <div className="max-w-2xl flex flex-col gap-5">
            <TabIntro>
              This is how people first recognise you across the Village: your name, your photo and the
              story you tell about yourself. It's the foundation everything else builds on.
            </TabIntro>

            <Field label="Display Name">
              <input type="text" value={draft.name} onChange={e => set('name', e.target.value)} className={inputClass} />
            </Field>
            <Field label="Bio" hint="Write in your own voice — aim for 200+ characters.">
              <textarea id="bio" value={draft.bio} onChange={e => set('bio', e.target.value)} rows={6} className={inputClass + ' resize-y'} />
              <p className="text-xs text-right text-[#9CA3AF] mt-1">{draft.bio.length} chars</p>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Profile Photo" hint="Square, min 400×400px.">
                <div className="flex gap-3 items-start mt-1">
                  <img src={draft.avatar || '/placeholders/village-logo.svg'} alt="" className="w-16 h-16 rounded-full object-cover shrink-0 bg-[#F3EDE6] border border-[#E8E4DD]" />
                  <div className="flex-1">
                    <input id="avatar" type="url" value={draft.avatar} onChange={e => set('avatar', e.target.value)} className={inputClass} placeholder="/assets/your-headshot.jpg" />
                    {draft.avatar.includes('/placeholders/') && (
                      <p className="text-xs text-red-600 mt-1.5">Using a placeholder. Upload a real photo.</p>
                    )}
                  </div>
                </div>
              </Field>
              <Field label="Cover Image" hint="16:9 recommended.">
                <div className="flex flex-col gap-2 mt-1">
                  {draft.coverImage && (
                    <img src={draft.coverImage} alt="" className="w-full h-16 rounded-lg object-cover bg-[#F3EDE6] border border-[#E8E4DD]" />
                  )}
                  <input id="coverImage" type="url" value={draft.coverImage ?? ''} onChange={e => set('coverImage', e.target.value || undefined)} className={inputClass} placeholder="/assets/your-cover.jpg" />
                </div>
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
          </div>
        )}

        {/* ── Expertise: topics, industry, location, FAQs ─────────────────── */}
        {tab === 'expertise' && (
          <div className="max-w-2xl flex flex-col gap-5">
            <TabIntro>
              This is what connects you to the Village knowledge graph. Topics, industry and location
              determine which stories, ideas and businesses you're linked to, and what you show up for
              in search.
            </TabIntro>

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

            <Field label="Topics" hint="What would you like people to discover you for? These power the knowledge graph.">
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

            <div className="border-t border-[#E8E4DD] pt-5">
              <Field label="Frequently Asked Questions" hint="Real questions people ask you. These help both search engines and AI systems understand what you know.">
                <FAQEditor faqs={draft.faqs ?? []} onChange={v => set('faqs', v)} />
              </Field>
            </div>
          </div>
        )}

        {/* ── Discovery: SEO, GEO, search preview, visibility ─────────────── */}
        {tab === 'discovery' && (
          <div className="max-w-2xl flex flex-col gap-5">
            <TabIntro>
              This controls how your profile appears in search results and whether it's public at all.
              Getting this right is what makes the difference between being found and being invisible.
            </TabIntro>

            <Field label="Public Visibility" hint="Only published profiles are indexed by search and appear across the Village.">
              <div className="flex gap-2 flex-wrap">
                {(['draft', 'submitted', 'published', 'featured', 'archived'] as Status[]).map(s => (
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
              <p className={`text-xs mt-2 ${isPublic ? 'text-green-600' : 'text-[#9CA3AF]'}`}>
                {isPublic ? 'Your profile is public and discoverable.' : 'Your profile is hidden from public search and directories.'}
              </p>
            </Field>

            <Field label="SEO Title" hint="Shown in browser tab and search results. ~60 chars.">
              <input id="seoTitle" type="text" value={draft.seoTitle ?? ''} onChange={e => set('seoTitle', e.target.value || undefined)} className={inputClass} placeholder="Shakas — Founder Storytelling &amp; Content Systems" />
              <p className="text-xs text-right text-[#9CA3AF] mt-1">{(draft.seoTitle ?? '').length}/60</p>
            </Field>
            <Field label="SEO Description" hint="Shown in search results. 140 to 160 characters is ideal.">
              <textarea id="seoDescription" value={draft.seoDescription ?? ''} onChange={e => set('seoDescription', e.target.value || undefined)} rows={3} className={inputClass + ' resize-none'} placeholder="15+ years turning founder stories into content systems that build visibility, trust and sales." />
              <p className="text-xs text-right text-[#9CA3AF] mt-1">{(draft.seoDescription ?? '').length}/160</p>
            </Field>

            {/* Search preview — real data, no new field, just a rendering of it */}
            <div>
              <p className="text-sm font-medium text-[#2D2A26] mb-1.5">Search Preview</p>
              <div className="border border-[#E8E4DD] rounded-xl px-4 py-3 bg-white">
                <p className="text-xs text-[#5E6B4A] truncate">culovillage.com/founders/{draft.slug}</p>
                <p className="text-[#1a0dab] text-base leading-snug mt-0.5 truncate">{draft.seoTitle || draft.name}</p>
                <p className="text-xs text-[#4d5156] mt-0.5 line-clamp-2">{draft.seoDescription || draft.bio}</p>
              </div>
            </div>

            <div className="border-t border-[#E8E4DD] pt-5">
              <p className="text-sm font-semibold text-[#2D2A26] mb-3">Opportunity Matching</p>
              <p className="text-xs text-[#9CA3AF] mb-4">
                Beyond search engines, this is how CULO matches you to businesses, speaking invites and
                collaborations based on what you're genuinely open to.
              </p>
              <PublisherDiscoveryProfile
                founderId={draft.id}
                founderTopics={draft.topics ?? []}
                onEditTopics={() => setTab('expertise')}
              />
            </div>
          </div>
        )}

        {/* ── Relationships: businesses, stories, ideas, library, featured ── */}
        {tab === 'relationships' && (
          <div className="max-w-2xl flex flex-col gap-6">
            <TabIntro>
              Everything you've published connects back to you. This is where you can see and jump to
              every business, story, idea and piece of content linked to your profile, and everywhere
              in the Village you're featured.
            </TabIntro>
            <RelationshipsPanel
              groups={[
                {
                  title: 'Businesses',
                  items: founderBusinesses.map(b => ({
                    id: b.id, label: b.name, sublabel: b.tagline,
                    path: `/businesses/${b.slug}`, image: b.logo,
                  })),
                },
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
            <div>
              <p className="text-sm font-semibold text-[#2D2A26] mb-2">Featured In</p>
              <FeaturedInPanel locations={featuredIn} />
            </div>
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
