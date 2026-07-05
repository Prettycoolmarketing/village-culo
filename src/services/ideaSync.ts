// Village Intelligence pipeline — Sprint 3.5.
//
// Before this file existed, villageIntelligence.ts's analyse() already
// persisted its full output (topics, people, businesses, products, services,
// keywords, questions, lessons-as-text — everything in VillageContentIntelligence)
// to the village_content_intelligence table on every publish. That part was
// never "discard after display" despite how it read in the UI.
//
// The one genuinely ephemeral part was Ideas: analyse() returned `lessons` as
// plain strings for the Story Builder preview, and nothing ever turned them
// into real, linked, deduplicated Idea records. This file closes that gap —
// it is the single place a Story's extracted lessons become (or strengthen)
// first-class Idea entities, and the single place Founder/Business authority
// scores get recomputed. Every publish path (new story, edited story) calls
// this same function — there is no second pipeline.

import type { Story, Idea, Founder, Business } from '../types'
import type { VillageContentIntelligence } from '../types/villageIntelligence'
import { getIdeas, updateIdea } from './ideas'
import { getStories } from './stories'
import { getFounders, updateFounder } from './founders'
import { getBusinesses, updateBusiness } from './businesses'
import { relationshipService } from './relationships'
import { slugify } from '../utils/slugify'

export interface IdeaSyncResult {
  created: Idea[]
  strengthened: Idea[]
}

// Word-overlap similarity — the same class of heuristic villageIntelligence.ts
// already uses elsewhere (keyword/regex extraction, not embeddings or an LLM
// call). Real dedup, honestly simple: two lessons are "the same idea" if most
// of their significant words overlap and they share at least one topic.
const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'of', 'to', 'in', 'on', 'for', 'with',
  'is', 'are', 'was', 'were', 'this', 'that', 'it', 'i', 'we', 'you', 'your', 'my',
])

function wordSet(text: string): Set<string> {
  return new Set(
    text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !STOPWORDS.has(w)),
  )
}

function similarity(a: string, b: string): number {
  const wa = wordSet(a)
  const wb = wordSet(b)
  if (wa.size === 0 || wb.size === 0) return 0
  let overlap = 0
  for (const w of wa) if (wb.has(w)) overlap++
  return overlap / Math.min(wa.size, wb.size)
}

const SIMILARITY_THRESHOLD = 0.6

/** Shared matching rule — the one place "is this the same idea?" is decided, used by both the real sync and the read-only preview so they can never disagree. */
function findIdeaMatch(pool: Idea[], story: Story, lessonText: string): number {
  const storyTopicIds = new Set(story.topics.map(t => t.id))
  return pool.findIndex(idea =>
    idea.topics.some(t => storyTopicIds.has(t.id)) &&
    similarity(idea.title, lessonText) >= SIMILARITY_THRESHOLD,
  )
}

/**
 * Turns a story's extracted lessons into real Idea records: strengthens an
 * existing matching idea (links the story/founder/business, does not
 * duplicate) or creates a new one. No-ops if the story has no founderId —
 * Ideas are founder-owned (migration 006) and can't be created anonymously.
 */
