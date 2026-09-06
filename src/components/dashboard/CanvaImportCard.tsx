import { useState, useEffect, useRef } from 'react'
import {
  isCanvaConfigured,
  getCanvaStatus,
  startCanvaConnect,
  listCanvaDesigns,
  importCanvaDesign,
  exportCanvaReelVideo,
  fetchCanvaSlideTexts,
  type CanvaDesignSummary,
} from '../../services/canva'
import { importedContentService } from '../../services/importedContent'
import { SourceIcon } from '../ui/SourceIcon'
import type { ImportedContent } from '../../types/importedContent'
import type { ContentType } from '../../types'

// Loads the already-exported slide image just to read its natural
// dimensions — cheap (it's cached from the export), and it's the only
// reliable signal we have client-side for whether a Canva design is a
// vertical Reel template or a landscape/square one. Falls back to
// 'vertical' (the common case) if the image can't be read for any reason.
function detectImageOrientation(imageUrl: string | undefined): Promise<'vertical' | 'horizontal'> {
  return new Promise(resolve => {
    if (!imageUrl) { resolve('vertical'); return }
    const img = new Image()
    img.onload = () => resolve(img.naturalHeight >= img.naturalWidth ? 'vertical' : 'horizontal')
    img.onerror = () => resolve('vertical')
    img.src = imageUrl
  })
}

