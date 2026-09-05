import { useState, useEffect } from 'react'
import { getFounders, deleteFounderAccount } from '../../../services/founders'
import { CapoBackLink } from '../../../components/dashboard/CapoBackLink'
import { Tabs } from '../../../components/dashboard/Tabs'
import { waitlistService, type WaitlistEntry } from '../../../services/waitlist'
import { emailSubscribersService, type EmailSubscriber } from '../../../services/emailSubscribers'
import { emailCampaignsService, type EmailCampaign, type CampaignSendStats } from '../../../services/emailCampaigns'
import { ConfirmButton } from '../../../components/ui/ConfirmButton'
import { toCSV, downloadCSV } from '../../../utils/emailExport'

export function VillageEmailExportPage() {
  const [pageTab, setPageTab] = useState('village-members')

  return (
    <div className="p-8 max-w-4xl" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <CapoBackLink />

      <div className="mb-6">
        <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-widest mb-1">CAPO · Village Staff</p>
        <h1 className="text-2xl font-bold text-[#2D2A26]">Email Lists</h1>
        <p className="text-sm text-[#6B7280] mt-0.5">
          Export CSVs for outreach, manage the CULO Creatives waitlist, and send campaigns to your subscriber list.
        </p>
      </div>

      <Tabs
        tabs={[
          { key: 'village-members', label: 'Village Members' },
          { key: 'canva-members',   label: 'Canva Members' },
          { key: 'waitlist',        label: 'Waitlist' },
          { key: 'subscribers',     label: 'Subscribers' },
          { key: 'campaigns',       label: 'Campaigns' },
        ]}
        active={pageTab}
        onChange={setPageTab}
        className="mb-6"
      />

      {pageTab === 'village-members' && <MembersPanel source="village" />}
      {pageTab === 'canva-members' && <MembersPanel source="canva" />}
      {pageTab === 'waitlist' && <WaitlistPanel />}
      {pageTab === 'subscribers' && <SubscribersPanel />}
      {pageTab === 'campaigns' && <CampaignsPanel />}

    </div>
  )
}

// ─── Members panel — /join-flow signups, split by which funnel created them ────
// Two tabs (Village Members / Canva Members) rather than one mixed "Joined"
// list, so CAPO can tell a direct culovillage.com signup apart from a Canva
// Marketplace deep-link at a glance — same distinction already tracked in
// Analytics. Delete removes both the founder profile and the actual login
// (see delete-founder-account) — not just a cache-side hide.

