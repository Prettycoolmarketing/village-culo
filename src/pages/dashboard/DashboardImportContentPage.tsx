import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { getFounders } from '../../services/founders'
import { getBusinesses } from '../../services/businesses'
import {
  importedContentService,
  buildDraftImport,
  detectPlatform,
  PLATFORM_LABELS,
  PLATFORM_COLORS,
} from '../../services/importedContent'
import {
  enrichImportedContent,
  applyEnrichment,
} from '../../services/importedContentEnrichment'
import {
  villageContentIntelligenceService,
  importedContentToInput,
} from '../../services/villageIntelligence'
import type {
  ImportedContent,
  ImportedContentStatus,
  ImportedContentVisibility,
} from '../../types/importedContent'
import type { VillageContentIntelligence } from '../../types/villageIntelligence'

// ─── Constants ────────────────────────────────────────────────────────────────

const EMBEDDABLE = new Set(['youtube', 'vimeo', 'tiktok'])

const STATUS_OPTIONS: { value: ImportedContentStatus; label: string }[] = [
  { value: 'draft',     label: 'Draft'     },
  { value: 'published', label: 'Published' },
  { value: 'featured',  label: 'Featured'  },
  { value: 'archived',  label: 'Archived'  },
]

const VISIBILITY_OPTIONS: { value: ImportedContentVisibility; label: string; note: string }[] = [
  { value: 'private',      label: 'Private',      note: 'Only you can see this'             },
  { value: 'discoverable', label: 'Discoverable', note: 'Appears in search and topic pages' },
  { value: 'public',       label: 'Public',       note: 'Shown on your profile'             },
]

const TRANSCRIPT_STATUS_OPTIONS = [
  { value: 'none',        label: 'No transcript'                         },
  { value: 'manual',      label: 'Pasted manually'                       },
  { value: 'unavailable', label: 'Not available for this content/platform' },
]

// ─── Small display components ─────────────────────────────────────────────────

