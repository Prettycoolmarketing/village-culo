import { getStories } from './stories'
import { getBusinesses } from './businesses'
import { programService, publisherPartnerProfileService, recommendationService } from './partnership'
import type { Recommendation, DisclosureType } from '../types/partnership'

// ─── Constants ────────────────────────────────────────────────────────────────

export const DEFAULT_DISCLOSURE =
  "This may include a recommendation or commercial relationship. I only share tools, businesses or opportunities I genuinely believe are relevant."

const MIN_NAME_LENGTH = 4  // avoid single-word false positives like "AI" or "PCM"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function countMatches(text: string, term: string): number {
  if (!term || term.length < MIN_NAME_LENGTH) return 0
  try {
    const re = new RegExp(escapeRegex(term), 'gi')
    return (text.match(re) ?? []).length
  } catch {
    return 0
  }
}

function extractContext(text: string, term: string, radius = 80): string {
  const idx = text.toLowerCase().indexOf(term.toLowerCase())
  if (idx === -1) return ''
  const start = Math.max(0, idx - radius)
  const end   = Math.min(text.length, idx + term.length + radius)
  const snip  = text.slice(start, end).trim()
  return `${start > 0 ? '…' : ''}${snip}${end < text.length ? '…' : ''}`
}

function hasPositiveContext(text: string, term: string, radius = 150): boolean {
  const idx = text.toLowerCase().indexOf(term.toLowerCase())
  if (idx === -1) return false
  const snippet = text.slice(Math.max(0, idx - radius), idx + term.length + radius).toLowerCase()
  const signals = [
    'recommend', 'use ', 'using', 'love', 'great', 'best', 'amazing',
    'fantastic', 'excellent', 'helpful', 'trust', 'favourite', 'favorite',
    'rely on', 'switched to', 'moved to', 'built on', 'built with',
    'built inside', 'runs on', 'powered by', 'inside canva',
  ]
  return signals.some(w => snippet.includes(w))
}

function disclosureTypeForProgram(bizId: string): DisclosureType {
  const programs = programService.getAll({ businessId: bizId, status: 'active' })
  if (!programs.length) return 'none'
  const type = programs[0].disclosureType
  return type
}

// ─── Duplicate check ──────────────────────────────────────────────────────────

// `pending` covers recommendations already queued earlier in the same run but not
// yet written (writes are now batched at the end of runDetection) — without this,
// pass 2 wouldn't see what pass 1 just queued for the same story.
function alreadyDetected(founderId: string, storyId: string, entityName: string, pending: Recommendation[]): boolean {
  const name = entityName.toLowerCase()
  return (
    recommendationService.getAll({ founderId, storyId }).some(r => r.entityName.toLowerCase() === name) ||
    pending.some(r => r.founderId === founderId && r.storyId === storyId && r.entityName.toLowerCase() === name)
  )
}

// ─── Detection result ─────────────────────────────────────────────────────────

export interface DetectionResult {
  detected: number
  skipped:  number
  stories:  number
  error?:   string
}

// ─── Main Detection Function ──────────────────────────────────────────────────
// Collects every detected recommendation and writes them in one batch at the end
// instead of one Supabase round-trip + cache rewrite per mention — a single scan
// across many stories could otherwise mean dozens of individual writes.

