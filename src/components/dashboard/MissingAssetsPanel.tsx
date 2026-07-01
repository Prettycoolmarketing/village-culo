import type { MissingItem } from '../../utils/missingAssets'

interface MissingAssetsPanelProps {
  items: MissingItem[]
  className?: string
  onAction?: (item: MissingItem) => void
}

function Group({
  heading,
  items,
  dotColor,
  headingColor,
  borderColor,
  bgColor,
  onAction,
}: {
  heading: string
  items: MissingItem[]
  dotColor: string
  headingColor: string
  borderColor: string
  bgColor: string
  onAction?: (item: MissingItem) => void
}) {
  if (items.length === 0) return null
  return (
    <div className={`rounded-xl border ${borderColor} overflow-hidden`}>
      <div className={`px-4 py-2 ${bgColor} border-b ${borderColor} flex items-center gap-2`}>
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor} inline-block`} />
        <p className={`text-xs font-semibold ${headingColor} uppercase tracking-widest`}>
          {heading} — {items.length}
        </p>
      </div>
      {items.map(item => (
        <div key={item.field} className="flex items-center gap-3 px-4 py-2.5 border-b border-[#F3EDE6] last:border-0 bg-white">
          <span className={`w-1.5 h-1.5 rounded-full ${dotColor} shrink-0`} />
          <p className="text-sm text-[#2D2A26] flex-1">{item.label}</p>
          <button
            type="button"
            onClick={() => onAction?.(item)}
            className="text-xs font-semibold text-[#C86A43] hover:underline shrink-0"
          >
            {item.action} →
          </button>
        </div>
      ))}
    </div>
  )
}

export function MissingAssetsPanel({ items, className = '', onAction }: MissingAssetsPanelProps) {
  if (items.length === 0) {
    return (
      <div className={`flex items-center gap-3 px-4 py-4 rounded-xl bg-green-50 border border-green-100 ${className}`}>
        <span className="text-green-500 text-lg">✓</span>
        <div>
          <p className="text-sm font-medium text-green-700">Ready to publish</p>
          <p className="text-xs text-green-600 mt-0.5">Everything looks great — nothing left to add here.</p>
        </div>
      </div>
    )
  }

  const recommended   = items.filter(i => i.severity === 'critical')
  const niceToImprove = items.filter(i => i.severity === 'important')
  const optional       = items.filter(i => i.severity === 'nice-to-have')

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <Group
        heading="Recommended"
        items={recommended}
        dotColor="bg-[#C86A43]"
        headingColor="text-[#C86A43]"
        borderColor="border-[#F0DDD2]"
        bgColor="bg-[#FBF1EB]"
        onAction={onAction}
      />
      <Group
        heading="Nice to improve"
        items={niceToImprove}
        dotColor="bg-amber-400"
        headingColor="text-amber-700"
        borderColor="border-amber-200"
        bgColor="bg-amber-50"
        onAction={onAction}
      />
      <Group
        heading="Optional"
        items={optional}
        dotColor="bg-[#9CA3AF]"
        headingColor="text-[#9CA3AF]"
        borderColor="border-[#E8E4DD]"
        bgColor="bg-[#F8F5F0]"
        onAction={onAction}
      />
    </div>
  )
}
