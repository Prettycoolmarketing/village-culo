import { useState, type ReactNode } from 'react'
import { founders } from '../../data/founders'
import { locations } from '../../data/locations'
import { industries } from '../../data/industries'
import { topics as allTopics } from '../../data/topics'
import { isSupabaseConfigured } from '../../lib/supabase'
import type { Founder, Topic } from '../../types'

// ─── Local helpers ─────────────────────────────────────────────────────────────

const inputClass =
  'w-full px-3 py-2.5 rounded-lg border border-[#E8E4DD] text-sm text-[#2D2A26] bg-white placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#C86A43]/30 focus:border-[#C86A43] transition-colors'

const selectClass =
  'w-full px-3 py-2.5 rounded-lg border border-[#E8E4DD] text-sm text-[#2D2A26] bg-white focus:outline-none focus:ring-2 focus:ring-[#C86A43]/30 focus:border-[#C86A43] transition-colors'

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-[#2D2A26] mb-1.5">{label}</label>
      {hint && <p className="text-xs text-[#9CA3AF] mb-1.5">{hint}</p>}
      {children}
    </div>
  )
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="border-t border-[#E8E4DD] pt-8 mt-8">
      <h2 className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest mb-5">{title}</h2>
    </div>
  )
}

// ─── DashboardProfilePage ──────────────────────────────────────────────────────

