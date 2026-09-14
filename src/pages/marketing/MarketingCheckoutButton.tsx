import { useState, type MouseEvent } from 'react'
import { PCM_OFFERS, PCM_SUPPORT_EMAIL, isLive, type PcmOffer } from '../../config/pcmPaymentLinks'
import { MarketingLeadModal, hasCapturedLead } from './MarketingLeadModal'

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
  label = 'Secure your spot →',
}: {
  offerId: PcmOffer['id']
  className?: string
  tone?: 'orange' | 'light'
  label?: string
}) {
  const offer = PCM_OFFERS[offerId]
  const live = isLive(offer.paymentLink)
  const [leadOpen, setLeadOpen] = useState(false)

  const href = live
    ? offer.paymentLink
    : `mailto:${PCM_SUPPORT_EMAIL}?subject=${encodeURIComponent(`I'd like to start: ${offer.name}`)}`

  const btn =
    tone === 'light'
      ? 'bg-surface text-charcoal hover:bg-white'
      : 'bg-primary text-white hover:bg-[#b05a35]'
  const noteText = tone === 'light' ? 'text-white/80' : 'text-muted'
  const noteLink = tone === 'light' ? 'text-white underline' : 'text-primary hover:underline'

  // Rates only show once we know who's asking, same gate as the landing
  // page's service cards — a visitor landing straight on a funnel page
  // (an ad, a shared link) shouldn't reach Stripe without ever giving details.
  function handleClick(e: MouseEvent) {
    if (live && !hasCapturedLead()) {
      e.preventDefault()
      setLeadOpen(true)
    }
  }

  return (
    <div className={className}>
      {leadOpen && (
        <MarketingLeadModal
          open={leadOpen}
          onClose={() => setLeadOpen(false)}
          onSuccess={() => { setLeadOpen(false); window.location.href = href }}
          offerLabel={offer.name}
          source={`checkout-${offerId}`}
        />
      )}
      <a
        href={href}
        onClick={handleClick}
        className={`inline-flex w-full items-center justify-center px-7 py-3.5 text-base font-semibold rounded-xl transition-colors ${btn}`}
      >
        {live ? label : 'Email us to start'}
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
