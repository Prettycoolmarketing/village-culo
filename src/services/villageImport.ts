import { slugify } from '../utils/slugify'
import { getFounderBySlug, getFounderByLinkedIn, getFounderByInstagram, normalizeLinkedInUrl, normalizeInstagramUrl, updateFounder } from './founders'
import { getBusinessBySlug, updateBusiness } from './businesses'
import { importedContentService, buildDraftImport } from './importedContent'
import { importedContentToInput, villageContentIntelligenceService } from './villageIntelligence'
import { buildStoryFromImport, publishStoryCore } from './publishStory'
import type { WriteResult } from '../lib/entityStore'
import { locations } from '../data/locations'
import { industries, UNSET_INDUSTRY } from '../data/industries'
import { topics as ALL_TOPICS, createCustomTopic } from '../data/topics'
import type { Founder, Business, Location, Industry, Topic } from '../types'
import type { ImportedContent } from '../types/importedContent'
import type {
  VillageImportPackage,
  VillageImportFounder,
  VillageImportBusiness,
  VillageImportContent,
  VIFFounderPreview,
  VIFValidationResult,
  VIFImportOptions,
  VIFImportResult,
  VIFImportedFounder,
} from '../types/villageImport'

// ─── Location matching ────────────────────────────────────────────────────────

// A founder with no city/state given (common for a remote-first or
// nationally-known guest) used to silently default to locations[0]
// (Brisbane) — a specific, wrong-looking city with no basis in anything
// the row actually said. 'regional-remote' ("Regional or Remote
// Australia") is the real, honest fallback: still correctly Australian,
// but doesn't invent a city nobody claimed.
const UNKNOWN_LOCATION_FALLBACK_ID = 'regional-remote'

// Real city/state text that doesn't match the fixed location list (a real
// town like Griffith, Morayfield or Mandurah, none of which are on it) used
// to fall to the generic fallback with zero trace of it happening — unlike
// an industry mismatch, which already writes an admin-visible warning. A
// batch of 20 real founders hit this for 7 of them; returning whether it
// matched lets the caller flag it the same way, instead of silently
// discarding real, curator-provided location detail.
function resolveLocation(city?: string, state?: string): { location: Location; matched: boolean; rawInput?: string } {
  if (city || state) {
    const needle = `${city ?? ''} ${state ?? ''}`.toLowerCase()
    const match = locations.find(l =>
      needle.includes(l.name.toLowerCase()) ||
      needle.includes(l.state.toLowerCase()) ||
      (l.slug && needle.includes(l.slug))
    )
    if (match) return { location: match, matched: true }
    return {
      location: locations.find(l => l.id === UNKNOWN_LOCATION_FALLBACK_ID) ?? locations[0]!,
      matched: false,
      rawInput: `${city ?? ''}${city && state ? ', ' : ''}${state ?? ''}`.trim(),
    }
  }
  return { location: locations.find(l => l.id === UNKNOWN_LOCATION_FALLBACK_ID) ?? locations[0]!, matched: true }
}

// A curated row's Industry/Topics are specific, real phrases ("quantity
// surveying", "construction contracts") — the site's own predefined lists
// are broad categories ("Construction & Trades"). A plain substring check
// (does one string literally contain the other) only catches a match when
// the words happen to appear in the same order, which most real phrases
// don't — "health & fitness" vs "Fitness & Wellness" is a real, obvious
// match a human reads instantly and this old check missed entirely. This
// compares the two as sets of significant words instead.
// 'services' specifically excluded too — it's the generic suffix on so many
// unrelated categories (Professional Services, Financial Services, Home
// Services, Childcare & Family Services…) that matching on it alone
// produced confident-looking but wrong pairings, e.g. a startup venture
// advisor's "Professional Services" tag landing on "Childcare & Family
// Services" purely because both end in the same generic word.
const STOPWORDS = new Set(['and', 'the', 'a', 'an', 'of', 'for', 'in', 'on', '&', 'services'])
function significantWords(s: string): Set<string> {
  return new Set(
    s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !STOPWORDS.has(w)),
  )
}
// A plain shared-word count let one generic word ("leadership", "development",
// "business") make a match all on its own — confirmed live: a fitness
// franchisee's own topic list picked up "church leadership" (an unrelated
// founder's topic, created earlier in the same batch's shared pool) purely
// because both phrases contained the word "leadership". The fix is standard
// IDF-style weighting: a word that appears across many different topic names
// is a weak, generic signal (a common modifier), while a word that appears
// in very few is a strong, specific one — "fitness" (rare across topic
// names) should decide a match; "leadership" (common across many) shouldn't
// on its own. `docFreq` is how many topic names in the pool contain each
// word; threshold tuned so one distinctive shared word matches, but one
// generic shared word alone doesn't.
function buildWordDocFrequency(pool: { name: string }[]): Map<string, number> {
  const freq = new Map<string, number>()
  for (const t of pool) {
    for (const w of significantWords(t.name)) freq.set(w, (freq.get(w) ?? 0) + 1)
  }
  return freq
}
function weightedOverlap(a: Set<string>, b: Set<string>, docFreq: Map<string, number>): number {
  let score = 0
  for (const w of a) if (b.has(w)) score += 1 / (docFreq.get(w) ?? 1)
  return score
}
const MATCH_THRESHOLD = 0.5

// ─── Industry matching ────────────────────────────────────────────────────────

// Checks every industry the row gave (not just the first), and returns
// whether the result is a genuine match or the fallback default — a founder
// whose given industries don't fit anything real should never be silently
// mislabelled with no way to know it happened; see the "industry didn't
// match anything" warning in validateVIF.
const industryDocFreq = buildWordDocFrequency(industries)

