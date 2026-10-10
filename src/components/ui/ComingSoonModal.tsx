import { useEffect } from 'react'

// Culo Creatives itself isn't live yet (still "Coming soon!" inside the
// app once someone's in) — this stops every entry point that used to send
// a founder straight to real Stripe checkout or the Canva app from doing
// that at all, until it's actually ready. Same modal shell as
// PublishLimitModal, just a single "Back" action instead of a payment CTA.
export function ComingSoonModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-[#2D2A26]/60"
      role="dialog"
      aria-modal="true"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-7 relative text-center">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 text-[#9CA3AF] hover:text-[#2D2A26] transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <p className="text-[10px] font-semibold text-[#C86A43] uppercase tracking-widest mb-2">Culo Creatives</p>
        <h2 className="font-heading text-2xl font-bold text-[#2D2A26] mb-2 leading-tight">Coming Soon</h2>
        <p className="text-sm text-[#6B7280] mb-6">
          Culo Creatives isn't open yet — we'll let you know the moment it is.
        </p>
        <button
          onClick={onClose}
          className="px-6 py-3 bg-[#2D2A26] text-white text-sm font-semibold rounded-xl hover:bg-[#1a1815] transition-colors"
        >
          Back
        </button>
      </div>
    </div>
  )
}
