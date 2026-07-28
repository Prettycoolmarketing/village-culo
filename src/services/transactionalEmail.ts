import { supabase, isSupabaseConfigured } from '../lib/supabase'

type EmailBody =
  | { type: 'claim-received'; to: string; founderName: string }
  | { type: 'claim-approved'; to: string; founderName: string; founderSlug: string }
  | { type: 'claim-rejected'; to: string; founderName: string; reason?: string }
  | { type: 'staff-invite'; to: string; role: string; invitedBy?: string }
  | { type: 'claim-submitted-staff'; founderName: string; founderSlug: string; requesterName: string; requesterEmail: string }
  | { type: 'partner-application-staff'; businessName: string; applicationUrl: string; pitch: string }

/**
 * Fire-and-forget call to the send-transactional-email Edge Function.
 * Never throws and never blocks the caller — a claim approval or staff
 * invite must succeed even if email delivery fails or isn't configured yet.
 */
export function sendTransactionalEmail(body: EmailBody): void {
  if (!isSupabaseConfigured || !supabase) return
  void supabase.functions.invoke('send-transactional-email', { body }).catch(err => {
    console.warn('sendTransactionalEmail failed', err)
  })
}
