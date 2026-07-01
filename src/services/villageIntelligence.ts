import { readCache, writeEntity, type WriteResult } from '../lib/entityStore'
import { getBusiness } from './businesses'
import type {
  VillageContentIntelligence,
  VillageContentType,
  ContentIntent,
  ContentStage,
  EmotionalTone,
  AnalysisInput,
} from '../types/villageIntelligence'
import type { ImportedContent } from '../types/importedContent'
import type { Story } from '../types'

const KEY             = 'village_intelligence'
const TABLE            = 'village_content_intelligence'
const ENGINE_VERSION  = '1.0'

function now() { return new Date().toISOString() }

// ─── Keyword maps ─────────────────────────────────────────────────────────────

const TOPIC_MAP: [string, string[]][] = [
  ['travel',         ['travel', 'trip', 'journey', 'tour', 'destination', 'explore', 'abroad', 'overseas', 'adventure', 'road trip']],
  ['business',       ['business', 'startup', 'entrepreneur', 'founder', 'launch', 'client', 'revenue', 'growth', 'enterprise', 'scale']],
  ['marketing',      ['marketing', 'brand', 'campaign', 'audience', 'content', 'SEO', 'strategy', 'social media', 'advertising', 'copywriting']],
  ['technology',     ['technology', 'tech', 'software', 'app', 'digital', 'platform', 'AI', 'automation', 'code', 'SaaS']],
  ['food & drink',   ['food', 'restaurant', 'cafe', 'eat', 'recipe', 'menu', 'dining', 'cuisine', 'coffee', 'wine', 'cooking']],
  ['health',         ['health', 'wellness', 'fitness', 'mental', 'mindfulness', 'exercise', 'wellbeing', 'yoga', 'nutrition']],
  ['finance',        ['finance', 'money', 'investment', 'budget', 'funding', 'profit', 'capital', 'accounting', 'revenue']],
  ['education',      ['education', 'learning', 'training', 'course', 'teach', 'study', 'skill', 'workshop', 'lesson']],
  ['leadership',     ['leadership', 'team', 'manage', 'lead', 'CEO', 'culture', 'vision', 'executive', 'director']],
  ['community',      ['community', 'people', 'connection', 'group', 'network', 'local', 'gathering', 'village', 'belong']],
  ['sustainability', ['sustainable', 'eco', 'environment', 'green', 'carbon', 'climate', 'renewable', 'organic']],
  ['creative',       ['creative', 'design', 'art', 'photography', 'video', 'film', 'media', 'visual', 'branding']],
  ['podcast',        ['podcast', 'episode', 'interview', 'guest', 'show', 'listen', 'audio', 'series', 'host']],
  ['hospitality',    ['hotel', 'resort', 'accommodation', 'stay', 'hospitality', 'tourism', 'airbnb', 'booking']],
  ['retail',         ['retail', 'shop', 'store', 'ecommerce', 'product', 'sell', 'customer', 'buyer', 'market']],
  ['real estate',    ['property', 'real estate', 'house', 'apartment', 'rent', 'lease', 'mortgage', 'land']],
  ['events',         ['event', 'conference', 'summit', 'meetup', 'festival', 'launch event', 'networking', 'webinar']],
]

const INDUSTRY_MAP: [string, string[]][] = [
  ['Hospitality & Tourism',   ['hotel', 'resort', 'accommodation', 'tourism', 'travel', 'airbnb', 'restaurant', 'cafe']],
  ['Technology & Software',   ['software', 'app', 'SaaS', 'tech', 'digital', 'developer', 'platform', 'AI', 'automation']],
  ['Marketing & Media',       ['marketing', 'advertising', 'media', 'PR', 'content', 'social media', 'agency', 'production']],
  ['Food & Beverage',         ['restaurant', 'cafe', 'food', 'beverage', 'cuisine', 'cooking', 'hospitality', 'menu']],
  ['Health & Wellness',       ['health', 'fitness', 'wellness', 'medical', 'therapy', 'nutrition', 'yoga', 'mental health']],
  ['Finance & Investment',    ['finance', 'banking', 'investment', 'accounting', 'fintech', 'insurance', 'capital', 'funding']],
  ['Education & Training',    ['education', 'school', 'university', 'training', 'e-learning', 'courses', 'workshop', 'coaching']],
  ['Creative & Design',       ['photography', 'film', 'music', 'art', 'design', 'fashion', 'creative', 'illustration', 'video']],
  ['Real Estate & Property',  ['property', 'real estate', 'construction', 'architecture', 'development', 'mortgage']],
  ['Retail & E-Commerce',     ['retail', 'ecommerce', 'shop', 'marketplace', 'product', 'wholesale', 'store']],
  ['Professional Services',   ['consulting', 'legal', 'accounting', 'coaching', 'advisory', 'strategy', 'management']],
  ['Events & Entertainment',  ['event', 'conference', 'festival', 'entertainment', 'performance', 'production']],
]

