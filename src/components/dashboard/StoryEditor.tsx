import { useState, useRef, type ReactNode } from 'react'
import { updateStory, deleteStory, uniqueStorySlug } from '../../services/stories'
import { villageContentIntelligenceService, storyToInput } from '../../services/villageIntelligence'
import { syncIdeasFromStory, refreshAuthorityScores } from '../../services/ideaSync'
import { getBusinesses } from '../../services/businesses'
import { getFounder } from '../../services/founders'
import { generateBlogFromVoiceBrief } from '../../services/blogWriter'
import { MediaUpload, inferKindFromUrl } from '../ui/MediaUpload'
import { ReelContent } from '../ui/ReelContent'
import { ConfirmButton } from '../ui/ConfirmButton'
import { AppearsOnPanel } from './AppearsOnPanel'
import { getStoryAppearsOn } from '../../utils/appearsOn'
import { topics as allTopics } from '../../data/topics'
import { normalizeUrl } from '../../utils/url'
import { normalizeBlogSpacing } from '../../utils/blogFormatting'
import { contentTypeLabel } from '../../utils/slugify'
import type { Story, ContentType, Topic } from '../../types'

// A deliberately simple story editor — title, summary, the content itself,
// topics, ideas, CTA, and whether it's visible. Everything else the old
// standalone Stories page had (Intelligence stats, readability score, a
// separate SEO preview, a read-only Relationships panel) was either
// automatic already or rarely touched, so it's not here — one place to
// actually edit a story, not a dashboard about the story.

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

const CONTENT_TYPES: ContentType[] = ['blog', 'reel', 'carousel']

// Minimal Web Speech API surface — not in every TS DOM lib version, and
// only the handful of members dictation actually uses.
interface SpeechRecognitionResultLike { [index: number]: { transcript: string }; length: number }
interface SpeechRecognitionEventLike { resultIndex: number; results: { [index: number]: SpeechRecognitionResultLike; length: number } }
interface SpeechRecognitionLike {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((e: SpeechRecognitionEventLike) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
}
declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionLike
    webkitSpeechRecognition?: new () => SpeechRecognitionLike
  }
}

