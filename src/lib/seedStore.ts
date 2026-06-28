import { store } from './store'
import { founders }     from '../data/founders'
import { businesses }   from '../data/businesses'
import { stories }      from '../data/stories'
import { ideas }        from '../data/ideas'
import { mediaItems }   from '../data/media'
import { libraryItems } from '../data/library'
import { services }     from '../data/services'
import { events }       from '../data/events'

export function seedStore(): void {
  if (store.isSeeded()) return
  store.set('founders',   founders)
  store.set('businesses', businesses)
  store.set('stories',    stories)
  store.set('ideas',      ideas)
  store.set('media',      mediaItems)
  store.set('library',    libraryItems)
  store.set('services',   services)
  store.set('events',     events)
  store.markSeeded()
}

export function resetAndReseed(): void {
  store.resetAll()
  seedStore()
}