const KNOWN_SOFTWARE: string[] = [
  'Canva', 'Figma', 'Notion', 'Slack', 'Zoom', 'Loom', 'Calendly', 'Typeform',
  'Google Analytics', 'Google Ads', 'Google Workspace', 'Google Drive',
  'Facebook Ads', 'Meta Ads', 'Mailchimp', 'Klaviyo', 'ActiveCampaign', 'ConvertKit', 'Substack',
  'HubSpot', 'Salesforce', 'Pipedrive', 'Shopify', 'WooCommerce', 'BigCommerce',
  'WordPress', 'Squarespace', 'Webflow', 'Wix', 'Framer', 'Ghost',
  'Xero', 'QuickBooks', 'MYOB', 'Stripe', 'PayPal', 'Square',
  'Zapier', 'Make', 'Airtable', 'Trello', 'Asana', 'ClickUp', 'Monday',
  'ChatGPT', 'Claude', 'Midjourney', 'Adobe', 'Photoshop', 'Illustrator',
  'Premiere', 'After Effects', 'Final Cut', 'CapCut', 'DaVinci',
  'Later', 'Buffer', 'Hootsuite', 'Sprout Social', 'Metricool',
  'Spotify', 'Apple Podcasts', 'Buzzsprout', 'Anchor', 'Riverside',
]

const SKILL_KEYWORDS: string[] = [
  'photography', 'videography', 'writing', 'copywriting', 'SEO', 'marketing', 'design',
  'coding', 'development', 'management', 'leadership', 'sales', 'negotiation',
  'public speaking', 'storytelling', 'strategy', 'finance', 'accounting',
  'customer service', 'project management', 'product management', 'data analysis',
  'social media', 'content creation', 'video editing', 'graphic design', 'UX design',
  'brand strategy', 'email marketing', 'paid advertising', 'community management',
  'fundraising', 'business development', 'operations', 'supply chain',
]

const OPPORTUNITY_MARKERS: string[] = [
  'hiring', 'looking for', 'seeking', 'open to', 'available for', 'want to connect',
  'collaboration', 'partnership', 'joint venture', 'gap in the market', 'opportunity',
  'need for', 'problem to solve', 'want help with', 'looking to partner',
  'interested in working', 'open to collaborating',
]

// ─── Location categories ──────────────────────────────────────────────────────

const COUNTRIES = [
  'Australia', 'New Zealand', 'United Kingdom', 'USA', 'United States', 'Canada',
  'Japan', 'Indonesia', 'Thailand', 'Singapore', 'Vietnam', 'Malaysia', 'Philippines',
  'India', 'France', 'Italy', 'Spain', 'Germany', 'Portugal', 'Netherlands', 'Greece',
  'Mexico', 'Brazil', 'South Africa', 'Dubai', 'UAE',
]

const CITIES = [
  'Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Canberra', 'Darwin', 'Hobart',
  'Gold Coast', 'Sunshine Coast', 'Cairns', 'Byron Bay', 'Noosa', 'Newcastle', 'Wollongong',
  'Ballarat', 'Geelong', 'Bendigo', 'Townsville', 'Toowoomba', 'Fremantle', 'Broome',
  'Auckland', 'Wellington', 'Christchurch',
  'London', 'New York', 'Los Angeles', 'San Francisco', 'Chicago',
  'Tokyo', 'Bali', 'Bangkok', 'Singapore City', 'Paris', 'Amsterdam', 'Barcelona',
]

