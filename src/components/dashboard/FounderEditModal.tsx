import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Founder } from '../../types'
import type { ImportedContent, ImportedContentStatus } from '../../types/importedContent'
import { updateFounder } from '../../services/founders'
import { importedContentService } from '../../services/importedContent'
import { getStory, updateStory } from '../../services/stories'
import { buildStoryFromImport, publishStoryCore } from '../../services/publishStory'
import { normalizeBlogSpacing } from '../../utils/blogFormatting'
import { locations } from '../../data/locations'
import { industries } from '../../data/industries'
import { Tabs } from './Tabs'
import { ConfirmButton } from '../ui/ConfirmButton'
import { runFounderResearch } from '../../services/editorialResearch'
import { passesRiskGate, riskGateReasons } from '../../services/editorialEngine'
import { writeProfileBio, writeSourceArticle, getEditorialItems, runAudit, type EditorialItemRow } from '../../services/editorialItems'

// Culo Editorial Engine, Sprint 1 — Stage 1 (Researcher) only, manual
// trigger, one founder at a time. Not wired into Bulk Import. See
// src/services/editorialResearch.ts and supabase/functions/editorial-research.
function EditorialResearchPanel({ founder, onSaved }: { founder: Founder; onSaved: (f: Founder) => void }) {
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const status = founder.researchStatus
  const ledger = founder.evidenceLedger

  async function handleRun() {
    setRunning(true); setError(null)
    const result = await runFounderResearch(founder.id)
    setRunning(false)
    if (!result.success) { setError(result.error ?? 'Research failed.'); return }
    // Re-read from cache — runFounderResearch already wrote status/ledger.
    onSaved({ ...founder, researchStatus: 'done', evidenceLedger: result.ledger })
  }

  async function handleClaimReview(index: number, review: 'confirmed' | 'rejected') {
    if (!ledger) return
    const claims = ledger.claims.map((c, i) => i === index ? { ...c, human_review: review } : c)
    const nextLedger = { ...ledger, claims }
    const next = { ...founder, evidenceLedger: nextLedger }
    await updateFounder(next)
    onSaved(next)
  }

  const gatePassed = ledger ? passesRiskGate(ledger) : undefined
  const gateReasons = ledger && !gatePassed ? riskGateReasons(ledger) : []

  return (
    <div className="bg-white border border-[#E8E4DD] rounded-lg px-3 py-3">
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className={LABEL_CLS}>Editorial research (Stage 1 — Researcher)</p>
        <button
          onClick={() => void handleRun()}
          disabled={running || status === 'researching'}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#2D2A26] text-white hover:bg-[#1a1815] disabled:opacity-50 transition-colors shrink-0"
        >
          {running || status === 'researching' ? 'Researching…' : ledger ? 'Re-run research' : 'Research this founder'}
        </button>
      </div>
      {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
      {!ledger && !running && (
        <p className="text-xs text-[#9CA3AF]">
          Searches the web to verify this founder's real sources and build a structured evidence ledger.
          Produces no article or bio yet — that's Stage 2, not built.
        </p>
      )}
      {ledger && (
        <div className="space-y-2">
          <p className={`text-xs font-semibold ${gatePassed ? 'text-[#5E6B4A]' : 'text-red-600'}`}>
            Risk Gate: {gatePassed ? 'Passed — no blocking issues found' : 'Needs human review before anything is written'}
          </p>
          {gateReasons.length > 0 && (
            <ul className="text-xs text-red-600 list-disc pl-4 space-y-0.5">
              {gateReasons.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          )}
          <details className="text-xs text-[#6B7280]">
            <summary className="cursor-pointer font-semibold text-[#2D2A26]">
              {ledger.claims.length} claim{ledger.claims.length === 1 ? '' : 's'} found · {ledger.source_assessments.length} source{ledger.source_assessments.length === 1 ? '' : 's'} assessed
            </summary>
            <div className="mt-2 space-y-1.5">
              {ledger.claims.map((c, i) => {
                const blocking = !gatePassed && gateReasons.some(r => r.includes(`"${c.claim}"`))
                return (
                  <div key={i} className={`border-l-2 pl-2 ${c.human_review === 'rejected' ? 'border-red-200 opacity-50' : blocking ? 'border-red-400' : 'border-[#E8E4DD]'}`}>
                    <p>
                      <span className="font-semibold uppercase text-[10px] text-[#9CA3AF]">{c.claim_type}</span>{' '}
                      {c.claim}
                    </p>
                    {c.human_review === 'confirmed' && <p className="text-[10px] text-[#5E6B4A] font-semibold mt-0.5">Confirmed by review — no longer blocking</p>}
                    {c.human_review === 'rejected' && <p className="text-[10px] text-red-600 font-semibold mt-0.5">Rejected — excluded from writing</p>}
                    {blocking && !c.human_review && (
                      <div className="flex gap-3 mt-1">
                        <button onClick={() => void handleClaimReview(i, 'confirmed')} className="text-[10px] font-semibold text-[#5E6B4A] hover:underline">
                          Confirm, clear this
                        </button>
                        <button onClick={() => void handleClaimReview(i, 'rejected')} className="text-[10px] font-semibold text-red-600 hover:underline">
                          Reject, exclude
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </details>
        </div>
      )}

      {ledger && <EditorialWritePanel founder={founder} ledger={ledger} />}
    </div>
  )
}

// Stage 2 — Writer. Bio is one call, each valid source is its own call
// (2A/2B per the agreed build order) — never regenerated in bulk, each
// triggered individually so a founder with several sources doesn't burn
// tokens on ones you don't want written yet.
function EditorialWritePanel({ founder, ledger }: { founder: Founder; ledger: NonNullable<Founder['evidenceLedger']> }) {
  const [items, setItems] = useState<EditorialItemRow[]>([])
  const [loaded, setLoaded] = useState(false)
  const [writingKey, setWritingKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!loaded) {
    void getEditorialItems(founder.id).then(r => { setItems(r); setLoaded(true) })
    return <p className="text-xs text-[#9CA3AF] mt-3">Loading draft status…</p>
  }

  const bioItem = items.find(i => i.type === 'profile_bio')
  const validSources = ledger.source_assessments.filter(s => s.source_valid)

  async function handleWriteBio() {
    setWritingKey('bio'); setError(null)
    const result = await writeProfileBio(founder.id)
    setWritingKey(null)
    if (!result.success) { setError(result.error ?? 'Failed to write bio.'); return }
    setItems(prev => [...prev.filter(i => i.type !== 'profile_bio'), result.item!])
  }

  async function handleWriteSource(source: typeof validSources[number]) {
    setWritingKey(source.url); setError(null)
    const result = await writeSourceArticle(founder.id, source.imported_content_id, source)
    setWritingKey(null)
    if (!result.success) { setError(result.error ?? 'Failed to write article.'); return }
    setItems(prev => [...prev, result.item!])
  }

  async function handleAudit(item: EditorialItemRow) {
    setWritingKey(`audit-${item.id}`); setError(null)
    const result = await runAudit(item)
    setWritingKey(null)
    if (!result.success) { setError(result.error ?? 'Audit failed.'); return }
    setItems(prev => prev.map(i => i.id === item.id ? result.item! : i))
  }

  return (
    <div className="mt-3 pt-3 border-t border-[#E8E4DD]">
      <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide mb-2">
        Stage 2 — Writer (draft only, nothing published)
      </p>
      {error && <p className="text-xs text-red-600 mb-2">{error}</p>}

      <div className="mb-3">
        {bioItem ? (
          <DraftItemCard item={bioItem} auditing={writingKey === `audit-${bioItem.id}`} onAudit={() => void handleAudit(bioItem)} />
        ) : (
          <button
            onClick={() => void handleWriteBio()}
            disabled={writingKey === 'bio'}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#3E6E92] text-white hover:bg-[#345c7a] disabled:opacity-50 transition-colors"
          >
            {writingKey === 'bio' ? 'Writing…' : 'Write profile bio'}
          </button>
        )}
      </div>

      <p className="text-xs text-[#9CA3AF] mb-1.5">{validSources.length} valid source{validSources.length === 1 ? '' : 's'} to write from:</p>
      <div className="space-y-2">
        {validSources.map(source => {
          const existing = items.find(i => i.type === 'source_article' && i.imported_content_id === source.imported_content_id)
          return (
            <div key={source.url} className="bg-[#F8F5F0] rounded-lg px-3 py-2">
              <p className="text-xs font-semibold text-[#2D2A26] truncate">{source.source_title ?? source.url}</p>
              {existing ? (
                <DraftItemCard item={existing} auditing={writingKey === `audit-${existing.id}`} onAudit={() => void handleAudit(existing)} />
              ) : (
                <button
                  onClick={() => void handleWriteSource(source)}
                  disabled={writingKey === source.url}
                  className="text-xs font-semibold text-[#3E6E92] hover:underline mt-1"
                >
                  {writingKey === source.url ? 'Writing…' : 'Write this article'}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

const AUDIT_STATUS_COLORS: Record<EditorialItemRow['editorial_status'], string> = {
  pending: 'text-[#9CA3AF]',
  pass: 'text-[#5E6B4A]',
  review: 'text-amber-600',
  reject: 'text-red-600',
}

// Shared display for one Writer draft — bio or article. Shows the draft
// itself, its fixed Culo byline, an "Audit this draft" trigger (Stage 3),
// and any issues the Auditor found, each tied to the specific sentence it
// flagged so a reviewer doesn't have to re-read the whole piece to find it.
function DraftItemCard({ item, auditing, onAudit }: { item: EditorialItemRow; auditing: boolean; onAudit: () => void }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-1">
        <p className={`text-[10px] font-semibold uppercase ${AUDIT_STATUS_COLORS[item.editorial_status]}`}>
          {item.editorial_status === 'pending' ? 'Not yet audited' : `Audit: ${item.editorial_status}`}
        </p>
        <button
          onClick={onAudit}
          disabled={auditing}
          className="text-[10px] font-semibold text-[#3E6E92] hover:underline disabled:opacity-50 shrink-0"
        >
          {auditing ? 'Auditing…' : item.editorial_status === 'pending' ? 'Audit this draft' : 'Re-audit'}
        </button>
      </div>
      <p className="text-xs text-[#6B7280] whitespace-pre-wrap">{item.draft_content?.body}</p>
      <p className="text-[10px] text-[#9CA3AF] italic mt-1">{item.draft_content?.byline}</p>
      {item.auditor_notes && item.auditor_notes.length > 0 && (
        <ul className="mt-2 space-y-1.5">
          {item.auditor_notes.map((issue, i) => (
            <li key={i} className="border-l-2 border-red-300 pl-2">
              <p className="text-[10px] font-semibold uppercase text-red-600">{issue.issue_type}</p>
              <p className="text-xs text-[#2D2A26] italic">"{issue.sentence}"</p>
              <p className="text-[10px] text-[#6B7280]">{issue.explanation}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function isReadyToPublish(item: ImportedContent): boolean {
  return item.title.trim().length > 0
}

const INPUT_CLS = 'w-full px-3 py-2 rounded-lg border border-[#E8E4DD] text-sm text-[#2D2A26] focus:outline-none focus:border-[#C86A43] bg-white'
const LABEL_CLS = 'block text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide mb-1'

const STATUS_COLORS: Record<ImportedContentStatus, string> = {
  draft:     'bg-[#F3EDE6] text-[#9CA3AF]',
  published: 'bg-[#5E6B4A]/10 text-[#5E6B4A]',
  featured:  'bg-[#3E6E92]/15 text-[#3E6E92]',
  archived:  'bg-[#F3EDE6] text-[#6B7280]',
}

// ─── Articles tab ───────────────────────────────────────────────────────────
// Same list shape as a founder's own Content tab (thumbnail, title, snippet,
// status control, view/delete) — CAPO staff reviewing an imported founder's
// batch see the exact same picture the founder themselves would.

function ArticleRow({ item, founder, onChanged }: { item: ImportedContent; founder: Founder; onChanged: () => void }) {
  const [busy, setBusy] = useState(false)
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(item.title)
  const [description, setDescription] = useState(item.description ?? '')
  const [saved, setSaved] = useState(false)
  const [publishError, setPublishError] = useState<string | null>(null)
  // A piece that's already been turned into a real Story links to its own
  // permanent page; otherwise the only place to see it is where it came
  // from.
  const publishedStory = item.relatedStoryId ? getStory(item.relatedStoryId) : undefined

  // The founder's own dashboard (DashboardProfilePage's handleRowStatusChange)
  // already does this — build a real Story the first time a piece goes
  // live, then just flip status on it after — but that path only ever ran
  // for a founder's own logged-in session. CAPO staff picking "Published"
  // here for a curated founder was only ever flipping ImportedContent's own
  // status field, never actually creating anything a visitor could see —
  // the "Publish" control existed with nothing behind it.
  async function setStatus(status: ImportedContentStatus) {
    setBusy(true)
    setPublishError(null)
    if (item.relatedStoryId) {
      const existing = getStory(item.relatedStoryId)
      if (existing) await updateStory({ ...existing, status })
      await importedContentService.updateStatus(item.id, status)
    } else if ((status === 'published' || status === 'featured') && isReadyToPublish(item)) {
      const story = buildStoryFromImport(item, founder)
      story.status = status
      const result = await publishStoryCore(story)
      if (!result.success) {
        setPublishError(result.error ?? 'Could not publish. Please try again.')
      } else {
        await importedContentService.updateStatus(item.id, status)
      }
    } else {
      await importedContentService.updateStatus(item.id, status)
    }
    setBusy(false)
    onChanged()
  }

  async function handleDelete() {
    setBusy(true)
    await importedContentService.delete(item.id)
    onChanged()
  }

  // Editing this only changes the imported record by itself — if this piece
  // already became a real Story (auto-published on import), that Story's
  // own title/blog were built from the old values at that moment and never
  // update again on their own. Keeping both in sync here means what staff
  // see and edit in this popup is actually what's on the page.
  async function handleSaveEdit() {
    setBusy(true)
    const nextDescription = normalizeBlogSpacing(description.trim())
    await importedContentService.upsert({ ...item, title: title.trim() || item.title, description: nextDescription })
    if (publishedStory) {
      await updateStory({ ...publishedStory, title: title.trim() || publishedStory.title, blog: nextDescription })
    }
    setBusy(false)
    setSaved(true)
    setEditing(false)
    onChanged()
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="border-b border-[#F3EDE6] last:border-b-0">
      <div className="flex items-center gap-4 px-4 py-3.5">
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#F3EDE6] flex-shrink-0">
          {item.thumbnailUrl && <img src={item.thumbnailUrl} alt="" className="w-full h-full object-cover" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">{item.sourcePlatform}</p>
          <p className="text-sm font-semibold text-[#2D2A26] truncate">{item.title}</p>
          {/* Every item's real substance shares the same opening lede
              sentence ("X is [role], based in [location]") by design — a
              single-line truncated preview showed nothing past that shared
              part, so every item in this list looked identical at a glance
              even when their actual bodies genuinely differ further in.
              Multi-line so the distinguishing part is actually visible. */}
          {item.description && <p className="text-xs text-[#6B7280] line-clamp-2">{item.description}</p>}
        </div>
        <select
          value={item.status}
          disabled={busy}
          onChange={e => void setStatus(e.target.value as ImportedContentStatus)}
          className={`text-xs font-semibold px-3 py-1.5 rounded-lg border-0 focus:outline-none cursor-pointer shrink-0 ${STATUS_COLORS[item.status]}`}
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="featured">Featured</option>
          <option value="archived">Archived</option>
        </select>
        <button
          onClick={() => setEditing(o => !o)}
          className="text-xs font-semibold text-[#9CA3AF] hover:text-[#C86A43] transition-colors shrink-0"
        >
          {editing ? 'Close' : 'Edit'}
        </button>
        {publishedStory ? (
          <Link
            to={`/stories/${publishedStory.slug}`}
            target="_blank"
            className="text-xs font-semibold text-[#C86A43] hover:underline shrink-0"
          >
            View article ↗
          </Link>
        ) : (
          <a
            href={item.originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-[#9CA3AF] hover:text-[#C86A43] transition-colors shrink-0"
          >
            Source ↗
          </a>
        )}
        <ConfirmButton
          label="Delete"
          confirmLabel="Yes"
          message="Delete this piece of content?"
          onConfirm={() => void handleDelete()}
          disabled={busy}
          className="text-xs font-semibold text-red-500 hover:text-red-600 transition-colors shrink-0"
        />
      </div>

      {publishError && <p className="px-4 pb-2 text-xs text-red-600">{publishError}</p>}

      {/* What's actually on the page — the exact title and blog body this
          piece publishes with (or already did, if it's live), editable
          right here instead of only being visible after publishing. */}
      {editing && (
        <div className="px-4 pb-4 flex flex-col gap-3 bg-[#FAF8F5]">
          <div>
            <label className={LABEL_CLS}>Title</label>
            <input className={INPUT_CLS} value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div>
            <label className={LABEL_CLS}>Blog body</label>
            <textarea
              className={`${INPUT_CLS} resize-y leading-relaxed`}
              rows={8}
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => void handleSaveEdit()}
              disabled={busy}
              className="px-4 py-2 bg-[#C86A43] text-white text-xs font-semibold rounded-lg hover:bg-[#b05a35] disabled:opacity-60 transition-colors"
            >
              {busy ? 'Saving…' : 'Save'}
            </button>
            {saved && <span className="text-xs font-semibold text-[#5E6B4A]">Saved ✓</span>}
          </div>
        </div>
      )}
    </div>
  )
}

function ArticlesTab({ founder, tick, bump }: { founder: Founder; tick: number; bump: () => void }) {
  void tick
  const items = importedContentService.getAll({ founderId: founder.id })

  if (items.length === 0) {
    return (
      <div className="px-4 py-10 text-center">
        <p className="text-sm font-semibold text-[#2D2A26] mb-1">No articles yet</p>
        <p className="text-xs text-[#9CA3AF]">Nothing has been imported for {founder.name} yet.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-[#E8E4DD] overflow-hidden max-h-[50vh] overflow-y-auto">
      {items.map(item => <ArticleRow key={item.id} item={item} founder={founder} onChanged={bump} />)}
    </div>
  )
}

// ─── Profile tab ────────────────────────────────────────────────────────────

function ProfileTab({ founder, onSaved }: { founder: Founder; onSaved: (f: Founder) => void }) {
  const [name, setName]           = useState(founder.name)
  const [bio, setBio]             = useState(founder.bio)
  const [locationId, setLocationId] = useState(founder.location.id)
  const [industryId, setIndustryId] = useState(founder.industry.id)
  const [website, setWebsite]     = useState(founder.website ?? '')
  const [linkedin, setLinkedin]   = useState(founder.linkedin ?? '')
  const [instagram, setInstagram] = useState(founder.instagram ?? '')
  const [youtube, setYoutube]     = useState(founder.youtube ?? '')
  const [tiktok, setTiktok]       = useState(founder.tiktok ?? '')
  const [podcast, setPodcast]     = useState(founder.podcast ?? '')
  const [newsletter, setNewsletter] = useState(founder.newsletter ?? '')
  const [saving, setSaving]       = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saved, setSaved]         = useState(false)

  async function handleSave() {
    setSaving(true); setSaveError(null); setSaved(false)
    const location = locations.find(l => l.id === locationId) ?? founder.location
    const industry = industries.find(i => i.id === industryId) ?? founder.industry
    const next: Founder = {
      ...founder,
      name: name.trim() || founder.name,
      bio: bio.trim(),
      location, industry,
      website: website.trim() || undefined,
      linkedin: linkedin.trim() || undefined,
      instagram: instagram.trim() || undefined,
      youtube: youtube.trim() || undefined,
      tiktok: tiktok.trim() || undefined,
      podcast: podcast.trim() || undefined,
      newsletter: newsletter.trim() || undefined,
    }
    const result = await updateFounder(next)
    setSaving(false)
    if (!result.success) { setSaveError(result.error ?? 'Could not save. Try again.'); return }
    setSaved(true)
    onSaved(next)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-4">
      <div>
        <label className={LABEL_CLS}>Name</label>
        <input className={INPUT_CLS} value={name} onChange={e => setName(e.target.value)} />
      </div>
      <div>
        <label className={LABEL_CLS}>Bio</label>
        <textarea
          className={`${INPUT_CLS} resize-y leading-relaxed`}
          rows={10}
          value={bio}
          onChange={e => setBio(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL_CLS}>Location</label>
          <select className={INPUT_CLS} value={locationId} onChange={e => setLocationId(e.target.value)}>
            {locations.map(l => <option key={l.id} value={l.id}>{l.name}, {l.state}</option>)}
          </select>
        </div>
        <div>
          <label className={LABEL_CLS}>Industry</label>
          <select className={INPUT_CLS} value={industryId} onChange={e => setIndustryId(e.target.value)}>
            {industries.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className={LABEL_CLS}>Website</label><input className={INPUT_CLS} value={website} onChange={e => setWebsite(e.target.value)} /></div>
        <div><label className={LABEL_CLS}>LinkedIn</label><input className={INPUT_CLS} value={linkedin} onChange={e => setLinkedin(e.target.value)} /></div>
        <div><label className={LABEL_CLS}>Instagram</label><input className={INPUT_CLS} value={instagram} onChange={e => setInstagram(e.target.value)} /></div>
        <div><label className={LABEL_CLS}>YouTube</label><input className={INPUT_CLS} value={youtube} onChange={e => setYoutube(e.target.value)} /></div>
        <div><label className={LABEL_CLS}>TikTok</label><input className={INPUT_CLS} value={tiktok} onChange={e => setTiktok(e.target.value)} /></div>
        <div><label className={LABEL_CLS}>Podcast</label><input className={INPUT_CLS} value={podcast} onChange={e => setPodcast(e.target.value)} /></div>
      </div>
      <div><label className={LABEL_CLS}>Newsletter</label><input className={INPUT_CLS} value={newsletter} onChange={e => setNewsletter(e.target.value)} /></div>

      {founder.claimNotes && (
        <div className="bg-[#F8F5F0] rounded-lg px-3 py-2.5">
          <p className={LABEL_CLS}>Curator notes (not public)</p>
          <p className="text-xs text-[#6B7280] whitespace-pre-wrap">{founder.claimNotes}</p>
        </div>
      )}

      <EditorialResearchPanel founder={founder} onSaved={onSaved} />

      {saveError && <p className="text-xs text-red-600">{saveError}</p>}
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={() => void handleSave()}
          disabled={saving}
          className="px-5 py-2.5 bg-[#C86A43] text-white text-sm font-semibold rounded-xl hover:bg-[#b05a35] disabled:opacity-60 transition-colors"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
        {saved && <span className="text-xs font-semibold text-[#5E6B4A]">Saved ✓</span>}
        <Link
          to={`/founders/${founder.slug}`}
          target="_blank"
          className="text-xs font-semibold text-[#9CA3AF] hover:text-[#C86A43] transition-colors ml-auto"
        >
          {/* Still a real render of the actual page — not a separate mock-up
              — but honest about what it is while it's a draft: nobody else
              can load this URL and see anything yet, only you, in this same
              browser, because you're the one who just wrote it. */}
          {founder.status === 'published' ? 'View public profile ↗' : 'Preview (not public yet) ↗'}
        </Link>
      </div>
    </div>
  )
}

// ─── Modal shell ────────────────────────────────────────────────────────────

export function FounderEditModal({ founder, onClose, onChanged }: {
  founder: Founder
  onClose: () => void
  onChanged: () => void
}) {
  const [tab, setTab] = useState<'profile' | 'articles'>('profile')
  const [current, setCurrent] = useState(founder)
  const [tick, setTick] = useState(0)
  const [publishing, setPublishing] = useState(false)
  const articleCount = importedContentService.getAll({ founderId: founder.id }).length

  async function handlePublish() {
    setPublishing(true)
    const result = await updateFounder({ ...current, status: 'published' })
    setPublishing(false)
    if (result.success) {
      setCurrent(prev => ({ ...prev, status: 'published' }))
      onChanged()
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div
        className="relative bg-[#FAF8F5] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
        role="dialog"
        aria-modal="true"
        aria-label={`Edit ${current.name}`}
      >
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-full bg-[#F3EDE6] flex-shrink-0 flex items-center justify-center text-[#C86A43] text-sm font-bold overflow-hidden">
              {current.avatar ? <img src={current.avatar} alt="" className="w-full h-full object-cover" /> : current.name[0]}
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold text-[#2D2A26] truncate">{current.name}</p>
              <p className="text-xs text-[#9CA3AF] truncate">/founders/{current.slug}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {/* Publish lives here, inside the review popup, not as a
                one-click button out on the results list — the whole point
                of a draft-first import is that someone's actually looked at
                this before it goes live. */}
            {current.status === 'published' ? (
              <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#5E6B4A]/10 text-[#5E6B4A]">Published</span>
            ) : (
              <button
                onClick={() => void handlePublish()}
                disabled={publishing}
                className="text-sm font-semibold px-4 py-2 rounded-xl bg-[#5E6B4A] text-white hover:bg-[#4a5538] disabled:opacity-60 transition-colors"
              >
                {publishing ? 'Publishing…' : 'Publish'}
              </button>
            )}
            <button
              onClick={onClose}
              className="text-[#9CA3AF] hover:text-[#2D2A26] transition-colors text-xl leading-none px-1"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>

        <Tabs
          tabs={[
            { key: 'profile', label: 'Profile' },
            { key: 'articles', label: 'Articles', badge: articleCount },
          ]}
          active={tab}
          onChange={key => setTab(key as 'profile' | 'articles')}
          className="mb-5"
        />

        {tab === 'profile' && (
          <ProfileTab
            founder={current}
            onSaved={f => { setCurrent(f); onChanged() }}
          />
        )}
        {tab === 'articles' && (
          <ArticlesTab founder={current} tick={tick} bump={() => setTick(t => t + 1)} />
        )}
      </div>
    </div>
  )
}