function MembersPanel({ source }: { source: 'village' | 'canva' }) {
  const [tick, setTick] = useState(0)
  void tick
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const founders = getFounders().filter(f => f.signupProduct === source)
  const sorted = [...founders].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const label = source === 'canva' ? 'Canva' : 'Village'

  async function handleDelete(f: (typeof sorted)[number]) {
    setError(null)
    setDeletingId(f.id)
    const result = await deleteFounderAccount(f.id)
    setDeletingId(null)
    if (!result.success) { setError(result.error ?? 'Could not delete this account. Try again.'); return }
    setTick(t => t + 1)
  }

  function handleExport() {
    const rows = sorted.map(f => ({
      email: f.signupEmail ?? '', firstName: '', lastName: '', fullName: f.name,
      profileStatus: f.profileStatus ?? f.status, founderSlug: f.slug,
      profileUrl: `${window.location.origin}/founders/${f.slug}`, claimUrl: '',
      businessName: '', tags: `${source}-join`, createdAt: f.createdAt,
    })).filter(r => r.email)
    if (rows.length === 0) return
    downloadCSV(toCSV(rows), `culo-village-${source}-members-${new Date().toISOString().slice(0, 10)}.csv`)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-[#6B7280]">
          {sorted.length} {label.toLowerCase()} member{sorted.length === 1 ? '' : 's'}.
        </p>
        <button
          onClick={handleExport}
          disabled={sorted.length === 0}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#C86A43] text-white hover:bg-[#b05a35] disabled:opacity-40 transition-colors"
        >
          Export CSV
        </button>
      </div>
      {error && <p className="text-xs text-red-600 mb-3">{error}</p>}
      {sorted.length === 0 ? (
        <p className="text-sm text-[#9CA3AF]">No {label.toLowerCase()} members yet.</p>
      ) : (
        <div className="bg-white rounded-xl border border-[#E8E4DD] divide-y divide-[#F3EDE6]">
          {sorted.map(f => (
            <div key={f.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#2D2A26] truncate">{f.signupEmail ?? f.name}</p>
                <p className="text-[10px] text-[#9CA3AF]">
                  {new Date(f.createdAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                  {f.passwordSet && ' · password set'}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <a
                  href={`/founders/${f.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-[#C86A43] hover:underline"
                >
                  View ↗
                </a>
                <ConfirmButton
                  label="Delete"
                  confirmLabel="Yes, delete"
                  message={`Delete ${f.name}'s login too?`}
                  onConfirm={() => void handleDelete(f)}
                  disabled={deletingId === f.id}
                  className="text-[10px] text-red-500 hover:text-red-600 transition-colors"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Waitlist panel ─────────────────────────────────────────────────────────────

function WaitlistPanel() {
  const [entries, setEntries] = useState<WaitlistEntry[]>(waitlistService.getAll())
  const [loading, setLoading] = useState(true)
  const [importedMsg, setImportedMsg] = useState<string | null>(null)

  useEffect(() => {
    void waitlistService.refresh().then(async () => {
      const fresh = waitlistService.getAll()
      setEntries(fresh)
      setLoading(false)
      // Waitlist signups count toward the Subscribers total automatically —
      // no more manual "Import all" click needed for the count on the
      // Subscribers tab to actually reflect everyone who's opted in.
      await emailSubscribersService.importFromWaitlist(fresh)
    })
  }, [])

  async function handleImportAll() {
    const { added } = await emailSubscribersService.importFromWaitlist(entries)
    setImportedMsg(`Added ${added} new subscriber${added === 1 ? '' : 's'} from the waitlist.`)
  }

  function handleDelete(id: string) {
    void waitlistService.delete(id)
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-[#6B7280]">
          {loading ? 'Loading…' : `${entries.length} signup${entries.length === 1 ? '' : 's'} for CULO Creatives in Canva.`}
        </p>
        <button
          onClick={() => void handleImportAll()}
          disabled={entries.length === 0}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#C86A43] text-white hover:bg-[#b05a35] disabled:opacity-40 transition-colors"
        >
          Import all into Subscribers
        </button>
      </div>
      {importedMsg && <p className="text-xs text-[#5E6B4A] font-medium mb-3">{importedMsg}</p>}
      {entries.length === 0 && !loading ? (
        <p className="text-sm text-[#9CA3AF]">No waitlist signups yet.</p>
      ) : (
        <div className="bg-white rounded-xl border border-[#E8E4DD] divide-y divide-[#F3EDE6]">
          {entries.map(e => (
            <div key={e.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-[#2D2A26]">{e.email}</p>
                <p className="text-xs text-[#9CA3AF]">{e.source} · {new Date(e.createdAt).toLocaleDateString('en-AU')}</p>
              </div>
              <ConfirmButton label="Delete" confirmLabel="Confirm" onConfirm={() => handleDelete(e.id)} className="text-xs text-[#9CA3AF] hover:text-red-500" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Subscribers panel ──────────────────────────────────────────────────────────

function SubscribersPanel() {
  const [subs, setSubs] = useState<EmailSubscriber[]>(emailSubscribersService.getAll())
  const [loading, setLoading] = useState(true)
  const [newEmail, setNewEmail] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    void emailSubscribersService.refresh().then(() => {
      setSubs(emailSubscribersService.getAll())
      setLoading(false)
    })
  }, [])

  async function handleAdd() {
    if (!newEmail.trim()) return
    await emailSubscribersService.add({
      id: crypto.randomUUID(), email: newEmail.trim().toLowerCase(),
      source: 'manual', createdAt: new Date().toISOString(),
    })
    setSubs(emailSubscribersService.getAll())
    setNewEmail('')
  }

  function handleDelete(id: string) {
    void emailSubscribersService.delete(id)
    setSubs(prev => prev.filter(s => s.id !== id))
  }

  const filteredSubs = search.trim()
    ? subs.filter(s => s.email.toLowerCase().includes(search.trim().toLowerCase()))
    : subs

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <input
          type="email"
          value={newEmail}
          onChange={e => setNewEmail(e.target.value)}
          placeholder="Add a subscriber by email"
          className="flex-1 px-3 py-2 rounded-lg border border-[#E8E4DD] text-sm text-[#2D2A26] focus:outline-none focus:border-[#C86A43]"
        />
        <button onClick={() => void handleAdd()} className="text-xs font-semibold px-3 py-2 rounded-lg bg-[#C86A43] text-white hover:bg-[#b05a35] transition-colors">
          Add
        </button>
      </div>
      {subs.length > 0 && (
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search subscribers by email…"
          className="w-full mb-3 px-3 py-2 rounded-lg border border-[#E8E4DD] text-sm text-[#2D2A26] focus:outline-none focus:border-[#C86A43]"
        />
      )}
      <p className="text-sm text-[#6B7280] mb-3">
        {loading
          ? 'Loading…'
          : search.trim()
            ? `${filteredSubs.length} of ${subs.length} subscriber${subs.length === 1 ? '' : 's'} match.`
            : `${subs.length} subscriber${subs.length === 1 ? '' : 's'}.`}
      </p>
      {subs.length === 0 && !loading ? (
        <p className="text-sm text-[#9CA3AF]">No subscribers yet — add one above or import from the Waitlist tab.</p>
      ) : filteredSubs.length === 0 ? (
        <p className="text-sm text-[#9CA3AF]">No subscribers match "{search.trim()}".</p>
      ) : (
        <div className="bg-white rounded-xl border border-[#E8E4DD] divide-y divide-[#F3EDE6]">
          {filteredSubs.map(s => (
            <div key={s.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-[#2D2A26]">{s.email}</p>
                <p className="text-xs text-[#9CA3AF]">{s.source}</p>
              </div>
              <ConfirmButton label="Remove" confirmLabel="Confirm" onConfirm={() => handleDelete(s.id)} className="text-xs text-[#9CA3AF] hover:text-red-500" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Campaigns panel ────────────────────────────────────────────────────────────

function CampaignsPanel() {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>(emailCampaignsService.getAll())
  const [loading, setLoading] = useState(true)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sendError, setSendError] = useState<string | null>(null)
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [stats, setStats] = useState<Record<string, CampaignSendStats>>({})
  const subscriberCount = emailSubscribersService.getAll().length

  useEffect(() => {
    void emailCampaignsService.refresh().then(() => setCampaigns(emailCampaignsService.getAll()))
    void emailSubscribersService.refresh().then(() => setLoading(false))
  }, [])

  useEffect(() => {
    for (const c of campaigns) {
      if (c.status === 'sent' && !stats[c.id]) {
        void emailCampaignsService.getStats(c.id).then(s => setStats(prev => ({ ...prev, [c.id]: s })))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaigns])

  async function handleSaveDraft() {
    if (!subject.trim() || !body.trim()) return
    const bodyHtml = body.split('\n\n').map(p => `<p>${p.replace(/\n/g, '<br/>')}</p>`).join('')
    const campaign: EmailCampaign = {
      id: crypto.randomUUID(), subject: subject.trim(), bodyHtml, status: 'draft',
      createdAt: new Date().toISOString(),
    }
    await emailCampaignsService.saveDraft(campaign)
    setCampaigns(emailCampaignsService.getAll())
    setSubject('')
    setBody('')
  }

  async function handleSend(id: string) {
    setSendingId(id)
    setSendError(null)
    const result = await emailCampaignsService.send(id)
    setSendingId(null)
    if (!result.success) setSendError(result.error ?? 'Could not send this campaign.')
    else setCampaigns(emailCampaignsService.getAll())
  }

  return (
    <div>
      <div className="bg-white rounded-xl border border-[#E8E4DD] p-4 mb-6">
        <p className="text-sm font-bold text-[#2D2A26] mb-3">New campaign</p>
        <input
          type="text"
          value={subject}
          onChange={e => setSubject(e.target.value)}
          placeholder="Subject line"
          className="w-full px-3 py-2 rounded-lg border border-[#E8E4DD] text-sm text-[#2D2A26] mb-2 focus:outline-none focus:border-[#C86A43]"
        />
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          rows={6}
          placeholder="Write your update — separate paragraphs with a blank line."
          className="w-full px-3 py-2 rounded-lg border border-[#E8E4DD] text-sm text-[#2D2A26] resize-y focus:outline-none focus:border-[#C86A43]"
        />
        <div className="flex items-center justify-between mt-3">
          <p className="text-xs text-[#9CA3AF]">{loading ? '…' : `Will send to ${subscriberCount} subscriber${subscriberCount === 1 ? '' : 's'}.`}</p>
          <button
            onClick={() => void handleSaveDraft()}
            disabled={!subject.trim() || !body.trim()}
            className="text-xs font-semibold px-3 py-2 rounded-lg bg-[#C86A43] text-white hover:bg-[#b05a35] disabled:opacity-40 transition-colors"
          >
            Save draft
          </button>
        </div>
      </div>

      {sendError && <p className="text-xs text-red-600 font-medium mb-3">{sendError}</p>}

      {campaigns.length === 0 ? (
        <p className="text-sm text-[#9CA3AF]">No campaigns yet — write one above.</p>
      ) : (
        <div className="bg-white rounded-xl border border-[#E8E4DD] divide-y divide-[#F3EDE6]">
          {campaigns.map(c => (
            <div key={c.id} className="flex items-center justify-between px-4 py-3 gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[#2D2A26] truncate">{c.subject}</p>
                <p className="text-xs text-[#9CA3AF]">
                  {c.status === 'sent'
                    ? `Sent ${c.sentAt ? new Date(c.sentAt).toLocaleDateString('en-AU') : ''} to ${c.recipientCount ?? 0} · ${stats[c.id]?.opened ?? 0} opened · ${stats[c.id]?.clicked ?? 0} clicked`
                    : 'Draft'}
                </p>
              </div>
              {c.status === 'draft' && (
                <button
                  onClick={() => void handleSend(c.id)}
                  disabled={sendingId === c.id || subscriberCount === 0}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#C86A43] text-white hover:bg-[#b05a35] disabled:opacity-40 transition-colors shrink-0"
                >
                  {sendingId === c.id ? 'Sending…' : 'Send now'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
