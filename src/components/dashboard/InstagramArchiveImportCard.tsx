import { useState, type DragEvent } from 'react'
import { parseInstagramArchiveFile, buildImportedContentFromArchive } from '../../services/instagramArchive'
import { importedContentService } from '../../services/importedContent'

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
  const [showInstructions, setShowInstructions] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [stage, setStage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null)

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
      const built = await buildImportedContentFromArchive(founderId, posts, zip, msg => setStage(msg))

      setStage('Saving to your Village…')
      let imported = 0
      for (const { item } of built) {
        const saveResult = await importedContentService.upsert(item)
        if (saveResult.success) imported++
      }

      setStage(null)
      setResult({ imported, skipped: posts.length - imported })
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
            <ol className="text-xs text-[#6B7280] leading-relaxed list-decimal list-inside mb-4 space-y-1 bg-[#F8F5F0] rounded-lg p-4">
              <li>Open Instagram → Settings → Accounts Centre → Your information and permissions.</li>
              <li>Download or transfer information → select your Instagram account.</li>
              <li>Choose "Some of your information" and select Posts, Stories, Reels, Videos, Photos.</li>
              <li>Date range: All time. Format: JSON. Media quality: High.</li>
              <li>Create files, then wait for Instagram's email.</li>
              <li>Download the ZIP and upload it below.</li>
            </ol>
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
