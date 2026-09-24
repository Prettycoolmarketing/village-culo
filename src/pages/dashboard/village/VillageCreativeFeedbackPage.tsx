import { useEffect, useState } from 'react'
import { getFounders } from '../../../services/founders'
import { creativeFeedbackService } from '../../../services/creativeFeedback'
import { accountFeedbackService, type AccountFeedback } from '../../../services/accountFeedback'

// CULO Creatives feedback — submitting the one question locks a founder
// into the $19/mo collaborator rate (see submit-creative-feedback Edge
// Function). This page is just the read side: what people actually said.
//
// Two more sections below it, from a completely different table
// (account_feedback) — the "why" captured when someone cancels Culo
// Creatives or deletes their whole Village profile. Kept as its own
// section per product (Creatives cancellations vs Village deletions)
// rather than mixed together, since they're answering different
// questions about different decisions.

function AccountFeedbackSection({ title, entries, founders, loading, emptyLabel }: {
  title: string
  entries: AccountFeedback[]
  founders: ReturnType<typeof getFounders>
  loading: boolean
  emptyLabel: string
}) {
  const sorted = [...entries].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return (
    <div className="mb-8">
      <h2 className="text-lg font-bold text-[#2D2A26] mb-3">{title}</h2>
      {loading ? (
        <p className="text-sm text-[#9CA3AF]">Loading…</p>
      ) : sorted.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E8E4DD] px-4 py-6 text-center">
          <p className="text-sm text-[#9CA3AF]">{emptyLabel}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map(entry => {
            const founder = founders.find(f => f.id === entry.founderId)
            return (
              <div key={entry.id} className="bg-white rounded-xl border border-[#E8E4DD] px-5 py-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-[#2D2A26]">{founder?.name ?? entry.founderId}</p>
                  <p className="text-xs text-[#9CA3AF]">{new Date(entry.createdAt).toLocaleDateString()}</p>
                </div>
                <p className="text-sm text-[#6B7280] leading-relaxed whitespace-pre-wrap">{entry.answer}</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function VillageCreativeFeedbackPage() {
  const founders = getFounders()
  const [loading, setLoading] = useState(true)
  const [entries, setEntries] = useState(creativeFeedbackService.getAll())
  const [accountLoading, setAccountLoading] = useState(true)
  const [accountEntries, setAccountEntries] = useState(accountFeedbackService.getAll())

  useEffect(() => {
    void creativeFeedbackService.refresh().then(() => {
      setEntries(creativeFeedbackService.getAll())
      setLoading(false)
    })
    void accountFeedbackService.refresh().then(() => {
      setAccountEntries(accountFeedbackService.getAll())
      setAccountLoading(false)
    })
  }, [])

  const sorted = [...entries].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const creativesCancellations = accountEntries.filter(e => e.section === 'culo-creatives')
  const villageDeletions = accountEntries.filter(e => e.section === 'culo-village')

  return (
    <div className="p-8 max-w-3xl" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="mb-6">
        <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-widest mb-1">CAPO · Village Staff</p>
        <h1 className="text-2xl font-bold text-[#2D2A26]">Feedback</h1>
        <p className="text-sm text-[#6B7280] mt-1">
          Everything founders have told us, in one place — the trial-lock survey, why someone cancelled
          Culo Creatives, and why someone left the Village entirely.
        </p>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-bold text-[#2D2A26] mb-1">CULO Creatives Feedback</h2>
        <p className="text-sm text-[#6B7280] mb-3">
          Submitting this locks a founder into the $19/month collaborator rate. {entries.length} submitted so far.
        </p>
        {loading ? (
          <p className="text-sm text-[#9CA3AF]">Loading…</p>
        ) : sorted.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#E8E4DD] px-4 py-8 text-center">
            <p className="text-sm text-[#9CA3AF]">No feedback submitted yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sorted.map(entry => {
              const founder = founders.find(f => f.id === entry.founderId)
              return (
                <div key={entry.id} className="bg-white rounded-xl border border-[#E8E4DD] px-5 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-[#2D2A26]">{founder?.name ?? entry.founderId}</p>
                    <p className="text-xs text-[#9CA3AF]">{new Date(entry.createdAt).toLocaleDateString()}</p>
                  </div>
                  <p className="text-sm text-[#6B7280] leading-relaxed whitespace-pre-wrap">{entry.answer}</p>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <AccountFeedbackSection
        title="Culo Creatives Cancellations"
        entries={creativesCancellations}
        founders={founders}
        loading={accountLoading}
        emptyLabel="No cancellation feedback yet."
      />

      <AccountFeedbackSection
        title="Culo Village Deletions"
        entries={villageDeletions}
        founders={founders}
        loading={accountLoading}
        emptyLabel="No deletion feedback yet."
      />
    </div>
  )
}
