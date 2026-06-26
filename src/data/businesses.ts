import type { Business } from '../types'
import { locations } from './locations'
import { industries } from './industries'
import { topics } from './topics'

const brisbane = locations[0]
const goldCoast = locations[1]
const sydney = locations[2]
const melbourne = locations[3]

const marketing = industries[0]
const photography = industries[1]
const design = industries[2]
const technology = industries[3]
const fitness = industries[4]

export const businesses: Business[] = [
  // ─── Real: Pretty Cool Marketing ───────────────────────────────────────────
  {
    id: 'pretty-cool-marketing',
    slug: 'pretty-cool-marketing',
    name: 'Pretty Cool Marketing',
    tagline: 'The content operating system for founders who have something worth saying.',
    description: 'Pretty Cool Marketing builds content systems for founders. Home of CULO — the AI-powered content editor built inside Canva that turns real experiences into reels, blogs and carousels.',
    logo: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=200&q=80',
    coverImage: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80',
    founderId: 'shakas',
    location: brisbane,
    industry: marketing,
    topics: [
      topics[0], // AI Marketing
      topics[2], // Content Systems
      topics[4], // Canva Workflows
      topics[1], // Founder Storytelling
    ],
    website: 'https://prettycoolmarketing.com',
    instagram: 'https://instagram.com/prettycoolmarketing',
    offers: [
      {
        id: 'culo-app',
        title: 'CULO — Content Studio for Founders',
        description: 'Create reels, blogs and carousels from your real experiences. Built inside Canva.',
        ctaLabel: 'Try CULO in Canva',
        ctaUrl: 'https://prettycoolmarketing.com/culo',
      },
      {
        id: 'content-strategy-session',
        title: '1:1 Content Strategy Session',
        description: 'A focused 60-minute session to build your content system from scratch.',
        ctaLabel: 'Book a Session',
        ctaUrl: 'https://prettycoolmarketing.com/book',
      },
    ],
    status: 'featured',
    featured: true,
    createdAt: '2024-01-15',
    seoTitle: 'Pretty Cool Marketing — Content for Founders',
    seoDescription: 'Content systems for founders. Home of CULO.',
  },
  // ─── Realistic placeholders ────────────────────────────────────────────────
  {
    id: 'romano-visuals',
    slug: 'romano-visuals',
    name: 'Romano Visuals',
    tagline: 'Brand photography that actually looks like you.',
    description: 'Brisbane-based brand photography studio helping small businesses show up with images that tell their real story.',
    logo: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=200&q=80',
    coverImage: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=1200&q=80',
    founderId: 'lucia-romano',
    location: brisbane,
    industry: photography,
    topics: [topics[14], topics[1], topics[8]],
    website: 'https://romanovisuals.com.au',
    instagram: 'https://instagram.com/romanovisuals',
    offers: [
      {
        id: 'brand-shoot',
        title: 'Brand Photography Day',
        description: 'A full day shoot to build your image library for the next 6 months.',
        ctaLabel: 'Book Your Shoot',
        ctaUrl: 'https://romanovisuals.com.au/book',
      },
    ],
    status: 'published',
    featured: true,
    createdAt: '2024-02-10',
  },
  {
    id: 'okafor-studio',
    slug: 'okafor-studio',
    name: 'Okafor Studio',
    tagline: 'Content systems that run without you.',
    description: 'Sydney-based content strategy studio. We build repeatable systems so founders can create consistently without burning out.',
    logo: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=200&q=80',
    coverImage: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&q=80',
    founderId: 'james-okafor',
    location: sydney,
    industry: technology,
    topics: [topics[2], topics[9], topics[0]],
    website: 'https://okaforstudio.com',
    offers: [
      {
        id: 'content-audit',
        title: 'Content System Audit',
        description: 'We audit your current content process and build a repeatable system in its place.',
        ctaLabel: 'Get an Audit',
        ctaUrl: 'https://okaforstudio.com/audit',
      },
    ],
    status: 'published',
    featured: false,
    createdAt: '2024-03-05',
  },
  {
    id: 'maya-chen-design',
    slug: 'maya-chen-design',
    name: 'Maya Chen Design',
    tagline: 'Brand identity for founders who are ready to be seen.',
    description: 'Melbourne-based design studio specialising in visual identity for founders and small businesses. We build brand systems that hold up everywhere.',
    logo: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=200&q=80',
    coverImage: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=1200&q=80',
    founderId: 'maya-chen',
    location: melbourne,
    industry: design,
    topics: [topics[6], topics[9], topics[8]],
    website: 'https://mayachendesign.com',
    offers: [
      {
        id: 'brand-identity',
        title: 'Brand Identity Package',
        description: 'Logo, colour system, typography and brand guidelines — everything you need to show up consistently.',
        ctaLabel: 'View the Package',
        ctaUrl: 'https://mayachendesign.com/brand',
      },
    ],
    status: 'published',
    featured: true,
    createdAt: '2024-03-22',
  },
  {
    id: 'riley-performance',
    slug: 'riley-performance',
    name: 'Riley Performance',
    tagline: 'Fitness coaching that turns results into content.',
    description: 'Gold Coast fitness coaching for busy professionals. We help coaches document client results as content that attracts new clients automatically.',
    logo: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200&q=80',
    coverImage: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1200&q=80',
    founderId: 'tom-riley',
    location: goldCoast,
    industry: fitness,
    topics: [topics[5], topics[3], topics[1]],
    instagram: 'https://instagram.com/tomrileyperformance',
    offers: [
      {
        id: 'coaching-program',
        title: '12-Week Coaching Program',
        description: 'Online fitness coaching with a content strategy built in from day one.',
        ctaLabel: 'Apply Now',
        ctaUrl: 'https://rileyperf.com/apply',
      },
    ],
    status: 'published',
    featured: false,
    createdAt: '2024-04-01',
  },
]

export const getBusiness        = (id: string)   => businesses.find(b => b.id   === id)
export const getBusinessBySlug  = (slug: string) => businesses.find(b => b.slug === slug)
export const getFeaturedBusinesses = () => businesses.filter(b => b.featured && b.status !== 'archived')
