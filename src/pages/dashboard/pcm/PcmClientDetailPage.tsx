import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  getPcmClient, updatePcmClient, deletePcmClient, togglePcmStage, addPcmActivity, syncPcmClientsFromServer,
  PCM_STAGES, PCM_OFFER_LABELS, type PcmStageId,
} from '../../../lib/pcmClients'
import { PCM_SUPPORT_EMAIL } from '../../../config/pcmPaymentLinks'
import { getFounder, getFounderBySlug, updateFounder } from '../../../services/founders'
import { getStories } from '../../../services/stories'
import { sendTransactionalEmail } from '../../../services/transactionalEmail'

const font = { fontFamily: "'DM Sans', sans-serif" }

function publishedThisMonth(founderId: string): number {
  const now = new Date()
  return getStories({ founderId, publicOnly: true }).filter(s => {
    const d = new Date(s.updatedAt || s.createdAt)
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  }).length
}
const inputClass =
  'w-full px-3 py-2 rounded-lg border border-[#E8E4DD] text-sm text-[#2D2A26] bg-white placeholder:text-[#9CA3AF] focus:outline-none focus:ring-1 focus:ring-[#C86A43]/30 focus:border-[#C86A43] transition-colors'

export function PcmClientDetailPage() {
  const { clientId = '' } = useParams()
  const navigate = useNavigate()
  const [client, setClient] = useState(getPcmClient(clientId))
  const [notes, setNotes] = useState(client?.notes ?? '')
  const [notesSaved, setNotesSaved] = useState(false)
  const [founderRef, setFounderRef] = useState(client?.founderId ?? '')
  const [linkError, setLinkError] = useState<string | null>(null)

  function reload() { setClient(getPcmClient(clientId)) }

  // A client created server-side by stripe-pcm-webhook may not be in this
  // browser's local cache yet — sync once on mount so opening a direct link
  // to a brand new client doesn't land on "not found".
  useEffect(() => { void syncPcmClientsFromServer().then(reload) }, [])

  if (!client) {
    return (
      <div className="p-8 sm:pt-12" style={font}>
        <p className="text-sm text-[#6B7280]">Client not found. <Link to="/dashboard/pcm" className="text-[#C86A43]">Back to the list</Link></p>
      </div>
    )
  }

  function toggle(stage: PcmStageId, done: boolean) {
    togglePcmStage(clientId, stage, done)
    reload()
  }

  function saveNotes() {
    updatePcmClient(clientId, { notes })
    setNotesSaved(true)
    reload()
  }

  async function notifyClient() {
    if (client!.founderId) {
      const founder = getFounder(client!.founderId)
      if (founder) {
        await updateFounder({ ...founder, pcmGateOpen: true })
        sendTransactionalEmail({ type: 'pcm-content-ready', to: client!.email, founderName: founder.name })
      }
    }
    addPcmActivity(clientId, 'Client notified — content marked ready, dashboard "being built" banner turned off.')
    reload()
  }

  /** Link this PCM client to a Village founder (by id or profile slug) and turn on pcmManaged. */
  async function linkFounder() {
    setLinkError(null)
    const ref = founderRef.trim()
    if (!ref) return
    const founder = getFounder(ref) ?? getFounderBySlug(ref)
    if (!founder) { setLinkError('No Village founder found with that id or profile slug.'); return }
    await updateFounder({ ...founder, pcmManaged: true, pcmManagedAt: new Date().toISOString() })
    updatePcmClient(clientId, { founderId: founder.id, monthlyTarget: client!.monthlyTarget ?? 30 })
    addPcmActivity(clientId, `Linked to Village founder ${founder.name} — now PCM-managed (self-serve publishing limits off).`)
    reload()
  }

  async function unlinkFounder() {
    if (client!.founderId) {
      const founder = getFounder(client!.founderId)
      if (founder) await updateFounder({ ...founder, pcmManaged: false })
    }
    updatePcmClient(clientId, { founderId: undefined })
    addPcmActivity(clientId, 'Unlinked from Village founder — self-serve publishing limits back on.')
    setFounderRef('')
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

      {/* Village founder link + monthly deliverable */}
      <section className="bg-white rounded-2xl border border-[#E8E4DD] p-6">
        <h2 className="text-lg font-semibold text-[#2D2A26] mb-1">Village founder</h2>
        {client.founderId ? (() => {
          const founder = getFounder(client.founderId!)
          const target = client.monthlyTarget ?? 30
          const done = publishedThisMonth(client.founderId!)
          return (
            <>
              <p className="text-xs text-[#9CA3AF] mb-4">
                {founder ? founder.name : client.founderId} — PCM-managed. Self-serve publishing limits are off; this is a service deliverable.
              </p>
              <div className="rounded-xl border border-[#F0EBE3] p-4 mb-4">
                <p className="text-sm font-semibold text-[#2D2A26]">
                  <span className="text-2xl font-bold text-[#C86A43]">{done}</span>
                  <span className="text-[#9CA3AF]"> / {target}</span> published this month
                </p>
                <div className="mt-2 h-2 rounded-full bg-[#F0EBE3] overflow-hidden">
                  <div className="h-full bg-[#5E6B4A]" style={{ width: `${Math.min(100, (done / target) * 100)}%` }} />
                </div>
              </div>
              <button onClick={() => void unlinkFounder()} className="text-xs text-[#B85C3A] hover:underline font-medium">
                Unlink founder
              </button>
            </>
          )
        })() : (
          <>
            <p className="text-xs text-[#9CA3AF] mb-3">
              Link this client to their Village founder profile (id or profile slug) to turn off their self-serve publishing limits and track monthly deliverables here.
            </p>
            <div className="flex gap-2">
              <input
                className={inputClass}
                placeholder="Founder id or profile slug"
                value={founderRef}
                onChange={e => setFounderRef(e.target.value)}
              />
              <button
                onClick={() => void linkFounder()}
                className="shrink-0 text-sm font-semibold px-4 py-2 rounded-xl bg-[#2D2A26] text-white hover:bg-[#1a1815] transition-colors"
              >
                Link
              </button>
            </div>
            {linkError && <p className="text-xs text-[#B85C3A] mt-2">{linkError}</p>}
          </>
        )}
      </section>

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
          onClick={() => void notifyClient()}
          className="mt-5 text-sm font-semibold px-4 py-2.5 rounded-xl bg-[#2D2A26] text-white hover:bg-[#1a1815] transition-colors"
        >
          Notify client — content is ready
        </button>
        <span className="ml-3 text-xs text-[#9CA3AF]">Opens their dashboard's "being built" banner and emails them.</span>
      </section>

      {/* Payment */}
      <section className="bg-white rounded-2xl border border-[#E8E4DD] p-6">
        <h2 className="text-lg font-semibold text-[#2D2A26] mb-3">Payment</h2>
        {(() => {
          const monthly = client.offer === 'publishing' ? 900
            : client.offer === 'social' ? 3000
            : client.offer === 'content' ? 3888
            : client.offer === 'full' ? 4788
            : null
          const start = client.startDate ? new Date(client.startDate) : null
          let nextDue: Date | null = null
          if (start) {
            nextDue = new Date(start)
            while (nextDue < new Date()) nextDue.setMonth(nextDue.getMonth() + 1)
          }
          return (
            <div className="text-sm text-[#2D2A26] flex flex-col gap-1.5">
              <p>{monthly ? `$${monthly.toLocaleString()} AUD / month` : 'Custom pricing'} · {PCM_OFFER_LABELS[client.offer]}</p>
              <p className="text-[#6B7280]">Started {client.startDate || '—'} · 3-month minimum term</p>
              {nextDue && (
                <p className="text-[#6B7280]">
                  Next payment due <span className="font-semibold text-[#2D2A26]">{nextDue.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  <span className="text-[#B8B2A8]"> (estimated from the start date — Stripe is the source of truth)</span>
                </p>
              )}
            </div>
          )
        })()}
      </section>

      {/* Notes */}
      <section className="bg-white rounded-2xl border border-[#E8E4DD] p-6">
        <h2 className="text-lg font-semibold text-[#2D2A26] mb-1">Notes</h2>
        <p className="text-xs text-[#9CA3AF] mb-3">
          Internal team notes — these are <strong>not</strong> sent to the client. Client communication
          goes by email from {PCM_SUPPORT_EMAIL}.
        </p>
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
