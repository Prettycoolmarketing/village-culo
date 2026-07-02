import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePageTitle } from '../utils/usePageTitle'
import { slugify } from '../utils/slugify'
import { useAuth } from '../contexts/AuthContext'
import { linkOwnFounder } from '../services/currentFounder'
import { updateFounder } from '../services/founders'
import { updateBusiness } from '../services/businesses'
import { updateService } from '../services/serviceOfferings'
import { uploadFile } from '../lib/storage'
import { isSupabaseConfigured } from '../lib/supabase'
import { locations } from '../data/locations'
import { industries } from '../data/industries'
import { topics } from '../data/topics'
import type { Founder, Business, Service, Topic, Location, Industry, SocialLink, SocialPlatform } from '../types'

// ─── Step definitions ─────────────────────────────────────────────────────────

type Step = 'welcome' | 'account' | 'profile' | 'social' | 'business' | 'offers' | 'services' | 'review' | 'done'

const STEPS: Step[] = ['welcome', 'account', 'profile', 'social', 'business', 'offers', 'services', 'review', 'done']

function stepIndex(s: Step) { return STEPS.indexOf(s) }
function stepLabel(s: Step) {
  return { welcome: 'Welcome', account: 'Your Account', profile: 'Your Profile', social: 'Links', business: 'Your Business', offers: 'Offers', services: 'Services', review: 'Review', done: 'Published' }[s]
}

const OTHER_ID = '__other__'

// ─── Draft state ──────────────────────────────────────────────────────────────

interface DraftOffer { id: string; title: string; description: string; ctaLabel: string; ctaUrl: string }
interface DraftService { id: string; name: string; description: string; price: string; ctaLabel: string; ctaUrl: string }
interface DraftSocialLink { id: string; platform: SocialPlatform; url: string; label: string }

interface DraftBusiness {
  id: string
  name: string
  tagline: string
  description: string
  logo: string
  coverImage: string
  industryId: string
  industryOther: string
  locationId: string
  locationOther: string
  locationType: 'online' | 'service-area' | 'physical' | 'storefront'
  website: string
}

interface Draft {
  name: string
  bio: string
  avatar: string
  coverImage: string
  locationId: string
  locationOther: string
  industryId: string
  industryOther: string
  topicIds: string[]
  socialLinks: DraftSocialLink[]
  businesses: DraftBusiness[]
  offers: DraftOffer[]
  services: DraftService[]
}

function newBusiness(): DraftBusiness {
  return {
    id: `biz-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: '', tagline: '', description: '',
    logo: '', coverImage: '',
    industryId: '', industryOther: '',
    locationId: '', locationOther: '',
    locationType: 'physical',
    website: '',
  }
}

const empty: Draft = {
  name: '', bio: '', avatar: '', coverImage: '',
  locationId: '', locationOther: '', industryId: '', industryOther: '', topicIds: [],
  socialLinks: [],
  businesses: [newBusiness()],
  offers: [],
  services: [],
}

// ─── Shared UI primitives ─────────────────────────────────────────────────────

function Field({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-charcoal mb-1">
        {label}{required && <span className="text-primary ml-0.5">*</span>}
      </label>
      {hint && <p className="text-xs text-muted mb-1.5">{hint}</p>}
      {children}
    </div>
  )
}

function TextInput({ value, onChange, placeholder, type = 'text' }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input
      type={type}
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

// ─── Searchable select with an "Other" escape hatch ────────────────────────────
// Nobody should ever feel excluded because their city or industry isn't in a
// fixed list. Typing filters the list; picking "Other" reveals a free text
// field instead of forcing a nearest-match guess.

function SearchSelect({ value, otherValue, onChange, onOtherChange, options, placeholder }: {
  value: string
  otherValue: string
  onChange: (id: string) => void
  onOtherChange: (text: string) => void
  options: { id: string; label: string; sublabel?: string }[]
  placeholder: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const selected = options.find(o => o.id === value)
  const isOther = value === OTHER_ID
  const filtered = options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-2 border border-border rounded-xl px-3 py-2 text-sm text-left bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
      >
        <span className={selected || isOther ? 'text-charcoal' : 'text-muted'}>
          {isOther ? 'Other' : selected ? selected.label : placeholder}
        </span>
        <svg className="w-4 h-4 text-muted shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-border rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-border">
            <input
              autoFocus
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search…"
              className="w-full px-2.5 py-1.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>
          <div className="max-h-56 overflow-y-auto">
            {filtered.map(o => (
              <button
                key={o.id}
                type="button"
                onClick={() => { onChange(o.id); setOpen(false); setQuery('') }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-surface transition-colors ${value === o.id ? 'bg-primary/5 text-primary font-medium' : 'text-charcoal'}`}
              >
                {o.label}
                {o.sublabel && <span className="text-muted"> · {o.sublabel}</span>}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-3 py-3 text-xs text-muted">No matches. Choose "Other" below.</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => { onChange(OTHER_ID); setOpen(false); setQuery('') }}
            className="w-full text-left px-3 py-2.5 text-sm font-medium text-primary border-t border-border hover:bg-primary/5 transition-colors"
          >
            Other — not listed here
          </button>
        </div>
      )}

      {isOther && (
        <div className="mt-2">
          <TextInput value={otherValue} onChange={onOtherChange} placeholder="Type it in" />
        </div>
      )}
    </div>
  )
}

