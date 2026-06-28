import { importSources } from '../../data/media'

export function DashboardImportSourcesPage() {
  return (
    <div className="p-8 max-w-3xl" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#2D2A26]">Import Sources</h1>
          <p className="text-sm text-[#6B7280] mt-1">Connected sources for importing media and content.</p>
        </div>
      </div>

      <div className="mb-6 px-4 py-3 rounded-lg bg-[#5E6B4A]/10 border border-[#5E6B4A]/20 text-sm text-[#5E6B4A]">
        Import sources let CULO discover your existing content — Instagram posts, LinkedIn articles, OneDrive photos, YouTube videos. Once connected, discovered assets appear in Media as suggestions for your review.
      </div>

      <div className="bg-white rounded-xl border border-[#E8E4DD] divide-y divide-[#F3EDE6] mb-6">
        {importSources.map(source => (
          <div key={source.id} className="flex items-center gap-4 px-5 py-4">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0 ${
              source.sourceType === 'instagram' ? 'bg-pink-500' :
              source.sourceType === 'linkedin'  ? 'bg-blue-600' :
              source.sourceType === 'youtube'   ? 'bg-red-500'  :
              'bg-[#9CA3AF]'
            }`}>
              {source.sourceType.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#2D2A26]">{source.label}</p>
              <p className="text-xs text-[#9CA3AF] mt-0.5 truncate">{source.url}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {source.discoveredMediaCount !== undefined && (
                <span className="text-xs text-[#6B7280]">{source.discoveredMediaCount} assets</span>
              )}
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                source.status === 'complete' ? 'bg-green-100 text-green-700' :
                source.status === 'scanning' ? 'bg-blue-100 text-blue-700'  :
                source.status === 'error'    ? 'bg-red-100 text-red-700'    :
                'bg-[#F3EDE6] text-[#9CA3AF]'
              }`}>
                {source.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-[#E8E4DD] px-5 py-5">
        <p className="text-sm font-semibold text-[#2D2A26] mb-1">Connect a New Source</p>
        <p className="text-xs text-[#9CA3AF] mb-4">Instagram, LinkedIn, OneDrive, YouTube and TikTok import coming in the next sprint.</p>
        <button
          disabled
          className="px-4 py-2 text-sm font-medium rounded-lg border border-[#E8E4DD] text-[#9CA3AF] cursor-not-allowed"
        >
          Coming Soon
        </button>
      </div>
    </div>
  )
}
