import { useState } from 'react'
import { Link } from 'react-router-dom'
import { slugify } from '../../utils/slugify'
import { getFounders, updateFounder } from '../../services/founders'
import { getBusinesses, getBusinessBySlug, updateBusiness } from '../../services/businesses'
import {
  importedContentService,
  buildDraftImport,
  PLATFORM_LABELS,
  detectPlatform,
} from '../../services/importedContent'
import {
  importedContentToInput,
  villageContentIntelligenceService,
} from '../../services/villageIntelligence'
import { locations } from '../../data/locations'
import { industries } from '../../data/industries'
import { topics as ALL_TOPICS } from '../../data/topics'
import type { Founder, Business } from '../../types'
import type { ImportedContent } from '../../types/importedContent'

// ─── Types ───────────────────────────────────────────────────────────────────────

type Step = 0 | 1 | 2 | 3

interface ContentLink {
  url: string
  title: string
  status: 'published' | 'draft'
}

interface BuildResult {
  founderId: string
  founderSlug: string
  founderName: string
  importCount: number
  intelCount: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────────

const STEP_LABELS = ['Founder', 'Business', 'Content', 'Done']

function Field({
  label,
  required,
  error,
  hint,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[#2D2A26] mb-1">
        {label}{required && <span className="text-[#C86A43] ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-[10px] text-[#9CA3AF] mt-1">{hint}</p>}
      {error && <p className="text-[10px] text-red-500 mt-1">{error}</p>}
    </div>
  )
}

const INPUT_CLS =
  'w-full px-3 py-2.5 rounded-xl border border-[#E8E4DD] text-sm text-[#2D2A26] focus:outline-none focus:border-[#C86A43] bg-white placeholder:text-[#9CA3AF]'

const INPUT_ERROR_CLS =
  'w-full px-3 py-2.5 rounded-xl border border-red-300 text-sm text-[#2D2A26] focus:outline-none focus:border-red-500 bg-white placeholder:text-[#9CA3AF]'

// ─── Builder Page ─────────────────────────────────────────────────────────────────

export function DashboardCuratedFounderBuilderPage() {
  const [step, setStep] = useState<Step>(0)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [copied, setCopied] = useState<string | null>(null)
  const [result, setResult] = useState<BuildResult | null>(null)

  // ── Step 0: Founder Details ───────────────────────────────────────────────────
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [locationId, setLocationId] = useState(locations[0]?.id ?? '')
  const [industryId, setIndustryId] = useState('')
  const [customIndustry, setCustomIndustry] = useState('')
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([])
  const [website, setWebsite] = useState('')
  const [linkedin, setLinkedin] = useState('')
  const [instagram, setInstagram] = useState('')
  const [youtube, setYoutube] = useState('')
  const [tiktok, setTiktok] = useState('')
  const [podcast, setPodcast] = useState('')
  const [newsletter, setNewsletter] = useState('')
  const [notes, setNotes] = useState('')

  // ── Step 1: Business ─────────────────────────────────────────────────────────
  const [bizMode, setBizMode] = useState<'none' | 'existing' | 'new'>('none')
  const [existingBizId, setExistingBizId] = useState('')
  const [bizName, setBizName] = useState('')
  const [bizSlug, setBizSlug] = useState('')
  const [bizSlugEdited, setBizSlugEdited] = useState(false)
  const [bizWebsite, setBizWebsite] = useState('')
  const [bizDesc, setBizDesc] = useState('')

  // ── Step 2: Content Links ────────────────────────────────────────────────────
  const [links, setLinks] = useState<ContentLink[]>([
    { url: '', title: '', status: 'published' },
  ])

  // ── Auto slug ────────────────────────────────────────────────────────────────

  function handleNameChange(val: string) {
    setName(val)
    if (!slugEdited) setSlug(slugify(val))
  }

  function handleBizNameChange(val: string) {
    setBizName(val)
    if (!bizSlugEdited) setBizSlug(slugify(val))
  }

  function toggleTopic(id: string) {
    setSelectedTopicIds(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    )
  }

  // ── Clipboard ────────────────────────────────────────────────────────────────

  async function copyText(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      setTimeout(() => setCopied(null), 2000)
    } catch { /* ignore */ }
  }

  // ── Validation ───────────────────────────────────────────────────────────────

  function validateStep0(): boolean {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Required'
    if (!slug.trim()) e.slug = 'Required'
    if (!bio.trim()) e.bio = 'Required'
    if (!locationId) e.locationId = 'Required'
    if (!industryId && !customIndustry.trim()) e.industryId = 'Required'
    if (slug.trim() && getFounders().some(f => f.slug === slug.trim())) {
      e.slug = 'Slug already exists — try a variation'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function validateStep1(): boolean {
    const e: Record<string, string> = {}
    if (bizMode === 'new') {
      if (!bizName.trim()) e.bizName = 'Required'
      if (!bizSlug.trim()) e.bizSlug = 'Required'
      if (bizSlug.trim() && getBusinessBySlug(bizSlug.trim())) {
        e.bizSlug = 'Slug already exists'
      }
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function validateStep2(): boolean {
    const e: Record<string, string> = {}
    links.forEach((link, i) => {
      if (link.url.trim() && !link.title.trim()) {
        e[`link_${i}_title`] = 'Add a title for this link'
      }
    })
    setErrors(e)
    return Object.keys(e).length === 0
  }

  // ── Save ─────────────────────────────────────────────────────────────────────

  function save() {
    const founderId = crypto.randomUUID()
    const now = new Date().toISOString()

    const location = locations.find(l => l.id === locationId) ?? locations[0]

    const resolvedIndustry =
      industryId && industryId !== 'custom'
        ? (industries.find(i => i.id === industryId) ?? {
            id: slugify(customIndustry),
            slug: slugify(customIndustry),
            name: customIndustry.trim(),
          })
        : {
            id: slugify(customIndustry) || 'general',
            slug: slugify(customIndustry) || 'general',
            name: customIndustry.trim() || 'General',
          }

    const resolvedTopics = selectedTopicIds
      .map(id => ALL_TOPICS.find(t => t.id === id))
      .filter((t): t is NonNullable<typeof t> => !!t)

    // Business
    let linkedBusinessId = ''

    if (bizMode === 'existing' && existingBizId) {
      linkedBusinessId = existingBizId
    } else if (bizMode === 'new' && bizName.trim()) {
      const newBizId = crypto.randomUUID()
      const newBiz: Business = {
        id: newBizId,
        slug: bizSlug.trim(),
        name: bizName.trim(),
        tagline: '',
        description: bizDesc.trim() || `${bizName.trim()} — founded by ${name.trim()}.`,
        logo: '/placeholders/village-logo.svg',
        coverImage: '/placeholders/village-cover.svg',
        founderId,
        location,
        industry: resolvedIndustry,
        topics: resolvedTopics,
        website: bizWebsite.trim() || undefined,
        offers: [],
        status: 'published',
        featured: false,
        createdAt: now,
      }
      updateBusiness(newBiz)
      linkedBusinessId = newBizId
    }

    // Founder
    const founder: Founder = {
      id: founderId,
      slug: slug.trim(),
      name: name.trim(),
      bio: bio.trim(),
      avatar: avatarUrl.trim(),
      location,
      industry: resolvedIndustry,
      businessId: linkedBusinessId,
      topics: resolvedTopics,
      website: website.trim() || undefined,
      instagram: instagram.trim() || undefined,
      linkedin: linkedin.trim() || undefined,
      youtube: youtube.trim() || undefined,
      tiktok: tiktok.trim() || undefined,
      podcast: podcast.trim() || undefined,
      newsletter: newsletter.trim() || undefined,
      status: 'published',
      featured: false,
      createdAt: now,
      profileStatus: 'village-curated',
      isClaimable: true,
      curatedBy: 'CULO Village',
      curatedAt: now,
      claimNotes: notes.trim() || undefined,
    }
    updateFounder(founder)

    // Imported content
    const validLinks = links.filter(l => l.url.trim())
    let importCount = 0
    let intelCount = 0

    for (const link of validLinks) {
      const draft = buildDraftImport(founderId, link.url.trim())
      const item: ImportedContent = {
        ...draft,
        title: link.title.trim() || draft.title,
        businessId: linkedBusinessId || undefined,
        status: link.status,
        visibility: link.status === 'published' ? 'public' : 'private',
      }
      importedContentService.upsert(item)
      importCount++

      // Generate intelligence for published items
      if (link.status === 'published') {
        try {
          const input = importedContentToInput(item)
          const intel = villageContentIntelligenceService.analyse(input)
          void villageContentIntelligenceService.upsert(intel)
          intelCount++
        } catch {
          // non-fatal
        }
      }
    }

    setResult({ founderId, founderSlug: slug.trim(), founderName: name.trim(), importCount, intelCount })
    setStep(3)
  }

  // ── Step navigation ───────────────────────────────────────────────────────────

  function handleNext() {
    setErrors({})
    if (step === 0 && validateStep0()) setStep(1)
    else if (step === 1 && validateStep1()) setStep(2)
    else if (step === 2 && validateStep2()) save()
  }

  function handleBack() {
    setErrors({})
    if (step > 0) setStep((step - 1) as Step)
  }

  // ── Content link helpers ──────────────────────────────────────────────────────

  function updateLink(index: number, patch: Partial<ContentLink>) {
    setLinks(prev => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)))
  }

  function addLink() {
    setLinks(prev => [...prev, { url: '', title: '', status: 'published' }])
  }

  function removeLink(index: number) {
    setLinks(prev => prev.filter((_, i) => i !== index))
  }

  // ── Outreach template ─────────────────────────────────────────────────────────

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const profileUrl  = result ? `${origin}/founders/${result.founderSlug}` : ''
  const claimUrl    = result ? `${origin}/claim/${result.founderSlug}` : ''
  const outreachMsg = result
    ? `Hi ${result.founderName}!\n\nI came across your work and added you to CULO Village — a curated directory of Australian founder stories and businesses.\n\nYour public profile is live here: ${profileUrl}\n\nIf you'd like to claim it, edit your details, or start creating content (reels, carousels, blogs) with CULO, you can do that here: ${claimUrl}\n\nIt's completely free to claim. Happy to help you get set up — let me know!`
    : ''

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="p-8 max-w-3xl" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          to="/dashboard/curated-profiles"
          className="text-[#9CA3AF] hover:text-[#C86A43] transition-colors"
          aria-label="Back to Curated Profiles"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#2D2A26]">Add Curated Founder</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">Build a Village profile for an amazing founder</p>
        </div>
      </div>

      {/* Step indicator */}
      {step < 3 && (
        <div className="flex items-center gap-0 mb-8">
          {STEP_LABELS.slice(0, 3).map((label, i) => (
            <div key={label} className="flex items-center">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                i === step
                  ? 'bg-[#C86A43] text-white'
                  : i < step
                    ? 'bg-[#5E6B4A]/15 text-[#5E6B4A]'
                    : 'bg-[#F3EDE6] text-[#9CA3AF]'
              }`}>
                <span className="flex items-center justify-center w-4 h-4 rounded-full bg-white/20 text-[10px] font-bold">
                  {i < step ? '✓' : i + 1}
                </span>
                {label}
              </div>
              {i < 2 && (
                <div className={`w-6 h-px mx-1 ${i < step ? 'bg-[#5E6B4A]/30' : 'bg-[#E8E4DD]'}`} />
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Step 0: Founder Details ─────────────────────────────────────────── */}
      {step === 0 && (
        <div className="space-y-5">

          {/* Name + Slug */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Founder Name" required error={errors.name}>
              <input
                className={errors.name ? INPUT_ERROR_CLS : INPUT_CLS}
                placeholder="e.g. Sarah Mitchell"
                value={name}
                onChange={e => handleNameChange(e.target.value)}
              />
            </Field>
            <Field
              label="Profile Slug"
              required
              error={errors.slug}
              hint={`→ /founders/${slug || 'your-slug'}`}
            >
              <input
                className={errors.slug ? INPUT_ERROR_CLS : INPUT_CLS}
                placeholder="sarah-mitchell"
                value={slug}
                onChange={e => {
                  setSlug(e.target.value)
                  setSlugEdited(true)
                }}
              />
            </Field>
          </div>

          {/* Bio */}
          <Field label="Bio" required error={errors.bio}>
            <textarea
              className={errors.bio ? INPUT_ERROR_CLS : INPUT_CLS}
              rows={3}
              placeholder="Write a short bio about this founder. What they do, who they help, what they're known for."
              value={bio}
              onChange={e => setBio(e.target.value)}
            />
          </Field>

          {/* Location + Industry */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Location" required error={errors.locationId}>
              <select
                className={errors.locationId ? INPUT_ERROR_CLS : INPUT_CLS}
                value={locationId}
                onChange={e => setLocationId(e.target.value)}
              >
                {locations.map(l => (
                  <option key={l.id} value={l.id}>{l.name}, {l.state}</option>
                ))}
              </select>
            </Field>
            <Field label="Industry" required error={errors.industryId}>
              <select
                className={errors.industryId ? INPUT_ERROR_CLS : INPUT_CLS}
                value={industryId}
                onChange={e => setIndustryId(e.target.value)}
              >
                <option value="">Select an industry...</option>
                {industries.map(i => (
                  <option key={i.id} value={i.id}>{i.name}</option>
                ))}
                <option value="custom">Other (type below)</option>
              </select>
              {(industryId === 'custom' || (!industryId && customIndustry)) && (
                <input
                  className={`${INPUT_CLS} mt-2`}
                  placeholder="e.g. Creative Strategy"
                  value={customIndustry}
                  onChange={e => setCustomIndustry(e.target.value)}
                />
              )}
            </Field>
          </div>

          {/* Topics */}
          <Field label="Topics">
            <div className="flex flex-wrap gap-2 mt-1">
              {ALL_TOPICS.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggleTopic(t.id)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    selectedTopicIds.includes(t.id)
                      ? 'bg-[#5E6B4A] border-[#5E6B4A] text-white'
                      : 'bg-white border-[#E8E4DD] text-[#6B7280] hover:border-[#C86A43] hover:text-[#C86A43]'
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </Field>

          {/* Avatar */}
          <Field label="Profile Photo URL" hint="Paste a direct image URL (LinkedIn photo, website headshot, etc.)">
            <input
              className={INPUT_CLS}
              placeholder="https://..."
              value={avatarUrl}
              onChange={e => setAvatarUrl(e.target.value)}
            />
            {avatarUrl && (
              <img
                src={avatarUrl}
                alt="Preview"
                className="mt-2 w-14 h-14 rounded-full object-cover border border-[#E8E4DD]"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            )}
          </Field>

          {/* Social links */}
          <div className="bg-[#F8F5F0] rounded-xl p-4">
            <p className="text-xs font-semibold text-[#2D2A26] mb-3">Social & Web Links</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Website">
                <input className={INPUT_CLS} placeholder="https://..." value={website} onChange={e => setWebsite(e.target.value)} />
              </Field>
              <Field label="LinkedIn Profile">
                <input className={INPUT_CLS} placeholder="https://linkedin.com/in/..." value={linkedin} onChange={e => setLinkedin(e.target.value)} />
              </Field>
              <Field label="Instagram">
                <input className={INPUT_CLS} placeholder="https://instagram.com/..." value={instagram} onChange={e => setInstagram(e.target.value)} />
              </Field>
              <Field label="YouTube Channel">
                <input className={INPUT_CLS} placeholder="https://youtube.com/@..." value={youtube} onChange={e => setYoutube(e.target.value)} />
              </Field>
              <Field label="TikTok Profile">
                <input className={INPUT_CLS} placeholder="https://tiktok.com/@..." value={tiktok} onChange={e => setTiktok(e.target.value)} />
              </Field>
              <Field label="Podcast">
                <input className={INPUT_CLS} placeholder="https://..." value={podcast} onChange={e => setPodcast(e.target.value)} />
              </Field>
              <Field label="Newsletter">
                <input className={INPUT_CLS} placeholder="https://..." value={newsletter} onChange={e => setNewsletter(e.target.value)} />
              </Field>
            </div>
          </div>

          {/* Admin notes */}
          <Field label="Admin Notes" hint="Not shown on profile. For your reference only.">
            <textarea
              className={INPUT_CLS}
              rows={2}
              placeholder="Why you're adding this founder, outreach notes, source..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </Field>
        </div>
      )}

      {/* ── Step 1: Business ────────────────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-5">
          <p className="text-sm text-[#6B7280]">
            Link this founder to an existing business or create a new one. This is optional.
          </p>

          {/* Mode selector */}
          <div className="flex flex-col gap-2">
            {(['none', 'existing', 'new'] as const).map(mode => (
              <label
                key={mode}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-colors ${
                  bizMode === mode
                    ? 'border-[#C86A43] bg-[#C86A43]/5'
                    : 'border-[#E8E4DD] bg-white hover:border-[#C86A43]/40'
                }`}
              >
                <input
                  type="radio"
                  name="bizMode"
                  value={mode}
                  checked={bizMode === mode}
                  onChange={() => setBizMode(mode)}
                  className="accent-[#C86A43]"
                />
                <span className="text-sm font-medium text-[#2D2A26]">
                  {mode === 'none' && 'Skip — no business linked yet'}
                  {mode === 'existing' && 'Link to an existing business'}
                  {mode === 'new' && 'Create a new business record'}
                </span>
              </label>
            ))}
          </div>

          {/* Existing business select */}
          {bizMode === 'existing' && (
            <Field label="Select business">
              <select
                className={INPUT_CLS}
                value={existingBizId}
                onChange={e => setExistingBizId(e.target.value)}
              >
                <option value="">Choose a business...</option>
                {getBusinesses().map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </Field>
          )}

          {/* New business fields */}
          {bizMode === 'new' && (
            <div className="space-y-4 bg-[#F8F5F0] rounded-xl p-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Business Name" required error={errors.bizName}>
                  <input
                    className={errors.bizName ? INPUT_ERROR_CLS : INPUT_CLS}
                    placeholder="e.g. The Bold Studio"
                    value={bizName}
                    onChange={e => handleBizNameChange(e.target.value)}
                  />
                </Field>
                <Field
                  label="Business Slug"
                  required
                  error={errors.bizSlug}
                  hint={`→ /businesses/${bizSlug || 'your-slug'}`}
                >
                  <input
                    className={errors.bizSlug ? INPUT_ERROR_CLS : INPUT_CLS}
                    placeholder="the-bold-studio"
                    value={bizSlug}
                    onChange={e => {
                      setBizSlug(e.target.value)
                      setBizSlugEdited(true)
                    }}
                  />
                </Field>
              </div>
              <Field label="Business Website">
                <input
                  className={INPUT_CLS}
                  placeholder="https://..."
                  value={bizWebsite}
                  onChange={e => setBizWebsite(e.target.value)}
                />
              </Field>
              <Field label="Business Description">
                <textarea
                  className={INPUT_CLS}
                  rows={2}
                  placeholder="What does this business do? Who does it serve?"
                  value={bizDesc}
                  onChange={e => setBizDesc(e.target.value)}
                />
              </Field>
            </div>
          )}
        </div>
      )}

      {/* ── Step 2: Content Links ────────────────────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-4">
          <p className="text-sm text-[#6B7280]">
            Add specific content links — YouTube videos, blog posts, podcast episodes, Instagram posts. These become imported content records on the public profile.
          </p>

          {links.map((link, i) => {
            const platform = link.url ? detectPlatform(link.url) : 'website'
            const platformLabel = PLATFORM_LABELS[platform]
            const PLATFORM_BG: Record<string, string> = {
              youtube:   'bg-red-50 text-red-600',
              vimeo:     'bg-blue-50 text-blue-700',
              instagram: 'bg-pink-50 text-pink-600',
              linkedin:  'bg-blue-50 text-blue-800',
              tiktok:    'bg-neutral-100 text-neutral-700',
              podcast:   'bg-purple-50 text-purple-700',
              website:   'bg-[#F3EDE6] text-[#6B7280]',
            }

            return (
              <div key={i} className="bg-white rounded-xl border border-[#E8E4DD] p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#9CA3AF]">Link {i + 1}</span>
                    {link.url && (
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${PLATFORM_BG[platform]}`}>
                        {platformLabel}
                      </span>
                    )}
                  </div>
                  {links.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLink(i)}
                      className="text-xs text-[#9CA3AF] hover:text-red-500 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-[#6B7280] uppercase tracking-wide mb-1">URL</label>
                    <input
                      className={INPUT_CLS}
                      placeholder="https://youtube.com/watch?v=..."
                      value={link.url}
                      onChange={e => updateLink(i, { url: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="block text-[10px] font-semibold text-[#6B7280] uppercase tracking-wide mb-1">Title</label>
                      <input
                        className={errors[`link_${i}_title`] ? INPUT_ERROR_CLS : INPUT_CLS}
                        placeholder="e.g. How I built my first product"
                        value={link.title}
                        onChange={e => updateLink(i, { title: e.target.value })}
                      />
                      {errors[`link_${i}_title`] && (
                        <p className="text-[10px] text-red-500 mt-1">{errors[`link_${i}_title`]}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-[#6B7280] uppercase tracking-wide mb-1">Status</label>
                      <select
                        className={INPUT_CLS}
                        value={link.status}
                        onChange={e => updateLink(i, { status: e.target.value as 'published' | 'draft' })}
                      >
                        <option value="published">Published</option>
                        <option value="draft">Draft</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}

          {links.length < 8 && (
            <button
              type="button"
              onClick={addLink}
              className="w-full py-3 border-2 border-dashed border-[#E8E4DD] rounded-xl text-sm font-medium text-[#9CA3AF] hover:border-[#C86A43] hover:text-[#C86A43] transition-colors"
            >
              + Add another link
            </button>
          )}

          <div className="bg-[#F8F5F0] rounded-xl px-4 py-3">
            <p className="text-xs text-[#6B7280] leading-relaxed">
              Published links appear on the public profile. Draft links are saved but not visible. YouTube, Vimeo and TikTok links will be embeddable. Intelligence analysis runs automatically on published content.
            </p>
          </div>
        </div>
      )}

      {/* ── Step 3: Done ────────────────────────────────────────────────────── */}
      {step === 3 && result && (
        <div className="space-y-5">

          {/* Success header */}
          <div className="bg-[#5E6B4A]/10 border border-[#5E6B4A]/20 rounded-2xl px-5 py-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[#5E6B4A]/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-[#5E6B4A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-[#2D2A26]">{result.founderName} has been added to CULO Village</p>
              <p className="text-xs text-[#6B7280] mt-0.5">
                Village Curated · Claimable
                {result.importCount > 0 && ` · ${result.importCount} content ${result.importCount === 1 ? 'link' : 'links'} saved`}
                {result.intelCount > 0 && ` · ${result.intelCount} intelligence ${result.intelCount === 1 ? 'record' : 'records'} generated`}
              </p>
            </div>
          </div>

          {/* Claim readiness */}
          <div className="bg-white rounded-xl border border-[#E8E4DD] divide-y divide-[#F3EDE6]">
            {/* Public profile URL */}
            <div className="px-5 py-4">
              <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide mb-2">Public Profile</p>
              <div className="flex items-center gap-3">
                <code className="text-xs text-[#2D2A26] bg-[#F8F5F0] px-3 py-1.5 rounded-lg flex-1 truncate">
                  {profileUrl}
                </code>
                <button
                  onClick={() => copyText(profileUrl, 'profile')}
                  className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                    copied === 'profile'
                      ? 'bg-[#5E6B4A] text-white'
                      : 'bg-[#F3EDE6] text-[#C86A43] hover:bg-[#C86A43] hover:text-white'
                  }`}
                >
                  {copied === 'profile' ? '✓ Copied' : 'Copy'}
                </button>
                <a
                  href={profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 text-xs text-[#9CA3AF] hover:text-[#C86A43] transition-colors"
                >
                  Open ↗
                </a>
              </div>
            </div>

            {/* Claim URL */}
            <div className="px-5 py-4">
              <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide mb-2">Claim URL</p>
              <div className="flex items-center gap-3">
                <code className="text-xs text-[#2D2A26] bg-[#F8F5F0] px-3 py-1.5 rounded-lg flex-1 truncate">
                  {claimUrl}
                </code>
                <button
                  onClick={() => copyText(claimUrl, 'claim')}
                  className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                    copied === 'claim'
                      ? 'bg-[#5E6B4A] text-white'
                      : 'bg-[#F3EDE6] text-[#C86A43] hover:bg-[#C86A43] hover:text-white'
                  }`}
                >
                  {copied === 'claim' ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>

            {/* LinkedIn outreach */}
            <div className="px-5 py-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">LinkedIn Outreach Message</p>
                <button
                  onClick={() => copyText(outreachMsg, 'outreach')}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                    copied === 'outreach'
                      ? 'bg-[#5E6B4A] text-white'
                      : 'bg-[#F3EDE6] text-[#C86A43] hover:bg-[#C86A43] hover:text-white'
                  }`}
                >
                  {copied === 'outreach' ? '✓ Copied' : 'Copy message'}
                </button>
              </div>
              <pre className="text-xs text-[#6B7280] leading-relaxed whitespace-pre-wrap bg-[#F8F5F0] rounded-xl px-4 py-3">
                {outreachMsg}
              </pre>
            </div>
          </div>

          {/* Ethics reminder */}
          <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
            <svg className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <p className="text-xs text-blue-700 leading-relaxed">
              This profile is marked <strong>Village Curated</strong> and shows a claim banner to the founder. All source links are preserved. The profile is clearly not claimed or verified.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 bg-[#C86A43] text-white text-sm font-semibold rounded-xl hover:bg-[#b05a35] transition-colors"
            >
              View public profile ↗
            </a>
            <button
              onClick={() => {
                // Reset all form state
                setName(''); setSlug(''); setSlugEdited(false); setBio(''); setAvatarUrl('')
                setLocationId(locations[0]?.id ?? ''); setIndustryId(''); setCustomIndustry('')
                setSelectedTopicIds([]); setWebsite(''); setLinkedin(''); setInstagram('')
                setYoutube(''); setTiktok(''); setPodcast(''); setNewsletter(''); setNotes('')
                setBizMode('none'); setExistingBizId(''); setBizName(''); setBizSlug('')
                setBizSlugEdited(false); setBizWebsite(''); setBizDesc('')
                setLinks([{ url: '', title: '', status: 'published' }])
                setResult(null); setErrors({})
                setStep(0)
              }}
              className="px-5 py-2.5 bg-[#F3EDE6] text-[#C86A43] text-sm font-semibold rounded-xl hover:bg-[#C86A43] hover:text-white transition-colors"
            >
              Add another founder
            </button>
            <Link
              to="/dashboard/curated-profiles"
              className="text-sm font-medium text-[#6B7280] hover:text-[#2D2A26] transition-colors"
            >
              Back to Curated Profiles
            </Link>
          </div>
        </div>
      )}

      {/* ── Navigation buttons ─────────────────────────────────────────────── */}
      {step < 3 && (
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-[#E8E4DD]">
          <button
            type="button"
            onClick={handleBack}
            disabled={step === 0}
            className="px-5 py-2.5 text-sm font-medium text-[#6B7280] hover:text-[#2D2A26] transition-colors disabled:opacity-30"
          >
            ← Back
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="px-6 py-2.5 bg-[#C86A43] text-white text-sm font-semibold rounded-xl hover:bg-[#b05a35] transition-colors"
          >
            {step === 2 ? 'Save & Publish ✓' : 'Next →'}
          </button>
        </div>
      )}
    </div>
  )
}
