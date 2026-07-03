import { readCache, writeEntity, deleteEntity, type WriteResult } from '../lib/entityStore'
import type { Relationship, RelationshipInput, RelationshipType, GraphEntityType, VillageSource, VillageSourceKind } from '../types'
import { getFounders } from './founders'
import { villageContentIntelligenceService } from './villageIntelligence'

// Village Graph Foundation — see supabase/migrations/008_village_graph.sql for the
// full rationale. Structural ownership (Business -> Founder, Story -> Founder) is
// never created here — it's already a foreign key on the owning table. This
// service only manages the relationships a foreign key can't express: mentions,
// editorial recognition (featured_in), imports, and founder-to-founder edges.
//
// Derived relationships (similar-topic, similar-founder) deliberately have no
// create/write path here — they're computed on read from Village Content
// Intelligence, the same previewIdeaImpact()-style pattern used by Idea
// matching, and never persisted as rows.
//
// Client-side code does not enforce who can create which edge — Postgres RLS
// (owns_entity() in the migration) is the actual authorization boundary, same
// model as every other founder-owned table in this app.

const RELATIONSHIPS_KEY = 'relationships'
const RELATIONSHIPS_TABLE = 'relationships'
const SOURCES_KEY = 'village_sources'
const SOURCES_TABLE = 'village_sources'

function toRelationshipRow(r: Relationship) {
  return {
    id: r.id,
    from_type: r.fromType,
    from_id: r.fromId,
    to_type: r.toType,
    to_id: r.toId,
    relationship_type: r.relationshipType,
    why: r.why ?? null,
    confidence: r.confidence,
    origin: r.origin,
    metadata: r.metadata ?? {},
    data: r,
  }
}

function toSourceRow(s: VillageSource) {
  return {
    id: s.id,
    slug: s.slug,
    name: s.name,
    kind: s.kind,
    url: s.url ?? null,
    data: s,
  }
}

export const relationshipService = {
  getAll(): Relationship[] {
    return readCache<Relationship>(RELATIONSHIPS_KEY)
  },

  /** Every relationship touching this entity, on either side of the edge. */
  getRelated(entityType: GraphEntityType, entityId: string): Relationship[] {
    return this.getAll().filter(r =>
      (r.fromType === entityType && r.fromId === entityId) ||
      (r.toType === entityType && r.toId === entityId)
    )
  },

  getByType(relationshipType: RelationshipType): Relationship[] {
    return this.getAll().filter(r => r.relationshipType === relationshipType)
  },

  /**
   * Explicit edges only — this never becomes the path for derived/computed
   * relationships (see file header). confidence defaults to 1.0, matching the
   * rule that explicit facts are always fully confident; derived scores are
   * computed on read and never stored.
   */
  async create(input: RelationshipInput): Promise<Relationship> {
    const relationship: Relationship = {
      ...input,
      id: crypto.randomUUID(),
      confidence: input.confidence ?? 1.0,
      createdAt: new Date().toISOString(),
    }
    const result = await writeEntity<Relationship>({
      cacheKey: RELATIONSHIPS_KEY,
      item: relationship,
      table: RELATIONSHIPS_TABLE,
      toRow: toRelationshipRow,
    })
    if (!result.success) throw new Error(result.error ?? 'Failed to create relationship')
    return relationship
  },

  async remove(id: string): Promise<WriteResult> {
    return deleteEntity({ cacheKey: RELATIONSHIPS_KEY, id, table: RELATIONSHIPS_TABLE })
  },
}

export const villageSourceService = {
  getAll(): VillageSource[] {
    return readCache<VillageSource>(SOURCES_KEY)
  },

  getBySlug(slug: string): VillageSource | undefined {
    return this.getAll().find(s => s.slug === slug)
  },

  /** CAPO-only in practice — enforced by RLS (village_sources_admin_write), not by this function. */
  async create(data: { name: string; slug: string; kind: VillageSourceKind; url?: string }): Promise<VillageSource> {
    const source: VillageSource = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }
    const result = await writeEntity<VillageSource>({
      cacheKey: SOURCES_KEY,
      item: source,
      table: SOURCES_TABLE,
      toRow: toSourceRow,
    })
    if (!result.success) throw new Error(result.error ?? 'Failed to create Source')
    return source
  },

  async remove(id: string): Promise<WriteResult> {
    return deleteEntity({ cacheKey: SOURCES_KEY, id, table: SOURCES_TABLE })
  },
}

// ─── Derived: similar founders ───────────────────────────────────────────────────
// Computed on read, never stored — see file header. Reuses the exact topic/
// industry output Village Content Intelligence already produces on every
// publish; this is not a second similarity algorithm, just a new consumer of
// the existing one.

export interface SimilarFounderMatch {
  founderId: string
  confidence: number
  why: string
  sharedTopics: string[]
}

function founderTopicProfile(founderId: string): { topics: Set<string>; names: Map<string, string> } {
  const records = villageContentIntelligenceService.getByFounder(founderId)
  const names = new Map<string, string>()
  for (const r of records) {
    for (const t of [...r.primaryTopics, ...r.secondaryTopics, ...r.industries]) {
      names.set(t.toLowerCase(), t)
    }
  }
  return { topics: new Set(names.keys()), names }
}

/**
 * Founders whose published topic/industry footprint genuinely overlaps this
 * one's. `confidence` is the real overlap ratio (never a separately-invented
 * number — see the confidence field's rule in types/index.ts) and doubles as
 * the ranking score. Founders with zero shared topics are never returned —
 * there is no such thing as a 0%-confident "related founder".
 */
export function getSimilarFounders(founderId: string, limit = 5): SimilarFounderMatch[] {
  const mine = founderTopicProfile(founderId)
  if (mine.topics.size === 0) return []

  const matches: SimilarFounderMatch[] = []
  for (const other of getFounders()) {
    if (other.id === founderId) continue
    const theirs = founderTopicProfile(other.id)
    if (theirs.topics.size === 0) continue

    const shared = [...mine.topics].filter(t => theirs.topics.has(t))
    if (shared.length === 0) continue

    const confidence = shared.length / Math.min(mine.topics.size, theirs.topics.size)
    const sharedNames = shared.map(t => mine.names.get(t) ?? t).slice(0, 3)
    matches.push({
      founderId: other.id,
      confidence,
      why: `Both publish about ${sharedNames.join(', ')}`,
      sharedTopics: sharedNames,
    })
  }

  return matches.sort((a, b) => b.confidence - a.confidence).slice(0, limit)
}
