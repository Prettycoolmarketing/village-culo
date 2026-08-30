// CULO Village — CAPO Opportunities Hub
//
// Consolidates six previously separate nav items (Opportunities, Revenue,
// Claims, Spotlight, Sources, Partners) into one "Opportunities" tab, same
// pattern as Email Lists (one nav item, several sub-tabs inside). Each
// sub-tab renders the existing, unmodified page component — no logic was
// rewritten, just re-homed under one shell — so permissions, state and
// behavior per section are exactly what they were as standalone pages.

import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../../contexts/AuthContext'
import { canAccessCapoSection } from '../../../utils/permissions'
import { CapoBackLink } from '../../../components/dashboard/CapoBackLink'
import { Tabs } from '../../../components/dashboard/Tabs'
import { DashboardPartnershipPage } from '../DashboardPartnershipPage'
import { DashboardRevenuePage } from '../DashboardRevenuePage'
import { VillageClaimRequestsPage } from './VillageClaimRequestsPage'
import { VillageSpotlightPage } from './VillageSpotlightPage'
import { CapoSourcesPage } from './CapoSourcesPage'
import { CapoPartnersPage } from './CapoPartnersPage'

type HubTab = 'opportunities' | 'revenue' | 'claims' | 'spotlight' | 'sources' | 'partners'

export function CapoOpportunitiesHubPage() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const tabs = (
    [
      { key: 'opportunities', label: 'Opportunities', allowed: true },
      { key: 'revenue',       label: 'Revenue',        allowed: true },
      { key: 'claims',        label: 'Claims',         allowed: canAccessCapoSection(user?.role, 'claims') },
      { key: 'spotlight',     label: 'Spotlight',      allowed: canAccessCapoSection(user?.role, 'featured') },
      { key: 'sources',       label: 'Sources',        allowed: canAccessCapoSection(user?.role, 'featured') },
      { key: 'partners',      label: 'Partners',       allowed: canAccessCapoSection(user?.role, 'partners') },
    ] as const
  ).filter(t => t.allowed)

  const requested = searchParams.get('tab') as HubTab | null
  const [tab, setTab] = useState<HubTab>(
    requested && tabs.some(t => t.key === requested) ? requested : (tabs[0]?.key ?? 'opportunities'),
  )

  function changeTab(next: string) {
    setTab(next as HubTab)
    setSearchParams(prev => {
      const p = new URLSearchParams(prev)
      p.set('tab', next)
      return p
    }, { replace: true })
  }

  return (
    <div className="p-8 max-w-[1600px]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <CapoBackLink />

      <div className="mb-6">
        <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-widest mb-1">CAPO</p>
        <h1 className="text-2xl font-bold text-[#2D2A26]">Opportunities</h1>
        <p className="text-sm text-[#6B7280] mt-0.5">
          Matches, revenue, claim requests, homepage curation, reference sources and the partner program — all in one place.
        </p>
      </div>

      <Tabs tabs={tabs} active={tab} onChange={changeTab} className="mb-6" />

      {tab === 'opportunities' && <DashboardPartnershipPage />}
      {tab === 'revenue' && <DashboardRevenuePage />}
      {tab === 'claims' && <VillageClaimRequestsPage />}
      {tab === 'spotlight' && <VillageSpotlightPage />}
      {tab === 'sources' && <CapoSourcesPage />}
      {tab === 'partners' && <CapoPartnersPage />}
    </div>
  )
}