const REGIONS = [
  'Queensland', 'New South Wales', 'Victoria', 'Western Australia',
  'South Australia', 'Northern Territory', 'Tasmania', 'ACT',
  'Asia Pacific', 'Southeast Asia', 'South East Asia', 'Europe', 'North America',
  'Asia', 'Oceania', 'Pacific', 'Middle East',
]

const ALL_LOCATIONS = [...COUNTRIES, ...CITIES, ...REGIONS]

// ─── Intent / Stage / Tone classifiers ───────────────────────────────────────

const INTENT_MAP: [ContentIntent, string[]][] = [
  ['Tutorial',          ['how to', 'step by step', 'guide', 'tutorial', 'follow these steps', 'here is how']],
  ['Case Study',        ['results', 'grew', 'increased', 'case', 'outcome', 'before and after', 'ROI', 'we achieved']],
  ['Behind The Scenes', ['behind the scenes', 'backstage', 'process', 'how we', 'what it takes', 'our workflow']],
  ['Launch',            ['launching', 'just launched', 'announcing', 'introducing', 'new product', 'now live']],
  ['Review',            ['review', 'honest opinion', 'pros and cons', 'thoughts on', 'my experience with', 'rating']],
  ['Opinion',           ['i think', 'my view', 'opinion', 'i believe', 'my perspective', 'in my opinion', 'unpopular']],
  ['Reflection',        ['looking back', 'reflecting', 'years ago', 'now i realize', 'what i learned', 'hindsight']],
  ['Story',             ['story', 'journey', 'started when', 'this happened', 'adventure', 'experience', 'narrative']],
  ['Education',         ['learn', 'understand', 'explain', 'concept', 'what is', 'why does', 'definition', 'overview']],
  ['Announcement',      ['announcing', 'big news', 'excited to share', 'thrilled', 'proud to announce', 'news']],
]

const STAGE_MAP: [ContentStage, string[]][] = [
  ['Learning',    ['learning', 'studying', 'figuring out', 'trying to understand', 'just starting', 'newbie']],
  ['Building',    ['building', 'creating', 'working on', 'developing', 'shipping', 'in progress', 'making']],
  ['Scaling',     ['scaling', 'growing', 'expanding', 'team of', 'hiring', 'funding', 'series', 'larger']],
  ['Teaching',    ['teaching', 'training', 'mentor', 'course', 'workshop', 'help others', 'showing you']],
  ['Reflecting',  ['reflecting', 'looking back', 'years later', 'now i realize', 'lesson learned', 'hindsight']],
  ['Celebrating', ['celebrating', 'milestone', 'anniversary', 'proud', 'thrilled', 'we did it', 'achieved']],
]

const TONE_MAP: [EmotionalTone, string[]][] = [
  ['Inspired',     ['excited', 'amazing', 'incredible', 'inspired', 'dream', 'possibility', 'changed my life']],
  ['Reflective',   ['reflecting', 'looking back', 'realized', 'learned', 'years later', 'now i see', 'growth']],
  ['Practical',    ['step', 'process', 'system', 'practical', 'framework', 'structure', 'method', 'approach']],
  ['Energetic',    ["let's go", 'action', 'momentum', 'crushing it', 'fire', 'moving fast', 'pumped', 'ready']],
  ['Cautious',     ['careful', 'warning', 'watch out', 'mistake', 'failed', 'pitfall', 'avoid', 'danger']],
  ['Celebratory',  ['celebrate', 'milestone', 'proud', 'achievement', 'champagne', 'we did it', 'nailed it']],
  ['Honest',       ['honest', 'truth', 'real talk', 'actually', 'admit', 'confess', 'raw', 'vulnerable']],
]

// ─── Text utilities ───────────────────────────────────────────────────────────

function buildFullText(input: AnalysisInput): string {
  return [
    input.title,
    input.description ?? '',
    input.diaryNote ?? '',
    input.autoSummary ?? '',
    input.transcriptText ?? '',
    input.storyContent ?? '',
    (input.topics ?? []).join(' '),
    (input.locations ?? []).join(' '),
    (input.keyMoments ?? []).join(' '),
    input.linkedBusinessName ?? '',
    input.linkedBusinessIndustry ?? '',
  ].join(' ').replace(/\s+/g, ' ').trim()
}