function resolveIndustry(industryNames?: string[]): { industry: Industry; matched: boolean } {
  if (industryNames && industryNames.length > 0) {
    let best: { industry: Industry; score: number } | null = null
    for (const raw of industryNames) {
      const words = significantWords(raw)
      for (const candidate of industries) {
        const score = weightedOverlap(words, significantWords(candidate.name), industryDocFreq)
        if (score >= MATCH_THRESHOLD && (!best || score > best.score)) best = { industry: candidate, score }
      }
    }
    if (best) return { industry: best.industry, matched: true }
  }
  // industries[0] ("Marketing & Advertising") isn't a deliberate safe
  // default, it's just array position zero — every genuinely unmatched
  // founder (a pastor, a VC advisor with no matching category) was landing
  // in that one specific real category by accident. UNSET_INDUSTRY is the
  // actual "we don't know" sentinel already used for this exact situation
  // elsewhere (see joinFlow.ts).
  return { industry: UNSET_INDUSTRY, matched: false }
}

// ─── Topic matching ───────────────────────────────────────────────────────────

// `pool` is shared across the whole import batch (seeded with the real
// predefined topics, extended as new custom ones get created) so that two
// different founders both tagged "quantity surveying" end up sharing the
// exact same Topic record instead of each silently getting their own
// separately-generated one with the same name.
function resolveTopics(topicNames: string[] | undefined, pool: Topic[]): Topic[] {
  if (!topicNames || topicNames.length === 0) return []
  const resolved: Topic[] = []
  const seenIds = new Set<string>()
  // Recomputed per call, not cached — pool grows as custom topics are added
  // through the batch, and a word's frequency has to reflect the pool's
  // current state (a later founder should see topics earlier founders
  // created; their word-frequency counts have to include them too).
  const topicDocFreq = buildWordDocFrequency(pool)
  for (const raw of topicNames) {
    const words = significantWords(raw)
    let best: { topic: Topic; score: number } | null = null
    for (const candidate of pool) {
      const score = weightedOverlap(words, significantWords(candidate.name), topicDocFreq)
      if (score >= MATCH_THRESHOLD && (!best || score > best.score)) best = { topic: candidate, score }
    }
    // Two different raw phrases in the same row (e.g. a Topics cell entry
    // and a Speaking Topics phrase) can both legitimately best-match the
    // same predefined Topic — pushing it twice produced real, live
    // duplicate entries in a founder's topic list (confirmed: Anna Porter's
    // had "prophetic ministry" listed twice). Only the first match for a
    // given resolved topic counts.
    if (best) {
      if (seenIds.has(best.topic.id)) continue
      seenIds.add(best.topic.id)
      resolved.push(best.topic)
    } else {
      // A real, specific topic this founder was actually tagged with, and
      // nothing close enough exists yet — becomes a real custom Topic
      // (createCustomTopic) rather than silently vanishing, same as any
      // founder typing a new topic elsewhere in the app already can.
      const custom = createCustomTopic(raw)
      pool.push(custom)
      seenIds.add(custom.id)
      resolved.push(custom)
    }
  }
  return resolved.slice(0, 10)
}

// ─── Slug uniqueness ──────────────────────────────────────────────────────────

function uniqueSlug(base: string, taken: Set<string>): string {
  let candidate = base
  let n = 2
  while (taken.has(candidate) || !!getFounderBySlug(candidate)) {
    candidate = `${base}-${n}`
    n++
  }
  return candidate
}

function uniqueBizSlug(base: string, taken: Set<string>): string {
  let candidate = base
  let n = 2
  while (taken.has(candidate) || !!getBusinessBySlug(candidate)) {
    candidate = `${base}-${n}`
    n++
  }
  return candidate
}

// ─── Supplementary notes builder ─────────────────────────────────────────────
// Books, courses, events, communities stored as structured text until dedicated
// entity types exist.

function buildSupplementaryNotes(f: VillageImportFounder, adminNotes?: string): string | undefined {
  const parts: string[] = []
  if (adminNotes) parts.push(`ADMIN NOTES: ${adminNotes}`)
  // The founder's own original wording — never published as-is (see
  // buildCuratedBio/buildContentItemBody), but kept here so it's not lost: a real staff
  // member can read it before publishing, and the founder gets it back the
  // moment they claim the profile and can write in their own voice again.
  if (f.bio?.trim()) parts.push(`ORIGINAL SOURCE BIO (not published — see profile bio for the published summary): ${paragraphize(f.bio.trim())}`)
  if (f.notes) parts.push(`RESEARCH NOTES: ${f.notes}`)
  if (f.speakingTopics && f.speakingTopics.length > 0) {
    parts.push(`SPEAKING TOPICS: ${f.speakingTopics.join(', ')}`)
  }
  if (f.books && f.books.length > 0) {
    const bk = f.books.map(b => `${b.title}${b.url ? ` (${b.url})` : ''}${b.description ? ` — ${b.description}` : ''}`).join(' | ')
    parts.push(`BOOKS: ${bk}`)
  }
  if (f.courses && f.courses.length > 0) {
    const cs = f.courses.map(c => `${c.title}${c.url ? ` (${c.url})` : ''}`).join(' | ')
    parts.push(`COURSES: ${cs}`)
  }
  if (f.events && f.events.length > 0) {
    const ev = f.events.map(e => `${e.name}${e.date ? ` [${e.date}]` : ''}${e.location ? ` @ ${e.location}` : ''}`).join(' | ')
    parts.push(`EVENTS: ${ev}`)
  }
  if (f.communities && f.communities.length > 0) {
    const cm = f.communities.map(c => `${c.name}${c.url ? ` (${c.url})` : ''}`).join(' | ')
    parts.push(`COMMUNITIES: ${cm}`)
  }
  if (f.recommendations && f.recommendations.length > 0) {
    const rc = f.recommendations.map(r => `${r.name}${r.type ? ` [${r.type}]` : ''}${r.url ? ` (${r.url})` : ''}`).join(' | ')
    parts.push(`RECOMMENDATIONS: ${rc}`)
  }
  if (f.sourceLinks && f.sourceLinks.length > 0) {
    parts.push(`SOURCE LINKS: ${f.sourceLinks.join(', ')}`)
  }
  return parts.length > 0 ? parts.join('\n') : undefined
}

// ─── URL validation ───────────────────────────────────────────────────────────