// One flat slide pool, each slide tagged with the design it actually came
// from — a founder batching several Canva designs in one sitting picks all
// of them up front, then groups slides into pieces without caring which
// design each slide belongs to. designId/pageNumber travel per-slide since
// Reel export and text extraction are both scoped to one design at a time.
interface CombinedResult {
  imageUrls: string[]
  pageNumbers: number[]
  designIds: string[]
  designTitles: Record<string, string>
}

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
  buttonLabel = 'Import designs',
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
  // A founder doing a real content batch has many designs to get through in
  // one sitting, not one — so the browse grid is multi-select, and picking
  // several imports all of them into one combined slide pool the founder
  // groups from, rather than forcing a full "pick, group, done, browse
  // again" round trip per design.
  const [pickedDesignIds, setPickedDesignIds] = useState<Set<string>>(new Set())
  const [result, setResult] = useState<CombinedResult | null>(null)
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
  async function checkConnectionAndLoad() {
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

  function handleBrowseClick() {
    if (!canProceed) return
    setExpanded(true)
    void checkConnectionAndLoad()
  }

  // Covers coming back from the Canva OAuth redirect already connected: the
  // parent page (DashboardImportContentPage) sets expanded=true once it sees
  // ?canvaConnected=1, but that alone did nothing here before — this card
  // still needed its own separate "Import designs" click to actually check
  // the connection and load designs, meaning the founder pressed what was
  // functionally the same button twice (once before connecting, once after
  // being sent back). Firing the same check the moment we're expanded but
  // haven't checked yet closes that gap.
  const autoCheckedRef = useRef(false)
  useEffect(() => {
    if (expanded && connected === null && !autoCheckedRef.current) {
      autoCheckedRef.current = true
      void checkConnectionAndLoad()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded])

  function toggleDesignPick(id: string) {
    setPickedDesignIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  // Imports every design the founder checked, one Canva export call each
  // (Canva's export API is per-design, no batch endpoint), and flattens them
  // into one slide pool tagged by origin. One design failing to export
  // doesn't lose the rest — it's reported alongside whatever did come in.
  async function handleImportPicked() {
    if (pickedDesignIds.size === 0) return
    setError(null)
    setBusy(true)
    const imageUrls: string[] = []
    const pageNumbers: number[] = []
    const designIds: string[] = []
    const designTitles: Record<string, string> = {}
    const failed: string[] = []
    for (const id of pickedDesignIds) {
      try {
        const imported = await importCanvaDesign(founderId, id)
        designTitles[id] = imported.title
        imported.imageUrls.forEach((url, i) => {
          imageUrls.push(url)
          pageNumbers.push(imported.pageNumbers[i] ?? i + 1)
          designIds.push(id)
        })
      } catch (err) {
        failed.push(designs.find(d => d.id === id)?.title ?? id)
      }
    }
    if (failed.length > 0) setError(`Couldn't import: ${failed.join(', ')}. The rest are ready below.`)
    if (imageUrls.length > 0) {
      setResult({ imageUrls, pageNumbers, designIds, designTitles })
      setSelected(new Set())
      setUsedIndices(new Set())
      setGroupsCreated(0)
    }
    setBusy(false)
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
        // Orientation comes from the slide itself, not a fixed guess — a
        // founder's Canva design can just as easily be a landscape deck as
        // a vertical Reel template, and forcing 'vertical' cropped/stretched
        // the wrong ones. The already-exported slide image tells us the
        // real aspect ratio for free.
        const orientation = await detectImageOrientation(result.imageUrls[indices[0]!])
        reelVideoUrl = await exportCanvaReelVideo(founderId, result.designIds[indices[0]!]!, result.pageNumbers[indices[0]!] ?? indices[0]! + 1, orientation)
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

    // Pull the actual caption/copy text off the selected slides — a real
    // text-run extraction from the Canva file itself (see canva-export-text),
    // not OCR guessing at pixels — so a founder doesn't have to retype what
    // they already wrote in the design just to get a usable caption/blog
    // starting point. Never blocks the save if it fails or comes back empty.
    // A single group can mix slides from more than one imported design now,
    // so this fetches per-design (the export API is scoped that way) and
    // stitches the answers back together in the founder's selection order.
    const slideTexts: string[] = []
    for (const designId of [...new Set(indices.map(i => result.designIds[i]))]) {
      const pagesForDesign = indices
        .filter(i => result.designIds[i] === designId)
        .map(i => result.pageNumbers[i] ?? i + 1)
      try {
        const { textsByPage } = await fetchCanvaSlideTexts(founderId, designId!, pagesForDesign)
        pagesForDesign.forEach(p => { if (textsByPage[p]) slideTexts.push(textsByPage[p]!) })
      } catch {
        // Non-fatal — the slides/video already exported fine either way.
      }
    }
    const slideText = slideTexts.join('\n\n').trim() || undefined

    // No real destination to send anyone to once re-hosted here — the Canva
    // design page itself isn't meant for public viewers, so it must never
    // become the fallback "view original" link a founder didn't ask for.
    const resolvedHint = contentTypeHint
      ?? (asType === 'reel' ? ['reel' as const] : asType === 'carousel' ? ['carousel' as const] : undefined)
    const groupTitle = result.designTitles[result.designIds[indices[0]!]!] ?? 'Canva design'
    const item: ImportedContent = {
      id: `imp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      founderId,
      sourcePlatform: 'canva',
      originalUrl: '',
      thumbnailUrl: result.imageUrls[indices[0]!],
      imageUrls: indices.map(i => result.imageUrls[i]!),
      reelVideoUrl,
      title: indices.length > 1 || groupsCreated === 0 ? groupTitle : `${groupTitle} (${groupsCreated + 1})`,
      description: slideText,
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
    <div className="rounded-2xl border-2 border-[#E8E4DD] bg-white p-6 h-full">
      <div className="flex items-center gap-4 mb-2">
        <SourceIcon platform="canva" size="lg" />
        <div>
          <p className="text-base font-semibold text-[#2D2A26]">Publish your Canva designs</p>
          <p className="text-sm text-[#9CA3AF] mt-0.5">
            {canProceed ? 'Turn your Canva designs into content you can build on in the Village, including blogs, reels and carousels.' : (gateMessage ?? 'Select a format above first.')}
          </p>
        </div>
      </div>
      {!expanded && (
        <button type="button" onClick={() => void handleBrowseClick()} disabled={!canProceed}
          className="w-full text-sm font-semibold px-5 py-2.5 rounded-lg bg-[#C86A43] text-white hover:bg-[#B15C38] disabled:opacity-40 transition-colors">
          {buttonLabel}
        </button>
      )}

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
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wide">Tick every design you want to work through — then import them all at once</p>
                {pickedDesignIds.size > 0 && (
                  <button type="button" onClick={() => void handleImportPicked()} disabled={busy}
                    className="shrink-0 px-4 py-2 bg-[#C86A43] text-white text-xs font-semibold rounded-lg hover:bg-[#b05a35] disabled:opacity-40 transition-colors">
                    {busy ? 'Importing…' : `Import ${pickedDesignIds.size} design${pickedDesignIds.size === 1 ? '' : 's'}`}
                  </button>
                )}
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {designs.map(d => {
                  const isPicked = pickedDesignIds.has(d.id)
                  return (
                    <button key={d.id} type="button" onClick={() => toggleDesignPick(d.id)} disabled={busy}
                      className={`text-left rounded-lg overflow-hidden border-2 transition-colors relative disabled:opacity-50 ${
                        isPicked ? 'border-[#C86A43]' : 'border-transparent hover:border-[#E8E4DD]'
                      }`}>
                      {d.thumbnailUrl && <img src={d.thumbnailUrl} alt="" className="w-full aspect-video object-cover bg-[#F3EDE6]" />}
                      <p className="text-[11px] text-[#2D2A26] px-2 py-1.5 truncate">{d.title}</p>
                      {isPicked && <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#C86A43] text-white text-[9px] flex items-center justify-center">✓</span>}
                    </button>
                  )
                })}
              </div>
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
                    <button type="button" onClick={() => { setResult(null); setPickedDesignIds(new Set()) }}
                      className="ml-auto text-xs font-semibold text-[#5E6B4A] hover:underline">
                      Done — pick more designs
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
