import { useState, useRef, type ReactNode, type ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import { getFounders } from '../../services/founders'
import { getBusinesses } from '../../services/businesses'
import { updateStory } from '../../services/stories'
import { locations } from '../../data/locations'
import { industries } from '../../data/industries'
import { topics as allTopics } from '../../data/topics'
import { slugify } from '../../utils/slugify'
import type { ContentType, Topic, Status } from '../../types'

// ─── Step + source types ───────────────────────────────────────────────────────

type PublishStep =
  | 'source'
  | 'canva'
  | 'camera-roll'
  | 'import'
  | 'write'
  | 'connections'
  | 'preview'
  | 'published'

type PublishSource = 'canva' | 'camera-roll' | 'import' | 'write'

// ─── Draft ────────────────────────────────────────────────────────────────────

interface PublishDraft {
  source: PublishSource | null
  // Content fields (primarily from Write step)
  title: string
  summary: string
  contentTypes: ContentType[]
  blog: string
  reelUrl: string
  carouselSlides: string[]
  coverImage: string
  // Camera roll
  fileNames: string[]
  whatHappened: string
  // Import
  importMode: 'url' | 'paste' | 'upload'
  importUrl: string
  importText: string
  // Connections (shared)
  founderId: string
  businessId: string
  locationId: string
  industryId: string
  topics: Topic[]
  ctaLabel: string
  ctaUrl: string
  status: Status
}

function defaultDraft(): PublishDraft {
  const founders   = getFounders()
  const businesses = getBusinesses()
  return {
    source: null,
    title: '', summary: '', contentTypes: ['blog'],
    blog: '', reelUrl: '', carouselSlides: [''], coverImage: '',
    fileNames: [], whatHappened: '',
    importMode: 'url', importUrl: '', importText: '',
    founderId:  founders[0]?.id   ?? '',
    businessId: businesses[0]?.id ?? '',
    locationId: locations[0]?.id  ?? '',
    industryId: industries[0]?.id ?? '',
    topics: [], ctaLabel: 'Read more', ctaUrl: '',
    status: 'published',
  }
}

// ─── Shared UI helpers ─────────────────────────────────────────────────────────

const inp = 'w-full px-3 py-2.5 rounded-lg border border-[#E8E4DD] text-sm text-[#2D2A26] bg-white placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#C86A43]/30 focus:border-[#C86A43] transition-colors'

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-[#6B7280] mb-1">{label}</label>
      {hint && <p className="text-[11px] text-[#9CA3AF] mb-1.5">{hint}</p>}
      {children}
    </div>
  )
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <div className="flex-1 h-px bg-[#E8E4DD]" />
      <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-widest shrink-0">{label}</p>
      <div className="flex-1 h-px bg-[#E8E4DD]" />
    </div>
  )
}

