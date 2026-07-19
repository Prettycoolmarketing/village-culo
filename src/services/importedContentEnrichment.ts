import type { ImportedContent, ImportedContentPlatform } from '../types/importedContent'
import { PLATFORM_LABELS } from './importedContent'
import { getBusiness } from './businesses'

export interface EnrichmentResult {
  diaryNote: string
  autoSummary: string
  keyMoments: string[]
  peopleMentions: string[]
  businessMentions: string[]
  suggestedTopics: string[]
  suggestedLocations: string[]
  diaryGenerationMode: 'transcript' | 'metadata'
}

// ─── Curated keyword maps ─────────────────────────────────────────────────────

const TOPIC_MAP: [string, string[]][] = [
  ['travel',         ['travel', 'trip', 'journey', 'tour', 'destination', 'explore', 'abroad', 'overseas', 'adventure', 'road trip', 'backpack']],
  ['business',       ['business', 'startup', 'entrepreneur', 'founder', 'launch', 'client', 'revenue', 'growth', 'enterprise', 'scale']],
  ['marketing',      ['marketing', 'brand', 'campaign', 'audience', 'content', 'SEO', 'strategy', 'social media', 'advertising', 'copywriting']],
  ['technology',     ['technology', 'tech', 'software', 'app', 'digital', 'code', 'platform', 'AI', 'automation', 'web', 'SaaS']],
  ['food & drink',   ['food', 'restaurant', 'cafe', 'eat', 'recipe', 'menu', 'dining', 'cuisine', 'coffee', 'wine', 'cooking', 'kitchen']],
  ['health',         ['health', 'wellness', 'fitness', 'mental', 'mindfulness', 'exercise', 'wellbeing', 'yoga', 'meditation', 'nutrition']],
  ['finance',        ['finance', 'money', 'investment', 'budget', 'funding', 'profit', 'capital', 'accounting', 'cash flow', 'financial']],
  ['education',      ['education', 'learning', 'training', 'course', 'teach', 'study', 'skill', 'workshop', 'lesson', 'curriculum']],
  ['leadership',     ['leadership', 'team', 'manage', 'lead', 'CEO', 'culture', 'vision', 'executive', 'director', 'management']],
  ['community',      ['community', 'people', 'connection', 'group', 'network', 'local', 'gathering', 'belong', 'village', 'collective']],
  ['sustainability', ['sustainable', 'eco', 'environment', 'green', 'carbon', 'climate', 'renewable', 'organic', 'impact']],
  ['creative',       ['creative', 'design', 'art', 'photography', 'video', 'film', 'media', 'visual', 'branding', 'illustration']],
  ['podcast',        ['podcast', 'episode', 'interview', 'guest', 'show', 'listen', 'audio', 'series', 'host']],
  ['hospitality',    ['hotel', 'resort', 'accommodation', 'stay', 'hospitality', 'tourism', 'airbnb', 'booking', 'experience']],
  ['retail',         ['retail', 'shop', 'store', 'ecommerce', 'product', 'sell', 'customer', 'buyer', 'market', 'inventory']],
  ['real estate',    ['property', 'real estate', 'house', 'apartment', 'rent', 'lease', 'mortgage', 'land', 'development']],
]

const LOCATION_LIST = [
  // Australian cities
  'Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Canberra', 'Darwin', 'Hobart',
  'Gold Coast', 'Sunshine Coast', 'Cairns', 'Byron Bay', 'Noosa', 'Newcastle', 'Wollongong',
  'Ballarat', 'Geelong', 'Bendigo', 'Townsville', 'Toowoomba', 'Fremantle', 'Broome',
  // Australian states/territories
  'Australia', 'Queensland', 'New South Wales', 'Victoria', 'Western Australia',
  'South Australia', 'Northern Territory', 'Tasmania', 'ACT',
  // International
  'New Zealand', 'Bali', 'Indonesia', 'Thailand', 'Japan', 'Singapore', 'Vietnam',
  'United Kingdom', 'UK', 'London', 'Europe', 'USA', 'New York', 'Los Angeles',
  'Dubai', 'Paris', 'Amsterdam', 'Berlin', 'Italy', 'France', 'Spain', 'Portugal',
  'Canada', 'India', 'Mexico', 'Brazil',
]

