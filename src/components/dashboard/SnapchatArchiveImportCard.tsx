import { useState, type DragEvent } from 'react'
import { Link } from 'react-router-dom'
import { parseSnapchatArchiveFile, buildImportedContentFromSnapchat } from '../../services/snapchatArchive'
import { importedContentService } from '../../services/importedContent'
import { SourceIcon } from '../ui/SourceIcon'

// Same shape as InstagramArchiveImportCard — upload Snapchat's "My Data"
// export, every Memory becomes its own private draft piece. Snapchat's
// export doesn't bundle the actual photos/videos the way Instagram's
// does — it's normally a list of signed download links instead (see
// snapchatArchive.ts) — so some memories can fail to come across
// automatically if that link has expired or needs a logged-in Snapchat
// session; reported clearly rather than silently vanishing.

export function SnapchatArchiveImportCard({ founderId, onImported }: {
  founderId: string
  onImported: (count: number) => void
}) {
  const [showUpload, setShowUpload] = useState(false)
  const [showPrivacyNote, setShowPrivacyNote] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [stage, setStage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ imported: number; failedDownloads: number } | null>(null)

  async function handleFile(file: File | undefined) {
    if (!file) return
    setError(null)
    setResult(null)
    if (!file.name.toLowerCase().endsWith('.zip')) {
      setError('That doesn’t look like a ZIP file — export your data from Snapchat and upload that file.')
      return
    }

    setStage('Reading archive…')

    try {
      const { memories, zip } = await parseSnapchatArchiveFile(file, msg => setStage(msg))
      if (memories.length === 0) {
        setError('Couldn’t find any memories in that archive. Snapchat’s export format can vary — let support know and we’ll take a look.')
        setStage(null)
        return
      }

      setStage('Fetching and saving your memories…')
      const { built, failedDownloads, uploadErrors } = await buildImportedContentFromSnapchat(founderId, memories, zip, msg => setStage(msg), undefined)

      let imported = 0
      for (const item of built) {
        const saveResult = await importedContentService.upsert(item)
        if (saveResult.success) imported++
      }

      setStage(null)
      setResult({ imported, failedDownloads })
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
        <SourceIcon platform="snapchat" size="lg" />
        <div>
          <p className="text-base font-semibold text-[#2D2A26]">Import your Snapchat Memories</p>
          <p className="text-sm text-[#9CA3AF] mt-0.5">
            Follow the steps to publish as web articles.
          </p>
        </div>
      </div>

      <div className="mt-3">
        <p className="text-sm text-[#6B7280] leading-relaxed mb-3">
          Snapchat will email you a file to upload to Culo.
        </p>
        <ol className="text-sm text-[#6B7280] leading-relaxed list-decimal list-inside space-y-2.5 mb-4">
          <li>Go to <span className="font-medium text-[#2D2A26]">Settings → My Data</span> on Snapchat's website.</li>
          <li>Tick <span className="font-semibold text-[#C86A43] bg-[#FBF1EB] px-1 rounded">Export your Memories, Chat Media and Saved Stories</span>.</li>
          <li>Submit the request and wait for Snapchat's email (can take a while).</li>
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
            href="https://accounts.snapchat.com/accounts/downloadmydata"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#C86A43] text-white text-sm font-semibold hover:bg-[#b05a35] transition-colors"
          >
            Open Snapchat export page ↗
          </a>
        </div>

        {error && <p className="text-xs text-red-600 mb-3">{error}</p>}

        {stage ? (
          <div className="flex items-center justify-center gap-2.5 px-4 py-6">
            <span className="w-3.5 h-3.5 rounded-full border-2 border-[#E8E4DD] border-t-[#C86A43] animate-spin shrink-0" aria-hidden="true" />
            <p className="text-xs text-[#9CA3AF] text-center">{stage}</p>
          </div>
        ) : result ? (
          <div className="flex flex-col gap-2">
            <div className="px-4 py-3 bg-[#5E6B4A]/10 rounded-lg flex items-center justify-between gap-3 flex-wrap">
              <p className="text-xs text-[#5E6B4A] font-medium">
                Imported {result.imported} memor{result.imported === 1 ? 'y' : 'ies'}. Nothing is published yet.
              </p>
              <Link
                to="/dashboard/profile?tab=content&contentSubTab=ready"
                className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#5E6B4A] text-white hover:bg-[#4a5539] transition-colors"
              >
                Review Snapchat imports →
              </Link>
            </div>
            {result.failedDownloads > 0 && (
              <p className="text-xs text-[#9CA3AF] px-1">
                {result.failedDownloads} memor{result.failedDownloads === 1 ? 'y' : 'ies'} couldn't be fetched
                automatically — Snapchat's download link for {result.failedDownloads === 1 ? 'it' : 'them'} may have
                expired. Re-request your export and try again if {result.failedDownloads === 1 ? 'it’s' : 'they’re'} important.
              </p>
            )}
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
              publish it yourself.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
