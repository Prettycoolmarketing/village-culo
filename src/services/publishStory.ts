import { getFounders } from './founders'
import { getStories, updateStory } from './stories'
import { getIdeas } from './ideas'
import { importedContentService, PLATFORM_LABELS } from './importedContent'
import { villageContentIntelligenceService, storyToInput } from './villageIntelligence'
import { syncIdeasFromStory, refreshAuthorityScores } from './ideaSync'
import { syncRelationshipsFromStory } from './relationshipSync'
import { scanStoryForPartnerFlags } from './partnerFlagDetection'
import { runMatching } from './opportunityMatching'
import {
  formatCheCuloFirstStory, formatCheCuloFirstIdea,
  formatCheCuloFirstAuthority, formatCheCuloKnowledgeGraphMilestone,
} from '../utils/checulo'
import { locations } from '../data/locations'
import { industries } from '../data/industries'
import { topics as allTopics } from '../data/topics'
import { slugify } from '../utils/slugify'
import type { Story, ContentType, Founder } from '../types'
import type { ImportedContent, ImportedContentPlatform } from '../types/importedContent'

export interface PublishSummary {
  ideasCreated: number
  ideasStrengthened: number
  relationships: number
  founderLinks: number
  businessLinks: number
  internalLinks: number
  seoComplete: boolean
  geoComplete: boolean
  authorityDelta: number
  milestone: string | null
}

export interface PublishResult {
  success: boolean
  error?: string
  story?: Story
  summary?: PublishSummary | null
}

/** Founder-curated edits from the wizard's Village Intelligence step — omitted entirely for a quick-publish. */
export interface PublishOverrides {
  lessonsOverride?: string[]
  questionsOverride?: string[]
  excludedFounderIds?: string[]
  excludedBusinessIds?: string[]
  excludedContentIds?: string[]
  extraFounderIds?: string[]
  extraBusinessIds?: string[]
}

/**
 * The write + side-effect pipeline every publish path goes through, once a
 * complete Story object already exists — this is the part DashboardPublishPage's
 * wizard and the Import Content bulk-publish path both call, so behavior can
 * never drift between "compose from scratch" and "quick-publish an import."
 * Nothing about Village Intelligence, ideas, relationships or authority is
 * reimplemented here — same calls, same order, as the original wizard.
 */
export async function publishStoryCore(story: Story, overrides: PublishOverrides = {}): Promise<PublishResult> {
  const founder = getFounders().find(f => f.id === story.founderId)

  const priorStoryCount = story.founderId ? getStories({ founderId: story.founderId, publicOnly: true }).length : 0
  const priorIdeas = story.founderId ? getIdeas({ founderId: story.founderId }) : []
  const priorIdeaCount = priorIdeas.length
  const priorAuthority = founder?.authorityScore ?? 0
  const priorRelationshipTotal = priorIdeas.reduce(
    (sum, i) => sum + i.relatedBusinessIds.length + i.relatedFounderIds.filter(fid => fid !== story.founderId).length, 0,
  )

  const result = await updateStory(story)
  if (!result.success) {
    return { success: false, error: result.error ?? 'Could not publish. Please try again.' }
  }

  if (story.importedContentId) {
    const source = importedContentService.get(story.importedContentId)
    if (source) void importedContentService.upsert({ ...source, relatedStoryId: story.id })
  }

  if (story.status !== 'published') {
    return { success: true, story, summary: null }
  }

  // Same engine the Story Builder's live preview used — merge in whatever the
  // founder explicitly edited in the Lessons/Questions/Related-entity cards
  // (empty/no-op for a quick-publish, since there's no curation step there).
  const intel = villageContentIntelligenceService.analyse(storyToInput(story))
  const merged = {
    ...intel,
    lessons: overrides.lessonsOverride ?? intel.lessons,
    geoQuestions: overrides.questionsOverride ?? intel.geoQuestions,
    relatedFounderIds: [
      ...intel.relatedFounderIds.filter(fid => !(overrides.excludedFounderIds ?? []).includes(fid)),
      ...(overrides.extraFounderIds ?? []),
    ],
    relatedBusinessIds: [
      ...intel.relatedBusinessIds.filter(bid => !(overrides.excludedBusinessIds ?? []).includes(bid)),
      ...(overrides.extraBusinessIds ?? []),
    ],
    relatedContentIds: intel.relatedContentIds.filter(cid => !(overrides.excludedContentIds ?? []).includes(cid)),
  }
  void villageContentIntelligenceService.upsert(merged)

  const { created, strengthened } = await syncIdeasFromStory(story, merged)
  const { founderDelta } = await refreshAuthorityScores(story)
  await syncRelationshipsFromStory(story, merged)
  void scanStoryForPartnerFlags(story)
  // Feeds the just-published content into partner/opportunity matching
  // automatically — a founder shouldn't have to remember to go click "Find
  // opportunities" separately every time they publish. Fire-and-forget: a
  // slow/failed match pass should never hold up or fail the publish itself.
  if (story.founderId) void runMatching(story.founderId)
  const totalRelationships = merged.relatedFounderIds.length + merged.relatedBusinessIds.length + merged.relatedContentIds.length

  const milestone =
    priorStoryCount === 0 ? formatCheCuloFirstStory(founder?.name ?? 'Founder') :
    (priorIdeaCount === 0 && created.length > 0) ? formatCheCuloFirstIdea() :
    (priorAuthority === 0 && founderDelta > 0) ? formatCheCuloFirstAuthority() :
    (priorRelationshipTotal === 0 && totalRelationships > 0) ? formatCheCuloKnowledgeGraphMilestone() :
    null

  return {
    success: true,
    story,
    summary: {
      ideasCreated: created.length,
      ideasStrengthened: strengthened.length,
      relationships: totalRelationships,
      founderLinks: merged.relatedFounderIds.length,
      businessLinks: merged.relatedBusinessIds.length,
      internalLinks: merged.relatedContentIds.length,
      seoComplete: merged.seoKeywords.length > 0,
      geoComplete: merged.geoQuestions.length > 0,
      authorityDelta: founderDelta,
      milestone,
    },
  }
}

