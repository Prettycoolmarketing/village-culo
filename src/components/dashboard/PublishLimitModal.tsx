import { useEffect } from 'react'
import { getPublishState } from '../../utils/publishing'
import { getArchiveTier, isLive } from '../../config/archiveUnlock'
import { PUBLISHING_PACKS } from '../../config/publishing'
import { buildPaymentUrl } from '../../config/paymentLinks'
import type { Founder } from '../../types'

// Shown when a publish is refused for lack of allowance. On brand:
// terracotta primary CTA, charcoal secondary, gold "best value" tag,
// olive only for a done/confirmed state. Never green.

const SUPPORT = 'support@prettycoolmarketing.com'

export function PublishLimitModal({
  open,
  onClose,
  kind,
  founder,
  founderEmail,
  archiveDetectedCount,
}: {
  open: boolean
  onClose: () => void
  kind: 'imported' | 'self'
  founder: Founder
  founderEmail?: string
  /** Total detected archive size — picks the right Archive Unlock tier. */
  archiveDetectedCount?: number
}) {
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [open, onClose])

  if (!open) return null

  const state = getPublishState(founder)
  const pay = (link: string) => buildPaymentUrl(link, founder.id, founderEmail)

  const archiveTier = getArchiveTier(archiveDetectedCount ?? state.archivePublished ?? 0)
  const pack100 = PUBLISHING_PACKS.pack100
  const pack365 = PUBLISHING_PACKS.pack365

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-[#2D2A26]/60"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-xl p-7 relative"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 text-[#9CA3AF] hover:text-[#2D2A26] transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {kind === 'imported' ? (
          <>
            <p className="text-[10px] font-semibold text-[#C86A43] uppercase tracking-widest mb-2">Archive publishing</p>
            <h2 className="font-heading text-2xl font-bold text-[#2D2A26] mb-2 leading-tight">
              You've published all of your free archive pieces
            </h2>
            <p className="text-sm text-[#6B7280] mb-5">
              Unlock your archive to keep publishing your existing body of work — one payment, no subscription.
            </p>
            {isLive(archiveTier.paymentLink) ? (
              <a
                href={pay(archiveTier.paymentLink)}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center px-6 py-3.5 bg-[#C86A43] text-white text-sm font-semibold rounded-xl hover:bg-[#b05a35] transition-colors"
              >
                Unlock your archive — {archiveTier.priceLabel}
              </a>
            ) : (
              <a
                href={`mailto:${SUPPORT}?subject=${encodeURIComponent('Archive unlock')}`}
                className="block w-full text-center px-6 py-3.5 bg-[#C86A43] text-white text-sm font-semibold rounded-xl hover:bg-[#b05a35] transition-colors"
              >
                Get a quote — {archiveTier.priceLabel}
              </a>
            )}
            <p className="text-xs text-[#9CA3AF] text-center mt-3">
              Just need a few more? {isLive(pack100.paymentLink) ? (
                <a href={pay(pack100.paymentLink)} target="_blank" rel="noopener noreferrer" className="text-[#C86A43] font-medium hover:underline">
                  Add {pack100.label} for {pack100.priceLabel}
                </a>
              ) : <span>publishing packs coming soon</span>}
            </p>
          </>
        ) : (
          <>
            <p className="text-[10px] font-semibold text-[#C86A43] uppercase tracking-widest mb-2">Keep publishing</p>
            <h2 className="font-heading text-2xl font-bold text-[#2D2A26] mb-2 leading-tight">
              You've used your {state.selfLimit} free publications
            </h2>
            <p className="text-sm text-[#6B7280] mb-5">
              Add a publishing pack to keep publishing new work into the Village. No expiry.
            </p>
            <div className="flex flex-col gap-3">
              <a
                href={isLive(pack365.paymentLink) ? pay(pack365.paymentLink) : `mailto:${SUPPORT}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-xl border-2 border-[#C86A43] px-5 py-4 hover:bg-[#FDF6F3] transition-colors"
              >
                <span className="inline-block text-[10px] font-bold uppercase tracking-wide text-[#2D2A26] bg-[#D6A94D] rounded px-1.5 py-0.5 mb-1">Best value</span>
                <p className="text-sm font-bold text-[#2D2A26]">A year of publishing — 365 publications</p>
                <p className="text-sm text-[#6B7280]">{pack365.priceLabel}</p>
              </a>
              <a
                href={isLive(pack100.paymentLink) ? pay(pack100.paymentLink) : `mailto:${SUPPORT}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-xl border border-[#E8E4DD] px-5 py-4 hover:border-[#C86A43]/40 transition-colors"
              >
                <p className="text-sm font-bold text-[#2D2A26]">100 publications</p>
                <p className="text-sm text-[#6B7280]">{pack100.priceLabel}</p>
              </a>
            </div>
          </>
        )}

        {state.paidRemaining > 0 && (
          <p className="text-xs text-[#5E6B4A] font-medium text-center mt-4">
            You have {state.paidRemaining} pack {state.paidRemaining === 1 ? 'credit' : 'credits'} left — this publish will use one.
          </p>
        )}
      </div>
    </div>
  )
}
