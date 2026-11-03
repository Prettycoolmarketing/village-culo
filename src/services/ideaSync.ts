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

// Ideas are topic-anchored: one Idea per Topic, not one per "lesson
// sentence that happens to resemble another one." The previous design
// matched two founders' raw lesson text against each other with a
// word-overlap similarity score (0.6 threshold) — in practice this almost
// never fired, because two founders describing a similar insight phrase it
// completely differently. Every Idea stayed 1:1 with a single founder's
// single article regardless of how many other founders said something
// related, which is the opposite of what an Idea is supposed to be: a real
// "here's what multiple founders in the Village say about X" page. Topics
// are already structured, shared vocabulary attached to every story — using
// the topic itself as the grouping key, instead of trying to algorithmically
// detect "is this the same idea" from free text, is both more reliable and
// much simpler. See the Idea type's `contributions` field for how each
// founder's individual insight is now kept, attributed, rather than
// collapsed into one shared description/title.

/** Shared matching rule — the one place "is this the same idea?" is decided, used by both the real sync and the read-only preview so they can never disagree. A story with no real topic tagged can't anchor to anything and is skipped entirely (see callers). */
function findIdeaMatch(pool: Idea[], story: Story): number {
  const primaryTopicId = story.topics[0]?.id
  if (!primaryTopicId) return -1
  return pool.findIndex(idea => idea.topics[0]?.id === primaryTopicId)
}

// extractLessons (villageIntelligence.ts) is a keyword-marker sentence
// scanner, not an AI summarizer — it grabs any sentence containing "learned,"
// "realised," etc. verbatim. Most of those are real sentences from a blog,
// not a standalone insight worth its own indexable page: too short to carry
// any content on its own once separated from its paragraph. This is a floor,
// not a rewrite — it can only reject the thinnest fragments, since there's
// no synthesis step here to turn a short one into a longer one.
const MIN_IDEA_LENGTH = 80

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

  const founder = getFounders().find(f => f.id === story.founderId)
  if (!founder) return { created, strengthened }

  const pool = [...getIdeas()]

  const topic = story.topics[0]
  for (const lessonText of intel.lessons) {
    const trimmed = lessonText.trim()
    if (!trimmed || trimmed.length < MIN_IDEA_LENGTH) continue
    // Can't anchor an Idea to a topic that doesn't exist — an untagged
    // story's lessons used to fall back to a generic/title-derived idea of
    // their own; now they're simply not substantial enough to earn a
    // standalone topic page. Tag the story with a real topic instead.
    if (!topic) continue

    const candidateIdx = findIdeaMatch(pool, story)

    if (candidateIdx !== -1) {
      const candidate = pool[candidateIdx]
      const alreadyLinked = candidate.relatedStoryIds.includes(story.id)
      const nextFounders = candidate.relatedFounderIds.includes(story.founderId)
        ? candidate.relatedFounderIds : [...candidate.relatedFounderIds, story.founderId]
      const nextBusinesses = story.businessId && !candidate.relatedBusinessIds.includes(story.businessId)
        ? [...candidate.relatedBusinessIds, story.businessId] : candidate.relatedBusinessIds
      // One contribution per (founder, story) pair — a second lesson from
      // the same story shouldn't duplicate the same person's entry twice.
      const hasContribution = (candidate.contributions ?? []).some(c => c.founderId === story.founderId && c.storyId === story.id)
      const nextContributions = hasContribution
        ? candidate.contributions
        : [...(candidate.contributions ?? []), { founderId: story.founderId, storyId: story.id, quote: trimmed }]

      if (alreadyLinked && hasContribution && nextFounders.length === candidate.relatedFounderIds.length && nextBusinesses.length === candidate.relatedBusinessIds.length) {
        continue // this exact story already strengthened this idea — no-op, not a re-count
      }

      const next: Idea = {
        ...candidate,
        relatedStoryIds: alreadyLinked ? candidate.relatedStoryIds : [...candidate.relatedStoryIds, story.id],
        relatedFounderIds: nextFounders,
        relatedBusinessIds: nextBusinesses,
        contributions: nextContributions,
      }
      const result = await updateIdea(next)
      if (result.success) {
        strengthened.push(next)
        pool[candidateIdx] = next
      }
      continue
    }

    // Stable, deterministic per topic — not time-suffixed — so the same
    // topic always resolves to the same Idea id/slug across runs, and two
    // stories tagged with the same topic (even if sync somehow ran for both
    // before either landed in `pool`) can never silently create duplicate
    // topic pages for the same topic.
    const id = `idea-${slugify(topic.name).slice(0, 40) || topic.id}`
    const newIdea: Idea = {
      id,
      slug: slugify(topic.name) || id,
      title: topic.name,
      description: trimmed,
      topics: [topic],
      relatedStoryIds: [story.id],
      relatedFounderIds: [story.founderId],
      relatedBusinessIds: story.businessId ? [story.businessId] : [],
      contributions: [{ founderId: story.founderId, storyId: story.id, quote: trimmed }],
      featured: false,
      // Auto-extracted from a keyword-marker scan, not written or reviewed
      // by anyone — lands as a draft so a real person has to actually look
      // at it and decide it's worth its own page before it goes public,
      // instead of every "I realised..." sentence in a blog silently
      // becoming a live, indexable Idea the moment the story publishes.
      status: 'draft',
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
    const trimmed = lessonText.trim()
    if (!trimmed || trimmed.length < MIN_IDEA_LENGTH) continue
    if (!story.topics[0]) continue // same "needs a real topic to anchor to" rule as the real sync

    const idx = findIdeaMatch(pool, story)
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
    // exactly what syncIdeasFromStory does for real. This preview never
    // displays a title (only the newIdeas/strengthenedIdeas counts above
    // are shown), so a real templated title isn't worth building here.
    pool.push({
      id: `preview-${newIdeas}`, slug: '', title: trimmed, description: trimmed, topics: story.topics,
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
