import type { Industry } from '../types'

export const industries: Industry[] = [
  { id: 'marketing', slug: 'marketing', name: 'Marketing' },
  { id: 'photography', slug: 'photography', name: 'Photography' },
  { id: 'design', slug: 'design', name: 'Design' },
  { id: 'technology', slug: 'technology', name: 'Technology' },
  { id: 'hospitality', slug: 'hospitality', name: 'Hospitality' },
  { id: 'fitness', slug: 'fitness', name: 'Fitness & Wellness' },
  { id: 'real-estate', slug: 'real-estate', name: 'Real Estate' },
  { id: 'education', slug: 'education', name: 'Education' },
  { id: 'retail', slug: 'retail', name: 'Retail' },
  { id: 'consulting', slug: 'consulting', name: 'Consulting' },
]

export const getIndustry = (id: string) => industries.find(i => i.id === id)
