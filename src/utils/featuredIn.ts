import { stories }       from '../data/stories'
import { ideas }         from '../data/ideas'
import { founders }      from '../data/founders'
import { businesses }    from '../data/businesses'
import { libraryItems }  from '../data/library'
import { expertiseList } from '../data/expertise'

export interface FeaturedInLocation {
  label: string
  path: string
  type: 'page' | 'profile' | 'listing' | 'detail'
}

export function getFounderFeaturedIn(founderId: string): FeaturedInLocation[] {
  const locs: FeaturedInLocation[] = []
  const founder = founders.find(f => f.id === founderId)

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
  ideas.filter(i => i.relatedFounderIds.includes(founderId)).slice(0, 5)
    .forEach(i => locs.push({ label: `Idea: ${i.title}`, path: `/ideas/${i.slug}`, type: 'detail' }))
  libraryItems.filter(l => l.authorFounderId === founderId)
    .forEach(l => locs.push({ label: `Library: ${l.title}`, path: `/library/${l.slug}`, type: 'detail' }))
  return locs
}

export function getBusinessFeaturedIn(businessId: string): FeaturedInLocation[] {
  const locs: FeaturedInLocation[] = []
  const biz = businesses.find(b => b.id === businessId)

  locs.push({ label: 'Mercato Directory', path: '/mercato', type: 'listing' })
  if (biz) {
    locs.push({ label: 'Business Profile', path: `/businesses/${biz.slug}`, type: 'profile' })
    if (biz.featured) locs.push({ label: 'Village Homepage (featured)', path: '/', type: 'page' })
  }
  const owner = founders.find(f => f.businessId === businessId)
  if (owner) locs.push({ label: `Founder: ${owner.name}`, path: `/founders/${owner.slug}`, type: 'profile' })
  stories.filter(s => s.businessId === businessId)
    .forEach(s => locs.push({ label: `Story: ${s.title}`, path: `/stories/${s.slug}`, type: 'detail' }))
  expertiseList.filter(e => e.businessIds.includes(businessId))
    .forEach(e => locs.push({ label: `Expertise: ${e.name}`, path: `/expertise/${e.slug}`, type: 'page' }))
  return locs
}

export function getStoryFeaturedIn(storyId: string): FeaturedInLocation[] {
  const locs: FeaturedInLocation[] = []
  const story = stories.find(s => s.id === storyId)
  if (!story) return locs

  locs.push({ label: 'Stories Directory', path: '/stories', type: 'listing' })
  locs.push({ label: 'Story Detail Page', path: `/stories/${story.slug}`, type: 'detail' })
  if (story.featured) locs.push({ label: 'Village Homepage (featured)', path: '/', type: 'page' })
  const founder = founders.find(f => f.id === story.founderId)
  if (founder) locs.push({ label: `Founder: ${founder.name}`, path: `/founders/${founder.slug}`, type: 'profile' })
  if (story.businessId) {
    const biz = businesses.find(b => b.id === story.businessId)
    if (biz) locs.push({ label: `Business: ${biz.name}`, path: `/businesses/${biz.slug}`, type: 'profile' })
  }
  libraryItems.filter(l => l.relatedStoryIds?.includes(storyId))
    .forEach(l => locs.push({ label: `Library: ${l.title}`, path: `/library/${l.slug}`, type: 'detail' }))
  expertiseList.filter(e => e.storyIds.includes(storyId))
    .forEach(e => locs.push({ label: `Expertise: ${e.name}`, path: `/expertise/${e.slug}`, type: 'page' }))
  return locs
}

export function getIdeaFeaturedIn(ideaId: string): FeaturedInLocation[] {
  const locs: FeaturedInLocation[] = []
  const idea = ideas.find(i => i.id === ideaId)
  if (!idea) return locs

  locs.push({ label: 'Ideas Directory', path: '/ideas', type: 'listing' })
  locs.push({ label: 'Idea Detail Page', path: `/ideas/${idea.slug}`, type: 'detail' })
  if (idea.featured) locs.push({ label: 'Village Homepage (featured)', path: '/', type: 'page' })
  stories.filter(s => s.ideaIds.includes(ideaId))
    .forEach(s => locs.push({ label: `Story: ${s.title}`, path: `/stories/${s.slug}`, type: 'detail' }))
  expertiseList.filter(e => e.ideaIds.includes(ideaId))
    .forEach(e => locs.push({ label: `Expertise: ${e.name}`, path: `/expertise/${e.slug}`, type: 'page' }))
  return locs
}

export function getLibraryItemFeaturedIn(itemId: string): FeaturedInLocation[] {
  const locs: FeaturedInLocation[] = []
  const item = libraryItems.find(l => l.id === itemId)
  if (!item) return locs

  locs.push({ label: 'Library Directory', path: '/library', type: 'listing' })
  locs.push({ label: 'Library Detail Page', path: `/library/${item.slug}`, type: 'detail' })
  if (item.featured) locs.push({ label: 'Village Homepage (featured)', path: '/', type: 'page' })
  const author = founders.find(f => f.id === item.authorFounderId)
  if (author) locs.push({ label: `Founder: ${author.name}`, path: `/founders/${author.slug}`, type: 'profile' })
  if (item.businessId) {
    const biz = businesses.find(b => b.id === item.businessId)
    if (biz) locs.push({ label: `Business: ${biz.name}`, path: `/businesses/${biz.slug}`, type: 'profile' })
  }
  return locs
}