function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// ─── Raw spreadsheet row adapter ───────────────────────────────────────────────
// The curation workflow's real output (Claude in Excel, Sellable, a plain
// spreadsheet-to-JSON export) is a flat array of rows with human column
// headers ("Full Name", "YouTube URL", "Business Location", …) — not the
// camelCase VillageImportFounder shape, and not wrapped in a {batchName,
// founders: [...]} package at all. That's not a malformed file, it's just a
// different, equally real shape; this converts it into one instead of
// rejecting it.

// A curated Bio arrives as one continuous block with no line breaks at all —
// normalizeBlogSpacing (used when this becomes a story's blog body) only
// tidies up *existing* blank lines, so a bio with none stayed one dense,
// hard-to-read paragraph on the published page regardless. Groups sentences
// into short paragraphs so it actually reads like an article. Deliberately
// simple (splits on ". "/"! "/"? " followed by a capital letter) — good
// enough for real biographical prose, not a full sentence-boundary parser.
function paragraphize(text: string, sentencesPerParagraph = 2): string {
  const sentences = text
    .trim()
    .split(/(?<=[.!?])\s+(?=[A-Z])/)
    .map(s => s.trim())
    .filter(Boolean)
  if (sentences.length <= sentencesPerParagraph) return text.trim()

  const paragraphs: string[] = []
  for (let i = 0; i < sentences.length; i += sentencesPerParagraph) {
    paragraphs.push(sentences.slice(i, i + sentencesPerParagraph).join(' '))
  }
  return paragraphs.join('\n\n')
}

// ─── CULO-voiced curated summary ─────────────────────────────────────────────
// Copyright attaches to a founder's specific wording, not to the underlying
// facts about them (their name, industry, topic, platform, location) — so a
// curated profile's *published* bio and content descriptions are CULO's own
// factual, third-person sentence about a public person's public activity,
// never their scraped words republished verbatim. The original source text
// still exists (see buildSupplementaryNotes' ORIGINAL SOURCE BIO), just not
// as anything public until the real founder claims the profile and can
// write in their own voice.
function describePlatformsPhrase(f: Pick<VillageImportFounder, 'youtubeUrl' | 'instagramUrl' | 'podcastUrl' | 'website'>): string {
  const platforms: string[] = []
  if (f.youtubeUrl)   platforms.push('YouTube')
  if (f.podcastUrl)   platforms.push('their podcast')
  if (f.instagramUrl) platforms.push('Instagram')
  if (f.website)      platforms.push('their website')
  if (platforms.length === 0) return ''
  if (platforms.length === 1) return ` online on ${platforms[0]}`
  return ` online across ${platforms.slice(0, -1).join(', ')} and ${platforms[platforms.length - 1]}`
}

function joinNaturally(items: string[]): string {
  if (items.length === 0) return ''
  if (items.length === 1) return items[0]!
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`
}

// A real, curator-written Headline ("Senior Pastor, Kingdom Culture Church")
// is always a better public role descriptor than the resolved Industry —
// industries are a fixed list the app has to force every founder into, and
// when nothing real matches (industryMatched is false), asserting that
// forced-fallback category in public text reads as flatly wrong (a pastor
// described as "a marketing & advertising founder"). Only ever states the
// industry when it's a genuine match.
function resolveCuratedRole(
  headline: string | undefined,
  businessName: string | undefined,
  industryName: string,
  industryMatched: boolean,
): string {
  if (headline) return headline
  if (businessName) return `founder of ${businessName}`
  if (industryMatched) return `a ${industryName.toLowerCase()} founder`
  return 'a founder'
}

function lowercaseFirst(s: string): string {
  return s.length > 0 ? s[0]!.toLowerCase() + s.slice(1) : s
}

// "talking about X" reads fine for a neutral interest (SaaS, makeup artistry)
// but flattens a genuine cause — grief, addiction, poverty, faith — into a
// hobby topic, which reads as tone-deaf regardless of intent. A Speaking
// Topic ("Tackling period poverty in Australia") is curator-written with
// real agency already in it, so it's preferred over the bare taxonomy
// Topic name ("period poverty") whenever one exists; the real business
// description (already dignified, real research, not a scraped bio) gets
// folded in too instead of leaving the cause as a single flat keyword.
function buildCuratedBio(
  role: string,
  topicName: string | undefined,
  speakingTopic: string | undefined,
  businessDescription: string | undefined,
  displayName: string,
  locationLabel: string,
  platformsPhrase: string,
): string {
  const subjectPhrase = speakingTopic ? lowercaseFirst(speakingTopic) : topicName
  const about = subjectPhrase ? `, whose work focuses on ${subjectPhrase}` : ''
  const bizSentence = businessDescription ? ` ${businessDescription}` : ''
  // No "Curated by CULO..." line here — the profile page's own curated
  // banner (FounderProfilePage) already states that, right above this bio.
  // The article body's closing paragraph keeps its own version of this,
  // since an article page has no such banner.
  return `${displayName} is ${role}, based in ${locationLabel}${about}${platformsPhrase}.${bizSentence}`.trim()
}

// A one-sentence bio is fine on a profile card, but a content item's
// description becomes the *entire* published article body verbatim
// (ImportedContent.description -> Story.blog, see publishStory.ts) — one
// generic sentence shared identically across every one of a founder's
// linked pieces reads as a stub, and reading identically to every other
// item defeats the point of having separate article pages at all. This
// builds a real, per-item piece: what this specific link actually is (a
// podcast appearance vs. a website bio vs. their own article), grounded in
// whatever real context the curation sheet captured (business description,
// speaking topics) — still entirely CULO's own writing, never the
// founder's scraped prose.
// Every one of a founder's links gets a real, substantial write-up — a
// thin "Watch the podcast" stub is worse than a repeated paragraph (a
// founder confirmed this directly: a stub reads as broken, not as
// deliberately lightweight). The real duplicate-content risk this used to
// solve by thinning these out is instead handled at the *publishing* step —
// CAPO only ever turns one item per founder into an actual live Story page
// (see the founders-page tooling); the other items' descriptions are still
// worth writing properly since staff read them, and any of them could
// become the real published piece.
// Splits on sentence boundaries — same simple heuristic as paragraphize()
// above (". "/"! "/"? " followed by a capital letter).
// Allows an optional closing quote/bracket between the sentence-ending
// punctuation and the following space — without it, a sentence ending in a
// quote ("...the Startup Olympics.") never counted as a boundary, silently
// merging it with the next sentence and shrinking how many real rotation
// states a founder's Key Facts actually had (confirmed live: this collapsed
// 3 real sentences into 2, so two of a founder's three content items landed
// on the same rotation offset and read identically anyway).
function splitSentences(text: string): string[] {
  return text.split(/(?<=[.!?]["')]?)\s+(?=[A-Z])/).map(s => s.trim()).filter(Boolean)
}

// Confirmed live: a founder's article/YouTube/podcast pages were "literally
// all the same" — every item drew the exact same Key Facts paragraph
// word-for-word, so the only thing distinguishing them was which title sat
// above identical text. There's only ever one real Key Facts paragraph per
// founder (not one per link), so genuine per-item variety has to come from
// presenting that same real material differently — rotating which
// sentence leads changes what's said first and what's said last without
// inventing anything or dropping any fact.
function rotateStartingAt(sentences: string[], index: number): string {
  if (sentences.length <= 1) return sentences.join(' ')
  const offset = index % sentences.length
  return [...sentences.slice(offset), ...sentences.slice(0, offset)].join(' ')
}

function buildContentItemBody(
  displayName: string,
  role: string,
  businessDescription: string | undefined,
  topicNames: string[],
  speakingTopics: string[],
  keyFacts: string | undefined,
  locationLabel: string,
  itemIndex: number,
): string {
  // A "This is X's appearance on YouTube" line before the real substance is
  // pure throat-clearing — no journalist opens a piece by announcing what
  // format it's in, and it added nothing a reader couldn't already see from
  // the page's own title and source link. The opening paragraph now goes
  // straight from who they are into the real substance (keyFacts) as one
  // flowing paragraph, the way an actual short profile piece reads.
  const subjectTopics = speakingTopics.length > 0 ? speakingTopics : topicNames
  const keyFactsSentences = keyFacts ? splitSentences(keyFacts) : []
  const substance = keyFactsSentences.length > 0
    ? rotateStartingAt(keyFactsSentences, itemIndex)
    : (subjectTopics.length > 0 ? `Their work covers ${joinNaturally(subjectTopics)}.` : '')
  const p1 = [`${displayName} is ${role}, based in ${locationLabel}.`, substance].filter(Boolean).join(' ')

  const p2 = businessDescription || ''

  const p3 = `This profile was curated by CULO Village from publicly available content, not written by ${displayName} themselves — the original posts and links are above, straight from their own channels. If this is your profile and you'd like to update it in your own words, you can claim it or request its removal using the links on this page.`

  return [p1, p2, p3].filter(Boolean).join('\n\n')
}

