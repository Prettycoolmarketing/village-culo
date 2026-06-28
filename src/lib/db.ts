import { supabase } from './supabase'
import type { Story, Founder, Business, LibraryItem, Service } from '../types'

async function currentUserId(): Promise<string | null> {
  if (!supabase) return null
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id ?? null
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export async function dbGetStoriesByUser(userId: string): Promise<Story[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('stories')
    .select('data')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error || !data) return []
  return data.map(r => r.data as Story)
}

export async function dbUpsertStory(story: Story): Promise<void> {
  if (!supabase) return
  const uid = await currentUserId()
  if (!uid) return
  await supabase.from('stories').upsert({
    id:         story.id,
    user_id:    uid,
    founder_id: story.founderId,
    status:     story.status,
    featured:   story.featured,
    data:       story,
  }, { onConflict: 'id' })
}

// ─── Founders ─────────────────────────────────────────────────────────────────

export async function dbGetFoundersByUser(userId: string): Promise<Founder[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('founders')
    .select('data')
    .eq('user_id', userId)
  if (error || !data) return []
  return data.map(r => r.data as Founder)
}

export async function dbUpsertFounder(founder: Founder): Promise<void> {
  if (!supabase) return
  const uid = await currentUserId()
  if (!uid) return
  await supabase.from('founders').upsert({
    id:       founder.id,
    user_id:  uid,
    status:   founder.status,
    featured: founder.featured,
    data:     founder,
  }, { onConflict: 'id' })
}

// ─── Businesses ───────────────────────────────────────────────────────────────

export async function dbGetBusinessesByUser(userId: string): Promise<Business[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('businesses')
    .select('data')
    .eq('user_id', userId)
  if (error || !data) return []
  return data.map(r => r.data as Business)
}

export async function dbUpsertBusiness(business: Business): Promise<void> {
  if (!supabase) return
  const uid = await currentUserId()
  if (!uid) return
  await supabase.from('businesses').upsert({
    id:         business.id,
    user_id:    uid,
    founder_id: business.founderId,
    status:     business.status,
    featured:   business.featured,
    data:       business,
  }, { onConflict: 'id' })
}

// ─── Library ──────────────────────────────────────────────────────────────────

export async function dbGetLibraryByUser(userId: string): Promise<LibraryItem[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('library_items')
    .select('data')
    .eq('user_id', userId)
  if (error || !data) return []
  return data.map(r => r.data as LibraryItem)
}

export async function dbUpsertLibraryItem(item: LibraryItem): Promise<void> {
  if (!supabase) return
  const uid = await currentUserId()
  if (!uid) return
  await supabase.from('library_items').upsert({
    id:         item.id,
    user_id:    uid,
    founder_id: item.authorFounderId,
    status:     item.status,
    featured:   item.featured,
    data:       item,
  }, { onConflict: 'id' })
}

// ─── Services ─────────────────────────────────────────────────────────────────

export async function dbGetServicesByUser(userId: string): Promise<Service[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('services')
    .select('data')
    .eq('user_id', userId)
  if (error || !data) return []
  return data.map(r => r.data as Service)
}

export async function dbUpsertService(service: Service): Promise<void> {
  if (!supabase) return
  const uid = await currentUserId()
  if (!uid) return
  await supabase.from('services').upsert({
    id:          service.id,
    user_id:     uid,
    founder_id:  service.founderId,
    business_id: service.businessId,
    data:        service,
  }, { onConflict: 'id' })
}
