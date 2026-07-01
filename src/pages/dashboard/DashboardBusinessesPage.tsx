import { useState, type ReactNode } from 'react'
import { getBusinesses, updateBusiness } from '../../services/businesses'
import { businessPartnerProfileService, programService, enrollmentService } from '../../services/partnership'
import type { BusinessPartnerProfile, PartnerProgram, PartnerProgramType, DisclosureType } from '../../types/partnership'
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

const BUSINESS_FIELD_TO_TAB: Record<string, string> = {
  logo: 'brand', coverImage: 'brand',
  description: 'content', faqs: 'content',
  website: 'publishing', socials: 'publishing',
  offers: 'offers',
  seoTitle: 'seo', seoDescription: 'seo',
}

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

// ─── Business Discovery Profile ──────────────────────────────────────────────

function SectionCard({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
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

function DiscoveryToggle({ label, description, enabled, onChange, disabled }: {
  label: string; description: string; enabled: boolean; onChange: (v: boolean) => void; disabled?: boolean
}) {
  return (
    <div className={`flex items-center justify-between gap-4 ${disabled ? 'opacity-40' : ''}`}>
      <div>
        <p className="text-sm font-medium text-[#2D2A26]">{label}</p>
        <p className="text-xs text-[#9CA3AF] mt-0.5">{description}</p>
      </div>
      <button
        onClick={() => !disabled && onChange(!enabled)}
        disabled={disabled}
        className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${enabled ? 'bg-[#C86A43]' : 'bg-[#E8E4DD]'}`}
        aria-label={`Toggle ${label}`}
      >
        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  )
}

type ProgramItem = { key: keyof BusinessPartnerProfile; label: string }

function ProgramGroup({ title, description, items, profile, onToggle }: {
  title: string
  description: string
  items: ProgramItem[]
  profile: BusinessPartnerProfile
  onToggle: (key: keyof BusinessPartnerProfile) => void
}) {
  const activeCount = items.filter(i => profile[i.key] as boolean).length
  return (
    <div className="border border-[#E8E4DD] rounded-xl overflow-hidden">
      <div className={`px-4 py-3 flex items-center justify-between gap-3 ${activeCount > 0 ? 'bg-[#C86A43]/5' : 'bg-[#F8F5F0]'}`}>
        <div>
          <p className="text-xs font-semibold text-[#2D2A26]">{title}</p>
          <p className="text-xs text-[#9CA3AF] mt-0.5">{description}</p>
        </div>
        {activeCount > 0 && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#C86A43]/10 text-[#C86A43] font-semibold shrink-0 whitespace-nowrap">
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
              className={`w-9 h-5 rounded-full transition-colors relative shrink-0 ${(profile[key] as boolean) ? 'bg-[#C86A43]' : 'bg-[#E8E4DD]'}`}
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

const RECOMMEND_PROGRAMS: ProgramItem[] = [
  { key: 'affiliateEnabled',  label: 'Affiliate Program — publishers earn commission on sales they refer' },
  { key: 'referralEnabled',   label: 'Referral Program — publishers earn rewards for sign-ups they send' },
  { key: 'creatorEnabled',    label: 'Creator Program — invite publishers to produce content about you' },
  { key: 'ambassadorEnabled', label: 'Ambassador Program — long-term brand ambassador relationships' },
]

const COLLABORATE_PROGRAMS: ProgramItem[] = [
  { key: 'brandCollaborationsEnabled', label: 'Brand Collaborations — co-branded content and campaigns' },
  { key: 'communityPartnerEnabled',    label: 'Community Partner — sponsor or co-run communities' },
  { key: 'mediaPartnerEnabled',        label: 'Media Partner — press and editorial collaboration' },
  { key: 'sponsorEnabled',             label: 'Sponsorships — sponsor publisher content or events' },
  { key: 'technologyPartnerEnabled',   label: 'Technology Partner — API integrations and tech partnerships' },
  { key: 'customPartnershipEnabled',   label: 'Custom — define a unique partnership type' },
]

const CONNECT_PROGRAMS: ProgramItem[] = [
  { key: 'podcastGuestEnabled',         label: 'Podcast Guest — offer guest spots on your podcast' },
  { key: 'workshopPartnerEnabled',      label: 'Workshop Partner — co-create workshops and education' },
  { key: 'speakerOpportunitiesEnabled', label: 'Speaker Opportunities — offer speaking slots at your events' },
]

const CONTENT_TYPE_OPTIONS = ['Blog Post', 'Short-form Reel', 'Carousel', 'Podcast Episode', 'Case Study', 'Tutorial', 'Review', 'Interview']

function BusinessDiscoveryProfile({ businessId, business, onBusinessUpdate }: {
  businessId: string
  business: Business
  onBusinessUpdate: (b: Business) => void
}) {
  const [profile, setProfile] = useState<BusinessPartnerProfile>(
    () => businessPartnerProfileService.getOrCreate(businessId)
  )
  const [localBiz, setLocalBiz] = useState<Business>(business)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  function setP<K extends keyof BusinessPartnerProfile>(key: K, value: BusinessPartnerProfile[K]) {
    setProfile(prev => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  function toggleP(key: keyof BusinessPartnerProfile) {
    setProfile(prev => ({ ...prev, [key]: !(prev[key] as boolean) }))
    setSaved(false)
  }

  function setBizBool(key: 'partnerEnabled' | 'villageProActive', value: boolean) {
    setLocalBiz(prev => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  function toggleIdealTopic(topicId: string) {
    const current = profile.idealTopics ?? []
    setP('idealTopics', current.includes(topicId) ? current.filter(id => id !== topicId) : [...current, topicId])
  }

  function toggleIdealIndustry(industryId: string) {
    const current = profile.idealIndustries ?? []
    setP('idealIndustries', current.includes(industryId) ? current.filter(id => id !== industryId) : [...current, industryId])
  }

  function toggleContentType(ct: string) {
    const current = profile.idealContentTypes ?? []
    setP('idealContentTypes', current.includes(ct) ? current.filter(c => c !== ct) : [...current, ct])
  }

  async function handleSave() {
    setSaveError(null)
    const [profileResult, bizResult] = await Promise.all([
      businessPartnerProfileService.upsert(profile),
      updateBusiness(localBiz),
    ])
    if (!profileResult.success || !bizResult.success) {
      setSaveError(profileResult.error ?? bizResult.error ?? 'Save failed. Please try again.')
      return
    }
    onBusinessUpdate(localBiz)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex flex-col gap-5 pb-8">

      {/* Status */}
      <SectionCard
        title="Discovery Status"
        description="Control whether publishers can find and recommend this business through the Opportunities engine"
      >
        <DiscoveryToggle
          label="Enable Business Discovery Profile"
          description="Allow CULO publishers to find, match with, and recommend this business"
          enabled={localBiz.partnerEnabled ?? false}
          onChange={v => setBizBool('partnerEnabled', v)}
        />
        <DiscoveryToggle
          label="Village Pro"
          description="Unlock advanced features — campaigns, analytics, and priority matching"
          enabled={localBiz.villageProActive ?? false}
          onChange={v => setBizBool('villageProActive', v)}
          disabled={!(localBiz.partnerEnabled ?? false)}
        />
      </SectionCard>

      {/* For Publishers */}
      <SectionCard
        title="For Publishers"
        description="Write this for publishers deciding whether to recommend you — not for customers. Be honest, specific, and plain."
      >
        <Field
          label="Discovery Description"
          hint="What do you do, who do you help, and why would a publisher genuinely recommend you?"
        >
          <textarea
            value={profile.descriptionForDiscovery ?? ''}
            onChange={e => setP('descriptionForDiscovery', e.target.value || undefined)}
            rows={4}
            className={inputClass + ' resize-y'}
            placeholder="We help small business owners manage their finances without needing an accountant. Our software is built for founders who find accounting overwhelming — straightforward pricing, honest support, no lock-in contracts."
          />
        </Field>
      </SectionCard>

      {/* Who You Want to Reach */}
      <SectionCard
        title="Who You Want to Reach"
        description="Help CULO match you with the right publishers and audiences"
      >
        <Field
          label="Ideal Publisher"
          hint="Describe the type of publisher, creator or founder you'd most like to work with — their audience, their topics, their style"
        >
          <textarea
            value={profile.idealPublisher ?? ''}
            onChange={e => setP('idealPublisher', e.target.value || undefined)}
            rows={3}
            className={inputClass + ' resize-none'}
            placeholder="Founders who write about business tools and productivity, with a loyal audience of solo operators and small teams. They use the tools they recommend."
          />
        </Field>
        <Field
          label="Ideal Audience"
          hint="Who is the end audience you want publishers to reach on your behalf?"
        >
          <input
            type="text"
            value={profile.idealAudience ?? ''}
            onChange={e => setP('idealAudience', e.target.value || undefined)}
            className={inputClass}
            placeholder="Small business owners, solo operators, service-based founders, freelancers"
          />
        </Field>
      </SectionCard>

      {/* Discovery Topics & Location */}
      <SectionCard
        title="Topics, Industries & Location"
        description="What topics and industries should a publisher write about to be a strong match for your business?"
      >
        <Field label="Topics" hint="Select the topics that best describe what your business does">
          <div className="flex flex-wrap gap-1.5 mt-1">
            {allTopics.map(topic => {
              const active = (profile.idealTopics ?? []).includes(topic.id)
              return (
                <button
                  key={topic.id}
                  onClick={() => toggleIdealTopic(topic.id)}
                  className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                    active ? 'bg-[#C86A43] text-white border-[#C86A43]' : 'bg-white text-[#4B4845] border-[#E8E4DD] hover:border-[#C86A43]/50'
                  }`}
                >
                  {topic.name}
                </button>
              )
            })}
          </div>
        </Field>
        <Field label="Industries" hint="Which industries are most relevant to your business?">
          <div className="flex flex-wrap gap-1.5 mt-1">
            {industries.map(ind => {
              const active = (profile.idealIndustries ?? []).includes(ind.id)
              return (
                <button
                  key={ind.id}
                  onClick={() => toggleIdealIndustry(ind.id)}
                  className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                    active ? 'bg-[#5E6B4A] text-white border-[#5E6B4A]' : 'bg-white text-[#4B4845] border-[#E8E4DD] hover:border-[#5E6B4A]/50'
                  }`}
                >
                  {ind.name}
                </button>
              )
            })}
          </div>
        </Field>
        <Field
          label="Locations Served"
          hint="Where can publishers promote you? (comma separated)"
        >
          <input
            type="text"
            value={(profile.locationsServed ?? []).join(', ')}
            onChange={e => {
              const vals = e.target.value.split(',').map(v => v.trim()).filter(Boolean)
              setP('locationsServed', vals.length > 0 ? vals : undefined)
            }}
            className={inputClass}
            placeholder="Australia, New Zealand, UK, USA"
          />
        </Field>
      </SectionCard>

      {/* What You're Open To */}
      <SectionCard
        title="What You're Open To"
        description="Tell publishers what kinds of partnerships and collaborations you're looking for. Be selective — publishers take quality signals seriously."
      >
        <ProgramGroup
          title="Recommendations & Referrals"
          description="Publishers earn when they send customers your way"
          items={RECOMMEND_PROGRAMS}
          profile={profile}
          onToggle={toggleP}
        />
        <ProgramGroup
          title="Campaigns & Collaborations"
          description="Working together on content, events and campaigns"
          items={COLLABORATE_PROGRAMS}
          profile={profile}
          onToggle={toggleP}
        />
        <ProgramGroup
          title="Speaking & Events"
          description="Podcast guests, workshops and speaking opportunities"
          items={CONNECT_PROGRAMS}
          profile={profile}
          onToggle={toggleP}
        />
      </SectionCard>

      {/* Recommendation Preferences */}
      <SectionCard
        title="Recommendation Preferences"
        description="Tell publishers what you'd most like them to recommend, and what kind of content works best for your business"
      >
        <Field
          label="What to recommend"
          hint="One item per line — your product, a specific feature, a free trial, the problem you solve"
        >
          <textarea
            value={(profile.recommendationPriorities ?? []).join('\n')}
            onChange={e => {
              const vals = e.target.value.split('\n').map(v => v.trim()).filter(Boolean)
              setP('recommendationPriorities', vals.length > 0 ? vals : undefined)
            }}
            rows={3}
            className={inputClass + ' resize-none'}
            placeholder={'Our invoicing feature\nOur free trial\nThe problem we solve for founders'}
          />
        </Field>
        <Field label="Preferred content formats">
          <div className="flex flex-wrap gap-1.5 mt-1">
            {CONTENT_TYPE_OPTIONS.map(ct => {
              const active = (profile.idealContentTypes ?? []).includes(ct)
              return (
                <button
                  key={ct}
                  onClick={() => toggleContentType(ct)}
                  className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                    active ? 'bg-[#D6A94D] text-white border-[#D6A94D]' : 'bg-white text-[#4B4845] border-[#E8E4DD] hover:border-[#D6A94D]/50'
                  }`}
                >
                  {ct}
                </button>
              )
            })}
          </div>
        </Field>
      </SectionCard>

      {/* Contact & Visibility */}
      <SectionCard
        title="Contact & Visibility"
        description="How should publishers reach you, and who can see this profile?"
      >
        <Field label="How should publishers reach you?">
          <select
            value={profile.contactPreference ?? 'open'}
            onChange={e => setP('contactPreference', e.target.value as BusinessPartnerProfile['contactPreference'])}
            className={inputClass}
          >
            <option value="open">Open — publishers can reach out however they like</option>
            <option value="email">Email — direct contact via email</option>
            <option value="direct-message">Direct message — through the CULO platform</option>
            <option value="application-form">Application form — publishers apply via a form</option>
          </select>
        </Field>
        <Field label="Profile visibility" hint="Who can see this Business Discovery Profile?">
          <div className="flex flex-col gap-3 mt-1">
            {([
              { value: 'public',       label: 'Public',       desc: 'Visible to anyone browsing CULO' },
              { value: 'discoverable', label: 'Discoverable', desc: 'Only surfaces when publishers search or are matched to you' },
              { value: 'private',      label: 'Private',      desc: 'Hidden from everyone — use this while setting up' },
            ] as const).map(opt => (
              <label key={opt.value} className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name={`profileVisibility-${businessId}`}
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
        </Field>
      </SectionCard>

      {/* Save */}
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={() => void handleSave()}
          className="px-5 py-2.5 bg-[#C86A43] text-white text-sm font-semibold rounded-xl hover:bg-[#b05a35] transition-colors"
        >
          Save Discovery Profile
        </button>
        {saved && <p className="text-sm text-[#5E6B4A] font-medium">Saved ✓</p>}
        {saveError && <p className="text-sm text-red-600 font-medium">{saveError}</p>}
      </div>
    </div>
  )
}

// ─── Partner Programs ─────────────────────────────────────────────────────────

const PROGRAM_TYPE_GROUPS: Array<{
  label: string
  description: string
  color: string
  types: PartnerProgramType[]
}> = [
  {
    label: 'Recommend',
    description: 'Publishers earn when they send you customers, sign-ups or awareness',
    color: '#C86A43',
    types: ['affiliate', 'referral', 'creator', 'ambassador'],
  },
  {
    label: 'Create',
    description: 'Publishers make content for or about your business',
    color: '#5E6B4A',
    types: ['influencer', 'media-partner', 'community-partner', 'sponsor'],
  },
  {
    label: 'Connect',
    description: 'Publishers appear at your events, podcasts, workshops and more',
    color: '#D6A94D',
    types: ['podcast-partner', 'speaker-partner', 'workshop-partner', 'event-partner', 'education-partner', 'technology-partner', 'agency-partner', 'reseller', 'marketplace', 'custom'],
  },
]

const PROGRAM_TYPE_LABELS: Partial<Record<PartnerProgramType, string>> = {
  affiliate:            'Affiliate — publishers earn commission on sales they refer',
  referral:             'Referral — publishers earn rewards for sign-ups they send',
  creator:              'Creator — invite publishers to produce content about you',
  ambassador:           'Ambassador — long-term brand representation',
  influencer:           'Sponsored Content — publishers promote you for a fee',
  'media-partner':      'Media Partner — press coverage and editorial',
  'community-partner':  'Community Partner — sponsor or co-run a community',
  sponsor:              'Sponsorship — sponsor publisher content or events',
  'podcast-partner':    'Podcast Guest — offer guest spots on your podcast',
  'speaker-partner':    'Speaking — invite publishers to speak at your events',
  'workshop-partner':   'Workshop Partner — co-create workshops or masterclasses',
  'event-partner':      'Event Partner — co-run or co-sponsor events',
  'education-partner':  'Education Partner — co-create courses or educational content',
  'technology-partner': 'Technology Partner — API integrations and tech collaboration',
  'agency-partner':     'Agency Partner — refer clients and service partners',
  reseller:             'Reseller — publishers sell your products directly',
  marketplace:          'Marketplace — list your products in a publisher marketplace',
  custom:               'Custom — define your own program type',
}

const DISCLOSURE_LABELS: Partial<Record<DisclosureType, string>> = {
  affiliate:          'Affiliate disclosure',
  referral:           'Referral disclosure',
  sponsored:          'Paid / sponsored content',
  gifted:             'Gifted product',
  'paid-partnership': 'Paid partnership',
  ambassador:         'Brand ambassador',
  'creator-program':  'Creator program',
  'community-partner':'Community partner',
  none:               'No disclosure required',
}

function groupLabel(type: PartnerProgramType): string {
  for (const g of PROGRAM_TYPE_GROUPS) {
    if (g.types.includes(type)) return g.label
  }
  return 'Other'
}

function statusColor(status: PartnerProgram['status']): string {
  switch (status) {
    case 'active':   return 'bg-[#5E6B4A]/10 text-[#5E6B4A]'
    case 'paused':   return 'bg-amber-50 text-amber-700'
    case 'draft':    return 'bg-[#F3EDE6] text-[#9CA3AF]'
    case 'inactive': return 'bg-red-50 text-red-500'
    default:         return 'bg-[#F3EDE6] text-[#9CA3AF]'
  }
}

function createBlankProgram(businessId: string): PartnerProgram {
  const ts = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    slug: '',
    name: '',
    businessId,
    programType: 'affiliate',
    status: 'draft',
    featured: false,
    isPublic: false,
    countries: [],
    languages: [],
    industries: [],
    topics: [],
    disclosureType: 'affiliate',
    applicationMode: 'open',
    trackingEnabled: false,
    createdAt: ts,
    updatedAt: ts,
  }
}

