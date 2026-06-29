import { useState } from 'react'
import { Link } from 'react-router-dom'
import { parseVIF, validateVIF, importVIF } from '../../services/villageImport'
import { importBatchService } from '../../services/importBatch'
import { DEFAULT_IMPORT_OPTIONS } from '../../types/villageImport'
import type { VillageImportPackage, VIFValidationResult, VIFImportOptions, VIFImportResult } from '../../types/villageImport'

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 0 | 1 | 2 | 3

// ─── Example JSON ────────────────────────────────────────────────────────────

const EXAMPLE_JSON = `{
  "batchName": "Australian Marketing Founders — June 2026",
  "source": "claude",
  "founders": [
    {
      "fullName": "Sarah Mitchell",
      "preferredName": "Sarah Mitchell",
      "headline": "Brand strategist helping Australian businesses find their voice",
      "bio": "Sarah Mitchell has spent 15 years building brand identities for Australian small businesses. She is the founder of Mitchell & Co Brand Studio, a Brisbane-based strategy practice known for helping founders tell their story with clarity and confidence. Sarah speaks regularly at marketing conferences across Australia and hosts the Brand Honest podcast.",
      "country": "Australia",
      "state": "Queensland",
      "city": "Brisbane",
      "website": "https://sarahmitchell.com.au",
      "linkedinUrl": "https://linkedin.com/in/sarah-mitchell-branding",
      "youtubeUrl": "https://youtube.com/@sarahmitchellbrand",
      "instagramUrl": "https://instagram.com/sarahmitchellbrand",
      "podcastUrl": "https://brandhonest.com.au",
      "topics": ["Personal Brand", "Content Strategy", "Founder Storytelling"],
      "industries": ["Marketing"],
      "businesses": [
        {
          "name": "Mitchell & Co Brand Studio",
          "website": "https://mitchellandco.com.au",
          "description": "Brand strategy and identity design for Australian small businesses and founder-led companies.",
          "industry": "Marketing",
          "role": "Founder & Creative Director"
        }
      ],
      "content": [
        {
          "title": "How I Built a 7-Figure Brand Without Ads",
          "url": "https://youtube.com/watch?v=example1",
          "platform": "youtube",
          "description": "The exact organic strategy I used to build brand awareness across Australia.",
          "status": "published"
        },
        {
          "title": "The 3 Brand Mistakes Most Founders Make",
          "url": "https://sarahmitchell.com.au/brand-mistakes",
          "platform": "website",
          "description": "A deep dive into the branding errors that cost founders thousands.",
          "status": "published"
        }
      ],
      "books": [
        {
          "title": "Brand Honest",
          "url": "https://brandhonest.com.au/book",
          "description": "A practical guide to building an authentic brand for Australian founders."
        }
      ],
      "speakingTopics": ["Brand Building", "Content Marketing", "Founder Storytelling"],
      "sourceLinks": ["https://linkedin.com/in/sarah-mitchell-branding", "https://sarahmitchell.com.au"]
    }
  ]
}`

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STEP_LABELS = ['Paste', 'Preview', 'Options', 'Done']

function SectionHead({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-4">
      <p className="text-sm font-bold text-[#2D2A26]">{title}</p>
      {sub && <p className="text-xs text-[#6B7280] mt-0.5">{sub}</p>}
    </div>
  )
}

function Pill({ label, color }: { label: string; color: 'blue' | 'green' | 'amber' | 'red' | 'neutral' }) {
  const cls = {
    blue:    'bg-blue-50 text-blue-700',
    green:   'bg-[#5E6B4A]/10 text-[#5E6B4A]',
    amber:   'bg-amber-50 text-amber-700',
    red:     'bg-red-50 text-red-600',
    neutral: 'bg-[#F3EDE6] text-[#6B7280]',
  }[color]
  return (
    <span className={`inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${cls}`}>
      {label}
    </span>
  )
}

function OptionToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className={`flex items-start gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-colors ${
      checked ? 'border-[#C86A43] bg-[#C86A43]/5' : 'border-[#E8E4DD] bg-white hover:border-[#C86A43]/40'
    }`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="mt-0.5 accent-[#C86A43]"
      />
      <div>
        <p className="text-sm font-semibold text-[#2D2A26]">{label}</p>
        <p className="text-xs text-[#6B7280] mt-0.5">{description}</p>
      </div>
    </label>
  )
}

// ─── Bulk Import Page ─────────────────────────────────────────────────────────

export function DashboardBulkImportPage() {
  const [step, setStep]         = useState<Step>(0)
  const [raw, setRaw]           = useState('')
  const [parseError, setParseError] = useState<string | null>(null)
  const [pkg, setPkg]           = useState<VillageImportPackage | null>(null)
  const [validation, setValidation] = useState<VIFValidationResult | null>(null)
  const [options, setOptions]   = useState<VIFImportOptions>(DEFAULT_IMPORT_OPTIONS)
  const [result, setResult]     = useState<VIFImportResult | null>(null)
  const [exampleOpen, setExampleOpen] = useState(false)
  const [copied, setCopied]     = useState<string | null>(null)

  // ── Copy helper ───────────────────────────────────────────────────────────

  async function copyText(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      setTimeout(() => setCopied(null), 2000)
    } catch { /* ignore */ }
  }

  // ── Step 0 → Validate ────────────────────────────────────────────────────

  function handleValidate() {
    setParseError(null)
    const { pkg: parsed, error } = parseVIF(raw.trim())
    if (error || !parsed) {
      setParseError(error ?? 'Unknown parse error')
      return
    }
    const val = validateVIF(parsed)
    setPkg(parsed)
    setValidation(val)
    setStep(1)
  }

  // ── Step 2 → Import ──────────────────────────────────────────────────────

  function handleImport() {
    if (!pkg) return
    const res = importVIF(pkg, options)
    importBatchService.save({
      batchName:        pkg.batchName,
      source:           pkg.source,
      founderCount:     pkg.founders.length,
      created:          res.created.length,
      skipped:          res.skipped.length,
      errored:          res.errors.length,
      businessesCreated: res.businessesCreated,
      contentCreated:   res.contentCreated,
      intelGenerated:   res.intelGenerated,
    })
    setResult(res)
    setStep(3)
  }

  // ── Reset ────────────────────────────────────────────────────────────────

  function reset() {
    setStep(0); setRaw(''); setParseError(null); setPkg(null)
    setValidation(null); setOptions(DEFAULT_IMPORT_OPTIONS); setResult(null)
  }

  // ── Outreach message ─────────────────────────────────────────────────────

  const origin = typeof window !== 'undefined' ? window.location.origin : ''

  function outreachMsg(name: string, slug: string) {
    const profileUrl = `${origin}/founders/${slug}`
    const claimUrl   = `${origin}/claim/${slug}`
    return `Hi ${name}!\n\nI came across your work and added you to CULO Village — a curated directory of Australian founder stories and businesses.\n\nYour public profile is live here: ${profileUrl}\n\nIf you'd like to claim it, edit your details, or start creating content with CULO, you can do that here: ${claimUrl}\n\nIt's completely free to claim. Happy to help you get set up — let me know!`
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="p-8 max-w-4xl" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link to="/dashboard/curated-profiles" className="text-[#9CA3AF] hover:text-[#C86A43] transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-2xl font-bold text-[#2D2A26]">Bulk Import</h1>
          </div>
          <p className="text-sm text-[#6B7280]">
            Paste a Village Import Format (VIF) JSON file to import multiple founders at once.
          </p>
        </div>
        {step < 3 && (
          <span className="flex-shrink-0 text-xs text-[#9CA3AF] mt-1">
            Village Import Format v1
          </span>
        )}
      </div>

      {/* Step indicator */}
      {step < 3 && (
        <div className="flex items-center gap-0 mb-8">
          {STEP_LABELS.slice(0, 3).map((label, i) => (
            <div key={label} className="flex items-center">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                i === step
                  ? 'bg-[#C86A43] text-white'
                  : i < step
                    ? 'bg-[#5E6B4A]/15 text-[#5E6B4A]'
                    : 'bg-[#F3EDE6] text-[#9CA3AF]'
              }`}>
                <span className="flex items-center justify-center w-4 h-4 rounded-full bg-white/20 text-[10px] font-bold">
                  {i < step ? '✓' : i + 1}
                </span>
                {label}
              </div>
              {i < 2 && <div className={`w-6 h-px mx-1 ${i < step ? 'bg-[#5E6B4A]/30' : 'bg-[#E8E4DD]'}`} />}
            </div>
          ))}
        </div>
      )}

      {/* ── Step 0: Paste JSON ──────────────────────────────────────────────── */}
      {step === 0 && (
        <div className="space-y-4">

          {/* Example format */}
          <div className="bg-white rounded-xl border border-[#E8E4DD] overflow-hidden">
            <button
              type="button"
              onClick={() => setExampleOpen(o => !o)}
              className="w-full flex items-center justify-between px-5 py-3.5 text-sm font-semibold text-[#2D2A26] hover:bg-[#F8F5F0] transition-colors"
            >
              <span>Village Import Format — Example JSON</span>
              <span className="text-[#9CA3AF] text-xs font-normal">
                {exampleOpen ? '▲ Collapse' : '▼ Expand'}
              </span>
            </button>
            {exampleOpen && (
              <div className="border-t border-[#E8E4DD]">
                <div className="flex items-center justify-between px-5 py-2.5 bg-[#F8F5F0]">
                  <p className="text-[10px] text-[#9CA3AF] font-semibold uppercase tracking-wide">VIF JSON Schema Example</p>
                  <button
                    onClick={() => copyText(EXAMPLE_JSON, 'example')}
                    className={`text-xs font-semibold px-3 py-1 rounded-lg transition-colors ${
                      copied === 'example'
                        ? 'bg-[#5E6B4A] text-white'
                        : 'bg-white border border-[#E8E4DD] text-[#C86A43] hover:bg-[#C86A43] hover:text-white'
                    }`}
                  >
                    {copied === 'example' ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
                <pre className="text-[11px] text-[#4B4845] leading-relaxed px-5 py-4 overflow-x-auto font-mono bg-white max-h-80 overflow-y-auto">
                  {EXAMPLE_JSON}
                </pre>
              </div>
            )}
          </div>

          {/* Textarea */}
          <div>
            <label className="block text-xs font-semibold text-[#2D2A26] mb-2">
              Paste Village Import Format JSON
            </label>
            <textarea
              className="w-full px-4 py-3.5 rounded-xl border border-[#E8E4DD] text-xs font-mono text-[#2D2A26] focus:outline-none focus:border-[#C86A43] bg-white placeholder:text-[#9CA3AF] resize-y"
              rows={14}
              placeholder={`{\n  "batchName": "My Founder Batch",\n  "source": "claude",\n  "founders": [...]\n}`}
              value={raw}
              onChange={e => { setRaw(e.target.value); setParseError(null) }}
              spellCheck={false}
            />
          </div>

          {parseError && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
              </svg>
              <p className="text-xs text-red-700 font-mono">{parseError}</p>
            </div>
          )}

          {/* Ethics notice */}
          <div className="bg-[#F8F5F0] rounded-xl px-4 py-3">
            <p className="text-xs text-[#6B7280] leading-relaxed">
              All imported profiles default to <strong>Village Curated</strong> and show a claim banner. Original source links are preserved. Village never claims ownership of the founder's content.
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleValidate}
              disabled={!raw.trim()}
              className="px-6 py-2.5 bg-[#C86A43] text-white text-sm font-semibold rounded-xl hover:bg-[#b05a35] transition-colors disabled:opacity-40"
            >
              Validate JSON →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 1: Preview ──────────────────────────────────────────────────── */}
      {step === 1 && validation && pkg && (
        <div className="space-y-5">

          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Founders',      value: validation.founderCount,   color: 'text-[#C86A43]' },
              { label: 'Businesses',    value: validation.totalBusinesses, color: 'text-[#5E6B4A]' },
              { label: 'Content Links', value: validation.totalContent,    color: 'text-blue-700'  },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl border border-[#E8E4DD] px-4 py-3">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-[#9CA3AF] mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Batch name */}
          <div className="bg-white rounded-xl border border-[#E8E4DD] px-5 py-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Batch</p>
              <p className="text-sm font-semibold text-[#2D2A26] mt-0.5">{pkg.batchName}</p>
            </div>
            {pkg.source && <Pill label={pkg.source} color="neutral" />}
          </div>

          {/* Global errors */}
          {validation.globalErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4">
              <p className="text-xs font-bold text-red-700 mb-2">Errors — fix before importing</p>
              {validation.globalErrors.map((e, i) => (
                <p key={i} className="text-xs text-red-600">• {e}</p>
              ))}
            </div>
          )}

          {/* Global warnings */}
          {validation.globalWarnings.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
              <p className="text-xs font-bold text-amber-700 mb-2">Warnings</p>
              {validation.globalWarnings.map((w, i) => (
                <p key={i} className="text-xs text-amber-700">• {w}</p>
              ))}
            </div>
          )}

          {/* Founder preview table */}
          <div>
            <SectionHead title="Founder Preview" sub="Review each founder before importing." />
            <div className="bg-white rounded-xl border border-[#E8E4DD] divide-y divide-[#F3EDE6] overflow-hidden">
              <div className="grid grid-cols-12 gap-3 px-5 py-2.5 bg-[#F8F5F0]">
                <p className="col-span-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Founder</p>
                <p className="col-span-3 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Slug</p>
                <p className="col-span-2 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide text-center">Bizs</p>
                <p className="col-span-2 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide text-center">Links</p>
                <p className="col-span-2 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Status</p>
              </div>
              {validation.founders.map(f => (
                <div key={f.index} className="px-5 py-3.5">
                  <div className="grid grid-cols-12 gap-3 items-center mb-1.5">
                    <p className="col-span-3 text-sm font-semibold text-[#2D2A26] truncate">{f.displayName}</p>
                    <p className="col-span-3 text-xs font-mono text-[#6B7280] truncate">/{f.resolvedSlug}</p>
                    <p className="col-span-2 text-sm text-center text-[#2D2A26] font-semibold">{f.businessCount}</p>
                    <p className="col-span-2 text-sm text-center text-[#2D2A26] font-semibold">{f.contentCount}</p>
                    <div className="col-span-2 flex flex-wrap gap-1">
                      {f.isDuplicate
                        ? <Pill label="Duplicate" color="amber" />
                        : <Pill label="New" color="green" />
                      }
                      {f.errors.length > 0 && <Pill label="Error" color="red" />}
                    </div>
                  </div>
                  {(f.errors.length > 0 || f.warnings.length > 0) && (
                    <div className="space-y-0.5 ml-1">
                      {f.errors.map((e, i) => (
                        <p key={i} className="text-[11px] text-red-600">✗ {e}</p>
                      ))}
                      {f.warnings.map((w, i) => (
                        <p key={i} className="text-[11px] text-amber-600">⚠ {w}</p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {!validation.isValid && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-3">
              <p className="text-xs text-red-700">Fix the errors above before importing. Warnings won't block the import.</p>
            </div>
          )}
        </div>
      )}

      {/* ── Step 2: Import Options ───────────────────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-4">
          <SectionHead
            title="Import Options"
            sub="Configure how the import runs. These apply to all founders in this batch."
          />

          <OptionToggle
            label="Publish content immediately"
            description="Imported content links will be marked as published and visible on public profiles. Uncheck to save as draft."
            checked={options.publishContent}
            onChange={v => setOptions(o => ({ ...o, publishContent: v }))}
          />
          <OptionToggle
            label="Run Village Intelligence"
            description="Automatically generate Village Intelligence records for published content. Recommended."
            checked={options.runIntelligence}
            onChange={v => setOptions(o => ({ ...o, runIntelligence: v }))}
          />
          <OptionToggle
            label="Create linked businesses"
            description="Create Business records for any businesses included in the JSON and link them to the founder."
            checked={options.createBusinesses}
            onChange={v => setOptions(o => ({ ...o, createBusinesses: v }))}
          />

          <div className="bg-white rounded-xl border border-[#E8E4DD] p-4 space-y-3">
            <p className="text-xs font-bold text-[#2D2A26]">Duplicate handling</p>
            <OptionToggle
              label="Skip duplicates (recommended)"
              description="If a founder with the same slug already exists in Village, skip them and leave the existing record unchanged."
              checked={options.skipDuplicates}
              onChange={v => setOptions(o => ({ ...o, skipDuplicates: v, overwriteDuplicates: v ? false : o.overwriteDuplicates }))}
            />
            <OptionToggle
              label="Overwrite duplicates"
              description="Replace existing founder records with data from this import. Use carefully — this will overwrite any manual edits."
              checked={options.overwriteDuplicates}
              onChange={v => setOptions(o => ({ ...o, overwriteDuplicates: v, skipDuplicates: v ? false : o.skipDuplicates }))}
            />
          </div>

          <div className="bg-[#F8F5F0] rounded-xl px-4 py-3">
            <p className="text-xs text-[#6B7280] leading-relaxed">
              All imported founders will be marked <strong>Village Curated</strong> and show a visible claim banner on their public profile. Original source links are preserved. Village does not claim ownership.
            </p>
          </div>
        </div>
      )}

      {/* ── Step 3: Results ─────────────────────────────────────────────────── */}
      {step === 3 && result && (
        <div className="space-y-5">

          {/* Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Founders Created', value: result.created.length, color: 'text-[#C86A43]' },
              { label: 'Skipped', value: result.skipped.length, color: 'text-[#9CA3AF]' },
              { label: 'Businesses Created', value: result.businessesCreated, color: 'text-[#5E6B4A]' },
              { label: 'Content Saved', value: result.contentCreated, color: 'text-blue-700' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl border border-[#E8E4DD] px-4 py-3">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-[#9CA3AF] mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {result.intelGenerated > 0 && (
            <div className="flex items-center gap-2.5 bg-[#5E6B4A]/10 border border-[#5E6B4A]/20 rounded-xl px-4 py-2.5">
              <svg className="w-4 h-4 text-[#5E6B4A] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs font-semibold text-[#5E6B4A]">
                Village Intelligence generated for {result.intelGenerated} published {result.intelGenerated === 1 ? 'item' : 'items'}
              </p>
            </div>
          )}

          {/* Import errors */}
          {result.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4">
              <p className="text-xs font-bold text-red-700 mb-2">Import errors</p>
              {result.errors.map((e, i) => (
                <p key={i} className="text-xs text-red-600">✗ {e.name}: {e.error}</p>
              ))}
            </div>
          )}

          {/* Skipped */}
          {result.skipped.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3">
              <p className="text-xs font-bold text-amber-700 mb-1.5">Skipped (duplicate slugs)</p>
              <p className="text-xs text-amber-700">{result.skipped.join(', ')}</p>
            </div>
          )}

          {/* Created founders list */}
          {result.created.length > 0 && (
            <div>
              <SectionHead title="Imported Founders" sub="Copy profile URLs or outreach messages for each founder." />
              <div className="space-y-3">
                {result.created.map(f => {
                  const profileUrl = `${origin}/founders/${f.slug}`
                  const claimUrl   = `${origin}/claim/${f.slug}`
                  const msgKey     = `outreach-${f.id}`
                  const profKey    = `profile-${f.id}`
                  const claimKey   = `claim-${f.id}`

                  return (
                    <div key={f.id} className="bg-white rounded-xl border border-[#E8E4DD] overflow-hidden">
                      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#F3EDE6]">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#F3EDE6] flex items-center justify-center text-[#C86A43] text-sm font-bold flex-shrink-0">
                            {f.name[0]}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[#2D2A26]">{f.name}</p>
                            <p className="text-[10px] text-[#9CA3AF] font-mono">/founders/{f.slug}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href={profileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-[#9CA3AF] hover:text-[#C86A43] transition-colors"
                          >
                            View ↗
                          </a>
                          <Pill label="Village Curated" color="blue" />
                        </div>
                      </div>
                      <div className="px-5 py-3 flex flex-wrap gap-2">
                        <button
                          onClick={() => copyText(profileUrl, profKey)}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                            copied === profKey
                              ? 'bg-[#5E6B4A] text-white'
                              : 'bg-[#F3EDE6] text-[#C86A43] hover:bg-[#C86A43] hover:text-white'
                          }`}
                        >
                          {copied === profKey ? '✓ Copied' : 'Copy Profile URL'}
                        </button>
                        <button
                          onClick={() => copyText(claimUrl, claimKey)}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                            copied === claimKey
                              ? 'bg-[#5E6B4A] text-white'
                              : 'bg-[#F3EDE6] text-[#C86A43] hover:bg-[#C86A43] hover:text-white'
                          }`}
                        >
                          {copied === claimKey ? '✓ Copied' : 'Copy Claim URL'}
                        </button>
                        <button
                          onClick={() => copyText(outreachMsg(f.name, f.slug), msgKey)}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                            copied === msgKey
                              ? 'bg-[#5E6B4A] text-white'
                              : 'bg-white border border-[#E8E4DD] text-[#6B7280] hover:border-[#C86A43] hover:text-[#C86A43]'
                          }`}
                        >
                          {copied === msgKey ? '✓ Copied' : 'Copy LinkedIn Outreach'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Ethics */}
          <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
            <svg className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <p className="text-xs text-blue-700 leading-relaxed">
              All profiles are marked <strong>Village Curated</strong> with a visible claim banner. Original source links are preserved. Village does not claim ownership of any content.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={reset}
              className="px-5 py-2.5 bg-[#C86A43] text-white text-sm font-semibold rounded-xl hover:bg-[#b05a35] transition-colors"
            >
              Import another batch
            </button>
            <Link
              to="/dashboard/curated-profiles"
              className="px-5 py-2.5 bg-[#F3EDE6] text-[#C86A43] text-sm font-semibold rounded-xl hover:bg-[#C86A43] hover:text-white transition-colors"
            >
              View Curated Profiles
            </Link>
          </div>
        </div>
      )}

      {/* ── Navigation ──────────────────────────────────────────────────────── */}
      {step < 3 && (
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-[#E8E4DD]">
          <button
            type="button"
            onClick={() => { setStep(s => Math.max(0, s - 1) as Step) }}
            disabled={step === 0}
            className="px-5 py-2.5 text-sm font-medium text-[#6B7280] hover:text-[#2D2A26] transition-colors disabled:opacity-30"
          >
            ← Back
          </button>

          {step === 0 && (
            <button
              type="button"
              onClick={handleValidate}
              disabled={!raw.trim()}
              className="px-6 py-2.5 bg-[#C86A43] text-white text-sm font-semibold rounded-xl hover:bg-[#b05a35] transition-colors disabled:opacity-40"
            >
              Validate JSON →
            </button>
          )}

          {step === 1 && (
            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={!validation?.isValid}
              className="px-6 py-2.5 bg-[#C86A43] text-white text-sm font-semibold rounded-xl hover:bg-[#b05a35] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Configure Import →
            </button>
          )}

          {step === 2 && (
            <button
              type="button"
              onClick={handleImport}
              className="px-6 py-2.5 bg-[#C86A43] text-white text-sm font-semibold rounded-xl hover:bg-[#b05a35] transition-colors"
            >
              Import {validation?.founderCount ?? ''} Founders ✓
            </button>
          )}
        </div>
      )}
    </div>
  )
}
