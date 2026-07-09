import { useState } from 'react'
import { editorialService, newEditorialFeature } from '../../../services/editorial'
import { getFounders } from '../../../services/founders'
import { getStories } from '../../../services/stories'
import { slugify } from '../../../utils/slugify'
import { MediaUpload } from '../../../components/ui/MediaUpload'
import { ConfirmButton } from '../../../components/ui/ConfirmButton'
import type { EditorialFeature, EditorialPick, EditorialTemplate } from '../../../types/editorial'

const TEMPLATE_LABELS: Record<EditorialTemplate, string> = {
  'founder-spotlight': 'Founder Spotlight',
  'industry-roundup':  'Industry Roundup',
  'weekly-collection': 'Weekly Collection',
}

const inputClass = 'w-full px-3 py-2.5 rounded-lg border border-[#E8E4DD] text-sm text-[#2D2A26] bg-white placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#C86A43]/30 focus:border-[#C86A43] transition-colors'

function PickRow({ pick, onChange, onRemove }: { pick: EditorialPick; onChange: (p: EditorialPick) => void; onRemove: () => void }) {
  const founders = getFounders({ publicOnly: true })
  const stories = getStories({ publicOnly: true })

  return (
    <div className="bg-[#F8F5F0] rounded-lg p-3 flex flex-col gap-2">
      <div className="flex gap-2">
        <select value={pick.founderId ?? ''} onChange={e => onChange({ ...pick, founderId: e.target.value || undefined })} className={inputClass}>
          <option value="">— Founder (optional) —</option>
          {founders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
        <select value={pick.storyId ?? ''} onChange={e => onChange({ ...pick, storyId: e.target.value || undefined })} className={inputClass}>
          <option value="">— Story (optional) —</option>
          {stories.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
        </select>
      </div>
      <textarea
        value={pick.note}
        onChange={e => onChange({ ...pick, note: e.target.value })}
        rows={2}
        placeholder="Why this pick is featured — your own words, not a summary of their content"
        className={inputClass}
      />
      <button onClick={onRemove} className="text-xs text-red-500 hover:underline self-start">Remove pick</button>
    </div>
  )
}

function EditorialForm({ draft, onChange, onSave, onCancel }: {
  draft: EditorialFeature
  onChange: (f: EditorialFeature) => void
  onSave: () => void
  onCancel: () => void
}) {
  function set<K extends keyof EditorialFeature>(key: K, value: EditorialFeature[K]) {
    onChange({ ...draft, [key]: value })
  }

  function addPick() {
    set('picks', [...draft.picks, { note: '' }])
  }

  function updatePick(i: number, pick: EditorialPick) {
    set('picks', draft.picks.map((p, idx) => idx === i ? pick : p))
  }

  function removePick(i: number) {
    set('picks', draft.picks.filter((_, idx) => idx !== i))
  }

  return (
    <div className="bg-white rounded-xl border border-[#E8E4DD] p-5 flex flex-col gap-4">
      <div>
        <label className="block text-xs font-semibold text-[#2D2A26] mb-1">Template</label>
        <select value={draft.template} onChange={e => set('template', e.target.value as EditorialTemplate)} className={inputClass}>
          {(Object.keys(TEMPLATE_LABELS) as EditorialTemplate[]).map(t => <option key={t} value={t}>{TEMPLATE_LABELS[t]}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-[#2D2A26] mb-1">Title</label>
        <input type="text" value={draft.title}
          onChange={e => onChange({ ...draft, title: e.target.value, slug: draft.slug || slugify(e.target.value) })}
          className={inputClass} placeholder="e.g. Five founders changing disability support" />
      </div>

      <div>
        <label className="block text-xs font-semibold text-[#2D2A26] mb-1">Slug</label>
        <input type="text" value={draft.slug} onChange={e => set('slug', slugify(e.target.value))} className={inputClass} />
      </div>

      <div>
        <label className="block text-xs font-semibold text-[#2D2A26] mb-1">Dek <span className="font-normal text-[#9CA3AF]">— short subtitle</span></label>
        <input type="text" value={draft.dek ?? ''} onChange={e => set('dek', e.target.value || undefined)} className={inputClass} />
      </div>

      <div>
        <label className="block text-xs font-semibold text-[#2D2A26] mb-1">Cover image</label>
        <MediaUpload value={draft.coverImage} onChange={v => set('coverImage', v || undefined)} label="Upload cover" aspect="wide" />
      </div>

      <div>
        <label className="block text-xs font-semibold text-[#2D2A26] mb-1">Intro <span className="font-normal text-[#9CA3AF]">— PCM's own editorial framing, not a summary of any founder's work</span></label>
        <textarea value={draft.intro} onChange={e => set('intro', e.target.value)} rows={5} className={inputClass} />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-semibold text-[#2D2A26]">Picks</label>
          <button onClick={addPick} className="text-xs font-semibold text-[#C86A43] hover:underline">+ Add pick</button>
        </div>
        <div className="flex flex-col gap-2">
          {draft.picks.map((pick, i) => (
            <PickRow key={i} pick={pick} onChange={p => updatePick(i, p)} onRemove={() => removePick(i)} />
          ))}
          {draft.picks.length === 0 && <p className="text-xs text-[#9CA3AF]">No picks yet — every feature should reference at least one real founder or story.</p>}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-[#2D2A26] mb-1">Status</label>
        <select value={draft.status} onChange={e => set('status', e.target.value as EditorialFeature['status'])} className={inputClass}>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </div>

      <div className="flex items-center gap-3 pt-2 border-t border-[#E8E4DD]">
        <button onClick={onSave} className="px-5 py-2.5 bg-[#C86A43] text-white text-sm font-semibold rounded-lg hover:bg-[#b05a35] transition-colors">
          Save
        </button>
        <button onClick={onCancel} className="px-4 py-2.5 text-sm text-[#6B7280] hover:text-[#2D2A26] transition-colors">
          Cancel
        </button>
      </div>
    </div>
  )
}

export function CapoEditorialPage() {
  const [draft, setDraft] = useState<EditorialFeature | null>(null)
  const [items, setItems] = useState<EditorialFeature[]>(() => editorialService.getAll())
  const [saveError, setSaveError] = useState<string | null>(null)

  function refresh() {
    setItems(editorialService.getAll())
  }

  async function handleSave() {
    if (!draft) return
    if (!draft.title.trim() || !draft.slug.trim()) {
      setSaveError('Title and slug are required.')
      return
    }
    setSaveError(null)
    const result = await editorialService.upsert(draft)
    if (!result.success) {
      setSaveError(result.error ?? 'Save failed.')
      return
    }
    setDraft(null)
    refresh()
  }

  async function handleDelete(id: string) {
    await editorialService.delete(id)
    refresh()
  }

  return (
    <div className="p-8 max-w-3xl" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#2D2A26]">Editorial</h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Curated features — spotlights, roundups, collections. Always authored by Pretty Cool Marketing, always linked back to the founders and stories they reference.
          </p>
        </div>
        {!draft && (
          <button
            onClick={() => setDraft(newEditorialFeature('founder-spotlight'))}
            className="px-4 py-2.5 bg-[#C86A43] text-white text-sm font-semibold rounded-lg hover:bg-[#b05a35] transition-colors shrink-0"
          >
            + New Feature
          </button>
        )}
      </div>

      {draft && (
        <div className="mb-8">
          {saveError && <p className="text-sm text-red-600 font-medium mb-2">{saveError}</p>}
          <EditorialForm draft={draft} onChange={setDraft} onSave={() => void handleSave()} onCancel={() => setDraft(null)} />
        </div>
      )}

      {items.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E8E4DD] px-5 py-10 text-center">
          <p className="text-sm font-semibold text-[#2D2A26] mb-2">No editorial features yet</p>
          <p className="text-xs text-[#9CA3AF]">Curate a spotlight once there's a founder or story worth drawing attention to.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#E8E4DD] divide-y divide-[#F3EDE6]">
          {items.map(item => (
            <div key={item.id} className="flex items-center gap-4 px-5 py-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#2D2A26] truncate">{item.title || '(untitled)'}</p>
                <p className="text-xs text-[#9CA3AF] mt-0.5">{TEMPLATE_LABELS[item.template]} · {item.status} · {item.picks.length} pick{item.picks.length !== 1 ? 's' : ''}</p>
              </div>
              <button onClick={() => setDraft(item)} className="text-xs text-[#6B7280] hover:text-[#C86A43] transition-colors shrink-0">Edit</button>
              <ConfirmButton label="Delete" confirmLabel="Confirm" onConfirm={() => void handleDelete(item.id)} className="text-xs text-red-600 hover:underline shrink-0" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
