// Search title/description are always derived from the content itself —
// Title and Blog/Summary work hand in hand to produce them — rather than
// asking a founder to separately type and maintain a duplicate meta title
// and description. No manual override field exists; this is the one path.

function truncateAtWord(text: string, max: number): string {
  const trimmed = text.trim()
  if (trimmed.length <= max) return trimmed
  const cut = trimmed.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trim()}…`
}

const SITE_SUFFIX = ' | CULO Village'

/** ~60 chars including the " | CULO Village" suffix search engines actually display. */
export function deriveSeoTitle(title: string): string {
  const clean = title.trim() || 'Untitled'
  const budget = 60 - SITE_SUFFIX.length
  return clean.length <= budget ? `${clean}${SITE_SUFFIX}` : `${truncateAtWord(clean, budget)}${SITE_SUFFIX}`
}

/** ~155 chars — prefers the human-written summary, falls back to the blog body. */
export function deriveSeoDescription(summary: string | undefined, blog: string | undefined): string {
  const source = (summary && summary.trim().length > 0) ? summary : (blog ?? '')
  return truncateAtWord(source, 155)
}
