import { useState, type ReactNode } from 'react'
import { businesses as allBusinesses } from '../../data/businesses'
import { locations } from '../../data/locations'
import { industries } from '../../data/industries'
import { isSupabaseConfigured } from '../../lib/supabase'
import type { Business } from '../../types'

// ─── Local helpers ─────────────────────────────────────────────────────────────

const inputClass =
  'w-full px-3 py-2.5 rounded-lg border border-[#E8E4DD] text-sm text-[#2D2A26] bg-white placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#C86A43]/30 focus:border-[#C86A43] transition-colors'

const selectClass =
  'w-full px-3 py-2.5 rounded-lg border border-[#E8E4DD] text-sm text-[#2D2A26] bg-white focus:outline-none focus:ring-2 focus:ring-[#C86A43]/30 focus:border-[#C86A43] transition-colors'

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-[#6B7280] mb-1">{label}</label>
      {children}
    </div>
  )
}

// ─── BusinessEditForm ──────────────────────────────────────────────────────────

function BusinessEditForm({
  biz,
  onSave,
  onCancel,
}: {
  biz: Business
  onSave: (updated: Business) => void
  onCancel: () => void
}) {
  const [draft, setDraft] = useState<Business>({ ...biz })
  const [saving, setSaving] = useState(false)

  function set<K extends keyof Business>(key: K, value: Business[K]) {
    setDraft(prev => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    setSaving(true)
    await new Promise(r => setTimeout(r, 400))
    setSaving(false)
    onSave(draft)
  }

  return (
    <div className="mt-4 p-5 rounded-xl bg-[#F8F5F0] border border-[#E8E4DD] flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Name">
          <input type="text" value={draft.name} onChange={e => set('name', e.target.value)} className={inputClass} />
        </Field>
        <Field label="Tagline">
          <input type="text" value={draft.tagline} onChange={e => set('tagline', e.target.value)} className={inputClass} />
        </Field>
      </div>

      <Field label="Description">
        <textarea
          value={draft.description}
          onChange={e => set('description', e.target.value)}
          rows={4}
          className={inputClass + ' resize-y'}
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Logo URL">
          <div className="flex gap-2 items-center">
            {draft.logo && <img src={draft.logo} alt="" className="w-8 h-8 rounded object-cover shrink-0 bg-[#E8E4DD]" />}
            <input type="url" value={draft.logo} onChange={e => set('logo', e.target.value)} className={inputClass} />
          </div>
        </Field>
        <Field label="Cover Image URL">
          <input type="url" value={draft.coverImage} onChange={e => set('coverImage', e.target.value)} className={inputClass} />
        </Field>
      </div>

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
        <Field label="Industry">
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

      <div className="grid grid-cols-3 gap-4">
        <Field label="Website">
          <input type="url" value={draft.website ?? ''} onChange={e => set('website', e.target.value || undefined)} className={inputClass} placeholder="https://" />
        </Field>
        <Field label="Instagram">
          <input type="url" value={draft.instagram ?? ''} onChange={e => set('instagram', e.target.value || undefined)} className={inputClass} placeholder="https://instagram.com/" />
        </Field>
        <Field label="LinkedIn">
          <input type="url" value={draft.linkedin ?? ''} onChange={e => set('linkedin', e.target.value || undefined)} className={inputClass} placeholder="https://linkedin.com/" />
        </Field>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#E8E4DD]">
        <button onClick={onCancel} className="px-4 py-2 text-sm text-[#6B7280] hover:text-[#2D2A26] transition-colors">Cancel</button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-[#C86A43] text-white text-sm font-semibold rounded-lg hover:bg-[#b05a35] disabled:opacity-60 transition-colors"
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}

// ─── DashboardBusinessesPage ───────────────────────────────────────────────────

export function DashboardBusinessesPage() {
  const [bizList, setBizList]   = useState<Business[]>([...allBusinesses])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [savedId,   setSavedId]   = useState<string | null>(null)

  function handleSave(updated: Business) {
    setBizList(prev => prev.map(b => b.id === updated.id ? updated : b))
    setEditingId(null)
    setSavedId(updated.id)
    setTimeout(() => setSavedId(null), 3000)
  }

  return (
    <div className="p-8 max-w-3xl" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#2D2A26]">Businesses</h1>
          <p className="text-sm text-[#6B7280] mt-1">{bizList.length} businesses in the Village</p>
        </div>
      </div>

      {!isSupabaseConfigured && (
        <div className="mb-6 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-700">
          Dev mode — changes are stored in memory and reset on page refresh. Connect Supabase to persist.
        </div>
      )}

      <div className="flex flex-col gap-3">
        {bizList.map(biz => (
          <div key={biz.id} className="bg-white rounded-xl border border-[#E8E4DD]">
            <div className="flex items-center gap-4 px-5 py-4">
              <img src={biz.logo} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0 bg-[#F3EDE6]" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#2D2A26] truncate">{biz.name}</p>
                <p className="text-xs text-[#9CA3AF] mt-0.5 truncate">{biz.tagline}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {savedId === biz.id && (
                  <span className="text-xs text-green-600 font-medium">Saved ✓</span>
                )}
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  biz.status === 'published' || biz.status === 'featured'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-[#F3EDE6] text-[#9CA3AF]'
                }`}>
                  {biz.status}
                </span>
                <a
                  href={`/businesses/${biz.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#9CA3AF] hover:text-[#C86A43] transition-colors px-1"
                  title="View on site"
                >
                  ↗
                </a>
                <button
                  onClick={() => setEditingId(editingId === biz.id ? null : biz.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    editingId === biz.id
                      ? 'border-[#C86A43] text-[#C86A43] bg-[#C86A43]/5'
                      : 'border-[#E8E4DD] text-[#6B7280] hover:border-[#C86A43]/50 hover:text-[#C86A43]'
                  }`}
                >
                  {editingId === biz.id ? 'Close' : 'Edit'}
                </button>
              </div>
            </div>

            {editingId === biz.id && (
              <div className="px-5 pb-5">
                <BusinessEditForm
                  biz={biz}
                  onSave={handleSave}
                  onCancel={() => setEditingId(null)}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
