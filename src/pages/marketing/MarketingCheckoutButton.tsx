import { PCM_OFFERS, PCM_SUPPORT_EMAIL, isLive, type PcmOffer } from '../../config/pcmPaymentLinks'

/**
 * The checkout CTA for a PCM funnel. If the offer's real Stripe Payment
 * Link has been pasted into pcmPaymentLinks.ts it goes straight to Stripe;
 * otherwise it falls back to an email so the funnel still works before the
 * links are live.
 *
 * tone: 'orange' (default) for cream/sand backgrounds, 'light' for the
 * orange CTA sections — a light button with dark writing.
 */
export function MarketingCheckoutButton({
  offerId,
  className = '',
  tone = 'orange',
}: {
  offerId: PcmOffer['id']
  className?: string
  tone?: 'orange' | 'light'
}) {
  const offer = PCM_OFFERS[offerId]
  const live = isLive(offer.paymentLink)

  const href = live
    ? offer.paymentLink
    : `mailto:${PCM_SUPPORT_EMAIL}?subject=${encodeURIComponent(`I'd like to start: ${offer.name}`)}`

  const btn =
    tone === 'light'
      ? 'bg-background text-charcoal hover:bg-white'
      : 'bg-primary text-white hover:bg-[#b05a35]'
  const noteText = tone === 'light' ? 'text-white/80' : 'text-muted'
  const noteLink = tone === 'light' ? 'text-white underline' : 'text-primary hover:underline'

  return (
    <div className={className}>
      <a
        href={href}
        className={`inline-flex w-full items-center justify-center px-7 py-3.5 text-base font-semibold rounded-xl transition-colors ${btn}`}
      >
        {live ? `Pay ${offer.priceLabel} ${offer.cadence} →` : 'Email us to start'}
      </a>
      {!live && (
        <p className={`mt-2 font-body text-xs ${noteText}`}>
          Card checkout for this offer is being switched on. Email{' '}
          <a href={`mailto:${PCM_SUPPORT_EMAIL}`} className={noteLink}>
            {PCM_SUPPORT_EMAIL}
          </a>{' '}
          and we'll send you a payment link.
        </p>
      )}
    </div>
  )
}
