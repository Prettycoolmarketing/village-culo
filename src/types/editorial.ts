// Type 3 content per the Village Content Principles: authored by Pretty Cool
// Marketing (or another authorised editorial team), never a founder. Always
// references and backlinks to real original work — it curates, it never
// replaces or rewrites what a founder published.
export type EditorialTemplate = 'founder-spotlight' | 'industry-roundup' | 'weekly-collection'
export type EditorialStatus = 'draft' | 'published'

// One curated reference inside a feature — a founder, story or business the
// piece is drawing attention to, plus the editor's own note about why it's
// included. The note is PCM's original commentary, not a summary/rewrite of
// the referenced work.
export interface EditorialPick {
  founderId?: string
  storyId?: string
  businessId?: string
  note: string
}

export interface EditorialFeature {
  id: string
  slug: string
  template: EditorialTemplate
  status: EditorialStatus
  title: string
  dek?: string
  coverImage?: string
  // The editorial framing text — written by PCM, distinct from any founder's
  // own words, always presented as such.
  intro: string
  picks: EditorialPick[]
  topicIds: string[]
  publishedAt?: string
  createdAt: string
  updatedAt: string
}

export interface EditorialFeatureFilter {
  status?: EditorialStatus
  template?: EditorialTemplate
}
