export interface DashTab {
  key: string
  label: string
  badge?: number
}

interface TabsProps {
  tabs: DashTab[]
  active: string
  onChange: (key: string) => void
  className?: string
}

export function Tabs({ tabs, active, onChange, className = '' }: TabsProps) {
  return (
    <div className={`flex gap-1.5 border-b border-[#E8E4DD] pb-3 overflow-x-auto shrink-0 ${className}`}>
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold whitespace-nowrap rounded-lg transition-colors ${
            active === tab.key
              ? 'bg-[#C86A43] text-white'
              : 'text-[#6B7280] hover:bg-[#F3EDE6] hover:text-[#2D2A26]'
          }`}
        >
          {tab.label}
          {tab.badge !== undefined && tab.badge > 0 && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${
              active === tab.key
                ? 'bg-white/20 text-white'
                : 'bg-red-100 text-red-600'
            }`}>
              {tab.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
