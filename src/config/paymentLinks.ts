// Live-mode Stripe Payment Links, created via the one-off
// stripe-setup-creatives Edge Function (AUD, branded product names/
// descriptions, redirect back to the dashboard on completion). Shared
// between DashboardCreativesPage and JoinOfferPage rather than duplicated —
// one place to update if these ever need to be recreated.
export const UPGRADE_PAYMENT_LINK = 'https://buy.stripe.com/bJe14o9I57sT5mGfrh83C09'
// $19/mo "Culo Creatives Founding Collaborator" — has a 114-day trial on
// the link itself so Stripe never charges at signup; stripe-creatives-webhook
// then pins trial_end to the fixed date 2027-01-01 after checkout. Created
// via stripe-setup-2026-tiers; replaces the old link that had no trial.
export const COLLABORATOR_PAYMENT_LINK = 'https://buy.stripe.com/dRmfZibQd5kL5mG0wn83C0r'

// client_reference_id is how stripe-creatives-webhook links the resulting
// Stripe customer back to a founder (see that function's header comment) —
// Stripe carries this query param through to the Checkout Session
// untouched, so it must be on the link every time, not just documented.
export function buildPaymentUrl(base: string, founderId: string, email?: string): string {
  return `${base}?client_reference_id=${encodeURIComponent(founderId)}${email ? `&prefilled_email=${encodeURIComponent(email)}` : ''}`
}
