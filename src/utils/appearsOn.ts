import { getStories } from '../services/stories'
import { getIdeas } from '../services/ideas'
import { getFounders } from '../services/founders'
import { getBusinesses } from '../services/businesses'
import { getLibraryItems } from '../services/library'
import { expertiseList } from '../data/expertise'
import type { Story } from '../types'

export interface AppearsOnLocation {
  label: string
  path: string
  type: 'page' | 'profile' | 'listing' | 'detail'
  // Stable id a founder's hiddenLocations array references — undefined for
  // entries that can't be individually turned off (the piece's own detail
  // page, and structural/curated links like Expertise or Library mentions).
  key?: string
  hidden?: boolean
}

export function getFounderAppearsOn(founderId: string): AppearsOnLocation[] {
  const locs: AppearsOnLocation[] = []
  const founder = getFounders().find(f => f.id === founderId)
  const stories = getStories()

  locs.push({ label: 'Founders Directory', path: '/founders', type: 'listing' })
  if (founder) {
    locs.push({ label: 'Founder Profile', path: `/founders/${founder.slug}`, type: 'profile' })
    if (founder.featured) locs.push({ label: 'Village Homepage (featured)', path: '/', type: 'page' })
    founder.expertiseIds?.forEach(eid => {
      const exp = expertiseList.find(e => e.id === eid)
      if (exp) locs.push({ label: `Expertise: ${exp.name}`, path: `/expertise/${exp.slug}`, type: 'page' })
    })
  }
  stories.filter(s => s.founderId === founderId)
    .forEach(s => locs.push({ label: `Story: ${s.title}`, path: `/stories/${s.slug}`, type: 'detail' }))
  getIdeas({ founderId }).slice(0, 5)
    .forEach(i => locs.push({ label: `Idea: ${i.title}`, path: `/ideas/${i.slug}`, type: 'detail' }))
  getLibraryItems().filter(l => l.authorFounderId === founderId)
    .forEach(l => locs.push({ label: `Library: ${l.title}`, path: `/library/${l.slug}`, type: 'detail' }))
  return locs
}

export function getBusinessAppearsOn(businessId: string): AppearsOnLocation[] {
  const locs: AppearsOnLocation[] = []
  const businesses = getBusinesses()
  const biz = businesses.find(b => b.id === businessId)
  const founders = getFounders()

  locs.push({ label: 'Mercato Directory', path: '/mercato', type: 'listing' })
  if (biz) {
    locs.push({ label: 'Business Profile', path: `/businesses/${biz.slug}`, type: 'profile' })
    if (biz.featured) locs.push({ label: 'Village Homepage (featured)', path: '/', type: 'page' })
  }
  const owner = founders.find(f => f.businessId === businessId)
  if (owner) locs.push({ label: `Founder: ${owner.name}`, path: `/founders/${owner.slug}`, type: 'profile' })
  getStories({ businessId })
    .forEach(s => locs.push({ label: `Story: ${s.title}`, path: `/stories/${s.slug}`, type: 'detail' }))
  expertiseList.filter(e => e.businessIds.includes(businessId))
    .forEach(e => locs.push({ label: `Expertise: ${e.name}`, path: `/expertise/${e.slug}`, type: 'page' }))
  return locs
}

/**
 * Every location this story is currently eligible to appear in, live from
 * the real database — not the seed/demo data. A location only carries a
 * `key` (and is toggleable in the dashboard) when it's a real distribution
 * channel a founder might reasonably want to opt out of one at a time while
 * staying published everywhere else; `hiddenLocations` on the Story is the
 * source of truth for which of those are currently turned off.
 */
export function getStoryAppearsOn(storyOrId: Story | string): AppearsOnLocation[] {
  const locs: AppearsOnLocation[] = []
  const story = typeof storyOrId === 'string' ? getStories().find(s => s.id === storyOrId) : storyOrId
  if (!story) return locs
  const storyId = story.id

  const hidden = new Set(story.hiddenLocations ?? [])

  locs.push({ label: 'Story Detail Page', path: `/stories/${story.slug}`, type: 'detail' })
  locs.push({ label: 'Stories Directory', path: '/stories', type: 'listing', key: 'directory', hidden: hidden.has('directory') })
  if (story.featured) {
    locs.push({ label: 'Village Homepage (featured)', path: '/', type: 'page', key: 'homepage', hidden: hidden.has('homepage') })
  }
  const founder = getFounders().find(f => f.id === story.founderId)
  if (founder) {
    locs.push({ label: `Founder: ${founder.name}`, path: `/founders/${founder.slug}`, type: 'profile', key: 'founder-profile', hidden: hidden.has('founder-profile') })
  }
  if (story.businessId) {
    const biz = getBusinesses().find(b => b.id === story.businessId)
    if (biz) locs.push({ label: `Business: ${biz.name}`, path: `/businesses/${biz.slug}`, type: 'profile', key: 'business-profile', hidden: hidden.has('business-profile') })
  }
  locs.push({ label: 'Related Stories (on other pages)', path: `/stories/${story.slug}`, type: 'page', key: 'related', hidden: hidden.has('related') })
  getLibraryItems().filter(l => l.relatedStoryIds?.includes(storyId))
    .forEach(l => locs.push({ label: `Library: ${l.title}`, path: `/library/${l.slug}`, type: 'detail' }))
  expertiseList.filter(e => e.storyIds.includes(storyId))
    .forEach(e => locs.push({ label: `Expertise: ${e.name}`, path: `/expertise/${e.slug}`, type: 'page' }))
  return locs
}

export function getIdeaAppearsOn(ideaId: string): AppearsOnLocation[] {
  const locs: AppearsOnLocation[] = []
  const idea = getIdeas().find(i => i.id === ideaId)
  if (!idea) return locs

  locs.push({ label: 'Ideas Directory', path: '/ideas', type: 'listing' })
  locs.push({ label: 'Idea Detail Page', path: `/ideas/${idea.slug}`, type: 'detail' })
  if (idea.featured) locs.push({ label: 'Village Homepage (featured)', path: '/', type: 'page' })
  getStories().filter(s => s.ideaIds.includes(ideaId))
    .forEach(s => locs.push({ label: `Story: ${s.title}`, path: `/stories/${s.slug}`, type: 'detail' }))
  expertiseList.filter(e => e.ideaIds.includes(ideaId))
    .forEach(e => locs.push({ label: `Expertise: ${e.name}`, path: `/expertise/${e.slug}`, type: 'page' }))
  return locs
}

export function getLibraryItemAppearsOn(itemId: string): AppearsOnLocation[] {
  const locs: AppearsOnLocation[] = []
  const item = getLibraryItems().find(l => l.id === itemId)
  if (!item) return locs

  locs.push({ label: 'Library Directory', path: '/library', type: 'listing' })
  locs.push({ label: 'Library Detail Page', path: `/library/${item.slug}`, type: 'detail' })
  if (item.featured) locs.push({ label: 'Village Homepage (featured)', path: '/', type: 'page' })
  const author = getFounders().find(f => f.id === item.authorFounderId)
  if (author) locs.push({ label: `Founder: ${author.name}`, path: `/founders/${author.slug}`, type: 'profile' })
  if (item.businessId) {
    const biz = getBusinesses().find(b => b.id === item.businessId)
    if (biz) locs.push({ label: `Business: ${biz.name}`, path: `/businesses/${biz.slug}`, type: 'profile' })
  }
  return locs
}
