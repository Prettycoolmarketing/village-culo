// Test-mode Stripe Payment Links, created via the one-off
// stripe-setup-creatives Edge Function. Swap for live-mode links (re-run
// that function once STRIPE_SECRET_KEY is switched to a live key) when
// ready to launch for real. Shared between DashboardCreativesPage and
// JoinOfferPage rather than duplicated — one place to update when the real
// links exist.
export const UPGRADE_PAYMENT_LINK = 'https://buy.stripe.com/test_00000000000000'
// $19/mo collaborator link — free until Jan 1 2027 (trial_end is fixed up
// server-side by stripe-creatives-webhook after checkout).
export const COLLABORATOR_PAYMENT_LINK = 'https://buy.stripe.com/test_00000000000001'

// client_reference_id is how stripe-creatives-webhook links the resulting
// Stripe customer back to a founder (see that function's header comment) —
// Stripe carries this query param through to the Checkout Session
// untouched, so it must be on the link every time, not just documented.
export function buildPaymentUrl(base: string, founderId: string, email?: string): string {
  return `${base}?client_reference_id=${encodeURIComponent(founderId)}${email ? `&prefilled_email=${encodeURIComponent(email)}` : ''}`
}
