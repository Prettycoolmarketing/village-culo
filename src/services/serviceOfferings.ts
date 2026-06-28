import { services as staticData } from '../data/services'
import { store } from '../lib/store'
import { isSupabaseConfigured } from '../lib/supabase'
import { dbUpsertService } from '../lib/db'
import type { Service } from '../types'

const KEY = 'services'

function live(): Service[] {
  return store.get<Service>(KEY) ?? staticData
}

export function getServices(founderId?: string, businessId?: string): Service[] {
  let result = live()
  if (founderId)  result = result.filter(s => s.founderId === founderId)
  if (businessId) result = result.filter(s => s.businessId === businessId)
  return result
}

export function getService(id: string): Service | undefined {
  return live().find(s => s.id === id)
}

export function updateService(service: Service): void {
  store.update<Service>(KEY, service)
  if (isSupabaseConfigured) void dbUpsertService(service)
}