function str(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined
  const t = v.trim()
  return t.length > 0 ? t : undefined
}

// "construction contracts, contract administration, AI in construction" → 3
// trimmed, non-empty entries — used for Topics/Industries/Speaking Topics,
// which all arrive as one comma-separated cell rather than a real array.
function splitList(v: unknown): string[] | undefined {
  const s = str(v)
  if (!s) return undefined
  const parts = s.split(',').map(p => p.trim()).filter(Boolean)
  return parts.length > 0 ? parts : undefined
}

// A row that already looks like a proper VillageImportFounder (has a
// camelCase fullName) passes through untouched; only a raw spreadsheet row
// (has "Full Name" instead) gets converted.
function looksLikeRawRow(row: Record<string, unknown>): boolean {
  return !('fullName' in row) && ('Full Name' in row || 'Full name' in row)
}

function normalizeRawFounderRow(row: Record<string, unknown>): VillageImportFounder {
  const fullName = str(row['Full Name']) ?? str(row['Full name']) ?? 'Unknown Founder'

  // Curator's own working notes (fit assessment, evidence, flagged link
  // issues) — not part of the founder's public profile, but too useful to
  // silently drop. Lands in `notes`, which buildSupplementaryNotes() already
  // surfaces as admin-only claimNotes on the founder record.
  const curatorNotes = [
    str(row['Culo Village Fit']) && `Culo Village Fit: ${row['Culo Village Fit']}`,
    str(row['Fit Evidence']) && `Fit Evidence: ${row['Fit Evidence']}`,
    str(row['Link Issues']) && `Link Issues: ${row['Link Issues']}`,
    str(row['Other businesses']) && `Other businesses: ${row['Other businesses']}`,
  ].filter((s): s is string => !!s).join('\n')

  const businessName = str(row['Business Name'])
  // A second real business (e.g. a founder who owns both a salon and a
  // separate venue) used to only ever become free text in "Other
  // businesses" — never a real, visitable Business page, unlike the first
  // one. "Business Name 2" is the same simple pattern as the first business
  // columns, for when a second business is worth its own real page; genuine
  // passing mentions with no real detail behind them still belong in "Other
  // businesses" as before.
  const businessName2 = str(row['Business Name 2'])
  const businesses: VillageImportBusiness[] | undefined = businessName ? [
    {
      name: businessName,
      website: str(row['Business Website']),
      description: str(row['Business Description']),
      industry: str(row['Industry']),
      role: str(row['Role']),
      location: str(row['Business Location']),
    },
    ...(businessName2 ? [{
      name: businessName2,
      website: str(row['Business Website 2']),
      description: str(row['Business Description 2']),
      industry: str(row['Industry']),
      location: str(row['Business Location']),
    }] : []),
  ] : undefined

  // One content entry per real link this founder actually has — Article,
  // YouTube, Podcast — not just a single "best" one. The whole point of a
  // curated import is that it should read like this founder connected their
  // own accounts and published each piece themselves, the same as anyone
  // who joins directly; picking only one link and dropping the rest doesn't
  // match that. Every entry gets the founder's own bio as its description —
  // without it, an entry has no description of its own, falls well under
  // MIN_AUTO_PUBLISH_DESCRIPTION_LENGTH, and silently stays a bare linked
  // embed instead of becoming its own real, published article page.
  const headline = str(row['Headline'])
  // Kept as the raw source bio only — buildSupplementaryNotes tucks this
  // into claimNotes (admin-only), and importVIF generates the actual
  // *published* bio/content descriptions itself (buildCuratedBio/buildContentItemBody),
  // rather than this scraped text going out verbatim under the founder's
  // name before they've ever agreed to any of it.
  const rawBio = str(row['Bio'])
  const articleUrl  = str(row['Article URL'])
  const youtubeUrl  = str(row['YouTube URL'])
  const podcastUrl  = str(row['Podcast URL'])
  const digitalProductUrl = str(row['Digital Product URL'])
  // `platform` here is which VIF field this link actually came from (we
  // know this structurally — no URL-sniffing needed), not a display label —
  // buildContentItemBody uses it to write each item its own real, distinct
  // paragraph instead of stamping the same generic text on all of them.
  const content: VillageImportContent[] = (
    [
      articleUrl        ? { title: headline ?? `${fullName}'s article`, url: articleUrl,        platform: 'article'          } : undefined,
      youtubeUrl        ? { title: `${fullName} on YouTube`,            url: youtubeUrl,        platform: 'youtube'          } : undefined,
      podcastUrl        ? { title: `${fullName} on Podcast`,            url: podcastUrl,        platform: 'podcast'          } : undefined,
      // Without this, a real Digital Product URL only ever landed in
      // admin-only notes text — never a real clickable link anywhere on
      // the founder's actual page. Same pattern as the others: a plain
      // content entry, its own real link out.
      digitalProductUrl ? { title: `${fullName}'s digital product`,     url: digitalProductUrl, platform: 'digital-product' } : undefined,
    ] as (VillageImportContent | undefined)[]
  ).filter((c): c is VillageImportContent => !!c)

  return {
    fullName,
    headline,
    bio: rawBio,
    country: str(row['Country']),
    state: str(row['State']),
    city: str(row['City']),
    website: str(row['Website']),
    linkedinUrl: str(row['LinkedIn URL']),
    youtubeUrl: str(row['YouTube URL']),
    instagramUrl: str(row['Instagram URL']),
    tiktokUrl: str(row['TikTok URL']),
    podcastUrl: str(row['Podcast URL']),
    claimEmail: str(row['Claim Email']),
    keyFacts: str(row['Key Facts']),
    topics: splitList(row['Topics']),
    industries: splitList(row['Industries']),
    speakingTopics: splitList(row['Speaking Topics']),
    businesses,
    content,
    sourceLinks: digitalProductUrl ? [digitalProductUrl] : undefined,
    notes: curatorNotes || undefined,
  }
}

