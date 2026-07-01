import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { DEFAULT_VILLAGE_SETTINGS } from '../types/villageSettings'
import type { VillageSettings } from '../types/villageSettings'

const KEY = 'culo_v1_village_settings'

export const villageSettingsService = {
  get(): VillageSettings {
    try {
      const raw = localStorage.getItem(KEY)
      if (!raw) return { ...DEFAULT_VILLAGE_SETTINGS }
      return { ...DEFAULT_VILLAGE_SETTINGS, ...(JSON.parse(raw) as Partial<VillageSettings>) }
    } catch {
      return { ...DEFAULT_VILLAGE_SETTINGS }
    }
  },

  /** Called by publicSync after fetching the public `village_settings` row, so the cache reflects Supabase rather than only ever-cached local edits. */
  cacheFromRemote(remote: Partial<VillageSettings>): void {
    localStorage.setItem(KEY, JSON.stringify({ ...DEFAULT_VILLAGE_SETTINGS, ...remote }))
  },

  async save(settings: VillageSettings): Promise<{ success: boolean; error?: string }> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('village_settings')
        .upsert({ id: 'default', data: settings }, { onConflict: 'id' })
      if (error) return { success: false, error: error.message }
    }
    localStorage.setItem(KEY, JSON.stringify(settings))
    return { success: true }
  },

  async reset(): Promise<{ success: boolean; error?: string }> {
    localStorage.removeItem(KEY)
    return this.save({ ...DEFAULT_VILLAGE_SETTINGS })
  },
}
