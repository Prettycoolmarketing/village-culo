import { getStories }       from '../services/stories'
import { getFounders }      from '../services/founders'
import { getBusinesses }    from '../services/businesses'
import { getEvents }        from '../services/events'
import { getLibraryItems }  from '../services/library'
import { getIdeas }         from '../services/ideas'
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
  const allStories    = getStories()
  const allFounders   = getFounders()
  const allBusinesses = getBusinesses()
  const publicIdeas   = getIdeas({ publicOnly: true })
  const allEvents     = getEvents()
  const libraryItems  = getLibraryItems()

  // Build ID → object maps for cross-type lookups
  const founderMap  = new Map(allFounders.map(f  => [f.id,  f]))
  const businessMap = new Map(allBusinesses.map(b => [b.id, b]))

  // A curated batch often brings a business in alongside the founder even
  // when there's nothing real behind it yet (see DEFAULT_IMPORT_OPTIONS'
  // createBusinesses comment) — fine to keep on the founder record, but it
  // has no business reading as a real, standalone business page in a
  // public browse/search surface until the founder has actually claimed
  // their profile.
  function isRealBusiness(b: Business): boolean {
    const f = founderMap.get(b.founderId)
    return !f || f.profileStatus !== 'village-curated' || !!f.userId
  }

  // "not archived" alone isn't "published" — a draft only ever reached this
  // local cache via an admin/owner RLS pull in the first place (an
  // anonymous visitor's own cache never has it), but a CAPO staff member's
  // own browsing session does, so Archive must still filter it out itself
  // rather than leaning on RLS to have already done it.
  function isPublic(item: { status: string }): boolean {
    return item.status === 'published' || item.status === 'featured'
  }

  // Empty query — return everything so Archive doubles as a full browser
  if (!query.trim()) {
    return {
      stories:    allStories.filter(isPublic),
      founders:   allFounders.filter(isPublic),
      ideas:      publicIdeas,
      businesses: allBusinesses.filter(b => isPublic(b) && isRealBusiness(b)),
      events:     [...allEvents],
      library:    libraryItems.filter(l => l.status !== 'archived'),
    }
  }

  const q = query.trim().toLowerCase()

  return {
    stories: allStories.filter(s => {
      if (!isPublic(s)) return false
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

    founders: allFounders.filter(f => {
      if (!isPublic(f)) return false
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

    businesses: allBusinesses.filter(b => {
      if (!isPublic(b) || !isRealBusiness(b)) return false
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

    events: allEvents.filter(e =>
      searchable([
        e.title, e.description,
        e.location?.name, e.location?.state,
        e.type,
      ]).includes(q)
    ),

    library: libraryItems.filter(l => {
      if (l.status === 'archived') return false
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