// ─── Validate ─────────────────────────────────────────────────────────────────

// `curatedBy` is whichever staff member is actually running this import
// (their derived display name, e.g. "Shakas" or "Gia" — see
// DashboardBulkImportPage) — always appended to the batch's name so the
// import history is attributable at a glance, whether the file brought its
// own name or not. Multiple staff each importing their own lists is exactly
// the case this exists for: "Untitled batch — 2026-09-26" told you nothing
// about who actually curated it.
function withCuratorLabel(name: string, curatedBy?: string): string {
  if (!curatedBy) return name
  return `${name} · curated by ${curatedBy}`
}

export function parseVIF(raw: string, curatedBy?: string): { pkg: VillageImportPackage | null; error: string | null } {
  try {
    const parsed = JSON.parse(raw) as unknown
    if (parsed === null || typeof parsed !== 'object') return { pkg: null, error: 'JSON must be an object or an array of founders.' }

    // A bare array — a raw spreadsheet export with no {batchName, founders}
    // wrapper at all — is founders on its own, not a malformed package.
    const isBareFounderArray = Array.isArray(parsed)
    const founderList = isBareFounderArray ? (parsed as unknown[]) : undefined

    const obj: Record<string, unknown> = isBareFounderArray
      ? { founders: founderList }
      : (parsed as Record<string, unknown>)

    // batchName is only ever used as a label (the import history log, the
    // preview screen) — nothing downstream depends on it structurally, so
    // hard-failing an otherwise-good file just because whatever produced it
    // (Claude, ChatGPT, Sellable) used a slightly different key, or left it
    // out altogether, was blocking real, importable batches for no real
    // reason. Accept the common alternate keys, and default it rather than
    // reject the file if none of them are present.
    if (!obj.batchName) {
      const altKey = ['batch_name', 'name', 'title'].find(k => typeof obj[k] === 'string' && (obj[k] as string).trim())
      const base = altKey
        ? (obj[altKey] as string)
        : new Date().toISOString().slice(0, 10)
      obj.batchName = withCuratorLabel(base, curatedBy)
    } else {
      obj.batchName = withCuratorLabel(obj.batchName as string, curatedBy)
    }

    if (!Array.isArray(obj.founders)) return { pkg: null, error: 'Missing required field: founders (must be an array)' }
    if (obj.founders.length === 0) return { pkg: null, error: 'founders array is empty' }

    // Convert any row still using raw spreadsheet column names (whether the
    // file was a bare array or already wrapped in {batchName, founders}) —
    // real VIF founders pass through untouched.
    obj.founders = (obj.founders as unknown[]).map(f => {
      if (typeof f !== 'object' || f === null) return f
      const row = f as Record<string, unknown>
      return looksLikeRawRow(row) ? normalizeRawFounderRow(row) : row
    })

    return { pkg: obj as unknown as VillageImportPackage, error: null }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Invalid JSON'
    return { pkg: null, error: `JSON parse error: ${msg}` }
  }
}

