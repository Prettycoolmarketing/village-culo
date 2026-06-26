import { useEffect } from 'react'

const SITE = 'CULO Village'

/**
 * Sets document.title for the current page.
 * Pass a string or array of segments — they join with " | " and append the site name.
 *
 * Examples:
 *   usePageTitle('Stories')              → "Stories | CULO Village"
 *   usePageTitle(['My Story', 'Stories']) → "My Story | Stories | CULO Village"
 */
export function usePageTitle(segments: string | string[]) {
  useEffect(() => {
    const parts = Array.isArray(segments) ? segments : [segments]
    document.title = [...parts, SITE].join(' | ')
  })
}
