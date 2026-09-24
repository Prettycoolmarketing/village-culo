import { readCache, pullVisibleRows } from '../lib/entityStore'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

const KEY = 'account_feedback'
const TABLE = 'account_feedback'

export interface AccountFeedback {
  id: string
  founderId: string
  section: 'culo-creatives' | 'culo-village'
  reason: 'cancel' | 'delete'
  answer: string
  createdAt: string
}

export const accountFeedbackService = {
  getAll(): AccountFeedback[] {
    return readCache<AccountFeedback>(KEY)
  },

  /** Staff-only (CAPO) — pulls every row visible under this table's admin RLS policy into the local cache. */
  async refresh(): Promise<void> {
    await pullVisibleRows<AccountFeedback>(TABLE, KEY)
  },

  // Routed through submit-account-feedback (service role write) — same
  // reason creative_feedback/canva_waitlist are: direct anon inserts get
  // rejected at Supabase's API gateway in production, and founders have no
  // client INSERT policy on this table anyway.
  async submit(input: { founderId: string; section: AccountFeedback['section']; reason: AccountFeedback['reason']; answer: string }): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Connect Supabase to submit feedback.' }
    }
    const { data, error } = await supabase.functions.invoke<{ success?: boolean; error?: string }>('submit-account-feedback', { body: input })
    if (error || data?.error) return { success: false, error: data?.error || (error instanceof Error ? error.message : 'Could not submit feedback.') }
    return { success: true }
  },
}
