import React, { useState, useId } from 'react'
import { usePageTitle } from '../utils/usePageTitle'
import { Link }                   from 'react-router-dom'
import { CheCuloToast }           from '../components/ui/CheCuloToast'
import { formatCheCuloSuccess }   from '../utils/checulo'
import { founders }               from '../data/founders'
import { businesses }             from '../data/businesses'
import { locations }              from '../data/locations'
import { industries }             from '../data/industries'
import { topics }                 from '../data/topics'
import { Badge }                  from '../components/ui/Badge'
import { InnerContainer }         from '../components/layout/PageContainer'
import { slugify, contentTypeLabel, formatDate } from '../utils/slugify'
import type { Story, ContentType } from '../types'

// ─── Form state types ──────────────────────────────────────────────────────────

interface FormValues {
  title:               string
  summary:             string
  coverImage:          string
  blog:                string
  reelUrl:             string
  carouselImageLines:  string   // one URL per line
  contentTypes:        ContentType[]
  founderId:           string
  businessId:          string
  locationId:          string
  industryId:          string
  topicIds:            string[]
  ctaLabel:            string
  ctaUrl:              string
}

type FormErrors = Partial<Record<keyof FormValues, string>>

const EMPTY_FORM: FormValues = {
  title:              '',
  summary:            '',
  coverImage:         '',
  blog:               '',
  reelUrl:            '',
  carouselImageLines: '',
  contentTypes:       [],
  founderId:          '',
  businessId:         '',
  locationId:         '',
  industryId:         '',
  topicIds:           [],
  ctaLabel:           '',
  ctaUrl:             '',
}

// ─── Validation ────────────────────────────────────────────────────────────────

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {}

  if (!values.title.trim())
    errors.title = 'Story title is required.'

  if (!values.summary.trim())
    errors.summary = 'Summary is required.'

  if (values.contentTypes.length === 0)
    errors.contentTypes = 'Select at least one content format.'

  if (values.contentTypes.includes('blog') && !values.blog.trim())
    errors.blog = 'Blog text is required when Blog format is selected.'

  if (values.contentTypes.includes('reel') && !values.reelUrl.trim())
    errors.reelUrl = 'Reel URL is required when Reel format is selected.'

  if (values.contentTypes.includes('carousel')) {
    const lines = values.carouselImageLines.split('\n').map(l => l.trim()).filter(Boolean)
    if (lines.length === 0)
      errors.carouselImageLines = 'At least one carousel image URL is required.'
  }

  if (!values.founderId)   errors.founderId   = 'Select a founder.'
  if (!values.businessId)  errors.businessId  = 'Select a business.'
  if (!values.locationId)  errors.locationId  = 'Select a location.'
  if (!values.industryId)  errors.industryId  = 'Select an industry.'

  if (values.topicIds.length === 0)
    errors.topicIds = 'Select at least one topic.'

  return errors
}

// ─── Shared input styles ────────────────────────────────────────────────────────

const inputClass = `
  w-full rounded-xl border border-border bg-surface text-charcoal px-4 py-3
  font-body text-base placeholder:text-muted
  focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
  transition-shadow duration-150
`

const selectClass = `
  w-full rounded-xl border border-border bg-surface text-charcoal px-4 py-3
  font-body text-base
  focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
  transition-shadow duration-150
  appearance-none cursor-pointer
`

// ─── FormField — labeled input/textarea ────────────────────────────────────────

interface FormFieldProps {
  label:       string
  htmlFor:     string
  error?:      string
  hint?:       string
  required?:   boolean
  children:    React.ReactNode
}

