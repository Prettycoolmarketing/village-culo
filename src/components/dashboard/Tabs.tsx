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
    <div className={`flex border-b border-[#E8E4DD] overflow-x-auto shrink-0 ${className}`}>
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
            active === tab.key
              ? 'border-[#C86A43] text-[#C86A43]'
              : 'border-transparent text-[#6B7280] hover:text-[#2D2A26]'
          }`}
        >
          {tab.label}
          {tab.badge !== undefined && tab.badge > 0 && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${
              active === tab.key
                ? 'bg-[#C86A43]/15 text-[#C86A43]'
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