export function validateVIF(pkg: VillageImportPackage): VIFValidationResult {
  const globalErrors: string[] = []
  const globalWarnings: string[] = []
  const slugsTaken = new Set<string>()
  const founders: VIFFounderPreview[] = []
  let totalBusinesses = 0
  let totalContent = 0

  for (let i = 0; i < pkg.founders.length; i++) {
    const f = pkg.founders[i]
    const errors: string[] = []
    const warnings: string[] = []

    const displayName = f.preferredName?.trim() || f.fullName?.trim() || `Founder ${i + 1}`

    if (!f.fullName?.trim()) errors.push('fullName is required')
    if (!f.bio?.trim()) warnings.push('bio is missing — profile will have no description')
    if (!f.city && !f.state) warnings.push('No location — will default to Australia')
    if (!f.industries || f.industries.length === 0) warnings.push('No industry — will use first available industry')

    const baseSlug = f.slug?.trim() || slugify(f.preferredName?.trim() || f.fullName?.trim() || `founder-${i}`)
    let resolvedSlug = baseSlug
    if (slugsTaken.has(resolvedSlug) || !!getFounderBySlug(resolvedSlug)) {
      if (slugsTaken.has(resolvedSlug)) {
        errors.push(`Slug "${resolvedSlug}" is already used within this batch`)
      } else {
        warnings.push(`Slug "${resolvedSlug}" already exists in Village — will auto-suffix`)
      }
      let n = 2
      while (slugsTaken.has(resolvedSlug) || !!getFounderBySlug(resolvedSlug)) {
        resolvedSlug = `${baseSlug}-${n}`
        n++
      }
    }
    slugsTaken.add(resolvedSlug)

    const isDuplicate = !!getFounderBySlug(baseSlug)

    const bizCount = f.businesses?.length ?? 0
    const contentCount = f.content?.length ?? 0
    totalBusinesses += bizCount
    totalContent += contentCount

    if (f.website && !isValidUrl(f.website)) warnings.push(`website URL appears invalid: ${f.website}`)
    if (f.linkedinUrl && !isValidUrl(f.linkedinUrl)) warnings.push('linkedinUrl appears invalid')
    if (f.youtubeUrl && !isValidUrl(f.youtubeUrl)) warnings.push('youtubeUrl appears invalid')

    f.content?.forEach((c, ci) => {
      if (!c.url) errors.push(`content[${ci}] missing url`)
      else if (!isValidUrl(c.url)) warnings.push(`content[${ci}] "${c.title}" has an invalid URL`)
    })

    founders.push({
      index: i,
      displayName,
      resolvedSlug,
      businessCount: bizCount,
      contentCount,
      isDuplicate,
      errors,
      warnings,
    })
  }

  const hasErrors = founders.some(f => f.errors.length > 0) || globalErrors.length > 0

  return {
    isValid: !hasErrors,
    founderCount: pkg.founders.length,
    totalBusinesses,
    totalContent,
    founders,
    globalErrors,
    globalWarnings,
  }
}

// ─── Import ───────────────────────────────────────────────────────────────────

/**
 * Awaits a write and retries it once on failure before giving up — bulk import
 * is exactly the situation where a single transient network hiccup shouldn't
 * sink one founder's record out of a 500-row batch.
 */
async function writeWithRetry(write: () => Promise<WriteResult>): Promise<WriteResult> {
  const first = await write()
  if (first.success) return first
  return write()
}

