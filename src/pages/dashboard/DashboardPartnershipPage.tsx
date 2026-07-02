import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  recommendationService,
  opportunityService,
  publisherSettingsService,
  enrollmentService,
  affiliateLinkService,
  programService,
} from '../../services/partnership'
import { getCurrentFounderId } from '../../services/currentFounder'
import { getStory } from '../../services/stories'
import { getBusiness } from '../../services/businesses'
import { runDetection, DEFAULT_DISCLOSURE } from '../../services/recommendationDetection'
import { runMatching, oppLabel } from '../../services/opportunityMatching'
import { saveTrustProfile, LEVEL_LABELS, LEVEL_COLORS } from '../../services/trustEngine'
import type { Recommendation, Opportunity, TrustProfile } from '../../types/partnership'

// ─── Types ───────────────────────────────────────────────────────────────────

type Tab =
  | 'overview'
  | 'recommendations'
  | 'opportunities'
  | 'trust'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function Icon({ path, className = 'w-4 h-4' }: { path: string; className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  )
}

const icons = {
  overview:        'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  recommendations: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
  opportunities:   'M13 10V3L4 14h7v7l9-11h-7z',
  trust:           'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyState({ title, description, action }: { title: string; description: string; action?: { label: string; onClick: () => void } }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-[#C86A43]/10 flex items-center justify-center mb-5">
        <svg className="w-7 h-7 text-[#C86A43]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      </div>
      <h3 className="text-base font-semibold text-[#2D2A26] mb-2">{title}</h3>
      <p className="text-sm text-[#6B7280] max-w-xs leading-relaxed">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-6 px-5 py-2.5 bg-[#C86A43] text-white text-sm font-semibold rounded-xl hover:bg-[#b05a35] transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}

// ─── Placeholder Badge ────────────────────────────────────────────────────────

function FutureBadge() {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-[#5E6B4A]/10 text-[#5E6B4A] uppercase tracking-wide">
      Coming Soon
    </span>
  )
}

// ─── Health Indicator ─────────────────────────────────────────────────────────

function HealthBar({ score, label }: { score: number; label: string }) {
  const color = score >= 80 ? '#5E6B4A' : score >= 60 ? '#D6A94D' : score >= 40 ? '#C86A43' : '#DC2626'
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-[#6B7280]">{label}</span>
        <span className="text-xs font-semibold text-[#2D2A26]">{score}/100</span>
      </div>
      <div className="h-1.5 bg-[#F3EDE6] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${score}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-[#E8E4DD] px-5 py-4">
      <p className="text-xs text-[#9CA3AF] mb-1">{label}</p>
      <p className="text-2xl font-bold text-[#2D2A26]">{value}</p>
      {sub && <p className="text-xs text-[#9CA3AF] mt-0.5">{sub}</p>}
    </div>
  )
}

// ─── Tab Sections ─────────────────────────────────────────────────────────────

function OverviewSection({ founderId }: { founderId: string }) {
  const settings = publisherSettingsService.getOrCreate(founderId)
  const recCounts = recommendationService.countByStatus(founderId)
  const opportunities = opportunityService.getAll({ founderId, limit: 3 })

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-[#2D2A26]">Opportunities</h2>
        <p className="text-sm text-[#6B7280] mt-1">Your hub for recommendations, partnerships and opportunities.</p>
      </div>

      {!settings.partnershipEnabled && (
        <div className="mb-8 bg-[#C86A43]/5 border border-[#C86A43]/20 rounded-xl px-5 py-4 flex items-start gap-4">
          <div className="w-9 h-9 rounded-xl bg-[#C86A43]/10 flex items-center justify-center shrink-0 mt-0.5">
            <Icon path={icons.trust} className="w-5 h-5 text-[#C86A43]" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-[#2D2A26]">Opportunities is not enabled</p>
            <p className="text-xs text-[#6B7280] mt-0.5 leading-relaxed">
              Enable the Partnership Operating System in Settings to start receiving recommendations and opportunities.
            </p>
          </div>
          <Link
            to="/dashboard/settings"
            className="shrink-0 px-4 py-2 bg-[#C86A43] text-white text-xs font-semibold rounded-lg hover:bg-[#b05a35] transition-colors"
          >
            Enable in Settings
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Approved Picks" value={recCounts.approved} />
        <StatCard label="Pending Review" value={recCounts.pending} />
        <StatCard label="Opportunities" value={opportunities.length} />
      </div>

      {/* Health placeholder */}
      <div className="bg-white rounded-xl border border-[#E8E4DD] p-5 mb-8">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold text-[#2D2A26]">Partnership Health</h3>
          <FutureBadge />
        </div>
        <div className="space-y-3">
          <HealthBar score={0} label="Trust Score" />
          <HealthBar score={0} label="Recommendation Quality" />
          <HealthBar score={0} label="Profile Completeness" />
          <HealthBar score={0} label="Disclosure Compliance" />
        </div>
        <p className="text-xs text-[#9CA3AF] mt-4">Trust Engine will calculate these scores automatically. Build your score by publishing stories, approving recommendations, and joining communities.</p>
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-xl border border-[#E8E4DD] p-5">
        <h3 className="text-sm font-semibold text-[#2D2A26] mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: 'Complete your partnership profile', icon: icons.overview, description: 'Tell us what you recommend and what opportunities you want' },
            { label: 'Review detected recommendations', icon: icons.recommendations, description: 'CULO has found brands and products in your stories' },
            { label: 'Explore opportunities', icon: icons.opportunities, description: 'Speaking, podcasts, campaigns and collaborations' },
          ].map(a => (
            <div key={a.label} className="p-4 bg-[#F8F5F0] rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-white border border-[#E8E4DD] flex items-center justify-center mb-3">
                <Icon path={a.icon} className="w-4 h-4 text-[#C86A43]" />
              </div>
              <p className="text-xs font-semibold text-[#2D2A26] mb-1">{a.label}</p>
              <p className="text-xs text-[#9CA3AF] leading-relaxed">{a.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Confidence badge ─────────────────────────────────────────────────────────

function ConfidenceBadge({ score }: { score: number }) {
  if (score >= 0.80) return <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#5E6B4A]/10 text-[#5E6B4A] font-semibold">High confidence</span>
  if (score >= 0.55) return <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-semibold">Medium confidence</span>
  return <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F3EDE6] text-[#9CA3AF] font-semibold">Low confidence</span>
}

// ─── Revenue connection badge ──────────────────────────────────────────────────

function RevenueStatusBadge({ founderId, businessId }: { founderId: string; businessId?: string }) {
  if (!businessId) return null
  const enrollment    = enrollmentService.getActive(founderId, businessId)
  const affiliateLink = affiliateLinkService.getForBusiness(founderId, businessId)
  const programs      = programService.getAll({ businessId, status: 'active', isPublic: true })

  if (enrollment) {
    return (
      <a href="/dashboard/revenue" className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-[#5E6B4A]/10 text-[#5E6B4A] font-semibold hover:bg-[#5E6B4A]/20 transition-colors">
        <span className="w-1 h-1 rounded-full bg-[#5E6B4A]" />
        Connected
      </a>
    )
  }
  if (affiliateLink) {
    return (
      <a href="/dashboard/revenue" className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-[#C86A43]/10 text-[#C86A43] font-semibold hover:bg-[#C86A43]/20 transition-colors">
        <span className="w-1 h-1 rounded-full bg-[#C86A43]" />
        Affiliate Link
      </a>
    )
  }
  if (programs.length > 0) {
    return (
      <a href="/dashboard/revenue" className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-[#D6A94D]/15 text-amber-700 font-semibold hover:bg-[#D6A94D]/25 transition-colors">
        Program Available →
      </a>
    )
  }
  return null
}

// ─── Pick card ────────────────────────────────────────────────────────────────

function PickCard({ rec, founderId, onApprove, onIgnore, onReject }: {
  rec: Recommendation
  founderId: string
  onApprove: (id: string, disclosureText: string) => void
  onIgnore:  (id: string) => void
  onReject:  (id: string) => void
}) {
  const [approving, setApproving]       = useState(false)
  const [disclosureText, setDisclosure] = useState(rec.disclosureText ?? DEFAULT_DISCLOSURE)
  const story = rec.storyId ? getStory(rec.storyId) : undefined

  const isPending = rec.status === 'pending_review' || rec.status === 'detected'

  return (
    <div className={`bg-white rounded-xl border overflow-hidden transition-colors ${
      approving ? 'border-[#5E6B4A]/40 shadow-sm' : 'border-[#E8E4DD]'
    }`}>
      <div className="px-5 pt-4 pb-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <p className="text-sm font-bold text-[#2D2A26]">{rec.entityName}</p>
              <ConfidenceBadge score={rec.confidence} />
              {!isPending && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize ${
                  rec.status === 'approved' ? 'bg-green-50 text-green-700' :
                  rec.status === 'ignored'  ? 'bg-[#F3EDE6] text-[#9CA3AF]' :
                  rec.status === 'rejected' ? 'bg-red-50 text-red-500' :
                  'bg-amber-50 text-amber-700'
                }`}>
                  {rec.status.replace('_', ' ')}
                </span>
              )}
            </div>
            <p className="text-xs text-[#9CA3AF] capitalize">
              {rec.entityType}
              {story && <> · from <span className="text-[#6B7280]">"{story.title}"</span></>}
            </p>
          </div>
        </div>

        {/* Why CULO found it */}
        {rec.confidenceReason && (
          <p className="text-xs text-[#6B7280] bg-[#F8F5F0] rounded-lg px-3 py-2 mb-2 leading-relaxed">
            {rec.confidenceReason}
          </p>
        )}

        {/* Context snippet */}
        {rec.detectedInContext && (
          <p className="text-xs text-[#9CA3AF] italic px-1 mb-2 line-clamp-2">
            {rec.detectedInContext}
          </p>
        )}

        {/* Approved disclosure summary */}
        {rec.status === 'approved' && rec.disclosureText && (
          <div className="mt-1 mb-1 px-3 py-2 bg-green-50 rounded-lg">
            <p className="text-[10px] font-semibold text-green-700 uppercase tracking-wide mb-0.5">Disclosure</p>
            <p className="text-xs text-green-800">{rec.disclosureText}</p>
          </div>
        )}

        {/* Revenue connection status for approved recs */}
        {rec.status === 'approved' && (
          <div className="mt-2">
            <RevenueStatusBadge founderId={founderId} businessId={rec.businessId} />
          </div>
        )}

        {/* Actions */}
        {isPending && !approving && (
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={() => setApproving(true)}
              className="px-3 py-1.5 bg-[#5E6B4A] text-white text-xs font-semibold rounded-lg hover:bg-[#4a5538] transition-colors"
            >
              Approve
            </button>
            <button
              onClick={() => onIgnore(rec.id)}
              className="px-3 py-1.5 bg-white text-[#6B7280] text-xs font-medium rounded-lg border border-[#E8E4DD] hover:border-[#9CA3AF] transition-colors"
            >
              Ignore
            </button>
            <button
              onClick={() => onReject(rec.id)}
              className="px-3 py-1.5 text-[#9CA3AF] text-xs hover:text-red-500 transition-colors"
            >
              Reject
            </button>
          </div>
        )}
      </div>

      {/* Approve confirmation */}
      {approving && (
        <div className="px-5 pb-4 border-t border-[#F3EDE6] pt-3 bg-[#F8F5F0]">
          <p className="text-xs font-medium text-[#2D2A26] mb-1.5">Confirm disclosure before approving</p>
          <p className="text-xs text-[#9CA3AF] mb-2">Every approved recommendation must have a disclosure statement. Edit if needed.</p>
          <textarea
            value={disclosureText}
            onChange={e => setDisclosure(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-[#E8E4DD] text-xs text-[#2D2A26] bg-white resize-none focus:outline-none focus:ring-2 focus:ring-[#5E6B4A]/30 focus:border-[#5E6B4A] mb-3"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (!disclosureText.trim()) return
                onApprove(rec.id, disclosureText.trim())
                setApproving(false)
              }}
              disabled={!disclosureText.trim()}
              className="px-4 py-1.5 bg-[#5E6B4A] text-white text-xs font-semibold rounded-lg hover:bg-[#4a5538] disabled:opacity-50 transition-colors"
            >
              Confirm & Approve
            </button>
            <button
              onClick={() => setApproving(false)}
              className="px-3 py-1.5 text-xs text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── My Picks section ─────────────────────────────────────────────────────────

type PicksFilter = 'pending' | 'approved' | 'ignored' | 'rejected'

function MyPicksSection({ founderId }: { founderId: string }) {
  const [allRecs, setAllRecs] = useState<Recommendation[]>(
    () => recommendationService.getAll({ founderId })
  )
  const [filterTab, setFilterTab] = useState<PicksFilter>('pending')
  const [scanning,  setScanning]  = useState(false)
  const [scanResult, setScanResult] = useState<{ detected: number; skipped: number; stories: number } | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  function refresh() {
    setAllRecs(recommendationService.getAll({ founderId }))
  }

  const pending  = allRecs.filter(r => r.status === 'pending_review' || r.status === 'detected')
  const approved = allRecs.filter(r => r.status === 'approved')
  const ignored  = allRecs.filter(r => r.status === 'ignored')
  const rejected = allRecs.filter(r => r.status === 'rejected')

  const visible: Recommendation[] =
    filterTab === 'pending'  ? pending  :
    filterTab === 'approved' ? approved :
    filterTab === 'ignored'  ? ignored  :
    rejected

  function handleScan() {
    setScanning(true)
    setScanResult(null)
    setActionError(null)
    // Defer to let the UI update before running detection
    setTimeout(() => {
      void runDetection(founderId).then(result => {
        if (result.error) setActionError(result.error)
        setScanResult(result)
        refresh()
        setScanning(false)
        setFilterTab('pending')
      })
    }, 50)
  }

  async function handleApprove(id: string, disclosureText: string) {
    setActionError(null)
    const rec = recommendationService.get(id)
    if (rec) {
      rec.disclosureText    = disclosureText
      rec.disclosureVisible = true
      const result = await recommendationService.upsert(rec)
      if (!result.success) { setActionError(result.error ?? 'Failed to approve. Please try again.'); return }
    }
    const result = await recommendationService.approve(id)
    if (!result.success) { setActionError(result.error ?? 'Failed to approve. Please try again.'); return }
    refresh()
  }

  async function handleIgnore(id: string) {
    setActionError(null)
    const rec = recommendationService.get(id)
    if (!rec) return
    rec.status = 'ignored'
    const result = await recommendationService.upsert(rec)
    if (!result.success) { setActionError(result.error ?? 'Failed to update. Please try again.'); return }
    refresh()
  }

  async function handleReject(id: string) {
    setActionError(null)
    const result = await recommendationService.reject(id)
    if (!result.success) { setActionError(result.error ?? 'Failed to reject. Please try again.'); return }
    refresh()
  }

  const filterTabs: Array<{ key: PicksFilter; label: string; count: number }> = [
    { key: 'pending',  label: 'Pending Review', count: pending.length  },
    { key: 'approved', label: 'Approved',        count: approved.length },
    { key: 'ignored',  label: 'Ignored',         count: ignored.length  },
    { key: 'rejected', label: 'Rejected',        count: rejected.length },
  ]

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#2D2A26]">My Picks</h2>
          <p className="text-sm text-[#6B7280] mt-1">
            Businesses and products CULO found in your stories. You decide what becomes a genuine recommendation.
          </p>
        </div>
        <button
          onClick={handleScan}
          disabled={scanning}
          className="shrink-0 px-4 py-2.5 bg-[#2D2A26] text-white text-xs font-semibold rounded-xl hover:bg-[#1a1816] disabled:opacity-60 transition-colors"
        >
          {scanning ? 'Scanning…' : 'Scan my stories'}
        </button>
      </div>

      {actionError && (
        <div className="mb-5 px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700">
          {actionError}
        </div>
      )}

      {/* Scan result banner */}
      {scanResult && (
        <div className={`mb-5 px-4 py-3 rounded-xl border text-sm ${
          scanResult.detected > 0
            ? 'bg-[#5E6B4A]/5 border-[#5E6B4A]/20 text-[#4a5538]'
            : 'bg-[#F8F5F0] border-[#E8E4DD] text-[#6B7280]'
        }`}>
          {scanResult.detected > 0 ? (
            <>
              Found <strong>{scanResult.detected}</strong> possible{scanResult.detected === 1 ? ' pick' : ' picks'} across{' '}
              <strong>{scanResult.stories}</strong>{scanResult.stories === 1 ? ' story' : ' stories'}.
              {scanResult.skipped > 0 && <> Skipped {scanResult.skipped} already detected.</>}
            </>
          ) : (
            <>
              Scanned {scanResult.stories} {scanResult.stories === 1 ? 'story' : 'stories'} — no new picks found.
              {scanResult.skipped > 0 && <> ({scanResult.skipped} already detected.)</>}
            </>
          )}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {filterTabs.map(t => (
          <button
            key={t.key}
            onClick={() => setFilterTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm border transition-colors ${
              filterTab === t.key
                ? 'bg-[#2D2A26] text-white border-[#2D2A26]'
                : 'bg-white text-[#4B4845] border-[#E8E4DD] hover:border-[#2D2A26]/30'
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                filterTab === t.key ? 'bg-white/20 text-white' : 'bg-[#C86A43]/10 text-[#C86A43]'
              }`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {visible.length === 0 ? (
        <EmptyState
          title={
            filterTab === 'pending'  ? 'No picks waiting for review' :
            filterTab === 'approved' ? 'No approved picks yet' :
            filterTab === 'ignored'  ? 'Nothing ignored' :
            'Nothing rejected'
          }
          description={
            filterTab === 'pending'
              ? 'CULO will start finding possible picks when your stories mention tools, businesses, products or services you genuinely use. Hit "Scan my stories" to run detection now.'
              : `No ${filterTab} picks to show.`
          }
          action={filterTab === 'pending' ? { label: 'Scan my stories', onClick: handleScan } : undefined}
        />
      ) : (
        <div className="space-y-3">
          {visible.map(rec => (
            <PickCard
              key={rec.id}
              rec={rec}
              founderId={founderId}
              onApprove={handleApprove}
              onIgnore={handleIgnore}
              onReject={handleReject}
            />
          ))}
        </div>
      )}

      {/* How picks work */}
      {allRecs.length === 0 && (
        <div className="mt-8 bg-white rounded-xl border border-[#E8E4DD] p-5">
          <p className="text-xs font-semibold text-[#2D2A26] mb-3">How My Picks works</p>
          <div className="space-y-2.5">
            {[
              { step: '1', text: 'CULO scans your published stories for mentions of businesses, tools and products.' },
              { step: '2', text: 'Possible picks appear here for you to review — CULO never auto-publishes.' },
              { step: '3', text: 'You approve, ignore or reject each one. Approved picks include a disclosure.' },
              { step: '4', text: 'Approved picks power future recommendations, matching and trust scores.' },
            ].map(s => (
              <div key={s.step} className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-[#C86A43]/10 text-[#C86A43] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {s.step}
                </span>
                <p className="text-xs text-[#6B7280] leading-relaxed">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Opportunity type color ───────────────────────────────────────────────────

function oppTypeColor(type: Opportunity['type']): string {
  switch (type) {
    case 'recommendation':    return 'bg-[#C86A43]/10 text-[#C86A43]'
    case 'affiliate':
    case 'referral':          return 'bg-[#5E6B4A]/10 text-[#5E6B4A]'
    case 'speaking':
    case 'podcast-guest':
    case 'workshop':          return 'bg-[#D6A94D]/20 text-amber-700'
    case 'collaboration':
    case 'community-intro':   return 'bg-blue-50 text-blue-700'
    default:                  return 'bg-[#F3EDE6] text-[#6B7280]'
  }
}

function oppActionStatus(status: Opportunity['status']): string {
  switch (status) {
    case 'saved':      return 'Saved'
    case 'interested': return 'Interested'
    case 'declined':   return 'Ignored'
    default:           return ''
  }
}

// ─── Opportunity card ─────────────────────────────────────────────────────────

function OppCard({ opp, onAction }: {
  opp: Opportunity
  onAction: (id: string, status: Opportunity['status']) => void
}) {
  const biz = opp.businessId ? getBusiness(opp.businessId) : undefined
  const isSuggested = opp.status === 'suggested'
  const actionLabel = oppActionStatus(opp.status)
  const scorePercent = opp.matchScore !== undefined ? Math.round(opp.matchScore * 100) : null
  const reasons = opp.matchReason ? opp.matchReason.split('. ').filter(Boolean) : []

  return (
    <div className={`bg-white rounded-xl border overflow-hidden transition-colors ${
      opp.status === 'saved' ? 'border-[#5E6B4A]/30' :
      opp.status === 'interested' ? 'border-[#C86A43]/30' :
      opp.status === 'declined' ? 'opacity-50 border-[#E8E4DD]' :
      'border-[#E8E4DD]'
    }`}>
      <div className="px-5 pt-4 pb-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[#2D2A26] mb-1">{opp.title}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${oppTypeColor(opp.type)}`}>
                {oppLabel(opp.type)}
              </span>
              {opp.priority === 'high' && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#C86A43]/10 text-[#C86A43] font-semibold">
                  Strong match
                </span>
              )}
              {!isSuggested && actionLabel && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                  opp.status === 'saved'      ? 'bg-[#5E6B4A]/10 text-[#5E6B4A]' :
                  opp.status === 'interested' ? 'bg-[#C86A43]/10 text-[#C86A43]' :
                  'bg-[#F3EDE6] text-[#9CA3AF]'
                }`}>
                  {actionLabel}
                </span>
              )}
            </div>
          </div>
          {scorePercent !== null && (
            <div className="shrink-0 text-right">
              <p className="text-lg font-bold text-[#2D2A26]">{scorePercent}%</p>
              <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wide">match</p>
            </div>
          )}
        </div>

        {/* Business info */}
        {biz && (
          <p className="text-xs text-[#9CA3AF] mb-2">{biz.name} · {biz.industry?.name}</p>
        )}

        {/* Why CULO suggested it */}
        {reasons.length > 0 && (
          <div className="bg-[#F8F5F0] rounded-lg px-3 py-2.5 mb-3">
            <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide mb-1.5">Why CULO suggested this</p>
            <ul className="space-y-1">
              {reasons.map((r, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-[#C86A43]/40 mt-1.5 shrink-0" />
                  <p className="text-xs text-[#6B7280] leading-relaxed">{r.trim()}{r.trim().endsWith('.') ? '' : '.'}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Matched topics */}
        {opp.matchedTopics && opp.matchedTopics.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {opp.matchedTopics.map(t => (
              <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-[#C86A43]/5 text-[#C86A43] border border-[#C86A43]/15">
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        {isSuggested && (
          <div className="flex items-center gap-2 mt-1">
            <button
              onClick={() => onAction(opp.id, 'interested')}
              className="px-3 py-1.5 bg-[#C86A43] text-white text-xs font-semibold rounded-lg hover:bg-[#b05a35] transition-colors"
            >
              I'm interested
            </button>
            <button
              onClick={() => onAction(opp.id, 'saved')}
              className="px-3 py-1.5 bg-white text-[#4B4845] text-xs font-medium rounded-lg border border-[#E8E4DD] hover:border-[#9CA3AF] transition-colors"
            >
              Save for later
            </button>
            <button
              onClick={() => onAction(opp.id, 'declined')}
              className="px-3 py-1.5 text-[#9CA3AF] text-xs hover:text-[#6B7280] transition-colors"
            >
              Ignore
            </button>
          </div>
        )}

        {/* Re-actions for saved/interested */}
        {(opp.status === 'saved' || opp.status === 'interested') && (
          <div className="flex items-center gap-2 mt-1">
            {opp.status === 'saved' && (
              <button
                onClick={() => onAction(opp.id, 'interested')}
                className="px-3 py-1.5 bg-[#C86A43] text-white text-xs font-semibold rounded-lg hover:bg-[#b05a35] transition-colors"
              >
                I'm interested
              </button>
            )}
            <button
              onClick={() => onAction(opp.id, 'declined')}
              className="px-3 py-1.5 text-[#9CA3AF] text-xs hover:text-[#6B7280] transition-colors"
            >
              Remove
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Opportunities section ────────────────────────────────────────────────────

type OppFilter = 'suggested' | 'saved' | 'interested'

function OpportunitiesSection({ founderId }: { founderId: string }) {
  const [allOpps, setAllOpps] = useState<Opportunity[]>(
    () => opportunityService.getAll({ founderId })
  )
  const [filterTab,   setFilterTab]  = useState<OppFilter>('suggested')
  const [generating,  setGenerating] = useState(false)
  const [genResult,   setGenResult]  = useState<{ generated: number; skipped: number; businesses: number } | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  function refresh() { setAllOpps(opportunityService.getAll({ founderId })) }

  function handleFind() {
    setGenerating(true)
    setGenResult(null)
    setActionError(null)
    setTimeout(() => {
      void runMatching(founderId).then(result => {
        if (result.error) setActionError(result.error)
        setGenResult(result)
        refresh()
        setGenerating(false)
        setFilterTab('suggested')
      })
    }, 50)
  }

  async function handleAction(id: string, status: Opportunity['status']) {
    setActionError(null)
    const result = await opportunityService.updateStatus(id, status)
    if (!result.success) { setActionError(result.error ?? 'Failed to update. Please try again.'); return }
    refresh()
  }

  const suggested  = allOpps.filter(o => o.status === 'suggested')
  const saved      = allOpps.filter(o => o.status === 'saved')
  const interested = allOpps.filter(o => o.status === 'interested')

  const visible =
    filterTab === 'suggested'  ? suggested  :
    filterTab === 'saved'      ? saved      :
    interested

  const filterTabs: Array<{ key: OppFilter; label: string; count: number }> = [
    { key: 'suggested',  label: 'Suggested',    count: suggested.length  },
    { key: 'saved',      label: 'Saved',         count: saved.length      },
    { key: 'interested', label: "I'm Interested", count: interested.length },
  ]

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#2D2A26]">Opportunities</h2>
          <p className="text-sm text-[#6B7280] mt-1">
            CULO matches your profile, stories and genuine recommendations to surface opportunities worth exploring.
          </p>
        </div>
        <button
          onClick={handleFind}
          disabled={generating}
          className="shrink-0 px-4 py-2.5 bg-[#2D2A26] text-white text-xs font-semibold rounded-xl hover:bg-[#1a1816] disabled:opacity-60 transition-colors"
        >
          {generating ? 'Finding…' : 'Find opportunities'}
        </button>
      </div>

      {actionError && (
        <div className="mb-5 px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700">
          {actionError}
        </div>
      )}

      {/* Result banner */}
      {genResult && (
        <div className={`mb-5 px-4 py-3 rounded-xl border text-sm ${
          genResult.generated > 0
            ? 'bg-[#C86A43]/5 border-[#C86A43]/20 text-[#7a3d1f]'
            : 'bg-[#F8F5F0] border-[#E8E4DD] text-[#6B7280]'
        }`}>
          {genResult.generated > 0 ? (
            <>
              Found <strong>{genResult.generated}</strong> new {genResult.generated === 1 ? 'opportunity' : 'opportunities'} across{' '}
              <strong>{genResult.businesses}</strong> businesses.
              {genResult.skipped > 0 && <> Skipped {genResult.skipped} already matched.</>}
            </>
          ) : (
            <>
              Scanned {genResult.businesses} businesses — no new opportunities found.
              {genResult.skipped > 0 && <> {genResult.skipped} already matched.</>}
            </>
          )}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {filterTabs.map(t => (
          <button
            key={t.key}
            onClick={() => setFilterTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm border transition-colors ${
              filterTab === t.key
                ? 'bg-[#2D2A26] text-white border-[#2D2A26]'
                : 'bg-white text-[#4B4845] border-[#E8E4DD] hover:border-[#2D2A26]/30'
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                filterTab === t.key ? 'bg-white/20 text-white' : 'bg-[#C86A43]/10 text-[#C86A43]'
              }`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List or empty state */}
      {visible.length === 0 ? (
        allOpps.length === 0 ? (
          <div>
            <EmptyState
              title="No opportunities found yet"
              description="CULO needs a little data before it can match you with opportunities. The more you add, the better the matches."
              action={{ label: 'Find opportunities', onClick: handleFind }}
            />
            <div className="mt-6 bg-white rounded-xl border border-[#E8E4DD] p-5 max-w-lg mx-auto">
              <p className="text-xs font-semibold text-[#2D2A26] mb-3">What CULO uses to find your opportunities</p>
              <div className="space-y-2">
                {[
                  { label: 'Your topics',                    hint: 'Set in Profile → Content tab' },
                  { label: 'What you\'re open to',           hint: 'Set in Profile → Discovery Profile tab' },
                  { label: 'Your approved recommendations',  hint: 'Opportunities → My Picks' },
                  { label: 'Genuine recommendations list',   hint: 'Profile → Discovery Profile tab' },
                  { label: 'Business Discovery Profiles',    hint: 'Businesses with Discovery turned on' },
                  { label: 'Active partner programs',        hint: 'Created by businesses in the Businesses tab' },
                ].map(row => (
                  <div key={row.label} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#C86A43]/40 mt-1.5 shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-[#2D2A26]">{row.label}</p>
                      <p className="text-[11px] text-[#9CA3AF]">{row.hint}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <EmptyState
            title={`No ${filterTab} opportunities`}
            description={`Nothing in ${filterTab} right now.`}
          />
        )
      ) : (
        <div className="space-y-3">
          {visible.map(opp => (
            <OppCard key={opp.id} opp={opp} onAction={handleAction} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Reputation component card ────────────────────────────────────────────────

function ReputationCard({ label, score, max, pct, signals }: {
  label: string; score: number; max: number; pct: number; signals: string[]
}) {
  const barColor =
    pct >= 80 ? '#5E6B4A' :
    pct >= 55 ? '#C86A43' :
    pct >= 30 ? '#D6A94D' :
    '#E8E4DD'

  return (
    <div className="bg-white rounded-xl border border-[#E8E4DD] px-5 py-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold text-[#2D2A26]">{label}</p>
        <span className="text-xs font-bold text-[#2D2A26]">{score}<span className="font-normal text-[#9CA3AF]">/{max}</span></span>
      </div>
      <div className="h-1.5 bg-[#F3EDE6] rounded-full overflow-hidden mb-3">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: barColor }}
        />
      </div>
      {signals.length > 0 ? (
        <ul className="space-y-1">
          {signals.map((s, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="w-1 h-1 rounded-full bg-[#5E6B4A]/50 mt-1.5 shrink-0" />
              <p className="text-[11px] text-[#6B7280] leading-relaxed">{s}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[11px] text-[#9CA3AF] italic">Nothing counted here yet</p>
      )}
    </div>
  )
}

// ─── Reputation section ───────────────────────────────────────────────────────

function TrustSection({ founderId }: { founderId: string }) {
  const [result, setResult] = useState<{ calc: ReturnType<typeof saveTrustProfile>['calc']; profile: TrustProfile }>(
    () => saveTrustProfile(founderId)
  )
  const [updating, setUpdating] = useState(false)

  function handleUpdate() {
    setUpdating(true)
    setTimeout(() => {
      setResult(saveTrustProfile(founderId))
      setUpdating(false)
    }, 50)
  }

  const { calc, profile } = result
  const levelLabel = LEVEL_LABELS[profile.trustLevel]
  const levelColor = LEVEL_COLORS[profile.trustLevel]

  return (
    <div className="p-8 max-w-4xl">

      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#2D2A26]">Reputation</h2>
          <p className="text-sm text-[#6B7280] mt-1">
            Earned through publishing, genuine recommendations, transparency and opportunity engagement — not followers.
          </p>
        </div>
        <button
          onClick={handleUpdate}
          disabled={updating}
          className="shrink-0 px-4 py-2.5 bg-[#2D2A26] text-white text-xs font-semibold rounded-xl hover:bg-[#1a1816] disabled:opacity-60 transition-colors"
        >
          {updating ? 'Updating…' : 'Update reputation'}
        </button>
      </div>

      {/* Score hero */}
      <div className="bg-white rounded-xl border border-[#E8E4DD] p-6 mb-5">
        <div className="flex items-center gap-6">
          {/* Score ring */}
          <div className="shrink-0">
            <svg width="96" height="96" viewBox="0 0 96 96">
              <circle cx="48" cy="48" r="40" fill="none" stroke="#F3EDE6" strokeWidth="8" />
              <circle
                cx="48" cy="48" r="40" fill="none"
                stroke={levelColor}
                strokeWidth="8"
                strokeDasharray={`${(calc.overall / 100) * (2 * Math.PI * 40)} ${2 * Math.PI * 40}`}
                strokeLinecap="round"
                transform="rotate(-90 48 48)"
                style={{ transition: 'stroke-dasharray 0.7s ease' }}
              />
              <text x="48" y="44" textAnchor="middle" dominantBaseline="middle" fontSize="20" fontWeight="700" fill="#2D2A26">
                {calc.overall}
              </text>
              <text x="48" y="60" textAnchor="middle" dominantBaseline="middle" fontSize="9" fill="#9CA3AF">
                / 100
              </text>
            </svg>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-xl font-bold" style={{ color: levelColor }}>{levelLabel}</p>
            </div>
            <p className="text-xs text-[#6B7280] leading-relaxed mb-3">
              Your reputation grows as you publish stories, approve genuine recommendations with disclosure, complete your Discovery Profile, and engage with opportunities.
            </p>
            {/* Score tier guide */}
            <div className="flex gap-1 flex-wrap">
              {(['getting-started', 'building', 'strong', 'trusted', 'highly-trusted'] as const).map(lvl => (
                <span
                  key={lvl}
                  className="text-[10px] px-2 py-0.5 rounded-full font-medium border"
                  style={{
                    backgroundColor: profile.trustLevel === lvl ? levelColor : 'transparent',
                    color:           profile.trustLevel === lvl ? 'white' : '#9CA3AF',
                    borderColor:     profile.trustLevel === lvl ? levelColor : '#E8E4DD',
                  }}
                >
                  {LEVEL_LABELS[lvl]}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* What's working */}
      {calc.positives.length > 0 && (
        <div className="bg-[#5E6B4A]/5 border border-[#5E6B4A]/15 rounded-xl px-5 py-4 mb-5">
          <p className="text-xs font-semibold text-[#5E6B4A] uppercase tracking-wide mb-2">What's working</p>
          <ul className="space-y-1.5">
            {calc.positives.map((p, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-[#5E6B4A] text-xs mt-0.5 shrink-0">✓</span>
                <p className="text-xs text-[#4a5538] leading-relaxed">{p}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Next actions */}
      {calc.nextActions.length > 0 && (
        <div className="bg-[#C86A43]/5 border border-[#C86A43]/15 rounded-xl px-5 py-4 mb-5">
          <p className="text-xs font-semibold text-[#C86A43] uppercase tracking-wide mb-2">To improve your reputation</p>
          <ol className="space-y-1.5">
            {calc.nextActions.slice(0, 4).map((action, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="w-4 h-4 rounded-full bg-[#C86A43]/15 text-[#C86A43] text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <p className="text-xs text-[#7a3d1f] leading-relaxed">{action}</p>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Component breakdown */}
      <div className="mb-5">
        <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest mb-3">Score Breakdown</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ReputationCard
            label="Stories"
            score={calc.components.stories.score}
            max={calc.components.stories.max}
            pct={calc.components.stories.pct}
            signals={calc.components.stories.signals}
          />
          <ReputationCard
            label="Genuine Recommendations"
            score={calc.components.recommendations.score}
            max={calc.components.recommendations.max}
            pct={calc.components.recommendations.pct}
            signals={calc.components.recommendations.signals}
          />
          <ReputationCard
            label="Disclosure"
            score={calc.components.disclosure.score}
            max={calc.components.disclosure.max}
            pct={calc.components.disclosure.pct}
            signals={calc.components.disclosure.signals}
          />
          <ReputationCard
            label="Discovery Profile"
            score={calc.components.profile.score}
            max={calc.components.profile.max}
            pct={calc.components.profile.pct}
            signals={calc.components.profile.signals}
          />
          <ReputationCard
            label="Opportunity Engagement"
            score={calc.components.engagement.score}
            max={calc.components.engagement.max}
            pct={calc.components.engagement.pct}
            signals={calc.components.engagement.signals}
          />
        </div>
      </div>

      {/* Earned badges */}
      <div className="bg-white rounded-xl border border-[#E8E4DD] p-5">
        <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest mb-4">Achievements</p>
        {calc.badges.length === 0 ? (
          <p className="text-xs text-[#9CA3AF]">
            Achievements unlock as you publish stories, approve recommendations, and build your Discovery Profile.
          </p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {calc.badges.map(badge => (
              <div key={badge.id} className="p-3 bg-[#F8F5F0] rounded-xl text-center border border-[#E8E4DD]">
                <div className="w-9 h-9 rounded-xl bg-white border border-[#E8E4DD] flex items-center justify-center mx-auto mb-2 text-base">
                  {badge.icon}
                </div>
                <p className="text-[10px] font-semibold text-[#2D2A26] leading-tight mb-0.5">{badge.name}</p>
                <p className="text-[9px] text-[#9CA3AF] leading-tight">{badge.description}</p>
              </div>
            ))}
          </div>
        )}

        {/* Score history mini-chart */}
        {profile.scoreHistory.length >= 2 && (
          <div className="mt-4 pt-4 border-t border-[#F3EDE6]">
            <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide mb-2">Score history</p>
            <div className="flex items-end gap-1 h-10">
              {profile.scoreHistory.slice(-14).map((entry, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                  <div
                    className="w-full rounded-sm"
                    style={{ height: `${Math.max(2, (entry.score / 100) * 36)}px`, backgroundColor: levelColor, opacity: 0.6 }}
                    title={`${entry.date}: ${entry.score}`}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-[#9CA3AF] mt-4 px-1">
        Last calculated: {new Date(profile.lastCalculatedAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
      </p>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

const tabs: Array<{ id: Tab; label: string; icon: string }> = [
  { id: 'overview',        label: 'Overview',         icon: icons.overview },
  { id: 'recommendations', label: 'My Picks',         icon: icons.recommendations },
  { id: 'opportunities',   label: 'Opportunities',    icon: icons.opportunities },
  { id: 'trust',           label: 'Reputation',       icon: icons.trust },
]

export function DashboardPartnershipPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  // Resolve to actual Founder entity ID so detection/stories/profiles all share the same key.
  const founderId = getCurrentFounderId(user) ?? 'dev-user'

  return (
    <div className="flex h-full" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Sub-navigation sidebar ─────────────────────────────────────────── */}
      <aside className="w-48 shrink-0 border-r border-[#E8E4DD] bg-[#FDFBF9] flex flex-col py-4 overflow-y-auto">
        <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-widest px-3 pb-2">
          Opportunities
        </p>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2.5 px-3 py-2 mx-1 rounded-lg text-sm text-left transition-colors ${
              activeTab === tab.id
                ? 'bg-[#C86A43]/10 text-[#C86A43] font-medium'
                : 'text-[#4B4845] hover:bg-[#F3EDE6] hover:text-[#2D2A26]'
            }`}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
            </svg>
            {tab.label}
          </button>
        ))}
      </aside>

      {/* ── Content area ───────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto bg-[#F8F5F0]">
        {activeTab === 'overview'        && <OverviewSection founderId={founderId} />}
        {activeTab === 'recommendations' && <MyPicksSection founderId={founderId} />}
        {activeTab === 'opportunities'   && <OpportunitiesSection founderId={founderId} />}
        {activeTab === 'trust'           && <TrustSection founderId={founderId} />}
      </main>
    </div>
  )
}
