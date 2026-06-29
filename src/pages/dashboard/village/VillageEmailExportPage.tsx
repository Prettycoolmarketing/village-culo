import { useState } from 'react'
import { getFounders } from '../../../services/founders'
import { getBusinesses } from '../../../services/businesses'
import { founderClaimService } from '../../../services/founderClaim'

// ─── CSV helpers ──────────────────────────────────────────────────────────────

interface EmailRow {
  email: string
  firstName: string
  lastName: string
  fullName: string
  profileStatus: string
  founderSlug: string
  profileUrl: string
  claimUrl: string
  businessName: string
  tags: string
  createdAt: string
}

function splitName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/)
  const firstName = parts[0] ?? ''
  const lastName  = parts.length > 1 ? parts[parts.length - 1] : ''
  return { firstName, lastName }
}

function sanitiseEmail(raw: string): string {
  return raw.trim().toLowerCase()
}

function toCSV(rows: EmailRow[]): string {
  const headers = ['email', 'firstName', 'lastName', 'fullName', 'profileStatus', 'founderSlug', 'profileUrl', 'claimUrl', 'businessName', 'tags', 'createdAt']
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`
  const lines = [
    headers.join(','),
    ...rows.map(r => [
      escape(r.email), escape(r.firstName), escape(r.lastName), escape(r.fullName),
      escape(r.profileStatus), escape(r.founderSlug), escape(r.profileUrl), escape(r.claimUrl),
      escape(r.businessName), escape(r.tags), escape(r.createdAt),
    ].join(',')),
  ]
  return lines.join('\n')
}

function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function deduplicate(rows: EmailRow[]): EmailRow[] {
  const seen = new Set<string>()
  return rows.filter(r => {
    if (!r.email || seen.has(r.email)) return false
    seen.add(r.email)
    return true
  })
}

// ─── Export segment builders ──────────────────────────────────────────────────

export function VillageEmailExportPage() {
  const [statusFilter, setStatusFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [dateFrom, setDateFrom]         = useState('')
  const [dateTo, setDateTo]             = useState('')
  const [preview, setPreview]           = useState<{ label: string; count: number } | null>(null)

  const origin    = typeof window !== 'undefined' ? window.location.origin : ''
  const founders  = getFounders()
  const businesses = getBusinesses()
  const claims    = founderClaimService.getAll()

  // Build index: founderId → claim email
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
      email:         claimEmailByFounder.get(f.id) ?? '',
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
      return true
    })
  }

  // Export segments
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
    const rows = applyFilters(
      claims.map(c => {
        const f = founders.find(fo => fo.id === c.founderId)
        const nameParts = splitName(c.requesterName)
        const { firstName, lastName } = nameParts
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
    return rows
  }

  function getAllEmails(): EmailRow[] {
    const fromFounders    = founders.map(f => founderToRow(f, 'founder')).filter(r => r.email)
    const fromClaims      = getClaimRequests()
    return deduplicate([...fromFounders, ...fromClaims])
  }

  // Preview
  function showPreview(label: string, rows: EmailRow[]) {
    const deduped = deduplicate(rows)
    setPreview({ label, count: deduped.length })
  }

  // Download
  function exportSegment(_label: string, rows: EmailRow[], filename: string) {
    const deduped = deduplicate(rows.filter(r => r.email))
    if (deduped.length === 0) return
    const csv = toCSV(deduped)
    downloadCSV(csv, `${filename}-${new Date().toISOString().slice(0, 10)}.csv`)
  }

  const segments = [
    {
      label: 'All Emails',
      description: 'Every unique email from founders and claim requests.',
      rows: getAllEmails,
      filename: 'culo-village-all-emails',
    },
    {
      label: 'Claimed Founders',
      description: 'Founders who have claimed their profile.',
      rows: getClaimedFounders,
      filename: 'culo-village-claimed-founders',
    },
    {
      label: 'Curated Founders',
      description: 'All village-curated profiles (email where available).',
      rows: getCuratedFounders,
      filename: 'culo-village-curated-founders',
    },
    {
      label: 'Business Owners',
      description: 'Founders with a linked business (email where available).',
      rows: getBusinessOwners,
      filename: 'culo-village-business-owners',
    },
    {
      label: 'Claim Requests',
      description: 'All founders who submitted a claim request.',
      rows: getClaimRequests,
      filename: 'culo-village-claim-requests',
    },
  ]

  return (
    <div className="p-8 max-w-4xl" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      <div className="mb-8">
        <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-widest mb-1">Village HQ</p>
        <h1 className="text-2xl font-bold text-[#2D2A26]">Email Export</h1>
        <p className="text-sm text-[#6B7280] mt-0.5">
          Download CSV files for outreach, follow-up and community building. No emails are sent from Village.
        </p>
      </div>

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

      {/* Preview banner */}
      {preview && (
        <div className="bg-[#5E6B4A]/10 border border-[#5E6B4A]/20 rounded-xl px-5 py-3 mb-6 flex items-center justify-between">
          <p className="text-sm font-semibold text-[#5E6B4A]">
            {preview.label}: <strong>{preview.count}</strong> unique email{preview.count !== 1 ? 's' : ''} ready to export
          </p>
          <button onClick={() => setPreview(null)} className="text-xs text-[#5E6B4A]/60 hover:text-[#5E6B4A]">Dismiss</button>
        </div>
      )}

      {/* Export cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {segments.map(seg => {
          const rows    = seg.rows()
          const deduped = deduplicate(rows.filter(r => r.email))
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
                    onClick={() => exportSegment(seg.label, rows, seg.filename)}
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

      {/* CSV schema */}
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
