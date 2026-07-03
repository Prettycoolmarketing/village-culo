// Village Graph — Sprint B (Graph Population).
//
// Formalizes the Publish flow's existing "mentions" mechanism (Village
// Intelligence's relatedFounderIds/relatedBusinessIds, curated by the founder
// via extraBusinessIds/excludedBusinessIds) into real, queryable `mentions`
// edges in the relationships table, instead of only living inside a
// village_content_intelligence JSON blob. No new detection logic — this reads
// the exact same merged output the Publish flow already computes and reconciles
// it into edges (create what's missing, remove what's no longer mentioned).
//
// The story's own author/business stay as the existing founder_id/business_id
// foreign keys and never become a `mentions` edge to themselves.

import type { Story } from '../types'
import type { VillageContentIntelligence } from '../types/villageIntelligence'
import { relationshipService } from './relationships'

export async function syncRelationshipsFromStory(story: Story, intel: VillageContentIntelligence): Promise<void> {
  const desiredFounderIds = intel.relatedFounderIds.filter(fid => fid !== story.founderId)
  const desiredBusinessIds = intel.relatedBusinessIds.filter(bid => bid !== story.businessId)

  const existing = relationshipService.getRelated('story', story.id)
    .filter(r => r.fromType === 'story' && r.fromId === story.id && r.relationshipType === 'mentions')

  const existingFounderEdges = existing.filter(r => r.toType === 'founder')
  const existingBusinessEdges = existing.filter(r => r.toType === 'business')

  const toCreate: Array<{ toType: 'founder' | 'business'; toId: string }> = [
    ...desiredFounderIds.filter(fid => !existingFounderEdges.some(e => e.toId === fid)).map(toId => ({ toType: 'founder' as const, toId })),
    ...desiredBusinessIds.filter(bid => !existingBusinessEdges.some(e => e.toId === bid)).map(toId => ({ toType: 'business' as const, toId })),
  ]

  const toRemove = [
    ...existingFounderEdges.filter(e => !desiredFounderIds.includes(e.toId)),
    ...existingBusinessEdges.filter(e => !desiredBusinessIds.includes(e.toId)),
  ]

  await Promise.all([
    ...toCreate.map(({ toType, toId }) =>
      relationshipService.create({
        fromType: 'story',
        fromId: story.id,
        toType,
        toId,
        relationshipType: 'mentions',
        why: `Mentioned in the story "${story.title}"`,
        origin: 'village_intelligence',
      })
    ),
    ...toRemove.map(edge => relationshipService.remove(edge.id)),
  ])
}
