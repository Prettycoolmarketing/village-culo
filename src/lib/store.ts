const PREFIX    = 'culo_v1_'
const SEED_FLAG = 'culo_seeded_v1'

// In-memory mirror of every cache key, kept in sync with every write below.
// This is now the real source of truth for the current page session —
// localStorage underneath it is a best-effort persistence layer only, not
// the only copy of the data.
//
// Confirmed real and live (Mitchell, Editorial Queue, 2026-11-04): a CAPO/
// admin session caches the WHOLE platform's rows for tables with no
// per-user RLS scope (imported_content alone can run to several thousand
// rows), which can exceed a browser's ~5-10MB per-origin localStorage
// quota — mobile Safari's especially so, and an incognito window imposes
// an even smaller one. The console showed it happening on nearly every
// table at once. Before this fix, `get()` read ONLY from localStorage, so
// when `set()`'s write failed, the correct data — already fetched from the
// server successfully that same session — was simply gone: every read was
// built on top of a failed write, with nothing else keeping it. Reading
// from memory first means a quota failure now only costs the "load
// instantly from last visit" optimization, never correctness within the
// session that actually has the real data.
const memory = new Map<string, unknown[]>()

export const store = {
  get<T>(key: string): T[] | null {
    if (memory.has(key)) return memory.get(key) as T[]
    try {
      const raw = localStorage.getItem(PREFIX + key)
      return raw ? (JSON.parse(raw) as T[]) : null
    } catch {
      return null
    }
  },

  set<T>(key: string, items: T[]): void {
    memory.set(key, items as unknown[])
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(items))
    } catch (err) {
      console.error(`[store] Couldn't persist "${key}" (${items.length} items) to localStorage — likely over the browser's storage quota. Using it for this session only; it won't load instantly next time without a fresh sync.`, err)
    }
  },

  update<T extends { id: string }>(key: string, item: T): void {
    const items = (this.get<T>(key) ?? []) as T[]
    const idx   = items.findIndex(i => i.id === item.id)
    if (idx >= 0) items[idx] = item
    else items.push(item)
    this.set(key, items)
  },

  /**
   * Upserts many items in one read-modify-write cycle instead of one per item.
   * `store.update()` called N times in a loop reads, scans and rewrites the
   * *entire* collection N times (O(n²) for an N-item bulk action) — this does it
   * once. Use this for any bulk/multi-select action.
   */
  updateMany<T extends { id: string }>(key: string, newItems: T[]): void {
    if (newItems.length === 0) return
    const items = (this.get<T>(key) ?? []) as T[]
    const byId  = new Map(items.map((item, idx) => [item.id, idx]))
    for (const item of newItems) {
      const idx = byId.get(item.id)
      if (idx !== undefined) items[idx] = item
      else { byId.set(item.id, items.length); items.push(item) }
    }
    this.set(key, items)
  },

  isSeeded(): boolean {
    return localStorage.getItem(SEED_FLAG) === '1'
  },

  markSeeded(): void {
    localStorage.setItem(SEED_FLAG, '1')
  },

  resetAll(): void {
    memory.clear()
    Object.keys(localStorage)
      .filter(k => k.startsWith(PREFIX))
      .forEach(k => localStorage.removeItem(k))
    localStorage.removeItem(SEED_FLAG)
  },
}
