// Snapchat "My Data" export → ImportedContent items.
//
// Two real shapes this has to handle, because Snapchat's export is NOT a
// self-contained media archive the way Instagram's is:
//
// 1. The common case: a json/memories_history.json (or .html) file listing
//    every Memory as { Date, "Media Type", "Download Link" } — the actual
//    photo/video is NOT inside the zip, it's behind that link. These links
//    are signed and meant to be opened in a logged-in browser tab; a blind
//    fetch() from here can fail (CORS, auth) depending on how Snapchat has
//    that endpoint configured at the time. Attempted directly, and any
//    memory that fails to fetch is reported rather than silently dropped,
//    so a founder knows which ones need a manual save-and-reupload instead
//    of assuming the import just missed them.
// 2. Already-downloaded media sitting directly in the zip (a founder who
//    used a bulk-downloader tool, or Snapchat's own export bundling the
//    files directly in a future format change) — same raw-media-by-
//    extension fallback Instagram's importer uses.
//
// No caption text exists in a Snapchat export at all (unlike Instagram) —
// every item lands with a generic dated title; the founder writes the real
// copy themselves, same as a bare link import.

import JSZip from 'jszip'
import { mediaUploadsService } from './mediaUploads'
import { getFounder } from './founders'
import { getBusiness } from './businesses'
import type { ImportedContent } from '../types/importedContent'

export interface ParsedSnapchatMemory {
  isVideo: boolean
  timestamp: number // unix seconds
  // Exactly one of these is set — downloadUrl for the link-based export,
  // zipPath for media already sitting in the archive.
  downloadUrl?: string
  zipPath?: string
}

// Snapchat's own export date format: "2023-05-01 14:32:10 UTC".
function parseSnapchatDate(raw: unknown): number {
  if (typeof raw !== 'string') return Math.floor(Date.now() / 1000)
  const iso = raw.trim().replace(' UTC', 'Z').replace(' ', 'T')
  const ms = new Date(iso).getTime()
  return Number.isFinite(ms) ? Math.floor(ms / 1000) : Math.floor(Date.now() / 1000)
}

function looksLikeVideo(mediaType: unknown, url?: string): boolean {
  if (typeof mediaType === 'string' && /video/i.test(mediaType)) return true
  return !!url && /\.(mp4|mov|m4v)(\?|$)/i.test(url)
}

function findMemoriesArray(json: unknown, depth = 0): unknown[] | null {
  if (depth > 4 || !json) return null
  if (Array.isArray(json)) {
    return json.some(e => e && typeof e === 'object' && ('Download Link' in (e as object) || 'Date' in (e as object)))
      ? json : null
  }
  if (typeof json === 'object') {
    for (const value of Object.values(json as Record<string, unknown>)) {
      const found = findMemoriesArray(value, depth + 1)
      if (found) return found
    }
  }
  return null
}

const MEDIA_FILE_RE = /\.(mp4|mov|m4v|jpe?g|png|webp)$/i

function rawMediaFallback(zip: JSZip): ParsedSnapchatMemory[] {
  const out: ParsedSnapchatMemory[] = []
  zip.forEach((path, entry) => {
    if (entry.dir || !MEDIA_FILE_RE.test(path)) return
    out.push({
      isVideo: /\.(mp4|mov|m4v)$/i.test(path),
      timestamp: Math.floor((entry.date?.getTime() ?? Date.now()) / 1000),
      zipPath: path,
    })
  })
  return out
}

export async function parseSnapchatArchiveFile(
  file: File,
  onProgress?: (message: string) => void,
): Promise<{ memories: ParsedSnapchatMemory[]; zip: JSZip }> {
  onProgress?.('Unzipping archive…')
  const zip = await JSZip.loadAsync(file)
  const memories: ParsedSnapchatMemory[] = []

  const jsonPaths = Object.keys(zip.files).filter(p => /memories.*\.json$/i.test(p))
  for (const path of jsonPaths) {
    try {
      const text = await zip.files[path]!.async('string')
      const raw = findMemoriesArray(JSON.parse(text))
      if (!raw) continue
      for (const entry of raw) {
        if (!entry || typeof entry !== 'object') continue
        const e = entry as Record<string, unknown>
        const downloadUrl = typeof e['Download Link'] === 'string' ? e['Download Link'] as string : undefined
        if (!downloadUrl) continue
        memories.push({
          isVideo: looksLikeVideo(e['Media Type'], downloadUrl),
          timestamp: parseSnapchatDate(e.Date),
          downloadUrl,
        })
      }
    } catch {
      // fall through — an unparseable file just doesn't contribute memories
    }
  }

  if (memories.length > 0) return { memories, zip }

  // No JSON index found/parseable — either the real media is sitting
  // directly in the zip, or there's nothing usable here either way.
  onProgress?.('Looking for media files directly in the archive…')
  return { memories: rawMediaFallback(zip), zip }
}

