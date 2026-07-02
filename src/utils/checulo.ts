import type { Story, Founder, Business, Location, ContentType } from '../types'

// Priority order — most visual format wins
const FORMAT_PRIORITY: ContentType[] = ['reel', 'carousel', 'blog']

const FORMAT_LABEL: Record<ContentType, string> = {
  reel:               'Reel',
  carousel:           'Carousel',
  blog:               'Blog Post',
  podcast:            'Podcast',
  'talking-head':     'Talking Head',
  'voice-over':       'Voice Over',
  'photo-story':      'Photo Story',
  document:           'Document',
  'external-article': 'External Article',
  'youtube-video':    'YouTube Video',
  'social-post':      'Social Post',
}

export function primaryContentFormat(contentTypes: ContentType[]): string {
  for (const fmt of FORMAT_PRIORITY) {
    if (contentTypes.includes(fmt)) return FORMAT_LABEL[fmt]
  }
  return 'Story'
}

export function formatCheCuloActivity(
  story: Story,
  founder: Founder | undefined,
  business: Business | undefined,
  location: Location,
): string {
  const format = primaryContentFormat(story.contentTypes)

  if (founder && business) {
    return `Che CULO!! ${founder.name} from ${business.name} in ${location.name} added a ${format}.`
  }
  if (founder) {
    return `Che CULO!! ${founder.name} in ${location.name} added a ${format}.`
  }
  return `Che CULO!! A new ${format} just landed in the Village.`
}

export function formatCheCuloSuccess(): string {
  return 'Che CULO!! Your Story is live in the Village.'
}

// ─── Milestone celebrations ──────────────────────────────────────────────────
// Reserved for genuine, real, first-time-only events (see checkFirstMilestone
// callers) — never fired on repeat occurrences, and never for milestones the
// platform doesn't actually measure. Every other success message stays warm
// but does not use this prefix.

export function formatCheCuloFirstStory(founderName: string): string {
  return `Che CULO!! ${founderName}, your first story is now helping grow your expertise across the Village.`
}

export function formatCheCuloFirstProfile(founderName: string): string {
  return `Che CULO!! Welcome to the Village, ${founderName} — your founder profile is live.`
}

export function formatCheCuloFirstIdea(): string {
  return 'Che CULO!! Village just extracted your first Idea from a story — it\'s now part of the knowledge graph.'
}

export function formatCheCuloFirstAuthority(): string {
  return 'Che CULO!! You just earned your first Authority points. Every story you publish grows this.'
}

export function formatCheCuloKnowledgeGraphMilestone(): string {
  return 'Che CULO!! Your first Village connection just formed — your content now links to another founder or business.'
}

export function formatCheCuloFirstBusiness(businessName: string): string {
  return `Che CULO!! ${businessName}'s profile is complete and ready to be discovered.`
}
