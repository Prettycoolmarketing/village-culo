import { useState, type ReactNode } from 'react'
import { getFounders, updateFounder } from '../../services/founders'
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
import { getFounderMissingItems, getMissingCounts } from '../../utils/missingAssets'
import { getFounderFeaturedIn } from '../../utils/featuredIn'
import type { Founder, Topic } from '../../types'
import type { PublisherPartnerProfile } from '../../types/partnership'

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

// ─── Publisher Discovery Profile ─────────────────────────────────────────────

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

function PublisherDiscoveryProfile({ founderId, founderTopics }: {
  founderId: string
  founderTopics: Topic[]
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

  const discoveryInputClass =
    'w-full px-3 py-2.5 rounded-lg border border-[#E8E4DD] text-sm text-[#2D2A26] bg-white placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#C86A43]/30 focus:border-[#C86A43] transition-colors'

  return (
    <div className="max-w-2xl flex flex-col gap-5 pb-8">

      {/* Value statement */}
      <div className="px-5 py-4 bg-[#5E6B4A]/5 rounded-xl border border-[#5E6B4A]/20">
        <p className="text-sm font-semibold text-[#2D2A26] mb-1">Your Publisher Discovery Profile</p>
        <p className="text-xs text-[#6B7280] leading-relaxed">
          This helps CULO find the right opportunities, recommendations, speaking invites, podcasts, collaborations and businesses for you — based on what you write about and what you're genuinely open to.
        </p>
      </div>

      {/* Status */}
      <DiscoverySection
        title="Discovery Status"
        description="Control whether CULO actively matches you with opportunities and recommendations"
      >
        {/* Enable toggle */}
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

        {/* Availability */}
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

        {/* Visibility */}
        <div>
          <label className="block text-sm font-medium text-[#2D2A26] mb-1.5">Profile Visibility</label>
          <div className="flex flex-col gap-2.5">
            {([
              { value: 'public',       label: 'Public',       desc: 'Visible to anyone on CULO' },
              { value: 'discoverable', label: 'Discoverable', desc: 'Only surfaces when matched to a business or opportunity' },
              { value: 'private',      label: 'Private',      desc: 'Hidden — only you can see this profile' },
            ] as const).map(opt => (
              <label key={opt.value} className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name={`visibility-${founderId}`}
                  value={opt.value}
                  checked={(profile.profileVisibility ?? 'discoverable') === opt.value}
                  onChange={() => setP('profileVisibility', opt.value)}
                  className="mt-0.5 accent-[#C86A43]"
                />
                <div>
                  <p className="text-sm font-medium text-[#2D2A26]">{opt.label}</p>
                  <p className="text-xs text-[#9CA3AF]">{opt.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
      </DiscoverySection>

      {/* For the Record */}
      <DiscoverySection
        title="For the Record"
        description="Write this for CULO's matching engine and for businesses reviewing your profile — not for the public. Be specific and honest."
      >
        <div>
          <label className="block text-sm font-medium text-[#2D2A26] mb-1.5">What do you want to be known for?</label>
          <p className="text-xs text-[#9CA3AF] mb-2">Your professional focus, the problem you solve, or what you'd want a business to know before working with you</p>
          <textarea
            value={profile.professionalBio ?? ''}
            onChange={e => setP('professionalBio', e.target.value || undefined)}
            rows={4}
            className={discoveryInputClass + ' resize-y'}
            placeholder="I help founders tell the story behind their business — not the polished version, the real one. I've published 200+ stories about building slowly, using fewer tools better, and running businesses on your own terms."
          />
        </div>

        {/* Founder topics — read-only reference, no re-entry */}
        {founderTopics.length > 0 && (
          <div>
            <p className="text-xs font-medium text-[#6B7280] mb-2">Your profile topics (from Content tab)</p>
            <div className="flex flex-wrap gap-1.5">
              {founderTopics.map(t => (
                <span key={t.id} className="px-2.5 py-1 rounded-full text-xs bg-[#C86A43]/10 text-[#C86A43] border border-[#C86A43]/20">
                  {t.name}
                </span>
              ))}
            </div>
            <p className="text-xs text-[#9CA3AF] mt-2">
              CULO uses these for opportunity matching.{' '}
              <button
                type="button"
                onClick={() => {/* parent controls tab — user can click Content tab manually */}}
                className="text-[#C86A43] underline-offset-2 hover:underline"
              >
                Edit in the Content tab ↑
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
          <label className="block text-sm font-medium text-[#2D2A26] mb-1.5">Tools & products I use</label>
          <p className="text-xs text-[#9CA3AF] mb-2">One per line — be specific. "Notion" not "productivity tools."</p>
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
        <OpportunityGroup
          title="Speaking & Events"
          description="Keynotes, podcasts, workshops, live appearances"
          items={SPEAKING_OPPS}
          profile={profile}
          onToggle={toggleP}
        />
        <OpportunityGroup
          title="Content & Campaigns"
          description="Guest posts, brand collaborations, sponsored content"
          items={CONTENT_OPPS}
          profile={profile}
          onToggle={toggleP}
        />
        <OpportunityGroup
          title="Business & Advisory"
          description="Consulting, advisory, freelance and strategy work"
          items={BUSINESS_OPPS}
          profile={profile}
          onToggle={toggleP}
        />
        <OpportunityGroup
          title="Collaboration & Community"
          description="Publisher partnerships, mentoring, referral programs"
          items={COMMUNITY_OPPS}
          profile={profile}
          onToggle={toggleP}
        />
      </DiscoverySection>

      {/* Who I Want to Connect With */}
      <DiscoverySection
        title="Who I Want to Connect With"
        description="Describe the types of businesses, founders or collaborators you'd most like CULO to match you with"
      >
        <div>
          <label className="block text-sm font-medium text-[#2D2A26] mb-1.5">Ideal collaborator or business</label>
          <textarea
            value={profile.idealCollaborator ?? ''}
            onChange={e => setP('idealCollaborator', e.target.value || undefined)}
            rows={3}
            className={discoveryInputClass + ' resize-none'}
            placeholder="Bootstrapped software businesses that genuinely care about their customers. Not VC-funded, not growth-at-all-costs. Ideally founder-led with a small team."
          />
        </div>
      </DiscoverySection>

      {/* Locations & Markets */}
      <DiscoverySection
        title="Locations & Markets"
        description="Where can you work with businesses? Your primary location is already on your profile — add any additional markets here."
      >
        <div>
          <label className="block text-sm font-medium text-[#2D2A26] mb-1.5">Markets I serve</label>
          <p className="text-xs text-[#9CA3AF] mb-2">Countries or regions (comma separated)</p>
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
      <DiscoverySection
        title="Contact Preference"
        description="How should businesses and collaborators reach out to you?"
      >
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

      {/* Save */}
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={handleSave}
          className="px-5 py-2.5 bg-[#C86A43] text-white text-sm font-semibold rounded-xl hover:bg-[#b05a35] transition-colors"
        >
          Save Discovery Profile
        </button>
        {saved && <p className="text-sm text-[#5E6B4A] font-medium">Saved ✓</p>}
      </div>
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
    { key: 'overview',      label: 'Overview'          },
    { key: 'content',       label: 'Content'           },
    { key: 'media',         label: 'Media'             },
    { key: 'relationships', label: 'Relationships', badge: founderStories.length + founderIdeas.length },
    { key: 'featured-in',   label: 'Featured In',  badge: featuredIn.length },
    { key: 'seo',           label: 'SEO & GEO'         },
    { key: 'publishing',    label: 'Publishing'        },
    { key: 'discovery',     label: 'Discovery Profile' },
    { key: 'settings',      label: 'Settings'          },
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

        {/* ── Discovery Profile ────────────────────────────────────────── */}
        {tab === 'discovery' && (
          <PublisherDiscoveryProfile
            founderId={draft.id}
            founderTopics={draft.topics ?? []}
          />
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
