// CULO Village — shared claim-matching logic
//
// Was duplicated between claim-founder-profile (the "claim this profile"
// button) and find-curated-match (the automatic /join signup match) —
// extracted so there's exactly one implementation of "does this email
// plausibly belong to this founder," not two that could drift.
//
// Three tiers, not a single yes/no:
//   'verified' — exact claimEmail match (or a trusted ?key= token link,
//                checked by the caller before falling back to this).
//   'likely'   — no exact email on file, but the email's domain matches
//                one of the founder's own sites/socials, or the email's
//                local-part contains a real token from their name. Not
//                proof, but good enough to connect automatically while
//                flagging it for a human to glance at — see claimNotes
//                below — rather than either blocking the signup on a
//                missing claimEmail or silently creating a disconnected
//                duplicate profile.
//   'none'     — no real signal either way.

export const GENERIC_EMAIL_DOMAINS = new Set([
  'gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'icloud.com', 'me.com', 'live.com', 'aol.com', 'proton.me', 'protonmail.com',
])
const GENERIC_LINK_DOMAINS = new Set([
  'instagram.com', 'linkedin.com', 'youtube.com', 'tiktok.com', 'facebook.com', 'twitter.com', 'x.com', 'threads.net', 'spotify.com', 'linktr.ee',
])

export type ClaimMatch = 'verified' | 'likely' | 'none'
export type ClaimableFounder = Record<string, unknown> & {
  name?: string
  claimEmail?: string
  website?: string
  instagram?: string
  linkedin?: string
  youtube?: string
  podcast?: string
  socialLinks?: { url?: string }[]
}

export function normalizeToken(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '')
}

export function extractDomain(url?: string): string | null {
  if (!url) return null
  try {
    const u = new URL(/^https?:\/\//.test(url) ? url : `https://${url}`)
    return u.hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return null
  }
}

export function matchClaimEmail(email: string, founder: ClaimableFounder): ClaimMatch {
  const normalizedEmail = email.trim().toLowerCase()
  if (founder.claimEmail && founder.claimEmail.trim().toLowerCase() === normalizedEmail) return 'verified'

  const [localPart, emailDomain] = normalizedEmail.split('@')
  const localToken = normalizeToken(localPart ?? '')

  const ownDomains = [founder.website, founder.instagram, founder.linkedin, founder.youtube, founder.podcast, ...(founder.socialLinks?.map(l => l.url) ?? [])]
    .map(extractDomain)
    .filter((d): d is string => !!d && !GENERIC_LINK_DOMAINS.has(d))
  if (emailDomain && !GENERIC_EMAIL_DOMAINS.has(emailDomain) && ownDomains.includes(emailDomain)) return 'likely'

  const nameParts = (founder.name ?? '').toLowerCase().split(/\s+/).map(normalizeToken).filter(p => p.length >= 3)
  if (localToken.length >= 3 && nameParts.some(part => localToken.includes(part))) return 'likely'

  return 'none'
}
