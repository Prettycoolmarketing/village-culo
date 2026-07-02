import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { normalizeUrl } from '../../utils/url'
import { getCurrentFounderId } from '../../services/currentFounder'
import { getBusiness } from '../../services/businesses'
import {
  recommendationService,
  programService,
  enrollmentService,
  affiliateLinkService,
  trackingService,
} from '../../services/partnership'
import type { FounderProgramEnrollment, FounderAffiliateLink, PartnerProgram } from '../../types/partnership'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PROG_TYPE_LABELS: Record<string, string> = {
  affiliate:            'Affiliate',
  referral:             'Referral',
  creator:              'Creator',
  ambassador:           'Ambassador',
  influencer:           'Influencer',
  'technology-partner': 'Technology Partner',
  'community-partner':  'Community Partner',
  'media-partner':      'Media Partner',
  'podcast-partner':    'Podcast Partner',
  'speaker-partner':    'Speaker Partner',
  'workshop-partner':   'Workshop Partner',
  'event-partner':      'Event Partner',
  sponsor:              'Sponsor',
  'education-partner':  'Education Partner',
  'agency-partner':     'Agency Partner',
  reseller:             'Reseller',
  marketplace:          'Marketplace',
  custom:               'Custom',
}

const APPLICATION_MODE_LABELS: Record<string, string> = {
  open:        'Open to applications',
  application: 'Application required',
  invitation:  'By invitation only',
  approval:    'Requires approval',
}

function Icon({ path, className = 'w-4 h-4' }: { path: string; className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  )
}

const icons = {
  link:     'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1',
  program:  'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
  check:    'M5 13l4 4L19 7',
  arrow:    'M17 8l4 4m0 0l-4 4m4-4H3',
  info:     'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  external: 'M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14',
}

// ─── Connection status ────────────────────────────────────────────────────────

type ConnectionStatus = 'program' | 'affiliate' | 'pending-program' | 'normal'

interface BusinessConnectionRow {
  businessId: string
  businessName: string
  businessWebsite?: string
  businessLogo?: string
  approvedRecIds: string[]
  villageProgram?: PartnerProgram
  enrollment?: FounderProgramEnrollment
  affiliateLink?: FounderAffiliateLink
  status: ConnectionStatus
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, placeholder }: { label: string; value: string | number; sub?: string; placeholder?: boolean }) {
  return (
    <div className="bg-white rounded-xl border border-[#E8E4DD] px-5 py-4">
      <p className="text-xs text-[#9CA3AF] mb-1">{label}</p>
      <p className={`text-2xl font-bold ${placeholder ? 'text-[#9CA3AF]' : 'text-[#2D2A26]'}`}>{value}</p>
      {sub && <p className="text-xs text-[#9CA3AF] mt-0.5">{sub}</p>}
      {placeholder && <p className="text-[10px] text-[#9CA3AF] mt-1 uppercase tracking-wide">Placeholder</p>}
    </div>
  )
}

// ─── Connection badge ─────────────────────────────────────────────────────────

function ConnectionBadge({ status }: { status: ConnectionStatus }) {
  if (status === 'program') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-[#5E6B4A]/10 text-[#5E6B4A]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#5E6B4A]" />
        Connected via Program
      </span>
    )
  }
  if (status === 'affiliate') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-[#C86A43]/10 text-[#C86A43]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#C86A43]" />
        Affiliate Link
      </span>
    )
  }
  if (status === 'pending-program') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-[#D6A94D]/20 text-amber-700">
        <span className="w-1.5 h-1.5 rounded-full bg-[#D6A94D]" />
        Program Available
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-[#F3EDE6] text-[#9CA3AF]">
      <span className="w-1.5 h-1.5 rounded-full bg-[#9CA3AF]" />
      Not Connected
    </span>
  )
}

// ─── Join Program form ────────────────────────────────────────────────────────

