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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not import that design.')
    } finally {
      setBusy(false)
    }
  }

  function toggleSlide(i: number) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i); else next.add(i)
      return next
    })
  }

  async function handleUse() {
    if (!result || selected.size === 0) return
    const indices = [...selected].sort((a, b) => a - b)

    // Reel needs the actual exported video, not the slide image — and it
    // has to happen BEFORE saving, not after. Firing it off in the
    // background after save used to mean: if the founder moved on before
    // the ~1-3 minute export finished (or closed the tab), reelVideoUrl
    // never got set, and the story fell back to linking the Canva design
    // page itself instead of playing a video — exactly the wrong thing to
    // publish. Blocking here guarantees a founder either gets the real
    // video or a clear error, never a silent Canva-link fallback.
    let reelVideoUrl: string | undefined
    if (contentTypeHint?.includes('reel')) {
      setBusy(true)
      setStage('Exporting your Reel video — this can take a few minutes…')
      try {
        reelVideoUrl = await exportCanvaReelVideo(founderId, designId, result.pageNumbers[indices[0]!] ?? indices[0]! + 1, 'vertical')
      } catch (err) {
        setBusy(false)
        setStage(null)
        setError(err instanceof Error ? err.message : 'Could not export the video for this Reel. Try again, or pick different slides.')
        return
      }
      setStage(null)
    }

    const item: ImportedContent = {
      id: `imp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      founderId,
      sourcePlatform: 'canva',
      originalUrl: `https://www.canva.com/design/${designId}/view`,
      thumbnailUrl: result.imageUrls[indices[0]!],
      imageUrls: indices.map(i => result.imageUrls[i]!),
      reelVideoUrl,
      title: result.title,
      contentTypeHint,
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
    if (reelVideoUrl) onReelVideoReady?.(reelVideoUrl)
    onImported(item)
  }

  return (
    <div className="rounded-2xl border-2 border-[#E8E4DD] bg-white p-4 mb-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm font-semibold text-[#2D2A26]">Import from Canva</p>
          <p className="text-[11px] text-[#9CA3AF] mt-0.5">
            {canProceed ? 'Bring in slides from a Canva design.' : (gateMessage ?? 'Select a format above first.')}
          </p>
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
              <label className="text-[10px] text-[#9CA3AF] uppercase tracking-wide block mb-1">Click the slides you want to use — one or several</label>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mb-3">
                {result.imageUrls.map((url, i) => {
                  const isSelected = selected.has(i)
                  return (
                    <button key={i} type="button" onClick={() => toggleSlide(i)}
                      className={`rounded-lg overflow-hidden border-2 transition-colors relative ${isSelected ? 'border-[#C86A43]' : 'border-transparent hover:border-[#E8E4DD]'}`}>
                      <img src={url} alt="" className="w-full aspect-square object-cover bg-[#F3EDE6]" />
                      {isSelected && <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#C86A43] text-white text-[9px] flex items-center justify-center">✓</span>}
                    </button>
                  )
                })}
              </div>
              <button type="button" onClick={() => void handleUse()} disabled={selected.size === 0 || busy}
                className="px-4 py-2 bg-[#C86A43] text-white text-xs font-semibold rounded-lg hover:bg-[#b05a35] disabled:opacity-40 transition-colors">
                Use {selected.size > 0 ? selected.size : ''} slide{selected.size === 1 ? '' : 's'}
              </button>
              {stage && <p className="text-xs text-[#9CA3AF] mt-2">{stage}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