function CheckItem({ label, done = true }: { label: string; done?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 text-sm">
      <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${done ? 'bg-[#5E6B4A]' : 'bg-[#E8E4DD]'}`}>
        {done && (
          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <span className={done ? 'text-[#2D2A26]' : 'text-[#9CA3AF]'}>{label}</span>
    </div>
  )
}

function StepHeader({ title, subtitle, onBack }: { title: string; subtitle?: string; onBack?: () => void }) {
  return (
    <div className="mb-8">
      {onBack && (
        <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-[#9CA3AF] hover:text-[#C86A43] transition-colors mb-4">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
      )}
      <h1 className="text-2xl font-bold text-[#2D2A26] mb-1">{title}</h1>
      {subtitle && <p className="text-sm text-[#6B7280]">{subtitle}</p>}
    </div>
  )
}

// ─── Step 1: Source Selection ──────────────────────────────────────────────────

interface SourceCardProps {
  emoji: string
  title: string
  description: string
  badge?: string
  onClick: () => void
  disabled?: boolean
}

function SourceCard({ emoji, title, description, badge, onClick, disabled }: SourceCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full text-left p-5 rounded-2xl border-2 transition-all group ${
        disabled
          ? 'border-[#E8E4DD] bg-white opacity-60 cursor-not-allowed'
          : 'border-[#E8E4DD] bg-white hover:border-[#C86A43] hover:shadow-md cursor-pointer'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <span className="text-3xl">{emoji}</span>
        {badge && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F3EDE6] text-[#C86A43] uppercase tracking-wide shrink-0">
            {badge}
          </span>
        )}
      </div>
      <p className="text-base font-bold text-[#2D2A26] mb-1.5 group-hover:text-[#C86A43] transition-colors">{title}</p>
      <p className="text-sm text-[#6B7280] leading-relaxed">{description}</p>
    </button>
  )
}

function SourceStep({ onSelect }: { onSelect: (source: PublishSource) => void }) {
  return (
    <div className="max-w-2xl">
      <StepHeader
        title="Publish Something"
        subtitle="Where is your content coming from?"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SourceCard
          emoji="✨"
          title="Publish from Canva"
          description="Publish directly from Canva into the Village. The premium workflow — design once, distribute everywhere."
          badge="Coming soon"
          onClick={() => onSelect('canva')}
          disabled
        />
        <SourceCard
          emoji="📷"
          title="Camera Roll"
          description="Upload videos, photos and voice notes. CULO helps turn real experiences into publishable knowledge."
          onClick={() => onSelect('camera-roll')}
        />
        <SourceCard
          emoji="🌐"
          title="Import Existing Content"
          description="Import from your website, blog, Instagram, LinkedIn, TikTok, YouTube, PDF, Word or Markdown."
          onClick={() => onSelect('import')}
        />
        <SourceCard
          emoji="✍️"
          title="Write From Scratch"
          description="Start with a blank canvas. Ideal for quick ideas, stories and articles you want to write directly."
          onClick={() => onSelect('write')}
        />
      </div>
    </div>
  )
}

// ─── Step 2a: Canva (Coming Soon) ─────────────────────────────────────────────

function CanvaStep({ onBack }: { onBack: () => void }) {
  return (
    <div className="max-w-lg">
      <StepHeader title="Publish from Canva" onBack={onBack} />
      <div className="bg-white rounded-2xl border border-[#E8E4DD] p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#F3EDE6] flex items-center justify-center mx-auto mb-5">
          <span className="text-3xl">✨</span>
        </div>
        <h2 className="text-lg font-bold text-[#2D2A26] mb-3">Canva Integration — Coming Soon</h2>
        <p className="text-sm text-[#6B7280] leading-relaxed mb-6">
          Once your Canva design is published through the CULO Canva integration, everything below happens automatically.
        </p>
        <div className="text-left space-y-2.5 bg-[#F8F5F0] rounded-xl p-4 mb-6">
          {[
            'Story created from your Canva design',
            'Blog, reel and carousel generated automatically',
            'Caption written by CULO',
            'Topics, ideas and FAQs suggested',
            'Founder and business connections pre-filled',
            'Published to Village immediately',
          ].map(item => (
            <CheckItem key={item} label={item} done={false} />
          ))}
        </div>
        <p className="text-xs text-[#9CA3AF]">
          The CULO Canva app is available now in the Canva Marketplace.
          Full Village integration is the next sprint.
        </p>
      </div>
    </div>
  )
}

// ─── Step 2b: Camera Roll ─────────────────────────────────────────────────────

function CameraRollStep({
  draft, onChange, onNext, onBack,
}: {
  draft: PublishDraft
  onChange: (patch: Partial<PublishDraft>) => void
  onNext: () => void
  onBack: () => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFiles(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    onChange({ fileNames: files.map(f => f.name) })
  }

  return (
    <div className="max-w-lg">
      <StepHeader
        title="Camera Roll"
        subtitle="Upload your content and tell us what happened."
        onBack={onBack}
      />

      {/* Upload zone */}
      <div
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-[#E8E4DD] rounded-2xl p-10 text-center cursor-pointer hover:border-[#C86A43]/50 hover:bg-[#F8F5F0] transition-all mb-5"
      >
        <div className="w-12 h-12 rounded-xl bg-[#F3EDE6] flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-[#C86A43]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-[#2D2A26] mb-1">Upload videos, photos or voice notes</p>
        <p className="text-xs text-[#9CA3AF]">MP4, MOV, JPG, PNG, M4A, MP3 — drag in or click to browse</p>
        <input
          ref={fileRef}
          type="file"
          multiple
          accept="video/*,image/*,audio/*"
          className="hidden"
          onChange={handleFiles}
        />
      </div>

      {/* File list */}
      {draft.fileNames.length > 0 && (
        <div className="mb-5 bg-white rounded-xl border border-[#E8E4DD] divide-y divide-[#F3EDE6]">
          {draft.fileNames.map((name, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-2.5">
              <svg className="w-4 h-4 text-[#C86A43] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.882V15.12a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <p className="text-xs text-[#2D2A26] truncate flex-1">{name}</p>
              <button
                onClick={() => onChange({ fileNames: draft.fileNames.filter((_, j) => j !== i) })}
                className="text-xs text-[#9CA3AF] hover:text-red-500 shrink-0"
              >✕</button>
            </div>
          ))}
        </div>
      )}

      {/* What happened */}
      <div className="mb-6">
        <Field label="What happened?" hint="Describe the moment, experience or insight in your own words. CULO will use this to shape the story.">
          <textarea
            value={draft.whatHappened}
            onChange={e => onChange({ whatHappened: e.target.value })}
            rows={5}
            placeholder="We were packing up at the end of a long day when a customer came back just to say…"
            className={inp + ' resize-y'}
          />
        </Field>
      </div>

      {/* Future pipeline note */}
      <div className="bg-[#F8F5F0] rounded-xl px-4 py-3 mb-6">
        <p className="text-xs text-[#9CA3AF] leading-relaxed">
          <span className="font-semibold text-[#2D2A26]">Coming soon:</span> CULO will generate a blog, carousel, reel script, caption, ideas and FAQs from your upload and description. For now, continue to add the content manually in the next steps.
        </p>
      </div>

      <button
        onClick={onNext}
        disabled={draft.fileNames.length === 0 && !draft.whatHappened.trim()}
        className="w-full py-3 bg-[#C86A43] text-white text-sm font-semibold rounded-xl hover:bg-[#b05a35] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Continue
      </button>
    </div>
  )
}

// ─── Step 2c: Import ──────────────────────────────────────────────────────────

const IMPORT_MODES = [
  { key: 'url',    label: 'URL' },
  { key: 'paste',  label: 'Paste Text' },
  { key: 'upload', label: 'Upload File' },
] as const

const SUPPORTED_SOURCES = [
  'Website', 'Blog', 'Instagram', 'LinkedIn',
  'TikTok', 'YouTube', 'PDF', 'Word', 'Markdown',
]

function ImportStep({
  draft, onChange, onNext, onBack,
}: {
  draft: PublishDraft
  onChange: (patch: Partial<PublishDraft>) => void
  onNext: () => void
  onBack: () => void
}) {
  const uploadRef = useRef<HTMLInputElement>(null)

  const hasContent =
    (draft.importMode === 'url'    && draft.importUrl.trim())  ||
    (draft.importMode === 'paste'  && draft.importText.trim()) ||
    (draft.importMode === 'upload' && draft.fileNames.length > 0)

  return (
    <div className="max-w-lg">
      <StepHeader
        title="Import Existing Content"
        subtitle="Import content you've already created elsewhere."
        onBack={onBack}
      />

      {/* Supported sources */}
      <div className="flex flex-wrap gap-1.5 mb-5">
        {SUPPORTED_SOURCES.map(s => (
          <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-[#F3EDE6] text-[#C86A43] font-medium">{s}</span>
        ))}
      </div>

      {/* Mode tabs */}
      <div className="flex gap-1 p-1 bg-[#F8F5F0] rounded-xl mb-5">
        {IMPORT_MODES.map(m => (
          <button
            key={m.key}
            onClick={() => onChange({ importMode: m.key })}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              draft.importMode === m.key
                ? 'bg-white text-[#2D2A26] shadow-sm'
                : 'text-[#9CA3AF] hover:text-[#2D2A26]'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Mode content */}
      {draft.importMode === 'url' && (
        <Field label="URL" hint="Paste a link to a website, blog post, LinkedIn article, Instagram post, YouTube video or TikTok.">
          <input
            type="url"
            value={draft.importUrl}
            onChange={e => onChange({ importUrl: e.target.value })}
            placeholder="https://..."
            className={inp}
          />
        </Field>
      )}

      {draft.importMode === 'paste' && (
        <Field label="Paste your content" hint="Paste text from a blog post, article, social caption or any other source.">
          <textarea
            value={draft.importText}
            onChange={e => onChange({ importText: e.target.value })}
            rows={8}
            placeholder="Paste your content here…"
            className={inp + ' resize-y'}
          />
        </Field>
      )}

      {draft.importMode === 'upload' && (
        <div
          onClick={() => uploadRef.current?.click()}
          className="border-2 border-dashed border-[#E8E4DD] rounded-2xl p-8 text-center cursor-pointer hover:border-[#C86A43]/50 hover:bg-[#F8F5F0] transition-all"
        >
          <p className="text-sm font-semibold text-[#2D2A26] mb-1">Upload a file</p>
          <p className="text-xs text-[#9CA3AF]">PDF, Word (.docx), Markdown (.md)</p>
          <input
            ref={uploadRef}
            type="file"
            accept=".pdf,.docx,.doc,.md,.txt"
            className="hidden"
            onChange={e => {
              const f = e.target.files?.[0]
              if (f) onChange({ fileNames: [f.name] })
            }}
          />
          {draft.fileNames.length > 0 && (
            <p className="text-xs text-[#C86A43] mt-3 font-medium">{draft.fileNames[0]}</p>
          )}
        </div>
      )}

      {/* Future preview note */}
      <div className="mt-5 bg-[#F8F5F0] rounded-xl px-4 py-3 mb-6">
        <p className="text-xs font-semibold text-[#2D2A26] mb-1">Coming soon — We found…</p>
        <p className="text-xs text-[#9CA3AF] leading-relaxed">
          Once import processing is live, CULO will extract the title, summary, images, topics, suggested founder
          and suggested CTA from your content automatically. You'll review and approve before publishing.
        </p>
      </div>

      <button
        onClick={onNext}
        disabled={!hasContent}
        className="w-full py-3 bg-[#C86A43] text-white text-sm font-semibold rounded-xl hover:bg-[#b05a35] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Continue
      </button>
    </div>
  )
}

// ─── Step 2d: Write From Scratch ──────────────────────────────────────────────

const CONTENT_TYPES: ContentType[] = ['blog', 'reel', 'carousel']

function WriteStep({
  draft, onChange, onNext, onBack,
}: {
  draft: PublishDraft
  onChange: (patch: Partial<PublishDraft>) => void
  onNext: () => void
  onBack: () => void
}) {
  function toggleFormat(ct: ContentType) {
    const has = draft.contentTypes.includes(ct)
    onChange({
      contentTypes: has
        ? draft.contentTypes.filter(x => x !== ct)
        : [...draft.contentTypes, ct],
    })
  }

  const hasBlog     = draft.contentTypes.includes('blog')
  const hasReel     = draft.contentTypes.includes('reel')
  const hasCarousel = draft.contentTypes.includes('carousel')
  const canContinue = draft.title.trim() && draft.summary.trim()

  return (
    <div className="max-w-xl">
      <StepHeader
        title="Write From Scratch"
        subtitle="Start with what you want to share. Only fill in what you know now."
        onBack={onBack}
      />

      <div className="flex flex-col gap-5">

        {/* Core content */}
        <Field label="Title">
          <input
            type="text"
            value={draft.title}
            onChange={e => onChange({ title: e.target.value })}
            placeholder="What is this story about?"
            className={inp}
          />
        </Field>

        <Field label="Summary" hint="One or two sentences. What will the reader take away?">
          <textarea
            value={draft.summary}
            onChange={e => onChange({ summary: e.target.value })}
            rows={3}
            placeholder="The honest story of…"
            className={inp + ' resize-y'}
          />
        </Field>

        <SectionDivider label="Formats" />

        <Field label="Content Formats" hint="Select every format this story is published in">
          <div className="flex gap-2 flex-wrap mt-1">
            {CONTENT_TYPES.map(ct => (
              <button
                key={ct}
                onClick={() => toggleFormat(ct)}
                className={`px-3 py-1.5 rounded-lg text-sm border font-medium transition-colors capitalize ${
                  draft.contentTypes.includes(ct)
                    ? 'bg-[#C86A43] text-white border-[#C86A43]'
                    : 'bg-white text-[#6B7280] border-[#E8E4DD] hover:border-[#C86A43]/50'
                }`}
              >
                {ct}
              </button>
            ))}
          </div>
        </Field>

        {/* Blog */}
        {hasBlog && (
          <div className="border border-[#E8E4DD] rounded-xl overflow-hidden">
            <div className="bg-[#F8F5F0] px-4 py-2 border-b border-[#E8E4DD]">
              <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-widest">Blog Content</p>
            </div>
            <div className="px-4 py-3">
              <textarea
                value={draft.blog}
                onChange={e => onChange({ blog: e.target.value })}
                rows={8}
                placeholder="Write or paste your full blog post here. Markdown supported: ## headings, **bold**, - lists."
                className={inp + ' resize-y'}
              />
            </div>
          </div>
        )}

        {/* Reel */}
        {hasReel && (
          <div className="border border-[#E8E4DD] rounded-xl overflow-hidden">
            <div className="bg-[#F8F5F0] px-4 py-2 border-b border-[#E8E4DD]">
              <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-widest">Reel</p>
            </div>
            <div className="px-4 py-3">
              <Field label="Reel URL" hint="Instagram, TikTok or YouTube Shorts link">
                <input
                  type="url"
                  value={draft.reelUrl}
                  onChange={e => onChange({ reelUrl: e.target.value })}
                  placeholder="https://instagram.com/reel/…"
                  className={inp}
                />
              </Field>
            </div>
          </div>
        )}

        {/* Carousel */}
        {hasCarousel && (
          <div className="border border-[#E8E4DD] rounded-xl overflow-hidden">
            <div className="bg-[#F8F5F0] px-4 py-2 border-b border-[#E8E4DD]">
              <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-widest">Carousel Slides</p>
            </div>
            <div className="px-4 py-3 flex flex-col gap-2.5">
              {draft.carouselSlides.map((slide, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs text-[#9CA3AF] w-5 shrink-0 text-right">{i + 1}</span>
                  <input
                    type="url"
                    value={slide}
                    onChange={e => {
                      const next = [...draft.carouselSlides]
                      next[i] = e.target.value
                      onChange({ carouselSlides: next })
                    }}
                    placeholder="Image URL or /assets/filename.jpg"
                    className={inp}
                  />
                  <button
                    onClick={() => onChange({ carouselSlides: draft.carouselSlides.filter((_, j) => j !== i) })}
                    className="text-xs text-[#9CA3AF] hover:text-red-500 shrink-0 px-1"
                  >✕</button>
                </div>
              ))}
              <button
                onClick={() => onChange({ carouselSlides: [...draft.carouselSlides, ''] })}
                className="text-xs text-[#C86A43] hover:underline text-left ml-7"
              >
                + Add slide
              </button>
              <p className="text-[11px] text-[#9CA3AF] ml-7">First slide will be used as the cover image automatically.</p>
            </div>
          </div>
        )}

        <SectionDivider label="Cover Image" />

        <Field label="Cover Image" hint="Choose from Media Library, upload, or paste an external URL.">
          <div className="flex flex-col gap-2">
            {draft.coverImage && (
              <img src={draft.coverImage} alt="" className="w-full h-32 rounded-xl object-cover bg-[#F3EDE6] border border-[#E8E4DD]" />
            )}
            {hasCarousel && draft.carouselSlides[0] && !draft.coverImage && (
              <div className="flex items-center gap-2 px-3 py-2 bg-[#F8F5F0] rounded-lg border border-[#E8E4DD]">
                <svg className="w-3.5 h-3.5 text-[#5E6B4A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-xs text-[#5E6B4A]">First carousel slide will be used as cover automatically.</p>
              </div>
            )}
            <input
              type="url"
              value={draft.coverImage}
              onChange={e => onChange({ coverImage: e.target.value })}
              placeholder="/assets/my-photo.jpg or https://…"
              className={inp}
            />
            <div className="flex gap-2">
              <button disabled className="text-xs text-[#9CA3AF] px-2.5 py-1.5 rounded-lg border border-[#E8E4DD] cursor-not-allowed">
                Choose from Media Library
              </button>
              <button disabled className="text-xs text-[#9CA3AF] px-2.5 py-1.5 rounded-lg border border-[#E8E4DD] cursor-not-allowed">
                Upload
              </button>
            </div>
          </div>
        </Field>

        <button
          onClick={onNext}
          disabled={!canContinue}
          className="w-full py-3 bg-[#C86A43] text-white text-sm font-semibold rounded-xl hover:bg-[#b05a35] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Continue to Connections
        </button>
      </div>
    </div>
  )
}

// ─── Step 3: Connections ──────────────────────────────────────────────────────

function ConnectionsStep({
  draft, onChange, onNext, onBack,
}: {
  draft: PublishDraft
  onChange: (patch: Partial<PublishDraft>) => void
  onNext: () => void
  onBack: () => void
}) {
  const founders   = getFounders()
  const businesses = getBusinesses()
  const singleFounder  = founders.length === 1  ? founders[0]   : null
  const singleBusiness = businesses.length === 1 ? businesses[0] : null

  function toggleTopic(topic: Topic) {
    const has = draft.topics.some(t => t.id === topic.id)
    onChange({ topics: has ? draft.topics.filter(t => t.id !== topic.id) : [...draft.topics, topic] })
  }

  // For Camera Roll and Import, we also need title/summary here
  const needsTitleSummary = draft.source === 'camera-roll' || draft.source === 'import'

  return (
    <div className="max-w-xl">
      <StepHeader
        title="Connections"
        subtitle="CULO has pre-filled what it can. Review and edit anything that needs changing."
        onBack={onBack}
      />

      <div className="flex flex-col gap-5">

        {/* Title + summary for camera-roll / import sources */}
        {needsTitleSummary && (
          <>
            <SectionDivider label="Your Story" />
            <Field label="Title">
              <input
                type="text"
                value={draft.title}
                onChange={e => onChange({ title: e.target.value })}
                placeholder="What is this story about?"
                className={inp}
              />
            </Field>
            <Field label="Summary">
              <textarea
                value={draft.summary}
                onChange={e => onChange({ summary: e.target.value })}
                rows={3}
                placeholder="What will the reader take away?"
                className={inp + ' resize-y'}
              />
            </Field>
            <Field label="Content Formats">
              <div className="flex gap-2 flex-wrap mt-1">
                {CONTENT_TYPES.map(ct => (
                  <button
                    key={ct}
                    onClick={() => {
                      const has = draft.contentTypes.includes(ct)
                      onChange({ contentTypes: has ? draft.contentTypes.filter(x => x !== ct) : [...draft.contentTypes, ct] })
                    }}
                    className={`px-3 py-1.5 rounded-lg text-sm border font-medium transition-colors capitalize ${
                      draft.contentTypes.includes(ct)
                        ? 'bg-[#C86A43] text-white border-[#C86A43]'
                        : 'bg-white text-[#6B7280] border-[#E8E4DD] hover:border-[#C86A43]/50'
                    }`}
                  >
                    {ct}
                  </button>
                ))}
              </div>
            </Field>
          </>
        )}

        <SectionDivider label="Publisher" />

        {/* Founder */}
        {singleFounder ? (
          <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-[#E8E4DD]">
            {singleFounder.avatar && (
              <img src={singleFounder.avatar} alt="" className="w-8 h-8 rounded-full object-cover shrink-0 bg-[#F3EDE6]" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#2D2A26] truncate">{singleFounder.name}</p>
              <p className="text-xs text-[#9CA3AF]">Publisher · auto-selected</p>
            </div>
            <svg className="w-4 h-4 text-[#5E6B4A] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        ) : founders.length > 0 ? (
          <Field label="Publisher">
            <select value={draft.founderId} onChange={e => onChange({ founderId: e.target.value })} className={inp}>
              {founders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </Field>
        ) : (
          <div className="px-4 py-3 bg-[#F8F5F0] rounded-xl border border-[#E8E4DD]">
            <p className="text-xs text-[#9CA3AF]">Complete your profile first to publish a story.</p>
            <Link to="/dashboard/profile" className="text-xs text-[#C86A43] hover:underline mt-1 inline-block">Set up your profile →</Link>
          </div>
        )}

        {/* Business */}
        {singleBusiness ? (
          <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-[#E8E4DD]">
            <img src={singleBusiness.logo} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0 bg-[#F3EDE6]" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#2D2A26] truncate">{singleBusiness.name}</p>
              <p className="text-xs text-[#9CA3AF]">Business · auto-selected</p>
            </div>
            <svg className="w-4 h-4 text-[#5E6B4A] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        ) : businesses.length > 1 ? (
          <Field label="Business">
            <select value={draft.businessId} onChange={e => onChange({ businessId: e.target.value })} className={inp}>
              {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </Field>
        ) : null}

        <SectionDivider label="Topics" />

        <Field label="Topics" hint="Select the topics this story belongs to. Used for discovery and knowledge graph connections.">
          <div className="flex flex-wrap gap-1.5 mt-1">
            {allTopics.map(topic => {
              const active = draft.topics.some(t => t.id === topic.id)
              return (
                <button key={topic.id} onClick={() => toggleTopic(topic)}
                  className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                    active
                      ? 'bg-[#C86A43] text-white border-[#C86A43]'
                      : 'bg-white text-[#4B4845] border-[#E8E4DD] hover:border-[#C86A43]/50'
                  }`}>
                  {topic.name}
                </button>
              )
            })}
          </div>
        </Field>

        <SectionDivider label="CTA" />

        <div className="grid grid-cols-2 gap-3">
          <Field label="CTA Label">
            <input
              type="text"
              value={draft.ctaLabel}
              onChange={e => onChange({ ctaLabel: e.target.value })}
              className={inp}
              placeholder="Read more"
            />
          </Field>
          <Field label="CTA URL" hint="Optional">
            <input
              type="url"
              value={draft.ctaUrl}
              onChange={e => onChange({ ctaUrl: e.target.value })}
              className={inp}
              placeholder="https://"
            />
          </Field>
        </div>

        <SectionDivider label="Publishing" />

        <div className="flex gap-2">
          {(['draft', 'published'] as const).map(s => (
            <button
              key={s}
              onClick={() => onChange({ status: s })}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-colors capitalize ${
                draft.status === s
                  ? 'border-[#C86A43] bg-[#C86A43] text-white'
                  : 'border-[#E8E4DD] bg-white text-[#6B7280] hover:border-[#C86A43]/40'
              }`}
            >
              {s === 'draft' ? 'Save as Draft' : 'Publish Now'}
            </button>
          ))}
        </div>

        <button
          onClick={onNext}
          disabled={!draft.founderId}
          className="w-full py-3 bg-[#C86A43] text-white text-sm font-semibold rounded-xl hover:bg-[#b05a35] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Preview Publication
        </button>
      </div>
    </div>
  )
}

// ─── Step 4: Preview ──────────────────────────────────────────────────────────

const DISTRIBUTION_LOCATIONS = [
  'Founder Profile',
  'Business Profile',
  'Story Archive',
  'Homepage (if featured)',
  'Search',
  'Related Stories',
  'Media Library',
  'Knowledge Graph',
  'Website Widgets (future)',
]

const KNOWLEDGE_OUTPUTS = [
  'Internal relationships',
  'Knowledge graph connections',
  'Related content suggestions',
  'AI-readable metadata',
  'Search metadata',
  'Suggested FAQs',
  'Suggested Ideas',
  'Suggested Resources',
]

function PreviewStep({
  draft, onPublish, onBack, publishing,
}: {
  draft: PublishDraft
  onPublish: () => void
  onBack: () => void
  publishing: boolean
}) {
  const founders   = getFounders()
  const businesses = getBusinesses()
  const founder    = founders.find(f => f.id === draft.founderId)
  const business   = businesses.find(b => b.id === draft.businessId)

  const hasBlog           = draft.contentTypes.includes('blog')
  const hasCarouselSlide  = draft.contentTypes.includes('carousel') && draft.carouselSlides.filter(Boolean).length > 0
  const missingCoverImage = !draft.coverImage && !hasCarouselSlide

  return (
    <div className="max-w-2xl">
      <StepHeader
        title="Ready to Publish"
        subtitle="Review where this will appear before it goes live."
        onBack={onBack}
      />

      {/* Cover image warning for blog without image */}
      {hasBlog && missingCoverImage && (
        <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl mb-5">
          <svg className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <div>
            <p className="text-xs font-semibold text-amber-800">No cover image</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Blog posts display best with a cover image. A placeholder will be used until you add one.{' '}
              <button onClick={onBack} className="underline hover:no-underline">Go back to add one.</button>
            </p>
          </div>
        </div>
      )}

      {/* Summary card */}
      <div className="bg-white rounded-2xl border border-[#E8E4DD] px-5 py-4 mb-6">
        <div className="flex items-start gap-3">
          {draft.coverImage ? (
            <img src={draft.coverImage} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0 bg-[#F3EDE6]" />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-[#F3EDE6] shrink-0 flex items-center justify-center">
              <span className="text-2xl">📝</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-[#2D2A26] leading-snug mb-1">
              {draft.title || 'Untitled publication'}
            </p>
            {draft.summary && <p className="text-sm text-[#6B7280] line-clamp-2">{draft.summary}</p>}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {draft.contentTypes.map(ct => (
                <span key={ct} className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-[#F3EDE6] text-[#C86A43] uppercase">{ct}</span>
              ))}
              {founder && <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#F3EDE6] text-[#6B7280]">{founder.name}</span>}
              {business && <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#F3EDE6] text-[#6B7280]">{business.name}</span>}
            </div>
          </div>
          <span className={`text-[10px] font-semibold px-2 py-1 rounded-full shrink-0 ${
            draft.status === 'published'
              ? 'bg-green-100 text-green-700'
              : 'bg-[#F3EDE6] text-[#9CA3AF]'
          }`}>
            {draft.status}
          </span>
        </div>
      </div>

      {/* Two panels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">

        {/* Distribution */}
        <div className="bg-white rounded-2xl border border-[#E8E4DD] px-5 py-4">
          <p className="text-sm font-bold text-[#2D2A26] mb-1">
            {draft.status === 'published' ? 'This story will appear in:' : 'Once published, appears in:'}
          </p>
          <p className="text-xs text-[#9CA3AF] mb-4">Publish once, distributed everywhere.</p>
          <div className="space-y-2.5">
            {DISTRIBUTION_LOCATIONS.map(loc => (
              <CheckItem
                key={loc}
                label={loc}
                done={draft.status === 'published' && !loc.includes('future')}
              />
            ))}
          </div>
        </div>

        {/* Knowledge */}
        <div className="bg-white rounded-2xl border border-[#E8E4DD] px-5 py-4">
          <p className="text-sm font-bold text-[#2D2A26] mb-1">CULO will also create:</p>
          <p className="text-xs text-[#9CA3AF] mb-4">Your knowledge stays connected and grows over time.</p>
          <div className="space-y-2.5">
            {KNOWLEDGE_OUTPUTS.map(item => (
              <CheckItem key={item} label={item} done={false} />
            ))}
          </div>
          <p className="text-[11px] text-[#9CA3AF] mt-4">Knowledge automations coming in a future sprint.</p>
        </div>

      </div>

      {/* Topics preview */}
      {draft.topics.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-6">
          {draft.topics.map(t => (
            <span key={t.id} className="text-xs px-2.5 py-1 rounded-full bg-[#F3EDE6] text-[#C86A43] font-medium">{t.name}</span>
          ))}
        </div>
      )}

      {/* Publish button */}
      <button
        onClick={onPublish}
        disabled={publishing}
        className="w-full py-4 bg-[#C86A43] text-white text-base font-bold rounded-2xl hover:bg-[#b05a35] disabled:opacity-60 transition-colors"
      >
        {publishing
          ? 'Publishing…'
          : draft.status === 'published'
          ? 'Publish to Village'
          : 'Save as Draft'}
      </button>
    </div>
  )
}

// ─── Step 5: Published ────────────────────────────────────────────────────────

function PublishedStep({ draft, publishedSlug, onPublishAnother }: { draft: PublishDraft; publishedSlug: string; onPublishAnother: () => void }) {
  return (
    <div className="max-w-md text-center">
      <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-[#2D2A26] mb-2">
        {draft.status === 'published' ? 'Published to the Village' : 'Saved as Draft'}
      </h1>
      <p className="text-sm text-[#6B7280] mb-8 leading-relaxed">
        {draft.status === 'published'
          ? `"${draft.title}" is now live. It's been distributed across the Village and is visible in your Founder Profile, the Story Archive and Search.`
          : `"${draft.title}" has been saved as a draft. You can publish it any time from My Publications.`}
      </p>
      <div className="flex flex-col gap-3">
        {draft.status === 'published' && (
          <a
            href={`/stories/${publishedSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 bg-[#C86A43] text-white text-sm font-semibold rounded-xl hover:bg-[#b05a35] transition-colors block"
          >
            View in Village ↗
          </a>
        )}
        <Link
          to="/dashboard/stories"
          className="w-full py-3 border border-[#E8E4DD] text-[#2D2A26] text-sm font-medium rounded-xl hover:border-[#C86A43]/40 hover:text-[#C86A43] transition-colors block"
        >
          My Publications
        </Link>
        <button
          onClick={onPublishAnother}
          className="text-sm text-[#9CA3AF] hover:text-[#C86A43] transition-colors"
        >
          Publish something else →
        </button>
      </div>
    </div>
  )
}

// ─── Progress indicator ───────────────────────────────────────────────────────

const STEP_LABELS: Partial<Record<PublishStep, string>> = {
  source: 'Source',
  'camera-roll': 'Capture',
  import: 'Import',
  write: 'Write',
  canva: 'Canva',
  connections: 'Connections',
  preview: 'Preview',
  published: 'Published',
}

const STEP_ORDER: PublishStep[] = ['source', 'write', 'connections', 'preview', 'published']

function ProgressBar({ step }: { step: PublishStep }) {
  const steps = step === 'canva'
    ? ['source', 'canva']
    : STEP_ORDER.map(s => {
        if (s === 'write') {
          return step === 'camera-roll' ? 'camera-roll'
               : step === 'import'     ? 'import'
               : 'write'
        }
        return s
      })

  const currentIdx = steps.indexOf(step)

  return (
    <div className="flex items-center gap-2 mb-8">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 ${i <= currentIdx ? 'text-[#C86A43]' : 'text-[#9CA3AF]'}`}>
            <div className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${
              i < currentIdx  ? 'bg-[#5E6B4A] text-white'  :
              i === currentIdx ? 'bg-[#C86A43] text-white'  :
              'bg-[#E8E4DD] text-[#9CA3AF]'
            }`}>
              {i < currentIdx ? '✓' : i + 1}
            </div>
            <span className="text-xs font-medium hidden sm:inline">{STEP_LABELS[s as PublishStep] ?? s}</span>
          </div>
          {i < steps.length - 1 && <div className={`flex-1 h-px w-6 ${i < currentIdx ? 'bg-[#5E6B4A]' : 'bg-[#E8E4DD]'}`} />}
        </div>
      ))}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function DashboardPublishPage() {
  const [step,           setStep]           = useState<PublishStep>('source')
  const [draft,          setDraft]          = useState<PublishDraft>(defaultDraft)
  const [publishing,     setPublishing]     = useState(false)
  const [publishedSlug,  setPublishedSlug]  = useState('')

  function patch(changes: Partial<PublishDraft>) {
    setDraft(prev => ({ ...prev, ...changes }))
  }

  function selectSource(source: PublishSource) {
    patch({ source })
    setStep(source)
  }

  function goConnections() { setStep('connections') }
  function goPreview()     { setStep('preview') }
  function goBack()        { setStep('source') }

  function handlePublish() {
    setPublishing(true)
    const founder    = getFounders().find(f => f.id === draft.founderId)
    const location   = locations.find(l => l.id === draft.locationId)  ?? locations[0]
    const industry   = industries.find(i => i.id === draft.industryId) ?? industries[0]
    const titleSlug  = slugify(draft.title) || `pub-${Date.now()}`
    const id         = `pub-${Date.now()}`

    updateStory({
      id,
      slug:          titleSlug,
      title:         draft.title         || 'Untitled',
      summary:       draft.summary       || '',
      coverImage:    draft.coverImage    || (draft.carouselSlides[0] ?? '/placeholders/village-story.svg'),
      founderId:     draft.founderId,
      businessId:    draft.businessId,
      location,
      industry:      founder?.industry ?? industry,
      topics:        draft.topics,
      contentTypes:  draft.contentTypes.length > 0 ? draft.contentTypes : ['blog'],
      blog:          draft.blog          || undefined,
      reelUrl:       draft.reelUrl       || undefined,
      carouselImages: draft.carouselSlides.filter(Boolean).length > 0 ? draft.carouselSlides.filter(Boolean) : undefined,
      ideaIds:       [],
      relatedStoryIds: [],
      ctaLabel:      draft.ctaLabel,
      ctaUrl:        draft.ctaUrl,
      status:        draft.status,
      featured:      false,
      publishingSource: draft.source === 'camera-roll' ? 'one-drive-import'
                      : draft.source === 'import'      ? 'website-import'
                      : 'manual-dashboard',
      createdAt:     new Date().toISOString().split('T')[0],
      updatedAt:     new Date().toISOString().split('T')[0],
    })

    setPublishedSlug(titleSlug)
    setPublishing(false)
    setStep('published')
  }

  function resetFlow() {
    setDraft(defaultDraft())
    setStep('source')
    setPublishedSlug('')
  }

  return (
    <div className="min-h-full p-8" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {step !== 'published' && <ProgressBar step={step} />}

      {step === 'source'      && <SourceStep onSelect={selectSource} />}
      {step === 'canva'       && <CanvaStep onBack={goBack} />}
      {step === 'camera-roll' && (
        <CameraRollStep draft={draft} onChange={patch} onNext={goConnections} onBack={goBack} />
      )}
      {step === 'import'      && (
        <ImportStep draft={draft} onChange={patch} onNext={goConnections} onBack={goBack} />
      )}
      {step === 'write'       && (
        <WriteStep draft={draft} onChange={patch} onNext={goConnections} onBack={goBack} />
      )}
      {step === 'connections' && (
        <ConnectionsStep draft={draft} onChange={patch} onNext={goPreview} onBack={() => setStep(draft.source ?? 'source')} />
      )}
      {step === 'preview'     && (
        <PreviewStep draft={draft} onPublish={handlePublish} onBack={() => setStep('connections')} publishing={publishing} />
      )}
      {step === 'published'   && (
        <PublishedStep draft={draft} publishedSlug={publishedSlug} onPublishAnother={resetFlow} />
      )}
    </div>
  )
}
