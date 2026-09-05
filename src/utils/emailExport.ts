// Shared by VillageEmailExportPage (Members/Waitlist/Subscribers/Campaigns
// tabs) and EmailExportPanel (the founder-segment CSV export, now living on
// the Founders page next to Bulk Import) — one CSV shape and one set of
// helpers instead of two copies drifting apart.

export interface EmailRow {
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

export function splitName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/)
  const firstName = parts[0] ?? ''
  const lastName  = parts.length > 1 ? parts[parts.length - 1] : ''
  return { firstName, lastName }
}

export function sanitiseEmail(raw: string): string {
  return raw.trim().toLowerCase()
}

export function toCSV(rows: EmailRow[]): string {
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

export function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function deduplicate(rows: EmailRow[]): EmailRow[] {
  const seen = new Set<string>()
  return rows.filter(r => {
    if (!r.email || seen.has(r.email)) return false
    seen.add(r.email)
    return true
  })
}