export async function importVIF(pkg: VillageImportPackage, options: VIFImportOptions): Promise<VIFImportResult> {
  const now = new Date().toISOString()
  const created: VIFImportedFounder[] = []
  const skipped: string[] = []
  const errors: { name: string; error: string }[] = []
  let businessesCreated = 0
  let contentCreated = 0
  let intelGenerated = 0
  let storiesCreated = 0
  // Below this, a content entry's description isn't enough to write a real
  // blog from — it stays an ImportedContent-only embed rather than
  // becoming a Story page with almost nothing on it.
  const MIN_AUTO_PUBLISH_DESCRIPTION_LENGTH = 40

  const slugsTaken = new Set<string>()
  const bizSlugsTaken = new Set<string>()
  // Shared across the whole batch — see resolveTopics — so two founders
  // tagged with the same real-world topic end up sharing one Topic record.
  const topicsPool: Topic[] = [...ALL_TOPICS]

  for (const f of pkg.founders) {
    const displayName = f.preferredName?.trim() || f.fullName?.trim() || 'Unknown'

    try {
      // Identity match — LinkedIn or Instagram first, since either
      // actually identifies a real person, unlike a name two different
      // people could share (this has already happened on a real curated
      // batch: two different people named Rohit Bhargava). Instagram
      // matters as its own check, not just a LinkedIn substitute — a
      // founder can post under a personal name on LinkedIn but under a
      // completely different brand/handle on Instagram (e.g. "Anaita
      // Sukar" personally, "Sell Anything Online" as her Instagram handle),
      // so a name match alone would neither catch that as a duplicate nor
      // correctly tell two different people apart. Falls back to the
      // name/slug match only when neither side has a social URL to check —
      // if BOTH sides have one and they disagree, that's positive evidence
      // this is a different person with the same name, not a duplicate.
      const baseSlug = f.slug?.trim() || slugify(displayName)
      const bySlug = getFounderBySlug(baseSlug)
      const byLinkedIn = f.linkedinUrl?.trim() ? getFounderByLinkedIn(f.linkedinUrl) : undefined
      const byInstagram = !byLinkedIn && f.instagramUrl?.trim() ? getFounderByInstagram(f.instagramUrl) : undefined
      const socialMatch = byLinkedIn ?? byInstagram
      const slugMatchIsActuallyDifferentPerson = !!(
        !socialMatch && (
          (bySlug?.linkedin?.trim() && f.linkedinUrl?.trim() && normalizeLinkedInUrl(bySlug.linkedin) !== normalizeLinkedInUrl(f.linkedinUrl)) ||
          (bySlug?.instagram?.trim() && f.instagramUrl?.trim() && normalizeInstagramUrl(bySlug.instagram) !== normalizeInstagramUrl(f.instagramUrl))
        )
      )
      const existingFounder = socialMatch ?? (slugMatchIsActuallyDifferentPerson ? undefined : bySlug)

      if (existingFounder) {
        if (options.skipDuplicates && !options.overwriteDuplicates) {
          skipped.push(displayName)
          continue
        }
      }

      const founderId = existingFounder?.id ?? crypto.randomUUID()
      const resolvedSlug = existingFounder ? existingFounder.slug : uniqueSlug(baseSlug, slugsTaken)
      slugsTaken.add(resolvedSlug)

      // Resolve location, industry, topics
      const { location, matched: locationMatched, rawInput: rawLocationInput } = resolveLocation(f.city, f.state)
      const { industry, matched: industryMatched } = resolveIndustry(f.industries)
      const topics   = resolveTopics(f.topics, topicsPool)
      // Not a failure — the founder still imports fine — but a silently
      // wrong industry/location with no trace of it happening is worse than
      // an admin-visible note. Surfaces in this founder's own Edit popup
      // (Profile tab, "Curator notes"), which the draft-first workflow
      // already has staff opening before they publish anyone.
      const industryWarning = (!industryMatched && f.industries && f.industries.length > 0)
        ? `Industry mismatch: "${f.industries.join(', ')}" didn't match anything real — saved as "${industry.name || 'Unset'}" instead. Check this is right.`
        : undefined
      const locationWarning = !locationMatched && rawLocationInput
        ? `Location mismatch: "${rawLocationInput}" isn't one of the Village's listed cities — saved as "${location.name}" instead. Check this is right, or add a closer real city.`
        : undefined
      const adminWarnings = [industryWarning, locationWarning].filter((w): w is string => !!w).join('\n')

      // Businesses
      let primaryBusinessId = existingFounder?.businessId ?? ''
      if (options.createBusinesses && f.businesses && f.businesses.length > 0) {
        for (let bi = 0; bi < f.businesses.length; bi++) {
          const vb = f.businesses[bi]
          const bizBaseSlug = vb.slug?.trim() || slugify(vb.name)
          const existingBiz = getBusinessBySlug(bizBaseSlug)
          if (existingBiz) {
            if (bi === 0 && !primaryBusinessId) primaryBusinessId = existingBiz.id
            continue
          }
          const bizSlug = uniqueBizSlug(bizBaseSlug, bizSlugsTaken)
          bizSlugsTaken.add(bizSlug)

          // Same word-overlap scorer as the founder's own industry — a plain
          // substring check missed real matches ("health & fitness" vs
          // "Fitness & Wellness") the same way the founder-level one used to,
          // and gave a business no mismatch warning at all when it was
          // wrong. Falls back to the founder's own (already-resolved)
          // industry when the business doesn't state its own — a business
          // belonging to this founder is reasonably assumed to share it.
          const { industry: bizIndustryMatch, matched: bizIndustryMatched } = vb.industry
            ? resolveIndustry([vb.industry])
            : { industry, matched: true }
          const bizIndustry = bizIndustryMatched ? bizIndustryMatch : industry

          const newBiz: Business = {
            id:          crypto.randomUUID(),
            slug:        bizSlug,
            name:        vb.name,
            tagline:     '',
            description: vb.description ?? `${vb.name} — founded by ${displayName}.`,
            // vb.logoUrl was being silently discarded here, always
            // overwritten with the generic placeholder graphic even when a
            // real logo was provided. Left blank when there genuinely isn't
            // one — BizLogo/CoverImage's own fallbacks already handle a
            // missing image (and, for an unclaimed curated business, hide
            // it entirely rather than show a placeholder that reads as a
            // real photo).
            logo:        vb.logoUrl?.trim() || '',
            coverImage:  '',
            founderId,
            location,
            industry:    bizIndustry,
            topics,
            website:     vb.website || undefined,
            offers:      [],
            // A business went live immediately on import regardless of its
            // founder's own draft status — visible in Businesses, search,
            // everywhere, before anyone had reviewed the founder at all.
            // Mirrors the founder's own status exactly, same as the
            // founder record's own draft-first default below.
            status:      existingFounder?.status ?? 'draft',
            featured:    false,
            createdAt:   now,
          }
          const bizResult = await writeWithRetry(() => updateBusiness(newBiz))
          if (!bizResult.success) {
            throw new Error(`Failed to save business "${vb.name}": ${bizResult.error ?? 'unknown error'}`)
          }
          businessesCreated++
          if (bi === 0 && !primaryBusinessId) primaryBusinessId = newBiz.id
        }
      }

      // Supplementary notes
      const claimNotes = buildSupplementaryNotes(f, adminWarnings || undefined)

      // CULO-voiced summary — this, not f.bio, is what actually gets
      // published (see buildCuratedBio's comment for why). Short form for
      // the profile bio; each content item gets its own real, distinct body
      // built per-item further down (see buildContentItemBody), since a
      // content item's description becomes an entire published Story's blog
      // body verbatim — every item repeating the same paragraph defeats the
      // point of separate article pages.
      const locationLabel = `${location.name}, ${location.state}`
      const platformsPhrase = describePlatformsPhrase(f)
      const curatedRole = resolveCuratedRole(f.headline, f.businesses?.[0]?.name, industry.name, industryMatched)
      const curatedBio = buildCuratedBio(
        curatedRole, topics[0]?.name, f.speakingTopics?.[0], f.businesses?.[0]?.description, displayName, locationLabel, platformsPhrase,
      )

      // Founder record
      const founder: Founder = {
        id:         founderId,
        slug:       resolvedSlug,
        name:       displayName,
        bio:        curatedBio,
        avatar:     f.profileImageUrl?.trim() ?? '',
        location,
        industry,
        businessId: primaryBusinessId,
        topics,
        website:      f.website?.trim() || undefined,
        instagram:    f.instagramUrl?.trim() || undefined,
        linkedin:     f.linkedinUrl?.trim() || undefined,
        youtube:      f.youtubeUrl?.trim() || undefined,
        tiktok:       f.tiktokUrl?.trim() || undefined,
        podcast:      f.podcastUrl?.trim() || undefined,
        newsletter:   f.newsletterUrl?.trim() || undefined,
        claimEmail:   f.claimEmail?.trim() || existingFounder?.claimEmail || undefined,
        // A brand-new curated founder lands as a draft — invisible in
        // Founders, the homepage, search, everywhere public-facing relies
        // on getFounders({ publicOnly: true }) — until a staff member has
        // actually opened their profile and pressed Publish. Overwriting an
        // existing founder (already published, claimed, whatever they were)
        // keeps their real status; this only affects genuinely new rows.
        status:       existingFounder?.status ?? 'draft',
        featured:     false,
        createdAt:    existingFounder?.createdAt ?? now,
        profileStatus: 'village-curated',
        isClaimable:  true,
        curatedBy:    'CULO Village',
        curatedAt:    now,
        claimNotes:   claimNotes || undefined,
      }
      const founderResult = await writeWithRetry(() => updateFounder(founder))
      if (!founderResult.success) {
        throw new Error(`Failed to save founder: ${founderResult.error ?? 'unknown error'}`)
      }

      // Content
      if (f.content && f.content.length > 0) {
        // Only reached when overwriting an existing founder (skipDuplicates
        // already `continue`d above otherwise) — re-importing the same
        // batch used to always insert a fresh row per link, since
        // buildDraftImport hands out a new crypto.randomUUID() regardless
        // of whether this founder already has a row for that exact URL.
        // Match by originalUrl first so overwrite genuinely means
        // "update," not "duplicate every article on every re-run."
        const existingContentByUrl = existingFounder
          ? new Map(importedContentService.getAll({ founderId }).map(c => [c.originalUrl, c]))
          : undefined

        for (const [contentIndex, c] of f.content.entries()) {
          if (!c.url || !isValidUrl(c.url)) continue

          const contentStatus: ImportedContent['status'] = options.publishContent
            ? (c.status ?? 'published')
            : 'draft'

          const existingMatch = existingContentByUrl?.get(c.url)
          const draft = existingMatch ?? buildDraftImport(founderId, c.url)

          // Find matching business by name
          let contentBizId: string | undefined
          if (c.businessName && options.createBusinesses) {
            const matchedBiz = f.businesses?.find(b =>
              b.name.toLowerCase().includes(c.businessName!.toLowerCase())
            )
            if (matchedBiz) {
              const mb = getBusinessBySlug(matchedBiz.slug?.trim() || slugify(matchedBiz.name))
              if (mb) contentBizId = mb.id
            }
          }

          const itemTitle = c.title || draft.title
          const generatedItemBody = buildContentItemBody(
            displayName, curatedRole,
            f.businesses?.[0]?.description, topics.map(t => t.name), f.speakingTopics ?? [], f.keyFacts, locationLabel,
            contentIndex,
          )

          const item: ImportedContent = {
            ...draft,
            // An existing match keeps its own title/description exactly as
            // they are — never regenerated from the deterministic template
            // on re-import. Whatever's there (a founder's own edit, or a
            // Culo-written article synced in by the editorial engine) is
            // the real content now; re-importing the same spreadsheet link
            // must never silently revert it.
            title:      existingMatch ? draft.title : itemTitle,
            description: existingMatch ? draft.description : (c.description || generatedItemBody || draft.description),
            businessId: contentBizId ?? (primaryBusinessId || undefined),
            status:     contentStatus,
            visibility: contentStatus === 'published' || contentStatus === 'featured' ? 'public' : 'private',
            topics:     c.topics ?? [],
            locations:  c.locations ?? [],
            publishedAt: c.publishedAt,
          }
          const contentResult = await writeWithRetry(() => importedContentService.upsert(item))
          if (!contentResult.success) {
            // Non-fatal to the founder as a whole — record it and move on to the
            // next content item rather than discarding everything already saved.
            errors.push({ name: `${displayName} — "${item.title}"`, error: contentResult.error ?? 'Failed to save imported content' })
            continue
          }
          contentCreated++

          if (options.runIntelligence && (contentStatus === 'published' || contentStatus === 'featured')) {
            try {
              const input = importedContentToInput(item)
              const intel = villageContentIntelligenceService.analyse(input)
              const intelResult = await writeWithRetry(() => villageContentIntelligenceService.upsert(intel))
              if (intelResult.success) intelGenerated++
            } catch {
              // non-fatal — intelligence generation failing shouldn't fail the import
            }
          }

          // Turn this into a real Story right away — same field mapping
          // (buildStoryFromImport) the founder's own "Turn into Story"
          // action uses, just triggered at import time instead of waiting
          // for them to do it by hand. Skipped for anything too thin to
          // read as a genuine article — see MIN_AUTO_PUBLISH_DESCRIPTION_LENGTH.
          if (
            options.autoPublishAsStories &&
            (contentStatus === 'published' || contentStatus === 'featured') &&
            (item.description?.trim().length ?? 0) >= MIN_AUTO_PUBLISH_DESCRIPTION_LENGTH
          ) {
            try {
              const story = buildStoryFromImport(item, founder)
              // publishStoryCore, not a raw updateStory — this used to skip
              // the entire canonical publish pipeline (Ideas, relationship
              // syncing, authority scores, publish-limit checks) that every
              // other publish path goes through. A bulk-imported founder's
              // stories were silently missing all of it.
              const storyResult = await writeWithRetry(() => publishStoryCore(story))
              if (storyResult.success) {
                storiesCreated++
                await writeWithRetry(() => importedContentService.upsert({ ...item, relatedStoryId: story.id }))
              }
            } catch {
              // non-fatal — the ImportedContent record above already saved either way
            }
          }
        }
      }

      created.push({ id: founderId, name: displayName, slug: resolvedSlug })
    } catch (err) {
      errors.push({
        name: displayName,
        error: err instanceof Error ? err.message : 'Unknown error',
      })
    }
  }

  return { created, skipped, errors, businessesCreated, contentCreated, intelGenerated, storiesCreated }
}
