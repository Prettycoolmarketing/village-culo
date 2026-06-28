import type { MissingItem } from '../../utils/missingAssets'
import { getHealthScore } from '../../utils/missingAssets'

interface HealthBadgeProps {
  missing: MissingItem[]
  size?: 'sm' | 'md'
}

export function HealthBadge({ missing, size = 'sm' }: HealthBadgeProps) {
  const critical = missing.filter(m => m.severity === 'critical').length
  const important = missing.filter(m => m.severity === 'important').length

  const textSize = size === 'sm' ? 'text-xs' : 'text-sm'

  if (missing.length === 0) {
    return (
      <span className={`flex items-center gap-1 ${textSize} text-green-600 font-medium`}>
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block shrink-0" />
        Complete
      </span>
    )
  }
  if (critical > 0) {
    return (
      <span className={`flex items-center gap-1 ${textSize} text-red-600 font-medium`}>
        <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block shrink-0" />
        {critical} critical
      </span>
    )
  }
  return (
    <span className={`flex items-center gap-1 ${textSize} text-amber-600 font-medium`}>
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block shrink-0" />
      {important} missing
    </span>
  )
}

interface PublishingHealthCardProps {
  title: string
  subtitle?: string
  missing: MissingItem[]
  editPath?: string
}

export function PublishingHealthCard({ title, subtitle, missing, editPath }: PublishingHealthCardProps) {
  const score = getHealthScore(missing)
  const scoreColor = score === 100 ? 'text-green-600' : score >= 60 ? 'text-amber-600' : 'text-red-600'
  const barColor   = score === 100 ? 'bg-green-400'  : score >= 60 ? 'bg-amber-400'  : 'bg-red-400'

  return (
    <div className="bg-white rounded-xl border border-[#E8E4DD] px-5 py-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#2D2A26] truncate">{title}</p>
          {subtitle && <p className="text-xs text-[#9CA3AF] mt-0.5 truncate">{subtitle}</p>}
          <div className="mt-1">
            <HealthBadge missing={missing} />
          </div>
        </div>
        <span className={`text-xl font-bold ${scoreColor} shrink-0`}>{score}%</span>
      </div>
      <div className="w-full h-1.5 bg-[#F3EDE6] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${score}%` }}
        />
      </div>
      {editPath && missing.length > 0 && (
        <a href={editPath} className="text-xs text-[#C86A43] hover:underline mt-2 inline-block">
          Fix {missing.filter(m => m.severity === 'critical').length > 0 ? 'critical issues' : 'issues'} →
        </a>
      )}
    </div>
  )
}
