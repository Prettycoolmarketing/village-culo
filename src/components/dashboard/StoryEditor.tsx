import { useState, type ReactNode } from 'react'
import { useDictation } from '../../hooks/useDictation'
import { updateStory, deleteStory, uniqueStorySlug } from '../../services/stories'
import { villageContentIntelligenceService, storyToInput } from '../../services/villageIntelligence'
import { syncIdeasFromStory, refreshAuthorityScores } from '../../services/ideaSync'
import { getBusinesses } from '../../services/businesses'
import { getFounder, updateFounder } from '../../services/founders'
import { generateBlogFromVoiceBrief, extractFaqsAI } from '../../services/blogWriter'
import { importedContentService } from '../../services/importedContent'
import { fallbackSummary } from '../../services/publishStory'
import { MediaUpload, inferKindFromUrl } from '../ui/MediaUpload'
import { ReelContent } from '../ui/ReelContent'
import { ConfirmButton } from '../ui/ConfirmButton'
import { AppearsOnPanel } from './AppearsOnPanel'
import { FAQEditor } from './FAQEditor'
import { getStoryAppearsOn } from '../../utils/appearsOn'
import { topics as allTopics } from '../../data/topics'
import { normalizeBlogSpacing } from '../../utils/blogFormatting'
import type { Story, ContentType, Topic, FAQ } from '../../types'

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

// Content types this editor can actually detect on its own from what's
// filled in — anything else already on a story (youtube-video, podcast,
// talking-head, social-post…) came from how it was imported and is left
// untouched; this editor never offered a way to set those manually anyway.
const AUTO_CONTENT_TYPES: ContentType[] = ['blog', 'reel', 'carousel']
const REEL_ALIAS_TYPES: ContentType[] = ['reel', 'youtube-video', 'talking-head', 'social-post']