function PlatformBadge({ platform }: { platform: string }) {
  return (
    <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${PLATFORM_COLORS[platform as keyof typeof PLATFORM_COLORS] ?? 'bg-[#F3EDE6] text-[#9CA3AF]'}`}>
      {PLATFORM_LABELS[platform as keyof typeof PLATFORM_LABELS] ?? platform}
    </span>
  )
}

function EmbedPreview({ content }: { content: ImportedContent }) {
  const canEmbed = EMBEDDABLE.has(content.sourcePlatform) && !!content.embedUrl
  if (canEmbed) {
    return (
      <div className="relative w-full rounded-lg overflow-hidden bg-black" style={{ paddingTop: '56.25%' }}>
        <iframe
          src={content.embedUrl}
          title={content.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      </div>
    )
  }
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#F8F5F0] border border-[#E8E4DD]">
      <PlatformBadge platform={content.sourcePlatform} />
      <span className="text-xs text-[#6B7280] truncate flex-1">{content.originalUrl}</span>
      <a href={content.originalUrl} target="_blank" rel="noopener noreferrer"
         className="text-xs text-[#C86A43] hover:underline shrink-0">
        View ↗
      </a>
    </div>
  )
}

// ─── Village Intelligence Preview ────────────────────────────────────────────

function VillageIntelligencePreview({ draft }: { draft: ImportedContent }) {
  const [open, setOpen] = useState(false)
  const [intel, setIntel] = useState<VillageContentIntelligence | null>(null)
  const [analysing, setAnalysing] = useState(false)

  useEffect(() => {
    const existing = villageContentIntelligenceService.getByContent('imported', draft.id)
    if (existing) setIntel(existing)
  }, [draft.id])

  function handleAnalyse() {
    setAnalysing(true)
    const input = importedContentToInput(draft)
    const result = villageContentIntelligenceService.analyse(input)
    villageContentIntelligenceService.upsert(result)
    setIntel(result)
    setAnalysing(false)
    if (!open) setOpen(true)
  }

  const Chip = ({ label, color = 'bg-[#F3EDE6] text-[#6B7280]' }: { label: string; color?: string }) => (
    <span className={`text-[10px] px-2 py-0.5 rounded-full ${color}`}>{label}</span>
  )

  const Section = ({ title, items, color }: { title: string; items: string[]; color?: string }) =>
    items.length > 0 ? (
      <div className="mb-3">
        <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wide mb-1.5">{title}</p>
        <div className="flex flex-wrap gap-1.5">
          {items.map(item => <Chip key={item} label={item} color={color} />)}
        </div>
      </div>
    ) : null

  return (
    <div className="border-t border-[#E8E4DD] pt-4 mt-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOpen(o => !o)}
            className="text-xs font-semibold text-[#2D2A26] flex items-center gap-1"
          >
            <span className={`inline-block transition-transform ${open ? 'rotate-90' : ''}`}>›</span>
            Village Intelligence
            {intel && <span className="font-normal text-[#9CA3AF] ml-1">— {intel.primaryTopics.length} topics · {intel.intent}</span>}
          </button>
        </div>
        <button
          type="button"
          onClick={handleAnalyse}
          disabled={analysing}
          className="px-3 py-1.5 text-[10px] font-semibold border border-[#E8E4DD] text-[#6B7280] rounded-lg hover:border-[#C86A43] hover:text-[#C86A43] transition-colors disabled:opacity-50"
        >
          {analysing ? 'Analysing…' : intel ? 'Re-analyse' : 'Analyse Content'}
        </button>
      </div>

      {open && intel && (
        <div className="bg-[#F8F5F0] rounded-lg p-4 mt-2 space-y-1">
          {/* Intent / Stage / Tone */}
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-[#C86A43]/15 text-[#C86A43]">{intel.intent}</span>
            <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-[#2D2A26]/10 text-[#2D2A26]">{intel.contentStage}</span>
            <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-[#D6A94D]/20 text-amber-700">{intel.emotionalTone}</span>
          </div>

          <Section title="Primary Topics" items={intel.primaryTopics} color="bg-[#5E6B4A]/10 text-[#5E6B4A]" />
          <Section title="Industries" items={intel.industries} />
          <Section title="People" items={intel.people} />
          <Section title="Businesses" items={intel.businesses} />
          <Section title="Software" items={intel.software} />

          {intel.lessons.length > 0 && (
            <div className="mb-3">
              <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wide mb-1.5">Lessons</p>
              <ul className="space-y-1">
                {intel.lessons.slice(0, 3).map((l, i) => (
                  <li key={i} className="text-[10px] text-[#6B7280] leading-relaxed pl-2 border-l border-[#E8E4DD]">{l}</li>
                ))}
              </ul>
            </div>
          )}

          {intel.problems.length > 0 && (
            <div className="mb-3">
              <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wide mb-1.5">Problems</p>
              <ul className="space-y-1">
                {intel.problems.slice(0, 2).map((p, i) => (
                  <li key={i} className="text-[10px] text-[#6B7280] leading-relaxed pl-2 border-l border-[#E8E4DD]">{p}</li>
                ))}
              </ul>
            </div>
          )}

          {intel.solutions.length > 0 && (
            <div className="mb-3">
              <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wide mb-1.5">Solutions</p>
              <ul className="space-y-1">
                {intel.solutions.slice(0, 2).map((s, i) => (
                  <li key={i} className="text-[10px] text-[#6B7280] leading-relaxed pl-2 border-l border-[#E8E4DD]">{s}</li>
                ))}
              </ul>
            </div>
          )}

          {intel.searchQuestions.length > 0 && (
            <div className="mb-3">
              <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wide mb-1.5">Search Questions</p>
              <ul className="space-y-0.5">
                {intel.searchQuestions.slice(0, 3).map((q, i) => (
                  <li key={i} className="text-[10px] text-[#6B7280] italic">{q}</li>
                ))}
              </ul>
            </div>
          )}

          {intel.geoQuestions.length > 0 && (
            <div className="mb-3">
              <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wide mb-1.5">GEO Questions</p>
              <ul className="space-y-0.5">
                {intel.geoQuestions.slice(0, 3).map((q, i) => (
                  <li key={i} className="text-[10px] text-[#6B7280] italic">{q}</li>
                ))}
              </ul>
            </div>
          )}

          {intel.relatedContentIds.length > 0 && (
            <p className="text-[10px] text-[#9CA3AF]">
              {intel.relatedContentIds.length} related piece{intel.relatedContentIds.length !== 1 ? 's' : ''} found in Village
            </p>
          )}

          <p className="text-[9px] text-[#C4BDB4] pt-1">
            Analysed {new Date(intel.generatedAt).toLocaleDateString('en-AU')} · Engine v{intel.engineVersion}
          </p>
        </div>
      )}

      {open && !intel && (
        <p className="text-xs text-[#9CA3AF] mt-2 px-1">Click "Analyse Content" to generate intelligence for this item.</p>
      )}
    </div>
  )
}

// ─── EditForm ─────────────────────────────────────────────────────────────────

interface EditFormProps {
  draft: ImportedContent
  onChange: (updated: ImportedContent) => void
  onSave: () => void
  onCancel: () => void
}

function EditForm({ draft, onChange, onSave, onCancel }: EditFormProps) {
  const businesses = getBusinesses()
  const [transcriptFlash, setTranscriptFlash] = useState(false)

  function field<K extends keyof ImportedContent>(key: K, value: ImportedContent[K]) {
    onChange({ ...draft, [key]: value })
  }

  function parseList(raw: string): string[] {
    return raw.split(',').map(s => s.trim()).filter(Boolean)
  }

  function handleSaveTranscript() {
    onChange({
      ...draft,
      transcriptStatus:     'manual',
      transcriptSource:     'manual',
      transcriptImportedAt: new Date().toISOString(),
    })
    setTranscriptFlash(true)
    setTimeout(() => setTranscriptFlash(false), 2000)
  }

  function handleClearTranscript() {
    onChange({
      ...draft,
      transcriptText:        undefined,
      transcriptStatus:      'none',
      transcriptSource:      undefined,
      transcriptImportedAt:  undefined,
    })
  }

  function handleGenerate() {
    const result = enrichImportedContent(draft)
    onChange(applyEnrichment(draft, result))
  }

  function handleClearDiary() {
    onChange({
      ...draft,
      diaryNote:           undefined,
      autoSummary:         undefined,
      keyMoments:          undefined,
      peopleMentions:      undefined,
      businessMentions:    undefined,
      suggestedTopics:     undefined,
      suggestedLocations:  undefined,
      diaryGeneratedAt:    undefined,
      diaryGenerationMode: undefined,
    })
  }

  function addTopic(t: string) {
    if (!draft.topics.includes(t)) onChange({ ...draft, topics: [...draft.topics, t] })
  }

  function addLocation(l: string) {
    if (!draft.locations.includes(l)) onChange({ ...draft, locations: [...draft.locations, l] })
  }

  const INPUT = 'w-full px-3 py-2 text-sm border border-[#E8E4DD] rounded-lg focus:outline-none focus:border-[#C86A43]'
  const TEXTAREA = `${INPUT} resize-none`
  const SELECT = `${INPUT} bg-white`

  const hasSuggestedTopics    = (draft.suggestedTopics?.length ?? 0) > 0
  const hasSuggestedLocations = (draft.suggestedLocations?.length ?? 0) > 0

  return (
    <div className="bg-white rounded-xl border border-[#E8E4DD] p-5">

      {/* Platform + URL */}
      <div className="flex items-center gap-2 mb-5">
        <PlatformBadge platform={draft.sourcePlatform} />
        <span className="text-xs text-[#9CA3AF] truncate">{draft.originalUrl}</span>
      </div>

      {/* Embed preview */}
      <div className="mb-5">
        <EmbedPreview content={draft} />
      </div>

      {/* Title */}
      <div className="mb-4">
        <label className="block text-xs font-semibold text-[#2D2A26] mb-1">Title</label>
        <input type="text" value={draft.title}
          onChange={e => field('title', e.target.value)}
          className={INPUT} placeholder="Title for this imported piece" />
      </div>

      {/* Description */}
      <div className="mb-4">
        <label className="block text-xs font-semibold text-[#2D2A26] mb-1">Description</label>
        <textarea value={draft.description ?? ''}
          onChange={e => field('description', e.target.value || undefined)}
          rows={3} className={TEXTAREA} placeholder="Short description of this content" />
      </div>

      {/* Thumbnail URL */}
      <div className="mb-4">
        <label className="block text-xs font-semibold text-[#2D2A26] mb-1">
          Thumbnail URL <span className="font-normal text-[#9CA3AF]">— paste a direct image URL</span>
        </label>
        <input type="url" value={draft.thumbnailUrl ?? ''}
          onChange={e => field('thumbnailUrl', e.target.value || undefined)}
          className={INPUT} placeholder="https://..." />
      </div>

      {/* Business + Published At */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-xs font-semibold text-[#2D2A26] mb-1">Related Business</label>
          <select value={draft.businessId ?? ''}
            onChange={e => field('businessId', e.target.value || undefined)}
            className={SELECT}>
            <option value="">None</option>
            {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#2D2A26] mb-1">Original Publish Date</label>
          <input type="date" value={draft.publishedAt ? draft.publishedAt.slice(0, 10) : ''}
            onChange={e => field('publishedAt', e.target.value || undefined)}
            className={INPUT} />
        </div>
      </div>

      {/* ── Transcript section ─────────────────────────────────────────────── */}
      <div className="border-t border-[#E8E4DD] pt-5 mt-1 mb-1">
        <p className="text-sm font-semibold text-[#2D2A26] mb-1">Transcript</p>
        <p className="text-xs text-[#9CA3AF] mb-4 leading-relaxed">
          Paste a transcript to unlock richer diary generation. On YouTube, click ··· below any video → <em>Show transcript</em> → copy and paste here.
        </p>

        {/* Status selector */}
        <div className="mb-3">
          <label className="block text-xs font-semibold text-[#2D2A26] mb-1">Transcript Status</label>
          <select
            value={draft.transcriptStatus ?? 'none'}
            onChange={e => onChange({ ...draft, transcriptStatus: e.target.value as ImportedContent['transcriptStatus'] })}
            className={SELECT}
          >
            {TRANSCRIPT_STATUS_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Transcript textarea — shown when status is manual */}
        {(draft.transcriptStatus === 'manual' || draft.transcriptStatus === 'available' || draft.transcriptStatus === 'generated') && (
          <div className="mb-3">
            <textarea
              value={draft.transcriptText ?? ''}
              onChange={e => onChange({ ...draft, transcriptText: e.target.value || undefined })}
              rows={9}
              className={`${TEXTAREA} font-mono text-xs`}
              placeholder="Paste transcript text here..."
            />
            {draft.transcriptText && (
              <p className="text-[10px] text-[#9CA3AF] mt-1">
                {draft.transcriptText.trim().split(/\s+/).length.toLocaleString()} words
              </p>
            )}
          </div>
        )}

        {/* Transcript actions */}
        <div className="flex items-center gap-3">
          {draft.transcriptStatus !== 'unavailable' && (
            <button
              type="button"
              onClick={handleSaveTranscript}
              className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                transcriptFlash
                  ? 'border-[#5E6B4A]/40 bg-[#5E6B4A]/10 text-[#5E6B4A]'
                  : 'border-[#E8E4DD] text-[#6B7280] hover:border-[#C86A43] hover:text-[#C86A43]'
              }`}
            >
              {transcriptFlash ? '✓ Transcript saved' : 'Save Transcript'}
            </button>
          )}
          {draft.transcriptText && (
            <button type="button" onClick={handleClearTranscript}
              className="text-xs text-[#9CA3AF] hover:text-red-500 transition-colors">
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Auto Diary Engine ──────────────────────────────────────────────── */}
      <div className="border-t border-[#E8E4DD] pt-5 mt-4 mb-1">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm font-semibold text-[#2D2A26]">Auto Diary Engine</p>
            {draft.diaryGenerationMode && (
              <p className="text-[10px] text-[#9CA3AF] mt-0.5">
                {draft.diaryGenerationMode === 'transcript'
                  ? '✓ Generated from transcript'
                  : draft.diaryGenerationMode === 'metadata'
                  ? 'Generated from title and description only'
                  : 'Written manually'}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-4">
            <button
              type="button"
              onClick={handleGenerate}
              className="px-4 py-2 bg-[#2D2A26] text-white text-xs font-semibold rounded-lg hover:bg-[#1a1815] transition-colors"
            >
              {draft.diaryGeneratedAt ? 'Regenerate' : 'Generate Diary'}
            </button>
            {draft.diaryGeneratedAt && (
              <button type="button" onClick={handleClearDiary}
                className="text-xs text-[#9CA3AF] hover:text-red-500 transition-colors">
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Metadata-only warning */}
        {draft.diaryGenerationMode === 'metadata' && (
          <div className="mb-4 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-700 leading-relaxed">
              This diary was generated from limited metadata. Please review before publishing.
            </p>
          </div>
        )}

        {/* Auto summary */}
        {draft.autoSummary && (
          <div className="mb-4 bg-[#F8F5F0] rounded-lg px-4 py-3">
            <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wide mb-1">Auto Summary</p>
            <p className="text-xs text-[#6B7280] leading-relaxed">{draft.autoSummary}</p>
          </div>
        )}

        {/* Key moments */}
        {draft.keyMoments && draft.keyMoments.length > 0 && (
          <div className="mb-4">
            <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wide mb-2">Key Moments from Transcript</p>
            <ul className="space-y-2">
              {draft.keyMoments.map((m, i) => (
                <li key={i} className="text-xs text-[#6B7280] leading-relaxed pl-3 border-l-2 border-[#E8E4DD]">
                  {m}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* People + business mentions */}
        {((draft.peopleMentions?.length ?? 0) > 0 || (draft.businessMentions?.length ?? 0) > 0) && (
          <div className="mb-4 flex flex-wrap gap-5">
            {draft.peopleMentions && draft.peopleMentions.length > 0 && (
              <div>
                <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wide mb-1.5">People Mentioned</p>
                <div className="flex flex-wrap gap-1.5">
                  {draft.peopleMentions.map(p => (
                    <span key={p} className="text-[10px] px-2 py-0.5 rounded-full bg-[#F3EDE6] text-[#6B7280]">{p}</span>
                  ))}
                </div>
              </div>
            )}
            {draft.businessMentions && draft.businessMentions.length > 0 && (
              <div>
                <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wide mb-1.5">Businesses Mentioned</p>
                <div className="flex flex-wrap gap-1.5">
                  {draft.businessMentions.map(b => (
                    <span key={b} className="text-[10px] px-2 py-0.5 rounded-full bg-[#5E6B4A]/10 text-[#5E6B4A]">{b}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Diary note — editable output */}
        <div>
          <label className="block text-xs font-semibold text-[#2D2A26] mb-1">
            Diary Note
            <span className="font-normal text-[#9CA3AF] ml-1">— edit before publishing</span>
          </label>
          <textarea
            value={draft.diaryNote ?? ''}
            onChange={e => onChange({
              ...draft,
              diaryNote: e.target.value || undefined,
              diaryGenerationMode: draft.diaryGeneratedAt ? draft.diaryGenerationMode : 'manual',
            })}
            rows={5}
            className={TEXTAREA}
            placeholder={draft.diaryGeneratedAt
              ? 'Edit the generated diary note here.'
              : 'Click Generate Diary to auto-create a diary entry, or write your own reflection.'}
          />
        </div>
      </div>

      {/* ── Suggested tags ─────────────────────────────────────────────────── */}
      {(hasSuggestedTopics || hasSuggestedLocations) && (
        <div className="border-t border-[#E8E4DD] pt-4 mt-4">
          <p className="text-xs font-semibold text-[#2D2A26] mb-0.5">Suggested Tags</p>
          <p className="text-[10px] text-[#9CA3AF] mb-3">Click to add to your topics and locations below</p>

          {hasSuggestedTopics && (
            <div className="mb-3">
              <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wide mb-1.5">Topics</p>
              <div className="flex flex-wrap gap-1.5">
                {draft.suggestedTopics!.map(t => {
                  const added = draft.topics.includes(t)
                  return (
                    <button key={t} type="button"
                      onClick={() => addTopic(t)} disabled={added}
                      className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                        added
                          ? 'border-[#5E6B4A]/40 bg-[#5E6B4A]/10 text-[#5E6B4A] cursor-default'
                          : 'border-[#E8E4DD] text-[#6B7280] hover:border-[#C86A43] hover:text-[#C86A43]'
                      }`}>
                      {added ? '✓ ' : '+ '}{t}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {hasSuggestedLocations && (
            <div>
              <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wide mb-1.5">Locations</p>
              <div className="flex flex-wrap gap-1.5">
                {draft.suggestedLocations!.map(l => {
                  const added = draft.locations.includes(l)
                  return (
                    <button key={l} type="button"
                      onClick={() => addLocation(l)} disabled={added}
                      className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                        added
                          ? 'border-[#5E6B4A]/40 bg-[#5E6B4A]/10 text-[#5E6B4A] cursor-default'
                          : 'border-[#E8E4DD] text-[#6B7280] hover:border-[#C86A43] hover:text-[#C86A43]'
                      }`}>
                      {added ? '✓ ' : '+ '}{l}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Village Intelligence Preview ───────────────────────────────────── */}
      <VillageIntelligencePreview draft={draft} />

      {/* ── Publishing fields ──────────────────────────────────────────────── */}
      <div className="border-t border-[#E8E4DD] pt-5 mt-4">

        {/* Topics + Locations */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-semibold text-[#2D2A26] mb-1">
              Topics <span className="font-normal text-[#9CA3AF]">comma-separated</span>
            </label>
            <input type="text" value={draft.topics.join(', ')}
              onChange={e => field('topics', parseList(e.target.value))}
              className={INPUT} placeholder="e.g. marketing, content, strategy" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#2D2A26] mb-1">
              Locations <span className="font-normal text-[#9CA3AF]">comma-separated</span>
            </label>
            <input type="text" value={draft.locations.join(', ')}
              onChange={e => field('locations', parseList(e.target.value))}
              className={INPUT} placeholder="e.g. Sydney, Melbourne" />
          </div>
        </div>

        {/* Status + Visibility */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-xs font-semibold text-[#2D2A26] mb-1">Status</label>
            <select value={draft.status}
              onChange={e => field('status', e.target.value as ImportedContentStatus)}
              className={SELECT}>
              {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#2D2A26] mb-1">Visibility</label>
            <select value={draft.visibility}
              onChange={e => field('visibility', e.target.value as ImportedContentVisibility)}
              className={SELECT}>
              {VISIBILITY_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label} — {o.note}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Save / Cancel */}
        <div className="flex items-center gap-3">
          <button onClick={onSave}
            className="px-5 py-2.5 bg-[#C86A43] text-white text-sm font-semibold rounded-lg hover:bg-[#b05a35] transition-colors">
            Save Import
          </button>
          <button onClick={onCancel}
            className="px-4 py-2.5 text-sm text-[#6B7280] hover:text-[#2D2A26] transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Saved content row ────────────────────────────────────────────────────────

function SavedRow({
  item,
  onEdit,
  onDelete,
  onStatusChange,
}: {
  item: ImportedContent
  onEdit: () => void
  onDelete: () => void
  onStatusChange: (status: ImportedContentStatus) => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  const statusColors: Record<ImportedContentStatus, string> = {
    draft:     'bg-[#F3EDE6] text-[#9CA3AF]',
    published: 'bg-[#5E6B4A]/10 text-[#5E6B4A]',
    featured:  'bg-[#D6A94D]/20 text-amber-700',
    archived:  'bg-[#F3EDE6] text-[#6B7280]',
  }

  return (
    <div className="flex items-center gap-4 px-5 py-4">
      <div className="shrink-0">
        <PlatformBadge platform={item.sourcePlatform} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#2D2A26] truncate">{item.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <a href={item.originalUrl} target="_blank" rel="noopener noreferrer"
            className="text-[10px] text-[#9CA3AF] hover:text-[#C86A43] transition-colors truncate max-w-xs">
            {item.originalUrl}
          </a>
          {item.diaryGenerationMode && (
            <span className="text-[10px] text-[#9CA3AF] shrink-0">
              · {item.diaryGenerationMode === 'transcript' ? 'transcript diary' : item.diaryGenerationMode === 'metadata' ? 'metadata diary' : 'manual diary'}
            </span>
          )}
        </div>
      </div>
      <select
        value={item.status}
        onChange={e => onStatusChange(e.target.value as ImportedContentStatus)}
        className={`text-[10px] font-semibold px-2 py-1 rounded-full border-0 focus:outline-none cursor-pointer ${statusColors[item.status]}`}
      >
        {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <div className="flex items-center gap-2 shrink-0">
        <button onClick={onEdit} className="text-xs text-[#6B7280] hover:text-[#C86A43] transition-colors">
          Edit
        </button>
        {confirmDelete ? (
          <>
            <button onClick={onDelete} className="text-xs text-red-600 font-semibold">Confirm</button>
            <button onClick={() => setConfirmDelete(false)} className="text-xs text-[#9CA3AF]">Cancel</button>
          </>
        ) : (
          <button onClick={() => setConfirmDelete(true)}
            className="text-xs text-[#9CA3AF] hover:text-red-500 transition-colors">
            Delete
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function DashboardImportContentPage() {
  const { user } = useAuth()
  const founderId = getFounders()[0]?.id ?? user?.id ?? 'dev-user'

  const [urlInput, setUrlInput] = useState('')
  const [urlError, setUrlError] = useState('')
  const [draft, setDraft]       = useState<ImportedContent | null>(null)
  const [allItems, setAllItems] = useState<ImportedContent[]>([])

  function loadItems() {
    setAllItems(
      importedContentService.getByFounderId(founderId)
        .sort((a, b) => b.importedAt.localeCompare(a.importedAt))
    )
  }

  useEffect(() => { loadItems() }, [founderId])

  function handleImport() {
    const trimmed = urlInput.trim()
    if (!trimmed) { setUrlError('Paste a URL to import.'); return }
    try { new URL(trimmed) } catch {
      setUrlError("That doesn't look like a valid URL. Include https://...")
      return
    }
    setUrlError('')
    setDraft(buildDraftImport(founderId, trimmed))
    setUrlInput('')
  }

  function handleSave() {
    if (!draft) return
    importedContentService.upsert(draft)
    if (draft.status === 'published' || draft.status === 'featured') {
      const input = importedContentToInput(draft)
      const result = villageContentIntelligenceService.analyse(input)
      villageContentIntelligenceService.upsert(result)
    }
    setDraft(null)
    loadItems()
  }

  function handleCancel() { setDraft(null) }

  function handleEdit(item: ImportedContent) {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setDraft(item)
  }

  function handleDelete(id: string) {
    importedContentService.delete(id)
    loadItems()
  }

  function handleStatusChange(id: string, status: ImportedContentStatus) {
    importedContentService.updateStatus(id, status)
    loadItems()
  }

  const detectedPlatform = urlInput.trim() ? detectPlatform(urlInput.trim()) : null

  return (
    <div className="p-8 max-w-3xl" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#2D2A26]">Import Content</h1>
        <p className="text-sm text-[#6B7280] mt-1">
          Bring your old YouTube videos, LinkedIn articles, podcasts and more into the Village — so they can become searchable, connected and discoverable again.
        </p>
      </div>

      {/* Ethics notice */}
      <div className="mb-6 px-4 py-3 rounded-lg bg-[#5E6B4A]/10 border border-[#5E6B4A]/20 text-xs text-[#5E6B4A] leading-relaxed">
        CULO Village embeds content from its original platform and always links back to the source. Your content is not downloaded or re-uploaded. Authorship and platform attribution are preserved.
      </div>

      {/* URL import box */}
      {!draft && (
        <div className="bg-white rounded-xl border border-[#E8E4DD] p-5 mb-8">
          <p className="text-sm font-semibold text-[#2D2A26] mb-3">Paste a URL to import</p>
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <input
                type="url"
                value={urlInput}
                onChange={e => { setUrlInput(e.target.value); setUrlError('') }}
                onKeyDown={e => e.key === 'Enter' && handleImport()}
                placeholder="https://youtube.com/watch?v=... or any URL"
                className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none transition-colors ${
                  urlError ? 'border-red-300 focus:border-red-400' : 'border-[#E8E4DD] focus:border-[#C86A43]'
                }`}
              />
              {detectedPlatform && (
                <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold px-1.5 py-0.5 rounded ${PLATFORM_COLORS[detectedPlatform]}`}>
                  {PLATFORM_LABELS[detectedPlatform]}
                </span>
              )}
            </div>
            <button onClick={handleImport}
              className="px-5 py-2.5 bg-[#C86A43] text-white text-sm font-semibold rounded-lg hover:bg-[#b05a35] transition-colors shrink-0">
              Import
            </button>
          </div>
          {urlError && <p className="text-xs text-red-500 mt-2">{urlError}</p>}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {(['youtube', 'vimeo', 'instagram', 'linkedin', 'tiktok', 'podcast', 'website'] as const).map(p => (
              <span key={p} className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${PLATFORM_COLORS[p]}`}>
                {PLATFORM_LABELS[p]}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Edit form */}
      {draft && (
        <div className="mb-8">
          <p className="text-sm font-semibold text-[#2D2A26] mb-3">
            {allItems.some(i => i.id === draft.id) ? 'Edit imported content' : 'Review & save your import'}
          </p>
          <EditForm
            draft={draft}
            onChange={setDraft}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </div>
      )}

      {/* Saved imports list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-[#2D2A26]">
            Imported Content
            {allItems.length > 0 && (
              <span className="ml-2 text-[#9CA3AF] font-normal">{allItems.length}</span>
            )}
          </p>
          {draft && (
            <button onClick={() => setDraft(null)}
              className="text-xs text-[#C86A43] font-semibold hover:underline">
              + Import another URL
            </button>
          )}
        </div>

        {allItems.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#E8E4DD] px-5 py-10 text-center">
            <p className="text-sm font-semibold text-[#2D2A26] mb-2">No imports yet</p>
            <p className="text-xs text-[#9CA3AF] leading-relaxed max-w-sm mx-auto">
              Bring your old content into the Village so it can become searchable, connected and discoverable again.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-[#E8E4DD] divide-y divide-[#F3EDE6]">
            {allItems.map(item => (
              <SavedRow
                key={item.id}
                item={item}
                onEdit={() => handleEdit(item)}
                onDelete={() => handleDelete(item.id)}
                onStatusChange={status => handleStatusChange(item.id, status)}
              />
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
