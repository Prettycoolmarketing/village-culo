import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { getCurrentFounderId } from '../../services/currentFounder'
import { publisherSettingsService } from '../../services/partnership'
import type { PublisherPartnershipSettings } from '../../types/partnership'

// Moved here from DashboardSettingsPage — these toggles are specifically
// about partnership matching/opportunities, which now lives entirely under
// Profile's Partners tab, not general account settings.
export function PartnershipSettingsPanel() {
  const { user } = useAuth()
  const founderId = getCurrentFounderId(user) ?? 'dev-user'
  const [partnerSettings, setPartnerSettings] = useState<PublisherPartnershipSettings>(
    () => publisherSettingsService.getOrCreate(founderId)
  )
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  function togglePartner(key: keyof PublisherPartnershipSettings) {
    setPartnerSettings(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))
    setSaved(false)
  }

  async function saveSettings() {
    setSaveError(null)
    const result = await publisherSettingsService.upsert(partnerSettings)
    if (result.success) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } else {
      setSaveError(result.error ?? 'Save failed. Please try again.')
    }
  }

  return (
    <div>
      <h2 className="font-heading text-lg font-semibold text-charcoal mb-4">Partnership Settings</h2>
      <div className="bg-white rounded-xl border border-[#E8E4DD] overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between border-b border-[#F3EDE6]">
          <div>
            <p className="text-sm font-semibold text-[#2D2A26]">Turn on Partnerships</p>
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
          onClick={() => void saveSettings()}
          className="px-4 py-2 text-sm font-semibold bg-[#C86A43] text-white rounded-lg hover:bg-[#b05a35] transition-colors"
        >
          Save Partnership Settings
        </button>
        {saved && <p className="text-sm text-[#5E6B4A] font-medium">Saved ✓</p>}
        {saveError && <p className="text-sm text-red-600 font-medium">{saveError}</p>}
      </div>
    </div>
  )
}
