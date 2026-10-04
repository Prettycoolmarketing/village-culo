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

// LinkedIn (and most other platforms) flags a meta description under 100
// characters as too thin to show a real preview — a short, punchy summary
// (the kind a founder is actively encouraged to write) was failing that
// check on its own even though there's plenty more real content to draw
// from. Pads a short summary out with the start of the blog body rather
// than replacing it outright, so the founder's own wording still leads.
const MIN_DESCRIPTION_LENGTH = 100

/** ~155 chars — prefers the human-written summary, falls back to (or pads with) the blog body. */
export function deriveSeoDescription(summary: string | undefined, blog: string | undefined): string {
  const cleanSummary = summary?.trim() ?? ''
  const cleanBlog = blog?.trim() ?? ''
  if (!cleanSummary) return truncateAtWord(cleanBlog, 155)
  if (cleanSummary.length >= MIN_DESCRIPTION_LENGTH) return truncateAtWord(cleanSummary, 155)
  const padding = cleanBlog && !cleanBlog.startsWith(cleanSummary) ? ` ${cleanBlog}` : ''
  return truncateAtWord(`${cleanSummary}${padding}`, 155)
}
