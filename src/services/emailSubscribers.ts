import { readCache, writeEntity, deleteEntity, pullVisibleRows, type WriteResult } from '../lib/entityStore'
import { supabase } from '../lib/supabase'

const KEY = 'email_subscribers'
const TABLE = 'email_subscribers'

export interface EmailSubscriber {
  id: string
  email: string
  name?: string
  source: string
  createdAt: string
}

export const emailSubscribersService = {
  getAll(): EmailSubscriber[] {
    return readCache<EmailSubscriber>(KEY)
  },

  async refresh(): Promise<void> {
    await pullVisibleRows<EmailSubscriber>(TABLE, KEY)
  },

  add(sub: EmailSubscriber): Promise<WriteResult> {
    return writeEntity<EmailSubscriber>({
      cacheKey: KEY,
      item: sub,
      table: TABLE,
      toRow: s => ({ id: s.id, email: s.email, data: s }),
    })
  },

  /**
   * Adds every waitlist entry not already subscribed — skips ones already
   * present by email, and anyone staff has deliberately deleted/unsubscribed
   * before. Without the unsubscribe check, this (auto-run on every visit to
   * Culo Members) silently brought a just-deleted subscriber straight back
   * the next time the page loaded, since deleting them only removes the
   * email_subscribers row, not their waitlist entry — confirmed real.
   */
  async importFromWaitlist(entries: { email: string; name?: string }[]): Promise<{ added: number }> {
    const existing = new Set(this.getAll().map(s => s.email))
    let unsubscribed = new Set<string>()
    if (supabase) {
      const { data } = await supabase.from('email_unsubscribes').select('email')
      unsubscribed = new Set((data ?? []).map(r => r.email as string))
    }
    let added = 0
    for (const entry of entries) {
      if (existing.has(entry.email) || unsubscribed.has(entry.email)) continue
      const result = await this.add({
        id: crypto.randomUUID(), email: entry.email, name: entry.name,
        source: 'waitlist-import', createdAt: new Date().toISOString(),
      })
      if (result.success) { added++; existing.add(entry.email) }
    }
    return { added }
  },

  delete(id: string) {
    return deleteEntity({ cacheKey: KEY, id, table: TABLE })
  },
}
