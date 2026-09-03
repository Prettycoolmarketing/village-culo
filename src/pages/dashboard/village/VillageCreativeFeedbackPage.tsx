import { useEffect, useState } from 'react'
import { getFounders } from '../../../services/founders'
import { creativeFeedbackService } from '../../../services/creativeFeedback'

// CULO Creatives feedback — submitting the one question locks a founder
// into the $19/mo collaborator rate (see submit-creative-feedback Edge
// Function). This page is just the read side: what people actually said.

export function VillageCreativeFeedbackPage() {
  const founders = getFounders()
  const [loading, setLoading] = useState(true)
  const [entries, setEntries] = useState(creativeFeedbackService.getAll())

  useEffect(() => {
    void creativeFeedbackService.refresh().then(() => {
      setEntries(creativeFeedbackService.getAll())
      setLoading(false)
    })
  }, [])

  const sorted = [...entries].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return (
    <div className="p-8 max-w-3xl" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="mb-6">
        <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-widest mb-1">CAPO · Village Staff</p>
        <h1 className="text-2xl font-bold text-[#2D2A26]">CULO Creatives Feedback</h1>
        <p className="text-sm text-[#6B7280] mt-1">
          Submitting this locks a founder into the $19/month collaborator rate. {entries.length} submitted so far.
        </p>
      </div>

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
  )
}
