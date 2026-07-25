import type { Topic } from '../types'
import { slugify } from '../utils/slugify'

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
  { id: 'health-and-wellness', slug: 'health-and-wellness', name: 'Health & Wellness', description: 'Physical and mental wellbeing services, from allied health to holistic care.', count: 0 },
  { id: 'fitness', slug: 'fitness', name: 'Fitness', description: 'Training, coaching and movement-based businesses.', count: 0 },
  { id: 'beauty-and-skincare', slug: 'beauty-and-skincare', name: 'Beauty & Skincare', description: 'Salons, skincare brands and beauty services.', count: 0 },
  { id: 'fashion-and-retail', slug: 'fashion-and-retail', name: 'Fashion & Retail', description: 'Clothing, accessories and physical or online retail.', count: 0 },
  { id: 'food-and-hospitality', slug: 'food-and-hospitality', name: 'Food & Hospitality', description: 'Cafes, restaurants, catering and food producers.', count: 0 },
  { id: 'trades-and-construction', slug: 'trades-and-construction', name: 'Trades & Construction', description: 'Builders, tradespeople and construction businesses.', count: 0 },
  { id: 'real-estate', slug: 'real-estate', name: 'Real Estate', description: 'Property sales, management and investment.', count: 0 },
  { id: 'finance-and-accounting', slug: 'finance-and-accounting', name: 'Finance & Accounting', description: 'Bookkeeping, accounting, lending and financial advice.', count: 0 },
  { id: 'legal', slug: 'legal', name: 'Legal', description: 'Legal services and advice for individuals and businesses.', count: 0 },
  { id: 'education-and-training', slug: 'education-and-training', name: 'Education & Training', description: 'Tutoring, courses, coaching and skills training.', count: 0 },
  { id: 'technology', slug: 'technology', name: 'Technology', description: 'Software, apps and tech-driven products or services.', count: 0 },
  { id: 'creative-arts', slug: 'creative-arts', name: 'Creative Arts', description: 'Design, art, music and other creative practices.', count: 0 },
  { id: 'events', slug: 'events', name: 'Events', description: 'Event planning, styling and production.', count: 0 },
  { id: 'parenting-and-family', slug: 'parenting-and-family', name: 'Parenting & Family', description: 'Products and services for parents, kids and families.', count: 0 },
  { id: 'disability-support', slug: 'disability-support', name: 'Disability Support', description: 'NDIS and other disability support services.', count: 0 },
  { id: 'sustainability', slug: 'sustainability', name: 'Sustainability', description: 'Eco-conscious products, services and practices.', count: 0 },
  { id: 'travel-and-tourism', slug: 'travel-and-tourism', name: 'Travel & Tourism', description: 'Travel planning, tours and hospitality experiences.', count: 0 },
  { id: 'automotive', slug: 'automotive', name: 'Automotive', description: 'Vehicle sales, servicing and related businesses.', count: 0 },
  { id: 'pets-and-animals', slug: 'pets-and-animals', name: 'Pets & Animals', description: 'Pet care, training and animal-related services.', count: 0 },
  { id: 'nonprofit-and-community', slug: 'nonprofit-and-community', name: 'Nonprofit & Community', description: 'Charities, community groups and social enterprises.', count: 0 },
  { id: 'home-and-interiors', slug: 'home-and-interiors', name: 'Home & Interiors', description: 'Interior design, homewares and home services.', count: 0 },
]

export const getTopic = (id: string) => topics.find(t => t.id === id)
export const getTopics = (ids: string[]) => topics.filter(t => ids.includes(t.id))

// A founder-typed topic that isn't in the curated list yet. Topics live embedded
// on each Story (not a separate table), so "creating" one is just building a
// well-formed Topic object — it becomes real the moment a story carries it, and
// /topics/:slug finds it by scanning stories for a matching slug, curated or not.
export function createCustomTopic(name: string, existing: Topic[] = topics): Topic {
  const trimmed = name.trim()
  const slug = slugify(trimmed)
  const match = existing.find(t => t.slug === slug)
  if (match) return match
  return { id: crypto.randomUUID(), slug, name: trimmed, description: '', count: 0 }
}
