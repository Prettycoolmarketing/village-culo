import { getPublishState } from '../../utils/publishing'
import type { Founder } from '../../types'

// A quiet "N publications left" chip. Renders nothing until the founder
// is within PUBLISH_METER_THRESHOLD of a limit, and never for a
// PCM-managed founder. On brand: sand background, terracotta text.

export function PublicationMeter({
  founder,
  kind,
  className = '',
}: {
  founder: Founder | null | undefined
  kind: 'imported' | 'self'
  className?: string
}) {
  const s = getPublishState(founder)
  const show = kind === 'imported' ? s.showArchiveMeter : s.showSelfMeter
  if (!founder || !show) return null

  const remaining = kind === 'imported'
    ? (s.archiveRemaining === Number.POSITIVE_INFINITY ? null : s.archiveRemaining)
    : s.selfRemaining
  if (remaining == null) return null

  const label = kind === 'imported' ? 'archive publications' : 'free publications'
  const out = remaining === 0

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
        out ? 'bg-[#FBF1EB] text-[#B85C3A]' : 'bg-[#F8F5F0] text-[#C86A43]'
      } ${className}`}
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {out
        ? `You're out of ${label}`
        : `${remaining} ${label} ${s.paidRemaining > 0 ? '(then pack credits)' : 'left'}`}
    </span>
  )
}
