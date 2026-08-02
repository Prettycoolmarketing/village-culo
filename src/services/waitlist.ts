import { readCache, deleteEntity, pullVisibleRows } from '../lib/entityStore'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { store } from '../lib/store'

const KEY = 'canva_waitlist'
const TABLE = 'canva_waitlist'

export interface WaitlistEntry {
  id: string
  email: string
  name?: string
  source: string
  createdAt: string
}

export const waitlistService = {
  getAll(): WaitlistEntry[] {
    return readCache<WaitlistEntry>(KEY)
  },

  /** Staff-only — pulls every row visible under this table's admin RLS policy into the local cache. */
  async refresh(): Promise<void> {
    await pullVisibleRows<WaitlistEntry>(TABLE, KEY)
  },

  // Routed through the submit-waitlist Edge Function (service role write) —
  // same reason submit-founder-claim exists: direct anon REST inserts get
  // rejected at Supabase's API gateway in production for this project.
  async join(input: { email: string; name?: string; source: string }): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured || !supabase) {
      store.update<WaitlistEntry>(KEY, { id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...input })
      return { success: true }
    }
    const { data, error } = await supabase.functions.invoke<{ success?: boolean; error?: string }>('submit-waitlist', { body: input })
    if (error || data?.error) return { success: false, error: data?.error || (error instanceof Error ? error.message : 'Could not join the waitlist.') }
    return { success: true }
  },

  delete(id: string) {
    return deleteEntity({ cacheKey: KEY, id, table: TABLE })
  },
}
