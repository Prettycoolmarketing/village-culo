import { getFounders } from '../../../services/founders'

// Members of CULO Creatives specifically (has a creativeSubscription at
// all) — separate from Village Usage, which is about content-transfer
// volume across every founder regardless of whether they've ever touched
// Creatives. No real subscriptions exist yet (Stripe is still test-mode —
// see the launch plan), so these numbers read as zero/empty right now; the
// page exists so the moment someone locks in, it's tracked here without
// needing to build this later.

function StatCard({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-[#E8E4DD] px-4 py-3">
      <p className="text-2xl font-bold text-[#2D2A26]">{value}</p>
      <p className="text-xs text-[#9CA3AF] mt-0.5">{label}</p>
      {sub && <p className="text-[11px] text-[#9CA3AF] mt-1">{sub}</p>}
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  const cls: Record<string, string> = {
    trial:     'bg-blue-50 text-blue-700',
    active:    'bg-[#5E6B4A]/10 text-[#5E6B4A]',
    cancelled: 'bg-red-50 text-red-500',
    expired:   'bg-[#F3EDE6] text-[#9CA3AF]',
  }
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${cls[status] ?? 'bg-[#F3EDE6] text-[#9CA3AF]'}`}>
      {status}
    </span>
  )
}

export function VillageCreativeMembersPage() {
  const members = getFounders().filter(f => !!f.creativeSubscription)
  const sorted = [...members].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  const active      = members.filter(m => m.creativeSubscription?.status === 'active')
  const trialing    = members.filter(m => m.creativeSubscription?.status === 'trial')
  const collaborator = members.filter(m => m.creativeSubscription?.tier === 'collaborator')
  const standard     = members.filter(m => m.creativeSubscription?.tier === 'standard')
  const lockedIn     = members.filter(m => !!m.creativeSubscription?.stripeSubscriptionId)

  // Rough MRR — only counts confirmed, billing-linked subscriptions, never
  // a trial that hasn't actually converted to a real Stripe subscription.
  const mrr = active.filter(m => !!m.creativeSubscription?.stripeSubscriptionId)
    .reduce((sum, m) => sum + (m.creativeSubscription?.tier === 'standard' ? 25 : 19), 0)

  return (
    <div className="p-8 max-w-5xl" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="mb-6">
        <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-widest mb-1">CAPO · Village Staff</p>
        <h1 className="text-2xl font-bold text-[#2D2A26]">CULO Creatives Members</h1>
        <p className="text-sm text-[#6B7280] mt-1">
          Everyone with a CULO Creatives subscription — trial, active, or locked in. No real billing has gone
          through yet (Stripe is still test-mode), so this fills in as members actually convert.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <StatCard label="Total Members" value={members.length} />
        <StatCard label="Active" value={active.length} />
        <StatCard label="Trialing" value={trialing.length} />
        <StatCard label="Locked In (billing set up)" value={lockedIn.length} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
        <StatCard label="Collaborator ($19/mo)" value={collaborator.length} />
        <StatCard label="Standard ($25/mo)" value={standard.length} />
        <StatCard label="Est. MRR" value={`$${mrr}`} sub="Active + billing-linked only" />
      </div>

      <h2 className="text-sm font-semibold text-[#2D2A26] mb-3">Members</h2>
      <div className="bg-white rounded-xl border border-[#E8E4DD] overflow-hidden">
        {sorted.length === 0 ? (
          <p className="text-sm text-[#9CA3AF] px-4 py-8 text-center">No CULO Creatives members yet.</p>
        ) : (
          <div className="divide-y divide-[#F3EDE6]">
            {sorted.map(f => {
              const sub = f.creativeSubscription!
              return (
                <div key={f.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#2D2A26] truncate">{f.signupEmail ?? f.name}</p>
                    <p className="text-[10px] text-[#9CA3AF]">
                      {sub.tier ?? 'unassigned tier'}
                      {sub.trialEnd && ` · trial ends ${new Date(sub.trialEnd).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                      {sub.feedbackSubmittedAt && ' · feedback submitted'}
                    </p>
                  </div>
                  <StatusPill status={sub.status} />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
