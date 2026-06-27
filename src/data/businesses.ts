import type { Business } from '../types'
import { locations } from './locations'
import { industries } from './industries'
import { topics } from './topics'

const brisbane = locations[0]
const goldCoast = locations[1]
const sydney = locations[2]
const melbourne = locations[3]

const marketing    = industries[0]
const photography  = industries[1]
const design       = industries[2]
const technology   = industries[3]
const hospitality  = industries[4]
const fitness      = industries[5]
const education    = industries[7]
const retail       = industries[8]

export const businesses: Business[] = [
  // ─── Real: Pretty Cool Marketing ───────────────────────────────────────────
  {
    id: 'pretty-cool-marketing',
    slug: 'pretty-cool-marketing',
    name: 'Pretty Cool Marketing',
    tagline: 'Your brand deserves to be seen everywhere.',
    description: 'Pretty Cool Marketing is a content systems and digital marketing operations company based in Brisbane. We transform raw footage and founder stories into automated, multi-platform visibility — and build the systems that keep it running. Being bad at posting isn\'t your problem. Not having a system is. Home of CULO.',
    logo: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=200&q=80',
    coverImage: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80',
    founderId: 'shakas',
    location: brisbane,
    industry: marketing,
    topics: [
      topics[2], // Content Systems
      topics[1], // Founder Storytelling
      topics[3], // Camera Roll Marketing
      topics[0], // AI Marketing
    ],
    website: 'https://prettycoolmarketing.com',
    instagram: 'https://instagram.com/prettycoolmarketing_',
    offers: [
      {
        id: 'culo-app',
        title: 'CULO — Content App for Founders',
        description: 'Turn your stories and raw footage into reels, blogs and carousels. Built inside Canva.',
        ctaLabel: 'Try CULO in Canva',
        ctaUrl: 'https://prettycoolmarketing.com/culo',
      },
      {
        id: 'visibility-flow',
        title: 'Visibility Flow Management',
        description: 'Full content creation, editing and scheduling — we build the system and run it with you. Australia-wide. Limited monthly spots.',
        ctaLabel: 'Work With Us',
        ctaUrl: 'https://prettycoolmarketing.com',
      },
    ],
    status: 'featured',
    featured: true,
    createdAt: '2021-01-01',
    expertiseIds: ['founder-storytelling', 'content-systems', 'ai-marketing'],
    serviceIds: ['content-strategy-session', 'story-extraction'],
    caseStudyIds: ['pcm-founder-content'],
    resourceIds: ['culo-storytelling-guide', 'story-prompt-list', 'culo-content-os', 'canva-workflow-template', 'ai-prompt-library'],
    seoTitle: 'Pretty Cool Marketing — Content Systems for Founders',
    seoDescription: 'Your brand deserves to be seen everywhere. Content systems, digital marketing operations and CULO — built for founders in Australia.',
  },
  // ─── Real: CULO ────────────────────────────────────────────────────────────
  {
    id: 'culo',
    slug: 'culo',
    name: 'CULO',
    tagline: 'Stop working your CULO off just to be on social media.',
    description: 'CULO is a Canva-integrated content app that transforms your raw stories and footage into polished social media content. Answer a few questions about your business, upload your footage to the media library, and CULO produces 5+ ready-to-publish posts across multiple formats — talking head reels, voice-over reels, vlogs, carousels and blogs — complete with subtitles, hooks and captions. Business owners aren\'t short on ideas. They\'re short on time. CULO closes that gap.',
    logo: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=200&q=80',
    coverImage: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=1200&q=80',
    founderId: 'shakas',
    location: brisbane,
    industry: technology,
    topics: [
      topics[4], // Canva Workflows
      topics[2], // Content Systems
      topics[5], // Short Form Video
      topics[0], // AI Marketing
    ],
    website: 'https://prettycoolmarketing.com/culo',
    offers: [
      {
        id: 'culo-canva-app',
        title: 'CULO in Canva',
        description: 'Available now in the Canva App Marketplace. Personalised content generation from your real stories and footage.',
        ctaLabel: 'Get CULO in Canva',
        ctaUrl: 'https://prettycoolmarketing.com/culo',
      },
    ],
    status: 'featured',
    featured: true,
    createdAt: '2023-06-01',
    expertiseIds: ['content-systems', 'ai-marketing', 'short-form-video', 'canva-workflows'],
    seoTitle: 'CULO — Content App for Founders | Built Inside Canva',
    seoDescription: 'Stop working your CULO off just to be on social media. Turn raw footage and founder stories into reels, blogs and carousels — inside Canva.',
  },
  // ─── Real: Billow Beach ─────────────────────────────────────────────────────
  {
    id: 'billow-beach',
    slug: 'billow-beach',
    name: 'Billow Beach',
    tagline: 'One bag. Built for the beach.',
    description: 'Billow Beach is a 3-in-1 beach bag designed for people who want everything in one place and nothing in the way. The bag integrates a built-in towel and pillow so you carry one thing, unpack nothing, and spend more time in the water. Designed in Australia.',
    logo: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200&q=80',
    coverImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80',
    founderId: 'shakas',
    location: brisbane,
    industry: retail,
    topics: [
      topics[13], // Entrepreneurship
      topics[8],  // Authenticity
      topics[6],  // Personal Brand
    ],
    website: 'https://prettycoolmarketing.com',
    offers: [
      {
        id: 'billow-beach-bag',
        title: 'The Billow Beach Bag',
        description: '3-in-1 design: bag, towel and pillow in one. Designed for the beach and built to last.',
        ctaLabel: 'Find Out More',
        ctaUrl: 'https://prettycoolmarketing.com',
      },
    ],
    status: 'published',
    featured: false,
    createdAt: '2022-09-01',
    expertiseIds: ['personal-brand'],
    seoTitle: 'Billow Beach — 3-in-1 Beach Bag | Designed in Australia',
    seoDescription: 'One bag. Built for the beach. The Billow Beach bag integrates a towel and pillow so you carry one thing and unpack nothing.',
  },
  // ─── Real: Where's Robyn ───────────────────────────────────────────────────
  {
    id: 'wheres-robyn',
    slug: 'wheres-robyn',
    name: "Where's Robyn",
    tagline: 'A psychological drama. Coming soon.',
    description: "Where's Robyn is an upcoming psychological drama novel by Shakas. The story is currently being written. More details will be shared as the manuscript takes shape.",
    logo: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=200&q=80',
    coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1200&q=80',
    founderId: 'shakas',
    location: brisbane,
    industry: education,
    topics: [
      topics[13], // Entrepreneurship
      topics[1],  // Founder Storytelling
      topics[8],  // Authenticity
    ],
    website: 'https://prettycoolmarketing.com',
    offers: [
      {
        id: 'wheres-robyn-novel',
        title: "Where's Robyn — Novel",
        description: 'A psychological drama novel currently in development. Follow along for updates.',
        ctaLabel: 'Follow for Updates',
        ctaUrl: 'https://instagram.com/shakasdesigner',
      },
    ],
    status: 'published',
    featured: false,
    createdAt: '2024-01-01',
    expertiseIds: ['founder-storytelling'],
    seoTitle: "Where's Robyn — Upcoming Psychological Drama Novel by Shakas",
    seoDescription: 'An upcoming psychological drama novel by Shakas, founder of Pretty Cool Marketing and creator of CULO.',
  },
  // ─── Real: Stagger Inn Adventures ──────────────────────────────────────────
  {
    id: 'stagger-inn-adventures',
    slug: 'stagger-inn-adventures',
    name: 'Stagger Inn Adventures',
    tagline: 'Outback tours. Stories from the land.',
    description: 'Stagger Inn Adventures was an outback tour company co-founded by Shakas and Mitch. We led tours through regional Australia, capturing stories from some of the most remote and remarkable landscapes in the country. The company shaped how Shakas thinks about documenting and sharing lived experience — and became the foundation for the storytelling methodology behind Pretty Cool Marketing.',
    logo: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=200&q=80',
    coverImage: 'https://images.unsplash.com/photo-1509773896068-7fd415d91e2e?w=1200&q=80',
    founderId: 'shakas',
    location: brisbane,
    industry: hospitality,
    topics: [
      topics[1],  // Founder Storytelling
      topics[8],  // Authenticity
      topics[13], // Entrepreneurship
    ],
    instagram: 'https://instagram.com/staggerinnadventures',
    offers: [
      {
        id: 'stagger-inn-tours',
        title: 'Outback Tours',
        description: 'Small group tours through regional Australia. Now closed.',
        ctaLabel: 'See the Journey',
        ctaUrl: 'https://instagram.com/staggerinnadventures',
      },
    ],
    status: 'archived',
    featured: false,
    createdAt: '2018-06-01',
    expertiseIds: ['founder-storytelling'],
    seoTitle: 'Stagger Inn Adventures — Outback Tours by Shakas & Mitch',
    seoDescription: 'A former outback tour company co-founded by Shakas and Mitch. Led tours through regional Australia.',
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
    expertiseIds: ['brand-photography', 'personal-brand'],
    serviceIds: ['brand-shoot'],
    resourceIds: ['brand-shoot-prep-guide'],
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
    expertiseIds: ['content-systems', 'ai-marketing'],
    serviceIds: ['content-audit'],
    caseStudyIds: ['okafor-content-system'],
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
    expertiseIds: ['brand-identity', 'personal-brand'],
    serviceIds: ['brand-identity'],
    resourceIds: ['personal-brand-checklist', 'brand-identity-checklist'],
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
    expertiseIds: ['short-form-video', 'founder-storytelling'],
    serviceIds: ['coaching-program'],
    resourceIds: ['reel-hook-guide'],
  },
]

export const getBusiness        = (id: string)   => businesses.find(b => b.id   === id)
export const getBusinessBySlug  = (slug: string) => businesses.find(b => b.slug === slug)
export const getFeaturedBusinesses = () => businesses.filter(b => b.featured && b.status !== 'archived')
