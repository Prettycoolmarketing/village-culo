import { useState, type DragEvent } from 'react'
import { Link } from 'react-router-dom'
import { parseInstagramArchiveFile, buildImportedContentFromArchive } from '../../services/instagramArchive'
import { importedContentService } from '../../services/importedContent'
import { SourceIcon } from '../ui/SourceIcon'

// Bring in a whole Instagram export ZIP at once — posts, reels and stories
// each become their own ImportedContent (carousels keep every photo, in
// order), grouped by day in the list below once imported. Nothing is
// published: everything lands as a private draft, same as any other import.
//
// Deliberately does NOT run AI blog-writing on every item during import —
// this used to call generateBlogFromVoiceBrief in a loop over the whole
// archive the moment a Voice Brief existed, which meant importing a
// 2,000-item archive burned 2,000 real AI calls before Archive Unlock ever
// got a chance to gate anything. Every other import path (YouTube, podcast,
// website) only ever saves raw metadata/captions at import time; this now
// matches that — real AI writing happens later, opt-in, via "Rewrite with
// Voice Brief" on whatever a founder actually selects (naturally their free
// 10 first, or anything after they unlock the rest).

export function InstagramArchiveImportCard({ founderId, voiceBrief, onImported, expanded: controlledExpanded, onExpandedChange }: {
  founderId: string
  voiceBrief?: string
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

  async function handleFile(file: File | undefined) {
    if (!file) return
    setError(null)
    setResult(null)
    if (!file.name.toLowerCase().endsWith('.zip')) {
      setError('That doesn’t look like a ZIP file — export your archive as JSON/ZIP from Instagram and upload that file.')
      return
    }

    setStage('Reading archive…')

    try {
      const { posts, zip } = await parseInstagramArchiveFile(file, msg => setStage(msg))
      if (posts.length === 0) {
        setError('Couldn’t find any posts, reels or stories in that archive. Instagram’s export format varies — let support know and we’ll take a look.')
        setStage(null)
        return
      }

      setStage('Extracting media and creating pieces…')
      // Not tied to a specific business — during the join funnel a founder
      // may not have added business details yet, and every imported piece
      // already links back to them as the founder regardless.
      const { built, uploadErrors } = await buildImportedContentFromArchive(founderId, posts, zip, msg => setStage(msg), undefined)

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
    <div className="rounded-2xl border-2 border-[#E8E4DD] bg-white p-8 h-full">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-4">
          <SourceIcon platform="instagram" size="lg" />
          <div>
            <p className="text-base font-semibold text-[#2D2A26]">Import your Instagram archive</p>
            <p className="text-sm text-[#9CA3AF] mt-0.5">
              Bring years of Instagram posts into your Village library with captions, dates and media kept together.
            </p>
          </div>
        </div>
        {!expanded && (
          <button type="button" onClick={() => setExpanded(true)}
            className="w-full sm:w-auto text-sm font-semibold px-5 py-2.5 rounded-lg bg-[#C86A43] text-white hover:bg-[#B15C38] transition-colors shrink-0">
            Import archive
          </button>
        )}
      </div>

      {expanded && (
        <div className="mt-3">
          {!voiceBrief?.trim() && (
            <div className="mb-4 bg-[#FBF1EB] border border-[#F0DDD2] rounded-xl px-4 py-4">
              <p className="text-sm font-semibold text-[#2D2A26] mb-1">Tip: add your Voice &amp; Brand Brief above first</p>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                You can import your archive right now either way — original captions come across as-is. Add a
                brief and you can turn any piece into a real, distinct blog written in your own voice afterward,
                right from Content.
              </p>
            </div>
          )}
          <p className="text-xs text-[#6B7280] mb-4">
            Nothing goes public from this — everything lands as a private draft in Content, and only publishes
            once you review it and choose to publish it yourself.
          </p>
          <button type="button" onClick={() => setShowInstructions(v => !v)}
            className="text-base font-semibold text-[#C86A43] hover:underline mb-4">
            {showInstructions ? 'Hide' : 'How do I export my Instagram archive?'}
          </button>

          {showInstructions && (
            <div className="mb-4 bg-[#F8F5F0] rounded-lg p-5">
              <p className="text-xs font-semibold text-[#2D2A26] mb-3">In the Instagram app or on instagram.com:</p>
              <ol className="text-xs text-[#6B7280] leading-relaxed list-decimal list-inside space-y-3">
                <li>Go to <span className="font-medium text-[#2D2A26]">Settings → Accounts Centre → Your information and permissions</span>.</li>
                <li>Select the Instagram account you want to republish for visibility.</li>
                <li>Tap <span className="font-medium text-[#2D2A26]">Export to device</span>.</li>
                <li>Click <span className="font-medium text-[#2D2A26]">"Customise information"</span>.</li>
                <li>Click <span className="font-medium text-[#2D2A26]">"Clear all"</span> on all sections.</li>
                <li>Re-tick <span className="font-medium text-[#2D2A26]">"Media"</span> only — that's all our importer reads.</li>
                <li>Click <span className="font-medium text-[#2D2A26]">Save</span>.</li>
                <li>Set <span className="font-medium text-[#2D2A26]">Format: JSON</span> (not HTML — we can't read HTML exports).</li>
                <li>Set <span className="font-medium text-[#2D2A26]">Media quality: High</span>.</li>
                <li>Tap <span className="font-medium text-[#2D2A26]">"Start Exporting"</span>.</li>
                <li>Instagram will email you when your file is ready — this can take anywhere from a few minutes to a day.</li>
                <li>Open that email (or go back to Accounts Centre → Your activity → Download or transfer information) and download the <span className="font-medium text-[#2D2A26]">.zip</span> file to your device.</li>
                <li>Come back to this page and drag that .zip file into the box below, or click Browse files to select it.</li>
              </ol>
              <div className="flex justify-end mt-4">
                <button type="button" onClick={() => setShowInstructions(false)}
                  className="text-xs font-semibold text-[#6B7280] hover:text-[#2D2A26] transition-colors">
                  Hide instructions
                </button>
              </div>
            </div>
          )}

          {error && <p className="text-xs text-red-600 mb-3">{error}</p>}

          {stage ? (
            <div className="flex items-center justify-center gap-2.5 px-4 py-6">
              {/* CSS-driven, not JS-timer-driven — keeps visibly spinning even
                  during the moments the main thread is busy decompressing/
                  parsing a large file, which is exactly when a JS-only
                  indicator would otherwise look frozen. */}
              <span className="w-3.5 h-3.5 rounded-full border-2 border-[#E8E4DD] border-t-[#C86A43] animate-spin shrink-0" aria-hidden="true" />
              <p className="text-xs text-[#9CA3AF] text-center">{stage}</p>
            </div>
          ) : result ? (
            <div className="px-4 py-3 bg-[#5E6B4A]/10 rounded-lg flex items-center justify-between gap-3 flex-wrap">
              <p className="text-xs text-[#5E6B4A] font-medium">
                Imported {result.imported} piece{result.imported === 1 ? '' : 's'}
                {result.skipped > 0 ? ` — ${result.skipped} skipped (no usable media)` : ''}. Nothing is published yet.
              </p>
              <Link
                to="/dashboard/profile?tab=content&contentSubTab=imported&platform=instagram"
                className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#5E6B4A] text-white hover:bg-[#4a5539] transition-colors"
              >
                Review Instagram imports →
              </Link>
            </div>
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