const CONTENT_TYPE: Partial<Record<ImportedContentPlatform, string>> = {
  youtube:   'video',
  vimeo:     'video',
  instagram: 'post',
  linkedin:  'article',
  tiktok:    'video',
  podcast:   'episode',
  website:   'piece',
}

// ─── Text utilities ───────────────────────────────────────────────────────────

export function splitSentences(text: string): string[] {
  return text
    .replace(/\n+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 20 && s.length < 320)
}

function lowerIncludes(haystack: string, needle: string): boolean {
  return haystack.toLowerCase().includes(needle.toLowerCase())
}

// ─── Topic / location extraction ──────────────────────────────────────────────

function extractSuggestedTopics(text: string): string[] {
  const found: string[] = []
  for (const [topic, keywords] of TOPIC_MAP) {
    if (keywords.some(kw => lowerIncludes(text, kw))) found.push(topic)
  }
  return found
}

function extractSuggestedLocations(text: string): string[] {
  return LOCATION_LIST.filter(loc => lowerIncludes(text, loc))
}

// ─── Transcript extraction ────────────────────────────────────────────────────

const SIGNAL_WORDS = [
  'important', 'actually', 'key', 'real', 'learned', 'realised', 'realized',
  'discovered', 'started', 'decided', 'built', 'created', 'first time',
  'finally', 'ultimately', 'changed', 'moment', 'turning point', 'challenge',
  'breakthrough', 'honest', 'truth', 'never', 'always', 'biggest',
]

function extractKeyMoments(transcript: string): string[] {
  const sents = splitSentences(transcript)
  if (sents.length === 0) return []
  const scored = sents.map((s, i) => ({
    s,
    score:
      SIGNAL_WORDS.reduce((n, w) => n + (lowerIncludes(s, w) ? 2 : 0), 0) +
      (i === 0 ? 1 : 0) +
      (s.includes('?') ? 1 : 0) +
      (s.split(' ').length >= 7 && s.split(' ').length <= 28 ? 1 : 0),
  }))
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .filter(x => x.score > 0)
    .map(x => x.s)
}

function extractCapitalisedPhrases(text: string): string[] {
  const pattern = /\b([A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,})+)\b/g
  const found = new Set<string>()
  let match
  while ((match = pattern.exec(text)) !== null) {
    const phrase = match[1]
    if (!LOCATION_LIST.some(loc => lowerIncludes(phrase, loc))) {
      found.add(phrase)
    }
  }
  return Array.from(found).slice(0, 8)
}

function extractPeopleMentions(text: string): string[] {
  const introPattern = /\b(?:met|spoke with|talk(?:ed)? to|featuring|interview(?:ed)?|joined by|hosted by|with guest)\s+([A-Z][a-z]+ [A-Z][a-z]+)/g
  const found = new Set<string>()
  let match
  while ((match = introPattern.exec(text)) !== null) found.add(match[1])
  for (const phrase of extractCapitalisedPhrases(text)) {
    const words = phrase.split(' ')
    if (words.length >= 2 && words.length <= 3) found.add(phrase)
  }
  return Array.from(found).slice(0, 6)
}

function extractBusinessMentions(text: string): string[] {
  const suffixPattern = /\b([A-Z][A-Za-z\s]{2,24}?)(?:\s(?:Pty|Ltd|Inc|Co\b|Group|Agency|Studio|Media|Brands|Labs|Works|Company|Foundation|Co\.|Collective))/g
  const found = new Set<string>()
  let match
  while ((match = suffixPattern.exec(text)) !== null) {
    const name = match[1].trim()
    if (name.split(' ').length <= 4) found.add(name)
  }
  return Array.from(found).slice(0, 6)
}

// ─── Diary note builder ───────────────────────────────────────────────────────

