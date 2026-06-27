import type { Testimonial } from '../types'

export const testimonials: Testimonial[] = [
  {
    id: 'testimonial-1',
    quote: 'I went from posting once a month and dreading it to publishing three times a week with stories I actually feel proud of. CULO changed how I think about content entirely.',
    authorName: 'Sarah M.',
    authorRole: 'Business Coach',
    authorCompany: 'Independent',
    founderId: 'shakas',
    businessId: 'pretty-cool-marketing',
    serviceId: 'content-strategy-session',
    featured: true,
    createdAt: '2024-06-01',
  },
  {
    id: 'testimonial-2',
    quote: 'The story extraction workshop unlocked 6 months of content in one afternoon. I had no idea I had so much worth sharing.',
    authorName: 'Marcus L.',
    authorRole: 'Founder',
    authorCompany: 'TradeFlow',
    founderId: 'shakas',
    businessId: 'pretty-cool-marketing',
    serviceId: 'story-extraction',
    featured: true,
    createdAt: '2024-07-15',
  },
  {
    id: 'testimonial-3',
    quote: 'Lucia has a gift for making you feel like yourself in front of the camera. The images she produced for us have completely transformed our website and social presence.',
    authorName: 'Priya K.',
    authorRole: 'Interior Designer',
    authorCompany: 'Studio Priya',
    founderId: 'lucia-romano',
    businessId: 'romano-visuals',
    serviceId: 'brand-shoot',
    featured: true,
    createdAt: '2024-05-20',
  },
  {
    id: 'testimonial-4',
    quote: 'We went from no content system to a documented publishing workflow in four weeks. James builds systems that actually get used.',
    authorName: 'Chen W.',
    authorRole: 'Co-founder',
    authorCompany: 'Stackr App',
    founderId: 'james-okafor',
    businessId: 'okafor-studio',
    serviceId: 'content-audit',
    featured: true,
    createdAt: '2024-08-10',
  },
  {
    id: 'testimonial-5',
    quote: 'Maya took a brief and turned it into a brand identity that I\'m still proud of two years later. She asks the right questions and does not rush.',
    authorName: 'Lena V.',
    authorRole: 'Nutritionist',
    authorCompany: 'Nourish by Lena',
    founderId: 'maya-chen',
    businessId: 'maya-chen-design',
    serviceId: 'brand-identity',
    featured: true,
    createdAt: '2024-04-05',
  },
  {
    id: 'testimonial-6',
    quote: 'Tom\'s coaching changed my business. I now have 40 pieces of content from the past 12 weeks of working together, and 3 new clients who found me through that content.',
    authorName: 'Jake R.',
    authorRole: 'Personal Trainer',
    authorCompany: 'Independent',
    founderId: 'tom-riley',
    businessId: 'riley-performance',
    serviceId: 'coaching-program',
    featured: true,
    createdAt: '2024-09-01',
  },
]

export const getTestimonialsForFounder = (founderId: string) =>
  testimonials.filter(t => t.founderId === founderId)
export const getTestimonialsForBusiness = (businessId: string) =>
  testimonials.filter(t => t.businessId === businessId)
export const getFeaturedTestimonials = () => testimonials.filter(t => t.featured)
