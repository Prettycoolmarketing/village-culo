import { getLibraryItems } from '../../services/library'

export function DashboardLibraryPage() {
  const items = getLibraryItems()

  return (
    <div className="p-8 max-w-4xl" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#2D2A26]">Library</h1>
          <p className="text-sm text-[#6B7280] mt-1">{items.length} products, guides and resources</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#E8E4DD] divide-y divide-[#F3EDE6]">
        {items.map(item => (
          <div key={item.id} className="flex items-center gap-4 px-5 py-4 hover:bg-[#FDFCFB] transition-colors">
            <img
              src={item.coverImage}
              alt=""
              className="w-12 h-12 rounded-lg object-cover shrink-0 bg-[#F3EDE6]"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#2D2A26] truncate">{item.title}</p>
              <p className="text-xs text-[#9CA3AF] mt-0.5">{item.productType}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                item.status === 'available' || item.status === 'free-download'
                  ? 'bg-green-100 text-green-700'
                  : item.status === 'coming-soon'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-[#F3EDE6] text-[#9CA3AF]'
              }`}>
                {item.status}
              </span>
              <a
                href={`/library/${item.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#9CA3AF] hover:text-[#C86A43] transition-colors text-sm"
                title="View on site"
              >
                ↗
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
