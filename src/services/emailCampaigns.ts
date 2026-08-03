import { readCache, writeEntity, pullVisibleRows, type WriteResult } from '../lib/entityStore'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

const KEY = 'email_campaigns'
const TABLE = 'email_campaigns'

export interface EmailCampaign {
  id: string
  subject: string
  bodyHtml: string
  status: 'draft' | 'sent'
  createdAt: string
  sentAt?: string
  recipientCount?: number
}

export interface CampaignSendStats {
  sent: number
  opened: number
  clicked: number
}

export const emailCampaignsService = {
  getAll(): EmailCampaign[] {
    return [...readCache<EmailCampaign>(KEY)].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  },

  async refresh(): Promise<void> {
    await pullVisibleRows<EmailCampaign>(TABLE, KEY)
  },

  saveDraft(campaign: EmailCampaign): Promise<WriteResult> {
    return writeEntity<EmailCampaign>({
      cacheKey: KEY,
      item: campaign,
      table: TABLE,
      toRow: c => ({ id: c.id, status: c.status, data: c }),
    })
  },

  /** Staff-only — sends a draft campaign to every current subscriber via the send-campaign Edge Function, then marks it sent. */
  async send(campaignId: string): Promise<{ success: boolean; sent?: number; total?: number; error?: string }> {
    if (!isSupabaseConfigured || !supabase) return { success: false, error: 'Not available in this environment.' }
    const { data, error } = await supabase.functions.invoke<{ sent?: number; total?: number; error?: string }>('send-campaign', { body: { campaignId } })
    if (error || data?.error) return { success: false, error: data?.error || (error instanceof Error ? error.message : 'Could not send this campaign.') }
    await this.refresh()
    return { success: true, sent: data?.sent, total: data?.total }
  },

  /** Staff-only — real per-campaign counts read straight from email_campaign_sends/_clicks, not the local cache (neither table is mirrored into it). */
  async getStats(campaignId: string): Promise<CampaignSendStats> {
    if (!isSupabaseConfigured || !supabase) return { sent: 0, opened: 0, clicked: 0 }
    const [{ data: sends }, { data: clicks }] = await Promise.all([
      supabase.from('email_campaign_sends').select('opened_at, id').eq('campaign_id', campaignId),
      supabase.from('email_campaign_clicks').select('send_id').eq('campaign_id', campaignId),
    ])
    const sendRows = sends ?? []
    const clickedSendIds = new Set((clicks ?? []).map(c => c.send_id as string))
    return {
      sent: sendRows.length,
      opened: sendRows.filter(r => r.opened_at).length,
      clicked: sendRows.filter(r => clickedSendIds.has(r.id as string)).length,
    }
  },
}
