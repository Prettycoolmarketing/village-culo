import type { Founder } from '../types'
import { getBusinesses } from '../services/businesses'

// When a founder has no real Voice & Brand Brief set (optional, not a
// signup requirement — see BrandBriefEditor), Rewrite with AI/Rewrite as a
// Culo Article used to just hard-block with "add a brief first," a dead end
// for anyone who never got around to it — including a founder managed by
// CAPO staff via Culo Members' "Manage content," who has no way to fill one
// in on the founder's own behalf. Falls back to what research already
// verified (the bio) as a stand-in voice, and confirmed research claims as
// a stand-in Insight Brief.
//
// Since there's no real founder-written brief to draw a CTA from in this
// fallback case, this also builds one explicitly: generate-blog's own
// FRAMEWORK_PROMPT states one exception to "no CTA" — "a real,
// founder-supplied call to action, if one exists in the brief." Naming the
// founder's real business and target audience here IS that: it lets the
// rewrite genuinely help market their business to the people it's actually
// for, tied back to what the original piece was about, rather than just
// restating the source material with nothing behind it.
export function buildFallbackBrief(founder: Founder | null | undefined): { voiceBrief?: string; insightBrief?: string } {
  const bio = founder?.bio?.trim()
  if (!founder || !bio) return {}

  const insightBrief = founder.insightBrief?.trim() || founder.evidenceLedger?.claims
    ?.filter(c => c.human_review !== 'rejected')
    .map(c => c.claim)
    .join(' ')

  const business = getBusinesses({ founderId: founder.id })[0]
  const ctaLine = business
    ? `\n\nCall to action: this piece exists to help ${founder.name} market ${business.name}${business.targetAudience ? ` to ${business.targetAudience}` : ''}. End with one genuine, specific sentence that connects what the piece actually said back to ${business.name}${business.website ? ` (${business.website})` : ''} — real and relevant to this piece's own topic, never a generic pitch or a bolted-on sales line.`
    : ''

  return { voiceBrief: `${bio}${ctaLine}`, insightBrief }
}
