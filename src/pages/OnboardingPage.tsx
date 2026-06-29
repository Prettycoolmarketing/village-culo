import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePageTitle } from '../utils/usePageTitle'
import { slugify } from '../utils/slugify'
import { updateFounder } from '../services/founders'
import { updateBusiness } from '../services/businesses'
import { updateService } from '../services/serviceOfferings'
import { locations } from '../data/locations'
import { industries } from '../data/industries'
import { topics } from '../data/topics'
import type { Founder, Business, Service, Offer, Topic } from '../types'

// ─── Step definitions ─────────────────────────────────────────────────────────

type Step = 'welcome' | 'profile' | 'social' | 'business' | 'offers' | 'services' | 'review' | 'done'

const STEPS: Step[] = ['welcome', 'profile', 'social', 'business', 'offers', 'services', 'review', 'done']

function stepIndex(s: Step) { return STEPS.indexOf(s) }
function stepLabel(s: Step) {
  return { welcome: 'Welcome', profile: 'Your Profile', social: 'Links', business: 'Your Business', offers: 'Offers', services: 'Services', review: 'Review', done: 'Published' }[s]
}

// ─── Draft state ──────────────────────────────────────────────────────────────

interface DraftOffer { id: string; title: string; description: string; ctaLabel: string; ctaUrl: string }
interface DraftService { id: string; name: string; description: string; price: string; ctaLabel: string; ctaUrl: string }

interface Draft {
  name: string
  bio: string
  avatar: string
  coverImage: string
  locationId: string
  industryId: string
  topicIds: string[]
  website: string
  instagram: string
  linkedin: string
  businessName: string
  businessTagline: string
  businessDescription: string
  businessLogo: string
  businessCover: string
  businessIndustryId: string
  businessLocationId: string
  businessWebsite: string
  offers: DraftOffer[]
  services: DraftService[]
}

const empty: Draft = {
  name: '', bio: '', avatar: '', coverImage: '',
  locationId: '', industryId: '', topicIds: [],
  website: '', instagram: '', linkedin: '',
  businessName: '', businessTagline: '', businessDescription: '',
  businessLogo: '', businessCover: '',
  businessIndustryId: '', businessLocationId: '', businessWebsite: '',
  offers: [],
  services: [],
}

// ─── Shared UI primitives ─────────────────────────────────────────────────────

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-charcoal mb-1">
        {label}{required && <span className="text-primary ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

function TextInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full border border-border rounded-xl px-3 py-2 text-sm text-charcoal placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
    />
  )
}

