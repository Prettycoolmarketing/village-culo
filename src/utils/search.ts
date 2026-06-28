import { stories }      from '../data/stories'
import { founders }     from '../data/founders'
import { businesses }   from '../data/businesses'
import { events }       from '../data/events'
import { libraryItems } from '../data/library'
import { getIdeas }     from '../services/ideas'
import type { Story, Founder, Idea, Business, Event, LibraryItem } from '../types'

export interface SearchResults {
  stories:    Story[]
  founders:   Founder[]
  ideas:      Idea[]
  businesses: Business[]
  events:     Event[]
  library:    LibraryItem[]
}

// Joins all defined fields into one lowercase string for substring matching
function searchable(fields: (string | undefined | null)[]): string {
  return fields.filter((f): f is string => Boolean(f)).join(' ').toLowerCase()
}

export function searchVillage(query: string): SearchResults {
  const publicIdeas = getIdeas({ publicOnly: true })

  // Empty query — return everything so Archive doubles as a full browser
  if (!query.trim()) {
    return {
      stories:    [...stories],
      founders:   [...founders],
      ideas:      publicIdeas,
      businesses: [...businesses],
      events:     [...events],
      library:    [...libraryItems],
    }
  }

  const q = query.trim().toLowerCase()

  // Build ID → object maps for cross-type lookups
  const founderMap  = new Map(founders.map(f  => [f.id,  f]))
  const businessMap = new Map(businesses.map(b => [b.id, b]))

  return {
    stories: stories.filter(s => {
      const f = founderMap.get(s.founderId)
      const b = businessMap.get(s.businessId)
      return searchable([
        s.title, s.summary,
        s.location.name, s.location.state,
        s.industry.name,
        ...s.topics.map(t => t.name),
        ...s.contentTypes,
        f?.name, b?.name,
      ]).includes(q)
    }),

    founders: founders.filter(f => {
      const b = businessMap.get(f.businessId)
      return searchable([
        f.name, f.bio,
        f.location.name, f.location.state,
        f.industry.name,
        ...f.topics.map(t => t.name),
        b?.name,
      ]).includes(q)
    }),

    ideas: publicIdeas.filter(i => {
      const relatedNames = i.relatedFounderIds.map(id => founderMap.get(id)?.name ?? '')
      return searchable([
        i.title, i.description, i.quote ?? '',
        ...i.topics.map(t => t.name),
        ...relatedNames,
      ]).includes(q)
    }),

    businesses: businesses.filter(b => {
      const f = founderMap.get(b.founderId)
      return searchable([
        b.name, b.tagline, b.description,
        b.location.name, b.location.state,
        b.industry.name,
        ...b.topics.map(t => t.name),
        ...b.offers.map(o => o.title),
        f?.name,
      ]).includes(q)
    }),

    events: events.filter(e =>
      searchable([
        e.title, e.description,
        e.location?.name, e.location?.state,
        e.type,
      ]).includes(q)
    ),

    library: libraryItems.filter(l => {
      const f = founderMap.get(l.authorFounderId)
      const b = l.businessId ? businessMap.get(l.businessId) : undefined
      return searchable([
        l.title, l.subtitle, l.description, l.why ?? '',
        l.productType,
        l.location?.name, l.location?.state,
        ...l.topics.map(t => t.name),
        f?.name, b?.name,
      ]).includes(q)
    }),
  }
}

export function totalResults(results: SearchResults): number {
  return (
    results.stories.length +
    results.founders.length +
    results.ideas.length +
    results.businesses.length +
    results.events.length +
    results.library.length
  )
}
