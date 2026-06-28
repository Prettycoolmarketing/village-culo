import type { MissingItem } from '../../utils/missingAssets'

interface MissingAssetsPanelProps {
  items: MissingItem[]
  className?: string
}

export function MissingAssetsPanel({ items, className = '' }: MissingAssetsPanelProps) {
  if (items.length === 0) {
    return (
      <div className={`flex items-center gap-3 px-4 py-4 rounded-xl bg-green-50 border border-green-100 ${className}`}>
        <span className="text-green-500 text-lg">✓</span>
        <div>
          <p className="text-sm font-medium text-green-700">Publishing complete</p>
          <p className="text-xs text-green-600 mt-0.5">No missing assets or content detected.</p>
        </div>
      </div>
    )
  }

  const critical  = items.filter(i => i.severity === 'critical')
  const important = items.filter(i => i.severity === 'important')
  const nice      = items.filter(i => i.severity === 'nice-to-have')

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {critical.length > 0 && (
        <div className="rounded-xl border border-red-200 overflow-hidden">
          <div className="px-4 py-2 bg-red-50 border-b border-red-100 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
            <p className="text-xs font-semibold text-red-700 uppercase tracking-widest">
              Critical — {critical.length} {critical.length === 1 ? 'issue' : 'issues'}
            </p>
          </div>
          {critical.map(item => (
            <div key={item.field} className="flex items-center gap-3 px-4 py-2.5 border-b border-red-50 last:border-0 bg-white">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
              <p className="text-sm text-[#2D2A26]">{item.label}</p>
            </div>
          ))}
        </div>
      )}

      {important.length > 0 && (
        <div className="rounded-xl border border-amber-200 overflow-hidden">
          <div className="px-4 py-2 bg-amber-50 border-b border-amber-100 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-widest">
              Important — {important.length} {important.length === 1 ? 'issue' : 'issues'}
            </p>
          </div>
          {important.map(item => (
            <div key={item.field} className="flex items-center gap-3 px-4 py-2.5 border-b border-amber-50 last:border-0 bg-white">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
              <p className="text-sm text-[#2D2A26]">{item.label}</p>
            </div>
          ))}
        </div>
      )}

      {nice.length > 0 && (
        <div className="rounded-xl border border-[#E8E4DD] overflow-hidden">
          <div className="px-4 py-2 bg-[#F8F5F0] border-b border-[#E8E4DD] flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#9CA3AF] inline-block" />
            <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest">
              Nice to have — {nice.length}
            </p>
          </div>
          {nice.map(item => (
            <div key={item.field} className="flex items-center gap-3 px-4 py-2.5 border-b border-[#F3EDE6] last:border-0 bg-white">
              <span className="w-1.5 h-1.5 rounded-full bg-[#9CA3AF] shrink-0" />
              <p className="text-sm text-[#6B7280]">{item.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
