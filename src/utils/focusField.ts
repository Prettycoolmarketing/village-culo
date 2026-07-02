/**
 * Scrolls to and focuses the input matching a MissingItem's `field` id, after a
 * tab switch has re-rendered the DOM. Called one frame after setTab() so the
 * target tab's content exists — React re-renders before the next paint, so
 * requestAnimationFrame is enough without extra ref/effect plumbing per page.
 */
export function focusField(fieldId: string) {
  requestAnimationFrame(() => {
    const el = document.getElementById(fieldId)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    if (el instanceof HTMLElement) el.focus({ preventScroll: true })
  })
}
