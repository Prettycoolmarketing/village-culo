export type VillageContentType = 'story' | 'imported' | 'blog' | 'carousel' | 'reel' | 'diary'

export type ContentIntent =
  | 'Education' | 'Story' | 'Reflection' | 'Opinion' | 'Tutorial'
  | 'Case Study' | 'Behind The Scenes' | 'Launch' | 'Review' | 'Announcement'

export type ContentStage =
  | 'Learning' | 'Building' | 'Scaling' | 'Teaching' | 'Reflecting' | 'Celebrating'

export type EmotionalTone =
  | 'Inspired' | 'Reflective' | 'Practical' | 'Energetic' | 'Cautious' | 'Celebratory' | 'Honest'

export interface VillageContentIntelligence {
  id: string
  contentType: VillageContentType
  contentId: string
  founderId: string
  businessId?: string

  headline: string
  summary: string

  primaryTopics: string[]
  secondaryTopics: string[]
  industries: string[]

  people: string[]
  businesses: string[]
  products: string[]
  software: string[]
  services: string[]
  books: string[]
  courses: string[]
  organisations: string[]
  communities: string[]

  locations: string[]
  countries: string[]
  cities: string[]
  regions: string[]

  events: string[]
  skills: string[]
  problems: string[]
  solutions: string[]
  lessons: string[]
  recommendations: string[]
  opportunitySignals: string[]

  intent: ContentIntent
  contentStage: ContentStage
  emotionalTone: EmotionalTone

  searchQuestions: string[]
  geoQuestions: string[]

  relatedContentIds: string[]
  relatedBusinessIds: string[]
  relatedFounderIds: string[]

  seoKeywords: string[]
  geoKeywords: string[]
  canonicalTopics: string[]

  generatedAt: string
  engineVersion: string
}

export interface AnalysisInput {
  contentType: VillageContentType
  contentId: string
  founderId: string
  businessId?: string
  title: string
  description?: string
  diaryNote?: string
  transcriptText?: string
  storyContent?: string
  topics?: string[]
  locations?: string[]
  publishedAt?: string
  linkedBusinessName?: string
  linkedBusinessIndustry?: string
  linkedRecommendations?: string[]
  autoSummary?: string
  keyMoments?: string[]
  peopleMentions?: string[]
  businessMentions?: string[]
}
