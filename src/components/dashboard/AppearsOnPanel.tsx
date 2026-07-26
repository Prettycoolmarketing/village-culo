import type { AppearsOnLocation } from '../../utils/appearsOn'
import { ConfirmButton } from '../ui/ConfirmButton'

const typeLabel: Record<AppearsOnLocation['type'], string> = {
  page:    'Page',
  profile: 'Profile',
  listing: 'Directory',
  detail:  'Detail',
}

const typeColor: Record<AppearsOnLocation['type'], string> = {
  page:    'bg-blue-100 text-blue-700',
  profile: 'bg-[#C86A43]/10 text-[#C86A43]',
  listing: 'bg-[#5E6B4A]/10 text-[#5E6B4A]',
  detail:  'bg-[#D6A94D]/15 text-[#A07520]',
}

interface AppearsOnPanelProps {
  locations: AppearsOnLocation[]
  className?: string
  // When provided, any location with a `key` gets a turn off/on control —
  // turning off asks for confirmation first (same inline pattern as delete
  // elsewhere in the dashboard); turning back on doesn't, since it isn't
  // destructive.
  onToggle?: (key: string, hide: boolean) => void
}

export function AppearsOnPanel({ locations, className = '', onToggle }: AppearsOnPanelProps) {
  if (locations.length === 0) {
    return (
      <div className={`px-4 py-8 text-center bg-[#F8F5F0] rounded-xl border border-[#E8E4DD] ${className}`}>
        <p className="text-sm font-medium text-[#6B7280]">Not visible in the Village yet.</p>
        <p className="text-xs text-[#9CA3AF] mt-1">Set status to Published or Featured to surface this content.</p>
      </div>
    )
  }

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {locations.map((loc, i) => (
        <div
          key={i}
          className={`flex items-center justify-between px-4 py-3 bg-white rounded-xl border transition-all ${
            loc.hidden ? 'border-[#E8E4DD] opacity-60' : 'border-[#E8E4DD] hover:border-[#C86A43]/40 hover:shadow-sm'
          }`}
        >
          <a
            href={loc.path}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 min-w-0 group"
          >
            <p className={`text-sm truncate transition-colors ${loc.hidden ? 'text-[#9CA3AF] line-through' : 'text-[#2D2A26] group-hover:text-[#C86A43]'}`}>
              {loc.label}
            </p>
          </a>
          <div className="flex items-center gap-2 shrink-0 ml-3">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${typeColor[loc.type]}`}>
              {typeLabel[loc.type]}
            </span>
            {onToggle && loc.key && (
              loc.hidden ? (
                <button
                  type="button"
                  onClick={() => onToggle(loc.key!, false)}
                  className="text-xs font-semibold text-[#5E6B4A] hover:underline"
                >
                  Turn back on
                </button>
              ) : (
                <ConfirmButton
                  label="Turn off"
                  confirmLabel="Yes, hide it"
                  message={`Stop showing this on ${loc.label}?`}
                  onConfirm={() => onToggle(loc.key!, true)}
                  className="text-xs text-[#9CA3AF] hover:text-red-500 transition-colors"
                />
              )
            )}
            <a href={loc.path} target="_blank" rel="noopener noreferrer" className="text-[#9CA3AF] text-xs">↗</a>
          </div>
        </div>
      ))}
    </div>
  )
}
