export interface RelItem {
  id: string
  label: string
  sublabel?: string
  path: string
  image?: string
}

export interface RelGroup {
  title: string
  items: RelItem[]
}

interface RelationshipsPanelProps {
  groups: RelGroup[]
  className?: string
}

export function RelationshipsPanel({ groups, className = '' }: RelationshipsPanelProps) {
  const nonEmpty = groups.filter(g => g.items.length > 0)

  if (nonEmpty.length === 0) {
    return (
      <div className={`px-4 py-8 text-center bg-[#F8F5F0] rounded-xl border border-[#E8E4DD] ${className}`}>
        <p className="text-sm font-medium text-[#6B7280]">No relationships mapped yet.</p>
        <p className="text-xs text-[#9CA3AF] mt-1">Connect this object to stories, ideas and other Village content.</p>
      </div>
    )
  }

  return (
    <div className={`flex flex-col gap-5 ${className}`}>
      {nonEmpty.map(group => (
        <div key={group.title}>
          <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-widest mb-2">{group.title}</p>
          <div className="flex flex-col gap-1.5">
            {group.items.map(item => (
              <a
                key={item.id}
                href={item.path}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-3 py-2.5 bg-white rounded-lg border border-[#E8E4DD] hover:border-[#C86A43]/40 transition-all group"
              >
                {item.image && (
                  <img
                    src={item.image}
                    alt=""
                    className="w-7 h-7 rounded object-cover shrink-0 bg-[#F3EDE6]"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#2D2A26] group-hover:text-[#C86A43] transition-colors truncate">
                    {item.label}
                  </p>
                  {item.sublabel && (
                    <p className="text-xs text-[#9CA3AF] truncate">{item.sublabel}</p>
                  )}
                </div>
                <span className="text-[#9CA3AF] text-xs shrink-0">↗</span>
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
