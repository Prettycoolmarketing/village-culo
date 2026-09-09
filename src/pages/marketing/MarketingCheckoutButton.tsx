import { PCM_OFFERS, PCM_SUPPORT_EMAIL, isLive, type PcmOffer } from '../../config/pcmPaymentLinks'

/**
 * The checkout CTA for a PCM funnel. If the offer's real Stripe Payment
 * Link has been pasted into pcmPaymentLinks.ts it goes straight to Stripe;
 * otherwise it falls back to an email so the funnel still works before the
 * links are live.
 *
 * tone: 'orange' (default) for cream/sand backgrounds, 'dark' for the
 * orange CTA sections where an orange button would disappear.
 */
export function MarketingCheckoutButton({
  offerId,
  className = '',
  tone = 'orange',
}: {
  offerId: PcmOffer['id']
  className?: string
  tone?: 'orange' | 'dark'
}) {
  const offer = PCM_OFFERS[offerId]
  const live = isLive(offer.paymentLink)

  const href = live
    ? offer.paymentLink
    : `mailto:${PCM_SUPPORT_EMAIL}?subject=${encodeURIComponent(`I'd like to start: ${offer.name}`)}`

  const btn =
    tone === 'dark'
      ? 'bg-pcm-dark text-white hover:bg-[#1a110b]'
      : 'bg-pcm-orange text-white hover:bg-pcm-orange-dark'
  const noteText = tone === 'dark' ? 'text-white/80' : 'text-pcm-muted'
  const noteLink = tone === 'dark' ? 'text-white underline' : 'text-pcm-orange hover:underline'

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
