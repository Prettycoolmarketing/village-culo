import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { resetAndReseed } from '../../lib/seedStore'
import { getFounders } from '../../services/founders'
import { publisherSettingsService } from '../../services/partnership'
import type { PublisherPartnershipSettings } from '../../types/partnership'

export function DashboardSettingsPage() {
  const { user, isConfigured } = useAuth()
  const [resetting, setResetting] = useState(false)
  const [resetDone, setResetDone] = useState(false)

  // Canonical founderId: resolve to actual Founder entity so Settings, Partnership,
  // Profile and Detection all share the same key.
  // In Supabase mode: getFounders().find(f => f.email === user?.email)?.id
  const founders  = getFounders()
  const founderId = founders[0]?.id ?? user?.id ?? 'dev-user'
  const [partnerSettings, setPartnerSettings] = useState<PublisherPartnershipSettings>(
    () => publisherSettingsService.getOrCreate(founderId)
  )
  const [partnerSaved, setPartnerSaved] = useState(false)

  function togglePartner(key: keyof PublisherPartnershipSettings) {
    setPartnerSettings(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))
    setPartnerSaved(false)
  }

  function savePartnerSettings() {
    publisherSettingsService.upsert(partnerSettings)
    setPartnerSaved(true)
    setTimeout(() => setPartnerSaved(false), 2000)
  }

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

      {/* Partnership Operating System */}
      <section className="mb-8">
        <h2 className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest mb-4">Partnership Operating System</h2>
        <div className="bg-white rounded-xl border border-[#E8E4DD] overflow-hidden">

          {/* Master toggle */}
          <div className="px-5 py-4 flex items-center justify-between border-b border-[#F3EDE6]">
            <div>
              <p className="text-sm font-semibold text-[#2D2A26]">Join the Partnership Operating System</p>
              <p className="text-xs text-[#9CA3AF] mt-0.5">Enable recommendations, opportunities and partnership features</p>
            </div>
            <button
              onClick={() => togglePartner('partnershipEnabled')}
              className={`w-11 h-6 rounded-full transition-colors relative ${partnerSettings.partnershipEnabled ? 'bg-[#C86A43]' : 'bg-[#E8E4DD]'}`}
              aria-label="Toggle partnership"
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${partnerSettings.partnershipEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          {/* Individual options */}
          {([
            { key: 'receiveRecommendations',       label: 'Enable Recommendations',       desc: 'Detect brands and products in your stories' },
            { key: 'receiveOpportunities',          label: 'Receive Opportunities',         desc: 'Speaking, podcasts, collaborations and campaigns' },
            { key: 'receiveCampaigns',              label: 'Receive Campaign Invitations',  desc: 'Businesses can invite you to campaigns' },
            { key: 'receiveBusinessMatches',        label: 'Business Matches',              desc: 'Get matched with relevant businesses' },
            { key: 'receivePodcastOpportunities',   label: 'Podcast Opportunities',         desc: 'Podcast guest appearances' },
            { key: 'receiveSpeakingOpportunities',  label: 'Speaking Opportunities',        desc: 'Events and conference invitations' },
            { key: 'receiveCollaborationRequests',  label: 'Collaboration Requests',        desc: 'Publisher and business collaboration invitations' },
          ] as Array<{ key: keyof PublisherPartnershipSettings; label: string; desc: string }>).map(({ key, label, desc }) => (
            <div key={key} className="px-5 py-3.5 flex items-center justify-between gap-4 border-b border-[#F3EDE6] last:border-0">
              <div>
                <p className="text-sm font-medium text-[#2D2A26]">{label}</p>
                <p className="text-xs text-[#9CA3AF] mt-0.5">{desc}</p>
              </div>
              <button
                onClick={() => togglePartner(key)}
                disabled={!partnerSettings.partnershipEnabled}
                className={`w-11 h-6 rounded-full transition-colors relative shrink-0 disabled:opacity-40 ${
                  (partnerSettings[key] as boolean) ? 'bg-[#C86A43]' : 'bg-[#E8E4DD]'
                }`}
                aria-label={`Toggle ${label}`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  (partnerSettings[key] as boolean) ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={savePartnerSettings}
            className="px-4 py-2 text-sm font-semibold bg-[#C86A43] text-white rounded-lg hover:bg-[#b05a35] transition-colors"
          >
            Save Partnership Settings
          </button>
          {partnerSaved && <p className="text-sm text-[#5E6B4A] font-medium">Saved ✓</p>}
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
