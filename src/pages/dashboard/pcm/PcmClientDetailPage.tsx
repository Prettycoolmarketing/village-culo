import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  getPcmClient, updatePcmClient, deletePcmClient, togglePcmStage, addPcmActivity,
  PCM_STAGES, PCM_OFFER_LABELS, type PcmStageId,
} from '../../../lib/pcmClients'
import { PCM_SUPPORT_EMAIL } from '../../../config/pcmPaymentLinks'

const font = { fontFamily: "'DM Sans', sans-serif" }
const inputClass =
  'w-full px-3 py-2 rounded-lg border border-[#E8E4DD] text-sm text-[#2D2A26] bg-white placeholder:text-[#9CA3AF] focus:outline-none focus:ring-1 focus:ring-[#C86A43]/30 focus:border-[#C86A43] transition-colors'

export function PcmClientDetailPage() {
  const { clientId = '' } = useParams()
  const navigate = useNavigate()
  const [client, setClient] = useState(getPcmClient(clientId))
  const [notes, setNotes] = useState(client?.notes ?? '')
  const [notesSaved, setNotesSaved] = useState(false)

  if (!client) {
    return (
      <div className="p-8 sm:pt-12" style={font}>
        <p className="text-sm text-[#6B7280]">Client not found. <Link to="/dashboard/pcm" className="text-[#C86A43]">Back to the list</Link></p>
      </div>
    )
  }

  function reload() { setClient(getPcmClient(clientId)) }

  function toggle(stage: PcmStageId, done: boolean) {
    togglePcmStage(clientId, stage, done)
    reload()
  }

  function saveNotes() {
    updatePcmClient(clientId, { notes })
    setNotesSaved(true)
    reload()
  }

  function notifyClient() {
    addPcmActivity(clientId, `Client notified (logged — email not yet automated).`)
    reload()
  }

  function remove() {
    if (!confirm(`Remove ${client!.name} from the tracker? This cannot be undone.`)) return
    deletePcmClient(clientId)
    navigate('/dashboard/pcm')
  }

  return (
    <div className="p-8 sm:pt-12 flex flex-col gap-6 max-w-3xl" style={font}>
      <Link to="/dashboard/pcm" className="text-xs font-semibold text-[#C86A43] hover:underline">← All clients</Link>

      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[#2D2A26]">{client.name}</h1>
        <p className="text-sm text-[#6B7280] mt-1">
          <a href={`mailto:${client.email}`} className="hover:underline">{client.email}</a>
          {' · '}{PCM_OFFER_LABELS[client.offer]}
        </p>
        <p className="text-xs text-[#9CA3AF] mt-1">
          Started {client.startDate || '—'}
          {(client.offer === 'content' || client.offer === 'full') && client.nextShootDate ? ` · Next shoot ${client.nextShootDate}` : ''}
        </p>
      </div>

      {/* Pipeline */}
      <section className="bg-white rounded-2xl border border-[#E8E4DD] p-6">
        <h2 className="text-lg font-semibold text-[#2D2A26] mb-1">Pipeline</h2>
        <p className="text-xs text-[#9CA3AF] mb-5">Flip each stage as the work moves through it. The client sees this once notifications are switched on.</p>
        <div className="flex flex-col gap-3">
          {PCM_STAGES.map(stage => {
            const done = !!client!.stages[stage.id]
            return (
              <label key={stage.id} className="flex items-start gap-3 p-3 rounded-xl border border-[#F0EBE3] cursor-pointer hover:bg-[#FBF7F2]">
                <button
                  type="button"
                  role="switch"
                  aria-checked={done}
                  onClick={() => toggle(stage.id, !done)}
                  className={`mt-0.5 w-10 h-6 rounded-full shrink-0 transition-colors relative ${done ? 'bg-[#5E6B4A]' : 'bg-[#D8D2C8]'}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${done ? 'left-[18px]' : 'left-0.5'}`} />
                </button>
                <span>
                  <span className="block text-sm font-medium text-[#2D2A26]">{stage.label}</span>
                  <span className="block text-xs text-[#9CA3AF]">{stage.hint}</span>
                  {done && client!.stages[stage.id] && (
                    <span className="block text-[11px] text-[#5E6B4A] mt-0.5">
                      Done {new Date(client!.stages[stage.id]!).toLocaleDateString()}
                    </span>
                  )}
                </span>
              </label>
            )
          })}
        </div>
        <button
          onClick={notifyClient}
          className="mt-5 text-sm font-semibold px-4 py-2.5 rounded-xl bg-[#2D2A26] text-white hover:bg-[#1a1815] transition-colors"
        >
          Notify client
        </button>
        <span className="ml-3 text-xs text-[#9CA3AF]">Logs a note for now — email automation comes later.</span>
      </section>

      {/* Notes */}
      <section className="bg-white rounded-2xl border border-[#E8E4DD] p-6">
        <h2 className="text-lg font-semibold text-[#2D2A26] mb-3">Notes</h2>
        <textarea
          className={`${inputClass} min-h-[120px]`}
          value={notes}
          onChange={e => { setNotes(e.target.value); setNotesSaved(false) }}
          placeholder="Anything the team needs to know about this client…"
        />
        <div className="mt-3 flex items-center gap-3">
          <button onClick={saveNotes} className="text-sm font-semibold px-4 py-2 rounded-xl bg-[#C86A43] text-white hover:bg-[#b05a35] transition-colors">
            Save notes
          </button>
          {notesSaved && <span className="text-xs text-[#5E6B4A]">Saved</span>}
        </div>
      </section>

      {/* Activity */}
      <section className="bg-white rounded-2xl border border-[#E8E4DD] p-6">
        <h2 className="text-lg font-semibold text-[#2D2A26] mb-3">Activity</h2>
        <ul className="flex flex-col gap-2">
          {client.activity.map((a, i) => (
            <li key={i} className="text-xs text-[#6B7280] flex gap-3">
              <span className="text-[#B8B2A8] shrink-0 w-28">{new Date(a.at).toLocaleString()}</span>
              <span>{a.text}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="flex items-center justify-between text-xs text-[#9CA3AF]">
        <span>Onboarding: client emails their material to {PCM_SUPPORT_EMAIL}</span>
        <button onClick={remove} className="text-[#B85C3A] hover:underline font-medium">Remove client</button>
      </div>
    </div>
  )
}
