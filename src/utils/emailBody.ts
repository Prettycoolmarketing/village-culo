// Shared plain-text <-> simple-HTML conversion for anywhere a founder/staff
// member writes an email body (the newsletter composer, sequence steps) —
// write normally, blank line between paragraphs, and it becomes real HTML
// automatically. Kept intentionally simple (paragraphs + line breaks only,
// no rich formatting) since every recipient's inbox renders it differently
// anyway; a plain, readable email beats a fragile "rich" one.

export function bodyTextToHtml(text: string): string {
  return text
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(Boolean)
    .map(p => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
    .join('')
}

/** Reverses bodyTextToHtml — used so an already-saved step/campaign opens back up as plain text to keep editing, not raw HTML tags. */
export function bodyHtmlToText(html: string): string {
  return html
    .replace(/<\/p>\s*<p>/gi, '\n\n')
    .replace(/<\/?p>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .trim()
}