export async function syncIdeasFromStory(story: Story, intel: VillageContentIntelligence): Promise<IdeaSyncResult> {
  const created: Idea[] = []
  const strengthened: Idea[] = []
  if (!story.founderId) return { created, strengthened }

  const pool = [...getIdeas()]

  for (const lessonText of intel.lessons) {
    const title = lessonText.trim()
    if (!title) continue

    const candidateIdx = findIdeaMatch(pool, story, title)

    if (candidateIdx !== -1) {
      const candidate = pool[candidateIdx]
      const alreadyLinked = candidate.relatedStoryIds.includes(story.id)
      const nextFounders = candidate.relatedFounderIds.includes(story.founderId)
        ? candidate.relatedFounderIds : [...candidate.relatedFounderIds, story.founderId]
      const nextBusinesses = story.businessId && !candidate.relatedBusinessIds.includes(story.businessId)
        ? [...candidate.relatedBusinessIds, story.businessId] : candidate.relatedBusinessIds

      if (alreadyLinked && nextFounders.length === candidate.relatedFounderIds.length && nextBusinesses.length === candidate.relatedBusinessIds.length) {
        continue // this exact story already strengthened this idea — no-op, not a re-count
      }

      const next: Idea = {
        ...candidate,
        relatedStoryIds: alreadyLinked ? candidate.relatedStoryIds : [...candidate.relatedStoryIds, story.id],
        relatedFounderIds: nextFounders,
        relatedBusinessIds: nextBusinesses,
      }
      const result = await updateIdea(next)
      if (result.success) {
        strengthened.push(next)
        pool[candidateIdx] = next
      }
      continue
    }

    const id = `idea-${slugify(title).slice(0, 40) || 'untitled'}-${Date.now().toString(36)}`
    const newIdea: Idea = {
      id,
      slug: slugify(title) || id,
      title,
      description: lessonText,
      topics: story.topics,
      relatedStoryIds: [story.id],
      relatedFounderIds: [story.founderId],
      relatedBusinessIds: story.businessId ? [story.businessId] : [],
      featured: false,
      status: 'published',
      createdAt: new Date().toISOString().split('T')[0]!,
      founderId: story.founderId,
    }
    const result = await updateIdea(newIdea)
    if (result.success) {
      created.push(newIdea)
      pool.push(newIdea) // so a second near-duplicate lesson in the same story strengthens rather than re-creates
    }
  }

  return { created, strengthened }
}

// ─── Authority scores ───────────────────────────────────────────────────────
// Deterministic, heuristic, real — computed from what's actually in the
// database after idea sync, not fabricated for display. Recomputed on every
// publish; never drifts from the underlying graph. scoreFromSignals is the one
// formula both the real (post-write) score and the read-only preview use.

function scoreFromSignals(
  ideaCount: number,
  relationshipStrength: number,
  storiesPublished: number,
  businessConnections: number,
  featuredInCount: number,
  mentionsCount: number,
): number {
  return Math.min(100,
    ideaCount * 3 +
    relationshipStrength +
    storiesPublished * 2 +
    businessConnections * 2 +
    featuredInCount * 5 +
    mentionsCount,
  )
}

/**
 * Real Village Graph signals only — see supabase/migrations/008_village_graph.sql.
 * featuredInCount is genuine editorial recognition (a CAPO-attached `featured_in`
 * edge to a Source); mentionsCount is how many published stories actually
 * mention this founder/business (see relationshipSync.ts). Both are zero until
 * the graph has real edges — no signal here is ever inferred or estimated.
 */
function graphSignalsFor(entityType: 'founder' | 'business', entityId: string): { featuredInCount: number; mentionsCount: number } {
  const edges = relationshipService.getRelated(entityType, entityId)
  const featuredInCount = edges.filter(e => e.relationshipType === 'featured_in' && e.fromType === entityType && e.fromId === entityId).length
  const mentionsCount = edges.filter(e => e.relationshipType === 'mentions' && e.toType === entityType && e.toId === entityId).length
  return { featuredInCount, mentionsCount }
}

export function computeFounderAuthorityScore(founderId: string): number {
  const ideas = getIdeas({ founderId })
  const relationshipStrength = ideas.reduce((sum, i) => sum + i.relatedStoryIds.length, 0)
  const storiesPublished = getStories({ founderId, publicOnly: true }).length
  const businessConnections = new Set(ideas.flatMap(i => i.relatedBusinessIds)).size
  const { featuredInCount, mentionsCount } = graphSignalsFor('founder', founderId)
  return scoreFromSignals(ideas.length, relationshipStrength, storiesPublished, businessConnections, featuredInCount, mentionsCount)
}

export function computeBusinessAuthorityScore(businessId: string): number {
  const ideas = getIdeas().filter(i => i.relatedBusinessIds.includes(businessId))
  const relationshipStrength = ideas.reduce((sum, i) => sum + i.relatedStoryIds.length, 0)
  const storiesPublished = getStories({ businessId, publicOnly: true }).length
  const { featuredInCount, mentionsCount } = graphSignalsFor('business', businessId)
  return scoreFromSignals(ideas.length, relationshipStrength, storiesPublished, 0, featuredInCount, mentionsCount)
}