function deriveContentTypes(d: Story): ContentType[] {
  const preserved = d.contentTypes.filter(ct => !AUTO_CONTENT_TYPES.includes(ct))
  const hasReelAlias = preserved.some(ct => REEL_ALIAS_TYPES.includes(ct))
  const auto: ContentType[] = []
  if (d.blog?.trim()) auto.push('blog')
  if (!hasReelAlias && d.reelUrl?.trim()) auto.push('reel')
  if ((d.carouselImages?.filter(Boolean).length ?? 0) > 0) auto.push('carousel')
  return [...new Set([...preserved, ...auto])]
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
  const { listening, toggle: toggleDictationBase } = useDictation()
  const [showTags, setShowTags] = useState(false)

  // FAQs live on the Founder record (shared across everything they publish),
  // scoped to this story via relatedStoryIds — Detect Q&A pulls real
  // question/answer pairs straight out of the Blog text instead of a founder
  // having to write them from scratch, since a founder rewriting a story
  // couldn't previously see (or generate) its Q&A at all from this popup.
  const [storyFaqs, setStoryFaqs] = useState<FAQ[]>(
    () => (getFounder(story.founderId)?.faqs ?? []).filter(f => f.relatedStoryIds.includes(story.id)),
  )
  const [detectingQa, setDetectingQa] = useState(false)

  async function persistFaqs(next: FAQ[]) {
    setStoryFaqs(next)
    const founder = getFounder(draft.founderId)
    if (!founder) return
    const others = (founder.faqs ?? []).filter(f => !f.relatedStoryIds.includes(draft.id))
    const stamped = next.map(f => f.relatedStoryIds.includes(draft.id) ? f : { ...f, relatedStoryIds: [...f.relatedStoryIds, draft.id] })
    await updateFounder({ ...founder, faqs: [...others, ...stamped] })
  }

  // Auto-adds newly detected topics rather than just suggesting them — a
  // founder who already wrote a real, specific Blog shouldn't also have to
  // hunt through and click every relevant tag by hand.
  function detectTopics(text: string) {
    if (!text.trim()) return
    const intel = villageContentIntelligenceService.analyse(storyToInput({ ...draft, blog: text }))
    const names = new Set([...intel.primaryTopics, ...intel.secondaryTopics].map(n => n.toLowerCase()))
    const toAdd = allTopics.filter(t => names.has(t.name.toLowerCase()) && !draft.topics.some(dt => dt.id === t.id))
    if (toAdd.length > 0) setDraft(prev => ({ ...prev, topics: [...prev.topics, ...toAdd] }))
  }

  async function detectQa(text: string) {
    if (!text.trim()) return
    setDetectingQa(true)
    const founderName = getFounder(draft.founderId)?.name
    const { pairs } = await extractFaqsAI({ title: draft.title, text, founderName })
    setDetectingQa(false)
    if (!pairs || pairs.length === 0) return
    const existingQuestions = new Set(storyFaqs.map(f => f.question.toLowerCase().trim()))
    const fresh: FAQ[] = pairs
      .filter(p => !existingQuestions.has(p.question.toLowerCase().trim()))
      .map(p => ({
        id: `faq-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        question: p.question,
        answer: p.answer,
        topicIds: draft.topics.map(t => t.id),
        expertiseIds: [],
        relatedStoryIds: [draft.id],
        relatedIdeaIds: [],
      }))
    if (fresh.length > 0) void persistFaqs([...storyFaqs, ...fresh])
  }

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
    // Pull in the real source this story came from (caption/description,
    // thumbnail, when it was posted) so a rewrite draws on what was
    // actually said in the post/video, not just rephrases the current
    // draft text back at itself.
    const sourceImport = draft.importedContentId ? importedContentService.get(draft.importedContentId) : undefined
    const result = await generateBlogFromVoiceBrief({
      voiceBrief: founder.voiceBrief,
      insightBrief: founder.insightBrief,
      founderName: founder.name,
      caption: sourceImport?.description,
      transcript: draft.blog,
      imageUrls: [
        ...(draft.carouselImages ?? []),
        ...(sourceImport?.imageUrls ?? []),
        ...(sourceImport?.thumbnailUrl ? [sourceImport.thumbnailUrl] : []),
      ],
      postedAt: sourceImport?.publishedAt,
      platform: sourceImport?.sourcePlatform ?? draft.contentTypes[0] ?? 'blog',
    })
    setRewriting(false)
    if (result.error) {
      setRewriteError(result.error)
      return
    }
    // insufficient_source means the AI correctly declined to invent detail
    // that isn't actually there — an honest outcome, not a glitch. It used
    // to collapse into the same generic "Could not rewrite this" message as
    // a real failure, which reads as "broken" when the real fix is giving
    // it more to work with.
    if (result.blog?.status === 'insufficient_source' || !result.blog?.blog) {
      setRewriteError(
        result.blog?.note
          ? `Not enough to go on yet — ${result.blog.note} Add more detail to the caption, or fill in more of your Brand Brief.`
          : 'Not enough here yet to write something true and specific — add more detail to the caption, or fill in more of your Brand Brief.'
      )
      return
    }
    setBlogBeforeRewrite(draft.blog)
    set('blog', result.blog.blog)
    // Detecting topics/Q&A off the freshly rewritten text (not the old
    // draft.blog, which hasn't updated yet) — this is what makes "Rewrite,
    // then Save" also pick up the story's tags and questions automatically,
    // instead of a founder having to separately hunt for and click each one.
    detectTopics(result.blog.blog)
    void detectQa(result.blog.blog)
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
    toggleDictationBase(
      () => draft.blog ?? '',
      text => { setDraft(prev => ({ ...prev, blog: text })); setSaved(false) },
      () => setRewriteError("Dictation isn't supported in this browser — try Chrome, Edge or Safari.")
    )
  }

  const founderBusinesses = getBusinesses({ founderId: draft.founderId }).filter(b => b.name.trim().length > 0)
  const appearsOn = getStoryAppearsOn(draft)

  function set<K extends keyof Story>(key: K, value: Story[K]) {
    setDraft(prev => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  function toggleTopic(topic: Topic) {
    setDraft(prev => {
      const has = prev.topics.some(t => t.id === topic.id)
      setSaved(false)
      return { ...prev, topics: has ? prev.topics.filter(t => t.id !== topic.id) : [...prev.topics, topic] }
    })
  }

  // One click toggles a business on/off — no separate "primary" vs
  // "related" picker to fill in twice. Whichever one gets clicked first
  // becomes businessId (drives uploads/"Founded by"); anything clicked
  // after that is just along for the ride in relatedBusinessIds. Clicking
  // the primary off promotes the next selected business, if there is one.
  function toggleBusiness(businessId: string) {
    setDraft(prev => {
      const related = prev.relatedBusinessIds ?? []
      if (prev.businessId === businessId) {
        const [next, ...rest] = related
        return { ...prev, businessId: next ?? '', relatedBusinessIds: rest }
      }
      if (related.includes(businessId)) {
        return { ...prev, relatedBusinessIds: related.filter(id => id !== businessId) }
      }
      if (!prev.businessId) {
        return { ...prev, businessId }
      }
      return { ...prev, relatedBusinessIds: [...related, businessId] }
    })
    setSaved(false)
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
    let toSave = desiredSlug === draft.slug ? draft : { ...draft, slug: desiredSlug }
    // Content Types has no manual picker anymore either — it just registers
    // itself from what's actually filled in (Blog text, a Reel URL, extra
    // photos), the same "stop asking, just detect it" treatment as Topics.
    toSave = { ...toSave, contentTypes: deriveContentTypes(toSave) }
    // Summary has no editable field of its own anymore — the Blog text is
    // the one place a founder writes, so the card/SEO summary always tracks
    // it exactly, both ways: derived when there's Blog text, and cleared
    // when Blog is cleared. Only re-deriving on non-empty Blog left a
    // deleted Blog's old summary stuck behind as the story's only visible
    // text — this way Summary never outlives the text it came from.
    toSave = { ...toSave, summary: toSave.blog?.trim() ? fallbackSummary(toSave.blog) : '' }
    // First time this one actually goes live (was draft/archived, now
    // published/featured) — stamp publishedAt so "Newest first" reflects
    // when it was published, not the original draft's createdAt. Never
    // overwritten on later re-saves once set.
    const isNowLive = toSave.status === 'published' || toSave.status === 'featured'
    if (isNowLive && !toSave.publishedAt) {
      toSave = { ...toSave, publishedAt: new Date().toISOString() }
    }
    const result = await updateStory(toSave)
    setSaving(false)
    if (result.success) {
      if (toSave.status === 'published' || toSave.status === 'featured') {
        const intel = villageContentIntelligenceService.analyse(storyToInput(toSave))
        void villageContentIntelligenceService.upsert(intel)
        void syncIdeasFromStory(toSave, intel)
        void refreshAuthorityScores(toSave)
      }
      if (toSave.slug !== draft.slug || toSave.publishedAt !== draft.publishedAt) setDraft(toSave)
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

  // Was gated on the literal 'reel' type only, which meant a video story
  // imported as 'youtube-video'/'talking-head'/'social-post' never showed
  // its own Reel URL field here — reelUrl being set (or any reel-alias type
  // already on the story) earns it back, same fix as hasBlog got.
  const hasReel = draft.contentTypes.some(ct => REEL_ALIAS_TYPES.includes(ct)) || !!draft.reelUrl?.trim()
  // A story published with real blog text but a contentTypes list that
  // doesn't include 'blog' (common on older/imported stories) was hiding
  // the whole Blog field, mic and rewrite button on edit — even though the
  // text is live on the published page. Existing blog text always earns
  // the field back, regardless of what contentTypes says.
  const hasBlog = draft.contentTypes.includes('blog') || !!draft.blog?.trim()
  const isVisible = draft.status === 'published' || draft.status === 'featured'

  // A stray click on the dimmed backdrop used to close this and silently
  // discard everything typed — no autosave, no warning, just gone. Now it
  // only closes immediately when there's nothing to lose; otherwise it
  // asks first, same window.confirm pattern already used for other
  // discard/delete actions elsewhere in the dashboard.
  const isDirty = JSON.stringify(draft) !== JSON.stringify(story)
  function requestClose() {
    // Closing mid-rewrite would abandon the in-flight AI call entirely —
    // block it outright rather than just warning, since there's nothing
    // useful "close anyway" could mean here.
    if (rewriting) return
    if (isDirty && !window.confirm("You have unsaved changes — close without saving?")) return
    onClose()
  }

  return (
    // Floating popup over a dimmed backdrop, same shell as Advanced edit
    // (Imported Content's editor) — a founder gets one consistent editing
    // feel whether the piece is still a draft or already published,
    // instead of a popup for one and an inline page-swap for the other.
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center p-4 sm:p-8 overflow-y-auto"
      // No close-on-backdrop-click at all — this used to fire from
      // selecting text inside the form (a drag that ends slightly outside
      // the card reads as a plain click on the backdrop) and kept losing
      // founders' place mid-edit even after narrowing when it fired.
      // Closing this long-form editor is deliberate now: the X button or
      // Save, nothing else.
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
            onClick={requestClose}
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
              {listening && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" aria-hidden="true" />
                  Recording…
                </span>
              )}
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
              {rewriting && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#C86A43]">
                  <span className="w-3 h-3 rounded-full border-2 border-[#C86A43]/30 border-t-[#C86A43] animate-spin shrink-0" aria-hidden="true" />
                  Keep this page open — don't close it or click away while it's rewriting
                </span>
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
              <button
                type="button"
                onClick={() => { detectTopics(draft.blog ?? ''); void detectQa(draft.blog ?? '') }}
                disabled={detectingQa || !draft.blog?.trim()}
                className="text-xs font-semibold px-3 py-2 rounded-lg text-[#6B7280] bg-[#F3EDE6] hover:bg-[#E8E4DD] disabled:opacity-50 transition-colors"
              >
                {detectingQa ? 'Detecting…' : '🔎 Detect topics & Q&A'}
              </button>
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

        {hasBlog && (
          <Field label="Questions & Answers" hint="Detected from this story's Blog text — shown on the page and used by search engines and AI. Rewrite with AI (or Detect topics & Q&A above) finds these automatically; add or edit any below.">
            {storyFaqs.length === 0 && !detectingQa && (
              <p className="text-xs text-[#9CA3AF] mb-2">None detected yet — rewrite the Blog, or use "Detect topics & Q&A" above.</p>
            )}
            <FAQEditor faqs={storyFaqs} onChange={next => void persistFaqs(next)} />
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
          <Field label="Business" hint="Which businesses this story is about — click to select. The first one you pick drives uploads and the main 'Founded by' credit.">
            <div className="flex flex-wrap gap-1.5 mt-1">
              {founderBusinesses.map(b => {
                const active = draft.businessId === b.id || (draft.relatedBusinessIds ?? []).includes(b.id)
                return (
                  <button key={b.id} type="button" onClick={() => toggleBusiness(b.id)}
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
          <a href={`/stories/${draft.slug}`} target="_blank" rel="noopener noreferrer"
            className="px-3 py-2 text-sm font-semibold text-[#6B7280] hover:text-[#C86A43] transition-colors">
            View story ↗
          </a>
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
