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

// A channel/profile link (no specific video) has nothing to embed or preview —
// catches the mistake of pasting a whole channel where one video's link is
// expected, both when a founder is filling in the field and when rendering
// an already-published story that has one stored this way.
export function looksLikeChannelUrl(url?: string | null): boolean {
  if (!url || !/youtube\.com/i.test(url)) return false
  return /youtube\.com\/(@[\w.-]+|channel\/|c\/|user\/)/i.test(url) && !/[?&]v=|\/shorts\//i.test(url)
}
