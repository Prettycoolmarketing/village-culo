import { PCM_OFFERS, PCM_SUPPORT_EMAIL, isLive, type PcmOffer } from '../../config/pcmPaymentLinks'

/**
 * The checkout CTA for a PCM funnel. If the offer's real Stripe Payment
 * Link has been pasted into pcmPaymentLinks.ts it goes straight to Stripe;
 * otherwise it falls back to an email so the funnel still works before the
 * links are live.
 */
export function MarketingCheckoutButton({
  offerId,
  className = '',
}: {
  offerId: PcmOffer['id']
  className?: string
}) {
  const offer = PCM_OFFERS[offerId]
  const live = isLive(offer.paymentLink)

  const href = live
    ? offer.paymentLink
    : `mailto:${PCM_SUPPORT_EMAIL}?subject=${encodeURIComponent(`I'd like to start: ${offer.name}`)}`

  return (
    <div className={className}>
      <a
        href={href}
        className="inline-flex w-full items-center justify-center px-7 py-3.5 bg-pcm-orange text-white text-base font-semibold rounded-xl hover:bg-pcm-orange-dark transition-colors"
      >
        {live
          ? `Pay ${offer.priceLabel} ${offer.cadence} →`
          : `Email us to start`}
      </a>
      {!live && (
        <p className="mt-2 font-body text-xs text-pcm-muted">
          Card checkout for this offer is being switched on. Email{' '}
          <a href={`mailto:${PCM_SUPPORT_EMAIL}`} className="text-pcm-orange hover:underline">
            {PCM_SUPPORT_EMAIL}
          </a>{' '}
          and we'll send you a payment link.
        </p>
      )}
    </div>
  )
}
