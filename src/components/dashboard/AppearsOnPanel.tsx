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

// Labels follow a "Kind: Title" convention (e.g. "Story: My Launch Post") —
// used to group the list into collapsible sections (Stories, Topics, Ideas…)
// instead of one long flat wall, the same way Featured Video collapses a
// long pick-list into a dropdown. Anything without a "Kind: " prefix (the
// founder's own directory/profile/homepage entries) is a one-off, singular
// page, so it stays as its own standalone row rather than a group of one.
const GROUP_PLURALS: Record<string, string> = {
  Story: 'Stories',
  Topic: 'Topics',
  Idea: 'Ideas',
  Library: 'Library items',
  Expertise: 'Expertise pages',
  Business: 'Businesses',
  Founder: 'Founders',
}

function splitLabel(label: string): { group: string; rest: string } | null {
  const match = label.match(/^([A-Za-z][\w\s]*?): (.+)$/)
  if (!match) return null
  return { group: match[1]!, rest: match[2]! }
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

function LocationRow({ loc, onToggle }: { loc: AppearsOnLocation; onToggle?: (key: string, hide: boolean) => void }) {
  const split = splitLabel(loc.label)
  return (
    <div
      className={`flex items-center justify-between px-4 py-3 bg-white rounded-xl border transition-all ${
        loc.hidden ? 'border-[#E8E4DD] opacity-60' : 'border-[#E8E4DD] hover:border-[#C86A43]/40 hover:shadow-sm'
      }`}
    >
      <a href={loc.path} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-0 group">
        <p className={`text-sm truncate transition-colors ${loc.hidden ? 'text-[#9CA3AF] line-through' : 'text-[#2D2A26] group-hover:text-[#C86A43]'}`}>
          {split ? split.rest : loc.label}
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
  )
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

  const standalone: AppearsOnLocation[] = []
  const groups = new Map<string, AppearsOnLocation[]>()
  for (const loc of locations) {
    const split = splitLabel(loc.label)
    if (!split) { standalone.push(loc); continue }
    const list = groups.get(split.group) ?? []
    list.push(loc)
    groups.set(split.group, list)
  }

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {standalone.map((loc, i) => <LocationRow key={i} loc={loc} onToggle={onToggle} />)}

      {[...groups.entries()].map(([group, items]) => (
        <details key={group} className="group rounded-xl border border-[#E8E4DD] bg-white">
          <summary className="flex items-center justify-between gap-2.5 px-4 py-3 cursor-pointer list-none text-sm text-[#2D2A26]">
            <span className="font-medium">{GROUP_PLURALS[group] ?? `${group}s`} ({items.length})</span>
            <svg className="w-4 h-4 text-[#9CA3AF] transition-transform group-open:rotate-180 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </summary>
          <div className="flex flex-col gap-1.5 px-3 pb-3 pt-1 border-t border-[#F3EDE6]">
            {items.map((loc, i) => <LocationRow key={i} loc={loc} onToggle={onToggle} />)}
          </div>
        </details>
      ))}
    </div>
  )
}
