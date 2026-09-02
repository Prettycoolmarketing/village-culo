import { useState, type DragEvent } from 'react'
import { Link } from 'react-router-dom'
import { parseInstagramArchiveFile, buildImportedContentFromArchive } from '../../services/instagramArchive'
import { generateBlogFromVoiceBrief } from '../../services/blogWriter'
import { importedContentService } from '../../services/importedContent'
import { getBusinesses } from '../../services/businesses'
import { getFounder } from '../../services/founders'
import { SourceIcon } from '../ui/SourceIcon'

// Bring in a whole Instagram export ZIP at once — posts, reels and stories
// each become their own ImportedContent (carousels keep every photo, in
// order), grouped by day in the list below once imported. Nothing is
// published: everything lands as a private draft, same as any other import.
//
// Gated on the founder having a Voice & Brand Brief (Profile > Settings) —
// without one, every AI-generated blog reads the same regardless of which
// video it's attached to, which is bad for SEO (near-duplicate pages) and
// GEO (nothing distinct for an AI system to cite).

export function InstagramArchiveImportCard({ founderId, voiceBrief, insightBrief, onImported, expanded: controlledExpanded, onExpandedChange }: {
  founderId: string
  voiceBrief?: string
  insightBrief?: string
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

    setStage('Reading archive…')

    try {
      const { posts, zip } = await parseInstagramArchiveFile(file, msg => setStage(msg))
      if (posts.length === 0) {
        setError('Couldn’t find any posts, reels or stories in that archive. Instagram’s export format varies — let support know and we’ll take a look.')
        setStage(null)
        return
      }

      setStage('Extracting media and creating pieces…')
      const { built, uploadErrors } = await buildImportedContentFromArchive(founderId, posts, zip, msg => setStage(msg), businessId || undefined)

      // A real, distinct blog per piece — using the founder's own voice, not
      // a generic template — so publishing several of these doesn't read as
      // duplicate content. Runs one at a time (each is a real AI call) with
      // real progress, and a failure on one item never blocks the rest —
      // it just keeps that item's original caption as its description.
      let aiBlogError: string | null = null
      let heldCount = 0
      if (voiceBrief?.trim()) {
        const founderName = getFounder(founderId)?.name ?? ''
        // Rolling memory across this batch — each successful call's own
        // angle gets appended, and only the last 8 are kept so the prompt
        // doesn't grow unbounded across a large archive. Without this, every
        // call is independent and has no way to know what any other call in
        // the same import just wrote.
        const recentAngles: { title?: string; articleShape?: string; generationType?: string; insightSource?: string; primaryQuestion?: string }[] = []
        for (let i = 0; i < built.length; i++) {
          // A proactive gap between calls — each one resends the full Voice
          // + Insight Brief (for some founders, tens of thousands of
          // tokens), and firing them with too little space between was
          // still tripping Anthropic's own token-throughput rate limits in
          // testing, even hours apart with a cold rate window — the limit
          // is real per-batch token volume, not anything left over from a
          // previous run. The function retries transient failures on its
          // own too; this just makes tripping the limit in the first place
          // less likely for founders with a large brief.
          if (i > 0) await new Promise(r => setTimeout(r, 1500))
          setStage(`Writing blog ${i + 1} of ${built.length}…`)
          const { item } = built[i]!
          const { blog, error: blogError } = await generateBlogFromVoiceBrief({
            voiceBrief,
            founderName,
            caption: item.description,
            platform: 'Instagram',
            kind: item.contentTypeHint?.includes('reel') ? 'reel' : item.contentTypeHint?.includes('carousel') ? 'carousel photo post' : 'post',
            imageUrls: item.imageUrls?.length ? item.imageUrls : item.thumbnailUrl ? [item.thumbnailUrl] : undefined,
            postedAt: item.publishedAt ?? item.importedAt,
            insightBrief,
            recentAngles: recentAngles.slice(-8),
          })
          if (blog?.status === 'ready') {
            item.title = blog.title ?? item.title
            item.description = blog.blog ?? item.description
            item.subtitle = blog.subtitle ?? item.subtitle
            item.topics = Array.from(new Set([...item.topics, ...(blog.topics ?? [])]))
            item.generationType = blog.generationType
            item.insightConfidence = blog.insightConfidence
            item.insightSource = blog.insightSource
            item.factSources = blog.factSources
            item.primaryQuestion = blog.primaryQuestion
            item.decision = blog.decision
            item.possibleGroupHint = blog.possibleGroupHint
            item.articleShape = blog.articleShape
            recentAngles.push({
              title: blog.title, articleShape: blog.articleShape, generationType: blog.generationType,
              insightSource: blog.insightSource, primaryQuestion: blog.primaryQuestion,
            })
          } else if (blog?.status === 'insufficient_source') {
            // Held, not failed — correctly declined rather than invented.
            // Original caption stays; flagged the same way a title/caption
            // mismatch is, so it's visible and excluded from bulk actions.
            heldCount++
            item.flaggedForReview = true
            item.flagReason = blog.note ?? 'Not enough source material to rewrite without inventing detail.'
          } else if (blogError) {
            // A config-level failure (e.g. the API key isn't set) will fail
            // identically for every remaining item — no point burning through
            // the whole archive one silent failure at a time. Keep everyone's
            // original captions and surface it once, instead of the founder
            // wondering later why nothing got an AI blog.
            aiBlogError = blogError
            break
          }
        }
      }

      setStage('Saving to your Village…')
      let imported = 0
      for (const { item } of built) {
        const saveResult = await importedContentService.upsert(item)
        if (saveResult.success) imported++
      }

      setStage(null)
      setResult({ imported, skipped: posts.length - imported })
      if (aiBlogError) {
        setError(
          `Everything imported, but AI blog writing didn't run (${aiBlogError}) — your original captions were used instead.`
        )
      } else if (heldCount > 0) {
        setError(
          `Imported fine. ${heldCount} item${heldCount === 1 ? '' : 's'} had too little to go on to write from honestly — held for review (flagged with an asterisk) instead of guessed at.`
        )
      } else if (uploadErrors.length > 0) {
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
            className="text-sm font-semibold px-5 py-2.5 rounded-lg bg-[#C86A43] text-white hover:bg-[#B15C38] transition-colors shrink-0">
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
                You can import your archive right now either way — but with a brief, every piece gets a real,
                distinct starter blog written in your own voice instead of just keeping the original caption.
                Add it in the Voice &amp; Brand Brief section above, then come back here any time.
              </p>
            </div>
          )}
          <p className="text-xs text-[#6B7280] mb-4">
            Nothing goes public from this — everything lands as a private draft in Content, and only publishes
            once you review it and choose to publish it yourself.
          </p>
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
