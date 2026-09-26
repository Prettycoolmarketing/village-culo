import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Founder } from '../../types'
import type { ImportedContent, ImportedContentStatus } from '../../types/importedContent'
import { updateFounder } from '../../services/founders'
import { importedContentService } from '../../services/importedContent'
import { getStory } from '../../services/stories'
import { locations } from '../../data/locations'
import { industries } from '../../data/industries'
import { Tabs } from './Tabs'
import { ConfirmButton } from '../ui/ConfirmButton'

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

function ArticleRow({ item, onChanged }: { item: ImportedContent; onChanged: () => void }) {
  const [busy, setBusy] = useState(false)
  // A piece that's already been turned into a real Story links to its own
  // permanent page; otherwise the only place to see it is where it came
  // from.
  const publishedStory = item.relatedStoryId ? getStory(item.relatedStoryId) : undefined

  async function setStatus(status: ImportedContentStatus) {
    setBusy(true)
    await importedContentService.updateStatus(item.id, status)
    setBusy(false)
    onChanged()
  }

  async function handleDelete() {
    setBusy(true)
    await importedContentService.delete(item.id)
    onChanged()
  }

  return (
    <div className="flex items-center gap-4 px-4 py-3.5 border-b border-[#F3EDE6] last:border-b-0">
      <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#F3EDE6] flex-shrink-0">
        {item.thumbnailUrl && <img src={item.thumbnailUrl} alt="" className="w-full h-full object-cover" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide">{item.sourcePlatform}</p>
        <p className="text-sm font-semibold text-[#2D2A26] truncate">{item.title}</p>
        {item.description && <p className="text-xs text-[#6B7280] truncate">{item.description}</p>}
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
      {items.map(item => <ArticleRow key={item.id} item={item} onChanged={bump} />)}
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
        <textarea className={`${INPUT_CLS} resize-y`} rows={4} value={bio} onChange={e => setBio(e.target.value)} />
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
          View public profile ↗
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
  const articleCount = importedContentService.getAll({ founderId: founder.id }).length

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
          <button
            onClick={onClose}
            className="text-[#9CA3AF] hover:text-[#2D2A26] transition-colors text-xl leading-none px-1"
            aria-label="Close"
          >
            ×
          </button>
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