function splitSentences(text: string): string[] {
  return text
    .replace(/\n+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 20 && s.length < 320)
}

function lo(s: string) { return s.toLowerCase() }
function has(haystack: string, needle: string): boolean { return lo(haystack).includes(lo(needle)) }

function scoreKeywords(text: string, keywords: string[]): number {
  return keywords.reduce((n, kw) => n + (has(text, kw) ? 1 : 0), 0)
}

function classifyByMap<T extends string>(text: string, map: [T, string[]][]): T {
  let best: T = map[0][0]
  let bestScore = 0
  for (const [label, keywords] of map) {
    const score = scoreKeywords(text, keywords)
    if (score > bestScore) { best = label; bestScore = score }
  }
  return best
}

function extractSentencesContaining(text: string, markers: string[]): string[] {
  return splitSentences(text).filter(s => markers.some(m => has(s, m)))
}

const stopwords = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
  'by', 'from', 'it', 'is', 'was', 'are', 'be', 'been', 'have', 'has', 'had', 'this',
  'that', 'they', 'we', 'you', 'i', 'my', 'our', 'your', 'his', 'her', 'its', 'as',
  'so', 'do', 'did', 'not', 'no', 'can', 'will', 'would', 'could', 'should', 'about',
])

// ─── Extraction functions ─────────────────────────────────────────────────────

function extractTopicsScored(text: string, seedTopics: string[] = []): { primary: string[]; secondary: string[] } {
  const scored: { topic: string; score: number }[] = []
  for (const [topic, keywords] of TOPIC_MAP) {
    const score = scoreKeywords(text, keywords)
    if (score > 0) scored.push({ topic, score })
  }
  // Seed topics from input boost score
  for (const t of seedTopics) {
    const existing = scored.find(s => lo(s.topic) === lo(t))
    if (existing) existing.score += 3
    else scored.push({ topic: t, score: 2 })
  }
  scored.sort((a, b) => b.score - a.score)
  const primary   = scored.filter(s => s.score >= 3).slice(0, 5).map(s => s.topic)
  const secondary = scored.filter(s => s.score > 0 && s.score < 3).slice(0, 6).map(s => s.topic)
  return { primary, secondary }
}

function extractIndustries(text: string, linkedIndustry?: string): string[] {
  const found: string[] = []
  for (const [industry, keywords] of INDUSTRY_MAP) {
    if (keywords.some(kw => has(text, kw))) found.push(industry)
  }
  if (linkedIndustry && !found.some(f => has(f, linkedIndustry))) {
    found.unshift(linkedIndustry)
  }
  return found.slice(0, 5)
}

function extractLocationsAll(text: string, seedLocations: string[] = []): {
  all: string[]; countries: string[]; cities: string[]; regions: string[]
} {
  const found = ALL_LOCATIONS.filter(loc => has(text, loc))
  const seeded = seedLocations.filter(l => !found.includes(l))
  const combined = [...new Set([...found, ...seeded])]
  return {
    all:      combined,
    countries: combined.filter(l => COUNTRIES.includes(l)),
    cities:    combined.filter(l => CITIES.includes(l)),
    regions:   combined.filter(l => REGIONS.includes(l)),
  }
}

function extractSoftware(text: string): string[] {
  return KNOWN_SOFTWARE.filter(sw => has(text, sw))
}

function extractSkills(text: string): string[] {
  return SKILL_KEYWORDS.filter(sk => has(text, sk))
}

function extractOpportunitySignals(text: string): string[] {
  return extractSentencesContaining(text, OPPORTUNITY_MARKERS).slice(0, 4)
}

function extractLessons(text: string, keyMoments: string[] = []): string[] {
  const LESSON_MARKERS = ['learned', 'lesson', 'takeaway', 'key insight', 'now i know', 'realized', 'realised', 'taught me', 'valuable']
  const fromText = extractSentencesContaining(text, LESSON_MARKERS)
  const fromMoments = keyMoments.filter(m => LESSON_MARKERS.some(mk => has(m, mk)))
  return [...new Set([...fromText, ...fromMoments])].slice(0, 5)
}

