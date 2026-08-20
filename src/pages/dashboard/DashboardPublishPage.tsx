import { useState, useEffect, useMemo, type ReactNode } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { getCurrentFounder } from '../../services/currentFounder'
import { getFounders } from '../../services/founders'
import { getBusinesses, getBusiness } from '../../services/businesses'
import { getStories, getStory } from '../../services/stories'
import { importedContentService } from '../../services/importedContent'
import { villageContentIntelligenceService, storyToInput } from '../../services/villageIntelligence'
import { publishStoryCore } from '../../services/publishStory'
import { MediaUpload } from '../../components/ui/MediaUpload'
import { CreateWithCuloCTA } from '../../components/ui/CreateWithCuloCTA'
import { previewIdeaImpact } from '../../services/ideaSync'
import { computeReadability } from '../../utils/readability'
import { getStoryMissingItems } from '../../utils/missingAssets'
import { locations } from '../../data/locations'
import { industries } from '../../data/industries'
import { topics as allTopics, createCustomTopic } from '../../data/topics'
import { slugify } from '../../utils/slugify'
import { deriveSeoTitle, deriveSeoDescription } from '../../utils/seo'
import { looksLikeChannelUrl } from '../../utils/url'
import { partnerService } from '../../services/partner'
import type { ImportedContent } from '../../types/importedContent'
import type { ContentType, Topic, Story } from '../../types'

// ─── Content formats ──────────────────────────────────────────────────────────

// Trimmed to the 4 formats that are actually distinct end to end (own storage
// field, own render treatment). The rest (Talking Head, Voice Over, Photo
// Story, Document, External Article, YouTube Video, Social Post) were
// cosmetic labels over these same 4 buckets — removed from the picker, but
// the ContentType values themselves and their rendering are untouched, so
// any already-published story using one of them keeps working exactly as
// before.
const FORMATS: { type: ContentType; emoji: string; label: string; desc: string }[] = [
  { type: 'blog',     emoji: '📝', label: 'Blog',     desc: 'Written article or post'   },
  { type: 'reel',     emoji: '🎥', label: 'Reel',     desc: 'Short-form vertical video' },
  { type: 'carousel', emoji: '🎠', label: 'Carousel', desc: 'Swipeable image slides'    },
  { type: 'podcast',  emoji: '🎙️', label: 'Podcast',  desc: 'Audio episode'             },
]

// ─── Steps ────────────────────────────────────────────────────────────────────

// Village publishes knowledge, not content — the workflow reflects that: a
// founder chooses where the knowledge already exists (format), optionally
// brings in existing material (content), tells the story distraction-free
// (story), watches Village extract topics/relationships/SEO/GEO from it in
// real time (builder — "Village Intelligence"), sees exactly what publishing
// will connect/create (preview), then publishes (done). Every step reads from
// the same draft and the same villageContentIntelligenceService.analyse() —
// nothing here is a parallel pipeline.
type PublishStep = 'format' | 'media' | 'story' | 'builder' | 'preview' | 'done'

const STEPS: PublishStep[] = ['format', 'media', 'story', 'builder', 'preview', 'done']

const STEP_LABELS: Record<PublishStep, string> = {
  format:  'Choose Formats',
  media:   'Attach Media',
  story:   'Blog',
  builder: 'Village Intelligence',
  preview: 'Preview',
  done:    'Publish',
}

// Transcript only means something for formats with actual spoken/recorded
// audio — a blog or carousel has no recording to transcribe, so that step is
// skipped entirely for those and the writing happens directly in Attach Media.
const AUDIO_VIDEO_TYPES = new Set<ContentType>(['reel', 'talking-head', 'youtube-video', 'podcast', 'voice-over'])

function needsTranscriptStep(types: ContentType[]): boolean {
  return types.some(t => AUDIO_VIDEO_TYPES.has(t))
}

function visibleSteps(types: ContentType[]): PublishStep[] {
  return needsTranscriptStep(types) ? STEPS : STEPS.filter(s => s !== 'story')
}

function isBlogOnly(types: ContentType[]): boolean {
  return types.length === 1 && types[0] === 'blog'
}

// ─── Draft ────────────────────────────────────────────────────────────────────

interface PublishDraft {
  contentTypes:       ContentType[]
  title:              string
  subtitle:           string
  summary:            string
  coverImage:         string
  reelUrl:            string
  // Extra reel videos beyond the primary reelUrl — same "just add more"
  // pattern as carouselSlides.
  additionalReelUrls: string[]
  audioUrl:           string
  carouselSlides:     string[]
  documentUrl:        string
  contentUrl:         string
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
  // Set when this draft started from "Write about this partner" in
  // Opportunities' Partnerships Program tab — see the matching effect below.
  partnerId?: string
  // Set the moment this draft is first successfully published — every
  // subsequent handlePublish call (re-clicking Publish, resuming this same
  // draft after a refresh) reuses this id instead of minting a new one, so
  // republishing updates the existing Story in place rather than colliding
  // on the slug's unique constraint with a second, orphaned row.
  publishedStoryId?: string
}

type CtaPreset = 'website' | 'business' | 'book' | 'speaking' | 'newsletter' | 'custom'

// Real counts, all read back from what syncIdeasFromStory/refreshAuthorityScores
// actually wrote to the database — never fabricated for display. Sprint 3.5
// made Ideas first-class persisted entities, so ideasCreated/ideasStrengthened
// are genuine row counts, not a proxy over ephemeral lesson strings.
interface PublishSummary {
  ideasCreated: number
  ideasStrengthened: number
  relationships: number
  founderLinks: number
  businessLinks: number
  internalLinks: number
  seoComplete: boolean
  geoComplete: boolean
  authorityDelta: number
  /** Set only for a genuine first-time milestone (see handlePublish) — never for repeat events. */
  milestone: string | null
}

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
    title:             '',
    subtitle:          '',
    summary:           '',
    coverImage:        '',
    reelUrl:           '',
    additionalReelUrls: [],
    audioUrl:          '',
    carouselSlides:    [''],
    documentUrl:       '',
    contentUrl:        '',
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

