// Some import sources (Instagram's own data export JSON) HTML-escape their
// text fields — an apostrophe comes through as the literal string "&#39;",
// "&" as "&amp;" — so caption/title text needs decoding back to plain text
// before it's used anywhere, or the markup itself ends up as visible page
// content and, via slugify, as literal digits/words baked into a URL.
const NAMED_ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
}

export function decodeHtmlEntities(text: string): string {
  if (!text) return text
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&([a-z]+);/gi, (match, name) => NAMED_ENTITIES[name.toLowerCase()] ?? match)
}
