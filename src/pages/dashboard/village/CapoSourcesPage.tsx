import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getFounders } from '../../../services/founders'
import { getBusinesses } from '../../../services/businesses'
import { getStories } from '../../../services/stories'
import { relationshipService, villageSourceService } from '../../../services/relationships'
import { normalizeUrl } from '../../../utils/url'
import { slugify } from '../../../utils/slugify'
import type { GraphEntityType, VillageSourceKind } from '../../../types'

// CAPO tooling for the Village Graph's editorial recognition layer — see
// supabase/migrations/008_village_graph.sql. A Source is a canonical, un-owned
// reference point (Pretty Cool Marketing, Techpresso, YouTube), never a
// Publisher — nobody owns it, it carries no content of its own. Staff attach
// a real `featured_in` edge from a Founder/Business/Story to a Source; the
// `why` field is always templated from this exact action, never freeform
// editorial text, so it can never drift from the truth of what happened.

const KIND_LABELS: Record<VillageSourceKind, string> = {
  publication: 'Publication',
  platform:    'Platform',
  community:   'Community',
  person:      'Person',
  brand:       'Brand',
}

function EntityPicker({
  entityType, onSelect,
}: {
  entityType: GraphEntityType
  onSelect: (id: string, label: string) => void
}) {
  const options =
    entityType === 'founder'  ? getFounders().map(f => ({ id: f.id, label: f.name })) :
    entityType === 'business' ? getBusinesses().map(b => ({ id: b.id, label: b.name })) :
    entityType === 'story'    ? getStories().map(s => ({ id: s.id, label: s.title })) : []

  return (
    <select
      onChange={e => {
        const opt = options.find(o => o.id === e.target.value)
        if (opt) onSelect(opt.id, opt.label)
      }}
      defaultValue=""
      className="px-3 py-2 rounded-lg border border-[#E8E4DD] text-sm text-[#2D2A26] bg-white focus:outline-none focus:ring-2 focus:ring-[#C86A43]/30"
    >
      <option value="" disabled>Choose {entityType}…</option>
      {options.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
    </select>
  )
}

export function CapoSourcesPage() {
  const [tick, setTick] = useState(0)
  const refresh = () => setTick(t => t + 1)
  void tick

  const [error, setError] = useState<string | null>(null)

  const [newName, setNewName] = useState('')
  const [newKind, setNewKind] = useState<VillageSourceKind>('publication')
  const [newUrl, setNewUrl]   = useState('')
  const [creatingSource, setCreatingSource] = useState(false)

  const [entityType, setEntityType] = useState<GraphEntityType>('founder')
  const [selected, setSelected] = useState<{ id: string; label: string } | null>(null)
  const [selectedSourceId, setSelectedSourceId] = useState('')
  const [attaching, setAttaching] = useState(false)

  const sources = villageSourceService.getAll()
  const allFeaturedInEdges = relationshipService.getByType('featured_in')

  async function createSource() {
    if (!newName.trim()) return
    setError(null)
    setCreatingSource(true)
    try {
      await villageSourceService.create({
        name: newName.trim(),
        slug: slugify(newName.trim()),
        kind: newKind,
        url: newUrl.trim() || undefined,
      })
      setNewName('')
      setNewUrl('')
      refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create Source')
    } finally {
      setCreatingSource(false)
    }
  }

  async function attachFeaturedIn() {
    if (!selected || !selectedSourceId) return
    const source = villageSourceService.get(selectedSourceId)
    if (!source) return
    setError(null)
    setAttaching(true)
    try {
      await relationshipService.create({
        fromType: entityType,
        fromId: selected.id,
        toType: 'source',
        toId: source.id,
        relationshipType: 'featured_in',
        why: `Featured by ${source.name}`,
        origin: 'capo',
      })
      setSelected(null)
      setSelectedSourceId('')
      refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to attach — this pairing may already exist')
    } finally {
      setAttaching(false)
    }
  }

  async function removeEdge(id: string) {
    setError(null)
    const result = await relationshipService.remove(id)
    if (!result.success) setError(result.error ?? 'Failed to remove')
    refresh()
  }

  function resolveEntityLabel(entType: string, entId: string): string {
    if (entType === 'founder')  return getFounders().find(f => f.id === entId)?.name ?? 'Unknown founder'
    if (entType === 'business') return getBusinesses().find(b => b.id === entId)?.name ?? 'Unknown business'
    if (entType === 'story')    return getStories().find(s => s.id === entId)?.title ?? 'Unknown story'
    return entId
  }

  const inputClass = 'px-3 py-2 rounded-lg border border-[#E8E4DD] text-sm text-[#2D2A26] bg-white placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#C86A43]/30'

  return (
    <div className="p-8 max-w-4xl" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      <div className="mb-8">
        <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-widest mb-1">CAPO</p>
        <h1 className="text-2xl font-bold text-[#2D2A26]">Sources</h1>
        <p className="text-sm text-[#6B7280] mt-0.5">
          Create canonical Sources (publications, platforms, communities) and attach genuine "Featured In" recognition
          to founders, businesses and stories. A Source is never owned or claimed — it's a reference point the graph
          connects to, the same tier as Topic or Location.
        </p>
      </div>

      {error && (
        <div className="mb-6 px-4 py-2.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}

      {/* Create Source */}
      <div className="bg-white rounded-xl border border-[#E8E4DD] p-5 mb-6">
        <h2 className="text-sm font-semibold text-[#2D2A26] mb-3">New Source</h2>
        <div className="flex flex-wrap gap-3 items-center">
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="e.g. Pretty Cool Marketing"
            className={`${inputClass} flex-1 min-w-[180px]`}
          />
          <select
            value={newKind}
            onChange={e => setNewKind(e.target.value as VillageSourceKind)}
            className={inputClass}
          >
            {(Object.keys(KIND_LABELS) as VillageSourceKind[]).map(k => (
              <option key={k} value={k}>{KIND_LABELS[k]}</option>
            ))}
          </select>
          <input
            value={newUrl}
            onChange={e => setNewUrl(e.target.value)}
            placeholder="URL (optional)"
            className={`${inputClass} flex-1 min-w-[180px]`}
          />
          <button
            onClick={() => void createSource()}
            disabled={!newName.trim() || creatingSource}
            className="px-4 py-2 bg-[#C86A43] text-white text-sm font-semibold rounded-lg hover:bg-[#b05a35] disabled:opacity-50 transition-colors"
          >
            {creatingSource ? 'Creating…' : 'Create Source'}
          </button>
        </div>
      </div>

      {/* Existing Sources */}
      <div className="bg-white rounded-xl border border-[#E8E4DD] divide-y divide-[#F3EDE6] mb-6">
        {sources.length === 0 ? (
          <div className="px-5 py-8 text-center"><p className="text-sm text-[#9CA3AF]">No Sources yet — create one above.</p></div>
        ) : sources.map(s => (
          <div key={s.id} className="flex items-center gap-4 px-5 py-3.5">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#2D2A26] truncate">{s.name}</p>
              <p className="text-xs text-[#9CA3AF]">{KIND_LABELS[s.kind]}</p>
            </div>
            {s.url && (
              <a href={normalizeUrl(s.url)} target="_blank" rel="noopener noreferrer" className="text-xs text-[#9CA3AF] hover:text-[#C86A43]">
                Visit ↗
              </a>
            )}
          </div>
        ))}
      </div>

      {/* Attach Featured In */}
      <div className="bg-white rounded-xl border border-[#E8E4DD] p-5 mb-6">
        <h2 className="text-sm font-semibold text-[#2D2A26] mb-3">Attach "Featured In"</h2>
        <div className="flex flex-wrap gap-3 items-center">
          <select
            value={entityType}
            onChange={e => { setEntityType(e.target.value as GraphEntityType); setSelected(null) }}
            className={inputClass}
          >
            <option value="founder">Founder</option>
            <option value="business">Business</option>
            <option value="story">Story</option>
          </select>
          <EntityPicker key={entityType} entityType={entityType} onSelect={(id, label) => setSelected({ id, label })} />
          <select
            value={selectedSourceId}
            onChange={e => setSelectedSourceId(e.target.value)}
            className={inputClass}
          >
            <option value="">Choose Source…</option>
            {sources.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <button
            onClick={() => void attachFeaturedIn()}
            disabled={!selected || !selectedSourceId || attaching}
            className="px-4 py-2 bg-[#C86A43] text-white text-sm font-semibold rounded-lg hover:bg-[#b05a35] disabled:opacity-50 transition-colors"
          >
            {attaching ? 'Attaching…' : 'Attach'}
          </button>
        </div>
        {selected && (
          <p className="text-xs text-[#9CA3AF] mt-2">Selected: {selected.label}</p>
        )}
      </div>

      {/* Existing Featured In edges */}
      <div className="bg-white rounded-xl border border-[#E8E4DD] divide-y divide-[#F3EDE6]">
        {allFeaturedInEdges.length === 0 ? (
          <div className="px-5 py-8 text-center"><p className="text-sm text-[#9CA3AF]">No editorial recognition attached yet.</p></div>
        ) : allFeaturedInEdges.map(edge => {
          const source = villageSourceService.get(edge.toId)
          return (
            <div key={edge.id} className="flex items-center gap-4 px-5 py-3.5">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#2D2A26] truncate">
                  {resolveEntityLabel(edge.fromType, edge.fromId)}
                  <span className="text-[#9CA3AF] font-normal"> — {edge.fromType}</span>
                </p>
                <p className="text-xs text-[#9CA3AF]">{edge.why ?? `Featured by ${source?.name ?? 'Unknown Source'}`}</p>
              </div>
              <button
                onClick={() => void removeEdge(edge.id)}
                className="text-xs text-[#9CA3AF] hover:text-red-500 transition-colors"
              >
                Remove
              </button>
            </div>
          )
        })}
      </div>

      <p className="text-xs text-[#9CA3AF] mt-4">
        Verify results on the public site: <Link to="/founders" target="_blank" className="text-[#C86A43] hover:underline">Founders</Link> ·{' '}
        <Link to="/businesses" target="_blank" className="text-[#C86A43] hover:underline">Businesses</Link> ·{' '}
        <Link to="/stories" target="_blank" className="text-[#C86A43] hover:underline">Stories</Link>
      </p>
    </div>
  )
}
