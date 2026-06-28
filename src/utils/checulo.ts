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
