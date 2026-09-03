import { readCache, pullVisibleRows } from '../lib/entityStore'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

const KEY = 'creative_feedback'
const TABLE = 'creative_feedback'

export interface CreativeFeedback {
  id: string
  founderId: string
  answer: string
  createdAt: string
}

export const creativeFeedbackService = {
  getAll(): CreativeFeedback[] {
    return readCache<CreativeFeedback>(KEY)
  },

  /** Staff-only (CAPO) — pulls every row visible under this table's admin RLS policy into the local cache. */
  async refresh(): Promise<void> {
    await pullVisibleRows<CreativeFeedback>(TABLE, KEY)
  },

  // Routed through the submit-creative-feedback Edge Function (service role
  // write) — same reason submit-waitlist/submit-founder-claim exist: direct
  // anon REST inserts get rejected at Supabase's API gateway in production
  // for this project. This call also locks the founder into the $19/mo
  // collaborator rate server-side — see the function itself.
  async submit(input: { founderId: string; answer: string }): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Connect Supabase to submit feedback.' }
    }
    const { data, error } = await supabase.functions.invoke<{ success?: boolean; error?: string }>('submit-creative-feedback', { body: input })
    if (error || data?.error) return { success: false, error: data?.error || (error instanceof Error ? error.message : 'Could not submit feedback.') }
    return { success: true }
  },
}
