import { useState, type DragEvent } from 'react'
import { parseInstagramArchiveFile, buildImportedContentFromArchive } from '../../services/instagramArchive'
import { importedContentService } from '../../services/importedContent'
import { getBusinesses } from '../../services/businesses'

// Bring in a whole Instagram export ZIP at once — posts, reels and stories
// each become their own ImportedContent (carousels keep every photo, in
// order), grouped by day in the list below once imported. Nothing is
// published: everything lands as a private draft, same as any other import.

export function InstagramArchiveImportCard({ founderId, onImported, expanded: controlledExpanded, onExpandedChange }: {
  founderId: string
  onImported: (count: number) => void
  expanded?: boolean
  onExpandedChange?: (expanded: boolean) => void
}) {
  const [uncontrolledExpanded, setUncontrolledExpanded] = useState(false)
  const expanded = controlledExpanded ?? uncontrolledExpanded
  const setExpanded = onExpandedChange ?? setUncontrolledExpanded
  const [showInstructions, setShowInstructions] = useState(true)
  const [dragOver, setDragOver] = useState(false)
  const [stage, setStage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null)
  const businesses = getBusinesses({ founderId })
  const [businessId, setBusinessId] = useState<string>('')

  async function handleFile(file: File | undefined) {
    if (!file) return
    setError(null)
    setResult(null)
    if (!file.name.toLowerCase().endsWith('.zip')) {
      setError('That doesn’t look like a ZIP file — export your archive as JSON/ZIP from Instagram and upload that file.')
      return
    }

    try {
      setStage('Reading archive…')
      const { posts, zip } = await parseInstagramArchiveFile(file)
      if (posts.length === 0) {
        setError('Couldn’t find any posts, reels or stories in that archive. Instagram’s export format varies — let support know and we’ll take a look.')
        setStage(null)
        return
      }

      setStage('Extracting media and creating pieces…')
      const { built, uploadErrors } = await buildImportedContentFromArchive(founderId, posts, zip, msg => setStage(msg), businessId || undefined)

      setStage('Saving to your Village…')
      let imported = 0
      for (const { item } of built) {
        const saveResult = await importedContentService.upsert(item)
        if (saveResult.success) imported++
      }

      setStage(null)
      setResult({ imported, skipped: posts.length - imported })
      if (uploadErrors.length > 0) {
        setError(
          `${uploadErrors.length} file${uploadErrors.length === 1 ? '' : 's'} couldn't upload (likely too large for the current storage limit) — ` +
          `everything else imported fine: ${uploadErrors.slice(0, 3).join('; ')}${uploadErrors.length > 3 ? '…' : ''}`
        )
      }
      onImported(imported)
    } catch (err) {
      setStage(null)
      setError(err instanceof Error ? err.message : 'Could not process that archive.')
    }
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragOver(false)
    void handleFile(e.dataTransfer.files?.[0])
  }

  return (
    <div className="rounded-2xl border-2 border-[#E8E4DD] bg-white p-4 mb-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm font-semibold text-[#2D2A26]">Import your Instagram Archive</p>
          <p className="text-[11px] text-[#9CA3AF] mt-0.5">
            Bring years of posts into your permanent knowledge library — captions, dates and media preserved.
          </p>
        </div>
        {!expanded && (
          <button type="button" onClick={() => setExpanded(true)}
            className="text-xs font-semibold px-4 py-2 rounded-lg bg-[#C86A43] text-white hover:bg-[#B15C38] transition-colors shrink-0">
            Import archive
          </button>
        )}
      </div>

      {expanded && (
        <div className="mt-3">
          <button type="button" onClick={() => setShowInstructions(v => !v)}
            className="text-xs font-semibold text-[#C86A43] hover:underline mb-3">
            {showInstructions ? 'Hide' : 'How do I export my Instagram archive?'}
          </button>

          {showInstructions && (
            <div className="mb-4 bg-[#F8F5F0] rounded-lg p-4">
              <p className="text-xs font-semibold text-[#2D2A26] mb-2">In the Instagram app or on instagram.com:</p>
              <ol className="text-xs text-[#6B7280] leading-relaxed list-decimal list-inside space-y-1.5">
                <li>Go to <span className="font-medium text-[#2D2A26]">Settings → Accounts Centre → Your information and permissions</span>.</li>
                <li>Tap <span className="font-medium text-[#2D2A26]">Download or transfer information</span>, then select the Instagram account you want to export.</li>
                <li>Choose <span className="font-medium text-[#2D2A26]">"Some of your information"</span>, then on the checklist tick <span className="font-medium text-[#2D2A26]">Media</span> only — leave everything else (Messages, Comments, Ads, Security, etc.) unticked. That's all our importer reads.</li>
                <li>Set <span className="font-medium text-[#2D2A26]">Date range: All time</span>.</li>
                <li>Set <span className="font-medium text-[#2D2A26]">Format: JSON</span> (not HTML — we can't read HTML exports).</li>
                <li>Set <span className="font-medium text-[#2D2A26]">Media quality: High</span>.</li>
                <li>Tap <span className="font-medium text-[#2D2A26]">Create files</span>. Instagram builds it in the background and emails you when it's ready — this can take anywhere from a few minutes to a day.</li>
                <li>Open that email (or go back to Accounts Centre → Your activity → Download or transfer information) and download the <span className="font-medium text-[#2D2A26]">.zip</span> file to your device.</li>
                <li>Come back to this page and drag that .zip file into the box below, or click Browse files to select it.</li>
              </ol>
            </div>
          )}

          {businesses.length > 0 && (
            <div className="mb-4">
              <label className="block text-xs font-semibold text-[#2D2A26] mb-1.5">
                Which business is this Instagram account for?
              </label>
              <select
                value={businessId}
                onChange={e => setBusinessId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-[#E8E4DD] text-sm text-[#2D2A26] bg-white focus:outline-none focus:ring-2 focus:ring-[#C86A43]/30 focus:border-[#C86A43]"
              >
                <option value="">Not tied to a specific business</option>
                {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <p className="text-[10px] text-[#9CA3AF] mt-1">
                If you run more than one Instagram account for different businesses, export and upload each one separately, choosing the matching business each time.
              </p>
            </div>
          )}

          {error && <p className="text-xs text-red-600 mb-3">{error}</p>}

          {stage ? (
            <p className="text-xs text-[#9CA3AF] px-4 py-6 text-center">{stage}</p>
          ) : result ? (
            <p className="text-xs text-[#5E6B4A] font-medium px-4 py-3 bg-[#5E6B4A]/10 rounded-lg">
              Imported {result.imported} piece{result.imported === 1 ? '' : 's'}
              {result.skipped > 0 ? ` — ${result.skipped} skipped (no usable media)` : ''}. Nothing is published yet — review it below.
            </p>
          ) : (
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              className={`border-2 border-dashed rounded-xl px-4 py-8 text-center transition-colors ${dragOver ? 'border-[#C86A43] bg-[#FDF6F3]' : 'border-[#E8E4DD]'}`}
            >
              <p className="text-sm text-[#6B7280] mb-2">Drag your ZIP here, or</p>
              <label className="inline-block px-4 py-2 bg-[#2D2A26] text-white text-xs font-semibold rounded-lg hover:bg-[#1a1815] cursor-pointer transition-colors">
                Browse files
                <input type="file" accept=".zip" className="hidden" onChange={e => void handleFile(e.target.files?.[0])} />
              </label>
              <p className="text-[10px] text-[#9CA3AF] mt-3">ZIP only</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