// ─── Image upload with local preview ───────────────────────────────────────────
// Founders paste nothing. A file picked here uploads immediately and shows
// exactly what will appear on the public profile.

function ImageUpload({ value, onChange, label, aspect = 'square' }: {
  value: string
  onChange: (url: string) => void
  label: string
  aspect?: 'square' | 'wide'
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    if (!isSupabaseConfigured) {
      setError('Connect Supabase to enable uploads.')
      return
    }
    setUploading(true)
    const result = await uploadFile(file)
    setUploading(false)
    if (result.error) setError(result.error)
    else onChange(result.url)
  }

  return (
    <div>
      <input ref={inputRef} type="file" accept="image/*" onChange={e => void handleFile(e)} className="hidden" />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className={`w-full border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-primary transition-colors overflow-hidden ${
          aspect === 'square' ? 'h-32' : 'h-40'
        }`}
      >
        {value ? (
          <img src={value} alt="" className="w-full h-full object-cover" />
        ) : (
          <>
            <svg className="w-6 h-6 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span className="text-xs font-medium text-muted">{uploading ? 'Uploading…' : label}</span>
          </>
        )}
      </button>
      {value && (
        <button type="button" onClick={() => onChange('')} className="text-xs text-muted hover:text-red-500 mt-1.5 transition-colors">
          Remove
        </button>
      )}
      {error && <p className="text-xs text-red-600 mt-1.5">{error}</p>}
    </div>
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
      <h2 className="font-heading text-3xl font-bold text-charcoal mb-4">Your work deserves to be found.</h2>
      <p className="font-body text-base text-muted leading-relaxed mb-4">
        Village is where founders build a lasting, discoverable body of work: your story, your business and everything you know, connected in one place. The more you publish, the easier it becomes for the right people to find you.
      </p>
      <p className="font-body text-sm text-muted mb-8">
        Setting up takes a few minutes. Nothing goes live until you review it at the end, and you can keep editing everything from your dashboard afterwards.
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

function AccountStep({ onDone }: { onDone: () => void }) {
  const { isConfigured, signIn, signUp } = useAuth()
  const [mode, setMode] = useState<'signup' | 'signin'>('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [checkEmail, setCheckEmail] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!email.trim() || !password) {
      setError('Enter your email and a password.')
      return
    }
    if (mode === 'signup' && password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setSubmitting(true)
    // Dev mode (no Supabase) has no real signup — signIn() in dev mode creates
    // an equivalent local session for either mode, so reuse it.
    const result = mode === 'signup' && isConfigured
      ? await signUp(email.trim(), password)
      : await signIn(email.trim(), password)
    setSubmitting(false)
    if (result.error) { setError(result.error); return }
    if ('needsConfirmation' in result && result.needsConfirmation) {
      setCheckEmail(true)
      return
    }
    onDone()
  }

  if (checkEmail) {
    return (
      <div className="text-center max-w-md mx-auto">
        <h2 className="font-heading text-xl font-bold text-charcoal mb-3">Check your email</h2>
        <p className="font-body text-sm text-muted leading-relaxed">
          We sent a confirmation link to <span className="font-medium text-charcoal">{email}</span>. Click it, then come back here to keep going.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto">
      <h2 className="font-heading text-xl font-bold text-charcoal mb-1">Create your account</h2>
      <p className="font-body text-sm text-muted mb-6">
        This is what you will use to sign in and manage your profile afterwards.
      </p>
      {!isConfigured && (
        <div className="mb-5 px-3 py-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-700">
          Dev mode — any credentials will work.
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Email" required>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="email"
            className="w-full border border-border rounded-xl px-3 py-2 text-sm text-charcoal placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
            placeholder="you@example.com"
          />
        </Field>
        <Field label="Password" required>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            className="w-full border border-border rounded-xl px-3 py-2 text-sm text-charcoal placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
            placeholder="••••••••"
          />
        </Field>
        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full px-6 py-3 bg-primary text-white rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-60"
        >
          {submitting ? 'Just a moment…' : mode === 'signup' ? 'Create account & continue' : 'Sign in & continue'}
        </button>
      </form>
      <p className="text-center text-xs text-muted mt-4">
        {mode === 'signup' ? (
          <>Already have an account? <button onClick={() => setMode('signin')} className="text-primary hover:underline font-medium">Sign in →</button></>
        ) : (
          <>New here? <button onClick={() => setMode('signup')} className="text-primary hover:underline font-medium">Create an account →</button></>
        )}
      </p>
    </div>
  )
}

function ProfileStep({ draft, set }: { draft: Draft; set: (k: keyof Draft, v: unknown) => void }) {
  const locationOpts = locations.map(l => ({ id: l.id, label: l.name, sublabel: l.state || undefined }))
  const industryOpts = industries.map(i => ({ id: i.id, label: i.name }))
  return (
    <div className="space-y-5">
      <h2 className="font-heading text-xl font-bold text-charcoal">Your founder profile</h2>
      <Field label="Full name" required>
        <TextInput value={draft.name} onChange={v => set('name', v)} placeholder="e.g. Shakas Designer" />
      </Field>
      <Field label="Bio" required hint="What you do and who you help. This is often the first thing people read.">
        <TextArea value={draft.bio} onChange={v => set('bio', v)} placeholder="A paragraph about who you are and what you do in the Village." rows={5} />
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label="Location" required>
          <SearchSelect
            value={draft.locationId}
            otherValue={draft.locationOther}
            onChange={v => set('locationId', v)}
            onOtherChange={v => set('locationOther', v)}
            options={locationOpts}
            placeholder="Search for your city…"
          />
        </Field>
        <Field label="Industry" required>
          <SearchSelect
            value={draft.industryId}
            otherValue={draft.industryOther}
            onChange={v => set('industryId', v)}
            onOtherChange={v => set('industryOther', v)}
            options={industryOpts}
            placeholder="Search for your industry…"
          />
        </Field>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label="Profile photo">
          <ImageUpload value={draft.avatar} onChange={v => set('avatar', v)} label="Upload Profile Photo" />
        </Field>
        <Field label="Cover image" hint="Optional">
          <ImageUpload value={draft.coverImage} onChange={v => set('coverImage', v)} label="Upload Cover Image" aspect="wide" />
        </Field>
      </div>
      <Field label="Topics" hint="What would you like people to discover you for? Village connects your stories, ideas and businesses to the topics you choose here.">
        <TopicPicker selected={draft.topicIds} onChange={v => set('topicIds', v)} />
      </Field>
    </div>
  )
}

const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  linkedin: 'LinkedIn', instagram: 'Instagram', facebook: 'Facebook',
  'facebook-page': 'Facebook Page', youtube: 'YouTube', tiktok: 'TikTok',
  x: 'X', threads: 'Threads', podcast: 'Podcast', newsletter: 'Newsletter', custom: 'Custom Link',
}
const PLATFORM_ORDER: SocialPlatform[] = ['linkedin', 'instagram', 'facebook', 'facebook-page', 'youtube', 'tiktok', 'x', 'threads', 'podcast', 'newsletter', 'custom']

function SocialStep({ draft, set }: { draft: Draft; set: (k: keyof Draft, v: unknown) => void }) {
  function addLink() {
    const next: DraftSocialLink = { id: `link-${Date.now()}`, platform: 'instagram', url: '', label: '' }
    set('socialLinks', [...draft.socialLinks, next])
  }
  function updateLink(i: number, patch: Partial<DraftSocialLink>) {
    set('socialLinks', draft.socialLinks.map((l, idx) => idx === i ? { ...l, ...patch } : l))
  }
  function removeLink(i: number) {
    set('socialLinks', draft.socialLinks.filter((_, idx) => idx !== i))
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-heading text-xl font-bold text-charcoal">Where can people follow you?</h2>
        <p className="font-body text-sm text-muted mt-1">
          Add as many accounts as you like, including more than one of the same kind. A website belongs to your business, so that comes on the next step.
        </p>
      </div>

      {draft.socialLinks.map((link, i) => (
        <div key={link.id} className="border border-border rounded-2xl p-4 space-y-3 bg-white">
          <div className="flex items-center justify-between">
            <select
              value={link.platform}
              onChange={e => updateLink(i, { platform: e.target.value as SocialPlatform })}
              className="border border-border rounded-lg px-2.5 py-1.5 text-xs font-semibold text-charcoal bg-white focus:outline-none focus:ring-1 focus:ring-primary/30"
            >
              {PLATFORM_ORDER.map(p => <option key={p} value={p}>{PLATFORM_LABELS[p]}</option>)}
            </select>
            <button type="button" onClick={() => removeLink(i)} className="text-xs text-muted hover:text-red-500 transition-colors">Remove</button>
          </div>
          {link.platform === 'custom' && (
            <TextInput value={link.label} onChange={v => updateLink(i, { label: v })} placeholder="What is this link? e.g. My Substack" />
          )}
          <TextInput value={link.url} onChange={v => updateLink(i, { url: v })} placeholder="https://…" />
        </div>
      ))}

      <button
        type="button"
        onClick={addLink}
        className="w-full border-2 border-dashed border-border rounded-2xl py-4 text-sm font-medium text-muted hover:border-primary hover:text-primary transition-colors"
      >
        + Add a link
      </button>
      <p className="text-xs text-muted">Optional. You can add more from your dashboard any time.</p>
    </div>
  )
}

const BUSINESS_LOCATION_TYPES: { value: DraftBusiness['locationType']; label: string; hint: string }[] = [
  { value: 'physical',     label: 'Physical location',  hint: 'A fixed address customers visit' },
  { value: 'storefront',   label: 'Storefront',         hint: 'A retail shopfront' },
  { value: 'service-area', label: 'Service area',       hint: 'You travel to customers' },
  { value: 'online',       label: 'Online only',        hint: 'No physical location' },
]

function BusinessBlock({ business, index, onChange, onRemove, canRemove }: {
  business: DraftBusiness
  index: number
  onChange: (patch: Partial<DraftBusiness>) => void
  onRemove: () => void
  canRemove: boolean
}) {
  const locationOpts = locations.map(l => ({ id: l.id, label: l.name, sublabel: l.state || undefined }))
  const industryOpts = industries.map(i => ({ id: i.id, label: i.name }))

  return (
    <div className="border border-border rounded-2xl p-5 space-y-5 bg-white">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-primary uppercase tracking-widest">Business {index + 1}</span>
        {canRemove && (
          <button type="button" onClick={onRemove} className="text-xs text-muted hover:text-red-500 transition-colors">Remove</button>
        )}
      </div>

      <Field label="Business name" required>
        <TextInput value={business.name} onChange={v => onChange({ name: v })} placeholder="e.g. Pretty Cool Marketing" />
      </Field>
      <Field label="Tagline" required>
        <TextInput value={business.tagline} onChange={v => onChange({ tagline: v })} placeholder="One line that says what you do." />
      </Field>
      <Field label="Description" required>
        <TextArea value={business.description} onChange={v => onChange({ description: v })} placeholder="A few sentences about the business: its story, purpose and what makes it worth discovering." rows={5} />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label="Industry" required>
          <SearchSelect
            value={business.industryId}
            otherValue={business.industryOther}
            onChange={v => onChange({ industryId: v })}
            onOtherChange={v => onChange({ industryOther: v })}
            options={industryOpts}
            placeholder="Search for an industry…"
          />
        </Field>
        <Field label="Location" required>
          <SearchSelect
            value={business.locationId}
            otherValue={business.locationOther}
            onChange={v => onChange({ locationId: v })}
            onOtherChange={v => onChange({ locationOther: v })}
            options={locationOpts}
            placeholder="Search for a city…"
          />
        </Field>
      </div>

      <Field label="How does it operate?" required>
        <div className="grid grid-cols-2 gap-2">
          {BUSINESS_LOCATION_TYPES.map(t => (
            <button
              key={t.value}
              type="button"
              onClick={() => onChange({ locationType: t.value })}
              className={`text-left px-3 py-2.5 rounded-xl border text-xs transition-colors ${
                business.locationType === t.value
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <p className={`font-semibold ${business.locationType === t.value ? 'text-primary' : 'text-charcoal'}`}>{t.label}</p>
              <p className="text-muted mt-0.5">{t.hint}</p>
            </button>
          ))}
        </div>
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label="Logo">
          <ImageUpload value={business.logo} onChange={v => onChange({ logo: v })} label="Upload Logo" />
        </Field>
        <Field label="Cover image" hint="Optional">
          <ImageUpload value={business.coverImage} onChange={v => onChange({ coverImage: v })} label="Upload Cover Image" aspect="wide" />
        </Field>
      </div>

      <Field label="Website" hint="Where should Learn More buttons send people?">
        <TextInput value={business.website} onChange={v => onChange({ website: v })} placeholder="https://yoursite.com" />
      </Field>
    </div>
  )
}

function BusinessStep({ draft, set }: { draft: Draft; set: (k: keyof Draft, v: unknown) => void }) {
  function updateBusinessAt(i: number, patch: Partial<DraftBusiness>) {
    set('businesses', draft.businesses.map((b, idx) => idx === i ? { ...b, ...patch } : b))
  }
  function removeBusinessAt(i: number) {
    set('businesses', draft.businesses.filter((_, idx) => idx !== i))
  }
  function addBusiness() {
    set('businesses', [...draft.businesses, newBusiness()])
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-heading text-xl font-bold text-charcoal">Your business</h2>
        <p className="font-body text-sm text-muted mt-1">Every business you add becomes its own discoverable profile, connected back to you.</p>
      </div>

      {draft.businesses.map((business, i) => (
        <BusinessBlock
          key={business.id}
          business={business}
          index={i}
          onChange={patch => updateBusinessAt(i, patch)}
          onRemove={() => removeBusinessAt(i)}
          canRemove={draft.businesses.length > 1}
        />
      ))}

      <button
        type="button"
        onClick={addBusiness}
        className="w-full border-2 border-dashed border-border rounded-2xl py-4 text-sm font-medium text-muted hover:border-primary hover:text-primary transition-colors"
      >
        + Add another business
      </button>
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
        <h2 className="font-heading text-xl font-bold text-charcoal">Offers</h2>
        <p className="font-body text-sm text-muted mt-1">
          An offer is what someone can buy or enquire about: a product, a package, a spot in your community. Each one gets its own button telling visitors exactly what to do next.
        </p>
      </div>
      {draft.offers.map((o, i) => (
        <div key={o.id} className="border border-border rounded-2xl p-4 space-y-3 bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted uppercase tracking-widest">Offer {i + 1}</span>
            <button type="button" onClick={() => removeOffer(i)} className="text-xs text-muted hover:text-red-500 transition-colors">Remove</button>
          </div>
          <TextInput value={o.title} onChange={v => updateOffer(i, 'title', v)} placeholder="What can someone buy or enquire about?" />
          <TextArea value={o.description} onChange={v => updateOffer(i, 'description', v)} placeholder="Short description…" rows={2} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <TextInput value={o.ctaLabel} onChange={v => updateOffer(i, 'ctaLabel', v)} placeholder="Button label, e.g. Book Now" />
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
      <p className="text-xs text-muted">Optional. You can skip this step and add offers later.</p>
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
        <p className="font-body text-sm text-muted mt-1">
          A service describes how you help people: the actual work you do. Where an offer is something to buy, a service is a skill or process visitors can book you for.
        </p>
      </div>
      {draft.services.map((s, i) => (
        <div key={s.id} className="border border-border rounded-2xl p-4 space-y-3 bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted uppercase tracking-widest">Service {i + 1}</span>
            <button type="button" onClick={() => removeSvc(i)} className="text-xs text-muted hover:text-red-500 transition-colors">Remove</button>
          </div>
          <TextInput value={s.name} onChange={v => updateSvc(i, 'name', v)} placeholder="What service do you offer?" />
          <TextArea value={s.description} onChange={v => updateSvc(i, 'description', v)} placeholder="What's included…" rows={3} />
          <TextInput value={s.price} onChange={v => updateSvc(i, 'price', v)} placeholder="Price (optional, e.g. From $1,500)" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <TextInput value={s.ctaLabel} onChange={v => updateSvc(i, 'ctaLabel', v)} placeholder="Button label, e.g. Book Now" />
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
      <p className="text-xs text-muted">Optional. You can skip this step and add services later.</p>
    </div>
  )
}

function ReviewStep({ draft }: { draft: Draft }) {
  const location = draft.locationId === OTHER_ID ? { name: draft.locationOther, state: '' } : locations.find(l => l.id === draft.locationId)
  const industry = draft.industryId === OTHER_ID ? { name: draft.industryOther } : industries.find(i => i.id === draft.industryId)
  const selectedTopics = topics.filter(t => draft.topicIds.includes(t.id))

  function Row({ label, value }: { label: string; value: string }) {
    return (
      <div className="flex gap-4 py-2 border-b border-border last:border-0">
        <span className="text-xs font-semibold text-muted w-32 shrink-0 pt-0.5">{label}</span>
        <span className="text-sm text-charcoal">{value || <span className="text-muted italic">Not set</span>}</span>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <h2 className="font-heading text-xl font-bold text-charcoal">Review before publishing</h2>

      <div className="bg-surface rounded-2xl border border-border p-5">
        <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">Founder</p>
        <Row label="Name" value={draft.name} />
        <Row label="Location" value={location ? `${location.name}${location.state ? `, ${location.state}` : ''}` : ''} />
        <Row label="Industry" value={industry?.name ?? ''} />
        <Row label="Topics" value={selectedTopics.map(t => t.name).join(', ')} />
        <Row label="Links" value={draft.socialLinks.length > 0 ? `${draft.socialLinks.length} link${draft.socialLinks.length !== 1 ? 's' : ''}` : ''} />
      </div>

      {draft.businesses.map((business, i) => {
        const bizLocation = business.locationId === OTHER_ID ? { name: business.locationOther, state: '' } : locations.find(l => l.id === business.locationId)
        const bizIndustry = business.industryId === OTHER_ID ? { name: business.industryOther } : industries.find(l => l.id === business.industryId)
        return (
          <div key={business.id} className="bg-surface rounded-2xl border border-border p-5">
            <p className="text-xs font-semibold text-accent uppercase tracking-widest mb-3">Business{draft.businesses.length > 1 ? ` ${i + 1}` : ''}</p>
            <Row label="Name" value={business.name} />
            <Row label="Tagline" value={business.tagline} />
            <Row label="Location" value={bizLocation ? `${bizLocation.name}${bizLocation.state ? `, ${bizLocation.state}` : ''}` : ''} />
            <Row label="Industry" value={bizIndustry?.name ?? ''} />
          </div>
        )
      })}

      <div className="bg-surface rounded-2xl border border-border p-5">
        <p className="text-xs font-semibold text-charcoal uppercase tracking-widest mb-3">Offers &amp; Services</p>
        <Row label="Offers" value={draft.offers.length > 0 ? `${draft.offers.length} offer${draft.offers.length !== 1 ? 's' : ''}` : 'None'} />
        <Row label="Services" value={draft.services.length > 0 ? `${draft.services.length} service${draft.services.length !== 1 ? 's' : ''}` : 'None'} />
      </div>

      <p className="font-body text-sm text-muted">
        Everything publishes immediately and appears on your public profile. You can edit all of this from the dashboard after publishing.
      </p>
    </div>
  )
}

function DoneStep({ founderSlug, founderName }: { founderSlug: string; founderName: string }) {
  const navigate = useNavigate()
  return (
    <div className="text-center max-w-lg mx-auto">
      <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center mx-auto mb-6">
        <span className="text-3xl">🎉</span>
      </div>
      <h2 className="font-heading text-3xl font-bold text-primary mb-4">Che CULO! Welcome to the Village, {founderName}.</h2>
      <p className="font-body text-base text-muted leading-relaxed mb-8">
        Your founder profile and business are now live. Head to your public profile to see how you appear to visitors, or go straight to the dashboard to publish your first story.
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

// ─── Resolve a Location/Industry pick, including "Other" free text ────────────

function resolveLocation(id: string, otherText: string): Location {
  if (id === OTHER_ID) {
    const name = otherText.trim() || 'Unspecified'
    return { id: slugify(name) || 'other', slug: slugify(name) || 'other', name, state: '', country: 'Australia', description: '', image: '/placeholders/village-location.svg' }
  }
  return locations.find(l => l.id === id) ?? locations[0]!
}

function resolveIndustry(id: string, otherText: string): Industry {
  if (id === OTHER_ID) {
    const name = otherText.trim() || 'Unspecified'
    return { id: slugify(name) || 'other', slug: slugify(name) || 'other', name }
  }
  return industries.find(i => i.id === id) ?? industries[0]!
}

// ─── Main onboarding page ────────────────────────────────────────────────────

export function OnboardingPage() {
  usePageTitle('Get started')

  const { user } = useAuth()
  const [step, setStep] = useState<Step>('welcome')
  const [draft, setDraft] = useState<Draft>(empty)
  const [publishing, setPublishing] = useState(false)
  const [publishError, setPublishError] = useState('')
  const [founderSlug, setFounderSlug] = useState('')

  // If the visitor is already signed in (e.g. they came from /dashboard/login's
  // post-signup redirect), skip the account-creation step entirely.
  useEffect(() => {
    if (step === 'account' && user) next()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, user])

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
    if (step === 'profile') {
      const locationOk = draft.locationId === OTHER_ID ? !!draft.locationOther.trim() : !!draft.locationId
      const industryOk = draft.industryId === OTHER_ID ? !!draft.industryOther.trim() : !!draft.industryId
      return !!draft.name && !!draft.bio && locationOk && industryOk
    }
    if (step === 'business') {
      return draft.businesses.every(b => {
        const locationOk = b.locationId === OTHER_ID ? !!b.locationOther.trim() : !!b.locationId
        const industryOk = b.industryId === OTHER_ID ? !!b.industryOther.trim() : !!b.industryId
        return !!b.name && !!b.tagline && !!b.description && industryOk && locationOk
      })
    }
    return true
  }

  async function publish() {
    if (!user) {
      // Shouldn't be reachable (the 'account' step gates this), but never let a
      // founder publish an unowned profile.
      setStep('account')
      return
    }

    setPublishing(true)

    const founderSlugVal = slugify(draft.name)
    const founderId       = crypto.randomUUID()
    const now = new Date().toISOString()

    const selectedTopics: Topic[] = topics.filter(t => draft.topicIds.includes(t.id))
    const location = resolveLocation(draft.locationId, draft.locationOther)
    const industry = resolveIndustry(draft.industryId, draft.industryOther)

    const socialLinks: SocialLink[] = draft.socialLinks
      .filter(l => l.url.trim())
      .map(l => ({ id: l.id, platform: l.platform, url: l.url.trim(), label: l.platform === 'custom' ? l.label : undefined }))

    // Every business becomes its own real Business row — one founder, many
    // businesses. The first one is the founder's primary businessId.
    const businessRecords: Business[] = draft.businesses.map(b => ({
      id: b.id,
      slug: slugify(b.name),
      name: b.name,
      tagline: b.tagline,
      description: b.description,
      logo: b.logo || '/placeholders/village-business.svg',
      coverImage: b.coverImage || '/placeholders/village-cover.svg',
      founderId,
      location: resolveLocation(b.locationId, b.locationOther),
      locationType: b.locationType,
      industry: resolveIndustry(b.industryId, b.industryOther),
      topics: selectedTopics,
      website: b.website || undefined,
      offers: [],
      status: 'published',
      featured: false,
      createdAt: now,
    }))
    // Offers collected during onboarding attach to the first business.
    if (businessRecords[0]) businessRecords[0].offers = draft.offers.map(o => ({ id: o.id, title: o.title, description: o.description, ctaLabel: o.ctaLabel, ctaUrl: o.ctaUrl }))

    const founder: Founder = {
      id: founderId,
      slug: founderSlugVal,
      name: draft.name,
      bio: draft.bio,
      avatar: draft.avatar || '/placeholders/village-founder.svg',
      coverImage: draft.coverImage || undefined,
      location,
      industry,
      businessId: businessRecords[0]?.id ?? '',
      topics: selectedTopics,
      socialLinks,
      status: 'published',
      featured: false,
      createdAt: now,
      // The founder created this profile themselves — they own it immediately,
      // no claim flow needed. See getCurrentFounder()'s resolution order.
      userId: user.id,
    }

    const founderResult = await updateFounder(founder)
    if (!founderResult.success) {
      setPublishing(false)
      setPublishError(founderResult.error ?? 'Could not publish your profile. Please try again.')
      return
    }

    await Promise.all(businessRecords.map(b => updateBusiness(b)))

    // Mirrors the new founder.userId onto profiles.founder_id so the fast-path
    // (step 1 of getCurrentFounder()'s resolution order) is populated too —
    // harmless no-op in dev mode / if it fails, since userId already resolves it.
    void linkOwnFounder(founderId)

    const primaryBusinessId = businessRecords[0]?.id ?? ''
    await Promise.all(draft.services.map(s => {
      const svc: Service = {
        id: s.id,
        slug: slugify(s.name),
        name: s.name,
        description: s.description,
        price: s.price || undefined,
        businessId: primaryBusinessId,
        founderId,
        topicIds: draft.topicIds,
        expertiseIds: [],
        ctaLabel: s.ctaLabel,
        ctaUrl: s.ctaUrl,
      }
      return updateService(svc)
    }))

    setFounderSlug(founderSlugVal)
    setPublishing(false)
    setStep('done')
  }

  const idx = stepIndex(step)
  const isFirst = step === 'welcome'
  const isAccount = step === 'account'
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
              Step {idx} of {totalSteps}: {stepLabel(step)}
            </p>
          </div>
        )}

        {/* ── Step content ─────────────────────────────────────────────────── */}
        <div className="bg-surface rounded-2xl border border-border p-6 sm:p-8 shadow-sm">
          {step === 'welcome'  && <WelcomeStep onNext={next} />}
          {step === 'account'  && <AccountStep onDone={next} />}
          {step === 'profile'  && <ProfileStep draft={draft} set={set} />}
          {step === 'social'   && <SocialStep draft={draft} set={set} />}
          {step === 'business' && <BusinessStep draft={draft} set={set} />}
          {step === 'offers'   && <OffersStep draft={draft} set={set} />}
          {step === 'services' && <ServicesStep draft={draft} set={set} />}
          {step === 'review'   && <ReviewStep draft={draft} />}
          {step === 'done'     && <DoneStep founderSlug={founderSlug} founderName={draft.name} />}
        </div>

        {/* ── Navigation ───────────────────────────────────────────────────── */}
        {!isFirst && !isAccount && !isDone && (
          <div className="flex items-center justify-between mt-6">
            <button
              onClick={back}
              className="px-5 py-2.5 text-sm font-medium text-muted hover:text-charcoal transition-colors"
            >
              ← Back
            </button>

            {isReview ? (
              <div className="flex flex-col items-end gap-2">
                {publishError && <p className="text-sm text-red-600">{publishError}</p>}
                <button
                  onClick={() => void publish()}
                  disabled={publishing}
                  className="px-8 py-3 bg-primary text-white rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-60"
                >
                  {publishing ? 'Publishing…' : 'Publish to the Village'}
                </button>
              </div>
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
