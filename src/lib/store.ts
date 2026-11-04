const PREFIX    = 'culo_v1_'
const SEED_FLAG = 'culo_seeded_v1'
const DB_NAME    = 'culo_cache_v1'
const DB_STORE   = 'kv'

// In-memory mirror of every cache key, kept in sync with every write below.
// This is the real source of truth for the current page session — every
// get()/set() below is synchronous against this Map, so none of the many
// call sites across the app that treat the store as synchronous (readCache,
// getFounders, every service that imports `store` directly) needed to
// change for this file to move off localStorage.
const memory = new Map<string, unknown[]>()

// localStorage was the original persistence layer underneath `memory`, but
// its ~5-10MB per-origin quota doesn't hold up for a CAPO/admin session
// caching the whole platform — imported_content alone runs to several
// thousand rows. Confirmed real and live (Mitchell, Editorial Queue,
// 2026-11-04): nearly every table failed to persist at once. IndexedDB has
// no comparable practical ceiling (typically a meaningful share of free
// disk space) and is the standard replacement for exactly this case. Still
// entirely best-effort, same as localStorage was — `memory` above is what
// the app actually runs on; this is only "load faster next visit."
let dbPromise: Promise<IDBDatabase | null> | null = null
function openDB(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise(resolve => {
    if (typeof indexedDB === 'undefined') { resolve(null); return }
    let req: IDBOpenDBRequest
    try {
      req = indexedDB.open(DB_NAME, 1)
    } catch (err) {
      console.error('[store] IndexedDB unavailable — caching this session only.', err)
      resolve(null)
      return
    }
    req.onupgradeneeded = () => { req.result.createObjectStore(DB_STORE) }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => {
      console.error('[store] IndexedDB failed to open — caching this session only.', req.error)
      resolve(null)
    }
  })
  return dbPromise
}

async function idbSet(key: string, items: unknown[]): Promise<void> {
  const db = await openDB()
  if (!db) return
  await new Promise<void>(resolve => {
    const tx = db.transaction(DB_STORE, 'readwrite')
    tx.objectStore(DB_STORE).put(items, key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => {
      console.error(`[store] Couldn't persist "${key}" (${items.length} items) to IndexedDB. Using it for this session only; it won't load instantly next time without a fresh sync.`, tx.error)
      resolve()
    }
  })
}

// Pre-loads every previously-cached key from IndexedDB into `memory` —
// called once at app boot (see main.tsx), racing the real network sync so
// the first render has something to paint instead of a blank slate, same
// role localStorage's synchronous read used to play. Safe to skip or time
// out: a cold `memory` just means pages render empty until the network
// sync (which runs on every load regardless) lands moments later, same as
// any brand-new visitor's first-ever load.
export async function hydrateStoreFromIndexedDB(): Promise<void> {
  const db = await openDB()
  if (!db) return
  await new Promise<void>(resolve => {
    const tx = db.transaction(DB_STORE, 'readonly')
    const req = tx.objectStore(DB_STORE).openCursor()
    req.onsuccess = () => {
      const cursor = req.result
      if (!cursor) { resolve(); return }
      const key = String(cursor.key)
      if (key.startsWith(PREFIX)) memory.set(key.slice(PREFIX.length), cursor.value as unknown[])
      cursor.continue()
    }
    req.onerror = () => resolve()
  })
}

export const store = {
  get<T>(key: string): T[] | null {
    return (memory.get(key) as T[] | undefined) ?? null
  },

  set<T>(key: string, items: T[]): void {
    memory.set(key, items as unknown[])
    void idbSet(PREFIX + key, items)
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

  // Tiny boolean flag, not subject to the quota problem above — left on
  // localStorage rather than round-tripping IndexedDB for one bit.
  isSeeded(): boolean {
    return localStorage.getItem(SEED_FLAG) === '1'
  },

  markSeeded(): void {
    localStorage.setItem(SEED_FLAG, '1')
  },

  resetAll(): void {
    memory.clear()
    void openDB().then(db => {
      if (!db) return
      db.transaction(DB_STORE, 'readwrite').objectStore(DB_STORE).clear()
    })
    localStorage.removeItem(SEED_FLAG)
    // Cleans up any leftover keys from the old localStorage-backed version
    // of this store — harmless if there are none.
    Object.keys(localStorage).filter(k => k.startsWith(PREFIX)).forEach(k => localStorage.removeItem(k))
  },
}