// ─── Import → Story mapping ───────────────────────────────────────────────────
// A founder bringing in existing work already told Village everything it
// needs — the platform tells us the format, the Import Engine's auto-analysis
// (Phase A) already gave us a real title/description/thumbnail. No format
// picker, no manual field-filling.

const PLATFORM_CONTENT_TYPE: Record<ImportedContentPlatform, ContentType> = {
  youtube:   'youtube-video',
  vimeo:     'youtube-video',
  tiktok:    'reel',
  instagram: 'reel',
  podcast:   'podcast',
  linkedin:  'social-post',
  website:   'blog',
  canva:     'carousel',
}

function uniqueSlug(base: string): string {
  const slug = base || `story-${Date.now()}`
  const existingSlugs = new Set(getStories().map(s => s.slug))
  if (!existingSlugs.has(slug)) return slug
  let suffix = 2
  while (existingSlugs.has(`${slug}-${suffix}`)) suffix++
  return `${slug}-${suffix}`
}

/** Builds a complete, publishable Story directly from an already-reviewed ImportedContent item — no wizard. */
export function buildStoryFromImport(item: ImportedContent, founder: Founder): Story {
  // contentTypeHint overrides the platform default when set — used by the
  // Canva slide-grouping flow, where one Canva design produces several
  // separate items (a Reel+blog, a Carousel, a standalone Blog) that each
  // need a different, possibly multi-format, contentTypes array.
  const contentTypes = item.contentTypeHint && item.contentTypeHint.length > 0
    ? item.contentTypeHint
    : [PLATFORM_CONTENT_TYPE[item.sourcePlatform]]
  const contentType = contentTypes[0]!
  const matchedTopics = allTopics.filter(t => item.topics.some(it => it.toLowerCase() === t.name.toLowerCase()))
  const matchedLocation = locations.find(l => item.locations.some(il => il.toLowerCase() === l.name.toLowerCase()))
    ?? founder.location ?? locations[0]!
  const industry = founder.industry ?? industries[0]!

  const id = `pub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  const slug = uniqueSlug(slugify(item.title))
  const nowIso = new Date().toISOString().split('T')[0]!

  const story: Story = {
    id,
    slug,
    title: item.title || `Imported from ${PLATFORM_LABELS[item.sourcePlatform]}`,
    subtitle: item.subtitle,
    summary: item.summary || item.autoSummary || item.description || '',
    coverImage: item.thumbnailUrl || '/placeholders/village-story.svg',
    founderId: founder.id,
    businessId: item.businessId ?? founder.businessId,
    location: matchedLocation,
    industry,
    topics: matchedTopics,
    contentTypes,
    ideaIds: [],
    relatedStoryIds: [],
    importedContentId: item.id,
    partnerId: item.partnerId,
    ctaLabel: item.ctaLabel || 'View original',
    ctaUrl: item.ctaUrl || item.originalUrl,
    seoTitle: item.seoTitle,
    seoDescription: item.seoDescription,
    status: 'published',
    featured: false,
    publishingSource: item.sourcePlatform === 'canva' ? 'canva-api' : 'website-import',
    createdAt: nowIso,
    updatedAt: nowIso,
  }

  // The full written description — whatever's in the Blog field, or a
  // transcript/diary note as a fallback when Blog itself is empty — is
  // featured as its own Blog tab regardless of format, so a video/podcast
  // story doesn't lose its full written context just because `summary` only
  // ever holds a short blurb. description (the Blog field a founder actually
  // edits) must win first: it used to rank below diaryNote/transcriptText,
  // which meant editing Blog on a Canva import or anything with a saved
  // transcript silently had no effect on the published story.
  const fullDescription = item.description || item.diaryNote || item.transcriptText
    || (contentType === 'blog' ? item.autoSummary : undefined) || ''
  if (fullDescription) story.blog = fullDescription

  // Independent checks (not else-if) — a multi-format item like a Canva
  // Reel+blog group needs both story.reelUrl AND story.blog set together.
  if (contentTypes.includes('podcast')) {
    // originalUrl is the episode's webpage (kept as ctaUrl/"View original"
    // above); enclosureUrl is the actual playable audio file when the feed
    // supplied one — falls back to originalUrl only if it didn't.
    story.audioUrl = item.enclosureUrl || item.originalUrl
  }
  if (contentTypes.includes('carousel')) {
    story.carouselImages = item.imageUrls?.filter(Boolean) ?? []
  }
  if (contentTypes.some(ct => ct === 'reel' || ct === 'youtube-video' || ct === 'social-post')) {
    // youtube-video / reel / social-post — the video/post URL itself is the
    // primary content. reelVideoUrl wins when set. For a Canva or Instagram
    // Archive piece, originalUrl is never a playable video (a Canva design
    // share link, or empty for an archived post) — falling back to it there
    // used to mean the published story silently linked out to Canva instead
    // of playing nothing/an honest empty state, so that fallback only
    // applies to platforms whose originalUrl really is the video itself
    // (YouTube, TikTok, Instagram's live originalUrl, etc.).
    const originalUrlIsPlayable = item.sourcePlatform !== 'canva'
    story.reelUrl = item.reelVideoUrl || (originalUrlIsPlayable ? item.originalUrl : undefined)
  }

  return story
}

/**
 * "Edit your story" on an already-published import used to only save the
 * ImportedContent copy — the founder edits something, sees no error, and the
 * live Story silently keeps showing the old text. Mirrors the same field
 * derivation as buildStoryFromImport (title/summary/cover/blog) but applies
 * it to the existing Story in place instead of creating a new one, so the
 * slug, contentTypes, publishing history etc. are all left untouched — only
 * the fields this edit form actually exposes get updated.
 */
export async function syncImportEditsToStory(item: ImportedContent): Promise<void> {
  if (!item.relatedStoryId) return
  const story = getStories().find(s => s.id === item.relatedStoryId)
  if (!story) return

  const contentType = story.contentTypes[0]
  const fullDescription = item.description || item.diaryNote || item.transcriptText
    || (contentType === 'blog' ? item.autoSummary : undefined) || ''

  await updateStory({
    ...story,
    title: item.title || story.title,
    subtitle: item.subtitle || story.subtitle,
    summary: item.summary || item.autoSummary || item.description || story.summary,
    coverImage: item.thumbnailUrl || story.coverImage,
    blog: fullDescription || story.blog,
    partnerId: item.partnerId ?? story.partnerId,
    ctaLabel: item.ctaLabel || story.ctaLabel,
    ctaUrl: item.ctaUrl || story.ctaUrl,
    seoTitle: item.seoTitle || story.seoTitle,
    seoDescription: item.seoDescription || story.seoDescription,
    updatedAt: new Date().toISOString().split('T')[0]!,
  })
}
