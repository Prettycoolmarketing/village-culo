import { supabase } from './supabase'

export type StorageBucket = 'media' | 'videos' | 'audio' | 'documents'

export interface UploadResult {
  url:    string
  path:   string
  bucket: StorageBucket
  error:  string | null
}

export function getBucketForFile(file: File): StorageBucket {
  const mime = file.type
  if (mime.startsWith('video/'))                                                          return 'videos'
  if (mime.startsWith('audio/'))                                                          return 'audio'
  if (mime === 'application/pdf' || mime.includes('word') || mime === 'text/plain')      return 'documents'
  return 'media'
}

export async function uploadFile(file: File, bucket?: StorageBucket): Promise<UploadResult> {
  if (!supabase) {
    return { url: '', path: '', bucket: 'media', error: 'Supabase not configured' }
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { url: '', path: '', bucket: 'media', error: 'Not authenticated' }
  }

  const targetBucket = bucket ?? getBucketForFile(file)
  const ext  = file.name.split('.').pop() ?? 'bin'
  const name = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  // Path is {user_id}/{filename} so storage delete policy (foldername[1] = auth.uid()) works.
  const path = `${user.id}/${name}`

  const { error: uploadErr } = await supabase.storage
    .from(targetBucket)
    .upload(path, file, { cacheControl: '3600', upsert: false })

  if (uploadErr) {
    return { url: '', path: '', bucket: targetBucket, error: uploadErr.message }
  }

  const { data } = supabase.storage.from(targetBucket).getPublicUrl(path)
  return { url: data.publicUrl, path, bucket: targetBucket, error: null }
}

export async function deleteFile(bucket: StorageBucket, path: string): Promise<void> {
  if (!supabase) return
  await supabase.storage.from(bucket).remove([path])
}