export function DashboardProfilePage() {
  const [draft, setDraft]   = useState<Founder>(() => ({ ...founders[0]! }))
  const [saved, setSaved]   = useState(false)
  const [saving, setSaving] = useState(false)

  function set<K extends keyof Founder>(key: K, value: Founder[K]) {
    setDraft(prev => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  function toggleTopic(topic: Topic) {
    setDraft(prev => {
      const has = prev.topics.some(t => t.id === topic.id)
      const updated = has
        ? prev.topics.filter(t => t.id !== topic.id)
        : [...prev.topics, topic]
      setSaved(false)
      return { ...prev, topics: updated }
    })
  }

  async function handleSave() {
    setSaving(true)
    await new Promise(r => setTimeout(r, 500))
    setSaving(false)
    setSaved(true)
  }

  return (
    <div className="p-8 max-w-2xl" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#2D2A26]">Profile</h1>
          <p className="text-sm text-[#6B7280] mt-1">Your public founder profile in the Village.</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && <p className="text-sm text-green-600 font-medium">Saved ✓</p>}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-[#C86A43] text-white text-sm font-semibold rounded-lg hover:bg-[#b05a35] disabled:opacity-60 transition-colors"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>

      {!isSupabaseConfigured && (
        <div className="mb-6 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-700">
          Dev mode — changes are stored in memory and reset on page refresh. Connect Supabase to persist.
        </div>
      )}

      {/* Photos */}
      <div className="flex flex-col gap-5">
        <Field label="Avatar" hint="URL to your profile photo (square, min 400×400px recommended).">
          <div className="flex gap-3 items-center">
            {draft.avatar && (
              <img src={draft.avatar} alt="" className="w-12 h-12 rounded-full object-cover shrink-0 bg-[#F3EDE6]" />
            )}
            <input
              type="url"
              value={draft.avatar}
              onChange={e => set('avatar', e.target.value)}
              className={inputClass}
              placeholder="/assets/your-headshot.jpg"
            />
          </div>
        </Field>

        <Field label="Cover Image" hint="URL to your profile cover photo (16:9 or wider recommended).">
          <div className="flex flex-col gap-2">
            {draft.coverImage && (
              <img src={draft.coverImage} alt="" className="w-full h-28 rounded-lg object-cover bg-[#F3EDE6]" />
            )}
            <input
              type="url"
              value={draft.coverImage ?? ''}
              onChange={e => set('coverImage', e.target.value || undefined)}
              className={inputClass}
              placeholder="/assets/your-cover.jpg"
            />
          </div>
        </Field>
      </div>

      <SectionHeader title="Identity" />

      <div className="flex flex-col gap-5">
        <Field label="Display Name">
          <input
            type="text"
            value={draft.name}
            onChange={e => set('name', e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Bio" hint="Shown on your founder profile page. Write in your own voice — max ~400 chars.">
          <textarea
            value={draft.bio}
            onChange={e => set('bio', e.target.value)}
            rows={5}
            className={inputClass + ' resize-y'}
          />
          <p className="text-xs text-[#9CA3AF] mt-1 text-right">{draft.bio.length} chars</p>
        </Field>
      </div>

      <SectionHeader title="Location &amp; Industry" />

      <div className="grid grid-cols-2 gap-4">
        <Field label="Location">
          <select
            value={draft.location.id}
            onChange={e => {
              const loc = locations.find(l => l.id === e.target.value)
              if (loc) set('location', loc)
            }}
            className={selectClass}
          >
            {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </Field>

        <Field label="Primary Industry">
          <select
            value={draft.industry.id}
            onChange={e => {
              const ind = industries.find(i => i.id === e.target.value)
              if (ind) set('industry', ind)
            }}
            className={selectClass}
          >
            {industries.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
        </Field>
      </div>

      <SectionHeader title="Links" />

      <div className="flex flex-col gap-4">
        <Field label="Website">
          <input
            type="url"
            value={draft.website ?? ''}
            onChange={e => set('website', e.target.value || undefined)}
            className={inputClass}
            placeholder="https://yourwebsite.com"
          />
        </Field>
        <Field label="Instagram">
          <input
            type="url"
            value={draft.instagram ?? ''}
            onChange={e => set('instagram', e.target.value || undefined)}
            className={inputClass}
            placeholder="https://instagram.com/yourhandle"
          />
        </Field>
        <Field label="LinkedIn">
          <input
            type="url"
            value={draft.linkedin ?? ''}
            onChange={e => set('linkedin', e.target.value || undefined)}
            className={inputClass}
            placeholder="https://linkedin.com/in/yourhandle"
          />
        </Field>
      </div>

      <SectionHeader title="Topics" />

      <p className="text-sm text-[#6B7280] mb-4">Select the topics your content covers. These power the Village knowledge graph.</p>
      <div className="flex flex-wrap gap-2">
        {allTopics.map(topic => {
          const active = draft.topics.some(t => t.id === topic.id)
          return (
            <button
              key={topic.id}
              onClick={() => toggleTopic(topic)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                active
                  ? 'bg-[#C86A43] text-white border-[#C86A43]'
                  : 'bg-white text-[#4B4845] border-[#E8E4DD] hover:border-[#C86A43]/50 hover:text-[#C86A43]'
              }`}
            >
              {topic.name}
            </button>
          )
        })}
      </div>

      <SectionHeader title="SEO" />

      <div className="flex flex-col gap-4">
        <Field label="SEO Title" hint="Overrides the default page title in search results.">
          <input
            type="text"
            value={draft.seoTitle ?? ''}
            onChange={e => set('seoTitle', e.target.value || undefined)}
            className={inputClass}
            placeholder="Shakas — Founder Storytelling &amp; Content Systems"
          />
        </Field>
        <Field label="SEO Description" hint="Shown in search results. Aim for 140–160 characters.">
          <textarea
            value={draft.seoDescription ?? ''}
            onChange={e => set('seoDescription', e.target.value || undefined)}
            rows={3}
            className={inputClass + ' resize-y'}
            placeholder="15+ years turning founder stories into content systems..."
          />
        </Field>
      </div>

      {/* Bottom save */}
      <div className="flex items-center justify-end gap-3 mt-10 pt-6 border-t border-[#E8E4DD]">
        {saved && <p className="text-sm text-green-600 font-medium">Saved ✓</p>}
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 bg-[#C86A43] text-white text-sm font-semibold rounded-lg hover:bg-[#b05a35] disabled:opacity-60 transition-colors"
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
