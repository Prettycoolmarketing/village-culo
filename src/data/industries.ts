import type { Industry } from '../types'

// See UNSET_LOCATION in data/locations.ts — same reasoning, for the same
// reason: a fresh signup shouldn't default to industries[0] (Marketing &
// Advertising) before they've told us anything about themselves.
export const UNSET_INDUSTRY: Industry = { id: 'unset', slug: 'unset', name: '' }

// Master list — broad enough to cover most founders without forcing a
// mismatch. Onboarding's Industry field also offers an "Other" option for
// anything genuinely uncovered.
export const industries: Industry[] = [
  { id: 'marketing',        slug: 'marketing',        name: 'Marketing & Advertising' },
  { id: 'photography',      slug: 'photography',      name: 'Photography & Videography' },
  { id: 'design',           slug: 'design',           name: 'Design & Creative' },
  { id: 'technology',       slug: 'technology',       name: 'Technology & Software' },
  { id: 'hospitality',      slug: 'hospitality',      name: 'Hospitality & Food' },
  // Split from a single combined "Fitness & Wellness" entry — the word
  // "wellness" alone (a mindfulness coach, a wellness podcast host with no
  // training/movement focus) was matching this via plain word overlap and
  // getting tagged as fitness, which isn't what they do. Keep them as two
  // real, separate industries; a founder who's genuinely both gets matched
  // to whichever their own words actually emphasise.
  { id: 'fitness',          slug: 'fitness',          name: 'Fitness' },
  { id: 'wellness',         slug: 'wellness',         name: 'Wellness' },
  { id: 'real-estate',      slug: 'real-estate',      name: 'Real Estate & Property' },
  { id: 'education',        slug: 'education',        name: 'Education & Training' },
  { id: 'retail',           slug: 'retail',           name: 'Retail & E-commerce' },
  { id: 'consulting',       slug: 'consulting',       name: 'Consulting & Advisory' },
  { id: 'finance',          slug: 'finance',          name: 'Finance & Accounting' },
  { id: 'legal',            slug: 'legal',            name: 'Legal' },
  { id: 'health',           slug: 'health',           name: 'Health & Medical' },
  { id: 'beauty',           slug: 'beauty',           name: 'Beauty & Personal Care' },
  { id: 'fashion',          slug: 'fashion',          name: 'Fashion & Apparel' },
  { id: 'construction',     slug: 'construction',     name: 'Construction & Trades' },
  { id: 'architecture',     slug: 'architecture',     name: 'Architecture & Interior Design' },
  { id: 'agriculture',      slug: 'agriculture',      name: 'Agriculture & Farming' },
  { id: 'events',           slug: 'events',           name: 'Events & Entertainment' },
  { id: 'travel',           slug: 'travel',           name: 'Travel & Tourism' },
  { id: 'automotive',       slug: 'automotive',       name: 'Automotive' },
  { id: 'manufacturing',    slug: 'manufacturing',    name: 'Manufacturing & Production' },
  { id: 'nonprofit',        slug: 'nonprofit',        name: 'Nonprofit & Community' },
  { id: 'media',            slug: 'media',            name: 'Media & Publishing' },
  { id: 'coaching',         slug: 'coaching',         name: 'Coaching & Personal Development' },
  { id: 'childcare',        slug: 'childcare',        name: 'Childcare & Family Services' },
  { id: 'pet-care',         slug: 'pet-care',         name: 'Pet Care & Veterinary' },
  { id: 'home-services',    slug: 'home-services',    name: 'Home Services & Trades' },
  { id: 'logistics',        slug: 'logistics',        name: 'Logistics & Transport' },
  { id: 'sustainability',   slug: 'sustainability',   name: 'Sustainability & Environment' },
  { id: 'entrepreneurship', slug: 'entrepreneurship', name: 'Entrepreneurship' },
]

export const getIndustry = (id: string) => industries.find(i => i.id === id)