function JoinProgramForm({
  program,
  founderId,
  businessId,
  onEnrolled,
  onCancel,
}: {
  program: PartnerProgram
  founderId: string
  businessId: string
  onEnrolled: () => void
  onCancel: () => void
}) {
  function handleJoin() {
    const enrollment: FounderProgramEnrollment = {
      id:               crypto.randomUUID(),
      founderId,
      programId:        program.id,
      businessId,
      status:           'active',
      enrolledAt:       new Date().toISOString(),
      updatedAt:        new Date().toISOString(),
    }
    enrollmentService.upsert(enrollment)
    onEnrolled()
  }

  return (
    <div className="border-t border-[#E8E4DD] bg-[#F8F5F0] px-5 py-4">
      <p className="text-xs font-semibold text-[#2D2A26] mb-3">Join — {program.name}</p>
      <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
        <div>
          <p className="text-[#9CA3AF] uppercase tracking-wide text-[10px] mb-0.5">Program Type</p>
          <p className="text-[#2D2A26] font-medium">{PROG_TYPE_LABELS[program.programType] ?? program.programType}</p>
        </div>
        <div>
          <p className="text-[#9CA3AF] uppercase tracking-wide text-[10px] mb-0.5">Commission</p>
          <p className="text-[#2D2A26] font-medium">
            {program.commissionValue ? `${program.commissionValue}${program.commissionType === 'percentage' ? '%' : ''}` : 'See terms'}
          </p>
        </div>
        <div>
          <p className="text-[#9CA3AF] uppercase tracking-wide text-[10px] mb-0.5">Access</p>
          <p className="text-[#2D2A26] font-medium">{APPLICATION_MODE_LABELS[program.applicationMode]}</p>
        </div>
        {program.disclosureType !== 'none' && (
          <div>
            <p className="text-[#9CA3AF] uppercase tracking-wide text-[10px] mb-0.5">Disclosure Required</p>
            <p className="text-[#2D2A26] font-medium capitalize">{program.disclosureType.replace(/-/g, ' ')}</p>
          </div>
        )}
      </div>
      {(program.shortDescription ?? program.description) && (
        <p className="text-xs text-[#6B7280] leading-relaxed mb-4 border-l-2 border-[#E8E4DD] pl-3">
          {program.shortDescription ?? program.description}
        </p>
      )}
      <div className="flex items-center gap-3">
        <button
          onClick={handleJoin}
          className="px-4 py-2 bg-[#5E6B4A] text-white text-xs font-semibold rounded-lg hover:bg-[#4a5538] transition-colors"
        >
          Confirm Enrollment
        </button>
        {program.termsUrl && (
          <a
            href={normalizeUrl(program.termsUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
          >
            View terms ↗
          </a>
        )}
        <button
          onClick={onCancel}
          className="ml-auto text-xs text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// ─── Affiliate link form ──────────────────────────────────────────────────────

function AffiliateLinkForm({
  founderId,
  businessId,
  businessWebsite,
  existingLink,
  onSaved,
  onCancel,
}: {
  founderId: string
  businessId: string
  businessWebsite?: string
  existingLink?: FounderAffiliateLink
  onSaved: () => void
  onCancel: () => void
}) {
  const [url, setUrl] = useState(existingLink?.affiliateUrl ?? '')

  function handleSave() {
    const trimmed = url.trim()
    if (!trimmed) return
    const link: FounderAffiliateLink = {
      id:              existingLink?.id ?? crypto.randomUUID(),
      founderId,
      businessId,
      businessWebsite: businessWebsite,
      affiliateUrl:    trimmed,
      createdAt:       existingLink?.createdAt ?? new Date().toISOString(),
      updatedAt:       new Date().toISOString(),
    }
    affiliateLinkService.upsert(link)
    onSaved()
  }

  return (
    <div className="border-t border-[#E8E4DD] bg-[#F8F5F0] px-5 py-4">
      <p className="text-xs font-semibold text-[#2D2A26] mb-1">
        {existingLink ? 'Edit Affiliate Link' : 'Use My Affiliate Link'}
      </p>
      <p className="text-xs text-[#9CA3AF] mb-4 leading-relaxed">
        Paste your affiliate URL. Village will use this link whenever this business is mentioned in your published stories.
      </p>
      {businessWebsite && (
        <div className="mb-3">
          <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wide mb-1">Business Website</p>
          <p className="text-xs text-[#6B7280] font-mono truncate">{businessWebsite}</p>
        </div>
      )}
      <div className="mb-4">
        <label className="text-[10px] text-[#9CA3AF] uppercase tracking-wide block mb-1">
          Your Affiliate URL
        </label>
        <input
          type="url"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://example.com?ref=yourname"
          className="w-full px-3 py-2 rounded-lg border border-[#E8E4DD] text-xs text-[#2D2A26] bg-white focus:outline-none focus:ring-2 focus:ring-[#C86A43]/30 focus:border-[#C86A43] font-mono"
        />
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={!url.trim()}
          className="px-4 py-2 bg-[#C86A43] text-white text-xs font-semibold rounded-lg hover:bg-[#b05a35] disabled:opacity-50 transition-colors"
        >
          Save Link
        </button>
        <button
          onClick={onCancel}
          className="text-xs text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// ─── Business connection row ──────────────────────────────────────────────────

function BusinessConnectionRow({
  row,
  founderId,
  onRefresh,
}: {
  row: BusinessConnectionRow
  founderId: string
  onRefresh: () => void
}) {
  const [joinOpen,      setJoinOpen]      = useState(false)
  const [affiliateOpen, setAffiliateOpen] = useState(false)

  function handleLeave() {
    if (!row.enrollment) return
    enrollmentService.leave(row.enrollment.id)
    onRefresh()
  }

  function handleRemoveAffiliate() {
    if (!row.affiliateLink) return
    affiliateLinkService.delete(row.affiliateLink.id)
    onRefresh()
  }

  const biz = getBusiness(row.businessId)

  return (
    <div className="bg-white rounded-xl border border-[#E8E4DD] overflow-hidden">
      <div className="px-5 py-4">
        <div className="flex items-start gap-3">
          {/* Logo */}
          {(row.businessLogo || biz?.logo) && (
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#F3EDE6] border border-[#E8E4DD] flex-shrink-0">
              <img
                src={row.businessLogo ?? biz?.logo}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <p className="text-sm font-bold text-[#2D2A26]">{row.businessName}</p>
              <ConnectionBadge status={row.status} />
            </div>
            {row.businessWebsite && (
              <a
                href={normalizeUrl(row.businessWebsite)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#9CA3AF] hover:text-[#C86A43] transition-colors font-mono truncate block"
              >
                {row.businessWebsite.replace(/^https?:\/\//, '')}
              </a>
            )}

            {/* Program info */}
            {row.villageProgram && (
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <span className="text-[10px] text-[#9CA3AF] uppercase tracking-wide">Program:</span>
                <span className="text-[10px] font-semibold text-[#6B7280]">
                  {row.villageProgram.name}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#D6A94D]/15 text-amber-700">
                  {PROG_TYPE_LABELS[row.villageProgram.programType] ?? row.villageProgram.programType}
                </span>
              </div>
            )}

            {/* Affiliate link */}
            {row.affiliateLink && (
              <div className="mt-1.5 flex items-center gap-2">
                <span className="text-[10px] text-[#9CA3AF] uppercase tracking-wide">Affiliate URL:</span>
                <span className="text-[10px] font-mono text-[#6B7280] truncate max-w-[200px]">
                  {row.affiliateLink.affiliateUrl}
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
            {/* Program actions */}
            {row.status === 'pending-program' && !joinOpen && !affiliateOpen && (
              <button
                onClick={() => { setJoinOpen(true); setAffiliateOpen(false) }}
                className="px-3 py-1.5 bg-[#5E6B4A] text-white text-xs font-semibold rounded-lg hover:bg-[#4a5538] transition-colors"
              >
                Join Program
              </button>
            )}
            {row.status === 'program' && (
              <button
                onClick={handleLeave}
                className="px-3 py-1.5 bg-white border border-[#E8E4DD] text-[#9CA3AF] text-xs rounded-lg hover:border-red-200 hover:text-red-400 transition-colors"
              >
                Leave
              </button>
            )}

            {/* Affiliate link actions */}
            {!affiliateOpen && row.status !== 'program' && (
              <button
                onClick={() => { setAffiliateOpen(true); setJoinOpen(false) }}
                className="px-3 py-1.5 bg-white border border-[#E8E4DD] text-[#6B7280] text-xs font-medium rounded-lg hover:border-[#C86A43]/40 hover:text-[#C86A43] transition-colors"
              >
                {row.affiliateLink ? 'Edit Link' : 'Use Affiliate Link'}
              </button>
            )}
            {row.status === 'affiliate' && !affiliateOpen && (
              <button
                onClick={handleRemoveAffiliate}
                className="px-3 py-1.5 text-xs text-[#9CA3AF] hover:text-red-400 transition-colors"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Inline forms */}
      {joinOpen && row.villageProgram && (
        <JoinProgramForm
          program={row.villageProgram}
          founderId={founderId}
          businessId={row.businessId}
          onEnrolled={() => { setJoinOpen(false); onRefresh() }}
          onCancel={() => setJoinOpen(false)}
        />
      )}
      {affiliateOpen && (
        <AffiliateLinkForm
          founderId={founderId}
          businessId={row.businessId}
          businessWebsite={row.businessWebsite ?? getBusiness(row.businessId)?.website}
          existingLink={row.affiliateLink}
          onSaved={() => { setAffiliateOpen(false); onRefresh() }}
          onCancel={() => setAffiliateOpen(false)}
        />
      )}
    </div>
  )
}

// ─── Revenue Dashboard ─────────────────────────────────────────────────────────

const LINK_TYPE_LABELS: Record<string, string> = {
  'village-program': 'Partner link',
  'affiliate':       'Affiliate',
  'normal':          'Direct',
}

const LINK_TYPE_COLORS: Record<string, string> = {
  'village-program': 'text-[#5E6B4A] bg-[#5E6B4A]/10',
  'affiliate':       'text-[#C86A43] bg-[#C86A43]/10',
  'normal':          'text-[#9CA3AF] bg-[#F3EDE6]',
}

const SOURCE_PAGE_LABELS: Record<string, string> = {
  story:   'Story',
  founder: 'Founder page',
  business:'Business page',
}

function RevenueDashboard({ founderId }: { founderId: string }) {
  const allClicks       = trackingService.getAll({ founderId })
  const programClicks   = trackingService.getAll({ founderId, linkType: 'village-program' })
  const affiliateClicks = trackingService.getAll({ founderId, linkType: 'affiliate' })

  const recentClicks = [...allClicks]
    .sort((a, b) => b.clickedAt.localeCompare(a.clickedAt))
    .slice(0, 10)

  const topByBusiness = Object.values(
    allClicks.reduce<Record<string, { businessId: string; count: number; linkType: string }>>((acc, r) => {
      if (!acc[r.businessId]) acc[r.businessId] = { businessId: r.businessId, count: 0, linkType: r.linkType }
      acc[r.businessId].count++
      return acc
    }, {})
  ).sort((a, b) => b.count - a.count).slice(0, 5)

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-[#2D2A26]">Revenue Dashboard</h2>
          <p className="text-xs text-[#9CA3AF] mt-0.5">Earnings and conversion data will populate once payout integration is active.</p>
        </div>
        <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-[#5E6B4A]/10 text-[#5E6B4A] uppercase tracking-wide">
          Foundation
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <StatCard label="Estimated Earnings" value="$0.00" sub="No payout integration yet" placeholder />
        <StatCard label="Pending"            value="$0.00" placeholder />
        <StatCard label="Paid"               value="$0.00" placeholder />
        <StatCard label="Total Clicks"       value={allClicks.length} sub={`${programClicks.length} program · ${affiliateClicks.length} affiliate`} />
        <StatCard label="Conversions"        value="0" placeholder />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Top Recommendations */}
        <div className="bg-white rounded-xl border border-[#E8E4DD] p-5">
          <p className="text-sm font-semibold text-[#2D2A26] mb-4">Top Recommendations</p>
          {topByBusiness.length === 0 ? (
            <p className="text-xs text-[#9CA3AF] leading-relaxed">
              Once your recommendation links start receiving clicks, top performers will appear here ranked by clicks.
            </p>
          ) : (
            <ol className="flex flex-col gap-2">
              {topByBusiness.map((row, i) => {
                const biz = getBusiness(row.businessId)
                return (
                  <li key={row.businessId} className="flex items-center gap-3 py-2 border-b border-[#F3EDE6] last:border-0">
                    <span className="text-xs font-bold text-[#9CA3AF] w-4 shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#2D2A26] truncate">{biz?.name ?? row.businessId}</p>
                      <span className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded mt-0.5 ${LINK_TYPE_COLORS[row.linkType] ?? LINK_TYPE_COLORS.normal}`}>
                        {LINK_TYPE_LABELS[row.linkType] ?? row.linkType}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-[#2D2A26] shrink-0">
                      {row.count} {row.count === 1 ? 'click' : 'clicks'}
                    </span>
                  </li>
                )
              })}
            </ol>
          )}
        </div>

        {/* Recent Clicks */}
        <div className="bg-white rounded-xl border border-[#E8E4DD] p-5">
          <p className="text-sm font-semibold text-[#2D2A26] mb-4">Recent Clicks</p>
          {recentClicks.length === 0 ? (
            <p className="text-xs text-[#9CA3AF] leading-relaxed">
              No clicks recorded yet. Share your published stories and founder page to start generating tracked recommendation clicks.
            </p>
          ) : (
            <ol className="flex flex-col gap-1">
              {recentClicks.map(click => {
                const biz = getBusiness(click.businessId)
                return (
                  <li key={click.id} className="flex items-center gap-3 py-2 border-b border-[#F3EDE6] last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#2D2A26] truncate">{biz?.name ?? click.businessId}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${LINK_TYPE_COLORS[click.linkType] ?? LINK_TYPE_COLORS.normal}`}>
                          {LINK_TYPE_LABELS[click.linkType] ?? click.linkType}
                        </span>
                        {click.sourcePage && (
                          <span className="text-[10px] text-[#9CA3AF]">
                            via {SOURCE_PAGE_LABELS[click.sourcePage] ?? click.sourcePage}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] text-[#9CA3AF] shrink-0 tabular-nums">
                      {new Date(click.clickedAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                    </span>
                  </li>
                )
              })}
            </ol>
          )}
        </div>

      </div>
    </div>
  )
}

// ─── Dashboard Revenue Page ────────────────────────────────────────────────────

export function DashboardRevenuePage() {
  const { user } = useAuth()
  const founderId = getCurrentFounderId(user) ?? 'dev-user'

  const [tick, setTick] = useState(0)
  function refresh() { setTick(t => t + 1) }

  // Derive business connection rows from approved recommendations
  const approved   = recommendationService.getAll({ founderId, status: 'approved' })
    .filter(r => r.businessId)

  const businessIds = [...new Set(approved.map(r => r.businessId!))]

  const rows: BusinessConnectionRow[] = businessIds.map(bizId => {
    const biz          = getBusiness(bizId)
    const bizPrograms  = programService.getAll({ businessId: bizId, status: 'active', isPublic: true })
    const villageProgram = bizPrograms[0]
    const enrollment   = enrollmentService.getActive(founderId, bizId)
    const affiliateLink = affiliateLinkService.getForBusiness(founderId, bizId)
    const recIds       = approved.filter(r => r.businessId === bizId).map(r => r.id)

    let status: ConnectionStatus = 'normal'
    if (enrollment)         status = 'program'
    else if (affiliateLink) status = 'affiliate'
    else if (villageProgram) status = 'pending-program'

    return {
      businessId:      bizId,
      businessName:    biz?.name ?? 'Unknown Business',
      businessWebsite: biz?.website,
      businessLogo:    biz?.logo,
      approvedRecIds:  recIds,
      villageProgram,
      enrollment,
      affiliateLink,
      status,
    }
  })

  // Sort: pending-program first, then connected, then normal
  const sorted = [...rows].sort((a, b) => {
    const order: Record<ConnectionStatus, number> = { 'pending-program': 0, 'program': 1, 'affiliate': 2, 'normal': 3 }
    return order[a.status] - order[b.status]
  })

  const connectedCount     = rows.filter(r => r.status === 'program' || r.status === 'affiliate').length
  const programCount       = enrollmentService.getAll({ founderId, status: 'active' }).length
  const affiliateCount     = affiliateLinkService.getAll({ founderId }).length
  const pendingProgramCount = rows.filter(r => r.status === 'pending-program').length

  // Key to force re-renders after state changes
  const _ = tick

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#2D2A26]">Revenue</h1>
            <p className="text-sm text-[#6B7280] mt-1 max-w-xl leading-relaxed">
              Keep recommending businesses you genuinely use. If that business has a Recommendation Program — or you've connected your own affiliate link — CULO Village will handle the rest.
            </p>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard label="Active Connections"   value={connectedCount}     sub="Programs + affiliate links" />
        <StatCard label="My Programs"          value={programCount}       sub="Village programs joined" />
        <StatCard label="Affiliate Links"      value={affiliateCount}     sub="My own links" />
        <StatCard label="Pending"              value={pendingProgramCount} sub="Programs available to join" />
      </div>

      {/* Link Manager */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-[#2D2A26]">Link Manager</h2>
            <p className="text-xs text-[#9CA3AF] mt-0.5">
              One row per business. Village automatically uses the right link when you publish a story.
            </p>
          </div>
          <Link
            to="/dashboard/opportunities"
            className="text-xs text-[#C86A43] hover:text-[#b05a35] transition-colors font-medium"
          >
            View My Picks →
          </Link>
        </div>

        {/* How it works explainer */}
        <div className="bg-[#F8F5F0] rounded-xl p-4 mb-5 flex items-start gap-3">
          <Icon path={icons.info} className="w-4 h-4 text-[#9CA3AF] shrink-0 mt-0.5" />
          <div className="text-xs text-[#6B7280] leading-relaxed space-y-1">
            <p><span className="font-semibold text-[#2D2A26]">Connected via Program</span> — CULO handles tracking. Village link used automatically in your stories.</p>
            <p><span className="font-semibold text-[#2D2A26]">Affiliate Link</span> — Your own link. Village tracks clicks only. Used automatically in your stories.</p>
            <p><span className="font-semibold text-[#2D2A26]">Not Connected</span> — Normal business website. No monetisation. You're still recommending them.</p>
          </div>
        </div>

        {approved.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#E8E4DD] px-6 py-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#C86A43]/10 flex items-center justify-center mx-auto mb-4">
              <Icon path={icons.link} className="w-6 h-6 text-[#C86A43]/40" />
            </div>
            <p className="text-sm font-semibold text-[#2D2A26] mb-2">No approved recommendations yet</p>
            <p className="text-xs text-[#9CA3AF] leading-relaxed max-w-xs mx-auto mb-5">
              Go to My Picks, scan your stories, and approve genuine recommendations. They'll appear here ready to connect.
            </p>
            <Link
              to="/dashboard/opportunities"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#C86A43] text-white text-xs font-semibold rounded-xl hover:bg-[#b05a35] transition-colors"
            >
              Go to My Picks
              <Icon path={icons.arrow} className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {sorted.map(row => (
              <BusinessConnectionRow
                key={`${row.businessId}-${_}`}
                row={row}
                founderId={founderId}
                onRefresh={refresh}
              />
            ))}
          </div>
        )}
      </div>

      {/* Revenue Dashboard */}
      <RevenueDashboard founderId={founderId} />
    </div>
  )
}
