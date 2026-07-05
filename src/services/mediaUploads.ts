import { readCache, writeEntity, deleteEntity, type WriteResult } from '../lib/entityStore'
import { uploadFile, deleteFile, getBucketForFile, type StorageBucket } from '../lib/storage'
import type { TrackedMedia, TrackedMediaType, AssetRole } from '../types'

// Media Upload Foundation — the one path every upload (founder photo, business
// logo, story hero, MP4, audio, document) goes through, and the one future
// connectors (Canva export, YouTube thumbnail, Google Drive video, podcast
// audio) will create the same TrackedMedia shape through, once built.

const KEY = 'media_uploads'
const TABLE = 'media_uploads'

const BUCKET_TO_MEDIA_TYPE: Record<StorageBucket, TrackedMediaType> = {
  media: 'image',
  videos: 'video',
  audio: 'audio',
  documents: 'document',
}

function toRow(m: TrackedMedia, userId: string) {
  return {
    id: m.id,
    user_id: userId,
    founder_id: m.founderId ?? null,
    business_id: m.businessId ?? null,
    storage_path: m.storagePath,
    public_url: m.publicUrl,
    bucket: m.bucket,
    media_type: m.mediaType,
    file_name: m.fileName,
    file_size: m.fileSize ?? null,
    mime_type: m.mimeType ?? null,
    alt_text: m.altText ?? null,
    caption: m.caption ?? null,
    usage_type: m.usageType ?? null,
    data: m,
  }
}

export interface UploadAndTrackOptions {
  founderId?: string
  businessId?: string
  usageType?: AssetRole
  altText?: string
  caption?: string
  credit?: string
}

export interface UploadAndTrackResult {
  media?: TrackedMedia
  error?: string
}

export const mediaUploadsService = {
  getAll(): TrackedMedia[] {
    return readCache<TrackedMedia>(KEY)
  },

  getByFounder(founderId: string): TrackedMedia[] {
    return this.getAll().filter(m => m.founderId === founderId)
  },

  getByBusiness(businessId: string): TrackedMedia[] {
    return this.getAll().filter(m => m.businessId === businessId)
  },

  /**
   * Uploads to Supabase Storage (lib/storage.ts picks the bucket from the
   * file's mime type) and creates the tracking record in one step. Every
   * consumer of the shared MediaUpload component goes through this — nothing
   * uploads a file without a TrackedMedia row to show for it.
   */
  async uploadAndTrack(file: File, opts: UploadAndTrackOptions = {}): Promise<UploadAndTrackResult> {
    const uploadResult = await uploadFile(file)
    if (uploadResult.error) return { error: uploadResult.error }

    const media: TrackedMedia = {
      id: crypto.randomUUID(),
      founderId: opts.founderId,
      businessId: opts.businessId,
      storagePath: uploadResult.path,
      publicUrl: uploadResult.url,
      bucket: uploadResult.bucket,
      mediaType: BUCKET_TO_MEDIA_TYPE[getBucketForFile(file)],
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      altText: opts.altText,
      caption: opts.caption,
      credit: opts.credit,
      usageType: opts.usageType,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const result = await writeEntity<TrackedMedia>({ cacheKey: KEY, item: media, table: TABLE, toRow })
    if (!result.success) return { error: result.error ?? 'Failed to save upload record' }
    return { media }
  },

  async remove(media: TrackedMedia): Promise<WriteResult> {
    await deleteFile(media.bucket as StorageBucket, media.storagePath)
    return deleteEntity({ cacheKey: KEY, id: media.id, table: TABLE })
  },
}
