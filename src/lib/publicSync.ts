import { supabase } from './supabase'
import { store } from './store'
import type { Story, Founder, Business } from '../types'

function mergeIntoStore<T extends { id: string }>(key: string, remote: T[]): void {
  if (remote.length === 0) return
  const local  = store.get<T>(key) ?? []
  const merged = [...local]
  for (const item of remote) {
    const idx = merged.findIndex(l => l.id === item.id)
    if (idx >= 0) merged[idx] = item
    else merged.push(item)
  }
  store.set(key, merged)
}

// Fetches all published/featured content from Supabase (no user filter — uses public read policies).
// Called once on app init so Village public pages show real Supabase data, not just seed data.
export async function syncPublishedContent(): Promise<void> {
  if (!supabase) return

  const [stories, founders, businesses] = await Promise.all([
    supabase.from('stories').select('data').in('status', ['published', 'featured']),
    supabase.from('founders').select('data').in('status', ['published', 'featured']),
    supabase.from('businesses').select('data').in('status', ['published', 'featured']),
  ])

  if (stories.data?.length)    mergeIntoStore<Story>('stories',       stories.data.map(r => r.data as Story))
  if (founders.data?.length)   mergeIntoStore<Founder>('founders',   founders.data.map(r => r.data as Founder))
  if (businesses.data?.length) mergeIntoStore<Business>('businesses', businesses.data.map(r => r.data as Business))
}