/** Recomputes and persists both scores touched by a story — no-ops if unchanged. */
export async function refreshAuthorityScores(story: Story): Promise<{ founderDelta: number; businessDelta: number }> {
  let founderDelta = 0
  let businessDelta = 0

  if (story.founderId) {
    const founder = getFounders().find((f: Founder) => f.id === story.founderId)
    if (founder) {
      const nextScore = computeFounderAuthorityScore(founder.id)
      founderDelta = nextScore - (founder.authorityScore ?? 0)
      if (founderDelta !== 0) void updateFounder({ ...founder, authorityScore: nextScore })
    }
  }

  if (story.businessId) {
    const business = getBusinesses().find((b: Business) => b.id === story.businessId)
    if (business) {
      const nextScore = computeBusinessAuthorityScore(business.id)
      businessDelta = nextScore - (business.authorityScore ?? 0)
      if (businessDelta !== 0) void updateBusiness({ ...business, authorityScore: nextScore })
    }
  }

  return { founderDelta, businessDelta }
}

// ─── Read-only preview ──────────────────────────────────────────────────────
// Powers the live Village Intelligence panel while a founder is still
// drafting — same matching rule (findIdeaMatch) and same scoring formula
// (scoreFromSignals) as the real write path, just never calls updateIdea/
// updateFounder. Real numbers projected from the real current graph, not a
// second guess at what the pipeline might do.

export interface IdeaImpactPreview {
  newIdeas: number
  strengthenedIdeas: number
  currentAuthorityScore: number
  projectedAuthorityScore: number
  projectedAuthorityDelta: number
}

export function previewIdeaImpact(story: Story, intel: VillageContentIntelligence): IdeaImpactPreview {
  const pool = [...getIdeas()]
  let newIdeas = 0
  let strengthenedIdeas = 0
  const touched = new Set<string>()

  for (const lessonText of intel.lessons) {
    const title = lessonText.trim()
    if (!title) continue

    const idx = findIdeaMatch(pool, story, title)
    if (idx !== -1) {
      const idea = pool[idx]
      if (!touched.has(idea.id) && !idea.relatedStoryIds.includes(story.id)) {
        strengthenedIdeas++
        touched.add(idea.id)
      }
      continue
    }

    newIdeas++
    // Simulate the pool gaining this idea so a second similar lesson later in
    // the same draft strengthens it instead of double-counting as new —
    // exactly what syncIdeasFromStory does for real.
    pool.push({
      id: `preview-${newIdeas}`, slug: '', title, description: title, topics: story.topics,
      relatedStoryIds: [story.id],
      relatedFounderIds: story.founderId ? [story.founderId] : [],
      relatedBusinessIds: story.businessId ? [story.businessId] : [],
      featured: false, createdAt: '',
    })
  }

  if (!story.founderId) {
    return { newIdeas, strengthenedIdeas, currentAuthorityScore: 0, projectedAuthorityScore: 0, projectedAuthorityDelta: 0 }
  }

  const currentAuthorityScore = getFounders().find((f: Founder) => f.id === story.founderId)?.authorityScore ?? 0
  const projectedIdeas = pool.filter(i => i.relatedFounderIds.includes(story.founderId!))
  const projectedRelationshipStrength = projectedIdeas.reduce((sum, i) => sum + i.relatedStoryIds.length, 0)
  const projectedStoriesPublished = getStories({ founderId: story.founderId, publicOnly: true }).length + (story.status === 'published' ? 0 : 1)
  const projectedBusinessConnections = new Set(projectedIdeas.flatMap(i => i.relatedBusinessIds)).size
  // Editorial recognition and mentions don't change just from drafting — they
  // only move once a story actually publishes (CAPO attaches featured_in;
  // relationshipSync.ts writes mentions). Using the founder's real current
  // counts here keeps the live preview honest rather than guessing at edges
  // this draft hasn't created yet.
  const { featuredInCount, mentionsCount } = graphSignalsFor('founder', story.founderId!)
  const projectedAuthorityScore = scoreFromSignals(
    projectedIdeas.length, projectedRelationshipStrength, projectedStoriesPublished, projectedBusinessConnections,
    featuredInCount, mentionsCount,
  )

  return {
    newIdeas,
    strengthenedIdeas,
    currentAuthorityScore,
    projectedAuthorityScore,
    projectedAuthorityDelta: projectedAuthorityScore - currentAuthorityScore,
  }
}
