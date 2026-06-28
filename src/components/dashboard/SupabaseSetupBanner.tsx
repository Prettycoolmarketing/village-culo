export function SupabaseSetupBanner() {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3 mb-6">
      <svg className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-amber-800">Dev mode — no Supabase configured</p>
        <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
          Data is stored locally in this browser only. File uploads are disabled.{' '}
          Add <code className="font-mono bg-amber-100 px-1 rounded">VITE_SUPABASE_URL</code> and{' '}
          <code className="font-mono bg-amber-100 px-1 rounded">VITE_SUPABASE_ANON_KEY</code> to your <code className="font-mono bg-amber-100 px-1 rounded">.env</code> to enable persistence and uploads.
        </p>
      </div>
    </div>
  )
}
