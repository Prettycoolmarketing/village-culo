import { useState, useEffect, type DragEvent } from 'react'
import { Link } from 'react-router-dom'
import { parseICloudArchiveFile, buildImportedContentFromICloud } from '../../services/icloudArchive'
import { importedContentService } from '../../services/importedContent'
import { SourceIcon } from '../ui/SourceIcon'
import { getFounder } from '../../services/founders'
import { hashFile, findPriorImport, recordImportHash } from '../../utils/archiveFileHash'

// Same shape as Instagram/Snapchat's archive cards — upload Apple's own
// "Request a copy of your data" Photos export, every photo/video becomes
// its own private draft piece. Unlike Snapchat, Apple's export bundles the
// actual files directly in the zip, so there's no signed-link/CORS-proxy
// step here — see icloudArchive.ts.

export function ICloudArchiveImportCard({ founderId, onImported }: {
  founderId: string
  onImported: (count: number) => void
}) {
  const [showUpload, setShowUpload] = useState(false)
  const [showPrivacyNote, setShowPrivacyNote] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [stage, setStage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ imported: number } | null>(null)
  const [pendingDuplicate, setPendingDuplicate] = useState<{ file: File; hash: string; importedAt: string } | null>(null)

  // Same risk as the Instagram/Snapchat importers — a lot of photos/videos,
  // each uploaded one at a time, can take a while. beforeunload actually
  // stops an accidental close instead of relying on someone reading a
  // banner.
  useEffect(() => {
    if (!stage) return
    function onBeforeUnload(e: BeforeUnloadEvent) { e.preventDefault() }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [stage])

  async function handleFile(file: File | undefined) {
    if (!file) return
    setError(null)
    setResult(null)
    setPendingDuplicate(null)
    if (!file.name.toLowerCase().endsWith('.zip')) {
      setError('That doesn’t look like a ZIP file — request your data from Apple and upload that file.')
      return
    }

    setStage('Checking file…')
    const hash = await hashFile(file)
    const prior = findPriorImport(getFounder(founderId), 'icloud', hash)
    setStage(null)
    if (prior) {
      setPendingDuplicate({ file, hash, importedAt: prior.importedAt })
      return
    }

    await processFile(file, hash)
  }

  async function processFile(file: File, hash: string) {
    setPendingDuplicate(null)
    setStage('Reading archive…')

    try {
      const { photos, zip } = await parseICloudArchiveFile(file, msg => setStage(msg))
      if (photos.length === 0) {
        setError('Couldn’t find any photos or videos in that archive. Apple’s export format can vary — let support know and we’ll take a look.')
        setStage(null)
        return
      }

      setStage('Saving your photos…')
      const { built, uploadErrors } = await buildImportedContentFromICloud(founderId, photos, zip, msg => setStage(msg), undefined)

      let imported = 0
      for (const item of built) {
        const saveResult = await importedContentService.upsert(item)
        if (saveResult.success) imported++
      }

      setStage(null)
      setResult({ imported })
      void recordImportHash(founderId, 'icloud', hash)
      if (uploadErrors.length > 0) {
        setError(
          `${uploadErrors.length} file${uploadErrors.length === 1 ? '' : 's'} couldn't upload (likely too large) — ` +
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
      <div className="flex items-center gap-4 mb-2">
        <SourceIcon platform="icloud" size="lg" />
        <div>
          <p className="text-base font-semibold text-[#2D2A26]">Import your iCloud Photos</p>
          <p className="text-sm text-[#9CA3AF] mt-0.5">
            Follow the steps to publish as web articles.
          </p>
        </div>
      </div>

      <div className="mt-3">
        <p className="text-sm text-[#6B7280] leading-relaxed mb-3">
          Apple will email you a file to upload to Culo.
        </p>
        <ol className="text-sm text-[#6B7280] leading-relaxed list-decimal list-inside space-y-2.5 mb-4">
          <li>Go to <span className="font-medium text-[#2D2A26]">privacy.apple.com</span> and sign in.</li>
          <li>Choose <span className="font-semibold text-[#C86A43] bg-[#FBF1EB] px-1 rounded">Request a copy of your data</span> and select Photos.</li>
          <li>Submit the request and wait for Apple's email (can take a few days).</li>
          <li>Download the .zip from email and upload it below.</li>
        </ol>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <button
            type="button"
            onClick={() => setShowUpload(v => !v)}
            className="px-4 py-2.5 rounded-lg bg-[#2D2A26] text-white text-sm font-semibold hover:bg-[#1a1815] transition-colors"
          >
            Upload file
          </button>
          <a
            href="https://privacy.apple.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#C86A43] text-white text-sm font-semibold hover:bg-[#b05a35] transition-colors"
          >
            Open Apple's data request page ↗
          </a>
        </div>

        {error && <p className="text-xs text-red-600 mb-3">{error}</p>}

        {pendingDuplicate && (
          <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg mb-3 flex items-center justify-between gap-3 flex-wrap">
            <p className="text-xs text-amber-800">
              You already fully imported this exact file on {new Date(pendingDuplicate.importedAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}.
              Importing it again will just re-check everything the same way — duplicates get skipped automatically either way.
            </p>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => void processFile(pendingDuplicate.file, pendingDuplicate.hash)}
                className="text-xs font-semibold px-3 py-1.5 bg-[#2D2A26] text-white rounded-lg hover:bg-[#1a1815] transition-colors"
              >
                Import anyway
              </button>
              <button
                onClick={() => setPendingDuplicate(null)}
                className="text-xs font-semibold px-3 py-1.5 text-[#6B7280] hover:text-[#2D2A26] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {stage ? (
          <div>
            <div className="px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-lg mb-2">
              <p className="text-xs font-semibold text-amber-800 text-center">
                Don't close this tab until it's done — anything not yet uploaded will be lost.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2.5 px-4 py-6">
              <span className="w-3.5 h-3.5 rounded-full border-2 border-[#E8E4DD] border-t-[#C86A43] animate-spin shrink-0" aria-hidden="true" />
              <p className="text-xs text-[#9CA3AF] text-center">{stage}</p>
            </div>
          </div>
        ) : result ? (
          <div className="flex flex-col gap-2">
            <div className="px-4 py-3 bg-[#5E6B4A]/10 rounded-lg flex items-center justify-between gap-3 flex-wrap">
              <p className="text-xs text-[#5E6B4A] font-medium">
                Imported {result.imported} photo{result.imported === 1 ? '' : 's'}. Nothing is published yet.
              </p>
              <Link
                to="/dashboard/profile?tab=content&contentSubTab=ready"
                className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#5E6B4A] text-white hover:bg-[#4a5539] transition-colors"
              >
                Review iCloud imports →
              </Link>
            </div>
          </div>
        ) : showUpload ? (
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
        ) : null}

        <div className="mt-4 pt-3 border-t border-[#F3EDE6]">
          <button type="button" onClick={() => setShowPrivacyNote(v => !v)}
            className="text-xs font-semibold text-[#9CA3AF] hover:text-[#6B7280] transition-colors">
            {showPrivacyNote ? 'Hide' : 'What happens to this once imported?'}
          </button>
          {showPrivacyNote && (
            <p className="text-xs text-[#9CA3AF] leading-relaxed mt-2">
              Nothing goes public from this.
              <br />
              Everything lands as a private draft in Content, and only publishes once you review it and choose to
              publish it yourself. Culo never connects to your Apple/iCloud account — see the Privacy Policy's
              Archive Imports clause.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