export async function runDetection(founderId: string): Promise<DetectionResult> {
  const stories     = getStories({ founderId })
  const businesses  = getBusinesses()
  const profile     = publisherPartnerProfileService.get(founderId)
  const genuineSet  = new Set(
    (profile?.genuineRecommendations ?? []).map(r => r.toLowerCase().trim())
  )

  let detected = 0
  let skipped  = 0
  const ts     = new Date().toISOString()
  const toWrite: Recommendation[] = []

  for (const story of stories) {
    const text = [story.title, story.summary, story.blog ?? ''].join(' ')

    // ── Pass 1: match against known businesses ─────────────────────────────

    for (const biz of businesses) {
      const name = biz.name?.trim()
      if (!name || name.length < MIN_NAME_LENGTH) continue

      if (alreadyDetected(founderId, story.id, name, toWrite)) { skipped++; continue }

      const matchCount = countMatches(text, name)
      if (matchCount === 0) continue

      const isGenuine  = genuineSet.has(name.toLowerCase())
      const hasPositive = hasPositiveContext(text, name)
      const context    = extractContext(text, name)

      let confidence: number
      let reason: string

      if (isGenuine && matchCount >= 2) {
        confidence = 0.92
        reason = `"${name}" is in your Genuine Recommendations list and appears ${matchCount} times in this story.`
      } else if (isGenuine) {
        confidence = 0.87
        reason = `"${name}" is in your Genuine Recommendations list and was mentioned in this story.`
      } else if (matchCount >= 3) {
        confidence = 0.82
        reason = `"${name}" was mentioned ${matchCount} times across this story — a strong signal.`
      } else if (matchCount >= 2) {
        confidence = 0.72
        reason = `"${name}" appeared ${matchCount} times in this story.`
      } else if (hasPositive) {
        confidence = 0.62
        reason = `"${name}" was mentioned once in a positive context in this story.`
      } else {
        confidence = 0.38
        reason = `"${name}" was mentioned once in this story — check if this is a genuine recommendation.`
      }

      const rec: Recommendation = {
        id:               crypto.randomUUID(),
        slug:             `${story.id}-${biz.id}-${Date.now()}`,
        founderId,
        storyId:          story.id,
        businessId:       biz.id,
        entityName:       name,
        entityType:       'business',
        status:           'pending_review',
        mentionType:      isGenuine ? 'recommendation' : (hasPositive ? 'experience' : 'reference'),
        confidence,
        confidenceReason: reason,
        detectedAt:       ts,
        detectedInContext: context || undefined,
        disclosureType:   disclosureTypeForProgram(biz.id),
        disclosureText:   DEFAULT_DISCLOSURE,
        disclosureVisible: false,
        featured:         false,
        visibility:       'system',
        createdAt:        ts,
        updatedAt:        ts,
      }

      toWrite.push(rec)
      detected++
    }

    // ── Pass 2: genuineRecommendations not matched to any known business ──

    for (const genRec of profile?.genuineRecommendations ?? []) {
      const term = genRec.trim()
      if (!term || term.length < MIN_NAME_LENGTH) continue

      // Skip if already captured via business match
      if (alreadyDetected(founderId, story.id, term, toWrite)) continue

      const matchCount = countMatches(text, term)
      if (matchCount === 0) continue

      const context = extractContext(text, term)

      const confidence = matchCount >= 2 ? 0.88 : 0.80
      const reason = matchCount >= 2
        ? `"${term}" is in your Genuine Recommendations list and appears ${matchCount} times in this story.`
        : `"${term}" is in your Genuine Recommendations list and was mentioned in this story.`

      const rec: Recommendation = {
        id:               crypto.randomUUID(),
        slug:             `${story.id}-${term.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`,
        founderId,
        entityName:       term,
        entityType:       'software',
        storyId:          story.id,
        status:           'pending_review',
        mentionType:      'recommendation',
        confidence,
        confidenceReason: reason,
        detectedAt:       ts,
        detectedInContext: context || undefined,
        disclosureType:   'none',
        disclosureText:   DEFAULT_DISCLOSURE,
        disclosureVisible: false,
        featured:         false,
        visibility:       'system',
        createdAt:        ts,
        updatedAt:        ts,
      }

      toWrite.push(rec)
      detected++
    }
  }

  if (toWrite.length > 0) {
    const result = await recommendationService.upsertBatch(toWrite)
    if (!result.success) {
      return { detected: 0, skipped, stories: stories.length, error: result.error ?? 'Failed to save detected recommendations.' }
    }
  }

  return { detected, skipped, stories: stories.length }
}
