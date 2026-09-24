import { supabase, isSupabaseConfigured } from '../lib/supabase'

// Requests cancellation of a founder's own CULO Creatives subscription at
// Stripe — at the end of the period they've already paid for, not
// immediately. See stripe-cancel-subscription: the real status flip
// happens later, via stripe-creatives-webhook, once Stripe actually
// processes it.
export async function cancelCreativesSubscription(founderId: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: 'Connect Supabase to cancel a subscription.' }
  }
  const { data, error } = await supabase.functions.invoke<{ success?: boolean; error?: string }>('stripe-cancel-subscription', {
    body: { founderId },
  })
  if (error || data?.error) return { success: false, error: data?.error || (error instanceof Error ? error.message : 'Could not cancel subscription.') }
  return { success: true }
}
