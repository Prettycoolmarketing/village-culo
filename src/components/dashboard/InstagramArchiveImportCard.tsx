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
  const [result, setResult] = useState<{ imported: number; skipped: number; duplicates: number } | null>(null)

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
      const { built, uploadErrors, duplicates } = await buildImportedContentFromArchive(founderId, posts, zip, msg => setStage(msg), undefined)

      setStage('Saving to your Village…')
      let imported = 0
      for (const { item } of built) {
        const saveResult = await importedContentService.upsert(item)
        if (saveResult.success) imported++
      }

      setStage(null)
      setResult({ imported, skipped: posts.length - imported - duplicates, duplicates })
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
          <SourceIcon platform="meta" size="lg" />
          <div>
            <p className="text-base font-semibold text-[#2D2A26]">Import your Instagram/Facebook posts</p>
            <p className="text-sm text-[#9CA3AF] mt-0.5">
              Follow the steps to publish as web articles.
            </p>
          </div>
        </div>
        {!expanded && (
          <button type="button" onClick={() => setExpanded(true)}
            className="w-full sm:w-auto text-sm font-semibold px-5 py-2.5 rounded-lg bg-[#C86A43] text-white hover:bg-[#b05a35] transition-colors shrink-0">
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
                You can import your archive right now either way, original captions come across as-is.
                <br />
                Add a brief and you can turn any piece into a real, distinct blog written in your own voice
                afterward, right from Content.
              </p>
            </div>
          )}
          <p className="text-xs text-[#6B7280] mb-4">
            Nothing goes public from this.
            <br />
            Everything lands as a private draft in Content, and only publishes once you review it and choose to
            publish it yourself.
          </p>
          <button type="button" onClick={() => setShowInstructions(v => !v)}
            className="text-base font-semibold text-[#C86A43] hover:underline mb-4">
            {showInstructions ? 'Hide' : 'How do I export my Instagram archive?'}
          </button>

          {showInstructions && (
            <div className="mb-4 bg-[#EBF2F8] rounded-lg p-5">
              <p className="text-xs text-[#6B7280] leading-relaxed mb-3">
                Instagram will email you a file to upload to Culo.
              </p>
              <ol className="text-xs text-[#6B7280] leading-relaxed list-decimal list-inside space-y-2 mb-4">
                <li>Tap <span className="font-medium text-[#2D2A26]">Download → Create export</span>.</li>
                <li>Under <span className="font-medium text-[#2D2A26]">Customise information</span>, clear everything, then tick <span className="font-semibold text-[#C86A43] bg-[#FBF1EB] px-1 rounded">Media only</span>.</li>
                <li>Set format to <span className="font-semibold text-[#C86A43] bg-[#FBF1EB] px-1 rounded">JSON</span>, then tap <span className="font-medium text-[#2D2A26]">Start exporting</span>.</li>
                <li>Download the .zip from email and drop it in the box below.</li>
              </ol>
              <a
                href="https://accountscenter.instagram.com/info_and_permissions/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-lg bg-[#C86A43] text-white hover:bg-[#b05a35] transition-colors"
              >
                Open Instagram export page ↗
              </a>
              <div className="flex justify-end mt-4">
                <button type="button" onClick={() => setShowInstructions(false)}
                  className="text-xs font-semibold text-[#6B7280] hover:text-[#2D2A26] transition-colors">
                  Hide
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
            <div className="flex flex-col gap-2">
              <div className="px-4 py-3 bg-[#5E6B4A]/10 rounded-lg flex items-center justify-between gap-3 flex-wrap">
                <p className="text-xs text-[#5E6B4A] font-medium">
                  Imported {result.imported} piece{result.imported === 1 ? '' : 's'}
                  {result.skipped > 0 ? ` — ${result.skipped} skipped (no usable media)` : ''}. Nothing is published yet.
                </p>
                <Link
                  to="/dashboard/profile?tab=content&contentSubTab=ready"
                  className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#5E6B4A] text-white hover:bg-[#4a5539] transition-colors"
                >
                  Review Instagram imports →
                </Link>
              </div>
              {result.duplicates > 0 && (
                <p className="text-xs text-[#9CA3AF] px-1">
                  We found {result.duplicates} duplicate{result.duplicates === 1 ? '' : 's'} for Facebook and
                  Instagram — {result.duplicates === 1 ? 'this has' : 'these have'} been skipped.
                </p>
              )}
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
