import { readCache, writeEntity, pullVisibleRows, type WriteResult } from '../lib/entityStore'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

const KEY = 'email_nudge_templates'
const TABLE = 'email_nudge_templates'

// id matches the Founder.*NudgeSentAt field send-nudges checks/sets for
// this nudge — not an arbitrary key, see src/types/index.ts.
export interface EmailNudgeTemplate {
  id: 'needsSetupNudgeSentAt' | 'readyNudgeSentAt' | 'importNudgeSentAt' | 'publishNudgeSentAt'
  title: string
  subject: string
  bodyHtml: string
}

export const emailNudgeTemplatesService = {
  getAll(): EmailNudgeTemplate[] {
    return [...readCache<EmailNudgeTemplate>(KEY)]
  },

  async refresh(): Promise<void> {
    await pullVisibleRows<EmailNudgeTemplate>(TABLE, KEY)
  },

  save(template: EmailNudgeTemplate): Promise<WriteResult> {
    return writeEntity<EmailNudgeTemplate>({
      cacheKey: KEY,
      item: template,
      table: TABLE,
      toRow: t => ({ id: t.id, data: t }),
    })
  },

  // Same send-nudges the daily cron calls — every condition, not just one.
  // Lets staff see a template edit actually go out the same day instead of
  // waiting for the 9:30pm UTC run.
  async sendNow(): Promise<{ success: boolean; sent?: number; error?: string }> {
    if (!isSupabaseConfigured || !supabase) return { success: false, error: 'Not available in this environment.' }
    const { data, error } = await supabase.functions.invoke<{ ok?: boolean; notified?: number; error?: string }>('send-nudges', { body: {} })
    if (error) return { success: false, error: error.message }
    if (data?.error) return { success: false, error: data.error }
    return { success: true, sent: data?.notified ?? 0 }
  },
}
