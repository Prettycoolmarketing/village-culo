import { useState, useRef, type ReactNode, type ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import { getFounders } from '../../services/founders'
import { getBusinesses } from '../../services/businesses'
import { updateStory } from '../../services/stories'
import { locations } from '../../data/locations'
import { industries } from '../../data/industries'
import { topics as allTopics } from '../../data/topics'
import { slugify } from '../../utils/slugify'
import type { ContentType, Topic } from '../../types'

// ─── Content formats ──────────────────────────────────────────────────────────

const FORMATS: { type: ContentType; emoji: string; label: string; desc: string }[] = [
  { type: 'blog',             emoji: '📝', label: 'Blog',             desc: 'Written article or post'      },
  { type: 'reel',             emoji: '🎥', label: 'Reel',             desc: 'Short-form vertical video'    },
  { type: 'carousel',         emoji: '🎠', label: 'Carousel',         desc: 'Swipeable image slides'       },
  { type: 'podcast',          emoji: '🎙️', label: 'Podcast',          desc: 'Audio episode'                },
  { type: 'talking-head',     emoji: '🎤', label: 'Talking Head',     desc: 'On-camera video'              },
  { type: 'voice-over',       emoji: '🎧', label: 'Voice Over',       desc: 'Audio narration with visuals' },
  { type: 'photo-story',      emoji: '📷', label: 'Photo Story',      desc: 'Photo series or gallery'      },
  { type: 'document',         emoji: '📄', label: 'Document',         desc: 'PDF, Word or guide'           },
  { type: 'external-article', emoji: '🌐', label: 'External Article', desc: 'Piece published elsewhere'    },
  { type: 'youtube-video',    emoji: '▶️', label: 'YouTube Video',    desc: 'Long-form video content'      },
  { type: 'social-post',      emoji: '📱', label: 'Social Post',      desc: 'LinkedIn, Instagram, TikTok'  },
]

// ─── Steps ────────────────────────────────────────────────────────────────────

type PublishStep = 'format' | 'content' | 'info' | 'media' | 'connections' | 'preview' | 'done'

const STEPS: PublishStep[] = ['format', 'content', 'info', 'media', 'connections', 'preview', 'done']

const STEP_LABELS: Record<PublishStep, string> = {
  format:      'Format',
  content:     'Content',
  info:        'Information',
  media:       'Media',
  connections: 'Connections',
  preview:     'Review',
  done:        'Published',
}

// ─── Draft ────────────────────────────────────────────────────────────────────

interface UrlEntry { id: number; url: string }

interface PublishDraft {
  contentTypes:       ContentType[]
  uploadedFileNames:  string[]
  urlEntries:         UrlEntry[]
  pastedText:         string
  title:              string
  subtitle:           string
  summary:            string
  coverImage:         string
  reelUrl:            string
  audioUrl:           string
  carouselSlides:     string[]
  documentUrl:        string
  blog:               string
  founderId:          string
  businessId:         string
  topics:             Topic[]
  ctaLabel:           string
  ctaUrl:             string
}

function defaultDraft(): PublishDraft {
  const founders   = getFounders()
  const businesses = getBusinesses()
  return {
    contentTypes:      ['blog'],
    uploadedFileNames: [],
    urlEntries:        [],
    pastedText:        '',
    title:             '',
    subtitle:          '',
    summary:           '',
    coverImage:        '',
    reelUrl:           '',
    audioUrl:          '',
    carouselSlides:    [''],
    documentUrl:       '',
    blog:              '',
    founderId:         founders[0]?.id   ?? '',
    businessId:        businesses[0]?.id ?? '',
    topics:            [],
    ctaLabel:          'Read more',
    ctaUrl:            '',
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

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ step }: { step: PublishStep }) {
  const currentIdx = STEPS.indexOf(step)
  return (
    <div className="flex items-center gap-1 mb-10 overflow-x-auto pb-1">
      {STEPS.map((s, i) => (
        <div key={s} className="flex items-center gap-1 shrink-0">
          <div className={`flex items-center gap-1.5 ${i <= currentIdx ? 'text-[#C86A43]' : 'text-[#9CA3AF]'}`}>
            <div className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${
              i < currentIdx   ? 'bg-[#5E6B4A] text-white'
              : i === currentIdx ? 'bg-[#C86A43] text-white'
              : 'bg-[#E8E4DD] text-[#9CA3AF]'
            }`}>
              {i < currentIdx ? '✓' : i + 1}
            </div>
            <span className="text-[11px] font-medium hidden sm:inline">{STEP_LABELS[s]}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`w-4 h-px ml-1 ${i < currentIdx ? 'bg-[#5E6B4A]' : 'bg-[#E8E4DD]'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Step 1: Format ───────────────────────────────────────────────────────────

function FormatStep({ draft, onChange, onNext }: {
  draft: PublishDraft
  onChange: (patch: Partial<PublishDraft>) => void
  onNext: () => void
}) {
  function toggle(type: ContentType) {
    const has = draft.contentTypes.includes(type)
    onChange({ contentTypes: has ? draft.contentTypes.filter(t => t !== type) : [...draft.contentTypes, type] })
  }

  const firstLabel = FORMATS.find(f => f.type === draft.contentTypes[0])?.label ?? draft.contentTypes[0]

  return (
    <div className="max-w-2xl">
      <StepHeader
        title="What are you publishing?"
        subtitle="Select every format this content exists in. You can choose more than one."
      />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
        {FORMATS.map(f => {
          const active = draft.contentTypes.includes(f.type)
          return (
            <button
              key={f.type}
              onClick={() => toggle(f.type)}
              className={`text-left p-4 rounded-2xl border-2 transition-all ${
                active
                  ? 'border-[#C86A43] bg-[#FDF6F3]'
                  : 'border-[#E8E4DD] bg-white hover:border-[#C86A43]/40 hover:bg-[#FDFAF8]'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-2xl">{f.emoji}</span>
                {active && (
                  <div className="w-4 h-4 rounded-full bg-[#C86A43] flex items-center justify-center shrink-0">
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
              <p className="text-sm font-semibold text-[#2D2A26] mb-0.5">{f.label}</p>
              <p className="text-[11px] text-[#9CA3AF] leading-snug">{f.desc}</p>
            </button>
          )
        })}
      </div>
      <button
        onClick={onNext}
        disabled={draft.contentTypes.length === 0}
        className="w-full py-3 bg-[#C86A43] text-white text-sm font-semibold rounded-xl hover:bg-[#b05a35] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {draft.contentTypes.length === 0
          ? 'Select at least one format'
          : draft.contentTypes.length === 1
          ? `Continue — ${firstLabel}`
          : `Continue — ${draft.contentTypes.length} formats selected`}
      </button>
    </div>
  )
}

// ─── Step 2: Content ─────────────────────────────────────────────────────────

type ContentTab = 'upload' | 'url' | 'text' | 'library'

function ContentStep({ draft, onChange, onNext, onBack }: {
  draft: PublishDraft
  onChange: (patch: Partial<PublishDraft>) => void
  onNext: () => void
  onBack: () => void
}) {
  const [contentTab, setContentTab] = useState<ContentTab>('upload')
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFiles(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    onChange({ uploadedFileNames: [...draft.uploadedFileNames, ...files.map(f => f.name)] })
  }

  function addUrlEntry() {
    const maxId = draft.urlEntries.reduce((m, e) => Math.max(m, e.id), 0)
    onChange({ urlEntries: [...draft.urlEntries, { id: maxId + 1, url: '' }] })
  }

  function updateUrlEntry(id: number, url: string) {
    onChange({ urlEntries: draft.urlEntries.map(e => e.id === id ? { ...e, url } : e) })
  }

  function removeUrlEntry(id: number) {
    onChange({ urlEntries: draft.urlEntries.filter(e => e.id !== id) })
  }

  const hasContent =
    draft.uploadedFileNames.length > 0 ||
    draft.urlEntries.some(e => e.url.trim()) ||
    draft.pastedText.trim().length > 0

  const CONTENT_TABS: { key: ContentTab; label: string; soon?: boolean }[] = [
    { key: 'upload',  label: 'Upload' },
    { key: 'url',     label: 'Paste URL' },
    { key: 'text',    label: 'Paste Text' },
    { key: 'library', label: 'Media Library', soon: true },
  ]

  return (
    <div className="max-w-lg">
      <StepHeader
        title="Add Your Content"
        subtitle="Upload, link or paste your existing content. Skip if writing from scratch."
        onBack={onBack}
      />

      <div className="flex gap-1 p-1 bg-[#F8F5F0] rounded-xl mb-5">
        {CONTENT_TABS.map(t => (
          <button
            key={t.key}
            onClick={() => !t.soon && setContentTab(t.key)}
            disabled={!!t.soon}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
              contentTab === t.key && !t.soon
                ? 'bg-white text-[#2D2A26] shadow-sm'
                : t.soon
                ? 'text-[#C8C4BC] cursor-not-allowed'
                : 'text-[#9CA3AF] hover:text-[#2D2A26]'
            }`}
          >
            {t.label}{t.soon && <span className="ml-1 text-[9px] align-top">soon</span>}
          </button>
        ))}
      </div>

      {contentTab === 'upload' && (
        <div>
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-[#E8E4DD] rounded-2xl p-10 text-center cursor-pointer hover:border-[#C86A43]/50 hover:bg-[#F8F5F0] transition-all mb-4"
          >
            <div className="w-12 h-12 rounded-xl bg-[#F3EDE6] flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-[#C86A43]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-[#2D2A26] mb-1">Upload photos, video, audio or documents</p>
            <p className="text-xs text-[#9CA3AF]">MP4, MOV, JPG, PNG, MP3, M4A, PDF, DOCX</p>
            <input
              ref={fileRef}
              type="file"
              multiple
              accept="video/*,image/*,audio/*,.pdf,.docx,.doc,.md"
              className="hidden"
              onChange={handleFiles}
            />
          </div>
          {draft.uploadedFileNames.length > 0 && (
            <div className="bg-white rounded-xl border border-[#E8E4DD] divide-y divide-[#F3EDE6]">
              {draft.uploadedFileNames.map((name, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                  <p className="text-xs text-[#2D2A26] truncate flex-1">{name}</p>
                  <button
                    onClick={() => onChange({ uploadedFileNames: draft.uploadedFileNames.filter((_, j) => j !== i) })}
                    className="text-xs text-[#9CA3AF] hover:text-red-500 shrink-0"
                  >✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {contentTab === 'url' && (
        <div className="flex flex-col gap-3">
          {draft.urlEntries.length === 0 && (
            <p className="text-xs text-[#9CA3AF] italic">No URLs yet. Click below to add your first link.</p>
          )}
          {draft.urlEntries.map(entry => (
            <div key={entry.id} className="flex items-center gap-2">
              <input
                type="url"
                value={entry.url}
                onChange={e => updateUrlEntry(entry.id, e.target.value)}
                placeholder="https://…"
                className={inp + ' flex-1'}
              />
              <button onClick={() => removeUrlEntry(entry.id)} className="text-xs text-[#9CA3AF] hover:text-red-500 px-2">✕</button>
            </div>
          ))}
          <button onClick={addUrlEntry} className="text-xs text-[#C86A43] hover:underline text-left">
            + Add URL
          </button>
          <p className="text-[11px] text-[#9CA3AF]">Add multiple URLs if the content exists across different platforms.</p>
        </div>
      )}

      {contentTab === 'text' && (
        <Field label="Paste your content" hint="Blog post, article, social caption, transcript or any text you want to publish.">
          <textarea
            value={draft.pastedText}
            onChange={e => onChange({ pastedText: e.target.value })}
            rows={10}
            placeholder="Paste your content here…"
            className={inp + ' resize-y'}
          />
        </Field>
      )}

      {contentTab === 'library' && (
        <div className="bg-[#F8F5F0] rounded-2xl p-8 text-center">
          <p className="text-sm font-semibold text-[#2D2A26] mb-2">Media Library — Coming Soon</p>
          <p className="text-xs text-[#9CA3AF]">Choose from your uploaded assets, Canva designs and previously published media.</p>
        </div>
      )}

      <div className="mt-6 flex gap-3">
        <button
          onClick={onNext}
          disabled={!hasContent}
          className="flex-1 py-3 bg-[#C86A43] text-white text-sm font-semibold rounded-xl hover:bg-[#b05a35] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Continue
        </button>
        {!hasContent && (
          <button
            onClick={onNext}
            className="px-5 py-3 border border-[#E8E4DD] text-[#6B7280] text-sm rounded-xl hover:border-[#C86A43]/40 transition-colors"
          >
            Skip
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Step 3: Info ─────────────────────────────────────────────────────────────

function InfoStep({ draft, onChange, onNext, onBack }: {
  draft: PublishDraft
  onChange: (patch: Partial<PublishDraft>) => void
  onNext: () => void
  onBack: () => void
}) {
  const canContinue = draft.title.trim().length > 0 && draft.summary.trim().length > 0

  return (
    <div className="max-w-lg">
      <StepHeader
        title="Story Information"
        subtitle="Give your content a title and summary. This is how it appears in the Village."
        onBack={onBack}
      />
      <div className="flex flex-col gap-5">
        <Field label="Title *">
          <input
            type="text"
            value={draft.title}
            onChange={e => onChange({ title: e.target.value })}
            placeholder="What is this story about?"
            className={inp}
          />
        </Field>
        <Field label="Summary *" hint="One or two sentences. What will the reader take away?">
          <textarea
            value={draft.summary}
            onChange={e => onChange({ summary: e.target.value })}
            rows={3}
            placeholder="The honest story of…"
            className={inp + ' resize-y'}
          />
        </Field>
        <Field label="Subtitle" hint="Optional secondary headline.">
          <input
            type="text"
            value={draft.subtitle}
            onChange={e => onChange({ subtitle: e.target.value })}
            placeholder="Optional…"
            className={inp}
          />
        </Field>
        <button
          onClick={onNext}
          disabled={!canContinue}
          className="w-full py-3 bg-[#C86A43] text-white text-sm font-semibold rounded-xl hover:bg-[#b05a35] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  )
}

// ─── Step 4: Media ────────────────────────────────────────────────────────────

function MediaStep({ draft, onChange, onNext, onBack }: {
  draft: PublishDraft
  onChange: (patch: Partial<PublishDraft>) => void
  onNext: () => void
  onBack: () => void
}) {
  const types = draft.contentTypes
  const hasVideo    = types.some(t => ['reel', 'talking-head', 'youtube-video'].includes(t))
  const hasAudio    = types.some(t => ['podcast', 'voice-over'].includes(t))
  const hasSlides   = types.some(t => ['carousel', 'photo-story'].includes(t))
  const hasDocument = types.some(t => ['document', 'external-article', 'social-post'].includes(t))
  const hasBlog     = types.includes('blog')
  const autocover   = hasSlides && draft.carouselSlides.filter(Boolean).length > 0

  return (
    <div className="max-w-xl">
      <StepHeader
        title="Add Media"
        subtitle="Only fill in what you have. You can always add more later from My Publications."
        onBack={onBack}
      />
      <div className="flex flex-col gap-6">

        {hasVideo && (
          <div className="border border-[#E8E4DD] rounded-xl overflow-hidden">
            <div className="bg-[#F8F5F0] px-4 py-2 border-b border-[#E8E4DD]">
              <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-widest">
                {types.includes('youtube-video') ? 'YouTube / Video URL' : 'Reel / Video URL'}
              </p>
            </div>
            <div className="px-4 py-3">
              <Field label="URL" hint="YouTube, Instagram Reel, TikTok or YouTube Shorts">
                <input
                  type="url"
                  value={draft.reelUrl}
                  onChange={e => onChange({ reelUrl: e.target.value })}
                  placeholder="https://youtube.com/watch?v=… or https://instagram.com/reel/…"
                  className={inp}
                />
              </Field>
            </div>
          </div>
        )}

        {hasAudio && (
          <div className="border border-[#E8E4DD] rounded-xl overflow-hidden">
            <div className="bg-[#F8F5F0] px-4 py-2 border-b border-[#E8E4DD]">
              <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-widest">Audio URL</p>
            </div>
            <div className="px-4 py-3">
              <Field label="URL" hint="Spotify, Apple Podcasts, Anchor or direct audio link">
                <input
                  type="url"
                  value={draft.audioUrl}
                  onChange={e => onChange({ audioUrl: e.target.value })}
                  placeholder="https://open.spotify.com/episode/… or https://…"
                  className={inp}
                />
              </Field>
            </div>
          </div>
        )}

        {hasSlides && (
          <div className="border border-[#E8E4DD] rounded-xl overflow-hidden">
            <div className="bg-[#F8F5F0] px-4 py-2 border-b border-[#E8E4DD]">
              <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-widest">
                {types.includes('photo-story') ? 'Gallery / Slides' : 'Carousel Slides'}
              </p>
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
              <p className="text-[11px] text-[#9CA3AF] ml-7">First image is used as cover automatically.</p>
            </div>
          </div>
        )}

        {hasDocument && (
          <div className="border border-[#E8E4DD] rounded-xl overflow-hidden">
            <div className="bg-[#F8F5F0] px-4 py-2 border-b border-[#E8E4DD]">
              <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-widest">Document / External Link</p>
            </div>
            <div className="px-4 py-3">
              <Field label="URL" hint="Link to the document, article or social post">
                <input
                  type="url"
                  value={draft.documentUrl}
                  onChange={e => onChange({ documentUrl: e.target.value })}
                  placeholder="https://…"
                  className={inp}
                />
              </Field>
            </div>
          </div>
        )}

        {hasBlog && (
          <div className="border border-[#E8E4DD] rounded-xl overflow-hidden">
            <div className="bg-[#F8F5F0] px-4 py-2 border-b border-[#E8E4DD]">
              <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-widest">Blog Content</p>
            </div>
            <div className="px-4 py-3 flex flex-col gap-2">
              <textarea
                value={draft.blog}
                onChange={e => onChange({ blog: e.target.value })}
                rows={8}
                placeholder="Write or paste your full blog post. Markdown supported: ## headings, **bold**, - lists."
                className={inp + ' resize-y'}
              />
              {draft.pastedText && !draft.blog && (
                <button
                  onClick={() => onChange({ blog: draft.pastedText })}
                  className="text-xs text-[#C86A43] hover:underline text-left"
                >
                  Use pasted text as blog content →
                </button>
              )}
            </div>
          </div>
        )}

        <div className="border border-[#E8E4DD] rounded-xl overflow-hidden">
          <div className="bg-[#F8F5F0] px-4 py-2 border-b border-[#E8E4DD]">
            <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-widest">Cover Image</p>
          </div>
          <div className="px-4 py-3 flex flex-col gap-2">
            {autocover && !draft.coverImage && (
              <div className="flex items-center gap-2 px-3 py-2 bg-[#F8F5F0] rounded-lg border border-[#E8E4DD]">
                <svg className="w-3.5 h-3.5 text-[#5E6B4A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-xs text-[#5E6B4A]">First slide will be used as cover automatically.</p>
              </div>
            )}
            {draft.coverImage && (
              <img src={draft.coverImage} alt="" className="w-full h-32 rounded-xl object-cover bg-[#F3EDE6] border border-[#E8E4DD]" />
            )}
            <input
              type="url"
              value={draft.coverImage}
              onChange={e => onChange({ coverImage: e.target.value })}
              placeholder="/assets/my-photo.jpg or https://…"
              className={inp}
            />
            <button disabled className="text-xs text-[#9CA3AF] px-2.5 py-1.5 rounded-lg border border-[#E8E4DD] cursor-not-allowed w-fit">
              Media Library (coming soon)
            </button>
          </div>
        </div>

        <button
          onClick={onNext}
          className="w-full py-3 bg-[#C86A43] text-white text-sm font-semibold rounded-xl hover:bg-[#b05a35] transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  )
}

// ─── Step 5: Connections ──────────────────────────────────────────────────────

function ConnectionsStep({ draft, onChange, onNext, onBack }: {
  draft: PublishDraft
  onChange: (patch: Partial<PublishDraft>) => void
  onNext: () => void
  onBack: () => void
}) {
  const founders       = getFounders()
  const businesses     = getBusinesses()
  const singleFounder  = founders.length === 1  ? founders[0]   : null
  const singleBusiness = businesses.length === 1 ? businesses[0] : null

  function toggleTopic(topic: Topic) {
    const has = draft.topics.some(t => t.id === topic.id)
    onChange({ topics: has ? draft.topics.filter(t => t.id !== topic.id) : [...draft.topics, topic] })
  }

  return (
    <div className="max-w-xl">
      <StepHeader
        title="Connections"
        subtitle="CULO has pre-filled what it can. Review and adjust if needed."
        onBack={onBack}
      />
      <div className="flex flex-col gap-5">

        <SectionDivider label="Publisher" />

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
        ) : founders.length > 1 ? (
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

        <Field label="Topics" hint="Select topics for discovery and knowledge graph connections.">
          <div className="flex flex-wrap gap-1.5 mt-1">
            {allTopics.map(topic => {
              const active = draft.topics.some(t => t.id === topic.id)
              return (
                <button
                  key={topic.id}
                  onClick={() => toggleTopic(topic)}
                  className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
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
          <Field label="CTA URL">
            <input
              type="url"
              value={draft.ctaUrl}
              onChange={e => onChange({ ctaUrl: e.target.value })}
              className={inp}
              placeholder="https://"
            />
          </Field>
        </div>

        <div className="px-4 py-3 bg-[#F8F5F0] rounded-xl border border-[#E8E4DD]">
          <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-widest mb-1">Coming soon</p>
          <p className="text-xs text-[#9CA3AF]">Products, Services, Events, Communities, Platforms, Resources.</p>
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

// ─── Step 6: Preview ──────────────────────────────────────────────────────────

const DISTRIBUTION_LOCATIONS = [
  'Founder Profile',
  'Business Profile',
  'Story Archive',
  'Homepage (if featured)',
  'Search',
  'Related Stories',
  'Knowledge Graph',
]

const KNOWLEDGE_OUTPUTS = [
  'Internal relationships',
  'Suggested topics + ideas',
  'AI-readable metadata',
  'Search metadata',
  'FAQs (coming soon)',
  'Automated resources (coming soon)',
]

function PreviewStep({ draft, onPublish, onBack, publishing }: {
  draft: PublishDraft
  onPublish: (action: 'publish' | 'draft' | 'archive') => void
  onBack: () => void
  publishing: boolean
}) {
  const founders   = getFounders()
  const businesses = getBusinesses()
  const founder    = founders.find(f => f.id === draft.founderId)
  const business   = businesses.find(b => b.id === draft.businessId)

  const hasCarouselSlide  = draft.carouselSlides.filter(Boolean).length > 0
  const missingCoverImage = !draft.coverImage && !hasCarouselSlide
  const hasBlog           = draft.contentTypes.includes('blog')

  return (
    <div className="max-w-2xl">
      <StepHeader
        title="Ready to Publish"
        subtitle="Review your publication and choose how to save it."
        onBack={onBack}
      />

      {hasBlog && missingCoverImage && (
        <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl mb-5">
          <svg className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <div>
            <p className="text-xs font-semibold text-amber-800">No cover image</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Blog posts display best with a cover image. A placeholder will be used.{' '}
              <button onClick={onBack} className="underline hover:no-underline">Go back to add one.</button>
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-[#E8E4DD] px-5 py-4 mb-6">
        <div className="flex items-start gap-3">
          {draft.coverImage ? (
            <img src={draft.coverImage} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0 bg-[#F3EDE6]" />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-[#F3EDE6] shrink-0 flex items-center justify-center">
              <span className="text-2xl">{FORMATS.find(f => f.type === draft.contentTypes[0])?.emoji ?? '📝'}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-[#2D2A26] leading-snug mb-1">{draft.title || 'Untitled publication'}</p>
            {draft.summary && <p className="text-sm text-[#6B7280] line-clamp-2">{draft.summary}</p>}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {draft.contentTypes.map(ct => {
                const f = FORMATS.find(x => x.type === ct)
                return (
                  <span key={ct} className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-[#F3EDE6] text-[#C86A43] uppercase">
                    {f?.emoji} {f?.label ?? ct}
                  </span>
                )
              })}
              {founder  && <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#F3EDE6] text-[#6B7280]">{founder.name}</span>}
              {business && <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#F3EDE6] text-[#6B7280]">{business.name}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-[#E8E4DD] px-5 py-4">
          <p className="text-sm font-bold text-[#2D2A26] mb-1">Once published, appears in:</p>
          <p className="text-xs text-[#9CA3AF] mb-4">Publish once, distributed everywhere.</p>
          <div className="space-y-2.5">
            {DISTRIBUTION_LOCATIONS.map(loc => <CheckItem key={loc} label={loc} done />)}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-[#E8E4DD] px-5 py-4">
          <p className="text-sm font-bold text-[#2D2A26] mb-1">CULO will also create:</p>
          <p className="text-xs text-[#9CA3AF] mb-4">Knowledge automations are in a future sprint.</p>
          <div className="space-y-2.5">
            {KNOWLEDGE_OUTPUTS.map(item => <CheckItem key={item} label={item} done={false} />)}
          </div>
        </div>
      </div>

      {draft.topics.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-6">
          {draft.topics.map(t => (
            <span key={t.id} className="text-xs px-2.5 py-1 rounded-full bg-[#F3EDE6] text-[#C86A43] font-medium">{t.name}</span>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3">
        <button
          onClick={() => onPublish('publish')}
          disabled={publishing}
          className="w-full py-4 bg-[#C86A43] text-white text-base font-bold rounded-2xl hover:bg-[#b05a35] disabled:opacity-60 transition-colors"
        >
          {publishing ? 'Publishing…' : 'Publish to Village'}
        </button>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onPublish('draft')}
            disabled={publishing}
            className="py-3 border-2 border-[#E8E4DD] text-[#2D2A26] text-sm font-semibold rounded-xl hover:border-[#C86A43]/40 disabled:opacity-60 transition-colors"
          >
            Save as Draft
          </button>
          <button
            onClick={() => onPublish('archive')}
            disabled={publishing}
            className="py-3 border-2 border-[#E8E4DD] text-[#6B7280] text-sm font-medium rounded-xl hover:border-[#E8E4DD] disabled:opacity-60 transition-colors"
          >
            Archive
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Step 7: Done ─────────────────────────────────────────────────────────────

function DoneStep({ draft, publishedSlug, action, onPublishAnother }: {
  draft: PublishDraft
  publishedSlug: string
  action: 'publish' | 'draft' | 'archive'
  onPublishAnother: () => void
}) {
  const label = action === 'publish' ? 'Published to the Village'
              : action === 'draft'   ? 'Saved as Draft'
              : 'Archived'

  const msg = action === 'publish'
    ? `"${draft.title}" is now live. It appears in your Founder Profile, the Story Archive and Search.`
    : action === 'draft'
    ? `"${draft.title}" has been saved as a draft. You can publish it any time from My Publications.`
    : `"${draft.title}" has been archived.`

  return (
    <div className="max-w-md text-center">
      <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
        action === 'publish' ? 'bg-green-100' : 'bg-[#F3EDE6]'
      }`}>
        <svg className={`w-10 h-10 ${action === 'publish' ? 'text-green-600' : 'text-[#C86A43]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-[#2D2A26] mb-2">{label}</h1>
      <p className="text-sm text-[#6B7280] mb-8 leading-relaxed">{msg}</p>
      <div className="flex flex-col gap-3">
        {action === 'publish' && (
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
        <button onClick={onPublishAnother} className="text-sm text-[#9CA3AF] hover:text-[#C86A43] transition-colors">
          Publish something else →
        </button>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function DashboardPublishPage() {
  const [step,          setStep]          = useState<PublishStep>('format')
  const [draft,         setDraft]         = useState<PublishDraft>(defaultDraft)
  const [publishing,    setPublishing]    = useState(false)
  const [publishedSlug, setPublishedSlug] = useState('')
  const [lastAction,    setLastAction]    = useState<'publish' | 'draft' | 'archive'>('publish')

  function patch(changes: Partial<PublishDraft>) {
    setDraft(prev => ({ ...prev, ...changes }))
  }

  function next() {
    const idx = STEPS.indexOf(step)
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1])
  }

  function back() {
    const idx = STEPS.indexOf(step)
    if (idx > 0) setStep(STEPS[idx - 1])
  }

  function handlePublish(action: 'publish' | 'draft' | 'archive') {
    setPublishing(true)
    setLastAction(action)

    const allFounders = getFounders()
    const founder     = allFounders.find(f => f.id === draft.founderId)
    const location    = founder?.location ?? locations[0]!
    const industry    = founder?.industry ?? industries[0]!
    const titleSlug   = slugify(draft.title) || `pub-${Date.now()}`
    const id          = `pub-${Date.now()}`
    const status      = action === 'publish' ? 'published' as const
                      : action === 'archive' ? 'archived'  as const
                      : 'draft'              as const
    const ctaUrl      = draft.ctaUrl || draft.documentUrl || ''

    updateStory({
      id,
      slug:           titleSlug,
      title:          draft.title   || 'Untitled',
      summary:        draft.summary || '',
      coverImage:     draft.coverImage || (draft.carouselSlides.filter(Boolean)[0] ?? '/placeholders/village-story.svg'),
      founderId:      draft.founderId,
      businessId:     draft.businessId,
      location,
      industry,
      topics:         draft.topics,
      contentTypes:   draft.contentTypes.length > 0 ? draft.contentTypes : ['blog'],
      blog:           draft.blog     || undefined,
      reelUrl:        draft.reelUrl  || undefined,
      audioUrl:       draft.audioUrl || undefined,
      carouselImages: draft.carouselSlides.filter(Boolean).length > 0
                        ? draft.carouselSlides.filter(Boolean)
                        : undefined,
      ideaIds:        [],
      relatedStoryIds: [],
      ctaLabel:       draft.ctaLabel,
      ctaUrl,
      status,
      featured:       false,
      publishingSource: draft.urlEntries.some(e => e.url.trim()) ? 'website-import'
                      : draft.uploadedFileNames.length > 0        ? 'one-drive-import'
                      : 'manual-dashboard',
      createdAt:      new Date().toISOString().split('T')[0],
      updatedAt:      new Date().toISOString().split('T')[0],
    })

    setPublishedSlug(titleSlug)
    setPublishing(false)
    setStep('done')
  }

  function reset() {
    setDraft(defaultDraft())
    setStep('format')
    setPublishedSlug('')
  }

  return (
    <div className="min-h-full p-8" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {step !== 'done' && <ProgressBar step={step} />}

      {step === 'format'      && <FormatStep      draft={draft} onChange={patch} onNext={next} />}
      {step === 'content'     && <ContentStep     draft={draft} onChange={patch} onNext={next} onBack={back} />}
      {step === 'info'        && <InfoStep        draft={draft} onChange={patch} onNext={next} onBack={back} />}
      {step === 'media'       && <MediaStep       draft={draft} onChange={patch} onNext={next} onBack={back} />}
      {step === 'connections' && <ConnectionsStep draft={draft} onChange={patch} onNext={next} onBack={back} />}
      {step === 'preview'     && <PreviewStep     draft={draft} onPublish={handlePublish} onBack={back} publishing={publishing} />}
      {step === 'done'        && <DoneStep        draft={draft} publishedSlug={publishedSlug} action={lastAction} onPublishAnother={reset} />}
    </div>
  )
}
