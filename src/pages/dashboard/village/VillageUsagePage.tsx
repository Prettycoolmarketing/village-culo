import { getFounders } from '../../../services/founders'
import { importedContentService } from '../../../services/importedContent'
import { getArchiveUnlockPrice, ARCHIVE_UNLOCK_SUBSET_5000_PRICE } from '../../../config/archiveUnlock'

// Content-transfer volume into the Village, and Archive Unlock revenue
// specifically — the Village side of the business, distinct from CULO
// Creatives' own MRR tracked on the Creatives Members page. No cap is
// enforced on transfer volume — this is visibility only, now that Archive
// Unlock's tiers are the actual mechanism for cost, not a hypothetical
// future threshold.
//
// Grouped by importedAt (the business-facing "when imported" timestamp, not
// the immutable row created_at) since that's what a founder/admin actually
// means by "how much did this person import this month" — it's the one a
// re-import via merge() intentionally refreshes.

function monthKey(iso: string): string {
  return iso.slice(0, 7) // YYYY-MM
}

function StatCard({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-[#E8E4DD] px-4 py-3">
      <p className="text-2xl font-bold text-[#2D2A26]">{value}</p>
      <p className="text-xs text-[#9CA3AF] mt-0.5">{label}</p>
      {sub && <p className="text-[11px] text-[#9CA3AF] mt-1">{sub}</p>}
    </div>
  )
}

export function VillageUsagePage({ embedded = false }: { embedded?: boolean } = {}) {
  const founders = getFounders()
  const allContent = importedContentService.getAll()

  const now = new Date()
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const importsThisMonth = allContent.filter(c => monthKey(c.importedAt) === thisMonth)

  // Per-founder totals, most-active first — this is the number that matters
  // for "who's actually driving cost," not just the raw platform total.
  const byFounder = new Map<string, number>()
  for (const c of allContent) byFounder.set(c.founderId, (byFounder.get(c.founderId) ?? 0) + 1)
  const ranked = [...byFounder.entries()]
    .map(([founderId, count]) => ({ founder: founders.find(f => f.id === founderId), count }))
    .filter(r => r.founder)
    .sort((a, b) => b.count - a.count)

  const totalFounders = founders.length
  const activeImporters = byFounder.size
  const avgPerFounder = activeImporters ? (allContent.length / activeImporters).toFixed(1) : '0'

  // Archive Unlock revenue — stripe-archive-unlock-webhook stores the real
  // amount charged (archiveUnlockAmount) straight from the Checkout
  // Session, so this uses that directly. Only falls back to estimating a
  // tier from the founder's current archive size for anyone unlocked
  // before that was tracked (archiveUnlockAmount undefined).
  const unlockedFounders = founders.filter(f => f.archiveUnlocked)
  const estimatedCount = unlockedFounders.filter(f => f.archiveUnlockAmount == null).length
  const archiveRevenue = unlockedFounders.reduce((sum, f) => {
    if (f.archiveUnlockAmount != null) return sum + f.archiveUnlockAmount
    if (f.archiveUnlockCap) return sum + ARCHIVE_UNLOCK_SUBSET_5000_PRICE
    return sum + getArchiveUnlockPrice(byFounder.get(f.id) ?? 0)
  }, 0)

  return (
    <div className={embedded ? '' : 'p-8 max-w-5xl'} style={embedded ? undefined : { fontFamily: "'DM Sans', sans-serif" }}>
      {!embedded && (
      <div className="mb-6">
        <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-widest mb-1">CAPO · Village Staff</p>
        <h1 className="text-2xl font-bold text-[#2D2A26]">Village Usage</h1>
        <p className="text-sm text-[#6B7280] mt-1">
          Content-transfer volume into the Village, and Archive Unlock revenue — the Village side of the
          business, separate from CULO Creatives' own members and MRR.
        </p>
      </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <StatCard label="Total founders" value={totalFounders} />
        <StatCard label="Total items imported" value={allContent.length} />
        <StatCard label="Imported this month" value={importsThisMonth.length} />
        <StatCard label="Active importers" value={activeImporters} sub={`avg ${avgPerFounder}/founder`} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <StatCard label="Archive Unlock — founders unlocked" value={unlockedFounders.length} />
        <StatCard
          label="Village Revenue"
          value={`$${archiveRevenue.toLocaleString()}`}
          sub={estimatedCount > 0 ? `Archive Unlock · ${estimatedCount} pre-tracking, estimated` : 'Archive Unlock, one-time'}
        />
      </div>

      <h2 className="text-sm font-semibold text-[#2D2A26] mb-3">Top importers</h2>
      <div className="bg-white rounded-xl border border-[#E8E4DD] overflow-hidden">
        {ranked.length === 0 ? (
          <p className="text-sm text-[#9CA3AF] px-4 py-6 text-center">No imports yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E8E4DD] text-left text-xs text-[#9CA3AF] uppercase tracking-wide">
                <th className="px-4 py-2.5 font-medium">Founder</th>
                <th className="px-4 py-2.5 font-medium text-right">Items imported</th>
              </tr>
            </thead>
            <tbody>
              {ranked.slice(0, 25).map(({ founder, count }) => (
                <tr key={founder!.id} className="border-b border-[#E8E4DD] last:border-0">
                  <td className="px-4 py-2.5 text-[#2D2A26]">{founder!.name}</td>
                  <td className="px-4 py-2.5 text-right text-[#2D2A26] font-medium tabular-nums">{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
