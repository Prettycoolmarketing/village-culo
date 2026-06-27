import type { Media, ApprovalStatus } from '../../types'

// ─── Status badge ──────────────────────────────────────────────────────────────

const statusConfig: Record<ApprovalStatus, { label: string; className: string }> = {
  approved:     { label: 'Approved',      className: 'bg-green-100 text-green-800' },
  rejected:     { label: 'Rejected',      className: 'bg-red-100 text-red-800' },
  'needs-review': { label: 'Needs Review', className: 'bg-amber-100 text-amber-800' },
  pending:      { label: 'Pending',       className: 'bg-slate-100 text-slate-600' },
}

const sourceTypeLabel: Record<string, string> = {
  'manual-upload':    'Upload',
  'official-website': 'Website',
  'linkedin':         'LinkedIn',
  'instagram':        'Instagram',
  'youtube':          'YouTube',
  'tiktok':           'TikTok',
  'amazon':           'Amazon',
  'podcast':          'Podcast',
  'speaker-page':     'Speaker Page',
  'canva-publish':    'Canva',
  'system-generated': 'System',
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface MediaCardProps {
  media: Media
  variant?: 'default' | 'compact'
  selected?: boolean
  onApprove?: (id: string) => void
  onReject?: (id: string) => void
  onSelect?: (id: string) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MediaCard({
  media,
  variant = 'default',
  selected = false,
  onApprove,
  onReject,
  onSelect,
}: MediaCardProps) {
  const status = statusConfig[media.approvalStatus]

  if (variant === 'compact') {
    return (
      <div
        className={`relative rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
          selected ? 'border-primary shadow-md' : 'border-border hover:border-primary/40'
        }`}
        onClick={() => onSelect?.(media.id)}
      >
        <div className="aspect-square bg-surface-hover">
          <img
            src={media.thumbnailUrl ?? media.fileUrl}
            alt={media.altText}
            className="w-full h-full object-cover"
          />
        </div>
        <div className={`absolute top-1.5 right-1.5 text-xs font-medium px-1.5 py-0.5 rounded-full ${status.className}`}>
          {status.label}
        </div>
        {selected && (
          <div className="absolute inset-0 bg-primary/10 border-2 border-primary rounded-lg pointer-events-none" />
        )}
      </div>
    )
  }

  return (
    <div className={`bg-surface rounded-xl border overflow-hidden transition-all ${
      selected ? 'border-primary shadow-md' : 'border-border'
    }`}>
      {/* Thumbnail */}
      <div className="relative aspect-video bg-surface-hover overflow-hidden">
        <img
          src={media.thumbnailUrl ?? media.fileUrl}
          alt={media.altText}
          className="w-full h-full object-cover"
        />
        {/* Media type pill */}
        <span className="absolute bottom-2 left-2 text-xs font-medium bg-black/60 text-white px-2 py-0.5 rounded-full capitalize">
          {media.mediaType.replace(/-/g, ' ')}
        </span>
        {/* Source badge */}
        <span className="absolute top-2 left-2 text-xs bg-black/60 text-white px-2 py-0.5 rounded-full">
          {sourceTypeLabel[media.sourceType] ?? media.sourceType}
        </span>
      </div>

      {/* Body */}
      <div className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-primary leading-snug line-clamp-2">{media.title}</p>
          <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${status.className}`}>
            {status.label}
          </span>
        </div>

        {media.altText && (
          <p className="text-xs text-muted line-clamp-2">{media.altText}</p>
        )}

        {/* Role tag */}
        <p className="text-xs text-muted">
          Role: <span className="text-foreground capitalize">{media.assetRole.replace(/-/g, ' ')}</span>
        </p>

        {/* Source URL */}
        {media.sourceUrl && (
          <p className="text-xs text-muted truncate">
            Source: <span className="text-foreground">{new URL(media.sourceUrl).hostname}</span>
          </p>
        )}

        {/* Actions */}
        {(onApprove || onReject || onSelect) && (
          <div className="flex gap-2 pt-1">
            {onApprove && media.approvalStatus !== 'approved' && (
              <button
                onClick={() => onApprove(media.id)}
                className="flex-1 text-xs font-medium py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
              >
                Approve
              </button>
            )}
            {onReject && media.approvalStatus !== 'rejected' && (
              <button
                onClick={() => onReject(media.id)}
                className="flex-1 text-xs font-medium py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
              >
                Reject
              </button>
            )}
            {onSelect && (
              <button
                onClick={() => onSelect(media.id)}
                className={`flex-1 text-xs font-medium py-1.5 rounded-lg transition-colors ${
                  selected
                    ? 'bg-primary text-white'
                    : 'bg-surface-hover text-foreground hover:bg-primary/10'
                }`}
              >
                {selected ? 'Selected' : 'Select'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
