import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { resetAndReseed } from '../../lib/seedStore'

export function DashboardSettingsPage() {
  const { user, isConfigured } = useAuth()
  const [resetting, setResetting] = useState(false)
  const [resetDone, setResetDone] = useState(false)

  function handleReset() {
    if (!window.confirm('This will reset all local edits back to the original demo data. Are you sure?')) return
    setResetting(true)
    resetAndReseed()
    setResetting(false)
    setResetDone(true)
    setTimeout(() => window.location.reload(), 800)
  }

  return (
    <div className="p-8 max-w-2xl" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#2D2A26]">Settings</h1>
        <p className="text-sm text-[#6B7280] mt-1">Manage your account and integrations.</p>
      </div>

      {/* Account */}
      <section className="mb-8">
        <h2 className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest mb-4">Account</h2>
        <div className="bg-white rounded-xl border border-[#E8E4DD] divide-y divide-[#F3EDE6]">
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-sm font-medium text-[#2D2A26]">Email</p>
              <p className="text-xs text-[#9CA3AF] mt-0.5">{user?.email ?? '—'}</p>
            </div>
          </div>
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-sm font-medium text-[#2D2A26]">Role</p>
              <p className="text-xs text-[#9CA3AF] mt-0.5 capitalize">{user?.role ?? '—'}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Local Data */}
      <section className="mb-8">
        <h2 className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest mb-4">Local Data</h2>
        <div className="bg-white rounded-xl border border-[#E8E4DD] px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-[#2D2A26]">Reset Demo Data</p>
              <p className="text-xs text-[#9CA3AF] mt-0.5 max-w-xs">
                Clears all local edits and reseeds the dashboard from the original static data. Use this to start fresh.
              </p>
              {resetDone && (
                <p className="text-xs text-green-600 mt-2 font-medium">Reset complete — reloading…</p>
              )}
            </div>
            <button
              onClick={handleReset}
              disabled={resetting || resetDone}
              className="shrink-0 px-4 py-2 text-sm font-semibold rounded-lg border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 disabled:opacity-60 transition-colors"
            >
              {resetting ? 'Resetting…' : 'Reset Data'}
            </button>
          </div>
        </div>
      </section>

      {/* Supabase status */}
      <section className="mb-8">
        <h2 className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest mb-4">Database</h2>
        <div className="bg-white rounded-xl border border-[#E8E4DD] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${isConfigured ? 'bg-green-400' : 'bg-amber-400'}`} />
            <div>
              <p className="text-sm font-medium text-[#2D2A26]">
                {isConfigured ? 'Supabase Connected' : 'localStorage (Dev Mode)'}
              </p>
              <p className="text-xs text-[#9CA3AF] mt-0.5">
                {isConfigured
                  ? 'Data is persisted to Supabase. Edits appear on the public Village.'
                  : 'Edits are saved to browser localStorage and survive page refresh. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to switch to Supabase.'}
              </p>
            </div>
          </div>
          {!isConfigured && (
            <div className="mt-4 bg-[#F8F5F0] rounded-lg px-4 py-3 font-mono text-xs text-[#6B7280]">
              <p>VITE_SUPABASE_URL=https://your-project.supabase.co</p>
              <p className="mt-0.5">VITE_SUPABASE_ANON_KEY=your-anon-key</p>
            </div>
          )}
        </div>
      </section>

      {/* Village link */}
      <section>
        <h2 className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest mb-4">Village</h2>
        <div className="bg-white rounded-xl border border-[#E8E4DD] px-5 py-4">
          <p className="text-sm font-medium text-[#2D2A26] mb-1">View Public Site</p>
          <p className="text-xs text-[#9CA3AF] mb-3">Public pages read from the same service layer as the dashboard. Saved edits are reflected immediately.</p>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg border border-[#E8E4DD] text-[#6B7280] hover:border-[#C86A43]/50 hover:text-[#C86A43] transition-colors"
          >
            Open CULO Village ↗
          </a>
        </div>
      </section>
    </div>
  )
}
