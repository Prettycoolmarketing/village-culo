import type { Founder } from '../types'
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

export const founders: Founder[] = [
  // ─── Real: Shakas / Pretty Cool Marketing ──────────────────────────────────
  {
    id: 'shakas',
    slug: 'shakas',
    name: 'Shakas',
    bio: 'Founder of Pretty Cool Marketing and creator of CULO — the content operating system built inside Canva. I help founders turn real experiences into content that actually works.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
    coverImage: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80',
    location: brisbane,
    industry: marketing,
    businessId: 'pretty-cool-marketing',
    topics: [
      topics[0], // AI Marketing
      topics[1], // Founder Storytelling
      topics[2], // Content Systems
      topics[3], // Camera Roll Marketing
      topics[4], // Canva Workflows
    ],
    website: 'https://prettycoolmarketing.com',
    instagram: 'https://instagram.com/prettycoolmarketing',
    linkedin: 'https://linkedin.com/in/shakas',
    status: 'featured',
    featured: true,
    createdAt: '2024-01-15',
    expertiseIds: ['founder-storytelling', 'content-systems', 'ai-marketing'],
    resourceIds: ['culo-storytelling-guide', 'story-prompt-list', 'culo-content-os', 'canva-workflow-template', 'ai-prompt-library'],
    talkIds: ['culo-launch-talk', 'founder-story-talk'],
    timeline: [
      { id: 't1', date: '2020-03-01', title: 'Founded Pretty Cool Marketing', description: 'Started the agency to help founders build content systems that actually work.', type: 'business' },
      { id: 't2', date: '2023-06-01', title: 'Started building CULO', description: 'Began development of a content operating system inside Canva after seeing how many founders struggled with production.', type: 'milestone' },
      { id: 't3', date: '2024-01-15', title: 'Launched CULO Village', description: 'Opened the Village as the public knowledge graph for the CULO ecosystem.', type: 'product' },
      { id: 't4', date: '2024-05-12', title: 'Spoke at Canva Create Brisbane', description: 'Presented the CULO story and content OS methodology to 200+ founders.', type: 'talk' },
    ],
    seoTitle: 'Shakas — Founder, Pretty Cool Marketing & CULO',
    seoDescription: 'Helping founders turn real experiences into content that compounds over time.',
  },
  // ─── Realistic placeholders ────────────────────────────────────────────────
  {
    id: 'lucia-romano',
    slug: 'lucia-romano',
    name: 'Lucia Romano',
    bio: 'Brand photographer based in Brisbane. I help small businesses tell their story through images that actually look like them.',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80',
    coverImage: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=1200&q=80',
    location: brisbane,
    industry: photography,
    businessId: 'romano-visuals',
    topics: [
      topics[14], // Photography
      topics[1],  // Founder Storytelling
      topics[8],  // Authenticity
    ],
    website: 'https://romanovisuals.com.au',
    instagram: 'https://instagram.com/romanovisuals',
    status: 'published',
    featured: true,
    createdAt: '2024-02-10',
    expertiseIds: ['brand-photography', 'personal-brand'],
    resourceIds: ['brand-shoot-prep-guide'],
  },
  {
    id: 'james-okafor',
    slug: 'james-okafor',
    name: 'James Okafor',
    bio: 'Tech founder and content strategist from Sydney. I build systems that help businesses create consistent content without burning out.',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80',
    coverImage: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&q=80',
    location: sydney,
    industry: technology,
    businessId: 'okafor-studio',
    topics: [
      topics[2],  // Content Systems
      topics[9],  // Content Strategy
      topics[0],  // AI Marketing
    ],
    website: 'https://okaforstudio.com',
    linkedin: 'https://linkedin.com/in/jamesokafor',
    status: 'published',
    featured: false,
    createdAt: '2024-03-05',
    expertiseIds: ['content-systems', 'ai-marketing'],
    resourceIds: ['canva-workflow-template'],
  },
  {
    id: 'maya-chen',
    slug: 'maya-chen',
    name: 'Maya Chen',
    bio: 'Designer and brand strategist from Melbourne. I help founders build visual identities that hold up across every format.',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80',
    coverImage: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=1200&q=80',
    location: melbourne,
    industry: design,
    businessId: 'maya-chen-design',
    topics: [
      topics[6],  // Personal Brand
      topics[9],  // Content Strategy
      topics[8],  // Authenticity
    ],
    website: 'https://mayachendesign.com',
    instagram: 'https://instagram.com/mayachendesign',
    status: 'published',
    featured: true,
    createdAt: '2024-03-22',
    expertiseIds: ['brand-identity', 'personal-brand'],
    resourceIds: ['personal-brand-checklist', 'brand-identity-checklist'],
  },
  {
    id: 'tom-riley',
    slug: 'tom-riley',
    name: 'Tom Riley',
    bio: 'Fitness coach and video creator from the Gold Coast. I show other coaches how to turn client results into content that attracts new clients.',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80',
    coverImage: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1200&q=80',
    location: goldCoast,
    industry: fitness,
    businessId: 'riley-performance',
    topics: [
      topics[5],  // Short Form Video
      topics[3],  // Camera Roll Marketing
      topics[1],  // Founder Storytelling
    ],
    instagram: 'https://instagram.com/tomrileyperformance',
    status: 'published',
    featured: false,
    createdAt: '2024-04-01',
    expertiseIds: ['short-form-video', 'founder-storytelling'],
    resourceIds: ['reel-hook-guide'],
  },
  {
    id: 'anika-patel',
    slug: 'anika-patel',
    name: 'Anika Patel',
    bio: 'Email marketing specialist from Brisbane. I help product businesses build audiences that buy without needing social media.',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80',
    location: brisbane,
    industry: marketing,
    businessId: 'anika-patel-email',
    topics: [
      topics[11], // Email Marketing
      topics[12], // Lead Generation
      topics[9],  // Content Strategy
    ],
    website: 'https://anikapatel.com',
    linkedin: 'https://linkedin.com/in/anikapatel',
    status: 'published',
    featured: false,
    createdAt: '2024-04-18',
  },
]

export const getFounder = (id: string) => founders.find(f => f.id === id)
export const getFeaturedFounders = () => founders.filter(f => f.featured && f.status !== 'archived')
