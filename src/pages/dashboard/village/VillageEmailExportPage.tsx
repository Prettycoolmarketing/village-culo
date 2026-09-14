import { useState, useEffect } from 'react'
import { getFounders, deleteFounderAccount, getFounder } from '../../../services/founders'
import { getStories, getStory } from '../../../services/stories'
import { CapoBackLink } from '../../../components/dashboard/CapoBackLink'
import { Tabs } from '../../../components/dashboard/Tabs'
import { waitlistService } from '../../../services/waitlist'
import { emailSubscribersService, type EmailSubscriber } from '../../../services/emailSubscribers'
import { emailCampaignsService, type EmailCampaign, type CampaignSendStats } from '../../../services/emailCampaigns'
import { emailSequencesService, emailSequenceEnrollmentsService, type EmailSequence, type EmailSequenceStep, type EmailSequenceEnrollment } from '../../../services/emailSequences'
import { ConfirmButton } from '../../../components/ui/ConfirmButton'
import { toCSV, downloadCSV } from '../../../utils/emailExport'
import { bodyTextToHtml, bodyHtmlToText } from '../../../utils/emailBody'

export function VillageEmailExportPage() {
  const [pageTab, setPageTab] = useState('village-members')

  // Waitlist signups still fold into Subscribers automatically — no longer
  // running a public waitlist tab/flow (people get added manually now), but
  // any entries already sitting in the waitlist table (past signups) still
  // need to land in Subscribers rather than being silently orphaned once
  // that tab — and the effect that used to live inside it — is gone.
  useEffect(() => {
    void waitlistService.refresh().then(async () => {
      await emailSubscribersService.importFromWaitlist(waitlistService.getAll())
    })
  }, [])

  return (
    <div className="p-8 max-w-4xl" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <CapoBackLink />

      <div className="mb-6">
        <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-widest mb-1">CAPO · Village Staff</p>
        <h1 className="text-2xl font-bold text-[#2D2A26]">Email Lists</h1>
        <p className="text-sm text-[#6B7280] mt-0.5">
          Export CSVs for outreach and send campaigns to your subscriber list.
        </p>
      </div>

      <Tabs
        tabs={[
          { key: 'village-members', label: 'Village Members' },
          { key: 'canva-members',   label: 'Canva Members' },
          { key: 'subscribers',     label: 'Subscribers' },
          { key: 'campaigns',       label: 'Newsletter' },
          { key: 'sequences',       label: 'Sequences' },
        ]}
        active={pageTab}
        onChange={setPageTab}
        className="mb-6"
      />

      {pageTab === 'village-members' && <MembersPanel source="village" />}
      {pageTab === 'canva-members' && <MembersPanel source="canva" />}
      {pageTab === 'subscribers' && <SubscribersPanel />}
      {pageTab === 'campaigns' && <CampaignsPanel />}
      {pageTab === 'sequences' && <SequencesPanel />}

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

// A founder card matching the site's own story card look — thumbnail,
// title, one-line summary, clickable straight through to the real story —
// plus a "Publish in the Village" CTA underneath. Dropped into the body
// wherever the founder types the {{article}} token (see handleSaveDraft),
// rather than always sitting in a fixed spot, since the weekly digest
// wants copy both before and after it.
function buildArticleCardHtml(story: { slug: string; title: string; summary?: string; coverImage: string }, founderName?: string): string {
  const url = `https://www.culovillage.com/stories/${story.slug}`
  return `
    <a href="${url}" style="display:block;text-decoration:none;border:1px solid #E8E4DD;border-radius:12px;overflow:hidden;margin:4px 0 20px;">
      <img src="${story.coverImage}" width="480" style="width:100%;height:auto;display:block;" alt="${story.title}" />
      <div style="padding:16px 20px;background:#FFFFFF;">
        ${founderName ? `<p style="margin:0 0 4px;font-size:11px;font-weight:bold;letter-spacing:0.5px;text-transform:uppercase;color:#C86A43;">${founderName}</p>` : ''}
        <p style="margin:0 0 4px;font-weight:bold;font-size:16px;color:#2D2A26;">${story.title}</p>
        ${story.summary ? `<p style="margin:0;font-size:13px;color:#6B7280;">${story.summary}</p>` : ''}
      </div>
    </a>
    <div style="text-align:center;margin:0 0 20px;">
      <a href="https://www.culovillage.com/join" style="display:inline-block;padding:12px 22px;background:#C86A43;color:#FFFFFF;text-decoration:none;border-radius:10px;font-weight:bold;font-family:Arial,sans-serif;font-size:14px;">Publish in the Village to be discovered</a>
    </div>`
}

function CampaignsPanel() {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>(emailCampaignsService.getAll())
  const [loading, setLoading] = useState(true)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sendError, setSendError] = useState<string | null>(null)
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [stats, setStats] = useState<Record<string, CampaignSendStats>>({})
  // Click a sent newsletter to expand it and see exactly what went out.
  const [expandedId, setExpandedId] = useState<string | null>(null)
  // Weekly digest: pick a published story, drop {{article}} where it
  // should appear in the plain-text body, and it's swapped for a real
  // article card + "Publish in the Village" button on save.
  const [featuredStoryId, setFeaturedStoryId] = useState('')
  const publishedStories = getStories({ publicOnly: true })

  const [recipientCount, setRecipientCount] = useState<number | null>(null)

  useEffect(() => {
    void emailCampaignsService.refresh().then(() => setCampaigns(emailCampaignsService.getAll()))
    void Promise.all([emailSubscribersService.refresh(), waitlistService.refresh()]).then(() => {
      setLoading(false)
      // Rough estimate for the send confirmation below — same three
      // sources send-campaign itself sends to, deduplicated the same way.
      // Doesn't subtract unsubscribes (not loaded client-side), so the
      // real send may be a little lower than this — close enough for a
      // "you're about to email this many people" gut check.
      const emails = new Set<string>()
      for (const s of emailSubscribersService.getAll()) emails.add(s.email.trim().toLowerCase())
      for (const w of waitlistService.getAll()) emails.add(w.email.trim().toLowerCase())
      for (const f of getFounders()) if (f.signupEmail) emails.add(f.signupEmail.trim().toLowerCase())
      setRecipientCount(emails.size)
    })
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
    let bodyHtml = bodyTextToHtml(body)
    if (featuredStoryId) {
      const story = getStory(featuredStoryId)
      if (story) {
        const founderName = getFounder(story.founderId)?.name
        bodyHtml = bodyHtml.replace('<p>{{article}}</p>', buildArticleCardHtml(story, founderName))
      }
    }
    const campaign: EmailCampaign = {
      id: crypto.randomUUID(), subject: subject.trim(), bodyHtml, status: 'draft',
      createdAt: new Date().toISOString(),
    }
    await emailCampaignsService.saveDraft(campaign)
    setCampaigns(emailCampaignsService.getAll())
    setSubject('')
    setBody('')
    setFeaturedStoryId('')
  }

  async function handleSend(id: string) {
    setSendingId(id)
    setSendError(null)
    const result = await emailCampaignsService.send(id)
    setSendingId(null)
    if (!result.success) setSendError(result.error ?? 'Could not send this newsletter.')
    else setCampaigns(emailCampaignsService.getAll())
  }

  return (
    <div>
      <div className="bg-white rounded-xl border border-[#E8E4DD] p-4 mb-6">
        <p className="text-sm font-bold text-[#2D2A26] mb-3">New newsletter</p>
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
          rows={8}
          placeholder="Write it exactly like a normal email — separate paragraphs with a blank line. It's automatically turned into a properly formatted, branded email when you send it."
          className="w-full px-3 py-2 rounded-lg border border-[#E8E4DD] text-sm text-[#2D2A26] resize-y focus:outline-none focus:border-[#C86A43]"
        />

        <div className="mt-3 p-3 rounded-lg bg-[#F8F5F0] border border-[#E8E4DD]">
          <label className="block text-xs font-semibold text-[#2D2A26] mb-1.5">Feature an article (optional)</label>
          <select
            value={featuredStoryId}
            onChange={e => setFeaturedStoryId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[#E8E4DD] text-sm text-[#2D2A26] bg-white focus:outline-none focus:border-[#C86A43]"
          >
            <option value="">None</option>
            {publishedStories.map(s => (
              <option key={s.id} value={s.id}>{s.title}</option>
            ))}
          </select>
          {featuredStoryId && (
            <>
              <a
                href={`https://www.culovillage.com/stories/${getStory(featuredStoryId)?.slug ?? ''}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-[#C86A43] hover:underline"
              >
                Review the article →
              </a>
              <p className="text-[11px] text-[#9CA3AF] mt-2 leading-relaxed">
                Type <code className="px-1 py-0.5 bg-white rounded border border-[#E8E4DD]">{'{{article}}'}</code> on its own line in the text above, wherever you want the article card and "Publish in the Village" button to appear.
              </p>
            </>
          )}
        </div>

        <div className="flex items-center justify-between mt-3">
          <p className="text-xs text-[#9CA3AF]">{loading ? '…' : 'Sends to your whole list — subscribers, the waitlist, and all Village + Canva members. Deduplicated, and anyone who\'s unsubscribed is automatically excluded.'}</p>
          <button
            onClick={() => void handleSaveDraft()}
            disabled={!subject.trim() || !body.trim()}
            className="text-xs font-semibold px-3 py-2 rounded-lg bg-[#C86A43] text-white hover:bg-[#b05a35] disabled:opacity-40 transition-colors shrink-0"
          >
            Save draft
          </button>
        </div>
      </div>

      {sendError && <p className="text-xs text-red-600 font-medium mb-3">{sendError}</p>}

      {campaigns.length === 0 ? (
        <p className="text-sm text-[#9CA3AF]">No newsletters sent yet — write one above.</p>
      ) : (
        <div className="bg-white rounded-xl border border-[#E8E4DD] divide-y divide-[#F3EDE6]">
          {campaigns.map(c => {
            const isExpanded = expandedId === c.id
            return (
              <div key={c.id}>
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : c.id)}
                  className="w-full flex items-center justify-between px-4 py-3 gap-3 text-left hover:bg-[#F8F5F0] transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[#2D2A26] truncate">{c.subject}</p>
                    <p className="text-xs text-[#9CA3AF]">
                      {c.status === 'sent'
                        ? `Sent ${c.sentAt ? new Date(c.sentAt).toLocaleDateString('en-AU') : ''} · ${c.recipientCount ?? 0} received · ${stats[c.id]?.opened ?? 0} opened · ${stats[c.id]?.clicked ?? 0} clicked`
                        : 'Draft'}
                    </p>
                  </div>
                  {c.status === 'draft' ? (
                    <span onClick={e => e.stopPropagation()} className="shrink-0">
                      <ConfirmButton
                        label={sendingId === c.id ? 'Sending…' : 'Send now'}
                        confirmLabel="Yes, send"
                        message={`Send to ${recipientCount ?? 'your entire list of'} people now?`}
                        disabled={sendingId === c.id}
                        onConfirm={() => void handleSend(c.id)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#C86A43] text-white hover:bg-[#b05a35] disabled:opacity-50 transition-colors"
                      />
                    </span>
                  ) : (
                    <svg className={`w-4 h-4 text-[#9CA3AF] shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </button>
                {isExpanded && (
                  <div className="px-4 pb-4">
                    <div className="bg-[#F8F5F0] rounded-lg border border-[#E8E4DD] p-4 text-sm text-[#2D2A26] leading-relaxed" dangerouslySetInnerHTML={{ __html: c.bodyHtml }} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Sequences panel — drip email sequences (A/B/C), sent by day since
// enrollment via the daily send-sequence-emails cron job ──────────────────

function SequencesPanel() {
  const [sequences, setSequences] = useState<EmailSequence[]>(emailSequencesService.getAll())
  const [enrollments, setEnrollments] = useState<EmailSequenceEnrollment[]>(emailSequenceEnrollmentsService.getAll())
  const [loading, setLoading] = useState(true)
  const [activeSequenceId, setActiveSequenceId] = useState<string | null>(null)
  const [editingStep, setEditingStep] = useState<EmailSequenceStep | null>(null)
  // Plain-text draft of editingStep's body — write normally, converted to
  // HTML on save (see saveStep), instead of hand-editing raw <p> tags.
  const [bodyDraft, setBodyDraft] = useState('')

  useEffect(() => {
    void Promise.all([emailSequencesService.refresh(), emailSequenceEnrollmentsService.refresh()]).then(() => {
      setSequences(emailSequencesService.getAll())
      setEnrollments(emailSequenceEnrollmentsService.getAll())
      setLoading(false)
      setActiveSequenceId(prev => prev ?? emailSequencesService.getAll()[0]?.id ?? null)
    })
  }, [])

  const active = sequences.find(s => s.id === activeSequenceId)
  const activeEnrollments = enrollments.filter(e => e.sequenceId === activeSequenceId)

  function newSequence() {
    const id = window.prompt('Sequence letter/id (e.g. A, B):')?.trim().toUpperCase()
    if (!id) return
    const name = window.prompt('Sequence name:')?.trim() || id
    void emailSequencesService.save({ id, name, steps: [] }).then(() => {
      setSequences(emailSequencesService.getAll())
      setActiveSequenceId(id)
    })
  }

  function saveStep() {
    if (!active || !editingStep) return
    const finalStep = { ...editingStep, bodyHtml: bodyTextToHtml(bodyDraft) }
    const steps = active.steps.some(s => s.day === finalStep.day)
      ? active.steps.map(s => s.day === finalStep.day ? finalStep : s)
      : [...active.steps, finalStep]
    void emailSequencesService.save({ ...active, steps: steps.sort((a, b) => a.day - b.day) }).then(() => {
      setSequences(emailSequencesService.getAll())
      setEditingStep(null)
    })
  }

  function deleteStep(day: number) {
    if (!active) return
    void emailSequencesService.save({ ...active, steps: active.steps.filter(s => s.day !== day) }).then(() => {
      setSequences(emailSequencesService.getAll())
    })
  }

  function stopEnrollment(enrollment: EmailSequenceEnrollment) {
    void emailSequenceEnrollmentsService.stop(enrollment).then(() => {
      setEnrollments(emailSequenceEnrollmentsService.getAll())
    })
  }

  if (loading) return <p className="text-sm text-[#9CA3AF]">Loading…</p>

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {sequences.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSequenceId(s.id)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
              activeSequenceId === s.id ? 'bg-[#C86A43] text-white' : 'bg-[#F3EDE6] text-[#6B7280] hover:bg-[#E8E4DD]'
            }`}
          >
            Sequence {s.id}
          </button>
        ))}
        <button onClick={newSequence} className="text-xs font-semibold px-3 py-1.5 rounded-lg text-[#C86A43] hover:bg-[#FBF1EB] transition-colors">
          + New sequence
        </button>
      </div>

      {!active ? (
        <p className="text-sm text-[#9CA3AF]">No sequences yet — create one above.</p>
      ) : (
        <>
          <p className="text-sm font-semibold text-[#2D2A26] mb-1">{active.name}</p>
          <p className="text-xs text-[#9CA3AF] mb-4">
            {activeEnrollments.filter(e => e.status === 'active').length} active ·{' '}
            {activeEnrollments.filter(e => e.status === 'completed').length} completed ·{' '}
            {activeEnrollments.filter(e => e.status === 'stopped').length} stopped
          </p>

          <div className="bg-white rounded-xl border border-[#E8E4DD] divide-y divide-[#F3EDE6] mb-4">
            {active.steps.length === 0 && (
              <p className="text-sm text-[#9CA3AF] px-4 py-4">No steps yet — add Day 0 to start.</p>
            )}
            {active.steps.map(step => (
              <div key={step.day} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#2D2A26]">Day {step.day} — {step.subject}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button onClick={() => { setEditingStep(step); setBodyDraft(bodyHtmlToText(step.bodyHtml)) }} className="text-xs font-semibold text-[#C86A43] hover:underline">Edit</button>
                  <ConfirmButton label="Delete" confirmLabel="Confirm" onConfirm={() => deleteStep(step.day)} className="text-xs text-[#9CA3AF] hover:text-red-500" />
                </div>
              </div>
            ))}
          </div>

          {editingStep ? (
            <div className="bg-white rounded-xl border border-[#E8E4DD] p-4 mb-6">
              <p className="text-sm font-bold text-[#2D2A26] mb-3">Edit step</p>
              <div className="flex items-center gap-2 mb-2">
                <label className="text-xs text-[#6B7280]">Day</label>
                <input
                  type="number"
                  value={editingStep.day}
                  onChange={e => setEditingStep({ ...editingStep, day: Number(e.target.value) })}
                  className="w-20 px-3 py-2 rounded-lg border border-[#E8E4DD] text-sm text-[#2D2A26] focus:outline-none focus:border-[#C86A43]"
                />
              </div>
              <input
                type="text"
                value={editingStep.subject}
                onChange={e => setEditingStep({ ...editingStep, subject: e.target.value })}
                placeholder="Subject line"
                className="w-full px-3 py-2 rounded-lg border border-[#E8E4DD] text-sm text-[#2D2A26] mb-2 focus:outline-none focus:border-[#C86A43]"
              />
              <textarea
                value={bodyDraft}
                onChange={e => setBodyDraft(e.target.value)}
                rows={8}
                placeholder="Write it exactly like a normal email — separate paragraphs with a blank line. It's automatically turned into a properly formatted email when you save."
                className="w-full px-3 py-2 rounded-lg border border-[#E8E4DD] text-sm text-[#2D2A26] resize-y focus:outline-none focus:border-[#C86A43]"
              />
              <div className="flex items-center gap-2 mt-3">
                <button onClick={saveStep} className="text-xs font-semibold px-3 py-2 rounded-lg bg-[#C86A43] text-white hover:bg-[#b05a35] transition-colors">Save step</button>
                <button onClick={() => setEditingStep(null)} className="text-xs font-semibold px-3 py-2 rounded-lg text-[#6B7280] bg-[#F3EDE6] hover:bg-[#E8E4DD] transition-colors">Cancel</button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => { setEditingStep({ day: (active.steps[active.steps.length - 1]?.day ?? -1) + 1, subject: '', bodyHtml: '' }); setBodyDraft('') }}
              className="text-xs font-semibold px-3 py-2 rounded-lg bg-[#FBF1EB] text-[#C86A43] hover:bg-[#C86A43]/10 transition-colors mb-6"
            >
              + Add step
            </button>
          )}

          <p className="text-sm font-semibold text-[#2D2A26] mb-2">Enrollments</p>
          {activeEnrollments.length === 0 ? (
            <p className="text-sm text-[#9CA3AF]">Nobody enrolled in this sequence yet.</p>
          ) : (
            <div className="bg-white rounded-xl border border-[#E8E4DD] divide-y divide-[#F3EDE6]">
              {activeEnrollments.map(e => (
                <div key={e.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-[#2D2A26]">{e.email}</p>
                    <p className="text-[10px] text-[#9CA3AF]">
                      Started {new Date(e.startedAt).toLocaleDateString('en-AU')} · {e.sentDays.length} sent · {e.status}
                    </p>
                  </div>
                  {e.status === 'active' && (
                    <ConfirmButton label="Stop" confirmLabel="Confirm" onConfirm={() => stopEnrollment(e)} className="text-xs text-[#9CA3AF] hover:text-red-500" />
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