// Leads with the founder's own words — already the most specific, human,
// keyword-rich text available — then folds platform/date/topics/location
// into one short trailing context sentence. Search engines and AI answer
// engines weight the opening sentence heaviest, so administrative framing
// ("this video was published on...") or flowery narration about the content
// belongs after the substance, not before it, and never in place of it.
function buildDiaryNote(
  item: ImportedContent,
  mode: 'transcript' | 'metadata',
  themes: string[],
  locations: string[],
  transcriptOpening: string,
): string {
  const platform    = PLATFORM_LABELS[item.sourcePlatform] ?? item.sourcePlatform
  const contentType = CONTENT_TYPE[item.sourcePlatform] ?? 'piece'
  const dateSuffix  = item.publishedAt
    ? ` in ${new Date(item.publishedAt).toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })}`
    : ''
  const biz     = item.businessId ? getBusiness(item.businessId) : undefined
  const bizPart = biz ? ` — part of ${biz.name}'s story` : ''

  const covering    = [...themes.slice(0, 2), ...locations.slice(0, 1)]
  const coveringStr = covering.length > 0 ? `, covering ${covering.join(' and ')}` : ''

  const rawLead =
    mode === 'transcript' && transcriptOpening ? transcriptOpening :
    item.description ? item.description :
    `${item.title} — a ${contentType} from ${biz ? biz.name : platform}.`

  // Platform descriptions are often cut off mid-sentence ("...") — trim any
  // trailing ellipsis/dangling punctuation so the context sentence reads as
  // a clean continuation instead of following a broken-off fragment.
  const lead = rawLead.trim().replace(/[.\s]*\.{3,}[.\s]*$/, '').trim()

  const context = `Shared on ${platform}${dateSuffix}${coveringStr}${bizPart}.`

  return `${lead}${/[.!?]$/.test(lead) ? '' : '.'} ${context}`
}

// ─── Auto summary builder ─────────────────────────────────────────────────────

function buildAutoSummary(item: ImportedContent): string {
  if (item.transcriptText) {
    const sents = splitSentences(item.transcriptText)
    const preview = sents.slice(0, 2).join(' ')
    if (preview.length > 20) return preview
  }
  if (item.description) {
    return item.description.length > 200
      ? item.description.slice(0, 200) + '...'
      : item.description
  }
  const label = PLATFORM_LABELS[item.sourcePlatform] ?? item.sourcePlatform
  const type  = CONTENT_TYPE[item.sourcePlatform] ?? 'piece'
  return `${label} ${type}: ${item.title}`
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function enrichImportedContent(item: ImportedContent): EnrichmentResult {
  const hasTranscript = !!(item.transcriptText && item.transcriptText.trim().length > 50)
  const mode: 'transcript' | 'metadata' = hasTranscript ? 'transcript' : 'metadata'

  const fullText = [item.title, item.description ?? '', hasTranscript ? item.transcriptText! : ''].join(' ')

  const suggestedTopics    = extractSuggestedTopics(fullText)
  const suggestedLocations = extractSuggestedLocations(fullText)
  const keyMoments         = hasTranscript ? extractKeyMoments(item.transcriptText!) : []
  const peopleMentions     = hasTranscript ? extractPeopleMentions(item.transcriptText!) : []
  const businessMentions   = hasTranscript ? extractBusinessMentions(item.transcriptText!) : []

  const transcriptOpening = hasTranscript
    ? splitSentences(item.transcriptText!).slice(0, 2).join(' ')
    : ''

  const themes     = extractSuggestedTopics(fullText)
  const autoSummary = buildAutoSummary(item)
  const diaryNote   = buildDiaryNote(item, mode, themes, suggestedLocations, transcriptOpening)

  return {
    diaryNote,
    autoSummary,
    keyMoments,
    peopleMentions,
    businessMentions,
    suggestedTopics,
    suggestedLocations,
    diaryGenerationMode: mode,
  }
}

export function applyEnrichment(item: ImportedContent, result: EnrichmentResult): ImportedContent {
  return {
    ...item,
    diaryNote:           result.diaryNote,
    autoSummary:         result.autoSummary,
    keyMoments:          result.keyMoments,
    peopleMentions:      result.peopleMentions,
    businessMentions:    result.businessMentions,
    suggestedTopics:     result.suggestedTopics,
    suggestedLocations:  result.suggestedLocations,
    diaryGeneratedAt:    new Date().toISOString(),
    diaryGenerationMode: result.diaryGenerationMode,
  }
}
