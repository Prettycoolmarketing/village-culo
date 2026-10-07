import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { parseVIF, validateVIF, importVIF } from '../../services/villageImport'
import { importBatchService } from '../../services/importBatch'
import { DEFAULT_IMPORT_OPTIONS } from '../../types/villageImport'
import type { VillageImportPackage, VIFValidationResult, VIFImportOptions, VIFImportResult } from '../../types/villageImport'
import { useAuth } from '../../contexts/AuthContext'
import { getFounder, deleteFounderAccount, updateFounder } from '../../services/founders'
import { ConfirmButton } from '../../components/ui/ConfirmButton'
import { FounderEditModal, EditorialResearchPanel } from '../../components/dashboard/FounderEditModal'
import { runFounderResearch } from '../../services/editorialResearch'
import { writeProfileBio, writeSourceArticle, runAudit, approveAllPassing, getAllEditorialItems, pipelineStage, type EditorialItemRow } from '../../services/editorialItems'
import { importedContentService, buildDraftImport } from '../../services/importedContent'
import { normalizeBlogSpacing } from '../../utils/blogFormatting'
import { convertSpreadsheetToVIF } from '../../services/spreadsheetImport'
import type { Founder } from '../../types'

// Nobody's got a "name" field in the system today — email is all a staff
// account carries (see AuthUser) — so this is derived, not stored: the part
// of the email before the @, first letter capitalised. Good enough to tell
// "Shakas" from "Gia" in an import history list, which is the whole point.
function staffDisplayName(email?: string): string | undefined {
  if (!email) return undefined
  const local = email.split('@')[0]?.split(/[.+_-]/)[0]
  if (!local) return undefined
  return local[0]!.toUpperCase() + local.slice(1).toLowerCase()
}

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
  const { user } = useAuth()
  const curatorName = staffDisplayName(user?.email)
  const [step, setStep]         = useState<Step>(0)
  const [raw, setRaw]           = useState('')
  const [parseError, setParseError] = useState<string | null>(null)
  const [pkg, setPkg]           = useState<VillageImportPackage | null>(null)
  const [validation, setValidation] = useState<VIFValidationResult | null>(null)
  const [options, setOptions]   = useState<VIFImportOptions>(DEFAULT_IMPORT_OPTIONS)
  const [result, setResult]     = useState<VIFImportResult | null>(null)
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [exampleOpen, setExampleOpen] = useState(false)
  const [copied, setCopied]     = useState<string | null>(null)
  const [editingFounder, setEditingFounder] = useState<Founder | null>(null)
  const [deletedIds, setDeletedIds]         = useState<Set<string>>(new Set())
  const [resultTick, setResultTick]         = useState(0)
  // Status pill per row ("Researching…", "Written — awaiting audit", etc.)
  // so staff can see where each founder sits without expanding anything.
  // Re-fetched whenever resultTick bumps (every write/audit/publish action
  // already bumps it), so it stays live while a background pipeline run
  // works through the list.
  const [editorialItemsAll, setEditorialItemsAll] = useState<EditorialItemRow[]>([])
  const [editorialItemsLoaded, setEditorialItemsLoaded] = useState(-1)
  if (editorialItemsLoaded !== resultTick) {
    setEditorialItemsLoaded(resultTick)
    void getAllEditorialItems().then(setEditorialItemsAll)
  }
  // Defaults on — the whole point of importing a batch through the
  // editorial engine rather than the old deterministic templates is real,
  // researched content, so that should be the normal path, not something
  // staff have to remember to opt into every time. Still just a checkbox:
  // actually running it still needs the explicit button on the results
  // screen (see handleRunEditorialPipeline).
  const [createEditorialContent, setCreateEditorialContent] = useState(true)
  const [pipelineRunning, setPipelineRunning] = useState(false)
  const [pipelineProgress, setPipelineProgress] = useState<{ done: number; total: number; note: string } | null>(null)
  const [pipelineDone, setPipelineDone]     = useState(false)
  // Which founders the pipeline button runs on — defaults to everyone just
  // imported (set the moment results land, see handleImport), but staff
  // can uncheck any they don't want to spend on right now, or use the
  // per-row "Run" button to fire just one at a time.
  const [selectedForPipeline, setSelectedForPipeline] = useState<Set<string>>(new Set())
  const [pipelineDraftIds, setPipelineDraftIds] = useState<string[]>([])
  const [approvingAllDrafts, setApprovingAllDrafts] = useState(false)

  async function handleDeleteImported(id: string) {
    const result = await deleteFounderAccount(id)
    if (result.success) setDeletedIds(prev => new Set(prev).add(id))
  }
  const [fileName, setFileName] = useState<string | null>(null)
  const [pasteOpen, setPasteOpen] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)
  const [converting, setConverting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── File upload — the normal path. Reads the .json Claude/ChatGPT/Sellable
  // produced straight off disk instead of asking staff to open it and paste
  // the contents in by hand. A .csv skips the "ask Claude elsewhere, paste
  // the JSON back in" step entirely — the raw spreadsheet goes straight to
  // the convert-spreadsheet-to-vif edge function, which does the column
  // mapping itself; everything from here on (Validate, Import) runs on the
  // result exactly like a hand-built VIF JSON file would.
  function handleFile(file: File) {
    setFileError(null)
    const isJson = file.name.toLowerCase().endsWith('.json')
    const isCsv = file.name.toLowerCase().endsWith('.csv')
    if (!isJson && !isCsv) {
      setFileError('That doesn\'t look like a .json or .csv file.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : ''
      if (isJson) {
        setFileName(file.name)
        setRaw(text)
        setParseError(null)
        return
      }
      setFileName(file.name)
      setConverting(true)
      void convertSpreadsheetToVIF(text, file.name.replace(/\.csv$/i, '')).then(result => {
        setConverting(false)
        if (result.error) {
          setFileError(`Could not convert that spreadsheet: ${result.error}`)
          setFileName(null)
          return
        }
        setRaw(JSON.stringify(result.vif, null, 2))
        setParseError(null)
      })
    }
    reader.onerror = () => setFileError('Could not read that file — try again.')
    reader.readAsText(file)
  }

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
    const { pkg: parsed, error } = parseVIF(raw.trim(), curatorName)
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

  // Never reports a result until every write has actually been attempted and
  // confirmed (importVIF awaits + retries each one) — the result shown here
  // reflects real Supabase state, not an in-memory guess made before the writes
  // landed. The import-batch log is saved regardless, including partial-failure
  // runs, so admins always have a record of what happened.
  async function handleImport() {
    if (!pkg) return
    setImporting(true)
    setImportError(null)
    try {
      const res = await importVIF(pkg, options)
      const batchResult = await importBatchService.save({
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
      if (!batchResult.write.success) {
        // The founders/businesses/content themselves are already saved at this
        // point — only the admin-facing log entry failed. Surface it, but don't
        // block the admin from seeing their (real) results.
        setImportError(`Import completed, but the history log failed to save: ${batchResult.write.error ?? 'unknown error'}`)
      }
      setResult(res)
      setSelectedForPipeline(new Set(res.created.map(f => f.id)))
      setStep(3)
      // Was a separate manual "Run selected" press every time, even with
      // Step 2's "create editorial content" checkbox already on — fully
      // automated now: research/write/audit kicks off the moment import
      // finishes, so a founder's ready to review by the time anyone opens
      // Curated Founders, not sitting there blank waiting for someone to
      // remember to press Run. Still gated on that same checkbox (real
      // metered API spend), just no longer needs a second confirmation
      // click on top of it.
      if (createEditorialContent && res.created.length > 0) {
        void handleRunEditorialPipeline(res.created.map(f => f.id), res.created)
      }
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Import failed. Please try again.')
    } finally {
      setImporting(false)
    }
  }

  // ── Step 3 → Optional editorial pipeline (Research → Write → Audit) ─────
  //
  // Deliberately requires its own explicit click here rather than firing
  // the moment import finishes — the checkbox in Step 2 only records
  // intent, matching the same draft-first philosophy already used for
  // publishing (see ArticleRow: nothing goes further until a human looks
  // and presses the actual button). This runs real, metered API calls —
  // research, a bio write, one article write per valid source, then an
  // audit on every draft just written — so it needs its own deliberate
  // press. Takes an explicit target list so the same function backs both
  // the "run selected" button and each row's individual "Run" button.
  // Nothing here publishes anything; Approve is still a separate step
  // (either per item, or "Confirm all" once the run below finishes).
  // sourceFounders lets handleImport kick this off with the just-returned
  // import result directly — calling this right after setResult() would
  // otherwise read `result` from a stale closure (React hasn't applied
  // that state update yet), silently no-op on the `if (!result) return`
  // guard below, and the "automated, no separate click" behaviour would
  // quietly do nothing on the very first import of a session.
  async function handleRunEditorialPipeline(targetIds: string[], sourceFounders?: VIFImportResult['created']) {
    const source = sourceFounders ?? result?.created
    if (!source) return
    const targets = source.filter(f => targetIds.includes(f.id))
    setPipelineRunning(true)
    setPipelineDone(false)
    setPipelineProgress({ done: 0, total: targets.length, note: '' })
    const writtenIds: string[] = []
    for (let i = 0; i < targets.length; i++) {
      const f = targets[i]!
      // Skip a founder that's already been researched — matches the Edit
      // button's own guard. Without this, pressing "Run selected" a second
      // time (the same founders often stay checked) silently re-ran the
      // whole pipeline on top of itself: duplicate bio/article drafts,
      // duplicate audits, real API spend for nothing new. Re-running a
      // specific founder on purpose still works from "Re-run research"
      // inside their own edit modal — a deliberate single action, not
      // something a bulk button should do by accident.
      const live = getFounder(f.id)
      if (live?.evidenceLedger) {
        setPipelineProgress({ done: i + 1, total: targets.length, note: `${f.name}: already researched, skipped` })
        continue
      }
      // Never gated on having pre-linked content — a founder curated from
      // a spreadsheet with no links yet still gets researched from their
      // name and whatever identity hints exist (see runFounderResearch).
      // The spreadsheet is there to help find the right person, not to
      // decide whether the pipeline runs at all.
      const founderContent = importedContentService.getAll({ founderId: f.id })
      setPipelineProgress({ done: i, total: targets.length, note: `${f.name}: researching…` })
      const research = await runFounderResearch(f.id)
      if (!research.success || !research.ledger) {
        setPipelineProgress({ done: i + 1, total: targets.length, note: `${f.name}: research failed — ${research.error ?? 'unknown error'}` })
        continue
      }
      setPipelineProgress({ done: i, total: targets.length, note: `${f.name}: writing bio…` })
      const bioResult = await writeProfileBio(f.id)
      if (bioResult.success && bioResult.item) {
        setPipelineProgress({ done: i, total: targets.length, note: `${f.name}: auditing bio…` })
        const audited = await runAudit(bioResult.item)
        if (audited.success && audited.item) writtenIds.push(audited.item.id)
      }

      const validSources = research.ledger.source_assessments.filter(s => s.source_valid)
      for (const source of validSources) {
        // Match the real ImportedContent row by URL rather than trusting
        // the Researcher's own echoed imported_content_id — an LLM output,
        // not guaranteed to round-trip correctly, especially for a source
        // it discovered itself rather than one it was given. Getting this
        // right is what actually sorts the written article into the right
        // podcast/YouTube/website row in the Articles tab instead of
        // leaving it orphaned.
        let matchedContent = founderContent.find(c => c.originalUrl === source.url)
        // A founder with no pre-linked content at all still gets researched
        // (see runFounderResearch) — the Researcher finds its own real
        // sources via web search. Without a matching ImportedContent row,
        // that written article would only ever be visible in CAPO tools,
        // never as a real clickable card on the founder's own page. Create
        // the row here so a Culo-discovered source ends up exactly where a
        // curator-provided one would.
        if (!matchedContent) {
          const created = buildDraftImport(f.id, source.url)
          const createResult = await importedContentService.upsert(created)
          if (createResult.success) {
            matchedContent = created
            founderContent.push(created)
          }
        }
        setPipelineProgress({ done: i, total: targets.length, note: `${f.name}: writing article (${source.source_title ?? source.url})…` })
        const articleResult = await writeSourceArticle(f.id, matchedContent?.id, source)
        if (articleResult.success && articleResult.item) {
          // Sync the draft into the real ImportedContent title/description —
          // same as the manual per-article trigger in ArticleRow — so the
          // existing Publish control uses what Culo wrote, no separate
          // copy-paste step once a draft is approved.
          if (matchedContent && articleResult.item.draft_content?.body) {
            await importedContentService.upsert({
              ...matchedContent,
              title: articleResult.item.draft_content.title || matchedContent.title,
              description: normalizeBlogSpacing(articleResult.item.draft_content.body),
            })
          }
          setPipelineProgress({ done: i, total: targets.length, note: `${f.name}: auditing article (${source.source_title ?? source.url})…` })
          const audited = await runAudit(articleResult.item)
          if (audited.success && audited.item) writtenIds.push(audited.item.id)
        }
      }
      setPipelineProgress({ done: i + 1, total: targets.length, note: `${f.name}: done — bio + ${validSources.length} article${validSources.length === 1 ? '' : 's'} drafted and audited` })
    }
    setPipelineRunning(false)
    setPipelineDone(true)
    setPipelineDraftIds(prev => [...prev, ...writtenIds])
    setResultTick(t => t + 1)
  }

  async function handleApproveAllDrafts() {
    setApprovingAllDrafts(true)
    await approveAllPassing(pipelineDraftIds)
    setApprovingAllDrafts(false)
    setResultTick(t => t + 1)
  }

  // ── Reset ────────────────────────────────────────────────────────────────

  function reset() {
    setStep(0); setRaw(''); setParseError(null); setPkg(null)
    setValidation(null); setOptions(DEFAULT_IMPORT_OPTIONS); setResult(null)
    setFileName(null); setFileError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ── Outreach message ─────────────────────────────────────────────────────

  const origin = typeof window !== 'undefined' ? window.location.origin : ''

  // The line at the end isn't just polite — it's the required opt-out for
  // this to be a compliant unsolicited commercial message (Spam Act 2003,
  // and the equivalent in NZ/UK for anyone curated from there). Whoever
  // sends this — Shakas, Gia, anyone else — gets it by default rather than
  // needing to remember to add their own.
  function outreachMsg(name: string, slug: string) {
    const profileUrl = `${origin}/founders/${slug}`
    const claimUrl   = `${origin}/claim/${slug}`
    return `Hi ${name}!\n\nI came across your work and added you to CULO Village — a curated directory of Australian founder stories and businesses.\n\nYour public profile is live here: ${profileUrl}\n\nIf you'd like to claim it, edit your details, or start creating content with CULO, you can do that here: ${claimUrl}\n\nIt's completely free to claim. Happy to help you get set up — let me know!\n\nIf you'd rather not be listed, just reply STOP and I'll remove your profile — no hard feelings.`
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
            Add a Village Import Format .json file to import multiple founders at once.
          </p>
        </div>
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

      {/* ── Step 0: Add a file ───────────────────────────────────────────────
          File upload is the normal path — a Village Import Format .json file
          from Claude, ChatGPT or Sellable — so it leads here. Pasting JSON
          directly is a fallback for anyone without a file, tucked away
          rather than shown by default. */}
      {step === 0 && (
        <div className="space-y-4">

          {/* File upload */}
          <div
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              e.preventDefault()
              const file = e.dataTransfer.files[0]
              if (file) handleFile(file)
            }}
            className={`rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
              fileName ? 'border-[#5E6B4A] bg-[#5E6B4A]/5' : 'border-[#E8E4DD] bg-white hover:border-[#C86A43]/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json,.csv,text/csv"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
            />
            {converting ? (
              <>
                <p className="text-sm font-semibold text-[#C86A43]">Converting {fileName}…</p>
                <p className="text-xs text-[#6B7280] mt-1">Mapping your spreadsheet's columns into Village Import Format — a moment.</p>
              </>
            ) : fileName ? (
              <>
                <p className="text-sm font-semibold text-[#5E6B4A]">✓ {fileName}</p>
                <p className="text-xs text-[#6B7280] mt-1">Loaded — hit Validate JSON below to continue.</p>
                <button
                  type="button"
                  onClick={() => { setFileName(null); setRaw(''); if (fileInputRef.current) fileInputRef.current.value = '' }}
                  className="mt-3 text-xs font-semibold text-[#9CA3AF] hover:text-[#C86A43] transition-colors"
                >
                  Remove and choose a different file
                </button>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-[#2D2A26] mb-1">Add your founder batch file</p>
                <p className="text-xs text-[#6B7280] mb-4">A Village Import Format .json file, or a .csv spreadsheet — either converts and validates the same way.</p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-5 py-2.5 bg-[#C86A43] text-white text-sm font-semibold rounded-xl hover:bg-[#b05a35] transition-colors"
                >
                  Choose a file
                </button>
                <p className="text-[11px] text-[#9CA3AF] mt-3">or drag it in here</p>
              </>
            )}
          </div>

          {fileError && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
              </svg>
              <p className="text-xs text-red-700">{fileError}</p>
            </div>
          )}

          {/* Paste JSON — fallback for anyone without a file */}
          <details className="bg-white rounded-xl border border-[#E8E4DD] overflow-hidden" open={pasteOpen} onToggle={e => setPasteOpen((e.target as HTMLDetailsElement).open)}>
            <summary className="cursor-pointer list-none px-5 py-3.5 text-sm font-semibold text-[#2D2A26] hover:bg-[#F8F5F0] transition-colors flex items-center justify-between">
              <span>No file? Paste the JSON directly</span>
              <span className="text-[#9CA3AF] text-xs font-normal">{pasteOpen ? '▲ Collapse' : '▼ Expand'}</span>
            </summary>
            <div className="border-t border-[#E8E4DD] p-5 space-y-3">
              <textarea
                className="w-full px-4 py-3.5 rounded-xl border border-[#E8E4DD] text-xs font-mono text-[#2D2A26] focus:outline-none focus:border-[#C86A43] bg-white placeholder:text-[#9CA3AF] resize-y"
                rows={10}
                placeholder={`{\n  "batchName": "My Founder Batch",\n  "source": "claude",\n  "founders": [...]\n}`}
                value={raw}
                onChange={e => { setRaw(e.target.value); setParseError(null); setFileName(null) }}
                spellCheck={false}
              />
              <button
                type="button"
                onClick={() => setExampleOpen(o => !o)}
                className="text-xs font-semibold text-[#C86A43] hover:underline"
              >
                {exampleOpen ? '▲ Hide example format' : '▼ See an example of the format'}
              </button>
              {exampleOpen && (
                <div className="rounded-xl border border-[#E8E4DD] overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5 bg-[#F8F5F0]">
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
                  <pre className="text-[11px] text-[#4B4845] leading-relaxed px-4 py-4 overflow-x-auto font-mono bg-white max-h-80 overflow-y-auto">
                    {EXAMPLE_JSON}
                  </pre>
                </div>
              )}
            </div>
          </details>

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
            label="Create linked business pages"
            description="Off by default — a curated business rarely has enough real content for its own page. The business name is always kept on the founder's record either way; turn this on only for a batch where the business genuinely has enough to show a real page."
            checked={options.createBusinesses}
            onChange={v => setOptions(o => ({ ...o, createBusinesses: v }))}
          />
          <OptionToggle
            label="Auto-publish content as Stories"
            description="Turn each published content item into a real article — its own page, blog, SEO — instead of just an embedded card. Only applies to items with a real description (~40+ characters); a bare title and link stays an embed."
            checked={options.autoPublishAsStories}
            onChange={v => setOptions(o => ({ ...o, autoPublishAsStories: v }))}
          />
          <OptionToggle
            label="Create Culo editorial content"
            description="After import, lets you research, write and audit a Culo bio for every founder (plus an article for each real source found, linked or discovered) — a separate button on the results screen, not automatic. The spreadsheet's fields only help find the right person; research runs even for founders with no linked sources yet. Uses real, metered API calls; final publish approval still happens in the Editorial Queue."
            checked={createEditorialContent}
            onChange={setCreateEditorialContent}
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
            <p className="text-xs text-[#6B7280] leading-relaxed mt-2">
              Every founder imports as a <strong>draft</strong> regardless of the options above — invisible in Founders, the homepage and search until you open them on the next screen and press Publish.
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
              { label: 'Stories Published', value: result.storiesCreated, color: 'text-[#C86A43]' },
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

          {/* Optional editorial pipeline — only offered when the Step 2
              checkbox was on, and only ever runs on an explicit click here,
              never automatically. Selection defaults to everyone just
              imported (see setSelectedForPipeline in handleImport); uncheck
              any founder below to leave them out, or use their own row's
              "Run" button to fire just one at a time. */}
          {createEditorialContent && result.created.length > 0 && (
            <div className="bg-[#3E6E92]/5 border border-[#3E6E92]/20 rounded-xl px-5 py-4">
              <p className="text-sm font-bold text-[#2D2A26] mb-1">Culo editorial content</p>
              <p className="text-xs text-[#6B7280] mb-3">
                Research, write and audit a bio for each checked founder below — plus an article for every real source found, whether it was a link on the spreadsheet or one Culo discovered itself. This uses real API calls and can take a while for a large batch.
              </p>
              {!pipelineRunning && (() => {
                const failedIds = result.created
                  .filter(f => !deletedIds.has(f.id) && getFounder(f.id)?.researchStatus === 'failed')
                  .map(f => f.id)
                return (
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => void handleRunEditorialPipeline([...selectedForPipeline])}
                      disabled={selectedForPipeline.size === 0}
                      className="px-5 py-2.5 bg-[#3E6E92] text-white text-sm font-semibold rounded-xl hover:bg-[#345c7a] disabled:opacity-40 transition-colors"
                    >
                      Run research, writing &amp; audit for {selectedForPipeline.size} selected founder{selectedForPipeline.size === 1 ? '' : 's'} →
                    </button>
                    {failedIds.length > 0 && (
                      <button
                        onClick={() => void handleRunEditorialPipeline(failedIds)}
                        className="px-4 py-2.5 bg-white border border-red-300 text-red-600 text-sm font-semibold rounded-xl hover:bg-red-50 transition-colors"
                      >
                        Retry {failedIds.length} failed →
                      </button>
                    )}
                  </div>
                )
              })()}
              {pipelineProgress && (pipelineRunning || pipelineDone) && (
                <div className={pipelineRunning ? '' : 'mt-1'}>
                  <p className="text-xs font-semibold text-[#2D2A26] mb-1">
                    {pipelineDone ? 'Done' : `Working…`} ({pipelineProgress.done}/{pipelineProgress.total})
                  </p>
                  <p className="text-xs text-[#6B7280]">{pipelineProgress.note}</p>
                </div>
              )}
              {pipelineDone && (
                <div className="flex items-center gap-3 mt-3">
                  {pipelineDraftIds.length > 0 && (
                    <button
                      onClick={() => void handleApproveAllDrafts()}
                      disabled={approvingAllDrafts}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#5E6B4A] text-white hover:bg-[#4a5538] disabled:opacity-50 transition-colors"
                    >
                      {approvingAllDrafts ? 'Approving…' : 'Confirm all passing drafts ✓'}
                    </button>
                  )}
                  <p className="text-xs text-[#6B7280]">
                    Review anything not auto-approved in the Editorial Queue tab, or in each founder's Editor.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Created founders list — failed research always sorts to the
              end, so a founder actually ready for review isn't buried
              under ones that need attention/a re-run first. */}
          {result.created.length > 0 && (() => {
            const visibleFounders = result.created
              .filter(f => !deletedIds.has(f.id))
              .slice()
              .sort((a, b) => {
                const aFailed = getFounder(a.id)?.researchStatus === 'failed' ? 1 : 0
                const bFailed = getFounder(b.id)?.researchStatus === 'failed' ? 1 : 0
                return aFailed - bFailed
              })
            return (
            <div>
              <div className="flex items-center justify-between gap-3">
                <SectionHead
                  title="Imported Founders"
                  sub="Review each one, then Publish when you're happy with it — nothing here is visible anywhere on the public site until you do."
                />
                {createEditorialContent && (
                  <button
                    onClick={() => setSelectedForPipeline(prev =>
                      prev.size === visibleFounders.length
                        ? new Set()
                        : new Set(visibleFounders.map(f => f.id)),
                    )}
                    className="text-[11px] font-semibold text-[#3E6E92] hover:underline shrink-0"
                  >
                    {selectedForPipeline.size === visibleFounders.length ? 'Deselect all' : 'Select all'}
                  </button>
                )}
              </div>
              <div className="space-y-3">
                {visibleFounders.map(f => {
                  const profileUrl = `${origin}/founders/${f.slug}`
                  const msgKey     = `outreach-${f.id}`
                  const profKey    = `profile-${f.id}`
                  const live       = getFounder(f.id)
                  void resultTick // recompute `live` after publish/delete

                  return (
                    <div
                      key={f.id}
                      onClick={() => { if (live) setEditingFounder(live) }}
                      className="bg-white rounded-xl border border-[#E8E4DD] hover:border-[#C86A43]/50 hover:shadow-sm transition-all cursor-pointer overflow-hidden"
                    >
                      <div className="flex items-center gap-4 px-5 py-4">
                        {createEditorialContent && (
                          <input
                            type="checkbox"
                            checked={selectedForPipeline.has(f.id)}
                            onChange={e => {
                              e.stopPropagation()
                              setSelectedForPipeline(prev => {
                                const next = new Set(prev)
                                if (e.target.checked) next.add(f.id); else next.delete(f.id)
                                return next
                              })
                            }}
                            onClick={e => e.stopPropagation()}
                            className="w-4 h-4 accent-[#3E6E92] shrink-0"
                          />
                        )}
                        <div className="w-9 h-9 rounded-full bg-[#F3EDE6] flex items-center justify-center text-[#C86A43] text-sm font-bold flex-shrink-0">
                          {f.name[0]}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-[#2D2A26]">{f.name}</p>
                            <Pill label={live?.status === 'published' ? 'Published' : 'Draft — not public yet'} color={live?.status === 'published' ? 'green' : 'amber'} />
                            {live && (live.researchStatus || live.evidenceLedger) && (() => {
                              const stage = pipelineStage(live, editorialItemsAll.filter(i => i.founder_id === f.id))
                              return (
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${stage.color}`}>
                                  {stage.label}
                                </span>
                              )
                            })()}
                          </div>
                          <p className="text-[10px] text-[#9CA3AF] font-mono">/founders/{f.slug}</p>
                          <div className="flex flex-wrap items-center gap-3 mt-2" onClick={e => e.stopPropagation()}>
                            <a
                              href={profileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-[#9CA3AF] hover:text-[#C86A43] transition-colors"
                            >
                              {live?.status === 'published' ? 'View ↗' : 'Preview ↗'}
                            </a>
                            <button
                              onClick={() => copyText(profileUrl, profKey)}
                              className={`text-[11px] font-semibold transition-colors ${
                                copied === profKey ? 'text-[#5E6B4A]' : 'text-[#9CA3AF] hover:text-[#C86A43]'
                              }`}
                            >
                              {copied === profKey ? '✓ Copied' : 'Copy Link'}
                            </button>
                            <button
                              onClick={() => copyText(outreachMsg(f.name, f.slug), msgKey)}
                              className={`text-[11px] font-semibold transition-colors ${
                                copied === msgKey ? 'text-[#5E6B4A]' : 'text-[#9CA3AF] hover:text-[#C86A43]'
                              }`}
                            >
                              {copied === msgKey ? '✓ Copied' : 'Copy LinkedIn Outreach'}
                            </button>
                            <ConfirmButton
                              label="Delete"
                              confirmLabel="Yes, delete"
                              message={`Delete ${f.name}? This can't be undone.`}
                              onConfirm={() => void handleDeleteImported(f.id)}
                              className="text-[11px] font-semibold text-red-500 hover:text-red-600 transition-colors"
                            />
                          </div>
                        </div>
                        {/* Bigger, on the right — the one thing every one of
                            these rows needs: open it, look at it properly,
                            and Publish from inside there (see
                            FounderEditModal) rather than a Publish button
                            sitting out here that skips the review step
                            entirely. Opening it is also what kicks off this
                            founder's research/write/audit run when the Step 2
                            checkbox is on — no separate "Run this one" link,
                            it just runs in the background while you look at
                            the rest of the profile (BioDraftBlock/ArticleRow
                            inside the modal pick up the drafts the moment
                            they land, same as everywhere else in this
                            engine). Skipped if this founder's already been
                            researched, so re-opening Edit doesn't burn a
                            fresh set of API calls every time. */}
                        <button
                          onClick={e => {
                            e.stopPropagation()
                            if (!live) return
                            setEditingFounder(live)
                            if (createEditorialContent && !live.evidenceLedger) void handleRunEditorialPipeline([f.id])
                          }}
                          className="shrink-0 px-5 py-3 bg-[#2D2A26] text-white text-sm font-semibold rounded-xl hover:bg-[#1a1815] transition-colors"
                        >
                          Edit →
                        </button>
                      </div>

                      {/* Culo Editorial Engine — Stage 1 (Researcher) and
                          Stage 3 (Auditor) live right here, next to the
                          import that started the chain, not buried inside
                          the general edit modal every founder passes
                          through. Stage 2 (Writer) is triggered from the
                          Profile/Articles tabs in that modal instead, since
                          writing a bio or article belongs with the bio or
                          article it's writing. */}
                      {live && (
                        <details className="border-t border-[#F3EDE6]" onClick={e => e.stopPropagation()}>
                          <summary className="cursor-pointer list-none px-5 py-2.5 text-xs font-semibold text-[#9CA3AF] hover:text-[#3E6E92] transition-colors">
                            Editorial research &amp; audit
                          </summary>
                          <div className="px-5 pb-4">
                            <EditorialResearchPanel
                              founder={live}
                              onSaved={next => { void updateFounder(next); setResultTick(t => t + 1) }}
                            />
                          </div>
                        </details>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
            )
          })()}

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
            <div className="flex flex-col items-end gap-2">
              {importError && <p className="text-sm text-red-600 max-w-sm text-right">{importError}</p>}
              <button
                type="button"
                onClick={() => void handleImport()}
                disabled={importing}
                className="px-6 py-2.5 bg-[#C86A43] text-white text-sm font-semibold rounded-xl hover:bg-[#b05a35] disabled:opacity-60 transition-colors"
              >
                {importing ? `Importing ${validation?.founderCount ?? ''} founders…` : `Import ${validation?.founderCount ?? ''} Founders ✓`}
              </button>
              {importing && (
                <p className="text-xs text-[#9CA3AF]">This can take a while for large batches — each founder is saved and confirmed before the next.</p>
              )}
            </div>
          )}
        </div>
      )}

      {editingFounder && (
        <FounderEditModal
          founder={editingFounder}
          onClose={() => setEditingFounder(null)}
          onChanged={() => setResultTick(t => t + 1)}
        />
      )}
    </div>
  )
}
