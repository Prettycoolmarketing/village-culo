import { useState } from 'react'
import { Link } from 'react-router-dom'
import { importBatchService } from '../../../services/importBatch'
import { ConfirmButton } from '../../../components/ui/ConfirmButton'
import type { ImportBatch } from '../../../services/importBatch'

// ─── Batch row ────────────────────────────────────────────────────────────────

function BatchRow({ batch, onDelete }: { batch: ImportBatch; onDelete: () => void }) {
  const [confirming, setConfirming] = useState(false)

  return (
    <div className="flex items-center gap-4 px-5 py-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#2D2A26] truncate">{batch.batchName}</p>
        <p className="text-[10px] text-[#9CA3AF] mt-0.5">
          {new Date(batch.importedAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          {batch.source && ` · via ${batch.source}`}
        </p>
      </div>
      <div className="flex gap-4 text-center shrink-0">
        <div>
          <p className="text-sm font-bold text-[#5E6B4A]">{batch.created}</p>
          <p className="text-[10px] text-[#9CA3AF]">Created</p>
        </div>
        <div>
          <p className="text-sm font-bold text-[#9CA3AF]">{batch.skipped}</p>
          <p className="text-[10px] text-[#9CA3AF]">Skipped</p>
        </div>
        <div>
          <p className={`text-sm font-bold ${batch.errored > 0 ? 'text-red-500' : 'text-[#9CA3AF]'}`}>{batch.errored}</p>
          <p className="text-[10px] text-[#9CA3AF]">Errors</p>
        </div>
        <div>
          <p className="text-sm font-bold text-[#C86A43]">{batch.businessesCreated}</p>
          <p className="text-[10px] text-[#9CA3AF]">Businesses</p>
        </div>
        <div>
          <p className="text-sm font-bold text-blue-700">{batch.contentCreated}</p>
          <p className="text-[10px] text-[#9CA3AF]">Content</p>
        </div>
      </div>
      <div className="shrink-0">
        {confirming ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => { onDelete(); setConfirming(false) }}
              className="text-xs font-semibold px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="text-xs text-[#9CA3AF] hover:text-[#2D2A26] transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="text-xs text-[#9CA3AF] hover:text-red-500 transition-colors"
          >
            Delete record
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Village Bulk Import Page ─────────────────────────────────────────────────

export function VillageBulkImportPage() {
  const [tick, setTick] = useState(0)
  void tick
  const refresh = () => setTick(t => t + 1)

  const batches = importBatchService.getAll()

  const totalCreated  = batches.reduce((s, b) => s + b.created, 0)
  const totalSkipped  = batches.reduce((s, b) => s + b.skipped, 0)
  const totalErrors   = batches.reduce((s, b) => s + b.errored, 0)
  const totalBiz      = batches.reduce((s, b) => s + b.businessesCreated, 0)
  const totalContent  = batches.reduce((s, b) => s + b.contentCreated, 0)
  const totalIntel    = batches.reduce((s, b) => s + b.intelGenerated, 0)

  return (
    <div className="p-8 max-w-5xl" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-widest mb-1">Village HQ</p>
          <h1 className="text-2xl font-bold text-[#2D2A26]">Bulk Import</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">
            Import history and batch management. Use Village Import Format (VIF) JSON.
          </p>
        </div>
        <Link
          to="/dashboard/bulk-import"
          className="flex-shrink-0 px-5 py-2.5 bg-[#C86A43] text-white text-sm font-semibold rounded-xl hover:bg-[#b05a35] transition-colors"
        >
          + New Import
        </Link>
      </div>

      {/* Aggregate stats */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-8">
        {[
          { label: 'Founders Created',  value: totalCreated,  color: 'text-[#5E6B4A]'  },
          { label: 'Skipped',           value: totalSkipped,  color: 'text-[#9CA3AF]'  },
          { label: 'Errors',            value: totalErrors,   color: totalErrors > 0 ? 'text-red-500' : 'text-[#9CA3AF]' },
          { label: 'Businesses',        value: totalBiz,      color: 'text-[#C86A43]'  },
          { label: 'Content Saved',     value: totalContent,  color: 'text-blue-700'   },
          { label: 'Intelligence',      value: totalIntel,    color: 'text-[#2D2A26]'  },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-[#E8E4DD] px-4 py-3">
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-[#9CA3AF]">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Import history */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest">
            Import History ({batches.length} {batches.length === 1 ? 'batch' : 'batches'})
          </p>
          {batches.length > 0 && (
            <ConfirmButton
              label="Clear history"
              confirmLabel="Yes, clear all"
              message={`Delete all ${batches.length} batch records?`}
              onConfirm={() => void importBatchService.clear().then(refresh)}
            />
          )}
        </div>

        {batches.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#E8E4DD] px-5 py-12 text-center">
            <p className="text-sm font-semibold text-[#2D2A26] mb-2">No import history yet</p>
            <p className="text-xs text-[#9CA3AF] mb-4">
              Import batches will appear here after you run a Village Import Format (VIF) import.
            </p>
            <Link
              to="/dashboard/bulk-import"
              className="inline-flex px-5 py-2.5 bg-[#C86A43] text-white text-sm font-semibold rounded-xl hover:bg-[#b05a35] transition-colors"
            >
              Start first import
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-[#E8E4DD] divide-y divide-[#F3EDE6]">
            {batches.map(batch => (
              <BatchRow
                key={batch.id}
                batch={batch}
                onDelete={() => { void importBatchService.delete(batch.id).then(refresh) }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Re-run note */}
      {batches.some(b => b.errored > 0) && (
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl px-5 py-3">
          <p className="text-xs text-amber-700">
            Some batches had errors. To re-run failed founders, re-paste the original JSON into{' '}
            <Link to="/dashboard/bulk-import" className="font-semibold hover:underline">New Import</Link>{' '}
            with "Skip Duplicates" enabled — successfully imported founders will be skipped automatically.
          </p>
        </div>
      )}

      {/* VIF note */}
      <div className="mt-4 bg-[#F8F5F0] rounded-xl px-5 py-3">
        <p className="text-xs text-[#6B7280] leading-relaxed">
          Village Import Format (VIF) v1 · JSON only · Supports founders, businesses, content links, books, courses, events, communities.
          Use the master Claude prompt to generate VIF JSON for any list of founders. Import batches from all sources are tracked here.
        </p>
      </div>
    </div>
  )
}
