import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { getFounders, getFounder, deleteFounderAccount } from '../../../services/founders'
import { getStories, getStory } from '../../../services/stories'
import { importedContentService } from '../../../services/importedContent'
import { CapoBackLink } from '../../../components/dashboard/CapoBackLink'
import { Tabs } from '../../../components/dashboard/Tabs'
import { waitlistService } from '../../../services/waitlist'
import { emailSubscribersService, type EmailSubscriber } from '../../../services/emailSubscribers'
import { emailCampaignsService, type EmailCampaign, type CampaignSendStats } from '../../../services/emailCampaigns'
import { emailSequencesService, emailSequenceEnrollmentsService, type EmailSequence, type EmailSequenceStep, type EmailSequenceEnrollment } from '../../../services/emailSequences'
import { emailNudgeTemplatesService, type EmailNudgeTemplate } from '../../../services/emailNudgeTemplates'
import { ConfirmButton } from '../../../components/ui/ConfirmButton'
import { toCSV, downloadCSV, splitName } from '../../../utils/emailExport'
import { bodyTextToHtml, bodyHtmlToText } from '../../../utils/emailBody'
import { syncUserDataFromSupabase } from '../../../lib/sync'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../contexts/AuthContext'
import { canDeleteCapoData } from '../../../utils/permissions'

export function VillageEmailExportPage() {
  const [pageTab, setPageTab] = useState('members')
  // getFounders() reads purely from the local cache, which is only ever
  // populated at login/app-mount — on a phone, especially a CAPO staff
  // session caching the WHOLE platform's rows, that write can silently
  // fail or just be from a stale previous session (confirmed real:
  // "the data on my mobile for culo members isn't correct"). This page is
  // staff-only by definition, so a fresh pull on every visit is safe and
  // makes the numbers here actually match the live database instead of
  // whatever happened to already be sitting in local storage.
  const [syncTick, setSyncTick] = useState(0)
  void syncTick
  useEffect(() => { void syncUserDataFromSupabase(true).then(() => setSyncTick(t => t + 1)) }, [])

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
        <h1 className="text-2xl font-bold text-[#2D2A26]">Culo Members</h1>
        <p className="text-sm text-[#6B7280] mt-0.5">
          Total Village Members: {getFounders().filter(isRealMember).length}
        </p>
      </div>

      <Tabs
        tabs={[
          { key: 'members',     label: 'Members' },
          { key: 'curated',     label: 'Curated' },
          { key: 'subscribers', label: 'Subscribers' },
          { key: 'campaigns',   label: 'Newsletter' },
          { key: 'sequences',   label: 'Sequences' },
          { key: 'nudges',      label: 'Nudges' },
        ]}
        active={pageTab}
        onChange={setPageTab}
        className="mb-6"
      />

      {pageTab === 'members' && <MembersPanel />}
      {pageTab === 'curated' && <MembersPanel curatedOnly />}
      {pageTab === 'subscribers' && <SubscribersPanel />}
      {pageTab === 'campaigns' && <CampaignsPanel />}
      {pageTab === 'sequences' && <SequencesPanel />}
      {pageTab === 'nudges' && <NudgesPanel />}

    </div>
  )
}

// A village-curated/claim-pending founder isn't a member — nobody signed up,
// staff (or an import) created the profile on their behalf. "Members" means
// someone actually went through /join and has a real login.
function isRealMember(f: ReturnType<typeof getFounders>[number]) {
  return f.profileStatus !== 'village-curated' && f.profileStatus !== 'claim-pending'
}

// ─── Members panel — every /join-flow signup, one list ─────────────────────
// Used to be two separate tabs (Village Members / Canva Members) as if a
// Canva-sourced signup were a different kind of member — it isn't, every
// signup is a Village member from the moment they join, Canva or not.
// signupProduct is now just a small tag per row for future campaign
// targeting, not a second bucket. Delete removes both the founder profile
// and the actual login (see delete-founder-account) — not just a
// cache-side hide.

interface PendingSignup { id: string; email: string; createdAt: string; emailConfirmed: boolean }

