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

// A raw uploaded file (Supabase Storage or any other direct host) has no
// platform to embed via iframe — it needs a native <video>/<audio> player
// instead. Distinguishes "founder uploaded a file directly" from "founder
// linked to YouTube/Spotify/etc", which need very different playback.
export function isDirectVideoUrl(url?: string | null): boolean {
  return !!url && /\.(mp4|mov|webm|m4v|avi|mkv)(\?|$)/i.test(url)
}
export function isDirectAudioUrl(url?: string | null): boolean {
  return !!url && /\.(mp3|m4a|wav|ogg|aac)(\?|$)/i.test(url)
}