function TextArea({ value, onChange, placeholder, rows = 4 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full border border-border rounded-xl px-3 py-2 text-sm text-charcoal placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white resize-none"
    />
  )
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full border border-border rounded-xl px-3 py-2 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
    >
      <option value="">Select…</option>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

function TopicPicker({ selected, onChange }: { selected: string[]; onChange: (ids: string[]) => void }) {
  function toggle(id: string) {
    onChange(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id])
  }
  return (
    <div className="flex flex-wrap gap-2">
      {topics.map(t => (
        <button
          key={t.id}
          type="button"
          onClick={() => toggle(t.id)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            selected.includes(t.id)
              ? 'bg-primary text-white border-primary'
              : 'bg-white text-muted border-border hover:border-primary hover:text-primary'
          }`}
        >
          {t.name}
        </button>
      ))}
    </div>
  )
}

// ─── Step panels ─────────────────────────────────────────────────────────────

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="text-center max-w-lg mx-auto">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
        <span className="text-3xl">🏡</span>
      </div>
      <h2 className="font-heading text-3xl font-bold text-charcoal mb-4">Welcome to the Village.</h2>
      <p className="font-body text-base text-muted leading-relaxed mb-8">
        You're about to create your Publisher account. This takes about 5 minutes. At the end, your founder profile and business will be live on CULO Village — ready to receive stories, ideas and connections.
      </p>
      <p className="font-body text-sm text-muted mb-8">
        Everything you enter here is saved to your browser. You can edit it all from your dashboard after you publish.
      </p>
      <button
        onClick={onNext}
        className="px-8 py-3 bg-primary text-white rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors"
      >
        Get started
      </button>
    </div>
  )
}

function ProfileStep({ draft, set }: { draft: Draft; set: (k: keyof Draft, v: unknown) => void }) {
  const locationOpts = locations.map(l => ({ value: l.id, label: `${l.name}, ${l.state}` }))
  const industryOpts = industries.map(i => ({ value: i.id, label: i.name }))
  return (
    <div className="space-y-5">
      <h2 className="font-heading text-xl font-bold text-charcoal">Your founder profile</h2>
      <Field label="Full name" required>
        <TextInput value={draft.name} onChange={v => set('name', v)} placeholder="e.g. Shakas Parata" />
      </Field>
      <Field label="Bio" required>
        <TextArea value={draft.bio} onChange={v => set('bio', v)} placeholder="A paragraph about who you are and what you do in the Village." rows={5} />
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label="Location" required>
          <Select value={draft.locationId} onChange={v => set('locationId', v)} options={locationOpts} />
        </Field>
        <Field label="Industry" required>
          <Select value={draft.industryId} onChange={v => set('industryId', v)} options={industryOpts} />
        </Field>
      </div>
      <Field label="Profile photo URL">
        <TextInput value={draft.avatar} onChange={v => set('avatar', v)} placeholder="https://…" />
      </Field>
      <Field label="Cover image URL">
        <TextInput value={draft.coverImage} onChange={v => set('coverImage', v)} placeholder="https://… (optional)" />
      </Field>
      <Field label="Topics (select all that apply)">
        <TopicPicker selected={draft.topicIds} onChange={v => set('topicIds', v)} />
      </Field>
    </div>
  )
}

function SocialStep({ draft, set }: { draft: Draft; set: (k: keyof Draft, v: unknown) => void }) {
  return (
    <div className="space-y-5">
      <h2 className="font-heading text-xl font-bold text-charcoal">Your links</h2>
      <p className="font-body text-sm text-muted">These appear on your public profile and help visitors find you.</p>
      <Field label="Website">
        <TextInput value={draft.website} onChange={v => set('website', v)} placeholder="https://yoursite.com" />
      </Field>
      <Field label="Instagram">
        <TextInput value={draft.instagram} onChange={v => set('instagram', v)} placeholder="https://instagram.com/yourhandle" />
      </Field>
      <Field label="LinkedIn">
        <TextInput value={draft.linkedin} onChange={v => set('linkedin', v)} placeholder="https://linkedin.com/in/yourprofile" />
      </Field>
    </div>
  )
}

function BusinessStep({ draft, set }: { draft: Draft; set: (k: keyof Draft, v: unknown) => void }) {
  const locationOpts = locations.map(l => ({ value: l.id, label: `${l.name}, ${l.state}` }))
  const industryOpts = industries.map(i => ({ value: i.id, label: i.name }))
  return (
    <div className="space-y-5">
      <h2 className="font-heading text-xl font-bold text-charcoal">Your business</h2>
      <Field label="Business name" required>
        <TextInput value={draft.businessName} onChange={v => set('businessName', v)} placeholder="e.g. Pretty Cool Marketing" />
      </Field>
      <Field label="Tagline" required>
        <TextInput value={draft.businessTagline} onChange={v => set('businessTagline', v)} placeholder="One line that says what you do." />
      </Field>
      <Field label="Description" required>
        <TextArea value={draft.businessDescription} onChange={v => set('businessDescription', v)} placeholder="A few sentences about the business — its story, purpose and what makes it worth discovering." rows={5} />
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label="Industry" required>
          <Select value={draft.businessIndustryId} onChange={v => set('businessIndustryId', v)} options={industryOpts} />
        </Field>
        <Field label="Location" required>
          <Select value={draft.businessLocationId} onChange={v => set('businessLocationId', v)} options={locationOpts} />
        </Field>
      </div>
      <Field label="Logo URL">
        <TextInput value={draft.businessLogo} onChange={v => set('businessLogo', v)} placeholder="https://…" />
      </Field>
      <Field label="Cover image URL">
        <TextInput value={draft.businessCover} onChange={v => set('businessCover', v)} placeholder="https://… (optional)" />
      </Field>
      <Field label="Business website">
        <TextInput value={draft.businessWebsite} onChange={v => set('businessWebsite', v)} placeholder="https://yoursite.com" />
      </Field>
    </div>
  )
}

function OffersStep({ draft, set }: { draft: Draft; set: (k: keyof Draft, v: unknown) => void }) {
  function addOffer() {
    const next: DraftOffer = { id: `offer-${Date.now()}`, title: '', description: '', ctaLabel: 'Learn more', ctaUrl: '' }
    set('offers', [...draft.offers, next])
  }
  function updateOffer(i: number, k: keyof DraftOffer, v: string) {
    const next = draft.offers.map((o, idx) => idx === i ? { ...o, [k]: v } : o)
    set('offers', next)
  }
  function removeOffer(i: number) {
    set('offers', draft.offers.filter((_, idx) => idx !== i))
  }
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-heading text-xl font-bold text-charcoal">Offers &amp; CTAs</h2>
        <p className="font-body text-sm text-muted mt-1">Add the things you want visitors to do — book a call, buy a product, join a community. You can add more from your dashboard later.</p>
      </div>
      {draft.offers.map((o, i) => (
        <div key={o.id} className="border border-border rounded-2xl p-4 space-y-3 bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted uppercase tracking-widest">Offer {i + 1}</span>
            <button type="button" onClick={() => removeOffer(i)} className="text-xs text-muted hover:text-red-500 transition-colors">Remove</button>
          </div>
          <TextInput value={o.title} onChange={v => updateOffer(i, 'title', v)} placeholder="Offer title" />
          <TextArea value={o.description} onChange={v => updateOffer(i, 'description', v)} placeholder="Short description…" rows={2} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <TextInput value={o.ctaLabel} onChange={v => updateOffer(i, 'ctaLabel', v)} placeholder="Button label" />
            <TextInput value={o.ctaUrl} onChange={v => updateOffer(i, 'ctaUrl', v)} placeholder="https://…" />
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={addOffer}
        className="w-full border-2 border-dashed border-border rounded-2xl py-4 text-sm font-medium text-muted hover:border-primary hover:text-primary transition-colors"
      >
        + Add an offer
      </button>
      <p className="text-xs text-muted">Offers are optional. You can skip this step and add them later.</p>
    </div>
  )
}

function ServicesStep({ draft, set }: { draft: Draft; set: (k: keyof Draft, v: unknown) => void }) {
  function addService() {
    const next: DraftService = { id: `svc-${Date.now()}`, name: '', description: '', price: '', ctaLabel: 'Book now', ctaUrl: '' }
    set('services', [...draft.services, next])
  }
  function updateSvc(i: number, k: keyof DraftService, v: string) {
    const next = draft.services.map((s, idx) => idx === i ? { ...s, [k]: v } : s)
    set('services', next)
  }
  function removeSvc(i: number) {
    set('services', draft.services.filter((_, idx) => idx !== i))
  }
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-heading text-xl font-bold text-charcoal">Services</h2>
        <p className="font-body text-sm text-muted mt-1">Structured service offerings that appear on your business profile. Fully optional — add them now or from the dashboard later.</p>
      </div>
      {draft.services.map((s, i) => (
        <div key={s.id} className="border border-border rounded-2xl p-4 space-y-3 bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted uppercase tracking-widest">Service {i + 1}</span>
            <button type="button" onClick={() => removeSvc(i)} className="text-xs text-muted hover:text-red-500 transition-colors">Remove</button>
          </div>
          <TextInput value={s.name} onChange={v => updateSvc(i, 'name', v)} placeholder="Service name" />
          <TextArea value={s.description} onChange={v => updateSvc(i, 'description', v)} placeholder="What's included…" rows={3} />
          <TextInput value={s.price} onChange={v => updateSvc(i, 'price', v)} placeholder="Price (optional, e.g. From $1,500)" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <TextInput value={s.ctaLabel} onChange={v => updateSvc(i, 'ctaLabel', v)} placeholder="Button label" />
            <TextInput value={s.ctaUrl} onChange={v => updateSvc(i, 'ctaUrl', v)} placeholder="https://…" />
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={addService}
        className="w-full border-2 border-dashed border-border rounded-2xl py-4 text-sm font-medium text-muted hover:border-primary hover:text-primary transition-colors"
      >
        + Add a service
      </button>
    </div>
  )
}

function ReviewStep({ draft }: { draft: Draft }) {
  const location = locations.find(l => l.id === draft.locationId)
  const industry = industries.find(i => i.id === draft.industryId)
  const bizLocation = locations.find(l => l.id === draft.businessLocationId)
  const bizIndustry = industries.find(i => i.id === draft.businessIndustryId)
  const selectedTopics = topics.filter(t => draft.topicIds.includes(t.id))

  function Row({ label, value }: { label: string; value: string }) {
    return (
      <div className="flex gap-4 py-2 border-b border-border last:border-0">
        <span className="text-xs font-semibold text-muted w-32 shrink-0 pt-0.5">{label}</span>
        <span className="text-sm text-charcoal">{value || <span className="text-muted italic">—</span>}</span>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <h2 className="font-heading text-xl font-bold text-charcoal">Review before publishing</h2>

      <div className="bg-surface rounded-2xl border border-border p-5">
        <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">Founder</p>
        <Row label="Name" value={draft.name} />
        <Row label="Location" value={location ? `${location.name}, ${location.state}` : ''} />
        <Row label="Industry" value={industry?.name ?? ''} />
        <Row label="Topics" value={selectedTopics.map(t => t.name).join(', ')} />
        <Row label="Website" value={draft.website} />
        <Row label="Instagram" value={draft.instagram} />
      </div>

      <div className="bg-surface rounded-2xl border border-border p-5">
        <p className="text-xs font-semibold text-accent uppercase tracking-widest mb-3">Business</p>
        <Row label="Name" value={draft.businessName} />
        <Row label="Tagline" value={draft.businessTagline} />
        <Row label="Location" value={bizLocation ? `${bizLocation.name}, ${bizLocation.state}` : ''} />
        <Row label="Industry" value={bizIndustry?.name ?? ''} />
        <Row label="Offers" value={draft.offers.length > 0 ? `${draft.offers.length} offer${draft.offers.length !== 1 ? 's' : ''}` : 'None'} />
        <Row label="Services" value={draft.services.length > 0 ? `${draft.services.length} service${draft.services.length !== 1 ? 's' : ''}` : 'None'} />
      </div>

      <p className="font-body text-sm text-muted">
        Everything publishes immediately and appears on your public profile. You can edit all of this from the dashboard after publishing.
      </p>
    </div>
  )
}

function DoneStep({ founderSlug }: { founderSlug: string }) {
  const navigate = useNavigate()
  return (
    <div className="text-center max-w-lg mx-auto">
      <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center mx-auto mb-6">
        <span className="text-3xl">✓</span>
      </div>
      <h2 className="font-heading text-3xl font-bold text-charcoal mb-4">You're in the Village.</h2>
      <p className="font-body text-base text-muted leading-relaxed mb-8">
        Your profile and business are now live. Head to your public profile to see how you appear to visitors, or go straight to the dashboard to publish your first story.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={() => navigate(`/founders/${founderSlug}`)}
          className="px-6 py-3 bg-primary text-white rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors"
        >
          View your profile
        </button>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-6 py-3 border border-border text-charcoal rounded-xl font-medium text-sm hover:border-primary hover:text-primary transition-colors"
        >
          Go to dashboard
        </button>
      </div>
    </div>
  )
}

// ─── Main onboarding page ────────────────────────────────────────────────────

export function OnboardingPage() {
  usePageTitle('Get started')

  const [step, setStep] = useState<Step>('welcome')
  const [draft, setDraft] = useState<Draft>(empty)
  const [publishing, setPublishing] = useState(false)
  const [founderSlug, setFounderSlug] = useState('')

  function set(k: keyof Draft, v: unknown) {
    setDraft(prev => ({ ...prev, [k]: v }))
  }

  function next() {
    const idx = stepIndex(step)
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1])
  }

  function back() {
    const idx = stepIndex(step)
    if (idx > 0) setStep(STEPS[idx - 1])
  }

  function canAdvance(): boolean {
    if (step === 'profile') return !!draft.name && !!draft.bio && !!draft.locationId && !!draft.industryId
    if (step === 'business') return !!draft.businessName && !!draft.businessTagline && !!draft.businessDescription && !!draft.businessIndustryId && !!draft.businessLocationId
    return true
  }

  function publish() {
    setPublishing(true)

    const founderSlugVal = slugify(draft.name)
    const founderId      = crypto.randomUUID()
    const businessSlug   = slugify(draft.businessName)
    const businessId     = crypto.randomUUID()

    const selectedTopics: Topic[] = topics.filter(t => draft.topicIds.includes(t.id))
    const location = locations.find(l => l.id === draft.locationId)!
    const industry = industries.find(i => i.id === draft.industryId)!
    const bizLocation = locations.find(l => l.id === draft.businessLocationId)!
    const bizIndustry = industries.find(i => i.id === draft.businessIndustryId)!

    const now = new Date().toISOString()

    const founder: Founder = {
      id: founderId,
      slug: founderSlugVal,
      name: draft.name,
      bio: draft.bio,
      avatar: draft.avatar || '/placeholders/village-founder.svg',
      coverImage: draft.coverImage || undefined,
      location,
      industry,
      businessId,
      topics: selectedTopics,
      website: draft.website || undefined,
      instagram: draft.instagram || undefined,
      linkedin: draft.linkedin || undefined,
      status: 'published',
      featured: false,
      createdAt: now,
    }

    const offers: Offer[] = draft.offers.map(o => ({
      id: o.id,
      title: o.title,
      description: o.description,
      ctaLabel: o.ctaLabel,
      ctaUrl: o.ctaUrl,
    }))

    const business: Business = {
      id: businessId,
      slug: businessSlug,
      name: draft.businessName,
      tagline: draft.businessTagline,
      description: draft.businessDescription,
      logo: draft.businessLogo || '/placeholders/village-business.svg',
      coverImage: draft.businessCover || '/placeholders/village-cover.svg',
      founderId,
      location: bizLocation,
      industry: bizIndustry,
      topics: selectedTopics,
      website: draft.businessWebsite || undefined,
      offers,
      status: 'published',
      featured: false,
      createdAt: now,
    }

    updateFounder(founder)
    updateBusiness(business)

    draft.services.forEach(s => {
      const svc: Service = {
        id: s.id,
        slug: slugify(s.name),
        name: s.name,
        description: s.description,
        price: s.price || undefined,
        businessId,
        founderId,
        topicIds: draft.topicIds,
        expertiseIds: [],
        ctaLabel: s.ctaLabel,
        ctaUrl: s.ctaUrl,
      }
      updateService(svc)
    })

    setFounderSlug(founderSlugVal)
    setPublishing(false)
    setStep('done')
  }

  const idx = stepIndex(step)
  const isFirst = step === 'welcome'
  const isReview = step === 'review'
  const isDone = step === 'done'
  const totalSteps = STEPS.length - 2 // exclude welcome + done from progress

  return (
    <div className="min-h-screen bg-background pt-20 pb-20">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">

        {/* ── Progress bar ─────────────────────────────────────────────────── */}
        {!isFirst && !isDone && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              {STEPS.slice(1, -1).map((s, i) => (
                <div
                  key={s}
                  className={`h-1 flex-1 rounded-full transition-colors ${i < idx ? 'bg-primary' : i === idx - 1 ? 'bg-primary' : 'bg-border'}`}
                />
              ))}
            </div>
            <p className="text-xs text-muted">
              Step {idx} of {totalSteps} — {stepLabel(step)}
            </p>
          </div>
        )}

        {/* ── Step content ─────────────────────────────────────────────────── */}
        <div className="bg-surface rounded-2xl border border-border p-6 sm:p-8 shadow-sm">
          {step === 'welcome'  && <WelcomeStep onNext={next} />}
          {step === 'profile'  && <ProfileStep draft={draft} set={set} />}
          {step === 'social'   && <SocialStep draft={draft} set={set} />}
          {step === 'business' && <BusinessStep draft={draft} set={set} />}
          {step === 'offers'   && <OffersStep draft={draft} set={set} />}
          {step === 'services' && <ServicesStep draft={draft} set={set} />}
          {step === 'review'   && <ReviewStep draft={draft} />}
          {step === 'done'     && <DoneStep founderSlug={founderSlug} />}
        </div>

        {/* ── Navigation ───────────────────────────────────────────────────── */}
        {!isFirst && !isDone && (
          <div className="flex items-center justify-between mt-6">
            <button
              onClick={back}
              className="px-5 py-2.5 text-sm font-medium text-muted hover:text-charcoal transition-colors"
            >
              ← Back
            </button>

            {isReview ? (
              <button
                onClick={publish}
                disabled={publishing}
                className="px-8 py-3 bg-primary text-white rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {publishing ? 'Publishing…' : 'Publish to the Village'}
              </button>
            ) : (
              <button
                onClick={next}
                disabled={!canAdvance()}
                className="px-6 py-2.5 bg-charcoal text-white rounded-xl font-medium text-sm hover:bg-charcoal/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continue →
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
