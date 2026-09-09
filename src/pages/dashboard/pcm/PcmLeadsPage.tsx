import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { pcmLeadsService, type PcmLead } from '../../../services/pcmLeads'
import { downloadCSV } from '../../../utils/emailExport'
import { ConfirmButton } from '../../../components/ui/ConfirmButton'

const font = { fontFamily: "'DM Sans', sans-serif" }

const SOURCE_LABELS: Record<string, string> = {
  'marketing-publishing': 'Publishing service',
  'marketing-social': 'Social media',
  marketing: 'Marketing page',
}

function leadsToCSV(leads: PcmLead[]): string {
  const headers = ['name', 'email', 'phone', 'website', 'interestedIn', 'createdAt']
  const esc = (v: string) => `"${(v ?? '').replace(/"/g, '""')}"`
  return [
    headers.join(','),
    ...leads.map(l =>
      [l.name ?? '', l.email, l.phone ?? '', l.website ?? '', SOURCE_LABELS[l.source] ?? l.source, l.createdAt]
        .map(esc)
        .join(','),
    ),
  ].join('\n')
}

export function PcmLeadsPage() {
  const [leads, setLeads] = useState<PcmLead[]>(pcmLeadsService.getAll())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    void pcmLeadsService.refresh().finally(() => {
      if (!alive) return
      setLeads(pcmLeadsService.getAll())
      setLoading(false)
    })
    return () => { alive = false }
  }, [])

  function remove(id: string) {
    void pcmLeadsService.delete(id).then(() => setLeads(pcmLeadsService.getAll()))
  }

  return (
    <div className="p-8 sm:pt-12 flex flex-col gap-6 max-w-4xl" style={font}>
      <div className="flex items-center justify-between gap-4 flex-wrap px-2">
        <div>
          <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-widest mb-1">CAPO · Pretty Cool Marketing</p>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[#2D2A26]">Leads</h1>
          <p className="text-sm text-[#6B7280] mt-1">
            People who asked to see rates on <Link to="/marketing" className="text-[#C86A43] hover:underline">culovillage.com/marketing</Link>.
          </p>
        </div>
        {leads.length > 0 && (
          <button
            onClick={() => downloadCSV(leadsToCSV(leads), `pcm-leads-${new Date().toISOString().slice(0, 10)}.csv`)}
            className="text-sm font-semibold px-4 py-2.5 rounded-xl bg-[#2D2A26] text-white hover:bg-[#1a1815] transition-colors"
          >
            Export CSV
          </button>
        )}
      </div>

      {loading && leads.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E8E4DD] p-12 text-center text-sm text-[#6B7280]">Loading…</div>
      ) : leads.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E8E4DD] p-12 text-center text-sm text-[#6B7280]">
          No leads yet.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E8E4DD] overflow-hidden">
          {leads.map(l => (
            <div key={l.id} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 px-6 py-4 border-b border-[#F0EBE3] last:border-0">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#2D2A26]">{l.name || '—'}</p>
                <p className="text-xs text-[#6B7280]">
                  <a href={`mailto:${l.email}`} className="hover:underline">{l.email}</a>
                  {l.phone ? ` · ${l.phone}` : ''}
                </p>
                {l.website && (
                  <p className="text-xs text-[#9CA3AF] truncate">{l.website}</p>
                )}
              </div>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#FBF1EB] text-[#C86A43] shrink-0">
                {SOURCE_LABELS[l.source] ?? l.source}
              </span>
              <span className="text-xs text-[#9CA3AF] shrink-0 w-24">{new Date(l.createdAt).toLocaleDateString()}</span>
              <span className="shrink-0">
                <ConfirmButton label="Delete" onConfirm={() => remove(l.id)} />
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
