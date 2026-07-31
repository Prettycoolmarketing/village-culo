import { useState, type ReactNode } from 'react'
import { updateStory, deleteStory } from '../../services/stories'
import { villageContentIntelligenceService, storyToInput } from '../../services/villageIntelligence'
import { syncIdeasFromStory, refreshAuthorityScores } from '../../services/ideaSync'
import { getIdeas } from '../../services/ideas'
import { MediaUpload } from '../ui/MediaUpload'
import { ConfirmButton } from '../ui/ConfirmButton'
import { AppearsOnPanel } from './AppearsOnPanel'
import { MissingAssetsPanel } from './MissingAssetsPanel'
import { getStoryMissingItems } from '../../utils/missingAssets'
import { getStoryAppearsOn } from '../../utils/appearsOn'
import { topics as allTopics } from '../../data/topics'
import { normalizeUrl } from '../../utils/url'
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

export function StoryEditor({ story, onSave, onDelete, onClose }: {
  story: Story
  onSave: (s: Story) => void
  onDelete: (s: Story) => void
  onClose: () => void
}) {
  const [draft, setDraft] = useState<Story>({ ...story })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const founderIdeas = getIdeas({ founderId: draft.founderId })
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

  function toggleIdea(ideaId: string) {
    const current = draft.ideaIds ?? []
    set('ideaIds', current.includes(ideaId) ? current.filter(id => id !== ideaId) : [...current, ideaId])
  }

  function toggleAppearsOn(key: string, hide: boolean) {
    const current = draft.hiddenLocations ?? []
    set('hiddenLocations', hide ? [...current, key] : current.filter(k => k !== key))
  }

  async function handleSave() {
    setSaving(true)
    setSaveError(null)
    const result = await updateStory(draft)
    setSaving(false)
    if (result.success) {
      if (draft.status === 'published' || draft.status === 'featured') {
        const intel = villageContentIntelligenceService.analyse(storyToInput(draft))
        void villageContentIntelligenceService.upsert(intel)
        void syncIdeasFromStory(draft, intel)
        void refreshAuthorityScores(draft)
      }
      setSaved(true)
      onSave(draft)
    } else {
      setSaveError(result.error ?? 'Save failed. Please try again.')
    }
  }

  async function handleDelete() {
    const result = await deleteStory(draft.id)
    if (result.success) onDelete(draft)
  }

  const hasReel = draft.contentTypes.includes('reel')
  const hasBlog = draft.contentTypes.includes('blog')
  const isVisible = draft.status === 'published' || draft.status === 'featured'

  return (
    <div className="bg-white rounded-xl border border-[#E8E4DD] flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#F3EDE6]">
        <button onClick={onClose} className="text-xs font-semibold text-[#9CA3AF] hover:text-[#2D2A26] transition-colors">
          ← Back to Content
        </button>
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
        </div>
      </div>

      <div className="px-5 py-5 flex flex-col gap-5">
        <MissingAssetsPanel items={getStoryMissingItems(draft)} />

        <Field label="Title">
          <input type="text" value={draft.title} onChange={e => set('title', e.target.value)} className={inputClass} />
        </Field>

        <Field label="Summary">
          <textarea value={draft.summary} onChange={e => set('summary', e.target.value)} rows={3} className={inputClass + ' resize-y'} />
        </Field>

        <Field label="Content Types" hint="Select all formats this story is published in">
          <div className="flex gap-2 flex-wrap mt-1">
            {CONTENT_TYPES.map(ct => (
              <button key={ct} onClick={() => toggleContentType(ct)}
                className={`px-3 py-1.5 rounded-lg text-sm border font-medium transition-colors capitalize ${draft.contentTypes.includes(ct) ? 'bg-[#C86A43] text-white border-[#C86A43]' : 'bg-white text-[#6B7280] border-[#E8E4DD] hover:border-[#C86A43]/50'}`}>
                {ct}
              </button>
            ))}
          </div>
        </Field>

        {hasBlog && (
          <Field label="Blog">
            <textarea
              value={draft.blog ?? ''}
              onChange={e => set('blog', e.target.value || undefined)}
              rows={8}
              placeholder="Paste or write full blog content here…"
              className={inputClass + ' resize-y'}
            />
          </Field>
        )}

        {hasReel && (
          <Field label="Reel URL">
            <input type="url" value={draft.reelUrl ?? ''} onChange={e => set('reelUrl', e.target.value || undefined)} className={inputClass} placeholder="https://…" />
            <div className="mt-2">
              <MediaUpload
                value={draft.reelUrl}
                onChange={v => set('reelUrl', v || undefined)}
                accept="video"
                label="Upload a video for the reel"
                aspect="auto"
                uploadOptions={{ founderId: draft.founderId, businessId: draft.businessId, usageType: 'reel-preview' }}
              />
            </div>
          </Field>
        )}

        <Field label="Extra photos / carousel" hint="Add extra photos or a carousel — works alongside any other content type.">
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
          <MediaUpload
            onChange={v => set('carouselImages', [...(draft.carouselImages ?? []), v])}
            onChangeMultiple={urls => set('carouselImages', [...(draft.carouselImages ?? []), ...urls])}
            multiple
            accept="image"
            label="Upload photos"
            aspect="auto"
            uploadOptions={{ founderId: draft.founderId, businessId: draft.businessId, usageType: 'carousel-slide' }}
          />
        </Field>

        <Field label="Extra reel / video" hint="Add another reel or video clip — beyond the primary one above.">
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
            <MediaUpload
              onChange={v => set('additionalReelUrls', [...(draft.additionalReelUrls ?? []).filter(Boolean), v])}
              accept="video"
              label="Or upload a video file"
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
            aspect="wide"
            uploadOptions={{ founderId: draft.founderId, businessId: draft.businessId, usageType: 'story-cover' }}
          />
        </Field>

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

        {founderIdeas.length > 0 && (
          <Field label="Connected ideas" hint="Link an idea this story builds on — strengthens both.">
            <div className="flex flex-wrap gap-1.5 mt-1">
              {founderIdeas.map(idea => {
                const active = (draft.ideaIds ?? []).includes(idea.id)
                return (
                  <button key={idea.id} onClick={() => toggleIdea(idea.id)}
                    className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${active ? 'bg-[#5E6B4A] text-white border-[#5E6B4A]' : 'bg-white text-[#4B4845] border-[#E8E4DD] hover:border-[#5E6B4A]/50'}`}>
                    {idea.title}
                  </button>
                )
              })}
            </div>
          </Field>
        )}

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
  )
}
