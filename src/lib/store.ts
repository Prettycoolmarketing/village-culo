const PREFIX    = 'culo_v1_'
const SEED_FLAG = 'culo_seeded_v1'

export const store = {
  get<T>(key: string): T[] | null {
    try {
      const raw = localStorage.getItem(PREFIX + key)
      return raw ? (JSON.parse(raw) as T[]) : null
    } catch {
      return null
    }
  },

  set<T>(key: string, items: T[]): void {
    localStorage.setItem(PREFIX + key, JSON.stringify(items))
  },

  update<T extends { id: string }>(key: string, item: T): void {
    const items = (this.get<T>(key) ?? []) as T[]
    const idx   = items.findIndex(i => i.id === item.id)
    if (idx >= 0) items[idx] = item
    else items.push(item)
    this.set(key, items)
  },

  isSeeded(): boolean {
    return localStorage.getItem(SEED_FLAG) === '1'
  },

  markSeeded(): void {
    localStorage.setItem(SEED_FLAG, '1')
  },

  resetAll(): void {
    Object.keys(localStorage)
      .filter(k => k.startsWith(PREFIX))
      .forEach(k => localStorage.removeItem(k))
    localStorage.removeItem(SEED_FLAG)
  },
}