function MembersPanel({ curatedOnly = false }: { curatedOnly?: boolean }) {
  const { user } = useAuth()
  // Deleting a founder's account from here (not just removing them from a
  // mailing list) is admin/owner only, same bar as every other real
  // account deletion in CAPO — Capo staff can reach this page but must
  // never be able to delete a real login. Culo Members previously had no
  // delete control here at all despite a stale comment claiming one
  // existed — confirmed real gap, staff could only delete an account from
  // Founder Management instead.
  const canDeleteAccounts = user?.role === 'admin' || user?.role === 'owner'
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [refreshTick, setRefreshTick] = useState(0)
  void refreshTick
  async function handleDeleteAccount(founderId: string) {
    setDeletingId(founderId)
    const result = await deleteFounderAccount(founderId)
    setDeletingId(null)
    if (!result.success) { alert(result.error ?? 'Could not delete this account. Please try again.'); return }
    setRefreshTick(t => t + 1)
  }

  // Only real /join signups ever land here before a founder record exists —
  // a curated profile is created by staff, never by someone signing up, so
  // this has nothing to show on the Curated tab.
  const [pending, setPending] = useState<PendingSignup[]>([])
  // Keyed by founder id — a founder record existing (the normal case, or a
  // staff-backfilled one) says nothing about whether its owner ever
  // actually confirmed their email; this is the only place that does.
  const [unconfirmedFounders, setUnconfirmedFounders] = useState<Set<string>>(new Set())
  const [resendingId, setResendingId] = useState<string | null>(null)
  // Emails nudged in the last 3 days — the resend button hides for that
  // window so staff don't double-send right after each other from
  // different sessions/devices. Lowercased, matching what the resend call
  // and confirm_nudge_sends itself both store.
  const [recentlySent, setRecentlySent] = useState<Set<string>>(new Set())
  useEffect(() => {
    if (curatedOnly || !supabase) return
    void supabase.rpc('get_pending_signups').then(({ data }) => {
      if (data) setPending((data as { id: string; email: string; created_at: string; email_confirmed: boolean }[])
        .map(r => ({ id: r.id, email: r.email, createdAt: r.created_at, emailConfirmed: r.email_confirmed })))
    })
    void supabase.rpc('get_founder_confirmation_status').then(({ data }) => {
      if (data) setUnconfirmedFounders(new Set(
        (data as { founder_id: string; email_confirmed: boolean }[])
          .filter(r => !r.email_confirmed)
          .map(r => r.founder_id),
      ))
    })
    const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString()
    void supabase.from('confirm_nudge_sends').select('email').gte('sent_at', threeDaysAgo).then(({ data }) => {
      if (data) setRecentlySent(new Set((data as { email: string }[]).map(r => r.email.toLowerCase())))
    })
  }, [curatedOnly])

  async function handleResend(email: string, id: string) {
    setResendingId(id)
    const { data, error } = await supabase!.functions.invoke('send-transactional-email', {
      body: { type: 'confirm-and-import-nudge', to: email },
    })
    setResendingId(null)
    if (error || !data?.ok) { alert('Could not send that email. Please try again.'); return }
    setRecentlySent(prev => new Set(prev).add(email.toLowerCase()))
  }

  const sorted = [...getFounders()]
    // Curated means "we curated this profile at some point" (f.curatedBy),
    // not "still unclaimed" — a founder who claims a curated profile still
    // shows here so staff can track the ones that started as outreach, in
    // addition to showing in the main Culo Members list below. curatedBy
    // is set once at curation time and never cleared by founderClaim.
    .filter(f => (curatedOnly ? !!f.curatedBy : isRealMember(f)))
    // Curated founders include ones still mid-research/draft, never
    // actually live on the public site — this list is meant for outreach
    // to real, visible profiles, not a staff worklist of everything in
    // progress. Only applies to the Curated tab; real /join members are
    // always live the moment they sign up, so this filter would be a
    // no-op there anyway.
    .filter(f => !curatedOnly || f.status === 'published' || f.status === 'featured')
    // Same "newest published first" as Founder Management's Published tab
    // (see VillageCuratedFoundersPage) — per direct request, these two
    // lists should always show curated/published founders in the same
    // order. Falls back to createdAt for anyone published before
    // publishedAt existed, same as the other list.
    .sort((a, b) => (curatedOnly ? (b.publishedAt ?? b.createdAt).localeCompare(a.publishedAt ?? a.createdAt) : b.createdAt.localeCompare(a.createdAt)))

  function handleExport() {
    const rows = sorted.map(f => ({
      email: f.signupEmail ?? '', firstName: '', lastName: '', fullName: f.name,
      profileStatus: f.profileStatus ?? f.status, founderSlug: f.slug,
      profileUrl: `${window.location.origin}/founders/${f.slug}`, claimUrl: '',
      businessName: '', tags: `${f.signupProduct ?? 'village'}-join`, createdAt: f.createdAt,
    })).filter(r => r.email)
    if (rows.length === 0) return
    downloadCSV(toCSV(rows), `culo-village-members-${new Date().toISOString().slice(0, 10)}.csv`)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-[#6B7280]">
          {sorted.length} member{sorted.length === 1 ? '' : 's'}
          {pending.length > 0 ? `, ${pending.length} pending` : ''}.
        </p>
        <button
          onClick={handleExport}
          disabled={sorted.length === 0}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#C86A43] text-white hover:bg-[#b05a35] disabled:opacity-40 transition-colors"
        >
          Export CSV
        </button>
      </div>
      {/* What each tag actually means — added directly because the tags
          alone aren't self-explanatory (confirmed live: "I can't remember
          what the tags are"). Same colours/order as memberStatus below, so
          this stays a legend rather than its own source of truth to keep
          in sync. */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-4 px-4 py-3 bg-[#F8F5F0] rounded-lg">
        {[
          { label: 'Needs setup', cls: 'bg-amber-50 text-amber-700', hint: 'signed up, hasn\'t submitted their one-link setup yet' },
          { label: 'Researching', cls: 'bg-amber-50 text-amber-700', hint: 'link submitted, Culo is writing their bio/article now' },
          { label: 'Ready to confirm', cls: 'bg-blue-50 text-blue-700', hint: 'bio/article written, waiting on them to come back and confirm' },
          { label: 'Research — no match', cls: 'bg-red-50 text-red-700', hint: 'research ran but couldn\'t verify a real link/person — needs a better link from them' },
          { label: 'Published', cls: 'bg-[#5E6B4A]/10 text-[#5E6B4A]', hint: 'profile is live on the public site' },
          { label: 'Draft', cls: 'bg-[#F3EDE6] text-[#9CA3AF]', hint: 'profile exists but isn\'t published yet' },
          { label: 'Unclaimed', cls: 'bg-red-50 text-red-700', hint: 'no login behind this profile (a curated founder who hasn\'t claimed it)' },
          { label: 'Upgraded', cls: 'bg-[#FBF1EB] text-[#C86A43]', hint: 'has purchased an Archive Unlock' },
          { label: 'Creatives', cls: 'bg-[#EBF2F8] text-[#3E6E92]', hint: 'has a real, paid Culo Creatives subscription' },
          { label: 'Creatives waitlist', cls: 'bg-[#EBF2F8] text-[#3E6E92]', hint: 'said yes to the Culo Creatives waitlist prompt on Import' },
          { label: 'Unconfirmed', cls: 'bg-red-50 text-red-700', hint: 'signed up but hasn\'t clicked the email confirm link yet — no profile exists for them until they do' },
        ].map(item => (
          <span key={item.label} className="inline-flex items-center gap-1.5 text-xs text-[#6B7280]">
            <span className={`text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full ${item.cls}`}>
              {item.label}
            </span>
            = {item.hint}
          </span>
        ))}
      </div>
      {pending.length > 0 && (
        <div className="bg-white rounded-xl border border-[#E8E4DD] divide-y divide-[#F3EDE6] mb-4">
          {pending.map(p => (
            <div key={p.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <p className="text-sm font-semibold text-[#2D2A26] truncate">{p.email}</p>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className={`text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full ${
                  p.emailConfirmed ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                }`}>
                  {p.emailConfirmed ? 'Confirming…' : 'Unconfirmed'}
                </span>
                {recentlySent.has(p.email.toLowerCase()) ? (
                  <span className="text-[10px] text-[#9CA3AF] ml-2">Sent — resend in a few days</span>
                ) : (
                  <button
                    onClick={() => void handleResend(p.email, p.id)}
                    disabled={resendingId === p.id}
                    className="text-[10px] font-semibold text-[#C86A43] hover:underline ml-2 disabled:opacity-40"
                  >
                    {resendingId === p.id ? 'Sending…' : 'Resend confirm email'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {sorted.length === 0 ? (
        <p className="text-sm text-[#9CA3AF]">No members yet.</p>
      ) : (
        <div className="bg-white rounded-xl border border-[#E8E4DD] divide-y divide-[#F3EDE6]">
          {sorted.map(f => {
            // Canva tag is intentionally NOT based on signupProduct alone —
            // see canvaMarketplaceVerified's own comment. Until staff wire
            // up the real Marketplace funnel and set it, everyone (Canva
            // /joincanva signups included) shows as a plain Village member.
            const isCreatives = !!f.creativeSubscription?.stripeSubscriptionId
            const isUpgraded  = !!f.archiveUnlocked
            const isCanva     = !!f.canvaMarketplaceVerified
            // Where this member actually is right now — a fresh signup
            // (like joshuavlara@gmail.com) shows as "Needs setup" rather
            // than just appearing in the list with no indication of
            // whether they ever finished joining. 'ready' and 'confirmed'
            // used to fall through to the generic status-based tags below,
            // which collapsed two real, different states (bio/article
            // written and waiting on them vs. actually done) into the same
            // "Draft" a plain curated founder also shows as — confirmed
            // live as a real gap when auditing a 3-of-5 self-serve
            // follow-through drop-off.
            // Distinct from "Ready to confirm" — that label means a bio and
            // article actually got written and are waiting on the founder
            // to review them. Research genuinely running and coming back
            // with nothing real to go on (confirmed real: Brad Marsh,
            // Joshua Lara — no verifiable link found) is a different state
            // entirely: there's nothing to confirm, they need to supply a
            // real link/handle before anything can be written.
            const researchFoundNoMatch = f.onboardingStatus === 'ready' && f.researchFoundNothing && !f.bio?.trim()
            const memberStatus =
              researchFoundNoMatch ? { label: 'Research — no match', cls: 'bg-red-50 text-red-700' } :
              f.onboardingStatus === 'needs_setup' ? { label: 'Needs setup', cls: 'bg-amber-50 text-amber-700' } :
              f.onboardingStatus === 'researching' ? { label: 'Researching', cls: 'bg-amber-50 text-amber-700' } :
              f.onboardingStatus === 'ready' ? { label: 'Ready to confirm', cls: 'bg-blue-50 text-blue-700' } :
              f.status === 'published' || f.status === 'featured' ? { label: 'Published', cls: 'bg-[#5E6B4A]/10 text-[#5E6B4A]' } :
              { label: 'Draft', cls: 'bg-[#F3EDE6] text-[#9CA3AF]' }
            // Separate from publish status — whether anyone's actually
            // behind this profile with login access, vs. a curated profile
            // nobody has claimed yet. Shown as its own small tag rather
            // than folded into memberStatus since the two are genuinely
            // different axes (a founder can be claimed AND still draft, or
            // unclaimed AND already published).
            // userId alone missed curated-then-claimed founders entirely —
            // claiming a curated profile only ever sets claimedByUserId, not
            // userId (see VillageCuratedFoundersPage's own real
            // userId || claimedByUserId check) — confirmed real: a founder
            // Founder Management correctly shows as Claimed/Verified read as
            // Unclaimed here. profileStatus is the most authoritative signal
            // (what Founder Management itself displays), so it leads.
            const isClaimed = f.profileStatus === 'claimed' || f.profileStatus === 'verified' || !!f.userId || !!f.claimedByUserId
            // Said yes to the "join the Culo Creatives waitlist?" prompt on
            // Import — shown right next to the name rather than grouped
            // with the status tags on the right, since it's about intent
            // (do they want Creatives) not where they are in the funnel.
            const onCreativesWaitlist = f.creativesWaitlistAnswer === 'yes'
            // Culo Members previously had zero indication of import
            // activity — confirmed real gap (a founder who'd imported 49
            // real items showed nothing different here from one who'd
            // imported nothing). staffCreated excluded — that's research's
            // own article, not something the founder brought in themselves.
            const importedCount = importedContentService.getAll({ founderId: f.id }).filter(i => !i.staffCreated).length
            const publishedCount = getStories({ founderId: f.id }).filter(s => s.status === 'published' || s.status === 'featured').length
            return (
              <div key={f.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="flex items-center gap-2 min-w-0">
                  <p className="text-sm font-semibold text-[#2D2A26] truncate">{f.signupEmail ?? f.name}</p>
                  {onCreativesWaitlist && (
                    <span className="shrink-0 text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-[#EBF2F8] text-[#3E6E92]">
                      Creatives waitlist
                    </span>
                  )}
                  {publishedCount > 0 && (
                    <span className="shrink-0 text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-[#5E6B4A]/10 text-[#5E6B4A]">
                      Published {publishedCount}
                    </span>
                  )}
                  {importedCount > 0 && (
                    <span className="shrink-0 text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-[#FBF1EB] text-[#C86A43]">
                      Imported {importedCount}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full ${memberStatus.cls}`}>
                    {memberStatus.label}
                  </span>
                  {/* A founder record existing says nothing about whether
                      its owner ever actually confirmed their email — mainly
                      hits accounts staff backfilled a founder record for by
                      hand, see get_founder_confirmation_status. */}
                  {unconfirmedFounders.has(f.id) && (
                    <>
                      <span className="text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-red-50 text-red-700">
                        Unconfirmed
                      </span>
                      {f.signupEmail && (
                        recentlySent.has(f.signupEmail.toLowerCase()) ? (
                          <span className="text-[10px] text-[#9CA3AF]">Sent — resend in a few days</span>
                        ) : (
                          <button
                            onClick={() => void handleResend(f.signupEmail!, f.id)}
                            disabled={resendingId === f.id}
                            className="text-[10px] font-semibold text-[#C86A43] hover:underline disabled:opacity-40"
                          >
                            {resendingId === f.id ? 'Sending…' : 'Resend confirm email'}
                          </button>
                        )
                      )}
                    </>
                  )}
                  {/* Only the exception is worth a tag here — claimed is
                      the normal case for almost every row, same reasoning
                      as Upgraded/Creatives/Canva below only showing when
                      true. */}
                  {!isClaimed && (
                    <span className="text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-red-50 text-red-700">
                      Unclaimed
                    </span>
                  )}
                  {isUpgraded && (
                    <span className="text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-[#FBF1EB] text-[#C86A43]">
                      Upgraded
                    </span>
                  )}
                  {isCreatives && (
                    <span className="text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-[#EBF2F8] text-[#3E6E92]">
                      Creatives
                    </span>
                  )}
                  {isCanva && (
                    <span className="text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-[#F3EDE6] text-[#6B7280]">
                      Canva
                    </span>
                  )}
                  {/* Opens this founder's own Content tab for CAPO staff to
                      edit/rewrite/publish directly — exactly what "click a
                      button next to her name" was asking for (confirmed
                      real need: Lydia said yes to having her thin published
                      posts rewritten, and there was previously no way to
                      get into her content without logging in as her). See
                      DashboardProfilePage's manageFounderId handling. */}
                  <Link
                    to={`/dashboard/profile?tab=content&manageFounderId=${f.id}`}
                    className="text-[10px] font-semibold text-[#2D2A26] hover:underline ml-2"
                  >
                    Manage content →
                  </Link>
                  <a
                    href={`/founders/${f.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-semibold text-[#C86A43] hover:underline ml-2"
                  >
                    View ↗
                  </a>
                  {canDeleteAccounts && (
                    <ConfirmButton
                      label={deletingId === f.id ? 'Deleting…' : 'Delete'}
                      confirmLabel="Yes, delete"
                      message="Permanently deletes this member's login and founder profile. This can't be undone."
                      disabled={deletingId === f.id}
                      onConfirm={() => void handleDeleteAccount(f.id)}
                      className="text-[10px] font-semibold text-red-500 hover:text-red-600 transition-colors ml-2"
                    />
                  )}
                </div>
              </div>
            )
          })}
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
  const { user } = useAuth()
  const canDelete = canDeleteCapoData(user?.role)

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

  async function handleDelete(id: string) {
    // Deleting from email_subscribers alone doesn't actually guarantee
    // "never email this person again" — send-campaign builds its
    // recipient list from THREE sources (email_subscribers, canva_waitlist,
    // every founder's signupEmail), deduplicated. If this same address
    // also exists on the waitlist or as a founder account, it would still
    // get sent to. email_unsubscribes is the one list checked and
    // subtracted from all three — reusing the same unsubscribe-email
    // function a recipient's own footer link calls, so a staff delete
    // gives the same durable, real opt-out instead of just hiding one of
    // several lists they could still be reached through. Fire-and-forget:
    // the subscriber row's own delete below is the part that must never
    // be blocked by this.
    const email = subs.find(s => s.id === id)?.email
    if (email && supabase) {
      void supabase.functions.invoke(`unsubscribe-email?email=${encodeURIComponent(email.trim().toLowerCase())}`)
        .catch(() => { /* best-effort */ })
    }
    // Removing from the list optimistically but never checking whether the
    // delete actually landed let a failed delete look identical to a
    // successful one — the row vanished on screen but was still in the
    // database, and came back the next time this page re-synced. Roll the
    // row back and say so when that happens.
    setSubs(prev => prev.filter(s => s.id !== id))
    const result = await emailSubscribersService.delete(id)
    if (!result.success) {
      setSubs(emailSubscribersService.getAll())
      alert(result.error ?? 'Could not delete this subscriber. Please try again.')
    }
  }

  // Newest first — raw fetch order has no real meaning, and a growing
  // subscriber list is far more useful sorted by who just joined.
  const sortedSubs = [...subs].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const filteredSubs = search.trim()
    ? sortedSubs.filter(s => s.email.toLowerCase().includes(search.trim().toLowerCase()))
    : sortedSubs

  // For pulling the whole list out to work with elsewhere — e.g. adding
  // them into the curated founder candidate list, same reason Members has
  // its own CSV export. Same EmailRow shape as that export (blank
  // founder-specific fields), so the two can be merged/compared directly.
  function handleExport() {
    const rows = sortedSubs.map(s => {
      const { firstName, lastName } = splitName(s.name ?? '')
      return {
        email: s.email, firstName, lastName, fullName: s.name ?? '',
        profileStatus: '', founderSlug: '', profileUrl: '', claimUrl: '',
        businessName: '', tags: s.source, createdAt: s.createdAt,
      }
    })
    if (rows.length === 0) return
    downloadCSV(toCSV(rows), `culo-village-subscribers-${new Date().toISOString().slice(0, 10)}.csv`)
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2 flex-1">
          <input
            type="email"
            value={newEmail}
            onChange={e => setNewEmail(e.target.value)}
            placeholder="Add a subscriber by email"
            className="flex-1 px-3 py-2 rounded-lg border border-[#E8E4DD] text-sm text-[#2D2A26] focus:outline-none focus:border-[#C86A43]"
          />
          <button onClick={() => void handleAdd()} className="text-xs font-semibold px-3 py-2 rounded-lg bg-[#C86A43] text-white hover:bg-[#b05a35] transition-colors shrink-0">
            Add
          </button>
        </div>
        <button
          onClick={handleExport}
          disabled={subs.length === 0}
          className="text-xs font-semibold px-3 py-2 rounded-lg bg-white border border-[#E8E4DD] text-[#2D2A26] hover:border-[#C86A43]/40 disabled:opacity-40 transition-colors shrink-0"
        >
          Export CSV
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
              {canDelete && (
                <ConfirmButton label="Remove" confirmLabel="Confirm" onConfirm={() => void handleDelete(s.id)} className="text-xs text-[#9CA3AF] hover:text-red-500" />
              )}
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
  const bodyRef = useRef<HTMLTextAreaElement>(null)
  // Set while editing an existing draft (vs. writing a brand new one) —
  // handleSaveDraft reuses this id so Save overwrites the same campaign
  // row instead of creating a duplicate. Confirmed real gap: a saved
  // draft had no way back into it at all, only "Send now" — the subject/
  // body (e.g. "Hey" / "From Shakas") could never actually be corrected
  // once saved.
  const [editingId, setEditingId] = useState<string | null>(null)

  function handleEditDraft(c: EmailCampaign) {
    setEditingId(c.id)
    setSubject(c.subject)
    setBody(bodyHtmlToText(c.bodyHtml))
    setFeaturedStoryId('')
    bodyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  // Drops the {{article}} token wherever the cursor last was in the
  // textarea, instead of asking a founder to type it themselves — pick the
  // story, click here, keep writing.
  function insertArticleToken() {
    const el = bodyRef.current
    if (!el) { setBody(b => `${b}${b.trim() ? '\n\n' : ''}{{article}}\n\n`); return }
    const start = el.selectionStart ?? body.length
    const end = el.selectionEnd ?? body.length
    const before = body.slice(0, start)
    const after = body.slice(end)
    const needsLeadingBreak = before.length > 0 && !before.endsWith('\n\n')
    const insert = `${needsLeadingBreak ? '\n\n' : ''}{{article}}\n\n`
    const next = `${before}${insert}${after}`
    setBody(next)
    requestAnimationFrame(() => {
      const pos = before.length + insert.length
      el.focus()
      el.setSelectionRange(pos, pos)
    })
  }
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
      for (const f of getFounders()) {
        if (!f.signupEmail) continue
        // Mirrors send-campaign's own gate — an unpaid Canva signup isn't
        // counted here either, so this estimate doesn't overstate who's
        // actually about to be emailed.
        if (f.signupProduct === 'canva' && !f.creativeSubscription?.stripeSubscriptionId) continue
        emails.add(f.signupEmail.trim().toLowerCase())
      }
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
        bodyHtml = bodyHtml.replace('<p style="margin:0 0 16px;">{{article}}</p>', buildArticleCardHtml(story, founderName))
      }
    }
    const existing = editingId ? campaigns.find(c => c.id === editingId) : undefined
    const campaign: EmailCampaign = {
      id: editingId ?? crypto.randomUUID(), subject: subject.trim(), bodyHtml, status: 'draft',
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    }
    await emailCampaignsService.saveDraft(campaign)
    setCampaigns(emailCampaignsService.getAll())
    setEditingId(null)
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
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-[#2D2A26]">{editingId ? 'Edit newsletter' : 'New newsletter'}</p>
          {editingId && (
            <button
              onClick={() => { setEditingId(null); setSubject(''); setBody(''); setFeaturedStoryId('') }}
              className="text-xs font-semibold text-[#9CA3AF] hover:text-[#2D2A26] transition-colors"
            >
              Cancel edit
            </button>
          )}
        </div>
        <input
          type="text"
          value={subject}
          onChange={e => setSubject(e.target.value)}
          placeholder="Subject line"
          className="w-full px-3 py-2 rounded-lg border border-[#E8E4DD] text-sm text-[#2D2A26] mb-2 focus:outline-none focus:border-[#C86A43]"
        />
        <textarea
          ref={bodyRef}
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
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <a
                href={`https://www.culovillage.com/stories/${getStory(featuredStoryId)?.slug ?? ''}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold px-3 py-2 rounded-lg border border-[#C86A43] text-[#C86A43] hover:bg-[#C86A43]/10 transition-colors"
              >
                Review the article →
              </a>
              <button
                type="button"
                onClick={insertArticleToken}
                className="text-sm font-semibold px-3 py-2 rounded-lg bg-[#2D2A26] text-white hover:bg-[#1a1815] transition-colors"
              >
                Insert into email here
              </button>
              <p className="text-[11px] text-[#9CA3AF] basis-full">
                Click into the text above where you want the article to appear, then click "Insert into email here."
              </p>
            </div>
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
                    <span onClick={e => e.stopPropagation()} className="shrink-0 flex items-center gap-2">
                      <button
                        onClick={() => handleEditDraft(c)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#E8E4DD] text-[#2D2A26] hover:border-[#C86A43]/40 hover:text-[#C86A43] transition-colors"
                      >
                        Edit
                      </button>
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

  const [sendingNow, setSendingNow] = useState(false)
  const [sendNowResult, setSendNowResult] = useState<string | null>(null)
  function sendNow() {
    setSendingNow(true)
    setSendNowResult(null)
    void emailSequencesService.sendNow().then(result => {
      setSendingNow(false)
      setSendNowResult(result.success ? `Sent ${result.sent ?? 0} email${result.sent === 1 ? '' : 's'}.` : result.error ?? 'Could not send.')
      void emailSequenceEnrollmentsService.refresh().then(() => setEnrollments(emailSequenceEnrollmentsService.getAll()))
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
        {/* Runs the same send across every sequence's active enrollments,
            not just this one — same thing the daily cron does. Testing a
            step edit otherwise meant waiting for the next scheduled run. */}
        <button
          onClick={sendNow}
          disabled={sendingNow}
          className="ml-auto text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#2D2A26] text-white hover:bg-[#1a1815] disabled:opacity-50 transition-colors"
        >
          {sendingNow ? 'Sending…' : 'Send due emails now'}
        </button>
      </div>
      {sendNowResult && <p className="text-xs text-[#6B7280] mb-3 -mt-2">{sendNowResult}</p>}

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

// ─── Nudges panel — one-off emails triggered by a founder's own state ──────
// Distinct from Sequences: a sequence fires on elapsed days since signup
// regardless of what the founder actually did. A nudge fires because of a
// specific stuck condition (sat at a status too long, has untouched
// content sitting there) and only ever sends once per founder per
// condition — see send-nudges' own header comment for the exact trigger
// and timing on each. New-signup alerts to staff are separate again (see
// notify-new-signup): instant, not a daily condition check, so there's
// nothing to configure or manually trigger for that one here.
//
// Subject/body are editable here the same way a Sequence step is —
// pulled from email_nudge_templates (046), saved back through the same
// service, picked up by send-nudges on its next run (or immediately via
// "Send nudges now"). "when" (the trigger timing) is a code fact, not
// content, so it's not editable — it lives in send-nudges itself.
const NUDGE_WHEN: Record<EmailNudgeTemplate['id'], string> = {
  needsSetupNudgeSentAt: "24h+ after signup, still hasn't submitted /join/setup",
  readyNudgeSentAt: '24h+ after research finished, never reopened the dashboard',
  importNudgeSentAt: '48h+ after onboarding fully done, zero content imported',
  publishNudgeSentAt: '72h+ since a real draft article was imported, still unpublished',
}
// {{bioBlock}} only ever gets filled in for the ready-to-confirm nudge —
// see send-nudges. Shown so staff editing a template knows what's
// available to use, rather than guessing at placeholder names.
const NUDGE_PLACEHOLDERS: Record<EmailNudgeTemplate['id'], string[]> = {
  needsSetupNudgeSentAt: ['{{name}}'],
  readyNudgeSentAt: ['{{name}}', '{{bioBlock}}'],
  importNudgeSentAt: ['{{name}}'],
  publishNudgeSentAt: ['{{name}}'],
}

function NudgesPanel() {
  const founders = getFounders()
  const [templates, setTemplates] = useState<EmailNudgeTemplate[]>(emailNudgeTemplatesService.getAll())
  const [loading, setLoading] = useState(true)
  const [editingTemplate, setEditingTemplate] = useState<EmailNudgeTemplate | null>(null)
  const [bodyDraft, setBodyDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  useEffect(() => {
    void emailNudgeTemplatesService.refresh().then(() => {
      setTemplates(emailNudgeTemplatesService.getAll())
      setLoading(false)
    })
  }, [])

  function startEdit(template: EmailNudgeTemplate) {
    setEditingTemplate(template)
    setBodyDraft(bodyHtmlToText(template.bodyHtml))
  }

  function saveTemplate() {
    if (!editingTemplate) return
    const finalTemplate = { ...editingTemplate, bodyHtml: bodyTextToHtml(bodyDraft) }
    void emailNudgeTemplatesService.save(finalTemplate).then(() => {
      setTemplates(emailNudgeTemplatesService.getAll())
      setEditingTemplate(null)
    })
  }

  function sendNow() {
    setSending(true)
    setResult(null)
    void emailNudgeTemplatesService.sendNow().then(res => {
      setSending(false)
      setResult(res.success ? `Sent ${res.sent ?? 0} nudge${res.sent === 1 ? '' : 's'}.` : res.error ?? 'Could not send.')
    })
  }

  if (loading) return <p className="text-sm text-[#9CA3AF]">Loading…</p>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-[#6B7280]">
          Runs automatically every day at 9:30pm UTC (7:30am Brisbane). Each founder only ever gets a given nudge once.
        </p>
        <button
          onClick={sendNow}
          disabled={sending}
          className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#2D2A26] text-white hover:bg-[#1a1815] disabled:opacity-50 transition-colors"
        >
          {sending ? 'Sending…' : 'Send nudges now'}
        </button>
      </div>
      {result && <p className="text-xs text-[#6B7280] mb-4">{result}</p>}

      {editingTemplate && (
        <div className="bg-white rounded-xl border border-[#E8E4DD] p-4 mb-6">
          <p className="text-sm font-bold text-[#2D2A26] mb-3">Edit "{editingTemplate.title}"</p>
          <p className="text-[10px] text-[#9CA3AF] mb-2">Available placeholders: {NUDGE_PLACEHOLDERS[editingTemplate.id].join(', ')}</p>
          <input
            type="text"
            value={editingTemplate.subject}
            onChange={e => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
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
            <button onClick={saveTemplate} className="text-xs font-semibold px-3 py-2 rounded-lg bg-[#C86A43] text-white hover:bg-[#b05a35] transition-colors">Save</button>
            <button onClick={() => setEditingTemplate(null)} className="text-xs font-semibold px-3 py-2 rounded-lg text-[#6B7280] bg-[#F3EDE6] hover:bg-[#E8E4DD] transition-colors">Cancel</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-[#E8E4DD] divide-y divide-[#F3EDE6]">
        {templates.map(template => {
          const sentCount = founders.filter(f => !!(f as unknown as Record<string, unknown>)[template.id]).length
          return (
            <button
              key={template.id}
              onClick={() => startEdit(template)}
              className="w-full text-left px-4 py-3 hover:bg-[#FBF8F4] transition-colors"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-[#2D2A26]">{template.title}</p>
                <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-[#F3EDE6] text-[#6B7280]">
                  {sentCount} sent total
                </span>
              </div>
              <p className="text-xs text-[#9CA3AF] mt-0.5">{NUDGE_WHEN[template.id]}</p>
              <p className="text-xs text-[#6B7280] mt-1">Subject: "{template.subject}"</p>
            </button>
          )
        })}
      </div>

      <p className="text-xs text-[#9CA3AF] mt-4">
        Separately, you get an instant staff alert the moment anyone signs up — not a daily batch, see notify-new-signup.
      </p>
    </div>
  )
}
