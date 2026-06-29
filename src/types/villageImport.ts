// ─── Village Import Format (VIF) ─────────────────────────────────────────────
// Structured JSON schema for bulk-importing founder profiles into CULO Village.
// Designed to be output by Claude, ChatGPT, Sellable AI, or manual curation.

export type VIFSource = 'claude' | 'chatgpt' | 'sellable-ai' | 'manual' | 'csv' | 'other'
export type VIFContentStatus = 'draft' | 'published' | 'featured'
export type VIFRecommendationType =
  | 'software' | 'book' | 'product' | 'business'
  | 'course' | 'service' | 'community' | 'other'

export interface VillageImportPackage {
  id?: string
  batchName: string
  createdAt?: string
  source?: VIFSource
  founders: VillageImportFounder[]
}

export interface VillageImportFounder {
  fullName: string
  preferredName?: string
  slug?: string
  headline?: string
  bio?: string
  country?: string
  state?: string
  city?: string
  website?: string
  linkedinUrl?: string
  youtubeUrl?: string
  instagramUrl?: string
  tiktokUrl?: string
  podcastUrl?: string
  newsletterUrl?: string
  profileImageUrl?: string
  topics?: string[]
  industries?: string[]
  notes?: string
  businesses?: VillageImportBusiness[]
  content?: VillageImportContent[]
  books?: VillageImportBook[]
  courses?: VillageImportCourse[]
  events?: VillageImportEvent[]
  communities?: VillageImportCommunity[]
  speakingTopics?: string[]
  recommendations?: VillageImportRecommendation[]
  sourceLinks?: string[]
}

export interface VillageImportBusiness {
  name: string
  slug?: string
  website?: string
  description?: string
  industry?: string
  role?: string
  logoUrl?: string
  location?: string
}

export interface VillageImportContent {
  title: string
  url: string
  platform?: string
  description?: string
  publishedAt?: string
  businessName?: string
  topics?: string[]
  locations?: string[]
  status?: VIFContentStatus
}

export interface VillageImportBook {
  title: string
  url?: string
  description?: string
}

export interface VillageImportCourse {
  title: string
  url?: string
  description?: string
}

export interface VillageImportEvent {
  name: string
  url?: string
  description?: string
  date?: string
  location?: string
}

export interface VillageImportCommunity {
  name: string
  url?: string
  description?: string
}

export interface VillageImportRecommendation {
  name: string
  type?: VIFRecommendationType
  url?: string
  notes?: string
}

// ─── Validation ───────────────────────────────────────────────────────────────

export interface VIFFounderPreview {
  index: number
  displayName: string
  resolvedSlug: string
  businessCount: number
  contentCount: number
  isDuplicate: boolean
  errors: string[]
  warnings: string[]
}

export interface VIFValidationResult {
  isValid: boolean
  founderCount: number
  totalBusinesses: number
  totalContent: number
  founders: VIFFounderPreview[]
  globalErrors: string[]
  globalWarnings: string[]
}

// ─── Import options ───────────────────────────────────────────────────────────

export interface VIFImportOptions {
  publishContent: boolean
  runIntelligence: boolean
  createBusinesses: boolean
  overwriteDuplicates: boolean
  skipDuplicates: boolean
}

export const DEFAULT_IMPORT_OPTIONS: VIFImportOptions = {
  publishContent: true,
  runIntelligence: true,
  createBusinesses: true,
  overwriteDuplicates: false,
  skipDuplicates: true,
}

// ─── Import result ────────────────────────────────────────────────────────────

export interface VIFImportedFounder {
  id: string
  name: string
  slug: string
}

export interface VIFImportResult {
  created: VIFImportedFounder[]
  skipped: string[]
  errors: { name: string; error: string }[]
  businessesCreated: number
  contentCreated: number
  intelGenerated: number
}
