import { readCache, deleteEntity, pullVisibleRows } from '../lib/entityStore'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { store } from '../lib/store'

// Pretty Cool Marketing — leads captured from the /marketing funnel before
// pricing is shown. Same shape and Edge-Function routing as waitlistService
// (see src/services/waitlist.ts); staff read them on the PCM > Leads page
// in CAPO.

const KEY   = 'pcm_leads'
const TABLE = 'pcm_leads'

export interface PcmLead {
  id: string
  name?: string
  email: string
  phone?: string
  website?: string
  source: string       // 'marketing-publishing' | 'marketing-social'
  createdAt: string
}

export interface PcmLeadInput {
  name?: string
  email: string
  phone?: string
  website?: string
  source: string
}

export const pcmLeadsService = {
  getAll(): PcmLead[] {
    return readCache<PcmLead>(KEY).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  },

  /** Staff-only — pulls every row visible under this table's admin RLS policy into the local cache. */
  async refresh(): Promise<void> {
    await pullVisibleRows<PcmLead>(TABLE, KEY)
  },

  async submit(input: PcmLeadInput): Promise<{ success: boolean; error?: string }> {
    const email = input.email.trim().toLowerCase()
    if (!email.includes('@')) return { success: false, error: 'Enter a valid email address.' }

    if (!isSupabaseConfigured || !supabase) {
      store.update<PcmLead>(KEY, {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        ...input,
        email,
      })
      return { success: true }
    }

    const { data, error } = await supabase.functions.invoke<{ success?: boolean; error?: string }>(
      'submit-pcm-lead',
      { body: { ...input, email } },
    )
    if (error || data?.error) {
      return { success: false, error: data?.error || (error instanceof Error ? error.message : 'Could not submit. Please try again.') }
    }
    return { success: true }
  },

  delete(id: string) {
    return deleteEntity({ cacheKey: KEY, id, table: TABLE })
  },
}
