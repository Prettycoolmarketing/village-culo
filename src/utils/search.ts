import { stories }    from '../data/stories'
import { founders }   from '../data/founders'
import { ideas }      from '../data/ideas'
import { businesses } from '../data/businesses'
import { events }     from '../data/events'
import type { Story, Founder, Idea, Business, Event } from '../types'

export interface SearchResults {
  stories:    Story[]
  founders:   Founder[]
  ideas:      Idea[]
  businesses: Business[]
  events:     Event[]
}

// Joins all defined fields into one lowercase string for substring matching
function searchable(fields: (string | undefined | null)[]): string {
  return fields.filter((f): f is string => Boolean(f)).join(' ').toLowerCase()
}

export function searchVillage(query: string): SearchResults {
  // Empty query — return everything so Archive doubles as a full browser
  if (!query.trim()) {
    return {
      stories:    [...stories],
      founders:   [...founders],
      ideas:      [...ideas],
      businesses: [...businesses],
      events:     [...events],
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

    ideas: ideas.filter(i => {
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
  }
}

export function totalResults(results: SearchResults): number {
  return (
    results.stories.length +
    results.founders.length +
    results.ideas.length +
    results.businesses.length +
    results.events.length
  )
}
