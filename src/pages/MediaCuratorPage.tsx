import { useState, useMemo } from 'react'
import type { Media, ApprovalStatus, SourceType } from '../types'
import { mediaItems, importSources } from '../data/media'
import { importSuggestions } from '../data/importSuggestions'
import { MediaCard } from '../components/cards/MediaCard'

// ─── Constants ────────────────────────────────────────────────────────────────

const FILTER_GROUPS = [
  { label: 'All',          value: 'all' },
  { label: 'Needs Review', value: 'needs-review' },
  { label: 'Pending',      value: 'pending' },
  { label: 'Approved',     value: 'approved' },
  { label: 'Rejected',     value: 'rejected' },
] as const

const ENTITY_FILTERS = [
  { label: 'All entities',           value: 'all' },
  { label: 'Shakas',                 value: 'shakas' },
  { label: 'Pretty Cool Marketing',  value: 'pretty-cool-marketing' },
  { label: 'CULO',                   value: 'culo' },
  { label: 'Billow Beach',           value: 'billow-beach' },
  { label: "Where's Robyn",          value: 'wheres-robyn' },
] as const

const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  'manual-upload':    'Manual Upload',
  'official-website': 'Official Website',
  'linkedin':         'LinkedIn',
  'instagram':        'Instagram',
  'youtube':          'YouTube',
  'tiktok':           'TikTok',
  'amazon':           'Amazon',
  'podcast':          'Podcast',
  'speaker-page':     'Speaker Page',
  'canva-publish':    'Canva Publish',
  'system-generated': 'System Generated',
}

const IMPORT_FLOW_STEPS = [
  { step: 1, label: 'Source entered',        done: true  },
  { step: 2, label: 'Assets discovered',     done: true  },
  { step: 3, label: 'Text fields suggested', done: true  },
  { step: 4, label: 'Media classified',      done: true  },
  { step: 5, label: 'Founder reviews',       done: false },
  { step: 6, label: 'Founder approves',      done: false },
  { step: 7, label: 'Approved → Village',    done: false },
  { step: 8, label: 'Rejected → ignored',    done: false },
]

// ─── Approval status badge ────────────────────────────────────────────────────

const statusDot: Record<ApprovalStatus, string> = {
  approved:       'bg-green-500',
  rejected:       'bg-red-500',
  'needs-review': 'bg-amber-400',
  pending:        'bg-slate-400',
}

// ─── Source status badge ──────────────────────────────────────────────────────

const sourceStatusConfig = {
  pending:  { label: 'Pending',  className: 'bg-slate-100 text-slate-600' },
  scanning: { label: 'Scanning', className: 'bg-blue-100 text-blue-700'   },
  complete: { label: 'Complete', className: 'bg-green-100 text-green-700' },
  error:    { label: 'Error',    className: 'bg-red-100 text-red-700'     },
}

// ─── Suggestion review pill ───────────────────────────────────────────────────

