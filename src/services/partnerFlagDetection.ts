import { partnerService, partnerFlagService, newPartnerFlag } from './partner'
import type { Story } from '../types'

// Keyword-based, same imperfect technique as recommendationDetection's
// hasPositiveContext — flags a story for a PCM staff member to look at, it
// never blocks publishing. False positives are expected and fine; a human
// makes the real call in CAPO.

const MIN_NAME_LENGTH = 4

const NEGATIVE_SIGNALS = [
  'avoid', 'terrible', 'awful', 'disappointed', 'disappointing', 'regret',
  'waste of money', 'waste of time', 'scam', 'ripoff', 'rip off', 'refund',
  'never again', 'worst', 'horrible', 'unreliable', 'broken', 'complaint',
  'poor service', 'poor quality', 'overpriced', 'don\'t recommend',
  'wouldn\'t recommend', 'stay away', 'not worth', 'let me down', 'letdown',
]

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function findMentionIndex(text: string, name: string): number {
  if (name.length < MIN_NAME_LENGTH) return -1
  try {
    const re = new RegExp(escapeRegex(name), 'i')
    const match = re.exec(text)
    return match ? match.index : -1
  } catch {
    return -1
  }
}

function negativeSignalNear(text: string, idx: number, nameLength: number, radius = 150): string | undefined {
  const snippet = text.slice(Math.max(0, idx - radius), idx + nameLength + radius).toLowerCase()
  return NEGATIVE_SIGNALS.find(w => snippet.includes(w))
}

function extractContext(text: string, idx: number, nameLength: number, radius = 100): string {
  const start = Math.max(0, idx - radius)
  const end   = Math.min(text.length, idx + nameLength + radius)
  const snip  = text.slice(start, end).trim()
  return `${start > 0 ? '…' : ''}${snip}${end < text.length ? '…' : ''}`
}

// Runs once per publish, over every active Partner — scoped low-cost since
// the Partner list is small (curated, not every business on the platform).
export async function scanStoryForPartnerFlags(story: Story): Promise<number> {
  const text = [story.title, story.summary, story.blog ?? ''].join(' ')
  if (!text.trim()) return 0

  const partners = partnerService.getAll({ status: 'active' })
  let flagged = 0

  for (const partner of partners) {
    const idx = findMentionIndex(text, partner.name)
    if (idx === -1) continue

    const already = partnerFlagService.getAll({ partnerId: partner.id })
      .some(f => f.storyId === story.id)
    if (already) continue

    const signal = negativeSignalNear(text, idx, partner.name.length)
    if (!signal) continue

    const flag = newPartnerFlag({
      partnerId: partner.id,
      storyId: story.id,
      founderId: story.founderId,
      reason: `Mentioned near "${signal}"`,
      contextSnippet: extractContext(text, idx, partner.name.length),
    })
    await partnerFlagService.upsert(flag)
    flagged++
  }

  return flagged
}
