import { useState, useRef, useEffect, useMemo, type ReactNode, type ChangeEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { getCurrentFounder } from '../../services/currentFounder'
import { getFounders } from '../../services/founders'
import { getBusinesses } from '../../services/businesses'
import { getStories, updateStory } from '../../services/stories'
import { importedContentService } from '../../services/importedContent'
import { villageContentIntelligenceService, storyToInput } from '../../services/villageIntelligence'
import { locations } from '../../data/locations'
import { industries } from '../../data/industries'
import { topics as allTopics } from '../../data/topics'
import { slugify } from '../../utils/slugify'
import { isSupabaseConfigured } from '../../lib/supabase'
import { uploadFile } from '../../lib/storage'
import type { ContentType, Topic, Story } from '../../types'

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

// 'format'/'content'/'media' remain a short intake flow for getting raw content
// into the draft (unchanged — still the right tool for "upload a file" style
// input). Everything about ORGANISING and PUBLISHING that content — title,
// summary, topics, location, connections, related entities, SEO/GEO, preview —
// is now one consolidated 'builder' step instead of three separate ones
// (previously info → connections → preview), so a founder edits it as one
// continuous page instead of a multi-page form.
type PublishStep = 'format' | 'content' | 'media' | 'builder' | 'done'

const STEPS: PublishStep[] = ['format', 'content', 'media', 'builder', 'done']

const STEP_LABELS: Record<PublishStep, string> = {
  format:  'Format',
  content: 'Content',
  media:   'Media',
  builder: 'Story Builder',
  done:    'Published',
}

// ─── Draft ────────────────────────────────────────────────────────────────────

interface UrlEntry { id: number; url: string }

interface PublishDraft {
  contentTypes:       ContentType[]
  uploadedFileNames:  string[]
  uploadedUrls:       string[]
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
  // UI-only override of the primary location (the founder's own location is the
  // default, per resolveLocationForDraft below) — not a new Story field, Story
  // still stores a single `location: Location` exactly as before.
  locationId:         string
  ctaLabel:           string
  ctaUrl:             string
  ctaPreset:          CtaPreset
  // Editable overrides merged into the Village Intelligence record at publish
  // time (see handlePublish) — reuses the existing lessons/geoQuestions/
  // relatedFounderIds/relatedBusinessIds/relatedContentIds fields already on
  // VillageContentIntelligence, no schema change.
  lessonsOverride?:        string[]
  questionsOverride?:      string[]
  excludedFounderIds:      string[]
  excludedBusinessIds:     string[]
  excludedContentIds:      string[]
  extraFounderIds:         string[]
  extraBusinessIds:        string[]
  // Set when this draft started from "Turn into Story" on an imported item —
  // see DashboardImportContentPage's SavedRow and the effect that prefills this
  // page from router state below.
  importedContentId?: string
}

type CtaPreset = 'website' | 'business' | 'book' | 'speaking' | 'newsletter' | 'custom'

const CTA_PRESETS: { key: CtaPreset; label: string; ctaLabel: string }[] = [
  { key: 'website',   label: 'Visit my website',   ctaLabel: 'Visit website' },
  { key: 'business',  label: 'View my business',   ctaLabel: 'View business' },
  { key: 'book',      label: 'Book me',             ctaLabel: 'Book a call' },
  { key: 'speaking',  label: 'Enquire about speaking', ctaLabel: 'Enquire now' },
  { key: 'newsletter',label: 'Join my newsletter',  ctaLabel: 'Subscribe' },
  { key: 'custom',    label: 'Custom',              ctaLabel: 'Learn more' },
]

function defaultDraft(founderId: string, businessId: string): PublishDraft {
  return {
    contentTypes:      ['blog'],
    uploadedFileNames: [],
    uploadedUrls:      [],
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
    founderId,
    businessId,
    topics:            [],
    locationId:        '',
    ctaLabel:          'Read more',
    ctaUrl:            '',
    ctaPreset:         'custom',
    excludedFounderIds:  [],
    excludedBusinessIds: [],
    excludedContentIds:  [],
    extraFounderIds:     [],
    extraBusinessIds:    [],
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
  const [contentTab,    setContentTab]    = useState<ContentTab>('upload')
  const [uploadingSet,  setUploadingSet]  = useState<Set<string>>(new Set())
  const [uploadErrors,  setUploadErrors]  = useState<Record<string, string>>({})
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFiles(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    onChange({ uploadedFileNames: [...draft.uploadedFileNames, ...files.map(f => f.name)] })
    if (!isSupabaseConfigured) return

    for (const file of files) {
      setUploadingSet(prev => new Set([...prev, file.name]))
      const result = await uploadFile(file)
      setUploadingSet(prev => { const s = new Set(prev); s.delete(file.name); return s })
      if (result.error) {
        setUploadErrors(prev => ({ ...prev, [file.name]: result.error! }))
      } else {
        onChange({ uploadedUrls: [...draft.uploadedUrls, result.url] })
      }
    }
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
                  {uploadingSet.has(name) ? (
                    <div className="w-3 h-3 border-2 border-[#C86A43] border-t-transparent rounded-full animate-spin shrink-0" />
                  ) : uploadErrors[name] ? (
                    <span className="text-red-400 shrink-0" title={uploadErrors[name]}>⚠</span>
                  ) : (
                    <svg className="w-3 h-3 text-[#5E6B4A] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
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

// ─── Step 4: Media ────────────────────────────────────────────────────────────

function isImageUrl(url: string) { return /\.(jpg|jpeg|png|webp|gif|svg)(\?|$)/i.test(url) }
function isVideoUrl(url: string) { return /\.(mp4|mov|avi|webm|mkv)(\?|$)/i.test(url) }
function isAudioUrl(url: string) { return /\.(mp3|m4a|wav|ogg|aac)(\?|$)/i.test(url) }
function isDocUrl(url: string)   { return /\.(pdf|docx|doc|md|txt)(\?|$)/i.test(url) }

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

  const uploadedImageUrls = draft.uploadedUrls.filter(isImageUrl)
  const uploadedVideoUrls = draft.uploadedUrls.filter(isVideoUrl)
  const uploadedAudioUrls = draft.uploadedUrls.filter(isAudioUrl)
  const uploadedDocUrls   = draft.uploadedUrls.filter(isDocUrl)

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
            <div className="px-4 py-3 flex flex-col gap-2">
              <Field label="URL" hint="YouTube, Instagram Reel, TikTok or YouTube Shorts">
                <input
                  type="url"
                  value={draft.reelUrl}
                  onChange={e => onChange({ reelUrl: e.target.value })}
                  placeholder="https://youtube.com/watch?v=… or https://instagram.com/reel/…"
                  className={inp}
                />
              </Field>
              {uploadedVideoUrls.length > 0 && !draft.reelUrl && (
                <button
                  onClick={() => onChange({ reelUrl: uploadedVideoUrls[0] })}
                  className="text-xs text-[#C86A43] hover:underline text-left"
                >
                  Use uploaded video →
                </button>
              )}
            </div>
          </div>
        )}

        {hasAudio && (
          <div className="border border-[#E8E4DD] rounded-xl overflow-hidden">
            <div className="bg-[#F8F5F0] px-4 py-2 border-b border-[#E8E4DD]">
              <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-widest">Audio URL</p>
            </div>
            <div className="px-4 py-3 flex flex-col gap-2">
              <Field label="URL" hint="Spotify, Apple Podcasts, Anchor or direct audio link">
                <input
                  type="url"
                  value={draft.audioUrl}
                  onChange={e => onChange({ audioUrl: e.target.value })}
                  placeholder="https://open.spotify.com/episode/… or https://…"
                  className={inp}
                />
              </Field>
              {uploadedAudioUrls.length > 0 && !draft.audioUrl && (
                <button
                  onClick={() => onChange({ audioUrl: uploadedAudioUrls[0] })}
                  className="text-xs text-[#C86A43] hover:underline text-left"
                >
                  Use uploaded audio →
                </button>
              )}
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
            <div className="px-4 py-3 flex flex-col gap-2">
              <Field label="URL" hint="Link to the document, article or social post">
                <input
                  type="url"
                  value={draft.documentUrl}
                  onChange={e => onChange({ documentUrl: e.target.value })}
                  placeholder="https://…"
                  className={inp}
                />
              </Field>
              {uploadedDocUrls.length > 0 && !draft.documentUrl && (
                <button
                  onClick={() => onChange({ documentUrl: uploadedDocUrls[0] })}
                  className="text-xs text-[#C86A43] hover:underline text-left"
                >
                  Use uploaded document →
                </button>
              )}
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
            {uploadedImageUrls.length > 0 && !draft.coverImage && (
              <div className="flex flex-col gap-1">
                {uploadedImageUrls.slice(0, 3).map(url => (
                  <button
                    key={url}
                    onClick={() => onChange({ coverImage: url })}
                    className="text-xs text-[#C86A43] hover:underline text-left truncate"
                  >
                    Use uploaded image →
                  </button>
                ))}
              </div>
            )}
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

// ─── Story Builder (canonical publishing step) ─────────────────────────────────
// Replaces the old Info → Connections → Preview steps with one scrolling,
// card-based editor. Every card reuses the same draft state and the same
// villageContentIntelligenceService.analyse() engine the Import flow and
// handlePublish already use — nothing here is a parallel pipeline. Suggested
// lessons/questions/related-entities come from a live (non-persisted) preview
// analysis; anything the founder edits is merged into the real analysis result
// at publish time (see handlePublish), reusing VillageContentIntelligence's
// existing lessons/geoQuestions/relatedFounderIds/relatedBusinessIds/
// relatedContentIds fields rather than adding new columns.

const DISTRIBUTION_LOCATIONS = [
  'Founder Profile', 'Business Profile', 'Story Archive',
  'Homepage (if featured)', 'Search', 'Related Stories', 'Knowledge Graph',
]

function buildPreviewStory(draft: PublishDraft, founder: ReturnType<typeof getFounders>[number] | undefined): Story {
  const loc = locations.find(l => l.id === draft.locationId) ?? founder?.location ?? locations[0]!
  return {
    id: 'preview',
    slug: slugify(draft.title) || 'preview',
    title: draft.title || 'Untitled',
    summary: draft.summary || '',
    coverImage: draft.coverImage || '',
    founderId: draft.founderId,
    businessId: draft.businessId,
    location: loc,
    industry: founder?.industry ?? industries[0]!,
    topics: draft.topics,
    contentTypes: draft.contentTypes.length > 0 ? draft.contentTypes : ['blog'],
    blog: draft.blog || undefined,
    ideaIds: [],
    relatedStoryIds: [],
    ctaLabel: draft.ctaLabel,
    ctaUrl: draft.ctaUrl,
    status: 'draft',
    featured: false,
    createdAt: '',
    updatedAt: '',
  }
}

/** Collapsible card shell — the "progressive disclosure" primitive every section below uses. */
function BuilderCard({ title, subtitle, defaultOpen = true, badge, children }: {
  title: string
  subtitle?: string
  defaultOpen?: boolean
  badge?: ReactNode
  children: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="bg-white rounded-2xl border border-[#E8E4DD] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <div>
          <p className="text-sm font-bold text-[#2D2A26]">{title}</p>
          {subtitle && <p className="text-xs text-[#9CA3AF] mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {badge}
          <svg className={`w-4 h-4 text-[#9CA3AF] transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  )
}

/** Small editable-list primitive shared by Lessons and Questions cards. */
function EditableList({ items, onChange, placeholder }: {
  items: string[]
  onChange: (items: string[]) => void
  placeholder: string
}) {
  return (
    <div className="flex flex-col gap-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2">
          <textarea
            value={item}
            onChange={e => onChange(items.map((x, j) => j === i ? e.target.value : x))}
            rows={1}
            className={inp + ' resize-none'}
          />
          <button onClick={() => onChange(items.filter((_, j) => j !== i))} className="text-xs text-[#9CA3AF] hover:text-red-500 px-1 py-2 shrink-0">✕</button>
        </div>
      ))}
      <button onClick={() => onChange([...items, ''])} className="text-xs text-[#C86A43] hover:underline text-left">
        + Add {placeholder}
      </button>
    </div>
  )
}

function StoryBuilderStep({ draft, onChange, onBack, onPublish, publishing, publishError }: {
  draft: PublishDraft
  onChange: (patch: Partial<PublishDraft>) => void
  onBack: () => void
  onPublish: (action: 'publish' | 'draft' | 'archive') => void
  publishing: boolean
  publishError?: string
}) {
  const { user } = useAuth()
  const currentFounder = getCurrentFounder(user)
  const founders   = currentFounder ? [currentFounder] : []
  const businesses = getBusinesses().filter(b => b.founderId === currentFounder?.id)
  const singleFounder  = founders.length === 1  ? founders[0]   : null
  const singleBusiness = businesses.length === 1 ? businesses[0] : null
  const founder = getFounders().find(f => f.id === draft.founderId)

  const hasCarouselSlide  = draft.carouselSlides.filter(Boolean).length > 0
  const missingCoverImage = !draft.coverImage && !hasCarouselSlide
  const hasBlog           = draft.contentTypes.includes('blog')

  // Live, non-persisted analysis — same engine as handlePublish, just previewed.
  const intel = useMemo(() => {
    const previewStory = buildPreviewStory(draft, founder)
    return villageContentIntelligenceService.analyse(storyToInput(previewStory))
  }, [draft.title, draft.summary, draft.blog, draft.topics, draft.locationId, draft.founderId, draft.businessId])

  const lessons   = draft.lessonsOverride   ?? intel.lessons
  const questions = draft.questionsOverride ?? [...intel.geoQuestions, ...intel.searchQuestions]

  const suggestedFounders  = getFounders().filter(f => intel.relatedFounderIds.includes(f.id) && !draft.excludedFounderIds.includes(f.id))
  const suggestedBusinesses = getBusinesses().filter(b => intel.relatedBusinessIds.includes(b.id) && !draft.excludedBusinessIds.includes(b.id))
  const extraFounders  = getFounders().filter(f => draft.extraFounderIds.includes(f.id))
  const extraBusinesses = getBusinesses().filter(b => draft.extraBusinessIds.includes(b.id))
  const relatedContentItems = intel.relatedContentIds
    .filter(id => !draft.excludedContentIds.includes(id))
    .map(id => getStories().find(s => s.id === id) ?? importedContentService.get(id))
    .filter((x): x is NonNullable<typeof x> => !!x)

  function toggleTopic(topic: Topic) {
    const has = draft.topics.some(t => t.id === topic.id)
    onChange({ topics: has ? draft.topics.filter(t => t.id !== topic.id) : [...draft.topics, topic] })
  }

  function makePrimaryTopic(topic: Topic) {
    onChange({ topics: [topic, ...draft.topics.filter(t => t.id !== topic.id)] })
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-4">
      <StepHeader title="Story Builder" subtitle="Everything below publishes together — no separate refresh steps." onBack={onBack} />

      {/* ── 1. Story Overview ────────────────────────────────────────────── */}
      <BuilderCard title="Story Overview" subtitle="Headline, summary and hero image — how this appears everywhere in the Village.">
        <div className="flex flex-col gap-4">
          <Field label="Headline *">
            <input type="text" value={draft.title} onChange={e => onChange({ title: e.target.value })}
              placeholder="What is this story about?" className={inp + ' text-base font-semibold'} />
          </Field>
          <Field label="Summary *" hint="One or two sentences — the reader's takeaway.">
            <textarea value={draft.summary} onChange={e => onChange({ summary: e.target.value })} rows={3}
              placeholder="The honest story of…" className={inp + ' resize-y'} />
          </Field>
          <Field label="Hero image">
            {draft.coverImage && <img src={draft.coverImage} alt="" className="w-full h-32 rounded-xl object-cover bg-[#F3EDE6] border border-[#E8E4DD] mb-2" />}
            <input type="url" value={draft.coverImage} onChange={e => onChange({ coverImage: e.target.value })}
              placeholder="/assets/my-photo.jpg or https://…" className={inp} />
            {hasBlog && missingCoverImage && (
              <p className="text-xs text-amber-700 mt-1.5">No cover image yet — a placeholder will be used until you add one.</p>
            )}
          </Field>
        </div>
      </BuilderCard>

      {/* ── 2. Founder's Perspective ─────────────────────────────────────── */}
      <BuilderCard title="Founder's Perspective" subtitle="What happened, what you learned, what you'd do differently. Fully yours to rewrite.">
        <textarea
          value={draft.blog}
          onChange={e => onChange({ blog: e.target.value })}
          rows={10}
          placeholder="What happened? What did you learn? What would you do differently?"
          className={inp + ' resize-y text-sm leading-relaxed'}
        />
      </BuilderCard>

      {/* ── 3. Lessons ───────────────────────────────────────────────────── */}
      <BuilderCard title="Lessons" subtitle="Extracted from your writing above — edit, remove or add your own." defaultOpen={false}
        badge={<span className="text-[10px] text-[#9CA3AF]">{lessons.length}</span>}>
        <EditableList items={lessons} onChange={v => onChange({ lessonsOverride: v })} placeholder="a lesson" />
      </BuilderCard>

      {/* ── 4. Questions this story answers ──────────────────────────────── */}
      <BuilderCard title="Questions this story answers" subtitle="Powers SEO and GEO — how AI systems and search understand this story." defaultOpen={false}
        badge={<span className="text-[10px] text-[#9CA3AF]">{questions.length}</span>}>
        <EditableList items={questions} onChange={v => onChange({ questionsOverride: v })} placeholder="a question" />
      </BuilderCard>

      {/* ── 5. Topics ────────────────────────────────────────────────────── */}
      <BuilderCard title="Topics" subtitle="First topic is primary. Click a topic to make it primary.">
        <div className="flex flex-wrap gap-1.5">
          {allTopics.map(topic => {
            const idx = draft.topics.findIndex(t => t.id === topic.id)
            const active = idx !== -1
            return (
              <button
                key={topic.id}
                onClick={() => active ? makePrimaryTopic(topic) : toggleTopic(topic)}
                onDoubleClick={() => toggleTopic(topic)}
                title={active ? (idx === 0 ? 'Primary topic' : 'Click to make primary, double-click to remove') : 'Click to add'}
                className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                  idx === 0 ? 'bg-[#C86A43] text-white border-[#C86A43] font-semibold'
                  : active ? 'bg-[#F3EDE6] text-[#C86A43] border-[#C86A43]/40'
                  : 'bg-white text-[#4B4845] border-[#E8E4DD] hover:border-[#C86A43]/50'
                }`}
              >
                {idx === 0 && '★ '}{topic.name}
              </button>
            )
          })}
        </div>
        {draft.topics.length > 0 && (
          <button onClick={() => toggleTopic(draft.topics[0])} className="text-xs text-[#9CA3AF] hover:text-red-500 mt-2">
            Remove primary topic ({draft.topics[0].name})
          </button>
        )}
      </BuilderCard>

      {/* ── 6. Locations ─────────────────────────────────────────────────── */}
      <BuilderCard title="Location" subtitle="Primary location shown on the story. Detected mentions below are suggestions." defaultOpen={false}>
        <div className="flex flex-col gap-3">
          <Field label="Primary location">
            <select value={draft.locationId || founder?.location.id || ''} onChange={e => onChange({ locationId: e.target.value })} className={inp}>
              {locations.map(l => <option key={l.id} value={l.id}>{l.name}, {l.state}</option>)}
            </select>
          </Field>
          {intel.cities.length > 0 && (
            <div>
              <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wide mb-1">Detected in your writing</p>
              <div className="flex flex-wrap gap-1.5">
                {intel.cities.map(c => <span key={c} className="text-xs px-2 py-0.5 rounded-full bg-[#F3EDE6] text-[#6B7280]">{c}</span>)}
              </div>
            </div>
          )}
        </div>
      </BuilderCard>

      {/* ── 7 & 8. Related founders / businesses ─────────────────────────── */}
      <BuilderCard title="Related Founders" subtitle="Detected from your writing. Uncheck to exclude, or connect someone manually." defaultOpen={false}
        badge={<span className="text-[10px] text-[#9CA3AF]">{suggestedFounders.length + extraFounders.length}</span>}>
        <div className="flex flex-col gap-2">
          {[...suggestedFounders, ...extraFounders].map(f => (
            <div key={f.id} className="flex items-center gap-2 text-sm">
              <img src={f.avatar} alt="" className="w-6 h-6 rounded-full object-cover bg-[#F3EDE6] shrink-0" />
              <span className="flex-1 text-[#2D2A26]">{f.name}</span>
              <button
                onClick={() => draft.extraFounderIds.includes(f.id)
                  ? onChange({ extraFounderIds: draft.extraFounderIds.filter(id => id !== f.id) })
                  : onChange({ excludedFounderIds: [...draft.excludedFounderIds, f.id] })}
                className="text-xs text-[#9CA3AF] hover:text-red-500"
              >Remove</button>
            </div>
          ))}
          {suggestedFounders.length + extraFounders.length === 0 && <p className="text-xs text-[#9CA3AF]">None detected yet — mention another founder by name in your writing.</p>}
          <select
            value=""
            onChange={e => e.target.value && onChange({ extraFounderIds: [...draft.extraFounderIds, e.target.value] })}
            className={inp + ' mt-1'}
          >
            <option value="">+ Connect a founder…</option>
            {getFounders().filter(f => f.id !== draft.founderId && !suggestedFounders.some(s => s.id === f.id) && !extraFounders.some(s => s.id === f.id)).map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>
      </BuilderCard>

      <BuilderCard title="Related Businesses" subtitle="Detected from your writing. Uncheck to exclude, or connect one manually." defaultOpen={false}
        badge={<span className="text-[10px] text-[#9CA3AF]">{suggestedBusinesses.length + extraBusinesses.length}</span>}>
        <div className="flex flex-col gap-2">
          {[...suggestedBusinesses, ...extraBusinesses].map(b => (
            <div key={b.id} className="flex items-center gap-2 text-sm">
              <img src={b.logo} alt="" className="w-6 h-6 rounded object-cover bg-[#F3EDE6] shrink-0" />
              <span className="flex-1 text-[#2D2A26]">{b.name}</span>
              <button
                onClick={() => draft.extraBusinessIds.includes(b.id)
                  ? onChange({ extraBusinessIds: draft.extraBusinessIds.filter(id => id !== b.id) })
                  : onChange({ excludedBusinessIds: [...draft.excludedBusinessIds, b.id] })}
                className="text-xs text-[#9CA3AF] hover:text-red-500"
              >Remove</button>
            </div>
          ))}
          {suggestedBusinesses.length + extraBusinesses.length === 0 && <p className="text-xs text-[#9CA3AF]">None detected yet — mention a business by name in your writing.</p>}
          <select
            value=""
            onChange={e => e.target.value && onChange({ extraBusinessIds: [...draft.extraBusinessIds, e.target.value] })}
            className={inp + ' mt-1'}
          >
            <option value="">+ Connect a business…</option>
            {getBusinesses().filter(b => !suggestedBusinesses.some(s => s.id === b.id) && !extraBusinesses.some(s => s.id === b.id)).map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      </BuilderCard>

      {/* ── 9. Related content ───────────────────────────────────────────── */}
      <BuilderCard title="Related Content" subtitle="Stories and imports this connects to — computed automatically, remove anything incorrect." defaultOpen={false}
        badge={<span className="text-[10px] text-[#9CA3AF]">{relatedContentItems.length}</span>}>
        <div className="flex flex-col gap-2">
          {relatedContentItems.map(item => (
            <div key={item.id} className="flex items-center gap-2 text-sm">
              <span className="flex-1 text-[#2D2A26] truncate">{'title' in item ? item.title : ''}</span>
              <button onClick={() => onChange({ excludedContentIds: [...draft.excludedContentIds, item.id] })} className="text-xs text-[#9CA3AF] hover:text-red-500">Remove</button>
            </div>
          ))}
          {relatedContentItems.length === 0 && <p className="text-xs text-[#9CA3AF]">Nothing connected yet — add topics or write more detail above.</p>}
        </div>
      </BuilderCard>

      {/* ── 10. Publisher & Business connection (kept compact, not a separate step) ── */}
      <BuilderCard title="Publisher & Business" defaultOpen={false}>
        <div className="flex flex-col gap-3">
          {singleFounder ? (
            <div className="flex items-center gap-3 px-3 py-2 bg-[#F8F5F0] rounded-xl">
              {singleFounder.avatar && <img src={singleFounder.avatar} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />}
              <p className="text-sm text-[#2D2A26] flex-1">{singleFounder.name}</p>
              <span className="text-[10px] text-[#9CA3AF]">auto-selected</span>
            </div>
          ) : founders.length > 1 ? (
            <Field label="Publisher">
              <select value={draft.founderId} onChange={e => onChange({ founderId: e.target.value })} className={inp}>
                {founders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </Field>
          ) : (
            <div className="px-3 py-2 bg-[#F8F5F0] rounded-xl">
              <p className="text-xs text-[#9CA3AF]">Complete your profile first to publish a story.</p>
              <Link to="/dashboard/profile" className="text-xs text-[#C86A43] hover:underline">Set up your profile →</Link>
            </div>
          )}
          {singleBusiness && (
            <div className="flex items-center gap-3 px-3 py-2 bg-[#F8F5F0] rounded-xl">
              <img src={singleBusiness.logo} alt="" className="w-7 h-7 rounded object-cover shrink-0" />
              <p className="text-sm text-[#2D2A26] flex-1">{singleBusiness.name}</p>
              <span className="text-[10px] text-[#9CA3AF]">auto-selected</span>
            </div>
          )}
        </div>
      </BuilderCard>

      {/* ── 11. Call To Action ───────────────────────────────────────────── */}
      <BuilderCard title="Call To Action" subtitle="Pick one primary action for readers to take." defaultOpen={false}>
        <div className="flex flex-wrap gap-2 mb-3">
          {CTA_PRESETS.map(p => (
            <button
              key={p.key}
              onClick={() => onChange({ ctaPreset: p.key, ctaLabel: p.ctaLabel, ctaUrl: p.key === 'business' && singleBusiness ? `/businesses/${singleBusiness.slug}` : draft.ctaUrl })}
              className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                draft.ctaPreset === p.key ? 'bg-[#C86A43] text-white border-[#C86A43]' : 'bg-white text-[#4B4845] border-[#E8E4DD] hover:border-[#C86A43]/50'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Button label">
            <input type="text" value={draft.ctaLabel} onChange={e => onChange({ ctaLabel: e.target.value })} className={inp} placeholder="Read more" />
          </Field>
          <Field label="Link">
            <input type="url" value={draft.ctaUrl} onChange={e => onChange({ ctaUrl: e.target.value })} className={inp} placeholder="https://" />
          </Field>
        </div>
      </BuilderCard>

      {/* ── 12. SEO Preview ──────────────────────────────────────────────── */}
      <BuilderCard title="SEO Preview" subtitle="Read-only — generated automatically from the content above." defaultOpen={false}>
        <div className="space-y-2 text-xs">
          <div><p className="text-[10px] text-[#9CA3AF] uppercase tracking-wide">Title</p><p className="text-[#2D2A26] font-medium">{draft.title || 'Untitled'}</p></div>
          <div><p className="text-[10px] text-[#9CA3AF] uppercase tracking-wide">Description</p><p className="text-[#2D2A26]">{draft.summary || '—'}</p></div>
          <div><p className="text-[10px] text-[#9CA3AF] uppercase tracking-wide">Canonical topic</p><p className="text-[#2D2A26]">{draft.topics[0]?.name ?? intel.canonicalTopics[0] ?? '—'}</p></div>
          <div>
            <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wide">Keywords</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {intel.seoKeywords.slice(0, 10).map(k => <span key={k} className="px-1.5 py-0.5 rounded bg-[#F3EDE6] text-[#6B7280]">{k}</span>)}
              {intel.seoKeywords.length === 0 && <span className="text-[#9CA3AF]">—</span>}
            </div>
          </div>
        </div>
      </BuilderCard>

      {/* ── 13. GEO Preview ──────────────────────────────────────────────── */}
      <BuilderCard title="GEO Preview" subtitle="How AI systems will understand this story. Read-only." defaultOpen={false}>
        <div className="space-y-3 text-xs">
          <div>
            <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wide mb-1">Questions answered</p>
            <ul className="space-y-1">{questions.slice(0, 6).map(q => <li key={q}>· {q}</li>)}{questions.length === 0 && <li className="text-[#9CA3AF]">Add more detail above.</li>}</ul>
          </div>
          {intel.problems.length > 0 && <div><p className="text-[10px] text-[#9CA3AF] uppercase tracking-wide mb-1">Problems solved</p><p>{intel.problems.join(', ')}</p></div>}
          {intel.solutions.length > 0 && <div><p className="text-[10px] text-[#9CA3AF] uppercase tracking-wide mb-1">Solutions</p><p>{intel.solutions.join(', ')}</p></div>}
          {intel.industries.length > 0 && <div><p className="text-[10px] text-[#9CA3AF] uppercase tracking-wide mb-1">Industries</p><p>{intel.industries.join(', ')}</p></div>}
        </div>
      </BuilderCard>

      {/* ── 14. Public Preview ───────────────────────────────────────────── */}
      <BuilderCard title="Public Preview" subtitle="A simplified preview — not a pixel-perfect render of the live page." defaultOpen={false}>
        <div className="border border-[#E8E4DD] rounded-xl overflow-hidden">
          {draft.coverImage && <img src={draft.coverImage} alt="" className="w-full h-40 object-cover bg-[#F3EDE6]" />}
          <div className="p-4">
            <p className="text-lg font-bold text-[#2D2A26] leading-snug">{draft.title || 'Untitled publication'}</p>
            {draft.summary && <p className="text-sm text-[#6B7280] mt-1">{draft.summary}</p>}
            <div className="flex flex-wrap gap-1.5 mt-3">
              {draft.topics.slice(0, 4).map(t => <span key={t.id} className="text-[10px] px-2 py-0.5 rounded-full bg-[#F3EDE6] text-[#C86A43]">{t.name}</span>)}
            </div>
            {draft.blog && <p className="text-xs text-[#4B4845] mt-3 line-clamp-4 whitespace-pre-line">{draft.blog}</p>}
            <button disabled className="mt-3 px-3 py-1.5 bg-[#C86A43] text-white text-xs font-semibold rounded-lg opacity-90">{draft.ctaLabel || 'Read more'}</button>
          </div>
        </div>
      </BuilderCard>

      {/* ── Where this appears / what gets generated (informational) ─────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-[#E8E4DD] px-5 py-4">
          <p className="text-sm font-bold text-[#2D2A26] mb-1">Once published, appears in:</p>
          <div className="space-y-2.5 mt-3">{DISTRIBUTION_LOCATIONS.map(loc => <CheckItem key={loc} label={loc} done />)}</div>
        </div>
        <div className="bg-white rounded-2xl border border-[#E8E4DD] px-5 py-4">
          <p className="text-sm font-bold text-[#2D2A26] mb-1">Generated automatically on publish:</p>
          <div className="space-y-2.5 mt-3">
            <CheckItem label="Related founders, businesses & content" />
            <CheckItem label="Search keywords (SEO)" />
            <CheckItem label="AI-readable questions (GEO)" />
            <CheckItem label="Canonical topics" />
            <CheckItem label="FAQs" done={false} />
            <CheckItem label="Automated resources" done={false} />
          </div>
        </div>
      </div>

      {/* ── One publish action ───────────────────────────────────────────── */}
      <div className="sticky bottom-0 bg-[#F8F5F0]/95 backdrop-blur pt-3 pb-1 -mx-8 px-8 flex flex-col gap-3 border-t border-[#E8E4DD] mt-2">
        {publishError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{publishError}</p>}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onPublish('publish')}
            disabled={publishing || !draft.founderId}
            className="flex-1 py-3.5 bg-[#C86A43] text-white text-base font-bold rounded-2xl hover:bg-[#b05a35] disabled:opacity-50 transition-colors"
          >
            {publishing ? 'Publishing…' : 'Publish to Village'}
          </button>
          <button onClick={() => onPublish('draft')} disabled={publishing} className="px-4 py-3.5 border-2 border-[#E8E4DD] text-[#2D2A26] text-sm font-semibold rounded-xl hover:border-[#C86A43]/40 disabled:opacity-50 transition-colors">
            Save Draft
          </button>
          <button onClick={() => onPublish('archive')} disabled={publishing} className="px-4 py-3.5 border-2 border-[#E8E4DD] text-[#6B7280] text-sm font-medium rounded-xl hover:border-[#E8E4DD] disabled:opacity-50 transition-colors">
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

// ─── Auto-save (draft-in-progress only — not the published Story) ─────────────
// Pure localStorage, no network: this is "don't lose my half-written wizard
// state if the tab closes," distinct from the real Supabase-backed publish.

const DRAFT_AUTOSAVE_KEY = 'culo_v1_publish_wizard_draft'
type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error'

function loadAutoSavedDraft(): PublishDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_AUTOSAVE_KEY)
    return raw ? (JSON.parse(raw) as PublishDraft) : null
  } catch {
    return null
  }
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function DashboardPublishPage() {
  const { user } = useAuth()
  const currentFounder = getCurrentFounder(user)
  const location = useLocation()
  const [step,          setStep]          = useState<PublishStep>('format')
  const [draft,         setDraft]         = useState<PublishDraft>(() => {
    // Don't resurrect a stale wizard draft over a fresh "Turn into Story" prefill.
    if ((location.state as { importedContentId?: string } | null)?.importedContentId) {
      return defaultDraft(currentFounder?.id ?? '', currentFounder?.businessId ?? '')
    }
    return loadAutoSavedDraft() ?? defaultDraft(currentFounder?.id ?? '', currentFounder?.businessId ?? '')
  })
  const [publishing,    setPublishing]    = useState(false)
  const [publishedSlug, setPublishedSlug] = useState('')
  const [publishError,  setPublishError]  = useState('')
  const [lastAction,    setLastAction]    = useState<'publish' | 'draft' | 'archive'>('publish')
  const [autoSave,      setAutoSave]      = useState<AutoSaveStatus>('idle')

  // Debounced auto-save of the in-progress wizard state to localStorage.
  useEffect(() => {
    setAutoSave('saving')
    const t = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_AUTOSAVE_KEY, JSON.stringify(draft))
        setAutoSave('saved')
      } catch {
        setAutoSave('error')
      }
    }, 600)
    return () => clearTimeout(t)
  }, [draft])

  // Arrived via "Turn into Story" on an ImportedContent row — prefill the draft
  // from it and remember the link so publish() can write it both ways.
  useEffect(() => {
    const importedContentId = (location.state as { importedContentId?: string } | null)?.importedContentId
    if (!importedContentId) return
    const item = importedContentService.get(importedContentId)
    if (!item) return
    setDraft(prev => ({
      ...prev,
      importedContentId,
      title: prev.title || item.title,
      summary: prev.summary || item.autoSummary || item.description || '',
      blog: prev.blog || item.diaryNote || item.transcriptText || '',
      coverImage: prev.coverImage || item.thumbnailUrl || '',
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  // The single canonical publish path: write the Story, link it to its source
  // ImportedContent (if any) in both directions, then generate Village
  // Intelligence from it — which is also where SEO keywords, GEO questions, and
  // related founder/business/content links all get computed (see
  // villageIntelligence.ts's runAnalysis()). One call produces all of it; there
  // is no second/manual "refresh" step, and no parallel logic duplicating what
  // the Import flow already does for ImportedContent.
  async function handlePublish(action: 'publish' | 'draft' | 'archive') {
    setPublishing(true)
    setLastAction(action)

    const allFounders = getFounders()
    const founder     = allFounders.find(f => f.id === draft.founderId)
    const loc         = locations.find(l => l.id === draft.locationId) ?? founder?.location ?? locations[0]!
    const industry    = founder?.industry ?? industries[0]!
    const titleSlug   = slugify(draft.title) || `pub-${Date.now()}`
    const id          = `pub-${Date.now()}`
    const status      = action === 'publish' ? 'published' as const
                      : action === 'archive' ? 'archived'  as const
                      : 'draft'              as const
    const ctaUrl      = draft.ctaUrl || draft.documentUrl || ''
    const nowIso       = new Date().toISOString().split('T')[0]

    const story: Story = {
      id,
      slug:           titleSlug,
      title:          draft.title   || 'Untitled',
      summary:        draft.summary || '',
      coverImage:     draft.coverImage || (draft.carouselSlides.filter(Boolean)[0] ?? '/placeholders/village-story.svg'),
      founderId:      draft.founderId,
      businessId:     draft.businessId,
      location: loc,
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
      importedContentId: draft.importedContentId,
      ctaLabel:       draft.ctaLabel,
      ctaUrl,
      status,
      featured:       false,
      publishingSource: draft.importedContentId ? 'website-import'
                      : draft.urlEntries.some(e => e.url.trim()) ? 'website-import'
                      : draft.uploadedFileNames.length > 0        ? 'one-drive-import'
                      : 'manual-dashboard',
      createdAt:      nowIso,
      updatedAt:      nowIso,
    }

    const result = await updateStory(story)
    if (!result.success) {
      setPublishing(false)
      // Surfaced via the Preview step's publishError prop below.
      setPublishError(result.error ?? 'Could not publish. Please try again.')
      return
    }

    if (draft.importedContentId) {
      const source = importedContentService.get(draft.importedContentId)
      if (source) void importedContentService.upsert({ ...source, relatedStoryId: id })
    }

    if (status === 'published') {
      // Same engine the Story Builder's live preview used — re-run once more
      // against the final story, then merge in whatever the founder explicitly
      // edited in the Lessons/Questions/Related-entity cards. Nothing here is a
      // second pipeline: analyse() + upsert() is the one call every publish path
      // (Import, wizard, edit) goes through.
      const intel = villageContentIntelligenceService.analyse(storyToInput(story))
      const merged = {
        ...intel,
        lessons: draft.lessonsOverride ?? intel.lessons,
        geoQuestions: draft.questionsOverride ?? intel.geoQuestions,
        relatedFounderIds: [
          ...intel.relatedFounderIds.filter(fid => !draft.excludedFounderIds.includes(fid)),
          ...draft.extraFounderIds,
        ],
        relatedBusinessIds: [
          ...intel.relatedBusinessIds.filter(bid => !draft.excludedBusinessIds.includes(bid)),
          ...draft.extraBusinessIds,
        ],
        relatedContentIds: intel.relatedContentIds.filter(cid => !draft.excludedContentIds.includes(cid)),
      }
      void villageContentIntelligenceService.upsert(merged)
    }

    localStorage.removeItem(DRAFT_AUTOSAVE_KEY)
    setPublishError('')
    setPublishedSlug(titleSlug)
    setPublishing(false)
    setStep('done')
  }

  function reset() {
    localStorage.removeItem(DRAFT_AUTOSAVE_KEY)
    setDraft(defaultDraft(currentFounder?.id ?? '', currentFounder?.businessId ?? ''))
    setStep('format')
    setPublishedSlug('')
  }

  return (
    <div className="min-h-full p-8" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {step !== 'done' && (
        <div className="flex items-center justify-between mb-2">
          <ProgressBar step={step} />
          <p className="text-[11px] text-[#9CA3AF] shrink-0 ml-4">
            {autoSave === 'saving' && 'Saving…'}
            {autoSave === 'saved' && 'Saved just now'}
            {autoSave === 'error' && <span className="text-red-500">Save failed</span>}
          </p>
        </div>
      )}

      {step === 'format'  && <FormatStep  draft={draft} onChange={patch} onNext={next} />}
      {step === 'content' && <ContentStep draft={draft} onChange={patch} onNext={next} onBack={back} />}
      {step === 'media'   && <MediaStep   draft={draft} onChange={patch} onNext={next} onBack={back} />}
      {step === 'builder' && (
        <StoryBuilderStep
          draft={draft}
          onChange={patch}
          onBack={back}
          onPublish={action => void handlePublish(action)}
          publishing={publishing}
          publishError={publishError}
        />
      )}
      {step === 'done' && <DoneStep draft={draft} publishedSlug={publishedSlug} action={lastAction} onPublishAnother={reset} />}
    </div>
  )
}