export function StoryEditor({ story, onSave, onDelete, onClose, canRewrite = false }: {
  canRewrite?: boolean
  story: Story
  onSave: (s: Story) => void
  onDelete: (s: Story) => void
  onClose: () => void
}) {
  const [draft, setDraft] = useState<Story>({ ...story })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [rewriting, setRewriting] = useState(false)
  const [rewriteError, setRewriteError] = useState<string | null>(null)
  const [blogBeforeRewrite, setBlogBeforeRewrite] = useState<string | null>(null)
  const [listening, setListening] = useState(false)
  const [showTags, setShowTags] = useState(false)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)

  // Rewrite with AI — same real, per-call AI spend as "Rewrite with Voice
  // Brief" on Imported Content, just aimed at a Story's own Blog field
  // instead: the current Blog text goes in as the source material
  // (transcript), the founder's Voice & Brand Brief shapes how it comes
  // back out. Snapshots the pre-rewrite text so one "Undo rewrite" always
  // gets back exactly what was there before — never silently lost.
  async function handleRewriteBlog() {
    const founder = getFounder(draft.founderId)
    if (!founder?.voiceBrief?.trim()) {
      setRewriteError('Add a Voice & Brand Brief in your profile first — Rewrite with AI needs it to write in your voice.')
      return
    }
    if (!draft.blog?.trim()) {
      setRewriteError('Nothing to rewrite yet — write or dictate something first.')
      return
    }
    setRewriting(true)
    setRewriteError(null)
    const result = await generateBlogFromVoiceBrief({
      voiceBrief: founder.voiceBrief,
      founderName: founder.name,
      transcript: draft.blog,
      platform: draft.contentTypes[0] ?? 'blog',
    })
    setRewriting(false)
    if (result.error || !result.blog?.blog) {
      setRewriteError(result.error ?? 'Could not rewrite this. Please try again.')
      return
    }
    setBlogBeforeRewrite(draft.blog)
    set('blog', result.blog.blog)
  }

  function handleUndoRewrite() {
    if (blogBeforeRewrite === null) return
    set('blog', blogBeforeRewrite)
    setBlogBeforeRewrite(null)
  }

  // Dictation — the browser's own free, local speech-to-text (Web Speech
  // API), no server call and no AI spend. Appends each finalised chunk as
  // it's recognised; a founder can then hit Rewrite with AI on top of
  // whatever it transcribed to turn it into a real blog.
  function toggleDictation() {
    const SpeechRecognitionCtor = window.SpeechRecognition ?? window.webkitSpeechRecognition
    if (!SpeechRecognitionCtor) {
      setRewriteError("Dictation isn't supported in this browser — try Chrome, Edge or Safari.")
      return
    }
    if (listening) {
      recognitionRef.current?.stop()
      return
    }
    const recognition = new SpeechRecognitionCtor()
    recognition.continuous = true
    recognition.interimResults = false
    recognition.lang = navigator.language || 'en-US'
    recognition.onresult = (e: SpeechRecognitionEventLike) => {
      let transcript = ''
      for (let i = e.resultIndex; i < e.results.length; i++) transcript += e.results[i]![0]!.transcript
      if (!transcript.trim()) return
      setDraft(prev => ({ ...prev, blog: `${prev.blog ?? ''} ${transcript}`.trim() }))
      setSaved(false)
    }
    recognition.onerror = () => setListening(false)
    recognition.onend = () => setListening(false)
    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
  }

  const founderBusinesses = getBusinesses({ founderId: draft.founderId }).filter(b => b.name.trim().length > 0)
  const appearsOn = getStoryAppearsOn(draft)

  function set<K extends keyof Story>(key: K, value: Story[K]) {
    setDraft(prev => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  function toggleContentType(ct: ContentType) {
    setDraft(prev => {
      const has = prev.contentTypes.includes(ct)
      setSaved(false)
      return { ...prev, contentTypes: has ? prev.contentTypes.filter(x => x !== ct) : [...prev.contentTypes, ct] }
    })
  }

  function toggleTopic(topic: Topic) {
    setDraft(prev => {
      const has = prev.topics.some(t => t.id === topic.id)
      setSaved(false)
      return { ...prev, topics: has ? prev.topics.filter(t => t.id !== topic.id) : [...prev.topics, topic] }
    })
  }

  function toggleRelatedBusiness(businessId: string) {
    if (businessId === draft.businessId) return
    const current = draft.relatedBusinessIds ?? []
    set('relatedBusinessIds', current.includes(businessId) ? current.filter(id => id !== businessId) : [...current, businessId])
  }

  function toggleAppearsOn(key: string, hide: boolean) {
    const current = draft.hiddenLocations ?? []
    set('hiddenLocations', hide ? [...current, key] : current.filter(k => k !== key))
  }

  async function handleSave() {
    setSaving(true)
    setSaveError(null)
    // The slug used to only ever get set once, at creation — editing the
    // title here never touched it, so the public URL silently went stale
    // (or stuck on a thin one-off slug from whatever the title was at
    // first-publish). Recomputes from the current title on every save;
    // a no-op when the title hasn't changed since the slug already matches.
    const desiredSlug = uniqueStorySlug(draft.title, draft.id)
    const toSave = desiredSlug === draft.slug ? draft : { ...draft, slug: desiredSlug }
    const result = await updateStory(toSave)
    setSaving(false)
    if (result.success) {
      if (toSave.status === 'published' || toSave.status === 'featured') {
        const intel = villageContentIntelligenceService.analyse(storyToInput(toSave))
        void villageContentIntelligenceService.upsert(intel)
        void syncIdeasFromStory(toSave, intel)
        void refreshAuthorityScores(toSave)
      }
      if (toSave.slug !== draft.slug) setDraft(toSave)
      setSaved(true)
      onSave(toSave)
    } else {
      setSaveError(result.error ?? 'Save failed. Please try again.')
    }
  }

  async function handleDelete() {
    const result = await deleteStory(draft.id)
    if (result.success) onDelete(draft)
  }

  const hasReel = draft.contentTypes.includes('reel')
  // A story published with real blog text but a contentTypes list that
  // doesn't include 'blog' (common on older/imported stories) was hiding
  // the whole Blog field, mic and rewrite button on edit — even though the
  // text is live on the published page. Existing blog text always earns
  // the field back, regardless of what contentTypes says.
  const hasBlog = draft.contentTypes.includes('blog') || !!draft.blog?.trim()
  const isVisible = draft.status === 'published' || draft.status === 'featured'

  return (
    // Floating popup over a dimmed backdrop, same shell as Advanced edit
    // (Imported Content's editor) — a founder gets one consistent editing
    // feel whether the piece is still a draft or already published,
    // instead of a popup for one and an inline page-swap for the other.
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center p-4 sm:p-8 overflow-y-auto"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
    <div className="w-full max-w-4xl bg-white rounded-2xl border border-[#E8E4DD] shadow-2xl p-6 my-4 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-[#2D2A26]">Edit this story</p>
        <div className="flex items-center gap-2">
          {saved && <span className="text-xs text-green-600 font-medium">Saved ✓</span>}
          {saveError && <span className="text-xs text-red-600 font-medium">{saveError}</span>}
          <a href={`/stories/${draft.slug}`} target="_blank" rel="noopener noreferrer"
            className="px-2.5 py-1.5 text-xs text-[#6B7280] border border-[#E8E4DD] rounded-lg hover:text-[#C86A43] hover:border-[#C86A43]/40 transition-colors">
            View ↗
          </a>
          <button onClick={() => void handleSave()} disabled={saving}
            className="px-3 py-1.5 bg-[#C86A43] text-white text-xs font-semibold rounded-lg hover:bg-[#b05a35] disabled:opacity-60 transition-colors">
            {saving ? 'Saving…' : 'Save'}
          </button>
          <ConfirmButton
            label="Delete"
            confirmLabel="Yes, delete"
            message={`Delete "${draft.title}"? This can't be undone.`}
            onConfirm={() => void handleDelete()}
            className="text-xs text-[#9CA3AF] hover:text-red-500 transition-colors"
          />
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-[#9CA3AF] hover:text-[#2D2A26] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-5">
        <Field label="Title">
          <input type="text" value={draft.title} onChange={e => set('title', e.target.value)} className={inputClass} />
        </Field>

        <Field label="Summary">
          <textarea value={draft.summary} onChange={e => set('summary', e.target.value)} rows={3} className={inputClass + ' resize-y'} />
        </Field>

        <Field label="Content Types" hint="Select all formats this story is published in — shown as badges on the story's page">
          <div className="flex gap-1.5 flex-wrap mt-1">
            {CONTENT_TYPES.map(ct => {
              const active = draft.contentTypes.includes(ct)
              return (
                <button key={ct} onClick={() => toggleContentType(ct)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${active ? 'bg-charcoal text-white' : 'bg-[#F3EDE6] text-[#9CA3AF] hover:text-[#6B7280]'}`}>
                  {active && (
                    <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {contentTypeLabel(ct)}
                </button>
              )
            })}
          </div>
        </Field>

        {hasBlog && (
          <Field label="Blog">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <button
                type="button"
                onClick={toggleDictation}
                title={listening ? 'Stop dictating' : 'Dictate your story — speaks straight into the Blog field'}
                className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                  listening ? 'bg-red-500 text-white animate-pulse' : 'bg-[#2D2A26] text-white hover:bg-[#1a1815]'
                }`}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 15a3 3 0 003-3V6a3 3 0 10-6 0v6a3 3 0 003 3z" />
                  <path d="M19 11a1 1 0 10-2 0 5 5 0 01-10 0 1 1 0 10-2 0 7 7 0 006 6.93V20H9a1 1 0 100 2h6a1 1 0 100-2h-2v-2.07A7 7 0 0019 11z" />
                </svg>
              </button>
              {canRewrite && (
                <button
                  type="button"
                  onClick={() => void handleRewriteBlog()}
                  disabled={rewriting}
                  className="text-xs font-semibold px-3 py-2 rounded-lg bg-[#FBF1EB] text-[#C86A43] hover:bg-[#C86A43]/10 disabled:opacity-50 transition-colors"
                >
                  {rewriting ? 'Rewriting…' : '✨ Rewrite with AI'}
                </button>
              )}
              {blogBeforeRewrite !== null && (
                <button
                  type="button"
                  onClick={handleUndoRewrite}
                  className="text-xs font-semibold px-3 py-2 rounded-lg text-[#6B7280] bg-[#F3EDE6] hover:bg-[#E8E4DD] transition-colors"
                >
                  ↺ Undo rewrite
                </button>
              )}
              {listening && <span className="text-xs text-red-500 font-medium">Listening…</span>}
            </div>
            {rewriteError && <p className="text-xs text-red-600 mb-2">{rewriteError}</p>}
            <textarea
              value={draft.blog ?? ''}
              onChange={e => set('blog', e.target.value || undefined)}
              onBlur={() => draft.blog && set('blog', normalizeBlogSpacing(draft.blog))}
              rows={8}
              placeholder="Paste or write full blog content here…"
              className={inputClass + ' resize-y'}
            />
          </Field>
        )}

        {/* One video view, always visible — no click-to-reveal, same
            declutter as Advanced edit. ReelContent (not MediaUpload's own
            preview) is the one shown here since reelUrl is often an
            external platform link (Instagram/YouTube), not just an
            uploaded file, and ReelContent is the component that already
            handles both correctly. */}
        {hasReel && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Reel URL">
              <input type="url" value={draft.reelUrl ?? ''} onChange={e => set('reelUrl', e.target.value || undefined)} className={inputClass} placeholder="https://…" />
              {draft.reelUrl && (
                <div className="mt-2">
                  <ReelContent reelUrl={draft.reelUrl} title={draft.title} summary={draft.summary} landscape />
                </div>
              )}
              <div className="mt-2">
                <MediaUpload
                  onChange={v => set('reelUrl', v || undefined)}
                  accept="video"
                  label="Upload a video for the reel"
                  aspect="auto"
                  uploadOptions={{ founderId: draft.founderId, businessId: draft.businessId, usageType: 'reel-preview' }}
                />
              </div>
            </Field>
            <Field label="Cover Image">
              <MediaUpload
                value={draft.coverImage}
                onChange={v => set('coverImage', v)}
                label="Upload cover"
                aspect="wide-contain"
                uploadOptions={{ founderId: draft.founderId, businessId: draft.businessId, usageType: 'story-cover' }}
              />
            </Field>
          </div>
        )}

        <Field label="Extra photos / video" hint="Add extra photos, a carousel, or another reel/video clip — works alongside the primary content above.">
          {(draft.carouselImages ?? []).length > 0 && (
            <div className="flex flex-col gap-2 mb-2">
              {(draft.carouselImages ?? []).map((img, i) => (
                <div key={i} className="flex items-center gap-2 bg-[#F8F5F0] rounded-lg border border-[#E8E4DD] p-2">
                  <img src={img} alt="" className="w-10 h-10 rounded object-cover shrink-0 bg-[#F3EDE6]" />
                  <div className="flex-1" />
                  <button
                    onClick={() => set('carouselImages', (draft.carouselImages ?? []).filter((_, j) => j !== i))}
                    className="shrink-0 text-xs text-[#9CA3AF] hover:text-red-500 px-2">✕</button>
                </div>
              ))}
            </div>
          )}
          {(draft.additionalReelUrls ?? []).length > 0 && (
            <div className="flex flex-col gap-2 mb-2">
              {(draft.additionalReelUrls ?? []).map((url, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="url"
                    value={url}
                    onChange={e => {
                      const next = [...(draft.additionalReelUrls ?? [])]
                      next[i] = e.target.value
                      set('additionalReelUrls', next)
                    }}
                    className={inputClass}
                    placeholder={`Video ${i + 1} URL`}
                  />
                  <button
                    onClick={() => set('additionalReelUrls', (draft.additionalReelUrls ?? []).filter((_, j) => j !== i))}
                    className="shrink-0 text-xs text-[#9CA3AF] hover:text-red-500 px-2">✕</button>
                </div>
              ))}
            </div>
          )}
          <div className="flex flex-col gap-2">
            <button
              onClick={() => set('additionalReelUrls', [...(draft.additionalReelUrls ?? []), ''])}
              className="text-xs text-[#C86A43] hover:underline text-left w-fit">
              + Add another reel/video (by URL)
            </button>
            {/* One dropzone for both — each file routes itself to the right
                field by its own type instead of needing two uploaders. */}
            <MediaUpload
              onChange={v => set(
                inferKindFromUrl(v) === 'video' ? 'additionalReelUrls' : 'carouselImages',
                inferKindFromUrl(v) === 'video'
                  ? [...(draft.additionalReelUrls ?? []).filter(Boolean), v]
                  : [...(draft.carouselImages ?? []), v],
              )}
              onChangeMultiple={urls => {
                const videos = urls.filter(u => inferKindFromUrl(u) === 'video')
                const images = urls.filter(u => inferKindFromUrl(u) !== 'video')
                if (videos.length > 0) set('additionalReelUrls', [...(draft.additionalReelUrls ?? []).filter(Boolean), ...videos])
                if (images.length > 0) set('carouselImages', [...(draft.carouselImages ?? []), ...images])
              }}
              multiple
              accept="media"
              label="Add photos or a video"
              aspect="auto"
              uploadOptions={{ founderId: draft.founderId, businessId: draft.businessId, usageType: 'carousel-slide' }}
            />
          </div>
        </Field>

        {/* Only shown alone when there's no reel — otherwise it already
            sits next to the video above. */}
        {!hasReel && (
          <Field label="Cover Image">
            <MediaUpload
              value={draft.coverImage}
              onChange={v => set('coverImage', v)}
              label="Upload cover"
              aspect="wide-contain"
              uploadOptions={{ founderId: draft.founderId, businessId: draft.businessId, usageType: 'story-cover' }}
            />
          </Field>
        )}

        {founderBusinesses.length > 0 && (
          <Field label="Business" hint="Which business this story is primarily about — drives uploads and the main 'Founded by' credit.">
            <select value={draft.businessId} onChange={e => {
              const nextId = e.target.value
              setDraft(prev => ({ ...prev, businessId: nextId, relatedBusinessIds: (prev.relatedBusinessIds ?? []).filter(id => id !== nextId) }))
              setSaved(false)
            }} className={inputClass}>
              {!founderBusinesses.some(b => b.id === draft.businessId) && <option value={draft.businessId}>—</option>}
              {founderBusinesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </Field>
        )}

        {founderBusinesses.length > 1 && (
          <Field label="Also relates to" hint="Other businesses this story connects to, beyond the primary one above — e.g. a story about a joint venture.">
            <div className="flex flex-wrap gap-1.5 mt-1">
              {founderBusinesses.filter(b => b.id !== draft.businessId).map(b => {
                const active = (draft.relatedBusinessIds ?? []).includes(b.id)
                return (
                  <button key={b.id} onClick={() => toggleRelatedBusiness(b.id)}
                    className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${active ? 'bg-[#C86A43] text-white border-[#C86A43]' : 'bg-white text-[#4B4845] border-[#E8E4DD] hover:border-[#C86A43]/50'}`}>
                    {b.name}
                  </button>
                )
              })}
            </div>
          </Field>
        )}

        <div className="border-t border-[#E8E4DD] pt-3">
          <button
            type="button"
            onClick={() => setShowTags(s => !s)}
            className="flex items-center gap-1.5 text-xs font-medium text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
          >
            <span>{showTags ? '▾' : '▸'}</span>
            Search tags {draft.topics.length > 0 && `(${draft.topics.length})`}
          </button>
          {showTags && (
            <div className="mt-3 space-y-4">
              <p className="text-xs text-[#9CA3AF]">
                Backend only — helps search and AI connect this story to the right topics. Not shown on the page.
                Ideas this story builds on connect automatically when you save.
              </p>
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
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="CTA Label">
            <input type="text" value={draft.ctaLabel} onChange={e => set('ctaLabel', e.target.value)} className={inputClass} placeholder="Read more" />
          </Field>
          <Field label="CTA URL">
            <input type="url" value={draft.ctaUrl} onChange={e => set('ctaUrl', e.target.value)} className={inputClass} placeholder="https://" />
            {draft.ctaUrl && (
              <a href={normalizeUrl(draft.ctaUrl)} target="_blank" rel="noopener noreferrer" className="text-xs text-[#C86A43] hover:underline mt-1 inline-block">Preview ↗</a>
            )}
          </Field>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-[#E8E4DD]">
          <div>
            <p className="text-sm font-medium text-[#2D2A26]">Visible on the public site</p>
            <p className="text-xs text-[#9CA3AF] mt-0.5">Off keeps this as a private draft. Featuring it is done by CULO staff.</p>
          </div>
          <button
            onClick={() => set('status', isVisible ? 'draft' : 'published')}
            className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${isVisible ? 'bg-[#C86A43]' : 'bg-[#E8E4DD]'}`}
          >
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${isVisible ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        {appearsOn.length > 0 && (
          <div className="border-t border-[#E8E4DD] pt-4">
            <p className="text-sm font-semibold text-[#2D2A26] mb-2">Appears On</p>
            <AppearsOnPanel locations={appearsOn} onToggle={toggleAppearsOn} />
          </div>
        )}

        <div className="flex items-center justify-end gap-2 border-t border-[#E8E4DD] pt-4">
          {saved && <span className="text-xs text-green-600 font-medium">Saved ✓</span>}
          {saveError && <span className="text-xs text-red-600 font-medium">{saveError}</span>}
          <button onClick={() => void handleSave()} disabled={saving}
            className="px-4 py-2 bg-[#C86A43] text-white text-sm font-semibold rounded-lg hover:bg-[#b05a35] disabled:opacity-60 transition-colors">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
    </div>
  )
}