// Shared between the "arrived via Turn into Story" router-state effect and
// the in-page Canva import card (FormatStep) — both need to fold an
// ImportedContent's fields into the current draft the same way, so there's
// only one place that logic can drift.
function importedContentPatch(item: ImportedContent, draft: PublishDraft): Partial<PublishDraft> {
  const matchedTopics = allTopics.filter(t => item.topics.some(it => it.toLowerCase() === t.name.toLowerCase()))
  const matchedLocation = locations.find(l => item.locations.some(il => il.toLowerCase() === l.name.toLowerCase()))
  return {
    importedContentId: item.id,
    title: draft.title || item.title,
    subtitle: draft.subtitle || item.subtitle || '',
    summary: draft.summary || item.subtitle || item.autoSummary || item.description || '',
    blog: draft.blog || item.description || item.diaryNote || item.transcriptText || '',
    coverImage: draft.coverImage || item.thumbnailUrl || '',
    // ctaLabel's default is 'Read more' (never falsy), so a plain `||` would
    // never reach the import's own label — only take the import's CTA while
    // the draft is still untouched from its default.
    ctaLabel: (draft.ctaUrl || draft.ctaLabel !== 'Read more') ? draft.ctaLabel : (item.ctaLabel || draft.ctaLabel),
    ctaUrl: draft.ctaUrl || item.ctaUrl || '',
    carouselSlides: draft.carouselSlides.filter(Boolean).length > 0
      ? draft.carouselSlides
      : (item.imageUrls && item.imageUrls.length > 0 ? item.imageUrls : draft.carouselSlides),
    contentTypes: draft.contentTypes.length > 0
      ? draft.contentTypes
      : (item.contentTypeHint && item.contentTypeHint.length > 0 ? item.contentTypeHint : draft.contentTypes),
    topics: draft.topics.length > 0 ? draft.topics : matchedTopics,
    locationId: draft.locationId || matchedLocation?.id || draft.locationId,
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

function ProgressBar({ step, steps, labels, onStepClick }: {
  step: PublishStep
  steps: PublishStep[]
  labels: Record<PublishStep, string>
  onStepClick: (s: PublishStep) => void
}) {
  const currentIdx = steps.indexOf(step)
  return (
    <div className="flex items-center gap-1 mb-10 overflow-x-auto pb-1">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => onStepClick(s)}
            className={`flex items-center gap-1.5 ${i <= currentIdx ? 'text-[#C86A43]' : 'text-[#9CA3AF]'} hover:opacity-70 transition-opacity`}
          >
            <div className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${
              i < currentIdx   ? 'bg-[#5E6B4A] text-white'
              : i === currentIdx ? 'bg-[#C86A43] text-white'
              : 'bg-[#E8E4DD] text-[#9CA3AF]'
            }`}>
              {i < currentIdx ? '✓' : i + 1}
            </div>
            <span className="text-[11px] font-medium hidden sm:inline">{labels[s]}</span>
          </button>
          {i < steps.length - 1 && (
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

  return (
    <div>
      <StepHeader
        title="What's Your Story?"
        subtitle="Update The Village or edit with CULO in Canva to continue curating your life's work."
      />

      <div className="flex gap-10 items-start">
      <div className="max-w-2xl flex-1 min-w-0">
        {/* www.prettycoolmarketing.com/culo is a placeholder landing page — swap
            for the real Canva app link once CULO in Canva ships. */}
        <a
          href="https://www.prettycoolmarketing.com/culo"
          target="_blank"
          rel="noopener noreferrer"
          className="block bg-[#2D2A26] rounded-2xl px-8 py-8 mb-6 hover:bg-[#1a1815] transition-colors"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div>
              <p className="font-heading text-2xl font-semibold text-white leading-snug">
                CULO Creatives helps founders turn their messy thoughts and raw footage into different formats of content, exclusively in Canva.
              </p>
            </div>
            <span className="flex-shrink-0 inline-flex items-center gap-2 px-6 py-3 bg-[#C86A43] text-white text-base font-semibold rounded-xl">
              Create with CULO in Canva
            </span>
          </div>
        </a>

        <p className="text-sm font-semibold text-[#2D2A26] mb-1">Choose a format</p>
        <p className="text-xs text-[#9CA3AF] mb-3">Bringing in Canva slides? Do that from Import Content instead — pick a format here to write it yourself.</p>
        <div className="grid grid-cols-2 gap-3 mb-8">
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
          {draft.contentTypes.length === 0 ? 'Select at least one format' : 'Continue'}
        </button>
      </div>

      <div className="hidden lg:flex flex-col gap-5 w-96 shrink-0">
        <HowItWorksPanel />
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-charcoal">
          <iframe
            src="https://www.youtube.com/embed/qe0pMAlpVFc?start=21"
            title="How to publish with CULO"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        </div>
      </div>
      </div>
    </div>
  )
}

// ─── How it works — orients a founder before they touch the publish flow ─────

const HOW_IT_WORKS_STEPS = [
  {
    title: 'Pick a format',
    desc: 'Choose how you want to share your content in The Village.',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
  },
  {
    title: 'Add your content',
    desc: "You'll add your text, media, and details in the next steps.",
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M14 8h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />,
  },
  {
    title: 'Village Intelligence',
    desc: "We'll help you extract topics, keywords, insights and more.",
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.99-2.386l-.548-.547z" />,
  },
  {
    title: 'Preview & publish',
    desc: 'Review everything before it goes live in The Village.',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />,
  },
]

function HowItWorksPanel() {
  return (
    <div className="hidden lg:block w-[26rem] shrink-0 bg-white rounded-2xl border border-[#E8E4DD] p-8 sticky top-8">
      <p className="text-lg font-semibold text-[#2D2A26] mb-7">How it works</p>
      <div className="flex flex-col gap-7">
        {HOW_IT_WORKS_STEPS.map((s, i) => (
          <div key={s.title} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-[#FBF1EB] text-[#C86A43] flex items-center justify-center shrink-0">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  {s.icon}
                </svg>
              </div>
              {i < HOW_IT_WORKS_STEPS.length - 1 && <div className="w-px flex-1 bg-[#E8E4DD] mt-1.5" />}
            </div>
            <div className="pb-2">
              <p className="text-base font-semibold text-[#2D2A26] mb-1">{s.title}</p>
              <p className="text-sm text-[#9CA3AF] leading-relaxed">{s.desc}</p>
            </div>
          </div>
        ))}
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
  const uploadOpts  = { founderId: draft.founderId, businessId: draft.businessId }

  const blogOnly = isBlogOnly(types)

  return (
    <div className="max-w-xl">
      <StepHeader
        title={blogOnly ? 'Write Blog' : 'Add Media'}
        subtitle="Bring what you have today. The Village always has room for more."
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
              {looksLikeChannelUrl(draft.reelUrl) && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 leading-relaxed">
                  This looks like your channel page, not a single video. There's nothing to play here. Paste one video's link instead, or go to{' '}
                  <Link to="/dashboard/import-sources" className="font-semibold underline">Import Sources</Link>{' '}
                  to connect your whole channel and bring in every video at once.
                </p>
              )}
              <p className="text-[11px] text-[#9CA3AF] text-center -my-0.5">or</p>
              <MediaUpload
                onChange={v => onChange({ reelUrl: v })}
                accept="video"
                label="Upload a video file instead"
                aspect="auto"
                uploadOptions={{ ...uploadOpts, usageType: 'reel-preview' }}
              />

              {draft.additionalReelUrls.length > 0 && (
                <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-widest mt-2">More reels</p>
              )}
              {draft.additionalReelUrls.map((url, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs text-[#9CA3AF] w-5 shrink-0 text-right">{i + 2}</span>
                  <input
                    type="url"
                    value={url}
                    onChange={e => {
                      const next = [...draft.additionalReelUrls]
                      next[i] = e.target.value
                      onChange({ additionalReelUrls: next })
                    }}
                    placeholder="https://…"
                    className={inp}
                  />
                  <button
                    onClick={() => onChange({ additionalReelUrls: draft.additionalReelUrls.filter((_, j) => j !== i) })}
                    className="text-xs text-[#9CA3AF] hover:text-red-500 shrink-0 px-1"
                  >✕</button>
                </div>
              ))}
              <button
                onClick={() => onChange({ additionalReelUrls: [...draft.additionalReelUrls, ''] })}
                className="text-xs text-[#C86A43] hover:underline text-left ml-7"
              >
                + Add another reel
              </button>
              <MediaUpload
                onChange={v => onChange({ additionalReelUrls: [...draft.additionalReelUrls.filter(Boolean), v] })}
                accept="video"
                label="Upload a video to add as another reel"
                aspect="auto"
                uploadOptions={{ ...uploadOpts, usageType: 'reel-preview' }}
              />
              <p className="text-[11px] text-[#9CA3AF]">One reel is fine to publish with — add as many more as you like.</p>
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
              <p className="text-[11px] text-[#9CA3AF] text-center -my-0.5">or</p>
              <MediaUpload
                onChange={v => onChange({ audioUrl: v })}
                accept="audio"
                label="Upload an audio file instead"
                aspect="auto"
                uploadOptions={uploadOpts}
              />
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
              <p className="text-xs text-[#9CA3AF]">
                Don't want to start from scratch? Use CULO Creatives in Canva to design your slides.
              </p>
              {draft.carouselSlides.filter(Boolean).length > 0 && (
                <div className="flex flex-col gap-2">
                  {draft.carouselSlides.map((slide, i) => slide ? (
                    <div key={i} className="flex items-center gap-2 bg-white rounded-lg border border-[#E8E4DD] p-2">
                      <span className="text-xs text-[#9CA3AF] w-5 shrink-0 text-right">{i + 1}</span>
                      <img src={slide} alt="" className="w-10 h-10 rounded object-cover shrink-0 bg-[#F3EDE6]" />
                      <div className="flex-1" />
                      <button
                        onClick={() => {
                          if (i === 0) return
                          const next = [...draft.carouselSlides]
                          ;[next[i - 1], next[i]] = [next[i]!, next[i - 1]!]
                          onChange({ carouselSlides: next })
                        }}
                        disabled={i === 0}
                        className="text-xs text-[#9CA3AF] hover:text-[#C86A43] disabled:opacity-30 disabled:hover:text-[#9CA3AF] shrink-0 px-1"
                        aria-label="Move earlier"
                      >↑</button>
                      <button
                        onClick={() => {
                          if (i === draft.carouselSlides.length - 1) return
                          const next = [...draft.carouselSlides]
                          ;[next[i], next[i + 1]] = [next[i + 1]!, next[i]!]
                          onChange({ carouselSlides: next })
                        }}
                        disabled={i === draft.carouselSlides.length - 1}
                        className="text-xs text-[#9CA3AF] hover:text-[#C86A43] disabled:opacity-30 disabled:hover:text-[#9CA3AF] shrink-0 px-1"
                        aria-label="Move later"
                      >↓</button>
                      <button
                        onClick={() => onChange({ carouselSlides: draft.carouselSlides.filter((_, j) => j !== i) })}
                        className="text-xs text-[#9CA3AF] hover:text-red-500 shrink-0 px-1"
                      >✕</button>
                    </div>
                  ) : null)}
                  <p className="text-[11px] text-[#9CA3AF]">First image is used as cover automatically. Use ↑↓ to reorder.</p>
                </div>
              )}
              <MediaUpload
                onChange={v => onChange({ carouselSlides: [...draft.carouselSlides.filter(Boolean), v] })}
                onChangeMultiple={urls => onChange({ carouselSlides: [...draft.carouselSlides.filter(Boolean), ...urls] })}
                multiple
                accept="image"
                label="Upload images to add as slides — select as many as you need"
                aspect="auto"
                uploadOptions={{ ...uploadOpts, usageType: 'carousel-slide' }}
              />
            </div>
          </div>
        )}

        {hasDocument && (
          <div className="border border-[#E8E4DD] rounded-xl overflow-hidden">
            <div className="bg-[#F8F5F0] px-4 py-2 border-b border-[#E8E4DD]">
              <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-widest">Document / External Link</p>
            </div>
            <div className="px-4 py-3 flex flex-col gap-2">
              <Field label="URL" hint="Link to the document, article or social post.">
                <input
                  type="url"
                  value={draft.documentUrl}
                  onChange={e => onChange({ documentUrl: e.target.value })}
                  placeholder="https://…"
                  className={inp}
                />
              </Field>
              <p className="text-[11px] text-[#9CA3AF] text-center -my-0.5">or</p>
              <MediaUpload
                onChange={v => onChange({ documentUrl: v })}
                accept="document"
                label="Upload a document instead"
                aspect="auto"
                uploadOptions={uploadOpts}
              />
            </div>
          </div>
        )}

        {(hasBlog || hasSlides) && (
          <div className="border border-[#E8E4DD] rounded-xl overflow-hidden">
            <div className="bg-[#F8F5F0] px-4 py-2 border-b border-[#E8E4DD]">
              <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-widest">Today's Blog</p>
            </div>
            <div className="px-4 py-3 flex flex-col gap-3">
              <Field label="Title">
                <input
                  type="text"
                  value={draft.title}
                  onChange={e => onChange({ title: e.target.value })}
                  placeholder="What is this story about?"
                  className={inp}
                />
              </Field>
              <Field label="Content">
                <textarea
                  value={draft.blog}
                  onChange={e => onChange({ blog: e.target.value })}
                  rows={10}
                  placeholder="Don't want to start from scratch? Use CULO Creatives in Canva to shape your messy thoughts."
                  className={inp + ' resize-y'}
                />
              </Field>
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
            <MediaUpload
              value={draft.coverImage}
              onChange={v => onChange({ coverImage: v })}
              label="Upload cover"
              aspect="wide"
              uploadOptions={{ founderId: draft.founderId, businessId: draft.businessId, usageType: 'story-cover' }}
            />
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

// ─── Tell Your Story (distraction-free) ────────────────────────────────────────
// Only the story itself — headline, hero image, summary, and the founder's own
// words. No topics, no SEO, no relationships, no settings. Village Intelligence
// (next step) reads this same draft to do everything else automatically.

function TellYourStoryStep({ draft, onChange, onNext, onBack }: {
  draft: PublishDraft
  onChange: (patch: Partial<PublishDraft>) => void
  onNext: () => void
  onBack: () => void
}) {
  return (
    <div className="max-w-xl mx-auto">
      <StepHeader
        title="Blog"
        subtitle="Paste a transcript to unlock richer diary generation. On YouTube, click ··· below any video, then Show transcript, to copy and paste here. Or just write your story below."
        onBack={onBack}
      />
      <div className="flex flex-col gap-5">
        <Field label="Headline" hint="Optional. Village can draft one from your content if you leave this blank.">
          <input type="text" value={draft.title} onChange={e => onChange({ title: e.target.value })}
            placeholder="What is this story about?" className={inp + ' text-lg font-semibold py-3'} autoFocus />
        </Field>
        <Field label="Summary" hint="Optional. One or two sentences, the reader's takeaway.">
          <textarea value={draft.summary} onChange={e => onChange({ summary: e.target.value })} rows={3}
            placeholder="The honest story of…" className={inp + ' resize-y'} />
        </Field>
        <Field label="Blog" hint="Optional. Paste a transcript above, or just write freely. Village will find the structure.">
          <textarea
            value={draft.blog}
            onChange={e => onChange({ blog: e.target.value })}
            rows={14}
            placeholder="What happened? What did you learn? What would you do differently?"
            className={inp + ' resize-y text-sm leading-relaxed'}
          />
        </Field>
        <button
          onClick={onNext}
          className="py-3.5 bg-[#C86A43] text-white text-base font-bold rounded-2xl hover:bg-[#b05a35] disabled:opacity-50 transition-colors mt-2"
        >
          Continue to Village Intelligence →
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
  'Homepage (if featured)', 'Search', 'Related Stories', 'Ideas & Topics',
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

function StoryBuilderStep({ draft, onChange, onBack, onNext }: {
  draft: PublishDraft
  onChange: (patch: Partial<PublishDraft>) => void
  onBack: () => void
  onNext: () => void
}) {
  const { user } = useAuth()
  const currentFounder = getCurrentFounder(user)
  const founders   = currentFounder ? [currentFounder] : []
  const businesses = getBusinesses().filter(b => b.founderId === currentFounder?.id)
  const singleFounder  = founders.length === 1  ? founders[0]   : null
  const singleBusiness = businesses.length === 1 ? businesses[0] : null
  const founder = getFounders().find(f => f.id === draft.founderId)
  const [customTopicInput, setCustomTopicInput] = useState('')
  // Protects the current topic selection from accidental clicks — useful
  // once the auto-picked topics look right and you don't want to risk
  // bumping one off while scrolling/tapping through the list.
  const [topicsLocked, setTopicsLocked] = useState(false)

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

  // Real projected impact — same matching/scoring rules as the actual publish
  // write path (services/ideaSync.ts), just not yet persisted.
  const previewStory = useMemo(() => buildPreviewStory(draft, founder), [draft, founder])
  const impact = useMemo(() => previewIdeaImpact(previewStory, intel), [previewStory, intel])
  const readability = useMemo(() => computeReadability(draft.blog), [draft.blog])
  const recommendedImprovements = useMemo(() => getStoryMissingItems(previewStory), [previewStory])

  const intelligenceRows = [
    { label: 'Ideas detected',      count: impact.newIdeas + impact.strengthenedIdeas },
    { label: 'Founders connected',  count: suggestedFounders.length + extraFounders.length },
    { label: 'Businesses connected', count: suggestedBusinesses.length + extraBusinesses.length },
    { label: 'Related content',     count: relatedContentItems.length },
    { label: 'Topics added',        count: draft.topics.length },
    { label: 'Questions answered',  count: questions.length },
    { label: 'SEO keywords',        count: intel.seoKeywords.length },
    { label: 'AI answer signals',   count: intel.geoKeywords.length },
  ]

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-4">
      <StepHeader title="Building Your Reach" subtitle="Village is reading your story and building everything else automatically." onBack={onBack} />

      {/* ── Trust Score — the number this whole screen is building toward (internally: Authority Score) ── */}
      {draft.founderId && (
        <div className="bg-gradient-to-br from-[#2D2A26] to-[#3d3831] rounded-2xl px-6 py-6 text-white flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-1">Your Trust Score</p>
            <p className="text-4xl font-bold">{impact.currentAuthorityScore}</p>
          </div>
          {impact.projectedAuthorityDelta !== 0 && (
            <div className="text-right">
              <p className="text-sm font-semibold text-[#8FBF6F]">↑ +{impact.projectedAuthorityDelta}</p>
              <p className="text-[11px] text-white/50 mt-0.5">from publishing this story</p>
            </div>
          )}
        </div>
      )}

      {/* ── Live extraction summary — this is the "watch it happen" moment ── */}
      <div className="bg-[#2D2A26] rounded-2xl px-6 py-6 text-white">
        <p className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-4">Understanding your story…</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {intelligenceRows.map((row, i) => (
            <div
              key={row.label}
              className="transition-all duration-500"
              style={{ transitionDelay: `${i * 60}ms`, opacity: row.count > 0 ? 1 : 0.35 }}
            >
              <p className="text-2xl font-bold">{row.count}</p>
              <p className="text-[11px] text-white/60 leading-snug mt-0.5">{row.label}</p>
            </div>
          ))}
          <div className="transition-all duration-500" style={{ transitionDelay: `${intelligenceRows.length * 60}ms` }}>
            <p className="text-2xl font-bold">{impact.newIdeas}</p>
            <p className="text-[11px] text-white/60 leading-snug mt-0.5">New ideas</p>
          </div>
          <div className="transition-all duration-500" style={{ transitionDelay: `${(intelligenceRows.length + 1) * 60}ms` }}>
            <p className="text-2xl font-bold">{impact.strengthenedIdeas}</p>
            <p className="text-[11px] text-white/60 leading-snug mt-0.5">Ideas strengthened</p>
          </div>
        </div>
        <p className="text-xs text-white/40 mt-5">
          Keep writing on the previous step and come back. This updates automatically, nothing here requires manual setup.
        </p>
      </div>

      {/* ── Readability + recommended improvements ───────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-[#E8E4DD] px-5 py-4">
          <p className="text-sm font-bold text-[#2D2A26] mb-1">Readability</p>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-3xl font-bold text-[#C86A43]">{readability.score}</p>
            <p className="text-xs text-[#9CA3AF]">{readability.label}</p>
          </div>
          <p className="text-[11px] text-[#9CA3AF] mt-1.5">{readability.wordCount} words · {readability.avgWordsPerSentence} words/sentence</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#E8E4DD] px-5 py-4">
          <p className="text-sm font-bold text-[#2D2A26] mb-2">Recommended improvements</p>
          {recommendedImprovements.length === 0 ? (
            <p className="text-xs text-green-600 mt-2">Nothing left to improve. This story is ready.</p>
          ) : (
            <div className="flex flex-col gap-1.5 mt-2">
              {recommendedImprovements.slice(0, 3).map(item => (
                <p key={item.field} className="text-xs text-[#6B7280]">· {item.action}: {item.label}</p>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── 1. Lessons ───────────────────────────────────────────────────── */}
      <BuilderCard title="Lessons" subtitle="Extracted from your writing above. Edit, remove or add your own." defaultOpen={false}
        badge={<span className="text-[10px] text-[#9CA3AF]">{lessons.length}</span>}>
        <EditableList items={lessons} onChange={v => onChange({ lessonsOverride: v })} placeholder="a lesson" />
      </BuilderCard>

      {/* ── 4. Questions this story answers ──────────────────────────────── */}
      <BuilderCard title="Questions this story answers" subtitle="Helps search engines and AI assistants (like ChatGPT) understand and describe this story." defaultOpen={false}
        badge={<span className="text-[10px] text-[#9CA3AF]">{questions.length}</span>}>
        <EditableList items={questions} onChange={v => onChange({ questionsOverride: v })} placeholder="a question" />
      </BuilderCard>

      {/* ── 5. Topics ────────────────────────────────────────────────────── */}
      <BuilderCard title="Topics" subtitle="Automatically picked up from your story. First topic is primary — click a topic to make it primary. Don't see yours? Write your own below: it gets its own page in the Village.">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] text-[#9CA3AF]">{topicsLocked ? 'Locked — clicking won\'t change your selection.' : 'Click to add/remove, or lock to protect your current picks.'}</p>
          <button
            type="button"
            onClick={() => setTopicsLocked(v => !v)}
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-colors shrink-0 ${
              topicsLocked ? 'bg-[#5E6B4A]/10 text-[#5E6B4A] border-[#5E6B4A]/30' : 'bg-white text-[#9CA3AF] border-[#E8E4DD] hover:border-[#C86A43]/40'
            }`}
          >
            {topicsLocked ? '🔒 Locked' : '🔓 Lock selection'}
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {allTopics.map(topic => {
            const idx = draft.topics.findIndex(t => t.id === topic.id)
            const active = idx !== -1
            return (
              <button
                key={topic.id}
                onClick={() => { if (topicsLocked) return; if (active) makePrimaryTopic(topic); else toggleTopic(topic) }}
                onDoubleClick={() => { if (!topicsLocked) toggleTopic(topic) }}
                title={topicsLocked ? 'Locked — unlock to edit' : active ? (idx === 0 ? 'Primary topic' : 'Click to make primary, double-click to remove') : 'Click to add'}
                className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                  idx === 0 ? 'bg-[#C86A43] text-white border-[#C86A43] font-semibold'
                  : active ? 'bg-[#F3EDE6] text-[#C86A43] border-[#C86A43]/40'
                  : 'bg-white text-[#4B4845] border-[#E8E4DD] hover:border-[#C86A43]/50'
                } ${topicsLocked ? 'opacity-70 cursor-default' : ''}`}
              >
                {idx === 0 && '★ '}{topic.name}
              </button>
            )
          })}
          {draft.topics.filter(t => !allTopics.some(at => at.id === t.id)).map((topic, i) => {
            const idx = draft.topics.findIndex(t => t.id === topic.id)
            return (
              <button
                key={topic.id}
                onClick={() => makePrimaryTopic(topic)}
                onDoubleClick={() => toggleTopic(topic)}
                title={idx === 0 ? 'Primary topic' : 'Click to make primary, double-click to remove'}
                className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                  idx === 0 ? 'bg-[#C86A43] text-white border-[#C86A43] font-semibold' : 'bg-[#F3EDE6] text-[#C86A43] border-[#C86A43]/40'
                }`}
              >
                {idx === 0 && '★ '}{topic.name}{i === 0 && ' ✎'}
              </button>
            )
          })}
        </div>

        {!topicsLocked && (
          <div className="flex gap-2 mt-3">
            <input
              type="text"
              value={customTopicInput}
              onChange={e => setCustomTopicInput(e.target.value)}
              onKeyDown={e => {
                if (e.key !== 'Enter' || !customTopicInput.trim()) return
                toggleTopic(createCustomTopic(customTopicInput, [...allTopics, ...draft.topics]))
                setCustomTopicInput('')
              }}
              placeholder="Write your own topic…"
              className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-[#E8E4DD] focus:outline-none focus:border-[#C86A43]"
            />
            <button
              onClick={() => {
                if (!customTopicInput.trim()) return
                toggleTopic(createCustomTopic(customTopicInput, [...allTopics, ...draft.topics]))
                setCustomTopicInput('')
              }}
              disabled={!customTopicInput.trim()}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#2D2A26] text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#1a1815] transition-colors shrink-0"
            >
              Add
            </button>
          </div>
        )}

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
          {suggestedFounders.length + extraFounders.length === 0 && <p className="text-xs text-[#9CA3AF]">None detected yet. Mention another founder by name in your writing.</p>}
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
              <div className="w-6 h-6 rounded bg-[#F3EDE6] shrink-0 flex items-center justify-center overflow-hidden p-0.5">
                <img src={b.logo} alt="" className="w-full h-full object-contain" />
              </div>
              <span className="flex-1 text-[#2D2A26]">{b.name}</span>
              <button
                onClick={() => draft.extraBusinessIds.includes(b.id)
                  ? onChange({ extraBusinessIds: draft.extraBusinessIds.filter(id => id !== b.id) })
                  : onChange({ excludedBusinessIds: [...draft.excludedBusinessIds, b.id] })}
                className="text-xs text-[#9CA3AF] hover:text-red-500"
              >Remove</button>
            </div>
          ))}
          {suggestedBusinesses.length + extraBusinesses.length === 0 && <p className="text-xs text-[#9CA3AF]">None detected yet. Mention a business by name in your writing.</p>}
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
      <BuilderCard title="Related Content" subtitle="Stories and imports this connects to, computed automatically. Remove anything incorrect." defaultOpen={false}
        badge={<span className="text-[10px] text-[#9CA3AF]">{relatedContentItems.length}</span>}>
        <div className="flex flex-col gap-2">
          {relatedContentItems.map(item => (
            <div key={item.id} className="flex items-center gap-2 text-sm">
              <span className="flex-1 text-[#2D2A26] truncate">{'title' in item ? item.title : ''}</span>
              <button onClick={() => onChange({ excludedContentIds: [...draft.excludedContentIds, item.id] })} className="text-xs text-[#9CA3AF] hover:text-red-500">Remove</button>
            </div>
          ))}
          {relatedContentItems.length === 0 && <p className="text-xs text-[#9CA3AF]">Nothing connected yet. Add topics or write more detail above.</p>}
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
              <div className="w-7 h-7 rounded bg-[#F3EDE6] shrink-0 flex items-center justify-center overflow-hidden p-0.5">
                <img src={singleBusiness.logo} alt="" className="w-full h-full object-contain" />
              </div>
              <p className="text-sm text-[#2D2A26] flex-1">{singleBusiness.name}</p>
              <span className="text-[10px] text-[#9CA3AF]">auto-selected</span>
            </div>
          )}
        </div>
      </BuilderCard>

      {/* ── 11. Call To Action ───────────────────────────────────────────── */}
      <BuilderCard title="Call To Action" subtitle="Pick one primary action for readers to take." defaultOpen={false}>
        {draft.partnerId && (() => {
          const linkedPartner = partnerService.get(draft.partnerId)
          return linkedPartner ? (
            <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-[#5E6B4A]/10 rounded-lg">
              <p className="text-xs text-[#5E6B4A] flex-1">
                Linked to partner <span className="font-semibold">{linkedPartner.name}</span> — this click will be tracked as an affiliate referral.
              </p>
              <button type="button" onClick={() => onChange({ partnerId: undefined })} className="text-[10px] font-semibold text-[#5E6B4A] hover:underline shrink-0">
                Unlink
              </button>
            </div>
          ) : null
        })()}

        <div className="mb-3">
          <Field label="Affiliate partner">
            <select value={draft.partnerId ?? ''} className={inp}
              onChange={e => {
                const partnerId = e.target.value || undefined
                if (!partnerId) { onChange({ partnerId: undefined }); return }
                const partner = partnerService.get(partnerId)
                onChange({
                  partnerId,
                  ctaPreset: 'custom',
                  ctaLabel: partner ? `Visit ${partner.name}` : draft.ctaLabel,
                  ctaUrl: partner?.affiliateUrl || partner?.website || draft.ctaUrl,
                })
              }}>
              <option value="">None — custom link</option>
              {partnerService.getAll({ status: 'active' }).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          {CTA_PRESETS.map(p => (
            <button
              key={p.key}
              onClick={() => onChange({
                ctaPreset: p.key,
                ctaLabel: p.ctaLabel,
                ctaUrl: p.key === 'business' && singleBusiness ? `/businesses/${singleBusiness.slug}` : draft.ctaUrl,
                // A preset is a different action than the linked partner's
                // link — clearing partnerId here is what actually fixes the
                // bug where ctaUrl/ctaLabel changed but partnerId silently
                // stayed attached, misattributing tracked affiliate clicks
                // to a partner the link no longer points to.
                partnerId: undefined,
              })}
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
            <input type="text" value={draft.ctaLabel} onChange={e => onChange({ ctaLabel: e.target.value, partnerId: undefined })} className={inp} placeholder="Read more" />
          </Field>
          <Field label="Link">
            <input type="url" value={draft.ctaUrl} onChange={e => onChange({ ctaUrl: e.target.value, partnerId: undefined })} className={inp} placeholder="https://" />
          </Field>
        </div>
      </BuilderCard>

      {/* ── 12. SEO Preview ──────────────────────────────────────────────── */}
      <BuilderCard title="SEO Preview" subtitle="Read-only: generated automatically from the content above." defaultOpen={false}>
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

      {/* ── 13. AI Discovery Preview ─────────────────────────────────────── */}
      <BuilderCard title="AI Discovery Preview" subtitle="How AI systems (like ChatGPT) will understand this story. Read-only." defaultOpen={false}>
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

      {/* ── One action: see exactly what publishing will do ─────────────── */}
      <div className="sticky bottom-0 bg-[#F8F5F0]/95 backdrop-blur pt-3 pb-1 -mx-8 px-8 border-t border-[#E8E4DD] mt-2">
        <button
          onClick={onNext}
          disabled={!draft.founderId}
          className="w-full py-3.5 bg-[#C86A43] text-white text-base font-bold rounded-2xl hover:bg-[#b05a35] disabled:opacity-50 transition-colors"
        >
          Continue to Preview →
        </button>
        {!draft.founderId && (
          <p className="text-xs text-red-600 text-center mt-2">
            We couldn't find your founder profile, so this can't continue yet. Try refreshing the page, or contact support if this keeps happening.
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Preview — "publishing this will also…" ────────────────────────────────────
// The moment the founder understands the value Village provides. Same analyse()
// call as Village Intelligence and handlePublish — just framed as consequences
// of hitting Publish, with the ability to remove anything before committing.

function PreviewStep({ draft, onChange, onBack, onPublish, publishing, publishError }: {
  draft: PublishDraft
  onChange: (patch: Partial<PublishDraft>) => void
  onBack: () => void
  onPublish: (action: 'publish' | 'draft' | 'archive') => void
  publishing: boolean
  publishError?: string
}) {
  const founder = getFounders().find(f => f.id === draft.founderId)
  const business = getBusinesses().find(b => b.id === draft.businessId)
  const [founderSearch, setFounderSearch] = useState('')
  const [businessSearch, setBusinessSearch] = useState('')

  const intel = useMemo(() => {
    const previewStory = buildPreviewStory(draft, founder)
    return villageContentIntelligenceService.analyse(storyToInput(previewStory))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.title, draft.summary, draft.blog, draft.topics, draft.locationId, draft.founderId, draft.businessId])

  const lessons   = draft.lessonsOverride   ?? intel.lessons
  const questions = draft.questionsOverride ?? [...intel.geoQuestions, ...intel.searchQuestions]

  const suggestedFounders   = getFounders().filter(f => intel.relatedFounderIds.includes(f.id) && !draft.excludedFounderIds.includes(f.id))
  const suggestedBusinesses = getBusinesses().filter(b => intel.relatedBusinessIds.includes(b.id) && !draft.excludedBusinessIds.includes(b.id))
  const extraFounders   = getFounders().filter(f => draft.extraFounderIds.includes(f.id))
  const extraBusinesses = getBusinesses().filter(b => draft.extraBusinessIds.includes(b.id))
  const relatedContentItems = intel.relatedContentIds
    .filter(id => !draft.excludedContentIds.includes(id))
    .map(id => getStories().find(s => s.id === id) ?? importedContentService.get(id))
    .filter((x): x is NonNullable<typeof x> => !!x)

  const allFounders  = [...suggestedFounders, ...extraFounders]
  const allBusinesses = business ? [business, ...suggestedBusinesses, ...extraBusinesses] : [...suggestedBusinesses, ...extraBusinesses]

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-4">
      <StepHeader title="Preview" subtitle="Exactly what happens when you publish. Remove anything that isn't right." onBack={onBack} />

      {/* ── Publishing this story will also… ─────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#E8E4DD] px-6 py-5">
        <p className="text-sm font-bold text-[#2D2A26] mb-4">Publishing this story will also:</p>
        <div className="flex flex-col gap-2.5">
          {founder && <CheckItem label={`Strengthen your Founder Profile (${founder.name})`} />}

          <div>
            <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest mb-1.5">Mentioned in this story</p>
            <p className="text-[11px] text-[#9CA3AF] mb-2">
              {allBusinesses.length > 0 || allFounders.length > 0
                ? 'Found by name in your writing. Link them to this story, or remove any that shouldn\'t be here.'
                : 'Nothing found by name yet — type below to link a founder or business anyway.'}
            </p>
          </div>
          {allBusinesses.map(b => (
            <div key={b.id} className="flex items-center gap-2.5 text-sm">
              <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 bg-[#5E6B4A]">
                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </div>
              <span className="flex-1 text-[#2D2A26]">Connect to {b.name}</span>
              {b.id !== draft.businessId && (
                <button onClick={() => draft.extraBusinessIds.includes(b.id)
                  ? onChange({ extraBusinessIds: draft.extraBusinessIds.filter(id => id !== b.id) })
                  : onChange({ excludedBusinessIds: [...draft.excludedBusinessIds, b.id] })}
                  className="text-xs text-[#9CA3AF] hover:text-red-500">Remove</button>
              )}
            </div>
          ))}
          {allFounders.map(f => (
            <div key={f.id} className="flex items-center gap-2.5 text-sm">
              <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 bg-[#5E6B4A]">
                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </div>
              <span className="flex-1 text-[#2D2A26]">Connect to {f.name}</span>
              <button onClick={() => draft.extraFounderIds.includes(f.id)
                ? onChange({ extraFounderIds: draft.extraFounderIds.filter(id => id !== f.id) })
                : onChange({ excludedFounderIds: [...draft.excludedFounderIds, f.id] })}
                className="text-xs text-[#9CA3AF] hover:text-red-500">Remove</button>
            </div>
          ))}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <div className="relative">
              <input
                type="text"
                value={businessSearch}
                onChange={e => setBusinessSearch(e.target.value)}
                placeholder="Type a business name to connect…"
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#E8E4DD] focus:outline-none focus:border-[#C86A43]"
              />
              {businessSearch.trim().length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-[#E8E4DD] rounded-lg shadow-md max-h-40 overflow-y-auto">
                  {getBusinesses()
                    .filter(b => b.name.toLowerCase().includes(businessSearch.trim().toLowerCase()) && !allBusinesses.some(x => x.id === b.id))
                    .slice(0, 6)
                    .map(b => (
                      <button
                        key={b.id}
                        onClick={() => { onChange({ extraBusinessIds: [...draft.extraBusinessIds, b.id] }); setBusinessSearch('') }}
                        className="block w-full text-left px-3 py-2 text-xs text-[#2D2A26] hover:bg-[#F8F5F0]"
                      >
                        {b.name}
                      </button>
                    ))}
                  {getBusinesses().filter(b => b.name.toLowerCase().includes(businessSearch.trim().toLowerCase()) && !allBusinesses.some(x => x.id === b.id)).length === 0 && (
                    <p className="px-3 py-2 text-xs text-[#9CA3AF]">No matching business found.</p>
                  )}
                </div>
              )}
            </div>
            <div className="relative">
              <input
                type="text"
                value={founderSearch}
                onChange={e => setFounderSearch(e.target.value)}
                placeholder="Type a founder name to connect…"
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#E8E4DD] focus:outline-none focus:border-[#C86A43]"
              />
              {founderSearch.trim().length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-[#E8E4DD] rounded-lg shadow-md max-h-40 overflow-y-auto">
                  {getFounders()
                    .filter(f => f.name.toLowerCase().includes(founderSearch.trim().toLowerCase()) && !allFounders.some(x => x.id === f.id))
                    .slice(0, 6)
                    .map(f => (
                      <button
                        key={f.id}
                        onClick={() => { onChange({ extraFounderIds: [...draft.extraFounderIds, f.id] }); setFounderSearch('') }}
                        className="block w-full text-left px-3 py-2 text-xs text-[#2D2A26] hover:bg-[#F8F5F0]"
                      >
                        {f.name}
                      </button>
                    ))}
                  {getFounders().filter(f => f.name.toLowerCase().includes(founderSearch.trim().toLowerCase()) && !allFounders.some(x => x.id === f.id)).length === 0 && (
                    <p className="px-3 py-2 text-xs text-[#9CA3AF]">No matching founder found.</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {relatedContentItems.length > 0 && (
            <CheckItem label={`Link to ${relatedContentItems.length} related ${relatedContentItems.length === 1 ? 'story' : 'stories'}`} />
          )}
          {draft.topics.length > 0 && <CheckItem label={`Tag ${draft.topics.length} ${draft.topics.length === 1 ? 'topic' : 'topics'} (${draft.topics[0].name}${draft.topics.length > 1 ? ' + more' : ''})`} />}
          {lessons.length > 0 && <CheckItem label={`Create or strengthen ${lessons.length} ${lessons.length === 1 ? 'idea' : 'ideas'} in the Village`} />}
          <CheckItem label={`Generate SEO metadata (${intel.seoKeywords.length} keywords)`} done={intel.seoKeywords.length > 0} />
          <CheckItem label={`Generate AI answer metadata (${questions.length} questions answered)`} done={questions.length > 0} />
          <CheckItem label="Improve Village Intelligence" />
        </div>
      </div>

      {/* ── Where this appears ───────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#E8E4DD] px-5 py-4">
        <p className="text-sm font-bold text-[#2D2A26] mb-1">Once published, appears in:</p>
        <div className="grid grid-cols-2 gap-2.5 mt-3">{DISTRIBUTION_LOCATIONS.map(loc => <CheckItem key={loc} label={loc} done />)}</div>
      </div>

      {/* ── Public Preview ───────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#E8E4DD] overflow-hidden">
        <div className="px-5 pt-4">
          <p className="text-sm font-bold text-[#2D2A26]">How this looks, published</p>
        </div>
        <div className="border border-[#E8E4DD] rounded-xl overflow-hidden m-5 mt-3">
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
      </div>

      {/* ── Finishing touches ────────────────────────────────────────────── */}
      {/* Same recommendations the Stories dashboard nags about after the fact
          (Write Summary / Add CTA Link / Add Page Title / Add Description) —
          surfaced here, editable inline, so a founder fills them in as one
          pass while publishing instead of discovering a checklist later. */}
      {(() => {
        const touches: { key: string; label: string }[] = []
        if (!draft.summary || draft.summary.length < 80) touches.push({ key: 'summary', label: 'Write a summary so readers know what this is about' })
        if (!draft.ctaUrl) touches.push({ key: 'cta', label: 'Add a call-to-action link' })
        if (touches.length === 0) return null

        return (
          <div className="bg-white rounded-2xl border border-[#E8E4DD] px-6 py-5">
            <p className="text-sm font-bold text-[#2D2A26] mb-1">A few finishing touches</p>
            <p className="text-xs text-[#9CA3AF] mb-4">Optional, but they help readers. Fill them in now — no need to come back later.</p>
            <div className="flex flex-col gap-4">
              {touches.some(t => t.key === 'summary') && (
                <Field label="Summary" hint="One or two sentences, the reader's takeaway.">
                  <textarea value={draft.summary} onChange={e => onChange({ summary: e.target.value })} rows={2} className={inp} placeholder="What's this story about, in a sentence or two?" />
                </Field>
              )}
              {touches.some(t => t.key === 'cta') && (
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Button label">
                    <input type="text" value={draft.ctaLabel} onChange={e => onChange({ ctaLabel: e.target.value, partnerId: undefined })} className={inp} placeholder="Read more" />
                  </Field>
                  <Field label="Link">
                    <input type="url" value={draft.ctaUrl} onChange={e => onChange({ ctaUrl: e.target.value, partnerId: undefined })} className={inp} placeholder="https://" />
                  </Field>
                </div>
              )}
            </div>
          </div>
        )
      })()}

      {/* ── Search & AI preview — always derived from Title + Blog/Summary,
           never a separate field to fill in and keep in sync by hand. ──── */}
      <div className="bg-white rounded-2xl border border-[#E8E4DD] px-6 py-5">
        <p className="text-sm font-bold text-[#2D2A26] mb-1">What search engines and AI will show</p>
        <p className="text-xs text-[#C86A43] font-medium truncate mt-2">{deriveSeoTitle(draft.title)}</p>
        <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">{deriveSeoDescription(draft.summary, draft.blog)}</p>
      </div>

      {/* ── Publish ───────────────────────────────────────────────────────── */}
      <div className="sticky bottom-0 bg-[#F3F7FA]/95 backdrop-blur pt-3 pb-1 -mx-8 px-8 flex flex-col gap-3 border-t border-[#E8E4DD] mt-2">
        {publishError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{publishError}</p>}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onPublish('publish')}
            disabled={publishing || !draft.founderId}
            className="flex-1 py-3.5 bg-[#C86A43] text-white text-base font-bold rounded-2xl hover:bg-[#b05a35] disabled:opacity-50 transition-colors"
          >
            {publishing ? 'Publishing…' : 'Publish to Village'}
          </button>
          <button onClick={() => onPublish('draft')} disabled={publishing || !draft.founderId} className="px-4 py-3.5 border-2 border-[#E8E4DD] text-[#2D2A26] text-sm font-semibold rounded-xl hover:border-[#C86A43]/40 disabled:opacity-50 transition-colors">
            Save Draft
          </button>
        </div>
        {!draft.founderId && (
          <p className="text-xs text-red-600 text-center">
            We couldn't find your founder profile, so this can't publish yet. Try refreshing the page, or contact support if this keeps happening.
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Step 7: Done ─────────────────────────────────────────────────────────────

function DoneStep({ draft, publishedSlug, action, summary, onContinuePublishing }: {
  draft: PublishDraft
  publishedSlug: string
  action: 'publish' | 'draft' | 'archive'
  summary: PublishSummary | null
  onContinuePublishing: () => void
}) {
  const [shared, setShared] = useState(false)
  const storyUrl = typeof window !== 'undefined' ? `${window.location.origin}/stories/${publishedSlug}` : `/stories/${publishedSlug}`

  const isMilestone = action === 'publish' && !!summary?.milestone

  const label = isMilestone ? 'Che CULO!'
              : action === 'publish' ? 'Story Published'
              : action === 'draft'   ? 'Saved as Draft'
              : 'Archived'

  const msg = isMilestone
    ? summary!.milestone!.replace(/^Che CULO!!\s*/, '')
    : action === 'publish'
    ? `"${draft.title}" is live in the Village.`
    : action === 'draft'
    ? `"${draft.title}" has been saved as a draft. You can publish it any time from My Publications.`
    : `"${draft.title}" has been archived.`

  async function handleShare() {
    if (navigator.share) {
      try { await navigator.share({ title: draft.title, url: storyUrl }); return } catch { /* user cancelled */ }
    }
    await navigator.clipboard.writeText(storyUrl)
    setShared(true)
    setTimeout(() => setShared(false), 2000)
  }

  return (
    <div className="max-w-md mx-auto text-center">
      <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
        isMilestone ? 'bg-[#C86A43]/10' : action === 'publish' ? 'bg-green-100' : 'bg-[#F3EDE6]'
      }`}>
        {isMilestone ? (
          <span className="text-4xl" aria-hidden="true">🎉</span>
        ) : (
          <svg className={`w-10 h-10 ${action === 'publish' ? 'text-green-600' : 'text-[#C86A43]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <h1 className={`text-2xl font-bold mb-2 ${isMilestone ? 'text-[#C86A43]' : 'text-[#2D2A26]'}`}>{label}</h1>
      <p className="text-sm text-[#6B7280] mb-6 leading-relaxed">{msg}</p>

      {action === 'publish' && summary && (
        <div className="bg-[#2D2A26] rounded-2xl px-6 py-5 text-left mb-6">
          <p className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-3">Village also created</p>
          {summary.authorityDelta !== 0 && (
            <p className="text-xs text-[#8FBF6F] font-semibold mb-3">
              Trust Score {summary.authorityDelta > 0 ? '↑' : '↓'} {summary.authorityDelta > 0 ? '+' : ''}{summary.authorityDelta}
            </p>
          )}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
            {summary.ideasCreated > 0 && <CelebrationRow count={summary.ideasCreated} label={summary.ideasCreated === 1 ? 'Idea Created' : 'Ideas Created'} />}
            {summary.ideasStrengthened > 0 && <CelebrationRow count={summary.ideasStrengthened} label={summary.ideasStrengthened === 1 ? 'Idea Strengthened' : 'Ideas Strengthened'} />}
            {summary.relationships > 0 && <CelebrationRow count={summary.relationships} label={summary.relationships === 1 ? 'Relationship' : 'Relationships'} />}
            {summary.founderLinks > 0 && <CelebrationRow count={summary.founderLinks} label={summary.founderLinks === 1 ? 'Founder Link' : 'Founder Links'} />}
            {summary.businessLinks > 0 && <CelebrationRow count={summary.businessLinks} label={summary.businessLinks === 1 ? 'Business Link' : 'Business Links'} />}
            {summary.internalLinks > 0 && <CelebrationRow count={summary.internalLinks} label="Internal Links" />}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-4 pt-4 border-t border-white/10">
            <span className="text-xs text-white/70 flex items-center gap-1.5">{summary.seoComplete ? '✓' : '—'} SEO {summary.seoComplete ? 'Complete' : 'Skipped'}</span>
            <span className="text-xs text-white/70 flex items-center gap-1.5">{summary.geoComplete ? '✓' : '—'} AI Discovery {summary.geoComplete ? 'Complete' : 'Skipped'}</span>
            <span className="text-xs text-white/70 flex items-center gap-1.5">✓ Village Updated</span>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {action === 'publish' && (
          <>
            <a
              href={`/stories/${publishedSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 bg-[#C86A43] text-white text-sm font-semibold rounded-xl hover:bg-[#b05a35] transition-colors block"
            >
              View Story ↗
            </a>
            <button onClick={() => void handleShare()} className="w-full py-3 border border-[#E8E4DD] text-[#2D2A26] text-sm font-medium rounded-xl hover:border-[#C86A43]/40 hover:text-[#C86A43] transition-colors">
              {shared ? 'Link copied ✓' : 'Share Story'}
            </button>
          </>
        )}
        <button onClick={onContinuePublishing} className="w-full py-3 border border-[#E8E4DD] text-[#2D2A26] text-sm font-medium rounded-xl hover:border-[#C86A43]/40 hover:text-[#C86A43] transition-colors">
          Continue Publishing
        </button>
        <div className="flex justify-center">
          <CreateWithCuloCTA label="Create with CULO in Canva" />
        </div>
      </div>
    </div>
  )
}

function CelebrationRow({ count, label }: { count: number; label: string }) {
  return (
    <div>
      <p className="text-xl font-bold text-white">{count}</p>
      <p className="text-[11px] text-white/50">{label}</p>
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
  const [searchParams] = useSearchParams()
  // "Write about this partner" opens in a new tab (see DashboardPartnershipPage),
  // so it arrives via a ?partnerId= query param rather than router state, which
  // a fresh tab has no access to. "Turn into Story" still uses router state
  // since it navigates in the same tab.
  const partnerIdFromQuery = searchParams.get('partnerId') ?? undefined
  const aboutBusinessIdFromQuery = searchParams.get('aboutBusinessId') ?? undefined
  const [step,          setStep]          = useState<PublishStep>('format')
  const [draft,         setDraft]         = useState<PublishDraft>(() => {
    // Don't resurrect a stale wizard draft over a fresh "Turn into Story"/"Write about this partner" prefill.
    const navState = location.state as { importedContentId?: string; partnerId?: string } | null
    const base = defaultDraft(currentFounder?.id ?? '', currentFounder?.businessId ?? '')
    if (navState?.importedContentId || navState?.partnerId || partnerIdFromQuery || aboutBusinessIdFromQuery) {
      return base
    }
    // Merge over the defaults, not a bare replace — an autosaved draft from
    // before a field existed (e.g. additionalReelUrls) would otherwise come
    // back missing it entirely, which crashed Attach Media the moment a
    // video format (Reel/Talking Head/YouTube) tried to read
    // draft.additionalReelUrls.length on an undefined array.
    const saved = loadAutoSavedDraft()
    return saved ? { ...base, ...saved } : base
  })
  const [publishing,    setPublishing]    = useState(false)
  const [publishedSlug, setPublishedSlug] = useState('')
  const [publishError,  setPublishError]  = useState('')
  const [lastAction,    setLastAction]    = useState<'publish' | 'draft' | 'archive'>('publish')
  const [summary,       setSummary]       = useState<PublishSummary | null>(null)
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
    setDraft(prev => ({ ...prev, ...importedContentPatch(item, prev) }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Arrived via "Write about this partner" in Opportunities — pre-select
  // Blog and set the partner's real affiliate link as the story's CTA.
  useEffect(() => {
    const partnerId = (location.state as { partnerId?: string } | null)?.partnerId ?? partnerIdFromQuery
    if (!partnerId) return
    const partner = partnerService.get(partnerId)
    if (!partner) return
    setDraft(prev => ({
      ...prev,
      partnerId,
      contentTypes: prev.contentTypes.length > 0 ? prev.contentTypes : ['blog'],
      title: prev.title || `Why I recommend ${partner.name}`,
      ctaLabel: prev.ctaLabel || `Visit ${partner.name}`,
      ctaUrl: prev.ctaUrl || partner.affiliateUrl || partner.website || '',
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Arrived via "Write a blog about them" on an Opportunity the founder
  // marked as interested — same idea as the partner flow above, but the
  // business behind an Opportunity isn't necessarily an enrolled Partner
  // (no affiliate link to reuse), so this just points the CTA at their
  // public website instead.
  useEffect(() => {
    if (!aboutBusinessIdFromQuery) return
    const business = getBusiness(aboutBusinessIdFromQuery)
    if (!business) return
    setDraft(prev => ({
      ...prev,
      contentTypes: prev.contentTypes.length > 0 ? prev.contentTypes : ['blog'],
      title: prev.title || `Why I recommend ${business.name}`,
      ctaLabel: prev.ctaLabel || `Visit ${business.name}`,
      ctaUrl: prev.ctaUrl || business.website || '',
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Self-heal a draft whose founderId never got set — e.g. an auto-saved
  // localStorage draft from before the founder profile had finished loading
  // on a prior visit. Never overwrites an already-set founderId, and never
  // touches anything else the founder has typed.
  useEffect(() => {
    if (draft.founderId || !currentFounder) return
    setDraft(prev => prev.founderId ? prev : ({
      ...prev,
      founderId: currentFounder.id,
      businessId: prev.businessId || currentFounder.businessId || '',
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFounder])

  function patch(changes: Partial<PublishDraft>) {
    setDraft(prev => ({ ...prev, ...changes }))
  }

  const stepList = visibleSteps(draft.contentTypes)

  function next() {
    const idx = stepList.indexOf(step)
    if (idx < stepList.length - 1) setStep(stepList[idx + 1])
  }

  function back() {
    const idx = stepList.indexOf(step)
    if (idx > 0) setStep(stepList[idx - 1])
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

    const founder     = getFounders().find(f => f.id === draft.founderId)
    const loc         = locations.find(l => l.id === draft.locationId) ?? founder?.location ?? locations[0]!
    const industry    = founder?.industry ?? industries[0]!
    // Reuse the same Story id every time this draft is published again (a
    // re-click, or resuming an autosaved draft after a refresh) — otherwise
    // each attempt mints a fresh id and tries to insert a second row with
    // the same slug, which the database correctly rejects.
    const existingStory = draft.publishedStoryId ? getStory(draft.publishedStoryId) : undefined
    const titleSlug   = existingStory?.slug || slugify(draft.title) || `pub-${Date.now()}`
    const id          = draft.publishedStoryId || `pub-${Date.now()}`
    const status      = action === 'publish' ? 'published' as const
                      : action === 'archive' ? 'archived'  as const
                      : 'draft'              as const
    const ctaUrl      = draft.ctaUrl || draft.documentUrl || draft.contentUrl || ''
    const nowIso       = new Date().toISOString().split('T')[0]

    const story: Story = {
      id,
      slug:           titleSlug,
      title:          draft.title   || 'Untitled',
      subtitle:       draft.subtitle || undefined,
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
      additionalReelUrls: draft.additionalReelUrls.filter(Boolean).length > 0
                        ? draft.additionalReelUrls.filter(Boolean)
                        : existingStory?.additionalReelUrls,
      audioUrl:       draft.audioUrl || undefined,
      carouselImages: draft.carouselSlides.filter(Boolean).length > 0
                        ? draft.carouselSlides.filter(Boolean)
                        : undefined,
      ideaIds:        [],
      relatedStoryIds: [],
      importedContentId: draft.importedContentId,
      partnerId:      draft.partnerId,
      ctaLabel:       draft.ctaLabel,
      ctaUrl,
      status,
      featured:       false,
      publishingSource: draft.importedContentId ? 'website-import'
                      : (draft.reelUrl || draft.audioUrl || draft.documentUrl || draft.contentUrl || draft.carouselSlides.some(Boolean))
                          ? 'website-import'
                          : 'manual-dashboard',
      createdAt:      existingStory?.createdAt ?? nowIso,
      updatedAt:      nowIso,
    }

    const result = await publishStoryCore(story, {
      lessonsOverride: draft.lessonsOverride,
      questionsOverride: draft.questionsOverride,
      excludedFounderIds: draft.excludedFounderIds,
      excludedBusinessIds: draft.excludedBusinessIds,
      excludedContentIds: draft.excludedContentIds,
      extraFounderIds: draft.extraFounderIds,
      extraBusinessIds: draft.extraBusinessIds,
    })

    if (!result.success) {
      setPublishing(false)
      const raw = result.error ?? ''
      // A slug collision here almost always means this exact title was
      // already published (most often a double-click on "Publish to
      // Village") — that's not a failure the founder needs to troubleshoot,
      // it's confirmation the story already exists. Send them straight to
      // it instead of showing the raw database error.
      if (raw.toLowerCase().includes('slug') && raw.toLowerCase().includes('duplicate')) {
        const already = getStories().find(s => s.slug === titleSlug)
        if (already) {
          setDraft(prev => ({ ...prev, publishedStoryId: already.id }))
          localStorage.removeItem(DRAFT_AUTOSAVE_KEY)
          setPublishError('')
          setPublishedSlug(already.slug)
          setStep('done')
          return
        }
        setPublishError("Looks like this was already published under the same title. Try changing the title slightly, or refresh and check your Content list.")
        return
      }
      // Surfaced via the Preview step's publishError prop below.
      setPublishError(raw || 'Could not publish. Please try again.')
      return
    }

    setDraft(prev => ({ ...prev, publishedStoryId: result.story?.id ?? prev.publishedStoryId }))
    setSummary(result.summary ?? null)
    localStorage.removeItem(DRAFT_AUTOSAVE_KEY)
    setPublishError('')
    setPublishedSlug(titleSlug)
    setPublishing(false)
    setStep('done')
  }

  return (
    <div className="min-h-full p-8" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {step !== 'done' && (
        <div className="flex items-center justify-between mb-2">
          <ProgressBar
            step={step}
            steps={stepList}
            labels={isBlogOnly(draft.contentTypes) ? { ...STEP_LABELS, media: 'Write Blog' } : STEP_LABELS}
            onStepClick={setStep}
          />
          <p className="text-[11px] text-[#9CA3AF] shrink-0 ml-4">
            {autoSave === 'saving' && 'Saving…'}
            {autoSave === 'saved' && 'Saved just now'}
            {autoSave === 'error' && <span className="text-red-500">Save failed</span>}
          </p>
        </div>
      )}

      {step === 'format'  && <FormatStep       draft={draft} onChange={patch} onNext={next} />}
      {step === 'media'   && <MediaStep        draft={draft} onChange={patch} onNext={next} onBack={back} />}
      {step === 'story'   && <TellYourStoryStep draft={draft} onChange={patch} onNext={next} onBack={back} />}
      {step === 'builder' && <StoryBuilderStep  draft={draft} onChange={patch} onBack={back} onNext={next} />}
      {step === 'preview' && (
        <PreviewStep
          draft={draft}
          onChange={patch}
          onBack={back}
          onPublish={action => void handlePublish(action)}
          publishing={publishing}
          publishError={publishError}
        />
      )}
      {step === 'done' && (
        <DoneStep
          draft={draft}
          publishedSlug={publishedSlug}
          action={lastAction}
          summary={summary}
          onContinuePublishing={() => setStep('builder')}
        />
      )}
    </div>
  )
}