function extractProblems(text: string): string[] {
  const MARKERS = ['problem', 'challenge', 'struggle', 'difficult', 'pain point', 'frustration', 'issue', 'mistake', 'failed', 'broke', 'wrong']
  return extractSentencesContaining(text, MARKERS).slice(0, 5)
}

function extractSolutions(text: string): string[] {
  const MARKERS = ['solution', 'fixed', 'solved', 'the answer', 'worked out', 'key was', 'how i', 'method', 'approach', 'what helped']
  return extractSentencesContaining(text, MARKERS).slice(0, 5)
}

function extractPeople(text: string, seed: string[] = []): string[] {
  const introPattern = /\b(?:met|spoke with|talked to|featuring|interviewed|joined by|hosted by|with guest|introduced to)\s+([A-Z][a-z]+ [A-Z][a-z]+)/g
  const found = new Set<string>(seed)
  let match
  while ((match = introPattern.exec(text)) !== null) found.add(match[1])
  return Array.from(found).slice(0, 8)
}

function extractBusinessEntities(text: string, seed: string[] = [], linkedName?: string): string[] {
  const suffixPattern = /\b([A-Z][A-Za-z\s]{2,22}?)(?:\s(?:Pty|Ltd|Inc|Co\b|Group|Agency|Studio|Media|Brands|Labs|Works|Company|Foundation|Collective))/g
  const found = new Set<string>(seed)
  if (linkedName) found.add(linkedName)
  let match
  while ((match = suffixPattern.exec(text)) !== null) {
    const name = match[1].trim()
    if (name.split(' ').length <= 4) found.add(name)
  }
  return Array.from(found).slice(0, 8)
}