function FormField({ label, htmlFor, error, hint, required, children }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="font-body text-sm font-semibold text-charcoal">
        {label}
        {required && <span className="text-primary ml-1" aria-hidden="true">*</span>}
      </label>
      {hint && <p className="font-body text-xs text-muted">{hint}</p>}
      {children}
      {error && (
        <p role="alert" className="font-body text-xs text-red-600 flex items-center gap-1">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  )
}

// ─── Content type toggle cards ──────────────────────────────────────────────────

const contentTypeConfig: { type: ContentType; icon: React.ReactNode; description: string }[] = [
  {
    type: 'blog',
    description: 'A written article or long-form post',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    type: 'reel',
    description: 'A short vertical video (Instagram/TikTok)',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    type: 'carousel',
    description: 'A slide-by-slide image series',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
]

interface ContentTypeTogglesProps {
  selected: ContentType[]
  onChange: (types: ContentType[]) => void
  error?:   string
}

function ContentTypeToggles({ selected, onChange, error }: ContentTypeTogglesProps) {
  function toggle(type: ContentType) {
    onChange(
      selected.includes(type)
        ? selected.filter(t => t !== type)
        : [...selected, type]
    )
  }

  return (
    <fieldset>
      <legend className="font-body text-sm font-semibold text-charcoal mb-1.5">
        Content formats <span className="text-primary ml-0.5" aria-hidden="true">*</span>
      </legend>
      <p className="font-body text-xs text-muted mb-3">
        One story can have multiple formats — select all that apply.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" role="group" aria-label="Select content formats">
        {contentTypeConfig.map(({ type, icon, description }) => {
          const isSelected = selected.includes(type)
          return (
            <button
              key={type}
              type="button"
              role="checkbox"
              aria-checked={isSelected}
              onClick={() => toggle(type)}
              className={`
                flex flex-col items-start gap-2 p-4 rounded-xl border-2 text-left
                transition-all duration-150
                focus:outline-none focus-visible:ring-2 focus-visible:ring-primary
                ${isSelected
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border bg-surface text-muted hover:border-primary/40 hover:text-charcoal'
                }
              `}
            >
              <span className={isSelected ? 'text-primary' : 'text-muted'}>{icon}</span>
              <span className="font-body text-sm font-semibold text-charcoal">
                {contentTypeLabel(type)}
              </span>
              <span className="font-body text-xs text-muted leading-snug">{description}</span>
            </button>
          )
        })}
      </div>
      {error && (
        <p role="alert" className="font-body text-xs text-red-600 mt-2 flex items-center gap-1">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </fieldset>
  )
}

// ─── Topic multi-select ────────────────────────────────────────────────────────

interface TopicSelectorProps {
  selected: string[]
  onChange: (ids: string[]) => void
  error?:   string
}

function TopicSelector({ selected, onChange, error }: TopicSelectorProps) {
  function toggle(id: string) {
    onChange(
      selected.includes(id)
        ? selected.filter(t => t !== id)
        : [...selected, id]
    )
  }

  return (
    <fieldset>
      <legend className="font-body text-sm font-semibold text-charcoal mb-1.5">
        Topics <span className="text-primary ml-0.5" aria-hidden="true">*</span>
      </legend>
      <p className="font-body text-xs text-muted mb-3">Select all topics this story touches.</p>
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="Select topics"
      >
        {topics.map(t => {
          const isSelected = selected.includes(t.id)
          return (
            <button
              key={t.id}
              type="button"
              role="checkbox"
              aria-checked={isSelected}
              onClick={() => toggle(t.id)}
              className={`
                px-3 py-1.5 rounded-full text-sm font-medium font-body
                border transition-all duration-150
                focus:outline-none focus-visible:ring-2 focus-visible:ring-primary
                ${isSelected
                  ? 'bg-secondary text-white border-secondary'
                  : 'bg-surface text-muted border-border hover:border-secondary/40 hover:text-charcoal'
                }
              `}
            >
              {t.name}
            </button>
          )
        })}
      </div>
      {error && (
        <p role="alert" className="font-body text-xs text-red-600 mt-2 flex items-center gap-1">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </fieldset>
  )
}

// ─── Distribution preview (post-submit success) ────────────────────────────────

const DISTRIBUTION_ITEMS = [
  { icon: '📖', label: 'Stories page',       href: '/stories',     description: 'Discoverable by all Village visitors' },
  { icon: '👤', label: 'Your Founder profile', href: '/founders',  description: 'Appears under your published stories' },
  { icon: '🏢', label: 'Your Business profile', href: '/mercato',  description: 'Added to your business knowledge page' },
  { icon: '📍', label: 'Map & Location',      href: '/map',         description: 'Counted toward your city in the Village' },
  { icon: '🔍', label: 'Archive',             href: '/archive',     description: 'Searchable by title, topic, location and name' },
  { icon: '💡', label: 'Related Ideas',       href: '/ideas',       description: 'Future extraction into the knowledge graph' },
]

interface DistributionPreviewProps {
  story:         Story
  onPublishMore: () => void
  onViewStories: () => void
}

function DistributionPreview({ story, onPublishMore, onViewStories }: DistributionPreviewProps) {
  return (
    <div className="max-w-2xl">
      {/* Success header */}
      <div className="flex items-start gap-4 mb-8 p-6 bg-secondary/5 rounded-2xl border border-secondary/20">
        <div
          className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5"
          aria-hidden="true"
        >
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <h2 className="font-heading text-xl font-bold text-charcoal mb-1">
            <span className="text-primary">Che CULO!!</span> Your Story is live in the Village.
          </h2>
          <p className="font-body text-sm text-muted leading-relaxed">
            <strong className="text-charcoal">{story.title}</strong> is now part of the CULO Village
            knowledge graph. In the real Village, it would immediately be discoverable across every
            section below.
          </p>
        </div>
      </div>

      {/* Distribution list */}
      <h3 className="font-heading text-lg font-semibold text-charcoal mb-4">
        Your Story would now appear on:
      </h3>
      <ul className="space-y-3 mb-8" role="list">
        {DISTRIBUTION_ITEMS.map(item => (
          <li key={item.label}>
            <div className="flex items-start gap-3 p-4 bg-surface rounded-xl border border-border">
              <span className="text-lg leading-none mt-0.5 flex-shrink-0" aria-hidden="true">
                {item.icon}
              </span>
              <div className="min-w-0 flex-1">
                <Link
                  to={item.href}
                  className="font-body text-sm font-semibold text-charcoal hover:text-primary transition-colors"
                >
                  {item.label}
                </Link>
                <p className="font-body text-xs text-muted mt-0.5">{item.description}</p>
              </div>
              <svg className="w-4 h-4 text-muted flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </li>
        ))}
      </ul>

      {/* Story summary */}
      <div className="p-5 bg-background rounded-xl border border-border mb-8">
        <p className="font-body text-xs font-semibold text-muted uppercase tracking-wide mb-3">Published story</p>
        <h4 className="font-heading text-base font-semibold text-charcoal mb-1">{story.title}</h4>
        <p className="font-body text-sm text-muted mb-3">{story.summary}</p>
        <div className="flex flex-wrap gap-2">
          {story.contentTypes.map(t => (
            <Badge key={t} label={contentTypeLabel(t)} variant="neutral" />
          ))}
          {story.topics.map(t => (
            <Badge key={t.id} label={t.name} variant="secondary" />
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onPublishMore}
          className="px-6 py-3 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-[#b05a35] transition-colors"
        >
          Publish Another Story
        </button>
        <button
          onClick={onViewStories}
          className="px-6 py-3 border border-border text-charcoal text-sm font-medium rounded-xl hover:border-primary hover:text-primary transition-colors"
        >
          View My Stories
        </button>
      </div>
    </div>
  )
}

// ─── Submitted story card (My Stories tab) ─────────────────────────────────────

function SubmittedStoryCard({ story }: { story: Story }) {
  return (
    <article
      className="bg-surface rounded-2xl p-5 border border-border"
      aria-label={`Submitted story: ${story.title}`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-heading text-base font-semibold text-charcoal leading-snug">
          {story.title}
        </h3>
        <span className="flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold bg-secondary/10 text-secondary">
          {story.status}
        </span>
      </div>

      <p className="font-body text-sm text-muted leading-relaxed mb-4">{story.summary}</p>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-body text-muted mb-3">
        <span className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
          {story.location.name}, {story.location.state}
        </span>
        <time dateTime={story.createdAt}>{formatDate(story.createdAt)}</time>
      </div>

      {/* Formats + topics */}
      <div className="flex flex-wrap gap-2 mb-4">
        {story.contentTypes.map(t => (
          <Badge key={t} label={contentTypeLabel(t)} variant="neutral" />
        ))}
        {story.topics.map(t => (
          <Badge key={t.id} label={t.name} variant="secondary" />
        ))}
      </div>

      {/* CTA */}
      {story.ctaLabel && story.ctaUrl && story.ctaUrl !== '#' && (
        <p className="font-body text-xs text-muted mb-4">
          CTA: <a href={story.ctaUrl} target="_blank" rel="noopener noreferrer"
            className="text-primary hover:underline">{story.ctaLabel}</a>
        </p>
      )}

      {/* Village note */}
      <div className="p-3 bg-secondary/5 rounded-xl border border-secondary/15 text-xs font-body text-muted leading-relaxed">
        <strong className="text-secondary">Note:</strong> In the real Village, this story would now
        appear across Stories, Founder Profile, Business Profile, Map, Archive and related Ideas.
        This is a prototype — state resets on page refresh.
      </div>
    </article>
  )
}

// ─── My Stories tab ────────────────────────────────────────────────────────────

function MyStoriesTab({
  stories: submitted,
  onGoPublish,
}: {
  stories: Story[]
  onGoPublish: () => void
}) {
  if (submitted.length === 0) {
    return (
      <div className="py-16 text-center max-w-sm mx-auto">
        <div
          className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5"
          aria-hidden="true"
        >
          <svg className="w-7 h-7 text-primary/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
        </div>
        <h2 className="font-heading text-xl font-semibold text-charcoal mb-2">No stories yet</h2>
        <p className="font-body text-sm text-muted mb-6">
          Stories you publish in this session will appear here. Start by publishing your first story.
        </p>
        <button
          onClick={onGoPublish}
          className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-[#b05a35] transition-colors"
        >
          Publish a Story
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-xl font-semibold text-charcoal">
          My Stories <span className="font-body text-base font-normal text-muted">({submitted.length})</span>
        </h2>
        <button
          onClick={onGoPublish}
          className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-[#b05a35] transition-colors"
        >
          + Publish Another
        </button>
      </div>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-5" role="list">
        {submitted.map(s => (
          <li key={s.id}>
            <SubmittedStoryCard story={s} />
          </li>
        ))}
      </ul>
    </div>
  )
}

// ─── Publish form ──────────────────────────────────────────────────────────────

interface PublishFormProps {
  onSuccess: (story: Story) => void
}

function PublishForm({ onSuccess }: PublishFormProps) {
  const uid = useId()
  const [values, setValues] = useState<FormValues>(EMPTY_FORM)
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitted, setSubmitted] = useState(false)

  function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues(prev => ({ ...prev, [key]: value }))
    if (submitted) setErrors(prev => ({ ...prev, [key]: undefined }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)

    const errs = validate(values)
    setErrors(errs)

    if (Object.keys(errs).length > 0) {
      // Scroll to first error
      const firstErr = document.querySelector('[role="alert"]')
      firstErr?.closest('div')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    // Resolve full objects from IDs
    const location  = locations.find(l => l.id === values.locationId)!
    const industry  = industries.find(i => i.id === values.industryId)!
    const storyTopics = topics.filter(t => values.topicIds.includes(t.id))
    const carouselImages = values.carouselImageLines
      .split('\n').map(l => l.trim()).filter(Boolean)

    const today = new Date().toISOString().split('T')[0]

    const story: Story = {
      id:            `story-${Date.now()}`,
      slug:          slugify(values.title) || `story-${Date.now()}`,
      title:         values.title.trim(),
      summary:       values.summary.trim(),
      coverImage:    values.coverImage.trim() ||
                     'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80',
      founderId:     values.founderId,
      businessId:    values.businessId,
      location,
      industry,
      topics:        storyTopics,
      contentTypes:  values.contentTypes,
      blog:          values.blog.trim() || undefined,
      reelUrl:       values.reelUrl.trim() || undefined,
      carouselImages: carouselImages.length > 0 ? carouselImages : undefined,
      ideaIds:       [],
      relatedStoryIds: [],
      ctaLabel:      values.ctaLabel.trim() || 'Learn More',
      ctaUrl:        values.ctaUrl.trim()   || '#',
      status:        'published',
      featured:      false,
      createdAt:     today,
      updatedAt:     today,
    }

    onSuccess(story)
  }

  return (
    <form onSubmit={handleSubmit} noValidate aria-label="Publish a Story form">

      {/* Section: Story Content */}
      <section className="mb-10" aria-labelledby="section-content">
        <h2
          id="section-content"
          className="font-heading text-lg font-semibold text-charcoal mb-1"
        >
          Story content
        </h2>
        <p className="font-body text-sm text-muted mb-6">
          The core of your Story. This is what the Village will show and what search engines will index.
        </p>

        <div className="flex flex-col gap-5">
          <FormField label="Story title" htmlFor={`${uid}-title`} error={errors.title} required>
            <input
              id={`${uid}-title`}
              type="text"
              value={values.title}
              onChange={e => set('title', e.target.value)}
              placeholder="e.g. How I turned 3 months of footage into a content system"
              className={inputClass}
              aria-invalid={!!errors.title}
              aria-describedby={errors.title ? `${uid}-title-err` : undefined}
            />
          </FormField>

          <FormField
            label="Summary"
            htmlFor={`${uid}-summary`}
            error={errors.summary}
            hint="2–3 sentences. This appears on Story cards and in search results."
            required
          >
            <textarea
              id={`${uid}-summary`}
              value={values.summary}
              onChange={e => set('summary', e.target.value)}
              placeholder="A concise description of what this story is about and why it matters to founders."
              rows={3}
              className={inputClass}
              aria-invalid={!!errors.summary}
            />
          </FormField>

          <FormField
            label="Cover image URL"
            htmlFor={`${uid}-cover`}
            hint="Paste a direct image URL. Leave blank to use a default cover."
          >
            <input
              id={`${uid}-cover`}
              type="url"
              value={values.coverImage}
              onChange={e => set('coverImage', e.target.value)}
              placeholder="https://…"
              className={inputClass}
            />
          </FormField>
        </div>
      </section>

      {/* Section: Content Formats */}
      <section className="mb-10" aria-labelledby="section-formats">
        <h2
          id="section-formats"
          className="font-heading text-lg font-semibold text-charcoal mb-1"
        >
          Content formats
        </h2>
        <p className="font-body text-sm text-muted mb-6">
          One Story, multiple formats. Select everything this Story has been published as.
        </p>

        <div className="flex flex-col gap-6">
          <ContentTypeToggles
            selected={values.contentTypes}
            onChange={v => set('contentTypes', v)}
            error={errors.contentTypes}
          />

          {/* Conditional: Blog */}
          {values.contentTypes.includes('blog') && (
            <FormField
              label="Blog content"
              htmlFor={`${uid}-blog`}
              error={errors.blog}
              hint="The full text of your blog post. Plain text or basic markdown (## headings, **bold**, - lists)."
              required
            >
              <textarea
                id={`${uid}-blog`}
                value={values.blog}
                onChange={e => set('blog', e.target.value)}
                placeholder="## Your heading&#10;&#10;Your blog content here…"
                rows={8}
                className={`${inputClass} font-mono text-sm`}
                aria-invalid={!!errors.blog}
              />
            </FormField>
          )}

          {/* Conditional: Reel */}
          {values.contentTypes.includes('reel') && (
            <FormField
              label="Reel URL"
              htmlFor={`${uid}-reel`}
              error={errors.reelUrl}
              hint="The direct URL to your reel on Instagram, TikTok or another platform."
              required
            >
              <input
                id={`${uid}-reel`}
                type="url"
                value={values.reelUrl}
                onChange={e => set('reelUrl', e.target.value)}
                placeholder="https://instagram.com/reel/…"
                className={inputClass}
                aria-invalid={!!errors.reelUrl}
              />
            </FormField>
          )}

          {/* Conditional: Carousel */}
          {values.contentTypes.includes('carousel') && (
            <FormField
              label="Carousel image URLs"
              htmlFor={`${uid}-carousel`}
              error={errors.carouselImageLines}
              hint="One image URL per line, in slide order."
              required
            >
              <textarea
                id={`${uid}-carousel`}
                value={values.carouselImageLines}
                onChange={e => set('carouselImageLines', e.target.value)}
                placeholder={"https://…slide-1.jpg\nhttps://…slide-2.jpg\nhttps://…slide-3.jpg"}
                rows={5}
                className={`${inputClass} font-mono text-sm`}
                aria-invalid={!!errors.carouselImageLines}
              />
            </FormField>
          )}
        </div>
      </section>

      {/* Section: Who's Publishing */}
      <section className="mb-10" aria-labelledby="section-who">
        <h2
          id="section-who"
          className="font-heading text-lg font-semibold text-charcoal mb-1"
        >
          Who's publishing
        </h2>
        <p className="font-body text-sm text-muted mb-6">
          Connect this Story to the founder and business behind it.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <FormField label="Founder" htmlFor={`${uid}-founder`} error={errors.founderId} required>
            <div className="relative">
              <select
                id={`${uid}-founder`}
                value={values.founderId}
                onChange={e => set('founderId', e.target.value)}
                className={selectClass}
                aria-invalid={!!errors.founderId}
              >
                <option value="">Select a founder…</option>
                {founders.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </FormField>

          <FormField label="Business" htmlFor={`${uid}-business`} error={errors.businessId} required>
            <div className="relative">
              <select
                id={`${uid}-business`}
                value={values.businessId}
                onChange={e => set('businessId', e.target.value)}
                className={selectClass}
                aria-invalid={!!errors.businessId}
              >
                <option value="">Select a business…</option>
                {businesses.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </FormField>
        </div>
      </section>

      {/* Section: Where & What */}
      <section className="mb-10" aria-labelledby="section-context">
        <h2
          id="section-context"
          className="font-heading text-lg font-semibold text-charcoal mb-1"
        >
          Where &amp; what
        </h2>
        <p className="font-body text-sm text-muted mb-6">
          Metadata that connects your Story to the Village knowledge graph.
        </p>

        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label="Location" htmlFor={`${uid}-location`} error={errors.locationId} required>
              <div className="relative">
                <select
                  id={`${uid}-location`}
                  value={values.locationId}
                  onChange={e => set('locationId', e.target.value)}
                  className={selectClass}
                  aria-invalid={!!errors.locationId}
                >
                  <option value="">Select a location…</option>
                  {locations.map(l => (
                    <option key={l.id} value={l.id}>{l.name}, {l.state}</option>
                  ))}
                </select>
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </FormField>

            <FormField label="Industry" htmlFor={`${uid}-industry`} error={errors.industryId} required>
              <div className="relative">
                <select
                  id={`${uid}-industry`}
                  value={values.industryId}
                  onChange={e => set('industryId', e.target.value)}
                  className={selectClass}
                  aria-invalid={!!errors.industryId}
                >
                  <option value="">Select an industry…</option>
                  {industries.map(i => (
                    <option key={i.id} value={i.id}>{i.name}</option>
                  ))}
                </select>
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </FormField>
          </div>

          <TopicSelector
            selected={values.topicIds}
            onChange={v => set('topicIds', v)}
            error={errors.topicIds}
          />
        </div>
      </section>

      {/* Section: CTA */}
      <section className="mb-10" aria-labelledby="section-cta">
        <h2
          id="section-cta"
          className="font-heading text-lg font-semibold text-charcoal mb-1"
        >
          Call to action
        </h2>
        <p className="font-body text-sm text-muted mb-6">
          Where should readers go after reading this Story? Optional but recommended.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <FormField label="CTA label" htmlFor={`${uid}-cta-label`}>
            <input
              id={`${uid}-cta-label`}
              type="text"
              value={values.ctaLabel}
              onChange={e => set('ctaLabel', e.target.value)}
              placeholder="e.g. Book a Session"
              className={inputClass}
            />
          </FormField>

          <FormField label="CTA URL" htmlFor={`${uid}-cta-url`}>
            <input
              id={`${uid}-cta-url`}
              type="url"
              value={values.ctaUrl}
              onChange={e => set('ctaUrl', e.target.value)}
              placeholder="https://…"
              className={inputClass}
            />
          </FormField>
        </div>
      </section>

      {/* Submit */}
      <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <button
          type="submit"
          className="px-8 py-4 bg-primary text-white text-base font-semibold rounded-xl hover:bg-[#b05a35] transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          Publish to Village
        </button>
        {submitted && Object.keys(errors).length > 0 && (
          <p role="alert" className="font-body text-sm text-red-600 flex items-center gap-1.5">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Please fix the errors above before publishing.
          </p>
        )}
      </div>
    </form>
  )
}

// ─── Piazza Page ───────────────────────────────────────────────────────────────

type ActiveTab    = 'publish' | 'my-stories'
type PublishState = 'form'    | 'success'

export function PiazzaPage() {
  usePageTitle('Piazza')
  const [activeTab,    setActiveTab]    = useState<ActiveTab>('publish')
  const [publishState, setPublishState] = useState<PublishState>('form')
  const [lastStory,    setLastStory]    = useState<Story | null>(null)
  const [myStories,    setMyStories]    = useState<Story[]>([])
  const [toastVisible, setToastVisible] = useState(false)

  function handleSuccess(story: Story) {
    setLastStory(story)
    setMyStories(prev => [story, ...prev])
    setPublishState('success')
    setToastVisible(true)
  }

  function handlePublishMore() {
    setPublishState('form')
  }

  function handleViewMyStories() {
    setPublishState('form')
    setActiveTab('my-stories')
  }

  function handleGoPublish() {
    setPublishState('form')
    setActiveTab('publish')
  }

  return (
    <main className="min-h-screen bg-background">

      {/* ── Che CULO success toast ───────────────────────────────────────────── */}
      <CheCuloToast
        message={formatCheCuloSuccess()}
        visible={toastVisible}
        onClose={() => setToastVisible(false)}
        variant="success"
      />

      {/* ── Page hero ───────────────────────────────────────────────────────── */}
      <section
        className="bg-surface border-b border-border pt-24 pb-10"
        aria-labelledby="piazza-heading"
      >
        <InnerContainer>
          <div className="max-w-2xl">
            <p className="font-body text-xs font-semibold text-primary uppercase tracking-widest mb-3">
              CULO Village
            </p>
            <h1
              id="piazza-heading"
              className="font-heading text-4xl sm:text-5xl font-bold text-charcoal mb-4 leading-tight"
            >
              Piazza
            </h1>
            <p className="font-body text-lg text-muted leading-relaxed mb-4">
              Piazza is where finished Stories enter the Village. Create in CULO. Publish here.
              Be discovered for what you know.
            </p>
            <p className="font-body text-sm text-muted leading-relaxed">
              When you publish a Story, it doesn't just go on one page. It flows across your Founder
              profile, your Business profile, the Stories archive, the Map, the knowledge graph and
              every related Idea — automatically, permanently, for free.
            </p>
          </div>
        </InnerContainer>
      </section>

      {/* ── Tab bar ─────────────────────────────────────────────────────────── */}
      <div
        className="bg-surface border-b border-border sticky top-16 z-30 shadow-sm"
      >
        <InnerContainer>
          <div
            className="flex"
            role="tablist"
            aria-label="Piazza sections"
          >
            {([
              { key: 'publish',    label: 'Publish a Story'                                       },
              { key: 'my-stories', label: `My Stories${myStories.length > 0 ? ` (${myStories.length})` : ''}` },
            ] as { key: ActiveTab; label: string }[]).map(({ key, label }) => (
              <button
                key={key}
                role="tab"
                id={`piazza-tab-${key}`}
                aria-selected={activeTab === key}
                aria-controls={`piazza-panel-${key}`}
                onClick={() => { setActiveTab(key); if (key === 'publish' && publishState === 'success') setPublishState('form') }}
                className={`
                  px-5 py-4 text-sm font-medium font-body border-b-2
                  transition-colors duration-150
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary
                  ${activeTab === key
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted hover:text-charcoal'
                  }
                `}
              >
                {label}
              </button>
            ))}
          </div>
        </InnerContainer>
      </div>

      {/* ── Tab panels ──────────────────────────────────────────────────────── */}
      <div className="py-12 md:py-16">
        <InnerContainer>

          {/* Publish a Story panel */}
          <div
            role="tabpanel"
            id="piazza-panel-publish"
            aria-labelledby="piazza-tab-publish"
            hidden={activeTab !== 'publish'}
          >
            <div className="max-w-2xl">
              {publishState === 'success' && lastStory ? (
                <DistributionPreview
                  story={lastStory}
                  onPublishMore={handlePublishMore}
                  onViewStories={handleViewMyStories}
                />
              ) : (
                <PublishForm onSuccess={handleSuccess} />
              )}
            </div>
          </div>

          {/* My Stories panel */}
          <div
            role="tabpanel"
            id="piazza-panel-my-stories"
            aria-labelledby="piazza-tab-my-stories"
            hidden={activeTab !== 'my-stories'}
          >
            <MyStoriesTab stories={myStories} onGoPublish={handleGoPublish} />
          </div>

        </InnerContainer>
      </div>

    </main>
  )
}
