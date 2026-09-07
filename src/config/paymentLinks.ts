// Live-mode Stripe Payment Links, created via the one-off
// stripe-setup-creatives Edge Function (AUD, branded product names/
// descriptions, redirect back to the dashboard on completion). Shared
// between DashboardCreativesPage and JoinOfferPage rather than duplicated —
// one place to update if these ever need to be recreated.
export const UPGRADE_PAYMENT_LINK = 'https://buy.stripe.com/bJe14o9I57sT5mGfrh83C09'
// $19/mo collaborator link — free until Jan 1 2027 (trial_end is fixed up
// server-side by stripe-creatives-webhook after checkout).
export const COLLABORATOR_PAYMENT_LINK = 'https://buy.stripe.com/bJe8wQcUh00reXg7YP83C08'

// client_reference_id is how stripe-creatives-webhook links the resulting
// Stripe customer back to a founder (see that function's header comment) —
// Stripe carries this query param through to the Checkout Session
// untouched, so it must be on the link every time, not just documented.
export function buildPaymentUrl(base: string, founderId: string, email?: string): string {
  return `${base}?client_reference_id=${encodeURIComponent(founderId)}${email ? `&prefilled_email=${encodeURIComponent(email)}` : ''}`
}
