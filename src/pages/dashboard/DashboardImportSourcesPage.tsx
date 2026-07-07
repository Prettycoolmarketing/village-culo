// No real source connections exist yet, so this page never shows example/
// placeholder rows pretending otherwise — an honest empty state until
// Instagram/LinkedIn/YouTube/Drive connectors are real.

export function DashboardImportSourcesPage() {
  return (
    <div className="p-8 max-w-3xl" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#2D2A26]">Import Sources</h1>
        <p className="text-sm text-[#6B7280] mt-1">Connect a platform so Village can discover your existing content automatically.</p>
      </div>

      <div className="bg-white rounded-xl border border-[#E8E4DD] px-5 py-8 text-center">
        <p className="text-sm font-medium text-[#2D2A26] mb-1">No sources connected yet</p>
        <p className="text-xs text-[#9CA3AF] max-w-sm mx-auto leading-relaxed">
          Automatic import from Instagram, LinkedIn, YouTube and OneDrive isn't available yet. In the meantime, use
          Import above to bring in existing content by pasting a link.
        </p>
      </div>
    </div>
  )
}