function extractProducts(text: string): string[] {
  const MARKERS = ['product called', 'tool called', 'app called', 'platform called', 'using the', 'bought', 'purchased']
  const phrPattern = /(?:called|using|bought|tried)\s+["']?([A-Z][A-Za-z]+(?:\s[A-Z][A-Za-z]+)*)/g
  const found = new Set<string>()
  let match
  while ((match = phrPattern.exec(text)) !== null) {
    const candidate = match[1].trim()
    if (candidate.length < 40 && !KNOWN_SOFTWARE.includes(candidate)) found.add(candidate)
  }
  // Also flag explicit markers
  const sentences = extractSentencesContaining(text, MARKERS)
  for (const s of sentences) {
    const inner = /(?:called|using|app|tool|product)\s+["']([^"']+)["']/i.exec(s)
    if (inner) found.add(inner[1])
  }
  return Array.from(found).slice(0, 6)
}

function extractServices(text: string): string[] {
  const MARKERS = ['hired', 'engaged', 'working with', 'service provider', 'outsourced', 'contracted']
  return extractSentencesContaining(text, MARKERS).slice(0, 4)
}

function extractBooks(text: string): string[] {
  const bookPattern = /(?:book|read|reading|wrote|author of)\s+["']([^"']{5,60})["']/gi
  const found = new Set<string>()
  let match
  while ((match = bookPattern.exec(text)) !== null) found.add(match[1])
  return Array.from(found).slice(0, 5)
}

function extractCourses(text: string): string[] {
  const coursePattern = /(?:course|program|bootcamp|workshop|training)\s+(?:called\s+)?["']?([A-Z][^"',.\n]{5,60})/g
  const found = new Set<string>()
  let match
  while ((match = coursePattern.exec(text)) !== null) found.add(match[1].trim())
  return Array.from(found).slice(0, 5)
}

function extractOrganisations(text: string): string[] {
  const ORG_MARKERS = ['association', 'foundation', 'organisation', 'organization', 'institute', 'chamber', 'council', 'committee']
  return ORG_MARKERS.filter(m => has(text, m))
    .map(m => {
      const match = new RegExp(`([A-Z][A-Za-z\\s]{2,30})\\s+${m}`, 'i').exec(text)
      return match ? `${match[1].trim()} ${m}` : m
    })
    .slice(0, 5)
}

function extractCommunities(text: string): string[] {
  const COMM_MARKERS = ['community of', 'tribe', 'network of', 'discord', 'slack group', 'facebook group', 'online community']
  return COMM_MARKERS.filter(m => has(text, m)).slice(0, 4)
}

function extractEvents(text: string): string[] {
  const EVENT_MARKERS = ['conference', 'summit', 'meetup', 'festival', 'expo', 'webinar', 'retreat', 'workshop', 'event']
  const phrPattern = /([A-Z][A-Za-z\s]{2,30}?)(?:\s(?:Conference|Summit|Festival|Expo|Retreat|Meetup|Forum))/g
  const found = new Set<string>()
  let match
  while ((match = phrPattern.exec(text)) !== null) found.add(match[0].trim())
  for (const m of EVENT_MARKERS) {
    if (has(text, m)) {
      const inner = new RegExp(`([A-Z][A-Za-z\\s]{1,20}?)\\s+${m}`, 'i').exec(text)
      if (inner) found.add(inner[0].trim())
    }
  }
  return Array.from(found).slice(0, 6)
}

// ─── Question generators ──────────────────────────────────────────────────────

function generateGeoQuestions(input: AnalysisInput, topics: string[], people: string[], businesses: string[], cities: string[]): string[] {
  const q: string[] = []
  const ct = input.contentType === 'imported' ? 'content' : input.contentType
  const loc = cities[0] ?? 'Australia'

  q.push(`What is "${input.title}" about?`)
  if (topics[0]) q.push(`What ${topics[0]} advice does this ${ct} contain?`)
  if (people[0]) q.push(`Who is ${people[0]} and what do they share in this ${ct}?`)
  if (businesses[0]) {
    q.push(`What is ${businesses[0]} known for?`)
    q.push(`Who recommends ${businesses[0]}?`)
  }
  if (cities.length > 0) q.push(`What ${topics[0] ?? 'business'} content is relevant to ${loc}?`)
  if (topics[1]) q.push(`Who is a ${topics[0] ?? 'business'} expert in ${loc}?`)
  q.push(`Who created this ${ct} and what is their background?`)
  if (topics[0] && topics[1]) q.push(`What is the connection between ${topics[0]} and ${topics[1]}?`)

  return [...new Set(q)].slice(0, 8)
}

function generateSearchQuestions(input: AnalysisInput, topics: string[], businesses: string[], cities: string[]): string[] {
  const q: string[] = []
  const loc = cities[0] ?? 'Australia'

  if (topics[0]) {
    q.push(`${topics[0]} tips from ${loc}`)
    q.push(`How to improve ${topics[0]}`)
  }
  if (topics[1]) q.push(`${topics[0] ?? 'business'} and ${topics[1]} strategies`)
  if (businesses[0]) q.push(`About ${businesses[0]}`)
  if (cities.length > 0) q.push(`${topics[0] ?? 'Business'} in ${loc}`)
  q.push(`"${input.title}" founder story`)
  if (topics[0]) q.push(`${topics[0]} founder insights`)

  return [...new Set(q)].slice(0, 6)
}

// ─── SEO / GEO keyword builders ───────────────────────────────────────────────

function buildSeoKeywords(input: AnalysisInput, topics: string[], businesses: string[], cities: string[]): string[] {
  const titleWords = input.title
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 3 && !stopwords.has(w))

  const pairs = topics.slice(0, 2).flatMap(t =>
    cities.slice(0, 2).map(c => `${t} ${c}`)
  )

  return [...new Set([
    ...titleWords,
    ...topics.slice(0, 5),
    ...businesses.slice(0, 3),
    ...cities.slice(0, 3),
    ...pairs,
  ])].slice(0, 20)
}

function buildGeoKeywords(_input: AnalysisInput, topics: string[], businesses: string[], cities: string[]): string[] {
  return [...new Set([
    ...topics.map(t => `${t} founder`),
    ...cities.map(c => `${c} founder`),
    ...businesses.slice(0, 3),
    ...topics.slice(0, 3).map(t => `${t} in ${cities[0] ?? 'Australia'}`),
  ])].slice(0, 12)
}

function buildSummary(input: AnalysisInput): string {
  const candidate = input.description ?? input.autoSummary ?? input.diaryNote
  if (candidate) {
    return candidate.length > 200 ? candidate.slice(0, 200) + '...' : candidate
  }
  return `${input.contentType === 'imported' ? 'Imported content' : 'Content'}: ${input.title}`
}

// ─── Related content finder ───────────────────────────────────────────────────

function findRelatedContentIds(currentId: string, topics: string[]): string[] {
  if (topics.length === 0) return []
  const all = readCache<VillageContentIntelligence>(KEY)
  return all
    .filter(i => i.contentId !== currentId)
    .map(i => ({
      contentId: i.contentId,
      score:
        i.primaryTopics.filter(t => topics.includes(t)).length * 3 +
        i.secondaryTopics.filter(t => topics.includes(t)).length,
    }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map(x => x.contentId)
}

function findRelatedBusinessIds(topics: string[]): string[] {
  if (topics.length === 0) return []
  const all = readCache<VillageContentIntelligence>(KEY)
  const ids = new Set<string>()
  for (const item of all) {
    if (item.businessId && item.primaryTopics.some(t => topics.includes(t))) {
      ids.add(item.businessId)
    }
  }
  return Array.from(ids).slice(0, 5)
}

function findRelatedFounderIds(currentFounderId: string, topics: string[]): string[] {
  if (topics.length === 0) return []
  const all = readCache<VillageContentIntelligence>(KEY)
  const ids = new Set<string>()
  for (const item of all) {
    if (item.founderId !== currentFounderId && item.primaryTopics.some(t => topics.includes(t))) {
      ids.add(item.founderId)
    }
  }
  return Array.from(ids).slice(0, 5)
}

// ─── Core analysis function ───────────────────────────────────────────────────

function runAnalysis(input: AnalysisInput, existingId?: string): VillageContentIntelligence {
  const text = buildFullText(input)

  const { primary: primaryTopics, secondary: secondaryTopics } = extractTopicsScored(text, input.topics)
  const industries  = extractIndustries(text, input.linkedBusinessIndustry)
  const locs        = extractLocationsAll(text, input.locations)
  const software    = extractSoftware(text)
  const skills      = extractSkills(text)
  const people      = extractPeople(text, input.peopleMentions)
  const businesses  = extractBusinessEntities(text, input.businessMentions, input.linkedBusinessName)
  const products    = extractProducts(text)
  const services    = extractServices(text)
  const books       = extractBooks(text)
  const courses     = extractCourses(text)
  const orgs        = extractOrganisations(text)
  const communities = extractCommunities(text)
  const events      = extractEvents(text)
  const problems    = extractProblems(text)
  const solutions   = extractSolutions(text)
  const lessons     = extractLessons(text, input.keyMoments)
  const opps        = extractOpportunitySignals(text)

  const intent       = classifyByMap(text, INTENT_MAP)
  const contentStage = classifyByMap(text, STAGE_MAP)
  const emotionalTone= classifyByMap(text, TONE_MAP)

  const geoQuestions    = generateGeoQuestions(input, primaryTopics, people, businesses, locs.cities)
  const searchQuestions = generateSearchQuestions(input, primaryTopics, businesses, locs.cities)
  const seoKeywords     = buildSeoKeywords(input, primaryTopics, businesses, locs.cities)
  const geoKeywords     = buildGeoKeywords(input, primaryTopics, businesses, locs.cities)
  const canonicalTopics = primaryTopics.slice(0, 3)

  const relatedContentIds  = findRelatedContentIds(input.contentId, primaryTopics)
  const relatedBusinessIds = findRelatedBusinessIds(primaryTopics)
  const relatedFounderIds  = findRelatedFounderIds(input.founderId, primaryTopics)

  return {
    id:               existingId ?? crypto.randomUUID(),
    contentType:      input.contentType,
    contentId:        input.contentId,
    founderId:        input.founderId,
    businessId:       input.businessId,
    headline:         input.title,
    summary:          buildSummary(input),
    primaryTopics,
    secondaryTopics,
    industries,
    people,
    businesses,
    products,
    software,
    services,
    books,
    courses,
    organisations:    orgs,
    communities,
    locations:        locs.all,
    countries:        locs.countries,
    cities:           locs.cities,
    regions:          locs.regions,
    events,
    skills,
    problems,
    solutions,
    lessons,
    recommendations:  input.linkedRecommendations ?? [],
    opportunitySignals: opps,
    intent,
    contentStage,
    emotionalTone,
    searchQuestions,
    geoQuestions,
    relatedContentIds,
    relatedBusinessIds,
    relatedFounderIds,
    seoKeywords,
    geoKeywords,
    canonicalTopics,
    generatedAt:      now(),
    engineVersion:    ENGINE_VERSION,
  }
}

// ─── Input builders ───────────────────────────────────────────────────────────

export function importedContentToInput(item: ImportedContent): AnalysisInput {
  const biz = item.businessId ? getBusiness(item.businessId) : undefined
  return {
    contentType:          'imported',
    contentId:            item.id,
    founderId:            item.founderId,
    businessId:           item.businessId,
    title:                item.title,
    description:          item.description,
    diaryNote:            item.diaryNote,
    transcriptText:       item.transcriptText,
    topics:               item.topics,
    locations:            item.locations,
    publishedAt:          item.publishedAt,
    linkedBusinessName:   biz?.name,
    linkedBusinessIndustry: biz?.industry?.name,
    autoSummary:          item.autoSummary,
    keyMoments:           item.keyMoments,
    peopleMentions:       item.peopleMentions,
    businessMentions:     item.businessMentions,
  }
}

export function storyToInput(story: Story): AnalysisInput {
  const biz = story.businessId ? getBusiness(story.businessId) : undefined
  return {
    contentType:          'story',
    contentId:            story.id,
    founderId:            story.founderId,
    businessId:           story.businessId,
    title:                story.title,
    description:          story.summary,
    storyContent:         story.blog,
    topics:               story.topics.map(t => t.name),
    locations:            [story.location?.name].filter(Boolean) as string[],
    publishedAt:          story.createdAt,
    linkedBusinessName:   biz?.name,
    linkedBusinessIndustry: story.industry?.name,
  }
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const villageContentIntelligenceService = {
  analyse(input: AnalysisInput): VillageContentIntelligence {
    const existing = this.getByContent(input.contentType, input.contentId)
    return runAnalysis(input, existing?.id)
  },

  upsert(item: VillageContentIntelligence): Promise<WriteResult> {
    return writeEntity<VillageContentIntelligence>({
      cacheKey: KEY,
      item,
      table: TABLE,
      toRow: i => ({
        id: i.id,
        content_type: i.contentType,
        content_id: i.contentId,
        founder_id: i.founderId,
        business_id: i.businessId ?? null,
        data: i,
      }),
    })
  },

  get(id: string): VillageContentIntelligence | undefined {
    return (readCache<VillageContentIntelligence>(KEY)).find(i => i.id === id)
  },

  getByContent(contentType: VillageContentType, contentId: string): VillageContentIntelligence | undefined {
    return (readCache<VillageContentIntelligence>(KEY))
      .find(i => i.contentType === contentType && i.contentId === contentId)
  },

  getByFounder(founderId: string): VillageContentIntelligence[] {
    return (readCache<VillageContentIntelligence>(KEY))
      .filter(i => i.founderId === founderId)
      .sort((a, b) => b.generatedAt.localeCompare(a.generatedAt))
  },

  getRelated(item: VillageContentIntelligence, limit = 6): VillageContentIntelligence[] {
    const all = readCache<VillageContentIntelligence>(KEY)
    return all
      .filter(i => i.id !== item.id)
      .map(i => ({
        item: i,
        score:
          i.primaryTopics.filter(t => item.primaryTopics.includes(t)).length * 3 +
          i.secondaryTopics.filter(t => item.primaryTopics.includes(t)).length * 2 +
          i.industries.filter(ind => item.industries.includes(ind)).length * 2 +
          i.cities.filter(c => item.cities.includes(c)).length * 2 +
          (i.founderId === item.founderId ? 1 : 0),
      }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(x => x.item)
  },

  getAll(): VillageContentIntelligence[] {
    return readCache<VillageContentIntelligence>(KEY)
  },
}