// ── ProgramForm ───────────────────────────────────────────────────────────────

function ProgramForm({ initial, onSave, onCancel }: {
  initial: PartnerProgram
  onSave: (p: PartnerProgram) => void
  onCancel: () => void
}) {
  const [p, setP] = useState<PartnerProgram>({ ...initial })
  const [saveError, setSaveError] = useState<string | null>(null)

  function set<K extends keyof PartnerProgram>(key: K, value: PartnerProgram[K]) {
    setP(prev => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    if (!p.name.trim()) return
    setSaveError(null)
    const slug = p.slug.trim() || p.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    const result = await programService.upsert({ ...p, slug })
    if (result.success) onSave({ ...p, slug })
    else setSaveError(result.error ?? 'Save failed. Please try again.')
  }

  const fi = 'w-full px-3 py-2.5 rounded-lg border border-[#E8E4DD] text-sm text-[#2D2A26] bg-white placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#C86A43]/30 focus:border-[#C86A43] transition-colors'

  const isNew = !initial.name

  return (
    <div className="bg-white rounded-xl border border-[#E8E4DD] overflow-hidden">
      <div className="px-5 py-4 border-b border-[#F3EDE6] flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-[#2D2A26]">
          {isNew ? 'New Program' : `Edit — ${initial.name}`}
        </p>
        <button
          onClick={onCancel}
          className="text-xs text-[#9CA3AF] hover:text-[#2D2A26] transition-colors"
        >
          Cancel
        </button>
      </div>

      <div className="px-5 py-5 flex flex-col gap-5">

        {/* Program name */}
        <div>
          <label className="block text-sm font-medium text-[#2D2A26] mb-1.5">Program name</label>
          <input
            type="text"
            value={p.name}
            onChange={e => set('name', e.target.value)}
            className={fi}
            placeholder="e.g. Affiliate Program, Creator Partnership, Podcast Guest"
          />
        </div>

        {/* Program type — grouped select */}
        <div>
          <label className="block text-sm font-medium text-[#2D2A26] mb-1.5">Program type</label>
          <p className="text-xs text-[#9CA3AF] mb-2">Choose the type that best describes this program. This helps CULO match you with the right publishers.</p>
          <div className="flex flex-col gap-3">
            {PROGRAM_TYPE_GROUPS.map(group => (
              <div key={group.label} className="border border-[#E8E4DD] rounded-xl overflow-hidden">
                <div className="px-4 py-2.5 bg-[#F8F5F0] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: group.color }} />
                  <p className="text-xs font-semibold text-[#2D2A26]">{group.label}</p>
                  <p className="text-xs text-[#9CA3AF]">— {group.description}</p>
                </div>
                <div className="divide-y divide-[#F8F5F0]">
                  {group.types.map(type => (
                    <label key={type} className="flex items-start gap-3 px-4 py-2.5 cursor-pointer hover:bg-[#F8F5F0] transition-colors">
                      <input
                        type="radio"
                        name={`type-${initial.id}`}
                        value={type}
                        checked={p.programType === type}
                        onChange={() => {
                          set('programType', type)
                          if (type === 'referral') set('disclosureType', 'referral')
                          else if (type === 'sponsor') set('disclosureType', 'sponsored')
                          else if (type === 'ambassador') set('disclosureType', 'ambassador')
                          else if (type === 'influencer') set('disclosureType', 'paid-partnership')
                          else if (type === 'creator') set('disclosureType', 'creator-program')
                          else if (type === 'community-partner') set('disclosureType', 'community-partner')
                          else set('disclosureType', 'affiliate')
                        }}
                        className="mt-0.5 accent-[#C86A43]"
                      />
                      <p className="text-xs text-[#4B4845]">{PROGRAM_TYPE_LABELS[type] ?? type}</p>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Short description */}
        <div>
          <label className="block text-sm font-medium text-[#2D2A26] mb-1.5">Short description</label>
          <p className="text-xs text-[#9CA3AF] mb-2">One or two sentences. What is this program and why should a publisher care?</p>
          <textarea
            value={p.shortDescription ?? ''}
            onChange={e => set('shortDescription', e.target.value || undefined)}
            rows={2}
            className={fi + ' resize-none'}
            placeholder="We pay publishers 15% commission on every customer they send us who completes a purchase."
          />
        </div>

        {/* Longer description */}
        <div>
          <label className="block text-sm font-medium text-[#2D2A26] mb-1.5">Full description (optional)</label>
          <textarea
            value={p.description ?? ''}
            onChange={e => set('description', e.target.value || undefined)}
            rows={4}
            className={fi + ' resize-y'}
            placeholder="Add more detail about how the program works, what publishers can expect, and any context that helps them decide if this is right for them."
          />
        </div>

        {/* Who it is for */}
        <div>
          <label className="block text-sm font-medium text-[#2D2A26] mb-1.5">Who is this for?</label>
          <p className="text-xs text-[#9CA3AF] mb-2">Describe the type of publisher or creator you're looking for — in plain English.</p>
          <textarea
            value={p.idealPublisher ?? ''}
            onChange={e => set('idealPublisher', e.target.value || undefined)}
            rows={2}
            className={fi + ' resize-none'}
            placeholder="Founders and small business owners with an engaged email list or active blog. Audience should be bootstrapped or indie-minded entrepreneurs."
          />
        </div>

        {/* What publishers get */}
        <div>
          <label className="block text-sm font-medium text-[#2D2A26] mb-1.5">What do publishers get?</label>
          <p className="text-xs text-[#9CA3AF] mb-2">List each reward or benefit, one per line.</p>
          <textarea
            value={(p.rewards ?? []).join('\n')}
            onChange={e => {
              const vals = e.target.value.split('\n').map(v => v.trim()).filter(Boolean)
              set('rewards', vals.length > 0 ? vals : undefined)
            }}
            rows={4}
            className={fi + ' resize-y'}
            placeholder={'15% commission on all referred sales\nFree account upgrade for the publisher\nDedicated affiliate link and dashboard\n30-day cookie window'}
          />
        </div>

        {/* What you're looking for */}
        <div>
          <label className="block text-sm font-medium text-[#2D2A26] mb-1.5">What are you looking for from publishers?</label>
          <p className="text-xs text-[#9CA3AF] mb-2">One requirement per line — be specific and honest.</p>
          <textarea
            value={(p.requirements ?? []).join('\n')}
            onChange={e => {
              const vals = e.target.value.split('\n').map(v => v.trim()).filter(Boolean)
              set('requirements', vals.length > 0 ? vals : undefined)
            }}
            rows={3}
            className={fi + ' resize-y'}
            placeholder={'Must have used the product for at least 30 days\nGenuine recommendation only — no hard selling\nAt least 500 engaged subscribers or regular readers'}
          />
        </div>

        {/* Eligibility */}
        <div>
          <label className="block text-sm font-medium text-[#2D2A26] mb-1.5">Eligibility notes (optional)</label>
          <textarea
            value={p.minimumExperience ?? ''}
            onChange={e => set('minimumExperience', e.target.value || undefined)}
            rows={2}
            className={fi + ' resize-none'}
            placeholder="Open to publishers worldwide. No minimum audience size required — quality over quantity."
          />
        </div>

        {/* Disclosure */}
        <div>
          <label className="block text-sm font-medium text-[#2D2A26] mb-1.5">Disclosure type</label>
          <p className="text-xs text-[#9CA3AF] mb-2">What kind of disclosure must publishers show when recommending you?</p>
          <select
            value={p.disclosureType}
            onChange={e => set('disclosureType', e.target.value as DisclosureType)}
            className={fi}
          >
            {(Object.entries(DISCLOSURE_LABELS) as [DisclosureType, string][]).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
          <div className="mt-2">
            <textarea
              value={p.disclosureText ?? ''}
              onChange={e => set('disclosureText', e.target.value || undefined)}
              rows={2}
              className={fi + ' resize-none'}
              placeholder="Optional: write the disclosure text you'd like publishers to use, e.g. 'This post contains affiliate links. I may earn a commission if you sign up through my link.'"
            />
          </div>
        </div>

        {/* How to apply */}
        <div>
          <label className="block text-sm font-medium text-[#2D2A26] mb-1.5">How can publishers apply or get involved?</label>
          <div className="flex flex-col gap-2">
            {([
              { value: 'open',        label: 'Open access — anyone can join immediately' },
              { value: 'application', label: 'Application — publishers complete a form and you review' },
              { value: 'invitation',  label: 'Invitation only — you invite specific publishers' },
              { value: 'approval',    label: 'Request access — publishers request and you approve' },
            ] as const).map(opt => (
              <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name={`mode-${initial.id}`}
                  value={opt.value}
                  checked={p.applicationMode === opt.value}
                  onChange={() => set('applicationMode', opt.value)}
                  className="accent-[#C86A43]"
                />
                <p className="text-sm text-[#4B4845]">{opt.label}</p>
              </label>
            ))}
          </div>
          {(p.applicationMode === 'application' || p.applicationMode === 'approval') && (
            <div className="mt-3">
              <input
                type="url"
                value={p.applicationUrl ?? ''}
                onChange={e => set('applicationUrl', e.target.value || undefined)}
                className={fi}
                placeholder="https://yoursite.com/partner-application (optional)"
              />
            </div>
          )}
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-[#2D2A26] mb-2">Status</label>
          <div className="flex gap-2 flex-wrap">
            {(['draft', 'active', 'paused', 'inactive'] as const).map(s => (
              <button
                key={s}
                onClick={() => set('status', s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border capitalize transition-colors ${
                  p.status === s
                    ? 'bg-[#2D2A26] text-white border-[#2D2A26]'
                    : 'bg-white text-[#6B7280] border-[#E8E4DD] hover:border-[#C86A43]/50'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <p className="text-xs text-[#9CA3AF] mt-1.5">
            {p.status === 'draft'    && 'Only you can see this. Not visible to publishers.'}
            {p.status === 'active'   && 'Visible to publishers and available for matching.'}
            {p.status === 'paused'   && 'Temporarily hidden while you make changes.'}
            {p.status === 'inactive' && 'This program is closed. Publishers can no longer join.'}
          </p>
        </div>

        {/* Visibility */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-[#2D2A26]">Make publicly listed</p>
            <p className="text-xs text-[#9CA3AF] mt-0.5">When on, this program appears in public directories and can be discovered by any publisher on CULO</p>
          </div>
          <button
            onClick={() => set('isPublic', !p.isPublic)}
            className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${p.isPublic ? 'bg-[#C86A43]' : 'bg-[#E8E4DD]'}`}
          >
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${p.isPublic ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        {/* Save */}
        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={() => void handleSave()}
            disabled={!p.name.trim()}
            className="px-5 py-2.5 bg-[#C86A43] text-white text-sm font-semibold rounded-xl hover:bg-[#b05a35] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Save Program
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2.5 text-sm text-[#6B7280] hover:text-[#2D2A26] transition-colors"
          >
            Cancel
          </button>
          {saveError && <p className="text-sm text-red-600 font-medium">{saveError}</p>}
        </div>

      </div>
    </div>
  )
}

// ── BusinessProgramsTab ───────────────────────────────────────────────────────

function BusinessProgramsTab({ businessId, partnerEnabled }: {
  businessId: string
  partnerEnabled: boolean
}) {
  const [programs, setPrograms] = useState<PartnerProgram[]>(
    () => programService.getAll({ businessId })
  )
  const [view, setView] = useState<'list' | 'new' | string>('list') // 'list' | 'new' | program id
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const editing = view !== 'list' && view !== 'new'
    ? programs.find(p => p.id === view) ?? null
    : null

  function refresh() {
    setPrograms(programService.getAll({ businessId }))
  }

  function handleSave(_saved: PartnerProgram) {
    refresh()
    setView('list')
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Remove this program?')) return
    setDeleteError(null)
    const result = await programService.delete(id)
    if (!result.success) {
      setDeleteError(result.error ?? 'Failed to delete program. Please try again.')
      return
    }
    refresh()
    setView('list')
  }

  // Discovery disabled prompt
  if (!partnerEnabled) {
    return (
      <div className="max-w-xl">
        <div className="bg-white rounded-xl border border-[#E8E4DD] px-6 py-8 text-center">
          <p className="text-sm font-semibold text-[#2D2A26] mb-1">Discovery Profile is off</p>
          <p className="text-xs text-[#9CA3AF] mb-4 max-w-xs mx-auto leading-relaxed">
            Turn on your Business Discovery Profile before creating programs. Publishers can only see your programs when Discovery is active.
          </p>
          <button
            onClick={() => setView('list')}
            className="text-xs text-[#C86A43] underline-offset-2 hover:underline"
          >
            Go to Discovery Profile tab to enable →
          </button>
        </div>
      </div>
    )
  }

  // New program form
  if (view === 'new') {
    return (
      <div className="max-w-2xl">
        <ProgramForm
          initial={createBlankProgram(businessId)}
          onSave={handleSave}
          onCancel={() => setView('list')}
        />
      </div>
    )
  }

  // Edit existing
  if (editing) {
    return (
      <div className="max-w-2xl flex flex-col gap-4">
        <ProgramForm
          initial={editing}
          onSave={handleSave}
          onCancel={() => setView('list')}
        />
        <div className="px-1 flex items-center gap-3">
          <button
            onClick={() => void handleDelete(editing.id)}
            className="text-xs text-red-400 hover:text-red-600 transition-colors"
          >
            Remove this program
          </button>
          {deleteError && <p className="text-xs text-red-600 font-medium">{deleteError}</p>}
        </div>
      </div>
    )
  }

  // List view
  return (
    <div className="max-w-2xl flex flex-col gap-4">

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-[#2D2A26]">Partner Programs</p>
          <p className="text-xs text-[#9CA3AF] mt-0.5">
            Programs tell publishers exactly what you're offering and how to get involved.
          </p>
        </div>
        <button
          onClick={() => setView('new')}
          className="px-4 py-2 bg-[#C86A43] text-white text-xs font-semibold rounded-lg hover:bg-[#b05a35] transition-colors shrink-0"
        >
          + New Program
        </button>
      </div>

      {programs.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E8E4DD] px-6 py-10 text-center">
          <p className="text-sm font-semibold text-[#2D2A26] mb-1">No programs yet</p>
          <p className="text-xs text-[#9CA3AF] mb-4 max-w-xs mx-auto leading-relaxed">
            Create your first program to let publishers know what kinds of collaboration, recommendations, and partnerships you're open to.
          </p>
          <button
            onClick={() => setView('new')}
            className="px-4 py-2 bg-[#C86A43] text-white text-xs font-semibold rounded-lg hover:bg-[#b05a35] transition-colors"
          >
            Create First Program
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {programs.map(prog => (
            <button
              key={prog.id}
              onClick={() => setView(prog.id)}
              className="bg-white rounded-xl border border-[#E8E4DD] px-5 py-4 text-left hover:border-[#C86A43]/40 hover:shadow-sm transition-all group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-[#2D2A26] truncate">{prog.name}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize shrink-0 ${statusColor(prog.status)}`}>
                      {prog.status}
                    </span>
                    {prog.isPublic && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-semibold shrink-0">
                        Public
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#9CA3AF]">
                    {groupLabel(prog.programType)} · {PROGRAM_TYPE_LABELS[prog.programType]?.split(' —')[0] ?? prog.programType}
                  </p>
                  {prog.shortDescription && (
                    <p className="text-xs text-[#6B7280] mt-1.5 line-clamp-2">{prog.shortDescription}</p>
                  )}
                  {(() => {
                    const connectedCount = enrollmentService.getAll({ programId: prog.id, status: 'active' }).length
                    return connectedCount > 0 ? (
                      <p className="text-xs text-[#5E6B4A] font-semibold mt-1">
                        {connectedCount} {connectedCount === 1 ? 'founder' : 'founders'} connected
                      </p>
                    ) : null
                  })()}
                </div>
                <span className="text-[#9CA3AF] text-sm group-hover:text-[#C86A43] transition-colors shrink-0">›</span>
              </div>
            </button>
          ))}
        </div>
      )}

      <p className="text-xs text-[#9CA3AF] px-1">
        Programs are matched to publishers via the Opportunity Engine and shown publicly on your business page. Founders can join programs through the Revenue section.
      </p>
    </div>
  )
}

// ─── Business detail pane ──────────────────────────────────────────────────────

function BusinessDetailPane({ biz, onSave }: { biz: Business; onSave: (b: Business) => void }) {
  const [draft, setDraft]   = useState<Business>({ ...biz })
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
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
    { key: 'partnership',   label: 'Discovery Profile' },
    { key: 'programs',      label: 'Programs', badge: programService.getAll({ businessId: draft.id }).length },
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

  async function handleSave() {
    setSaving(true)
    setSaveError(null)
    const result = await updateBusiness(draft)
    setSaving(false)
    if (result.success) {
      setSaved(true)
      onSave(draft)
    } else {
      setSaveError(result.error ?? 'Save failed. Please try again.')
    }
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
          {saveError && <span className="text-xs text-red-600 font-medium">{saveError}</span>}
          <a href={`/businesses/${draft.slug}`} target="_blank" rel="noopener noreferrer"
            className="px-2.5 py-1.5 text-xs text-[#6B7280] border border-[#E8E4DD] rounded-lg hover:text-[#C86A43] hover:border-[#C86A43]/40 transition-colors">
            View ↗
          </a>
          <button onClick={() => void handleSave()} disabled={saving}
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
                <p className="text-xs text-[#9CA3AF]">To Improve</p>
              </div>
            </div>
            <MissingAssetsPanel
              items={missing}
              onAction={(item) => setTab(BUSINESS_FIELD_TO_TAB[item.field] ?? 'content')}
            />
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

        {/* Discovery Profile */}
        {tab === 'partnership' && (
          <BusinessDiscoveryProfile
            businessId={draft.id}
            business={draft}
            onBusinessUpdate={updated => {
              setDraft(updated)
              onSave(updated)
            }}
          />
        )}

        {tab === 'programs' && (
          <BusinessProgramsTab
            businessId={draft.id}
            partnerEnabled={!!draft.partnerEnabled}
          />
        )}

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
            const recommended = missing.filter(m => m.severity === 'critical').length
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
                {recommended > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#FBF1EB] text-[#C86A43] shrink-0">{recommended}</span>
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
