import type { Topic } from '../types'

export const topics: Topic[] = [
  { id: 'ai-marketing', slug: 'ai-marketing', name: 'AI Marketing', description: 'Using artificial intelligence to create, distribute and optimise content.', count: 12 },
  { id: 'founder-storytelling', slug: 'founder-storytelling', name: 'Founder Storytelling', description: 'How founders use their personal stories to build trust and authority.', count: 24 },
  { id: 'content-systems', slug: 'content-systems', name: 'Content Systems', description: 'Repeatable systems that make content creation consistent and scalable.', count: 18 },
  { id: 'camera-roll-marketing', slug: 'camera-roll-marketing', name: 'Camera Roll Marketing', description: 'Using everyday footage from your phone as marketing content.', count: 9 },
  { id: 'canva-workflows', slug: 'canva-workflows', name: 'Canva Workflows', description: 'Efficient design and publishing workflows built inside Canva.', count: 7 },
  { id: 'short-form-video', slug: 'short-form-video', name: 'Short Form Video', description: 'Reels, TikTok and YouTube Shorts strategy for founders.', count: 21 },
  { id: 'personal-brand', slug: 'personal-brand', name: 'Personal Brand', description: 'Building a recognised and trusted name in your industry.', count: 31 },
  { id: 'local-marketing', slug: 'local-marketing', name: 'Local Marketing', description: 'Marketing strategies that work for location-based businesses.', count: 11 },
  { id: 'authenticity', slug: 'authenticity', name: 'Authenticity', description: 'Why showing up as yourself builds deeper connections with your audience.', count: 16 },
  { id: 'content-strategy', slug: 'content-strategy', name: 'Content Strategy', description: 'Planning and executing content that serves a clear business goal.', count: 28 },
  { id: 'social-media', slug: 'social-media', name: 'Social Media', description: 'Platform-specific strategy and distribution.', count: 19 },
  { id: 'email-marketing', slug: 'email-marketing', name: 'Email Marketing', description: 'Building and nurturing an audience through email.', count: 8 },
  { id: 'lead-generation', slug: 'lead-generation', name: 'Lead Generation', description: 'Turning content into clients and customers.', count: 14 },
  { id: 'entrepreneurship', slug: 'entrepreneurship', name: 'Entrepreneurship', description: 'The realities and lessons of building a business.', count: 22 },
  { id: 'photography', slug: 'photography', name: 'Photography', description: 'Using photography as a storytelling and marketing tool.', count: 6 },
]

export const getTopic = (id: string) => topics.find(t => t.id === id)
export const getTopics = (ids: string[]) => topics.filter(t => ids.includes(t.id))
