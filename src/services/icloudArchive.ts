// Apple "Request a copy of your data" (privacy.apple.com) iCloud Photos
// export → ImportedContent items.
//
// Unlike Snapchat's export, Apple's Photos export bundles the actual
// photo/video files directly inside the zip rather than pointing at signed
// download links — no server-side CORS-proxy fetch needed here, the same
// reason this importer is simpler than snapchatArchive.ts. Apple sometimes
// includes a small per-asset metadata JSON alongside each photo/video (date
// taken, etc.); when present it's used for the real capture date, otherwise
// the zip entry's own file date is the fallback, same pattern as Snapchat's
// and Instagram's raw-media fallbacks use.
//
// No caption text exists in an iCloud Photos export (unlike Instagram) —
// every item lands with a generic dated title; the founder writes the real
// copy themselves, same as a Snapchat import.

import JSZip from 'jszip'
import { mediaUploadsService } from './mediaUploads'
import { getFounder } from './founders'
import { getBusiness } from './businesses'
import type { ImportedContent } from '../types/importedContent'

const VIDEO_RE = /\.(mp4|mov|m4v)$/i
const MEDIA_FILE_RE = /\.(jpe?g|png|heic|heif|webp|mp4|mov|m4v)$/i

export interface ParsedICloudPhoto {
  isVideo: boolean
  timestamp: number // unix seconds
  zipPath: string
}

// Best-effort read of whatever per-asset metadata Apple includes alongside
// a photo/video in the export — the exact filename/shape has changed across
// different versions of Apple's export tool, so this tries the common
// sibling-JSON pattern and a handful of plausible date field names rather
// than depending on one fixed structure.
async function tryReadSidecarDate(zip: JSZip, mediaPath: string): Promise<number | null> {
  const candidates = [`${mediaPath}.json`, mediaPath.replace(MEDIA_FILE_RE, '.json')]
  for (const path of candidates) {
    const entry = zip.file(path)
    if (!entry) continue
    try {
      const text = await entry.async('string')
      const data = JSON.parse(text) as Record<string, unknown>
      const raw = data.photoTakenTime ?? data.creationDate ?? data.dateCreated ?? data.takenDate
      const value = typeof raw === 'object' && raw ? (raw as Record<string, unknown>).timestamp ?? (raw as Record<string, unknown>).formatted : raw
      const ms = typeof value === 'number' ? value * 1000 : new Date(String(value)).getTime()
      if (Number.isFinite(ms)) return Math.floor(ms / 1000)
    } catch {
      // fall through — try the next candidate, or fall back to the zip entry's own date
    }
  }
  return null
}

export async function parseICloudArchiveFile(
  file: File,
  onProgress?: (message: string) => void,
): Promise<{ photos: ParsedICloudPhoto[]; zip: JSZip }> {
  onProgress?.('Unzipping archive…')
  const zip = await JSZip.loadAsync(file)
  const photos: ParsedICloudPhoto[] = []

  onProgress?.('Looking for photos and videos in the archive…')
  const entries = Object.entries(zip.files).filter(([path, entry]) => !entry.dir && MEDIA_FILE_RE.test(path))
  for (const [path, entry] of entries) {
    const sidecarDate = await tryReadSidecarDate(zip, path)
    photos.push({
      isVideo: VIDEO_RE.test(path),
      timestamp: sidecarDate ?? Math.floor((entry.date?.getTime() ?? Date.now()) / 1000),
      zipPath: path,
    })
  }

  return { photos, zip }
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

export async function buildImportedContentFromICloud(
  founderId: string,
  photos: ParsedICloudPhoto[],
  zip: JSZip,
  onProgress?: (message: string) => void,
  businessId?: string,
): Promise<{ built: ImportedContent[]; uploadErrors: string[] }> {
  const built: ImportedContent[] = []
  const uploadErrors: string[] = []

  const founderName = getFounder(founderId)?.name
  const businessName = businessId ? getBusiness(businessId)?.name : undefined
  const fallbackWho = [founderName, businessName].filter(Boolean).join(' — ')

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i]!
    onProgress?.(`Reading photo ${i + 1} of ${photos.length}…`)

    const entry = zip.file(photo.zipPath)
    const blob = entry ? await entry.async('blob') : null
    if (!blob) continue

    const filename = photo.zipPath.split('/').pop() || `icloud-photo-${i}.${photo.isVideo ? 'mp4' : 'jpg'}`
    const file = new File([blob], filename, { type: photo.isVideo ? 'video/mp4' : 'image/jpeg' })
    const uploadResult = await mediaUploadsService.uploadAndTrack(file, {
      founderId,
      usageType: photo.isVideo ? 'reel-preview' : 'carousel-slide',
    })
    if (!uploadResult.media) {
      if (uploadResult.error) uploadErrors.push(`${filename}: ${uploadResult.error}`)
      continue
    }

    let thumbnailUrl = uploadResult.media.publicUrl
    let reelVideoUrl: string | undefined
    if (photo.isVideo) {
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

    const readableDate = new Date(photo.timestamp * 1000).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
    const title = fallbackWho ? `${fallbackWho} — Photo, ${readableDate}` : `Photo from ${readableDate}`

    built.push({
      id: `imp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      founderId,
      businessId,
      sourcePlatform: 'icloud',
      originalUrl: '',
      thumbnailUrl,
      reelVideoUrl,
      title,
      // No caption exists in an iCloud export — left blank, same as a
      // Snapchat import, so Content's "Needs More Value" correctly flags
      // it until the founder writes something real.
      publishedAt: new Date(photo.timestamp * 1000).toISOString(),
      importedAt: new Date().toISOString(),
      status: 'draft',
      topics: [],
      locations: [],
      visibility: 'private',
      contentTypeHint: photo.isVideo ? ['reel'] : ['blog'],
      flaggedForReview: true,
    })
  }

  return { built, uploadErrors }
}
