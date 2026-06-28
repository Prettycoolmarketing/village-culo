import { supabase } from './supabase'
import { store } from './store'
import type { Story, Founder, Business, LibraryItem, Service } from '../types'

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

export async function syncUserDataFromSupabase(userId: string): Promise<void> {
  if (!supabase) return

  const [founders, businesses, stories, library, services] = await Promise.all([
    supabase.from('founders').select('data').eq('user_id', userId),
    supabase.from('businesses').select('data').eq('user_id', userId),
    supabase.from('stories').select('data').eq('user_id', userId),
    supabase.from('library_items').select('data').eq('user_id', userId),
    supabase.from('services').select('data').eq('user_id', userId),
  ])

  if (founders.data)   mergeIntoStore<Founder>('founders',   founders.data.map(r => r.data as Founder))
  if (businesses.data) mergeIntoStore<Business>('businesses', businesses.data.map(r => r.data as Business))
  if (stories.data)    mergeIntoStore<Story>('stories',       stories.data.map(r => r.data as Story))
  if (library.data)    mergeIntoStore<LibraryItem>('library', library.data.map(r => r.data as LibraryItem))
  if (services.data)   mergeIntoStore<Service>('services',    services.data.map(r => r.data as Service))
}
