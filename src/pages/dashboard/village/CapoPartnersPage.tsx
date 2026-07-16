import { useState } from 'react'
import { partnerService, partnerFlagService } from '../../../services/partner'
import { getBusiness } from '../../../services/businesses'
import { getStory } from '../../../services/stories'
import { getFounder } from '../../../services/founders'
import type { Partner } from '../../../types/partner'

const inputClass = 'w-full px-3 py-2.5 rounded-lg border border-[#E8E4DD] text-sm text-[#2D2A26] bg-white placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#C86A43]/30 focus:border-[#C86A43] transition-colors'

function blankPartner(): Partner {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    name: '',
    pitch: '',
    status: 'pending',
    source: 'capo-added',
    founderRevenueSharePercent: 50,
    sponsored: false,
    createdAt: now,
    updatedAt: now,
  }
}

// ─── Approve/edit form ──────────────────────────────────────────────────────

function PartnerForm({ draft, onChange, onSave, onCancel, requireAffiliateUrl }: {
  draft: Partner
  onChange: (p: Partner) => void
  onSave: () => void
  onCancel: () => void
  requireAffiliateUrl: boolean
}) {
  function set<K extends keyof Partner>(key: K, value: Partner[K]) {
    onChange({ ...draft, [key]: value })
  }

  const canSave = draft.name.trim() && draft.pitch.trim() && (!requireAffiliateUrl || draft.affiliateUrl?.trim())

  return (
    <div className="bg-white rounded-xl border border-[#E8E4DD] p-5 flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-[#2D2A26] block mb-1">Brand Name</label>
          <input type="text" value={draft.name} onChange={e => set('name', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="text-xs font-semibold text-[#2D2A26] block mb-1">Website</label>
          <input type="url" value={draft.website ?? ''} onChange={e => set('website', e.target.value || undefined)} placeholder="https://…" className={inputClass} />
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-[#2D2A26] block mb-1">Pitch — what should founders write about?</label>
        <textarea value={draft.pitch} onChange={e => set('pitch', e.target.value)} rows={3} className={inputClass} />
      </div>

      {draft.applicationUrl && (
        <div>
          <label className="text-xs font-semibold text-[#2D2A26] block mb-1">Their program signup link (submitted by the business)</label>
          <a href={draft.applicationUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-[#C86A43] hover:underline break-all">{draft.applicationUrl}</a>
        </div>
      )}

      <div>
        <label className="text-xs font-semibold text-[#2D2A26] block mb-1">
          Village's Affiliate Link {requireAffiliateUrl && <span className="text-red-500">— required to approve</span>}
        </label>
        <p className="text-[11px] text-[#9CA3AF] mb-1.5">Paste the real, working link once you've actually signed up for their program.</p>
        <input type="url" value={draft.affiliateUrl ?? ''} onChange={e => set('affiliateUrl', e.target.value || undefined)} placeholder="https://…?ref=culovillage" className={inputClass} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-[#2D2A26] block mb-1">Founder's Revenue Share (%)</label>
          <p className="text-[11px] text-[#9CA3AF] mb-1.5">% of the commission Village earns, not of sale price.</p>
          <input
            type="number" min={0} max={100}
            value={draft.founderRevenueSharePercent}
            onChange={e => set('founderRevenueSharePercent', Number(e.target.value))}
            className={inputClass}
          />
        </div>
        <div className="flex items-end pb-2.5">
          <label className="flex items-center gap-2 text-xs font-medium text-[#2D2A26] cursor-pointer">
            <input type="checkbox" checked={draft.sponsored} onChange={e => set('sponsored', e.target.checked)} className="w-4 h-4 accent-[#C86A43]" />
            Sponsored — feature prominently
          </label>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onSave}
          disabled={!canSave}
          className="px-5 py-2.5 bg-[#C86A43] text-white text-sm font-semibold rounded-xl hover:bg-[#b05a35] disabled:opacity-50 transition-colors"
        >
          {draft.status === 'pending' && requireAffiliateUrl ? 'Approve Partner' : 'Save'}
        </button>
        <button onClick={onCancel} className="text-sm text-[#9CA3AF] hover:text-[#6B7280] transition-colors">Cancel</button>
      </div>
    </div>
  )
}

// ─── Partner row ─────────────────────────────────────────────────────────────

function PartnerRow({ partner, onEdit, onDecline, onDeactivate, onRefresh }: {
  partner: Partner
  onEdit: () => void
  onDecline: () => void
  onDeactivate: () => void
  onRefresh: () => void
}) {
  const business = partner.businessId ? getBusiness(partner.businessId) : undefined
  const flagCount = partnerFlagService.getAll({ partnerId: partner.id, status: 'pending' }).length

  return (
    <div className="bg-white rounded-xl border border-[#E8E4DD] px-5 py-4 flex items-start gap-4">
      {(partner.logo || business?.logo) && (
        <img src={partner.logo ?? business?.logo} alt="" className="w-10 h-10 rounded-lg object-cover bg-[#F3EDE6] shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <p className="text-sm font-bold text-[#2D2A26]">{partner.name}</p>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
            partner.status === 'active'   ? 'bg-green-50 text-green-700' :
            partner.status === 'pending'  ? 'bg-amber-50 text-amber-700' :
            partner.status === 'declined' ? 'bg-red-50 text-red-500' :
            'bg-[#F3EDE6] text-[#9CA3AF]'
          }`}>
            {partner.status}
          </span>
          {partner.sponsored && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#D6A94D]/20 text-amber-700">Sponsored</span>}
          {partner.source === 'business-request' && <span className="text-[10px] text-[#9CA3AF]">Requested by business</span>}
          {flagCount > 0 && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600">{flagCount} flagged</span>
          )}
        </div>
        <p className="text-xs text-[#6B7280] leading-relaxed mb-1">{partner.pitch}</p>
        <p className="text-[11px] text-[#9CA3AF]">
          {partner.founderRevenueSharePercent}% founder share
          {partner.affiliateUrl && <> · <span className="font-mono">{partner.affiliateUrl}</span></>}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button onClick={onEdit} className="px-3 py-1.5 bg-white border border-[#E8E4DD] text-[#6B7280] text-xs font-medium rounded-lg hover:border-[#C86A43]/40 hover:text-[#C86A43] transition-colors">
          {partner.status === 'pending' ? 'Review' : 'Edit'}
        </button>
        {partner.status === 'pending' && (
          <button onClick={onDecline} className="text-xs text-[#9CA3AF] hover:text-red-500 transition-colors">Decline</button>
        )}
        {partner.status === 'active' && (
          <button onClick={onDeactivate} className="text-xs text-[#9CA3AF] hover:text-red-500 transition-colors">Deactivate</button>
        )}
        {partner.status === 'inactive' && (
          <button onClick={() => void partnerService.upsert({ ...partner, status: 'active' }).then(onRefresh)} className="text-xs text-[#5E6B4A] hover:underline">Reactivate</button>
        )}
      </div>
    </div>
  )
}

// ─── Flags section ───────────────────────────────────────────────────────────

function FlagsSection() {
  const [flags, setFlags] = useState(() => partnerFlagService.getAll({ status: 'pending' }))

  function refresh() {
    setFlags(partnerFlagService.getAll({ status: 'pending' }))
  }

  async function resolve(id: string, status: 'reviewed' | 'dismissed') {
    const flag = flags.find(f => f.id === id)
    if (!flag) return
    await partnerFlagService.upsert({ ...flag, status })
    refresh()
  }

  if (flags.length === 0) {
    return <p className="text-sm text-[#9CA3AF]">No flagged stories waiting on review.</p>
  }

  return (
    <div className="flex flex-col gap-3">
      {flags.map(flag => {
        const partner = partnerService.get(flag.partnerId)
        const story = flag.storyId ? getStory(flag.storyId) : undefined
        const founder = flag.founderId ? getFounder(flag.founderId) : undefined
        return (
          <div key={flag.id} className="bg-white rounded-xl border border-red-200 px-5 py-4">
            <p className="text-sm font-bold text-[#2D2A26] mb-1">{partner?.name ?? 'Unknown partner'}</p>
            <p className="text-xs text-[#6B7280] mb-1">
              {story ? <>Story: <span className="font-medium">{story.title}</span></> : 'Story not found'}
              {founder && <> · by {founder.name}</>}
            </p>
            <p className="text-xs text-[#9CA3AF] mb-2">{flag.reason}</p>
            {flag.contextSnippet && (
              <p className="text-xs text-[#6B7280] italic bg-[#F8F5F0] rounded-lg px-3 py-2 mb-3">{flag.contextSnippet}</p>
            )}
            <div className="flex items-center gap-3">
              {story && (
                <a href={`/stories/${story.slug}`} target="_blank" rel="noopener noreferrer" className="text-xs text-[#C86A43] hover:underline">
                  Read story ↗
                </a>
              )}
              <button onClick={() => void resolve(flag.id, 'reviewed')} className="text-xs font-semibold text-[#5E6B4A] hover:underline">
                Mark reviewed
              </button>
              <button onClick={() => void resolve(flag.id, 'dismissed')} className="text-xs text-[#9CA3AF] hover:text-[#6B7280]">
                Dismiss
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

type Tab = 'pending' | 'active' | 'flags'

export function CapoPartnersPage() {
  const [partners, setPartners] = useState(() => partnerService.getAll())
  const [tab, setTab] = useState<Tab>('pending')
  const [editing, setEditing] = useState<Partner | null>(null)
  const [creating, setCreating] = useState(false)

  function refresh() {
    setPartners(partnerService.getAll())
    setEditing(null)
    setCreating(false)
  }

  const pending = partners.filter(p => p.status === 'pending')
  const active  = partners.filter(p => p.status === 'active' || p.status === 'inactive')

  async function handleSave() {
    if (!editing) return
    const wasPending = editing.status === 'pending'
    const toSave: Partner = wasPending && editing.affiliateUrl ? { ...editing, status: 'active' } : editing
    await partnerService.upsert(toSave)
    refresh()
  }

  async function handleDecline(partner: Partner) {
    await partnerService.upsert({ ...partner, status: 'declined' })
    refresh()
  }

  async function handleDeactivate(partner: Partner) {
    await partnerService.upsert({ ...partner, status: 'inactive' })
    refresh()
  }

  return (
    <div className="p-8 max-w-4xl" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2D2A26]">Partners</h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Approved affiliate deals founders can write about — negotiated by CULO Village, revenue split with the founder who writes.
          </p>
        </div>
        {!creating && !editing && (
          <button
            onClick={() => { setCreating(true); setEditing(blankPartner()) }}
            className="shrink-0 px-4 py-2.5 bg-[#2D2A26] text-white text-xs font-semibold rounded-xl hover:bg-[#1a1816] transition-colors"
          >
            + Add Partner
          </button>
        )}
      </div>

      {editing ? (
        <PartnerForm
          draft={editing}
          onChange={setEditing}
          onSave={() => void handleSave()}
          onCancel={() => { setEditing(null); setCreating(false) }}
          requireAffiliateUrl={editing.status === 'pending'}
        />
      ) : (
        <>
          <div className="flex gap-2 mb-6">
            {([
              { key: 'pending', label: 'Pending Requests', count: pending.length },
              { key: 'active',  label: 'Partners',          count: active.length },
              { key: 'flags',   label: 'Flagged Stories',   count: partnerFlagService.getAll({ status: 'pending' }).length },
            ] as const).map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm border transition-colors ${
                  tab === t.key ? 'bg-[#2D2A26] text-white border-[#2D2A26]' : 'bg-white text-[#4B4845] border-[#E8E4DD] hover:border-[#2D2A26]/30'
                }`}
              >
                {t.label}
                {t.count > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${tab === t.key ? 'bg-white/20 text-white' : 'bg-[#C86A43]/10 text-[#C86A43]'}`}>
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {tab === 'pending' && (
            pending.length === 0 ? (
              <p className="text-sm text-[#9CA3AF]">No pending partner requests.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {pending.map(p => (
                  <PartnerRow
                    key={p.id}
                    partner={p}
                    onEdit={() => setEditing(p)}
                    onDecline={() => void handleDecline(p)}
                    onDeactivate={() => void handleDeactivate(p)}
                    onRefresh={refresh}
                  />
                ))}
              </div>
            )
          )}

          {tab === 'active' && (
            active.length === 0 ? (
              <p className="text-sm text-[#9CA3AF]">No partners yet. Add one, or wait for a business to request partner status.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {active.map(p => (
                  <PartnerRow
                    key={p.id}
                    partner={p}
                    onEdit={() => setEditing(p)}
                    onDecline={() => void handleDecline(p)}
                    onDeactivate={() => void handleDeactivate(p)}
                    onRefresh={refresh}
                  />
                ))}
              </div>
            )
          )}

          {tab === 'flags' && <FlagsSection />}
        </>
      )}
    </div>
  )
}
