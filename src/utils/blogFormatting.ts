// Normalizes spacing in blog body text so it reads as a real article —
// a blank line between every paragraph, and around (not inside) a run of
// "- " list items — whether the text came from the AI writer, a manual
// paste, or someone typing straight into the Blog field. BlogContent (see
// StoryDetailPage) renders one <p>/<li> per line, so a wall of text with
// single newlines (or none at all) collapses into one dense block; this is
// what actually creates the visible spacing, both on the published page and
// in the plain textarea used for editing.
export function normalizeBlogSpacing(text: string): string {
  if (!text) return text

  const lines = text.replace(/\r\n/g, '\n').split('\n').map(l => l.trimEnd())
  const result: string[] = []
  let prevWasListItem = false
  let prevWasBlank = true // treat the very start as already "blank" — no leading blank line

  for (const line of lines) {
    const trimmed = line.trim()
    const isBlank = trimmed === ''
    if (isBlank) {
      if (!prevWasBlank) result.push('')
      prevWasBlank = true
      continue
    }

    const isListItem = /^[-*•]\s+/.test(trimmed)
    if (!prevWasBlank && isListItem !== prevWasListItem) result.push('')

    result.push(line)
    prevWasListItem = isListItem
    prevWasBlank = false
  }

  return result.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}
