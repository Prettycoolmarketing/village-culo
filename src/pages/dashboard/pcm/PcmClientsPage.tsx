import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getPcmClients, createPcmClient, currentStage,
  PCM_OFFER_LABELS, type PcmOfferId,
} from '../../../lib/pcmClients'

const font = { fontFamily: "'DM Sans', sans-serif" }
const inputClass =
  'w-full px-3 py-2 rounded-lg border border-[#E8E4DD] text-sm text-[#2D2A26] bg-white placeholder:text-[#9CA3AF] focus:outline-none focus:ring-1 focus:ring-[#C86A43]/30 focus:border-[#C86A43] transition-colors'

export function PcmClientsPage() {
  const [clients, setClients] = useState(getPcmClients())
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({
    name: '', email: '', offer: 'tier2' as PcmOfferId,
    startDate: new Date().toISOString().slice(0, 10), nextShootDate: '',
  })

  function refresh() { setClients(getPcmClients()) }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim()) return
    createPcmClient(form)
    setForm({ name: '', email: '', offer: 'tier2', startDate: new Date().toISOString().slice(0, 10), nextShootDate: '' })
    setAdding(false)
    refresh()
  }

  return (
    <div className="p-8 sm:pt-12 flex flex-col gap-6" style={font}>
      <div className="flex items-center justify-between px-2 gap-4 flex-wrap">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[#2D2A26]">Pretty Cool Marketing</h1>
          <p className="text-sm text-[#6B7280] mt-1">Client tracker — where every client is in the pipeline.</p>
        </div>
        <button
          onClick={() => setAdding(a => !a)}
          className="text-sm font-semibold px-4 py-2.5 rounded-xl bg-[#C86A43] text-white hover:bg-[#b05a35] transition-colors"
        >
          {adding ? 'Cancel' : 'Add client'}
        </button>
      </div>

      {adding && (
        <form onSubmit={submit} className="bg-white rounded-2xl border border-[#E8E4DD] p-6 grid sm:grid-cols-2 gap-4">
          <label className="text-sm text-[#2D2A26]">
            <span className="block font-medium mb-1">Name</span>
            <input className={inputClass} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </label>
          <label className="text-sm text-[#2D2A26]">
            <span className="block font-medium mb-1">Email</span>
            <input type="email" className={inputClass} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          </label>
          <label className="text-sm text-[#2D2A26]">
            <span className="block font-medium mb-1">Offer</span>
            <select className={inputClass} value={form.offer} onChange={e => setForm({ ...form, offer: e.target.value as PcmOfferId })}>
              {(Object.keys(PCM_OFFER_LABELS) as PcmOfferId[]).map(id => (
                <option key={id} value={id}>{PCM_OFFER_LABELS[id]}</option>
              ))}
            </select>
          </label>
          <label className="text-sm text-[#2D2A26]">
            <span className="block font-medium mb-1">Start date</span>
            <input type="date" className={inputClass} value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
          </label>
          {form.offer === 'tier3' && (
            <label className="text-sm text-[#2D2A26]">
              <span className="block font-medium mb-1">Next shoot date</span>
              <input type="date" className={inputClass} value={form.nextShootDate} onChange={e => setForm({ ...form, nextShootDate: e.target.value })} />
            </label>
          )}
          <div className="sm:col-span-2">
            <button className="text-sm font-semibold px-4 py-2.5 rounded-xl bg-[#2D2A26] text-white hover:bg-[#1a1815] transition-colors">
              Save client
            </button>
          </div>
        </form>
      )}

      {clients.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E8E4DD] p-12 text-center">
          <p className="text-sm text-[#6B7280]">No clients yet. Add one to start tracking their pipeline.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E8E4DD] overflow-hidden">
          {clients.map(c => {
            const stage = currentStage(c)
            return (
              <Link
                key={c.id}
                to={`/dashboard/pcm/${c.id}`}
                className="flex items-center gap-4 px-6 py-4 border-b border-[#F0EBE3] last:border-0 hover:bg-[#FBF7F2] transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#2D2A26] truncate">{c.name}</p>
                  <p className="text-xs text-[#9CA3AF] truncate">{PCM_OFFER_LABELS[c.offer]}</p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${
                  stage.id === 'live' ? 'bg-[#E7F0E5] text-[#5E6B4A]'
                  : stage.id === 'new' ? 'bg-[#F3EDE6] text-[#7A7570]'
                  : 'bg-[#FBF1EB] text-[#C86A43]'
                }`}>
                  {stage.label}
                </span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