const confidenceConfig = {
  high:   { className: 'bg-green-50 text-green-700 border border-green-200' },
  medium: { className: 'bg-amber-50 text-amber-700 border border-amber-200' },
  low:    { className: 'bg-red-50 text-red-700 border border-red-200'       },
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type ActiveTab = 'sources' | 'media' | 'suggestions' | 'flow'

// ─── Component ────────────────────────────────────────────────────────────────

export default function MediaCuratorPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('media')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [entityFilter, setEntityFilter] = useState<string>('all')
  const [selectedIds, setSelectedIds]   = useState<Set<string>>(new Set())
  const [localMedia, setLocalMedia]     = useState<Media[]>(mediaItems)
  const [activeMediaId, setActiveMediaId] = useState<string | null>(null)

  // ─── Filtered media ─────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    return localMedia.filter(m => {
      const matchStatus = statusFilter === 'all' || m.approvalStatus === statusFilter
      const matchEntity =
        entityFilter === 'all' ||
        m.relatedFounderIds.includes(entityFilter) ||
        m.relatedBusinessIds.includes(entityFilter)
      return matchStatus && matchEntity
    })
  }, [localMedia, statusFilter, entityFilter])

  // ─── Counts ─────────────────────────────────────────────────────────────────

  const counts = useMemo(() => ({
    needsReview: localMedia.filter(m => m.approvalStatus === 'needs-review').length,
    pending:     localMedia.filter(m => m.approvalStatus === 'pending').length,
    approved:    localMedia.filter(m => m.approvalStatus === 'approved').length,
    rejected:    localMedia.filter(m => m.approvalStatus === 'rejected').length,
  }), [localMedia])

  // ─── Actions ────────────────────────────────────────────────────────────────

  const handleApprove = (id: string) => {
    setLocalMedia(prev =>
      prev.map(m => m.id === id ? { ...m, approved: true, approvalStatus: 'approved' } : m)
    )
  }

  const handleReject = (id: string) => {
    setLocalMedia(prev =>
      prev.map(m => m.id === id ? { ...m, approved: false, approvalStatus: 'rejected' } : m)
    )
  }

  const handleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
    setActiveMediaId(id === activeMediaId ? null : id)
  }

  const handleBulkApprove = () => {
    setLocalMedia(prev =>
      prev.map(m => selectedIds.has(m.id) ? { ...m, approved: true, approvalStatus: 'approved' } : m)
    )
    setSelectedIds(new Set())
  }

  const handleBulkReject = () => {
    setLocalMedia(prev =>
      prev.map(m => selectedIds.has(m.id) ? { ...m, approved: false, approvalStatus: 'rejected' } : m)
    )
    setSelectedIds(new Set())
  }

  // ─── Active detail ──────────────────────────────────────────────────────────

  const activeMedia = activeMediaId ? localMedia.find(m => m.id === activeMediaId) : null

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <main className="max-w-screen-xl mx-auto px-4 sm:px-6 py-10 space-y-8">

      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📸</span>
          <h1 className="text-3xl font-bold text-primary">Media Curator</h1>
          <span className="text-xs font-medium bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full">
            Architecture Preview
          </span>
        </div>
        <p className="text-muted max-w-2xl">
          Discover, classify and approve media from official public sources.
          Nothing enters the Village until the founder approves it.
          All assets below are placeholders structured as if discovered from real sources.
        </p>
      </div>

      {/* Status summary bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Needs Review', count: counts.needsReview, color: 'bg-amber-50 border-amber-200 text-amber-800' },
          { label: 'Pending',      count: counts.pending,     color: 'bg-slate-50 border-slate-200 text-slate-700' },
          { label: 'Approved',     count: counts.approved,    color: 'bg-green-50 border-green-200 text-green-800' },
          { label: 'Rejected',     count: counts.rejected,    color: 'bg-red-50 border-red-200 text-red-700'       },
        ].map(({ label, count, color }) => (
          <div key={label} className={`rounded-xl border p-4 ${color}`}>
            <p className="text-2xl font-bold">{count}</p>
            <p className="text-sm font-medium mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-hover rounded-xl p-1 w-fit">
        {([
          { key: 'media',       label: `Media (${localMedia.length})`              },
          { key: 'sources',     label: `Sources (${importSources.length})`         },
          { key: 'suggestions', label: `Text Suggestions (${importSuggestions.length})` },
          { key: 'flow',        label: 'Import Flow'                                },
        ] as { key: ActiveTab; label: string }[]).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-surface text-primary shadow-sm'
                : 'text-muted hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Media ─────────────────────────────────────────────────────── */}
      {activeTab === 'media' && (
        <div className="space-y-5">

          {/* Filters + bulk actions row */}
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {/* Status filter */}
              <div className="flex gap-1 bg-surface-hover rounded-lg p-1">
                {FILTER_GROUPS.map(f => (
                  <button
                    key={f.value}
                    onClick={() => setStatusFilter(f.value)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      statusFilter === f.value
                        ? 'bg-surface text-primary shadow-sm'
                        : 'text-muted hover:text-foreground'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Entity filter */}
              <select
                value={entityFilter}
                onChange={e => setEntityFilter(e.target.value)}
                className="text-xs rounded-lg border border-border bg-surface px-3 py-1.5 text-foreground"
              >
                {ENTITY_FILTERS.map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>

            {/* Bulk actions */}
            {selectedIds.size > 0 && (
              <div className="flex gap-2 items-center">
                <span className="text-xs text-muted">{selectedIds.size} selected</span>
                <button
                  onClick={handleBulkApprove}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                >
                  Approve All
                </button>
                <button
                  onClick={handleBulkReject}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                >
                  Reject All
                </button>
              </div>
            )}
          </div>

          {/* Result count */}
          <p className="text-sm text-muted">
            {filtered.length} asset{filtered.length !== 1 ? 's' : ''}
            {statusFilter !== 'all' || entityFilter !== 'all' ? ' matching filters' : ' total'}
          </p>

          {/* Two-pane layout: grid + detail */}
          <div className="flex gap-6">
            {/* Grid */}
            <div className={`grid gap-4 ${activeMedia ? 'w-full lg:w-2/3 grid-cols-1 sm:grid-cols-2' : 'w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
              {filtered.map(m => (
                <MediaCard
                  key={m.id}
                  media={m}
                  selected={selectedIds.has(m.id)}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onSelect={handleSelect}
                />
              ))}
              {filtered.length === 0 && (
                <div className="col-span-full py-16 text-center text-muted">
                  No assets match the current filters.
                </div>
              )}
            </div>

            {/* Detail panel */}
            {activeMedia && (
              <div className="hidden lg:block w-1/3 shrink-0">
                <div className="sticky top-24 bg-surface border border-border rounded-xl overflow-hidden">
                  {/* Image */}
                  <div className="aspect-video bg-surface-hover overflow-hidden">
                    <img
                      src={activeMedia.fileUrl}
                      alt={activeMedia.altText}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="p-4 space-y-4">
                    {/* Title + status */}
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-sm text-primary leading-snug">{activeMedia.title}</h3>
                      <span className={`shrink-0 flex items-center gap-1.5 text-xs font-medium`}>
                        <span className={`w-2 h-2 rounded-full ${statusDot[activeMedia.approvalStatus]}`} />
                        {activeMedia.approvalStatus.replace(/-/g, ' ')}
                      </span>
                    </div>

                    {/* Details */}
                    <dl className="space-y-2 text-xs">
                      <div className="flex gap-2">
                        <dt className="text-muted w-20 shrink-0">Type</dt>
                        <dd className="text-foreground capitalize">{activeMedia.mediaType.replace(/-/g, ' ')}</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="text-muted w-20 shrink-0">Role</dt>
                        <dd className="text-foreground capitalize">{activeMedia.assetRole.replace(/-/g, ' ')}</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="text-muted w-20 shrink-0">Source</dt>
                        <dd className="text-foreground">{SOURCE_TYPE_LABELS[activeMedia.sourceType]}</dd>
                      </div>
                      {activeMedia.sourceUrl && (
                        <div className="flex gap-2">
                          <dt className="text-muted w-20 shrink-0">From</dt>
                          <dd className="text-foreground truncate">{new URL(activeMedia.sourceUrl).hostname}</dd>
                        </div>
                      )}
                      {activeMedia.caption && (
                        <div className="flex gap-2">
                          <dt className="text-muted w-20 shrink-0">Caption</dt>
                          <dd className="text-foreground italic">{activeMedia.caption}</dd>
                        </div>
                      )}
                    </dl>

                    {/* Alt text */}
                    <div className="bg-surface-hover rounded-lg p-3">
                      <p className="text-xs font-medium text-foreground mb-1">Alt text</p>
                      <p className="text-xs text-muted">{activeMedia.altText}</p>
                    </div>

                    {/* Relationships */}
                    {(activeMedia.relatedTopicIds.length > 0 || activeMedia.relatedExpertiseIds.length > 0) && (
                      <div className="space-y-2">
                        {activeMedia.relatedTopicIds.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-foreground mb-1.5">Topics</p>
                            <div className="flex flex-wrap gap-1">
                              {activeMedia.relatedTopicIds.map(t => (
                                <span key={t} className="text-xs bg-surface-hover text-muted px-2 py-0.5 rounded-full capitalize">
                                  {t.replace(/-/g, ' ')}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {activeMedia.relatedExpertiseIds.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-foreground mb-1.5">Expertise</p>
                            <div className="flex flex-wrap gap-1">
                              {activeMedia.relatedExpertiseIds.map(e => (
                                <span key={e} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full capitalize">
                                  {e.replace(/-/g, ' ')}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-1">
                      {activeMedia.approvalStatus !== 'approved' && (
                        <button
                          onClick={() => handleApprove(activeMedia.id)}
                          className="flex-1 text-xs font-medium py-2 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                        >
                          Approve
                        </button>
                      )}
                      {activeMedia.approvalStatus !== 'rejected' && (
                        <button
                          onClick={() => handleReject(activeMedia.id)}
                          className="flex-1 text-xs font-medium py-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                        >
                          Reject
                        </button>
                      )}
                      <button
                        onClick={() => setActiveMediaId(null)}
                        className="text-xs font-medium px-3 py-2 rounded-lg bg-surface-hover text-muted hover:text-foreground transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tab: Import Sources ────────────────────────────────────────────── */}
      {activeTab === 'sources' && (
        <div className="space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-primary mb-1">Import Sources</h2>
            <p className="text-sm text-muted">
              Declared entry points. Each source would be scanned for public media and text.
              No live scanning happens here — this is the architecture layer only.
            </p>
          </div>

          {/* Future source input UI */}
          <div className="bg-surface-hover border border-dashed border-border rounded-xl p-6 space-y-4">
            <p className="text-sm font-medium text-foreground">Add a new source (prototype — not connected)</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { placeholder: 'Website URL (e.g. prettycoolmarketing.com)', icon: '🌐' },
                { placeholder: 'YouTube channel URL', icon: '▶️' },
                { placeholder: 'Instagram profile URL', icon: '📷' },
              ].map(({ placeholder, icon }) => (
                <div key={placeholder} className="flex items-center gap-2 bg-surface border border-border rounded-lg px-3 py-2">
                  <span className="text-base">{icon}</span>
                  <input
                    disabled
                    placeholder={placeholder}
                    className="flex-1 text-xs text-muted bg-transparent outline-none cursor-not-allowed"
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-muted">
              Future: clicking Discover would trigger a backend scan of the source URL and populate the Media and Suggestions tabs.
            </p>
          </div>

          {/* Sources list */}
          <div className="space-y-3">
            {importSources.map(source => {
              const sc = sourceStatusConfig[source.status]
              return (
                <div key={source.id} className="bg-surface border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-primary">{source.label}</p>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${sc.className}`}>
                        {sc.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted">{source.url}</p>
                    <p className="text-xs text-muted capitalize">
                      Type: {SOURCE_TYPE_LABELS[source.sourceType]}
                    </p>
                  </div>
                  <div className="flex gap-4 text-center">
                    <div>
                      <p className="text-lg font-bold text-foreground">{source.discoveredMediaCount ?? 0}</p>
                      <p className="text-xs text-muted">Media</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-foreground">{source.discoveredSuggestionCount ?? 0}</p>
                      <p className="text-xs text-muted">Suggestions</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Tab: Text Suggestions ─────────────────────────────────────────── */}
      {activeTab === 'suggestions' && (
        <div className="space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-primary mb-1">Text Suggestions</h2>
            <p className="text-sm text-muted">
              Fields discovered from public sources. Nothing is published until the founder reviews and approves.
              Confidence reflects how closely the discovered text maps to the target field.
            </p>
          </div>

          <div className="space-y-3">
            {importSuggestions.map(s => {
              const cc = confidenceConfig[s.confidenceLevel]
              const isApproved = s.reviewStatus === 'approved'
              return (
                <div key={s.id} className={`bg-surface border rounded-xl p-4 space-y-3 ${isApproved ? 'border-green-200' : 'border-border'}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                          {s.field.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cc.className}`}>
                          {s.confidenceLevel} confidence
                        </span>
                        {isApproved && (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                            Approved
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted">
                        Source: <span className="text-foreground">{SOURCE_TYPE_LABELS[s.sourceType]}</span>
                        {' · '}
                        <span className="text-foreground">{new URL(s.sourceUrl).hostname}</span>
                      </p>
                    </div>
                  </div>

                  <blockquote className="text-sm text-foreground bg-surface-hover rounded-lg px-4 py-3 border-l-2 border-primary/30 italic">
                    "{s.suggestedValue}"
                  </blockquote>

                  {isApproved && s.approvedValue && s.approvedValue !== s.suggestedValue && (
                    <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                      <p className="text-xs font-medium text-green-700 mb-1">Approved version (edited)</p>
                      <p className="text-sm text-green-900">"{s.approvedValue}"</p>
                    </div>
                  )}

                  {!isApproved && (
                    <div className="flex gap-2">
                      <button className="text-xs font-medium px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors">
                        Approve
                      </button>
                      <button className="text-xs font-medium px-3 py-1.5 rounded-lg bg-surface-hover text-muted hover:text-foreground transition-colors">
                        Edit &amp; Approve
                      </button>
                      <button className="text-xs font-medium px-3 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors">
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Tab: Import Flow ──────────────────────────────────────────────── */}
      {activeTab === 'flow' && (
        <div className="space-y-8">
          <div>
            <h2 className="text-lg font-semibold text-primary mb-1">Import Flow</h2>
            <p className="text-sm text-muted max-w-xl">
              The complete lifecycle from source discovery to Village publication.
              CULO discovers and suggests. The founder approves.
              Only approved knowledge becomes part of the Village.
            </p>
          </div>

          {/* Flow steps */}
          <div className="relative">
            <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border" aria-hidden="true" />
            <ol className="space-y-4">
              {IMPORT_FLOW_STEPS.map(({ step, label, done }) => (
                <li key={step} className="flex items-center gap-4 relative">
                  <div className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 font-bold text-sm shrink-0 ${
                    done
                      ? 'bg-primary border-primary text-white'
                      : 'bg-surface border-border text-muted'
                  }`}>
                    {done ? '✓' : step}
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${done ? 'text-primary' : 'text-muted'}`}>{label}</p>
                    <p className="text-xs text-muted">{done ? 'Complete in prototype' : 'Requires founder action'}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Rules grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            {[
              {
                icon: '🚫',
                title: 'Never overwrite',
                body: 'Imported content is always a suggestion. It never replaces founder-created content.',
              },
              {
                icon: '🔗',
                title: 'Preserve provenance',
                body: 'Every asset keeps its sourceType and sourceUrl so origin is always traceable.',
              },
              {
                icon: '🧠',
                title: 'SEO-first assets',
                body: 'Every approved image requires alt text. Every approved video requires a description and transcript placeholder.',
              },
              {
                icon: '❌',
                title: 'No CDN hotlinks',
                body: 'Instagram and TikTok CDN URLs are not stored. Approved assets are copied to CULO storage.',
              },
              {
                icon: '📋',
                title: 'Text fields are suggestions',
                body: 'Discovered bios, descriptions, FAQs and service copy require explicit approval before appearing in the Village.',
              },
              {
                icon: '🎨',
                title: 'Canva publish only',
                body: 'Canva content is inspected at publish time only. Original generated outputs are not assumed to exist.',
              },
            ].map(({ icon, title, body }) => (
              <div key={title} className="bg-surface border border-border rounded-xl p-4 flex gap-3">
                <span className="text-xl shrink-0">{icon}</span>
                <div>
                  <p className="text-sm font-semibold text-primary mb-1">{title}</p>
                  <p className="text-xs text-muted leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Future integrations */}
          <div className="space-y-3">
            <h3 className="text-base font-semibold text-primary">Future integrations</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { source: 'Official Website', icon: '🌐', status: 'Architecture ready' },
                { source: 'YouTube',          icon: '▶️', status: 'Architecture ready' },
                { source: 'LinkedIn',         icon: '💼', status: 'Architecture ready' },
                { source: 'Instagram',        icon: '📷', status: 'Suggestion-only (CDN policy)' },
                { source: 'TikTok',           icon: '🎵', status: 'Suggestion-only (CDN policy)' },
                { source: 'Amazon',           icon: '📦', status: 'For books/products' },
                { source: 'Podcast',          icon: '🎙️', status: 'Planned' },
                { source: 'Canva Publish',    icon: '🎨', status: 'Architecture ready' },
                { source: 'Manual Upload',    icon: '📁', status: 'Architecture ready' },
              ].map(({ source, icon, status }) => (
                <div key={source} className="bg-surface-hover border border-border rounded-xl p-3 space-y-1">
                  <p className="text-base">{icon}</p>
                  <p className="text-xs font-semibold text-foreground">{source}</p>
                  <p className="text-xs text-muted">{status}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
