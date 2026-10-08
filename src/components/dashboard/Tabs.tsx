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
  // Default (false) keeps every existing usage of this shared component
  // exactly as it was — horizontal, scrolling sideways on narrow screens.
  // Profile's own tab row opts into this instead. A full-width single-
  // column stack (one row per tab) was tried first, but with 6 tabs that's
  // ~240px of buttons before any real content shows on a phone — reads as
  // the tab bar "blocking" the profile below it. A 2-column grid on mobile
  // keeps the same easy-to-tap full-width targets in roughly a third of
  // the height, back to the normal horizontal row at md+.
  stackOnMobile?: boolean
}

export function Tabs({ tabs, active, onChange, className = '', stackOnMobile = false }: TabsProps) {
  return (
    <div className={`${stackOnMobile ? 'grid grid-cols-2 md:flex' : 'flex'} gap-1.5 border-b border-[#E8E4DD] pb-3 ${stackOnMobile ? 'md:overflow-x-auto' : 'overflow-x-auto'} shrink-0 ${className}`}>
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`flex items-center gap-1.5 px-2 md:px-4 py-2 text-xs md:text-sm font-semibold rounded-lg transition-colors ${
            stackOnMobile ? 'w-full md:w-auto justify-center whitespace-normal text-center md:whitespace-nowrap' : 'whitespace-nowrap'
          } ${
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
