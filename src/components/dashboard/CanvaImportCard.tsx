import { useState } from 'react'
import {
  isCanvaConfigured,
  getCanvaStatus,
  startCanvaConnect,
  listCanvaDesigns,
  importCanvaDesign,
  exportCanvaReelVideo,
  type CanvaDesignSummary,
  type CanvaImportResult,
} from '../../services/canva'
import { importedContentService } from '../../services/importedContent'
import { SourceIcon } from '../ui/SourceIcon'
import type { ImportedContent } from '../../types/importedContent'
import type { ContentType } from '../../types'

// Shared between the Publish wizard's Choose Formats step and the Import
// Content page — same "pick a design, click the slides you want, done" flow
// (no forced grouping), just parameterised for where it's used:
//  - On Publish, contentTypeHint is the founder's already-chosen formats
//    (so a Reel format also kicks off the video export), and canProceed
//    gates browsing behind picking a format first.
//  - On Import Content, contentTypeHint is left unset (format isn't known
//    yet — chosen later, same as any other import, via "Turn into Story"),
//    and canProceed defaults to true.
export function CanvaImportCard({
  founderId,
  canProceed = true,
  gateMessage,
  contentTypeHint,
  onImported,
  onReelVideoReady,
  expanded: controlledExpanded,
  onExpandedChange,
  buttonLabel = 'Publish designs',
}: {
  founderId: string
  canProceed?: boolean
  gateMessage?: string
  contentTypeHint?: ContentType[]
  onImported: (item: ImportedContent) => void
  onReelVideoReady?: (videoUrl: string) => void
  expanded?: boolean
  onExpandedChange?: (expanded: boolean) => void
  buttonLabel?: string
}) {
  const [uncontrolledExpanded, setUncontrolledExpanded] = useState(false)
  const expanded = controlledExpanded ?? uncontrolledExpanded
  const setExpanded = onExpandedChange ?? setUncontrolledExpanded

  const [connected, setConnected] = useState<boolean | null>(null)
  const [designs, setDesigns] = useState<CanvaDesignSummary[]>([])
  const [designsLoaded, setDesignsLoaded] = useState(false)
  const [designId, setDesignId] = useState('')
  const [result, setResult] = useState<CanvaImportResult | null>(null)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stage, setStage] = useState<string | null>(null)
  // Grouping — one Canva design's slides often become more than one piece
  // (a Reel from slide 3, a Carousel from slides 1-2-4). usedIndices tracks
  // what's already been saved into a piece this session so the picker can
  // show it, and groupsCreated lets the founder see their progress before
  // clicking Done.
  const [usedIndices, setUsedIndices] = useState<Set<number>>(new Set())
  const [groupsCreated, setGroupsCreated] = useState(0)

  if (!isCanvaConfigured() || !founderId) return null

  // One click does everything: opens the card, checks the connection, and —
  // if already connected — loads designs immediately, instead of making the
  // founder click "Publish designs" and then a second "Browse my Canva
  // designs" button right after it.
  async function handleBrowseClick() {
    if (!canProceed) return
    setExpanded(true)
    setError(null)
    let isConnected = connected
    if (isConnected === null) {
      isConnected = await getCanvaStatus(founderId)
      setConnected(isConnected)
    }
    if (isConnected) {
      try {
        setDesigns(await listCanvaDesigns(founderId))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load your Canva designs.')
      } finally {
        setDesignsLoaded(true)
      }
    }
  }

  async function handlePick(id: string) {
    setError(null)
    setDesignId(id)
    setBusy(true)
    try {
      setResult(await importCanvaDesign(founderId, id))
      setSelected(new Set())
      setUsedIndices(new Set())
      setGroupsCreated(0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not import that design.')
    } finally {
      setBusy(false)
    }
  }

  function toggleSlide(i: number) {
    if (usedIndices.has(i)) return
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i); else next.add(i)
      return next
    })
  }

  async function handleUse(asType?: 'reel' | 'carousel') {
    if (!result || selected.size === 0) return
    const indices = [...selected].sort((a, b) => a - b)

    // Reel needs the actual exported video, not the slide image — and it
    // has to happen BEFORE saving, not after. Firing it off in the
    // background after save used to mean: if the founder moved on before
    // the ~1-3 minute export finished (or closed the tab), reelVideoUrl
    // never got set, and the story fell back to linking the Canva design
    // page instead of playing a video — exactly the wrong thing to
    // publish. Blocking here guarantees a founder either gets the real
    // video or a clear error, never a silent Canva-link fallback.
    const exportVideo = contentTypeHint?.includes('reel') || (asType === 'reel' && indices.length === 1)
    let reelVideoUrl: string | undefined
    let videoExportError: string | null = null
    if (exportVideo) {
      setBusy(true)
      setStage('Exporting your Reel video — this can take a few minutes…')
      try {
        reelVideoUrl = await exportCanvaReelVideo(founderId, designId, result.pageNumbers[indices[0]!] ?? indices[0]! + 1, 'vertical')
      } catch (err) {
        // Don't discard the slides just because the video failed — the
        // images already exported successfully. Falling back to save them
        // (with no video) beats losing the whole import, and definitely
        // beats the old behaviour of silently linking out to the Canva
        // design page instead of showing anything real.
        videoExportError = err instanceof Error ? err.message : 'Could not export the video for this Reel.'
      }
      setStage(null)
    }

    // No real destination to send anyone to once re-hosted here — the Canva
    // design page itself isn't meant for public viewers, so it must never
    // become the fallback "view original" link a founder didn't ask for.
    const resolvedHint = contentTypeHint
      ?? (asType === 'reel' ? ['reel' as const] : asType === 'carousel' ? ['carousel' as const] : undefined)
    const item: ImportedContent = {
      id: `imp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      founderId,
      sourcePlatform: 'canva',
      originalUrl: '',
      thumbnailUrl: result.imageUrls[indices[0]!],
      imageUrls: indices.map(i => result.imageUrls[i]!),
      reelVideoUrl,
      title: indices.length > 1 || groupsCreated === 0 ? result.title : `${result.title} (${groupsCreated + 1})`,
      contentTypeHint: reelVideoUrl && !resolvedHint?.includes('reel') ? [...(resolvedHint ?? []), 'reel'] : resolvedHint,
      importedAt: new Date().toISOString(),
      status: 'draft',
      topics: [],
      locations: [],
      visibility: 'private',
    }
    setBusy(true)
    const saveResult = await importedContentService.upsert(item)
    setBusy(false)
    if (!saveResult.success) { setError(saveResult.error ?? 'Could not save. Please try again.'); return }
    if (videoExportError) setError(`Saved your slide${indices.length === 1 ? '' : 's'} as images — the video didn't export (${videoExportError}). You can try again or attach it manually in Advanced Edit.`)
    if (reelVideoUrl) onReelVideoReady?.(reelVideoUrl)
    onImported(item)

    // Grouping mode (no forced contentTypeHint) — mark these slides used and
    // let the founder keep going, picking another group from what's left,
    // instead of closing the picker after every single save.
    if (!contentTypeHint) {
      setUsedIndices(prev => new Set([...prev, ...indices]))
      setGroupsCreated(n => n + 1)
      setSelected(new Set())
    }
  }

  return (
    <div className="rounded-2xl border-2 border-[#E8E4DD] bg-white p-4 h-full">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <SourceIcon platform="canva" />
          <div>
            <p className="text-sm font-semibold text-[#2D2A26]">Import from Canva</p>
            <p className="text-[11px] text-[#9CA3AF] mt-0.5">
              {canProceed ? 'Bring in slides from a Canva design.' : (gateMessage ?? 'Select a format above first.')}
            </p>
          </div>
        </div>
        {!expanded && (
          <button type="button" onClick={() => void handleBrowseClick()} disabled={!canProceed}
            className="text-xs font-semibold px-4 py-2 rounded-lg bg-[#C86A43] text-white hover:bg-[#B15C38] disabled:opacity-40 transition-colors shrink-0">
            {buttonLabel}
          </button>
        )}
      </div>

      {expanded && (
        <div className="mt-3">
          {error && <p className="text-xs text-red-600 mb-2">{error}</p>}

          {connected === false && (
            <button type="button" onClick={() => void startCanvaConnect(founderId)}
              className="px-4 py-2 bg-[#C86A43] text-white text-xs font-semibold rounded-lg hover:bg-[#B15C38] transition-colors">
              Connect Canva
            </button>
          )}

          {connected === true && !result && designs.length === 0 && (
            <p className="text-xs text-[#9CA3AF]">
              {designsLoaded ? 'No Canva designs found.' : 'Loading your designs…'}
            </p>
          )}

          {connected === true && !result && designs.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {designs.map(d => (
                <button key={d.id} type="button" onClick={() => void handlePick(d.id)} disabled={busy}
                  className="text-left rounded-lg overflow-hidden border border-[#E8E4DD] hover:border-[#C86A43]/40 transition-colors disabled:opacity-50">
                  {d.thumbnailUrl && <img src={d.thumbnailUrl} alt="" className="w-full aspect-video object-cover bg-[#F3EDE6]" />}
                  <p className="text-[11px] text-[#2D2A26] px-2 py-1.5 truncate">{d.title}</p>
                </button>
              ))}
            </div>
          )}

          {busy && !result && <p className="text-xs text-[#9CA3AF] mt-2">Importing your slides…</p>}

          {result && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] text-[#9CA3AF] uppercase tracking-wide">
                  {contentTypeHint ? 'Click the slides you want to use — one or several' : 'Group slides into a piece, then group the rest'}
                </label>
                {groupsCreated > 0 && (
                  <span className="text-[10px] font-semibold text-[#5E6B4A]">{groupsCreated} piece{groupsCreated === 1 ? '' : 's'} created</span>
                )}
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mb-3">
                {result.imageUrls.map((url, i) => {
                  const isSelected = selected.has(i)
                  const isUsed = usedIndices.has(i)
                  return (
                    <button key={i} type="button" onClick={() => toggleSlide(i)} disabled={isUsed}
                      className={`rounded-lg overflow-hidden border-2 transition-colors relative ${
                        isUsed ? 'border-transparent opacity-30 cursor-not-allowed' : isSelected ? 'border-[#C86A43]' : 'border-transparent hover:border-[#E8E4DD]'
                      }`}>
                      <img src={url} alt="" className="w-full aspect-square object-cover bg-[#F3EDE6]" />
                      {isSelected && !isUsed && <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#C86A43] text-white text-[9px] flex items-center justify-center">✓</span>}
                      {isUsed && <span className="absolute inset-0 flex items-center justify-center text-[9px] font-semibold text-white bg-black/40">Used</span>}
                    </button>
                  )
                })}
              </div>

              {contentTypeHint ? (
                <button type="button" onClick={() => void handleUse()} disabled={selected.size === 0 || busy}
                  className="px-4 py-2 bg-[#C86A43] text-white text-xs font-semibold rounded-lg hover:bg-[#b05a35] disabled:opacity-40 transition-colors">
                  Use {selected.size > 0 ? selected.size : ''} slide{selected.size === 1 ? '' : 's'}
                </button>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" onClick={() => void handleUse('carousel')} disabled={selected.size === 0 || busy}
                    className="px-4 py-2 bg-[#C86A43] text-white text-xs font-semibold rounded-lg hover:bg-[#b05a35] disabled:opacity-40 transition-colors">
                    Save {selected.size > 0 ? selected.size : ''} as Carousel
                  </button>
                  <button type="button" onClick={() => void handleUse('reel')} disabled={selected.size !== 1 || busy}
                    title={selected.size !== 1 ? 'Select exactly one slide to save it as a Reel' : undefined}
                    className="px-4 py-2 bg-white border border-[#E8E4DD] text-[#2D2A26] text-xs font-semibold rounded-lg hover:border-[#C86A43]/40 hover:text-[#C86A43] disabled:opacity-40 transition-colors">
                    Save as Reel
                  </button>
                  {(usedIndices.size > 0 || groupsCreated > 0) && (
                    <button type="button" onClick={() => setResult(null)}
                      className="ml-auto text-xs font-semibold text-[#5E6B4A] hover:underline">
                      Done — browse another design
                    </button>
                  )}
                </div>
              )}
              {stage && <p className="text-xs text-[#9CA3AF] mt-2">{stage}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
