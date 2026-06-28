import type { FeaturedInLocation } from '../../utils/featuredIn'

const typeLabel: Record<FeaturedInLocation['type'], string> = {
  page:    'Page',
  profile: 'Profile',
  listing: 'Directory',
  detail:  'Detail',
}

const typeColor: Record<FeaturedInLocation['type'], string> = {
  page:    'bg-blue-100 text-blue-700',
  profile: 'bg-[#C86A43]/10 text-[#C86A43]',
  listing: 'bg-[#5E6B4A]/10 text-[#5E6B4A]',
  detail:  'bg-[#D6A94D]/15 text-[#A07520]',
}

interface FeaturedInPanelProps {
  locations: FeaturedInLocation[]
  className?: string
}

export function FeaturedInPanel({ locations, className = '' }: FeaturedInPanelProps) {
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
        <a
          key={i}
          href={loc.path}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-[#E8E4DD] hover:border-[#C86A43]/40 hover:shadow-sm transition-all group"
        >
          <p className="text-sm text-[#2D2A26] group-hover:text-[#C86A43] transition-colors">{loc.label}</p>
          <div className="flex items-center gap-2 shrink-0 ml-3">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${typeColor[loc.type]}`}>
              {typeLabel[loc.type]}
            </span>
            <span className="text-[#9CA3AF] text-xs">↗</span>
          </div>
        </a>
      ))}
    </div>
  )
}
