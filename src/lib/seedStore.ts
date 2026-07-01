import { store } from './store'
import { isSupabaseConfigured } from './supabase'
import { founders }     from '../data/founders'
import { businesses }   from '../data/businesses'
import { stories }      from '../data/stories'
import { ideas }        from '../data/ideas'
import { mediaItems }   from '../data/media'
import { libraryItems } from '../data/library'
import { services }     from '../data/services'
import { events }       from '../data/events'

// Dev-mode-only bootstrap. Once Supabase is configured, the cache is populated by
// sync.ts/publicSync.ts from real data — seeding demo content in production would
// mean an empty/new install silently displays the original seed founder as if it
// were live data (the exact "silent seed fallback" the Sprint 19B audit flagged).
export function seedStore(): void {
  if (isSupabaseConfigured) return
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
