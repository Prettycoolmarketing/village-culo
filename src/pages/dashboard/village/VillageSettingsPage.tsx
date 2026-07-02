import { useState } from 'react'
import { Link } from 'react-router-dom'
import { villageSettingsService } from '../../../services/villageSettings'

const INPUT_CLS = 'w-full px-3 py-2.5 rounded-xl border border-[#E8E4DD] text-sm text-[#2D2A26] focus:outline-none focus:border-[#C86A43] bg-white placeholder:text-[#9CA3AF]'

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[#2D2A26] mb-1">{label}</label>
      {children}
      {hint && <p className="text-[10px] text-[#9CA3AF] mt-1">{hint}</p>}
    </div>
  )
}

export function VillageSettingsPage() {
  const saved = villageSettingsService.get()
  const [settings, setSettings] = useState(saved)
  const [saved_, setSaved_]     = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  function update(key: keyof typeof settings, val: string) {
    setSettings(s => ({ ...s, [key]: val }))
    setSaved_(false)
  }

  async function handleSave() {
    setSaveError(null)
    const result = await villageSettingsService.save(settings)
    if (result.success) {
      setSaved_(true)
      setTimeout(() => setSaved_(false), 3000)
    } else {
      setSaveError(result.error ?? 'Save failed. Please try again.')
    }
  }

  async function handleReset() {
    setSaveError(null)
    const result = await villageSettingsService.reset()
    if (result.success) {
      setSettings(villageSettingsService.get())
      setSaved_(false)
    } else {
      setSaveError(result.error ?? 'Reset failed. Please try again.')
    }
  }


  return (
    <div className="p-8 max-w-3xl" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      <div className="mb-8">
        <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-widest mb-1">CAPO</p>
        <h1 className="text-2xl font-bold text-[#2D2A26]">Village Settings</h1>
        <p className="text-sm text-[#6B7280] mt-0.5">Configure global defaults for CULO Village.</p>
      </div>

      {/* Village identity */}
      <section className="mb-8">
        <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest mb-4">Village Identity</p>
        <div className="space-y-4 bg-white rounded-xl border border-[#E8E4DD] p-5">
          <Field label="Village Name">
            <input className={INPUT_CLS} value={settings.villageName} onChange={e => update('villageName', e.target.value)} />
          </Field>
          <Field label="Village Description" hint="Used in SEO and structured data.">
            <textarea className={INPUT_CLS} rows={2} value={settings.villageDescription} onChange={e => update('villageDescription', e.target.value)} />
          </Field>
          <Field label="Footer Text">
            <input className={INPUT_CLS} value={settings.footerText} onChange={e => update('footerText', e.target.value)} />
          </Field>
        </div>
      </section>

      {/* Curation defaults */}
      <section className="mb-8">
        <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest mb-4">Curation Defaults</p>
        <div className="space-y-4 bg-white rounded-xl border border-[#E8E4DD] p-5">
          <Field
            label="Default Claim Text"
            hint="Shown on curated profile banners before a founder claims their profile."
          >
            <textarea
              className={INPUT_CLS}
              rows={3}
              value={settings.defaultClaimText}
              onChange={e => update('defaultClaimText', e.target.value)}
            />
          </Field>
          <Field
            label="Default Ethics Text"
            hint="Shown on import confirmation and profile footers."
          >
            <textarea
              className={INPUT_CLS}
              rows={2}
              value={settings.defaultEthicsText}
              onChange={e => update('defaultEthicsText', e.target.value)}
            />
          </Field>
          <Field label="Default CTA" hint="Primary call-to-action for founders discovering the Village.">
            <input className={INPUT_CLS} value={settings.defaultCTA} onChange={e => update('defaultCTA', e.target.value)} />
          </Field>
          <Field label="Create with CULO — Default Text">
            <input className={INPUT_CLS} value={settings.createWithCuloDefaultText} onChange={e => update('createWithCuloDefaultText', e.target.value)} />
          </Field>
        </div>
      </section>

      {/* SEO defaults */}
      <section className="mb-8">
        <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest mb-4">SEO Defaults</p>
        <div className="space-y-4 bg-white rounded-xl border border-[#E8E4DD] p-5">
          <Field label="Default SEO Title">
            <input className={INPUT_CLS} value={settings.seoDefaultTitle} onChange={e => update('seoDefaultTitle', e.target.value)} />
          </Field>
          <Field label="Default SEO Description">
            <textarea className={INPUT_CLS} rows={2} value={settings.seoDefaultDescription} onChange={e => update('seoDefaultDescription', e.target.value)} />
          </Field>
          <Field label="Default Open Graph Image URL" hint="Used as fallback og:image when a page has no cover image.">
            <input className={INPUT_CLS} placeholder="/placeholders/village-cover.svg" value={settings.ogDefaultImage} onChange={e => update('ogDefaultImage', e.target.value)} />
          </Field>
          <Field label="Default Featured Image URL" hint="Fallback image for featured content cards.">
            <input className={INPUT_CLS} placeholder="/placeholders/village-cover.svg" value={settings.defaultFeaturedImage} onChange={e => update('defaultFeaturedImage', e.target.value)} />
          </Field>
        </div>
      </section>

      {/* Permission roles — now real, enforced at the route level (see utils/permissions.ts) */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest">Permission Roles</p>
        </div>
        <div className="bg-white rounded-xl border border-[#E8E4DD] px-5 py-4">
          <p className="text-sm text-[#2D2A26] mb-1">Manage who has staff access from the Team page.</p>
          <p className="text-xs text-[#9CA3AF] mb-3">Assign roles to existing accounts, suspend access, or remove staff entirely. Owner-only.</p>
          <Link to="/dashboard/village/team" className="inline-flex px-4 py-2 bg-[#C86A43] text-white text-sm font-semibold rounded-lg hover:bg-[#b05a35] transition-colors">
            Go to Team →
          </Link>
        </div>
      </section>

      {/* Save */}
      <div className="flex items-center gap-4 pt-4 border-t border-[#E8E4DD]">
        <button
          onClick={handleSave}
          className={`px-6 py-2.5 text-sm font-semibold rounded-xl transition-colors ${
            saved_
              ? 'bg-[#5E6B4A] text-white'
              : 'bg-[#C86A43] text-white hover:bg-[#b05a35]'
          }`}
        >
          {saved_ ? '✓ Saved' : 'Save Settings'}
        </button>
        <button
          onClick={handleReset}
          className="px-4 py-2.5 text-sm text-[#9CA3AF] hover:text-[#2D2A26] transition-colors"
        >
          Reset to defaults
        </button>
        {saveError && <p className="text-sm text-red-600 font-medium">{saveError}</p>}
      </div>
    </div>
  )
}
