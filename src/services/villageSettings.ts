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

  save(settings: VillageSettings): void {
    localStorage.setItem(KEY, JSON.stringify(settings))
  },

  reset(): void {
    localStorage.removeItem(KEY)
  },
}
