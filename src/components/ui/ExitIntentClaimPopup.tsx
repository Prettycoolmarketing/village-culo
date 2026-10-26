import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Founder } from '../../types'

const SESSION_KEY = 'culo_exit_intent_shown'

// Only for an unclaimed, village-curated founder's own page or one of
// their articles — a visitor there got here by searching for (or clicking
// through to) this specific person, exactly the audience "your content is
// stuck on a closed platform, claim this to republish it as real web
// articles" actually lands with. Never shown on anyone else's page.
//
// Desktop-only by nature — exit intent (the mouse leaving toward the
// browser chrome) has no touch equivalent, so this simply never fires on
// mobile, which is fine: no popup is better than a fake trigger there.
//
// Once per browser session (sessionStorage, not localStorage) — annoying
// to re-show on every single page view within one visit, but a genuinely
// new visit later is worth asking again.
export function ExitIntentClaimPopup({ founder }: { founder: Founder }) {
  const [show, setShow] = useState(false)
  const eligible = founder.profileStatus === 'village-curated' && !founder.userId

  useEffect(() => {
    if (!eligible) return
    let alreadyShown = false
    try { alreadyShown = sessionStorage.getItem(SESSION_KEY) === '1' } catch { /* ignore */ }
    if (alreadyShown) return

    function handleMouseOut(e: MouseEvent) {
      if (e.clientY > 0 || e.relatedTarget) return
      setShow(true)
      try { sessionStorage.setItem(SESSION_KEY, '1') } catch { /* ignore */ }
      document.removeEventListener('mouseout', handleMouseOut)
    }

    // Confirmed real bug: arming this immediately on mount fired the
    // popup when a visitor merely clicked a link into the page, not when
    // they tried to leave it. Clicking a link near the top of the page
    // (a navbar item, a list entry) leaves the mouse at a low clientY,
    // and an SPA route change swaps the DOM right under that still-
    // stationary cursor — the browser can fire a mouseout off that swap
    // alone, with no actual mouse movement, that looks identical to
    // real exit intent. A short grace period before arming the listener
    // lets that initial page-load settle first.
    const armTimer = setTimeout(() => {
      document.addEventListener('mouseout', handleMouseOut)
    }, 1500)
    return () => {
      clearTimeout(armTimer)
      document.removeEventListener('mouseout', handleMouseOut)
    }
  }, [eligible])

  if (!eligible || !show) return null

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-label="Claim your profile"
      onClick={() => setShow(false)}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-7 relative"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={() => setShow(false)}
          className="absolute top-4 right-4 text-[#9CA3AF] hover:text-[#2D2A26] transition-colors text-xl leading-none"
          aria-label="Close"
        >
          ×
        </button>
        <p className="font-heading text-xl font-bold text-[#2D2A26] mb-3 pr-6">
          Wait, publish your own story!
        </p>
        <p className="font-body text-sm text-[#6B7280] leading-relaxed mb-5">
          Import your content from across platforms to republish as individual web articles for discovery.
        </p>
        <Link
          to={`/claim/${founder.slug}`}
          onClick={() => setShow(false)}
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#3E6E92] text-white text-sm font-semibold rounded-xl hover:bg-[#345c7a] transition-colors w-full justify-center"
        >
          Claim my free profile →
        </Link>
      </div>
    </div>
  )
}
