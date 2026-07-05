import { useRef, useState, type DragEvent } from 'react'
import { isSupabaseConfigured } from '../../lib/supabase'
import { mediaUploadsService, type UploadAndTrackOptions } from '../../services/mediaUploads'
import type { TrackedMedia } from '../../types'

// Media Upload Foundation — the one upload component every workflow (founder
// photo, business logo, story hero, MP4, audio, document) uses, so a founder
// never has to paste a URL for their own file. Every successful upload calls
// mediaUploadsService.uploadAndTrack(), so a TrackedMedia record always exists
// alongside the value this component reports back — the same record shape a
// future connector (Canva, YouTube, Drive) will create.

export type MediaAccept = 'image' | 'video' | 'audio' | 'document' | 'any'

const ACCEPT_MIME: Record<MediaAccept, string> = {
  image: 'image/*',
  video: 'video/*,.mp4,.mov,.webm',
  audio: 'audio/*,.mp3,.m4a,.wav',
  document: '.pdf,.doc,.docx,.txt,.md',
  any: 'image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.md',
}

function inferKindFromUrl(url: string): 'image' | 'video' | 'audio' | 'document' {
  const ext = url.split('.').pop()?.toLowerCase().split('?')[0] ?? ''
  if (['mp4', 'mov', 'webm', 'm4v'].includes(ext)) return 'video'
  if (['mp3', 'm4a', 'wav', 'ogg'].includes(ext)) return 'audio'
  if (['pdf', 'doc', 'docx', 'txt', 'md'].includes(ext)) return 'document'
  return 'image'
}

interface MediaUploadProps {
  value?: string
  onChange: (url: string, media?: TrackedMedia) => void
  accept?: MediaAccept
  label?: string
  aspect?: 'square' | 'wide' | 'auto'
  uploadOptions?: UploadAndTrackOptions
  className?: string
}

export function MediaUpload({
  value,
  onChange,
  accept = 'image',
  label,
  aspect = 'square',
  uploadOptions,
  className = '',
}: MediaUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)

  const defaultLabel =
    accept === 'video'    ? 'Upload video (MP4, MOV)' :
    accept === 'audio'    ? 'Upload audio (MP3, M4A, WAV)' :
    accept === 'document' ? 'Upload document (PDF, DOCX)' :
    accept === 'any'      ? 'Upload a file' :
    'Upload image'

  async function handleFile(file: File | undefined) {
    if (!file) return
    setError('')
    if (!isSupabaseConfigured) {
      setError('Connect Supabase to enable uploads.')
      return
    }
    setUploading(true)
    const result = await mediaUploadsService.uploadAndTrack(file, uploadOptions)
    setUploading(false)
    if (result.error) setError(result.error)
    else if (result.media) onChange(result.media.publicUrl, result.media)
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragOver(false)
    void handleFile(e.dataTransfer.files?.[0])
  }

  const kind = value ? inferKindFromUrl(value) : accept === 'any' ? 'image' : accept
  const heightClass = aspect === 'square' ? 'h-32' : aspect === 'wide' ? 'h-40' : 'h-auto min-h-[8rem]'

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_MIME[accept]}
        onChange={e => void handleFile(e.target.files?.[0])}
        className="hidden"
      />
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        role="button"
        tabIndex={0}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click() }}
        className={`w-full border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 transition-colors overflow-hidden cursor-pointer ${heightClass} ${
          dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary'
        } ${uploading ? 'opacity-70 pointer-events-none' : ''}`}
      >
        {uploading ? (
          <>
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-medium text-muted">Uploading…</span>
          </>
        ) : value ? (
          kind === 'video' ? (
            <video src={value} controls className="w-full h-full object-contain bg-charcoal" />
          ) : kind === 'audio' ? (
            <div className="w-full px-4 py-3">
              <audio src={value} controls className="w-full" />
            </div>
          ) : kind === 'document' ? (
            <a href={value} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="flex items-center gap-2 text-sm text-primary underline px-4">
              View document ↗
            </a>
          ) : (
            <img src={value} alt="" className="w-full h-full object-cover" />
          )
        ) : (
          <>
            <svg className="w-6 h-6 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span className="text-xs font-medium text-muted text-center px-2">{label ?? defaultLabel}</span>
            <span className="text-[10px] text-muted/70">or drag and drop</span>
          </>
        )}
      </div>
      <div className="flex items-center gap-3 mt-1.5">
        {value && !uploading && (
          <>
            <button type="button" onClick={() => inputRef.current?.click()} className="text-xs text-muted hover:text-primary transition-colors">
              Replace
            </button>
            <button type="button" onClick={() => onChange('')} className="text-xs text-muted hover:text-red-500 transition-colors">
              Remove
            </button>
          </>
        )}
      </div>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  )
}
