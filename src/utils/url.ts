// Normalises a user-entered URL so it always resolves to an absolute, openable link.
// Leaves mailto:/tel: links untouched and prepends https:// to bare domains ("example.com").
export function normalizeUrl(url?: string | null): string {
  const trimmed = (url ?? '').trim()
  if (!trimmed) return ''
  if (/^(https?|mailto|tel):/i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

export function isOpenableUrl(url?: string | null): boolean {
  return normalizeUrl(url) !== ''
}