function captureVideoFrame(blob: Blob): Promise<Blob | null> {
  return new Promise(resolve => {
    const url = URL.createObjectURL(blob)
    const video = document.createElement('video')
    video.src = url
    video.muted = true
    video.playsInline = true
    const cleanup = () => URL.revokeObjectURL(url)
    const fail = () => { cleanup(); resolve(null) }
    video.onloadeddata = () => {
      try { video.currentTime = Math.min(0.3, (video.duration || 1) / 2) } catch { fail() }
    }
    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth || 640
        canvas.height = video.videoHeight || 360
        const ctx = canvas.getContext('2d')
        if (!ctx) { fail(); return }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        canvas.toBlob(result => { cleanup(); resolve(result) }, 'image/jpeg', 0.85)
      } catch { fail() }
    }
    video.onerror = fail
  })
}

export async function buildImportedContentFromSnapchat(
  founderId: string,
  memories: ParsedSnapchatMemory[],
  zip: JSZip,
  onProgress?: (message: string) => void,
  businessId?: string,
): Promise<{ built: ImportedContent[]; failedDownloads: number; uploadErrors: string[] }> {
  const built: ImportedContent[] = []
  const uploadErrors: string[] = []
  let failedDownloads = 0

  const founderName = getFounder(founderId)?.name
  const businessName = businessId ? getBusiness(businessId)?.name : undefined
  const fallbackWho = [founderName, businessName].filter(Boolean).join(' — ')

  for (let i = 0; i < memories.length; i++) {
    const memory = memories[i]!
    onProgress?.(`Fetching memory ${i + 1} of ${memories.length}…`)

    let blob: Blob | null = null
    if (memory.zipPath) {
      const entry = zip.file(memory.zipPath)
      blob = entry ? await entry.async('blob') : null
    } else if (memory.downloadUrl) {
      try {
        const response = await fetch(memory.downloadUrl)
        if (response.ok) blob = await response.blob()
      } catch {
        // Signed Snapchat link didn't resolve from here (expired, or needs
        // a logged-in Snapchat session) — counted, not silently dropped.
      }
    }

    if (!blob) { failedDownloads++; continue }

    const filename = memory.zipPath?.split('/').pop() || `snapchat-memory-${i}.${memory.isVideo ? 'mp4' : 'jpg'}`
    const file = new File([blob], filename, { type: memory.isVideo ? 'video/mp4' : 'image/jpeg' })
    const uploadResult = await mediaUploadsService.uploadAndTrack(file, {
      founderId,
      usageType: memory.isVideo ? 'reel-preview' : 'carousel-slide',
    })
    if (!uploadResult.media) {
      if (uploadResult.error) uploadErrors.push(`${filename}: ${uploadResult.error}`)
      continue
    }

    let thumbnailUrl = uploadResult.media.publicUrl
    let reelVideoUrl: string | undefined
    if (memory.isVideo) {
      reelVideoUrl = uploadResult.media.publicUrl
      const frame = await captureVideoFrame(blob)
      if (frame) {
        const frameResult = await mediaUploadsService.uploadAndTrack(
          new File([frame], `${filename}-cover.jpg`, { type: 'image/jpeg' }),
          { founderId, businessId, usageType: 'carousel-slide' },
        )
        if (frameResult.media) thumbnailUrl = frameResult.media.publicUrl
      }
    }

    const readableDate = new Date(memory.timestamp * 1000).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
    const title = fallbackWho ? `${fallbackWho} — Memory, ${readableDate}` : `Memory from ${readableDate}`

    built.push({
      id: `imp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      founderId,
      businessId,
      sourcePlatform: 'snapchat',
      originalUrl: '',
      thumbnailUrl,
      reelVideoUrl,
      title,
      // No caption exists in a Snapchat export — left blank, same as a
      // bare link import, so Content's "Needs More Value" correctly
      // flags it until the founder writes something real.
      publishedAt: new Date(memory.timestamp * 1000).toISOString(),
      importedAt: new Date().toISOString(),
      status: 'draft',
      topics: [],
      locations: [],
      visibility: 'private',
      contentTypeHint: memory.isVideo ? ['reel'] : ['blog'],
      flaggedForReview: true,
    })
  }

  return { built, failedDownloads, uploadErrors }
}
