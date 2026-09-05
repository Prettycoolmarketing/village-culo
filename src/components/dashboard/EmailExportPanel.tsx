import { useState } from 'react'
import { getFounders } from '../../services/founders'
import { getBusinesses } from '../../services/businesses'
import { founderClaimService } from '../../services/founderClaim'
import { type EmailRow, toCSV, downloadCSV, deduplicate, splitName, sanitiseEmail } from '../../utils/emailExport'

// Moved here from the Email Lists page's "Export" tab — lives next to Bulk
// Import on the Founders page now, since exporting founder emails is a
// founders operation, same reasoning as Bulk Import's own move earlier.

export function EmailExportPanel() {
  const [statusFilter, setStatusFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [dateFrom, setDateFrom]         = useState('')
  const [dateTo, setDateTo]             = useState('')
  const [preview, setPreview]           = useState<{ label: string; count: number } | null>(null)

  const origin    = typeof window !== 'undefined' ? window.location.origin : ''
  const founders  = getFounders()
  const businesses = getBusinesses()
  const claims    = founderClaimService.getAll()

  const claimEmailByFounder = new Map<string, string>()
  for (const c of claims) {
    if (c.requesterEmail && !claimEmailByFounder.has(c.founderId)) {
      claimEmailByFounder.set(c.founderId, sanitiseEmail(c.requesterEmail))
    }
  }

  function founderToRow(f: typeof founders[0], tags: string): EmailRow {
    const { firstName, lastName } = splitName(f.name)
    const biz = businesses.find(b => b.id === f.businessId)
    return {
      email:         claimEmailByFounder.get(f.id) ?? f.signupEmail ?? '',
      firstName,
      lastName,
      fullName:      f.name,
      profileStatus: f.profileStatus ?? f.status,
      founderSlug:   f.slug,
      profileUrl:    `${origin}/founders/${f.slug}`,
      claimUrl:      `${origin}/claim/${f.slug}`,
      businessName:  biz?.name ?? '',
      tags,
      createdAt:     f.createdAt,
    }
  }

  function applyFilters(rows: EmailRow[]): EmailRow[] {
    return rows.filter(r => {
      if (dateFrom && r.createdAt < dateFrom) return false
      if (dateTo   && r.createdAt > dateTo)   return false
      if (statusFilter !== 'all' && r.profileStatus !== statusFilter) return false
      if (sourceFilter === 'claim'   && r.tags !== 'claim-request')   return false
      if (sourceFilter === 'curated' && r.tags !== 'village-curated') return false
      return true
    })
  }

  function getClaimedFounders(): EmailRow[] {
    return applyFilters(
      founders
        .filter(f => f.profileStatus === 'claimed' || f.profileStatus === 'verified')
        .map(f => founderToRow(f, 'claimed-founder'))
        .filter(r => r.email)
    )
  }

  function getCuratedFounders(): EmailRow[] {
    return applyFilters(
      founders
        .filter(f => f.profileStatus === 'village-curated')
        .map(f => founderToRow(f, 'village-curated'))
    )
  }

  function getBusinessOwners(): EmailRow[] {
    return applyFilters(
      founders
        .filter(f => !!f.businessId)
        .map(f => founderToRow(f, 'business-owner'))
        .filter(r => r.email)
    )
  }

  function getClaimRequests(): EmailRow[] {
    return applyFilters(
      claims.map(c => {
        const f = founders.find(fo => fo.id === c.founderId)
        const { firstName, lastName } = splitName(c.requesterName)
        return {
          email:         sanitiseEmail(c.requesterEmail),
          firstName,
          lastName,
          fullName:      c.requesterName,
          profileStatus: c.status,
          founderSlug:   f?.slug ?? '',
          profileUrl:    f ? `${origin}/founders/${f.slug}` : '',
          claimUrl:      f ? `${origin}/claim/${f.slug}` : '',
          businessName:  '',
          tags:          'claim-request',
          createdAt:     c.requestedAt,
        }
      })
    )
  }

  function getJoinSignups(): EmailRow[] {
    return applyFilters(
      founders
        .filter(f => !!f.signupProduct)
        .map(f => founderToRow(f, f.signupProduct === 'canva' ? 'canva-join' : 'village-join'))
        .filter(r => r.email)
    )
  }

  function getAllEmails(): EmailRow[] {
    const fromFounders = founders.map(f => founderToRow(f, 'founder')).filter(r => r.email)
    const fromClaims   = getClaimRequests()
    return deduplicate([...fromFounders, ...fromClaims])
  }

  function showPreview(label: string, rows: EmailRow[]) {
    const deduped = deduplicate(rows)
    setPreview({ label, count: deduped.length })
  }

  function exportSegment(rows: EmailRow[], filename: string) {
    const deduped = deduplicate(rows.filter(r => r.email))
    if (deduped.length === 0) return
    downloadCSV(toCSV(deduped), `${filename}-${new Date().toISOString().slice(0, 10)}.csv`)
  }

  const segments = [
    { label: 'All Emails', description: 'Every unique email from founders and claim requests.', rows: getAllEmails, filename: 'culo-village-all-emails' },
    { label: 'Village Join Signups', description: 'Founders who signed up via /join (Village or Canva source).', rows: getJoinSignups, filename: 'culo-village-join-signups' },
    { label: 'Claimed Founders', description: 'Founders who have claimed their profile.', rows: getClaimedFounders, filename: 'culo-village-claimed-founders' },
    { label: 'Curated Founders', description: 'All village-curated profiles (email where available).', rows: getCuratedFounders, filename: 'culo-village-curated-founders' },
    { label: 'Business Owners', description: 'Founders with a linked business (email where available).', rows: getBusinessOwners, filename: 'culo-village-business-owners' },
    { label: 'Claim Requests', description: 'All founders who submitted a claim request.', rows: getClaimRequests, filename: 'culo-village-claim-requests' },
  ]

  return (
    <div>
      {/* Filters */}
      <div className="bg-white rounded-xl border border-[#E8E4DD] p-4 mb-6">
        <p className="text-xs font-bold text-[#2D2A26] mb-3">Filters (applied to all exports)</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide mb-1">Status</label>
            <select
              className="w-full px-3 py-2 rounded-lg border border-[#E8E4DD] text-xs text-[#2D2A26] focus:outline-none focus:border-[#C86A43] bg-white"
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPreview(null) }}
            >
              <option value="all">All statuses</option>
              <option value="village-curated">Village Curated</option>
              <option value="claim-pending">Claim Pending</option>
              <option value="claimed">Claimed</option>
              <option value="verified">Verified</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide mb-1">Source</label>
            <select
              className="w-full px-3 py-2 rounded-lg border border-[#E8E4DD] text-xs text-[#2D2A26] focus:outline-none focus:border-[#C86A43] bg-white"
              value={sourceFilter}
              onChange={e => { setSourceFilter(e.target.value); setPreview(null) }}
            >
              <option value="all">All sources</option>
              <option value="claim">Claim requests</option>
              <option value="curated">Village curated</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide mb-1">Created from</label>
            <input
              type="date"
              className="w-full px-3 py-2 rounded-lg border border-[#E8E4DD] text-xs text-[#2D2A26] focus:outline-none focus:border-[#C86A43] bg-white"
              value={dateFrom}
              onChange={e => { setDateFrom(e.target.value); setPreview(null) }}
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide mb-1">Created to</label>
            <input
              type="date"
              className="w-full px-3 py-2 rounded-lg border border-[#E8E4DD] text-xs text-[#2D2A26] focus:outline-none focus:border-[#C86A43] bg-white"
              value={dateTo}
              onChange={e => { setDateTo(e.target.value); setPreview(null) }}
            />
          </div>
        </div>
      </div>

      {preview && (
        <div className="bg-[#5E6B4A]/10 border border-[#5E6B4A]/20 rounded-xl px-5 py-3 mb-6 flex items-center justify-between">
          <p className="text-sm font-semibold text-[#5E6B4A]">
            {preview.label}: <strong>{preview.count}</strong> unique email{preview.count !== 1 ? 's' : ''} ready to export
          </p>
          <button onClick={() => setPreview(null)} className="text-xs text-[#5E6B4A]/60 hover:text-[#5E6B4A]">Dismiss</button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {segments.map(seg => {
          const rows      = seg.rows()
          const deduped   = deduplicate(rows.filter(r => r.email))
          const withEmail = deduped.length

          return (
            <div key={seg.label} className="bg-white rounded-xl border border-[#E8E4DD] p-4">
              <p className="text-sm font-bold text-[#2D2A26] mb-0.5">{seg.label}</p>
              <p className="text-xs text-[#6B7280] mb-3">{seg.description}</p>
              <div className="flex items-center justify-between">
                <p className="text-xs text-[#9CA3AF]">
                  {withEmail} email{withEmail !== 1 ? 's' : ''} · {rows.length} rows
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => showPreview(seg.label, rows)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#F3EDE6] text-[#C86A43] hover:bg-[#C86A43] hover:text-white transition-colors"
                  >
                    Preview
                  </button>
                  <button
                    onClick={() => exportSegment(rows, seg.filename)}
                    disabled={withEmail === 0}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#C86A43] text-white hover:bg-[#b05a35] transition-colors disabled:opacity-40"
                  >
                    Download CSV
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="bg-[#F8F5F0] rounded-xl px-5 py-4">
        <p className="text-xs font-bold text-[#2D2A26] mb-2">CSV Schema</p>
        <p className="text-[11px] font-mono text-[#6B7280] leading-relaxed">
          email, firstName, lastName, fullName, profileStatus, founderSlug, profileUrl, claimUrl, businessName, tags, createdAt
        </p>
        <p className="text-[10px] text-[#9CA3AF] mt-2">
          Emails are deduplicated, trimmed and lowercased. Rows without emails are excluded from downloads. No emails are sent from this page.
        </p>
      </div>
    </div>
  )
}
