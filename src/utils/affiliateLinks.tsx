import React from 'react'

export interface AffiliateLink {
  id: string
  name: string
  url: string
}

// Escapes regex special characters in a founder-entered name so it's safe
// to drop straight into a RegExp (an unescaped name containing e.g. "(" or
// "." would either throw or match something the founder never typed).
function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Turns one line of blog text into text + <a> nodes, linking every
// whole-word, case-sensitive match of an affiliate name to its URL.
// Whole-word (\b) so "Billow" doesn't also match inside "Billowing", and
// case-sensitive because a founder's affiliate name is usually a brand or
// handle where casing is part of the identity (e.g. "CULO" vs "culo").
// Applied at render time (see BlogContent) rather than baked into the
// stored blog text, so editing or removing a link here takes effect
// immediately on every story, past and future, not just new ones.
export function applyAffiliateLinks(text: string, links: AffiliateLink[] | undefined): React.ReactNode {
  const real = (links ?? []).filter(l => l.name.trim() && l.url.trim())
  if (real.length === 0) return text

  // Longest name first — otherwise a shorter name that's a substring of a
  // longer one (e.g. "Billow" inside "Billow Beach") could match and
  // consume the text before the longer, more specific name gets a turn.
  const sorted = [...real].sort((a, b) => b.name.length - a.name.length)
  const pattern = new RegExp(`\\b(${sorted.map(l => escapeRegExp(l.name.trim())).join('|')})\\b`, 'g')

  const parts = text.split(pattern)
  if (parts.length === 1) return text

  const byName = new Map(sorted.map(l => [l.name.trim(), l.url.trim()]))
  return parts.map((part, i) => {
    const url = byName.get(part)
    if (!url) return part
    return (
      <a key={i} href={url} target="_blank" rel="noopener noreferrer sponsored" className="underline underline-offset-2 decoration-primary/40 hover:decoration-primary text-inherit">
        {part}
      </a>
    )
  })
}
