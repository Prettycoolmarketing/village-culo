import type { Business } from '../types'
import { locations } from './locations'
import { industries } from './industries'
import { topics } from './topics'

const brisbane  = locations[0]
const goldCoast = locations[1]
const sydney    = locations[2]
const melbourne = locations[3]

const marketing   = industries[0]
const photography = industries[1]
const technology  = industries[3]
const hospitality = industries[4]
const education   = industries[7]
const retail      = industries[8]

export const businesses: Business[] = [

  // ─── Real: Pretty Cool Marketing ───────────────────────────────────────────
  {
    id: 'pretty-cool-marketing',
    slug: 'pretty-cool-marketing',
    name: 'Pretty Cool Marketing',
    tagline: 'Your brand deserves to be seen everywhere.',
    description: 'Pretty Cool Marketing is a content systems and digital marketing operations company based in Brisbane. We transform raw footage and founder stories into automated, multi-platform visibility — and build the systems that keep it running. Being bad at posting isn\'t your problem. Not having a system is. Home of CULO.',
    logo: '/placeholders/village-logo.svg',
    coverImage: '/placeholders/village-cover.svg',
    founderId: 'shakas',
    category: 'business',
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
    status: 'archived',
    featured: true,
    createdAt: '2021-01-01',
    expertiseIds: ['founder-storytelling', 'content-systems', 'ai-marketing'],
    serviceIds: ['content-strategy-session', 'story-extraction', 'content-creating-days'],
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
    logo: '/assets/culo-app-in-canva.jpg',
    coverImage: '/assets/culo-brand-cover.png',
    founderId: 'shakas',
    category: 'platform',
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
    status: 'archived',
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
    description: 'Billow Beach is a 3-in-1 beach bag designed for people who want everything in one place and nothing in the way. The bag integrates a built-in XL towel and pillow so you carry one thing, unpack nothing, and spend more time in the water. Designed in Australia. A literal 10-year dream that Shakas made real. Photographed by Claudia Martinez, featuring Murrakee.',
    logo: '/assets/billow-beach-logo.jpg',
    coverImage: '/assets/billow-beach-lifestyle.jpg',
    founderId: 'shakas',
    category: 'business',
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
        description: '3-in-1 design: bag, XL towel and pillow in one. Designed for the beach and built to last.',
        ctaLabel: 'Find Out More',
        ctaUrl: 'https://prettycoolmarketing.com',
      },
    ],
    status: 'archived',
    featured: false,
    createdAt: '2022-09-01',
    expertiseIds: ['personal-brand'],
    seoTitle: 'Billow Beach — 3-in-1 Beach Bag | Designed in Australia',
    seoDescription: 'One bag. Built for the beach. The Billow Beach bag integrates an XL towel and pillow so you carry one thing and unpack nothing.',
  },

  // ─── Real: Where's Robyn ───────────────────────────────────────────────────
  {
    id: 'wheres-robyn',
    slug: 'wheres-robyn',
    name: "Where's Robyn",
    tagline: 'A psychological drama. In development.',
    description: "Where's Robyn is a multimedia psychological drama project by Shakas — currently in development as a novel, TV pilot script, and Screen Australia submission. A creative project about identity, disappearance, and what gets left behind. The storytelling instinct behind a marketing system turned out to have a lot more to say.",
    logo: '/placeholders/village-logo.svg',
    coverImage: '/placeholders/village-cover.svg',
    founderId: 'shakas',
    category: 'business',
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
        title: "Where's Robyn — In Development",
        description: 'A psychological drama in development as a novel and TV pilot script. Screen Australia submission in progress.',
        ctaLabel: 'Follow for Updates',
        ctaUrl: 'https://instagram.com/shakasdesigner',
      },
    ],
    status: 'archived',
    featured: false,
    createdAt: '2024-01-01',
    expertiseIds: ['founder-storytelling'],
    seoTitle: "Where's Robyn — Psychological Drama Novel & TV Pilot by Shakas",
    seoDescription: "Where's Robyn is a multimedia psychological drama in development by Shakas — novel, TV pilot, and Screen Australia submission.",
  },

  // ─── Real: Stagger Inn Adventures ──────────────────────────────────────────
  {
    id: 'stagger-inn-adventures',
    slug: 'stagger-inn-adventures',
    name: 'Stagger Inn Adventures',
    tagline: 'Outback tours. Stories from the land.',
    description: 'Stagger Inn Adventures was an outback tour company co-founded by Shakas and Mitch. We led tours through regional Australia, capturing stories from some of the most remote and remarkable landscapes in the country. The company shaped how Shakas thinks about documenting and sharing lived experience — and became the foundation for the storytelling methodology behind Pretty Cool Marketing.',
    logo: '/placeholders/village-logo.svg',
    coverImage: '/assets/shakas-on-the-road.jpg',
    founderId: 'shakas',
    category: 'business',
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

  // ─── Real: Canva ───────────────────────────────────────────────────────────
  {
    id: 'canva',
    slug: 'canva',
    name: 'Canva',
    tagline: 'Design anything. Publish everywhere.',
    description: 'Canva is the world\'s leading visual communications platform — home to the Canva App Marketplace where CULO lives. Millions of founders, marketers and creators use Canva every day to design content, build brands and publish across social platforms. CULO is built directly inside Canva, meaning no new software to learn — just a smarter way to create content from the tools you already use.',
    logo: '/placeholders/village-logo.svg',
    coverImage: '/placeholders/village-cover.svg',
    founderId: 'shakas',
    category: 'platform',
    location: sydney,
    industry: technology,
    topics: [
      topics[4], // Canva Workflows
      topics[2], // Content Systems
      topics[9], // Content Strategy
      topics[10], // Social Media
    ],
    website: 'https://canva.com',
    offers: [
      {
        id: 'canva-app-marketplace',
        title: 'Canva App Marketplace',
        description: 'Find CULO and hundreds of other apps that extend what you can do inside Canva.',
        ctaLabel: 'Explore Apps',
        ctaUrl: 'https://canva.com',
      },
    ],
    status: 'archived',
    featured: false,
    createdAt: '2013-01-01',
    expertiseIds: ['canva-workflows', 'content-systems'],
    seoTitle: 'Canva — Visual Communication Platform | CULO App Marketplace',
    seoDescription: 'The world\'s leading design platform. Home of the Canva App Marketplace where CULO lives. Design, create and publish from one place.',
  },

  // ─── Real: Systeme.io ──────────────────────────────────────────────────────
  {
    id: 'systeme-io',
    slug: 'systeme-io',
    name: 'Systeme.io',
    tagline: 'The all-in-one marketing platform for online businesses.',
    description: 'Systeme.io is the marketing platform behind CULO Village — powering email automation, funnels and digital product delivery. An all-in-one platform that replaces Mailchimp, ClickFunnels, Teachable and a dozen other tools. Used by PCM to run automations, lead generation and the CULO waitlist ecosystem. Trusted by hundreds of thousands of founders and creators worldwide.',
    logo: '/placeholders/village-logo.svg',
    coverImage: '/placeholders/village-cover.svg',
    founderId: 'shakas',
    category: 'platform',
    location: sydney,
    industry: technology,
    topics: [
      topics[11], // Email Marketing
      topics[12], // Lead Generation
      topics[2],  // Content Systems
      topics[0],  // AI Marketing
    ],
    website: 'https://systeme.io',
    offers: [
      {
        id: 'systeme-free-plan',
        title: 'Free Forever Plan',
        description: 'Up to 2,000 contacts, unlimited emails, sales funnels, and automation — free forever.',
        ctaLabel: 'Start for Free',
        ctaUrl: 'https://systeme.io',
      },
    ],
    status: 'archived',
    featured: false,
    createdAt: '2018-01-01',
    expertiseIds: ['content-systems', 'lead-generation'],
    seoTitle: 'Systeme.io — All-in-One Marketing Platform | Used by PCM & CULO',
    seoDescription: 'The all-in-one marketing platform powering CULO Village automations. Email, funnels, digital products and lead gen — one platform, free to start.',
  },

  // ─── Real: We The Stars ────────────────────────────────────────────────────
  {
    id: 'we-the-stars',
    slug: 'we-the-stars',
    name: 'We The Stars',
    tagline: 'Fashion built from a vision of colour and creative freedom.',
    description: 'We The Stars is a Brisbane lifestyle and fashion brand founded by Simone Pansino. Built from a vision of creativity, colour and authentic self-expression, Simone left a restrictive legal career to build something that matched her imagination. "My dream was created from my vision of expressing my creativity, colours, a love of styling and playing dress ups." A Billow Beach collaboration partner and a brand that shows what happens when you stop building for others and start building for yourself.',
    logo: '/placeholders/village-logo.svg',
    coverImage: '/placeholders/village-cover.svg',
    founderId: 'simone-pansino',
    category: 'business',
    location: brisbane,
    industry: retail,
    topics: [
      topics[13], // Entrepreneurship
      topics[8],  // Authenticity
      topics[6],  // Personal Brand
    ],
    website: 'https://wethestars.com.au',
    offers: [
      {
        id: 'we-the-stars-collection',
        title: 'We The Stars Collection',
        description: 'Lifestyle and fashion pieces built from a creative vision. Shop the current collection.',
        ctaLabel: 'Explore Collection',
        ctaUrl: 'https://wethestars.com.au',
      },
    ],
    status: 'archived',
    featured: false,
    createdAt: '2023-01-01',
    expertiseIds: ['personal-brand', 'founder-storytelling'],
    seoTitle: 'We The Stars — Brisbane Fashion & Lifestyle Brand | Simone Pansino',
    seoDescription: 'Fashion built from creative vision. Simone Pansino left a legal career to build We The Stars — a Brisbane lifestyle brand rooted in colour and self-expression.',
  },

  // ─── Real: Claudia Martinez Photography ────────────────────────────────────
  {
    id: 'claudia-martinez-photography',
    slug: 'claudia-martinez-photography',
    name: 'Claudia Martinez Photography',
    tagline: 'Luxury lifestyle photography that transforms products into experiences.',
    description: 'Claudia Martinez is a luxury lifestyle and interiors photographer based in Brunswick, Melbourne. RMIT trained with 13+ years of experience, Claudia specialises in editorial photography that elevates products into aspirational experiences. Her collaboration with Billow Beach brought the brand to life visually — positioning it as a little luxury, not just a beach bag. "Building a business doesn\'t happen in isolation. It\'s about finding the right people — those who elevate, interpret, and amplify your vision."',
    logo: '/placeholders/village-logo.svg',
    coverImage: '/placeholders/village-cover.svg',
    founderId: 'claudia-martinez',
    category: 'business',
    location: melbourne,
    industry: photography,
    topics: [
      topics[14], // Photography
      topics[8],  // Authenticity
      topics[6],  // Personal Brand
    ],
    website: 'https://claudiamartinez.com.au',
    offers: [
      {
        id: 'lifestyle-shoot',
        title: 'Lifestyle & Product Photography',
        description: 'Editorial lifestyle photography that makes your product feel like an experience. Melbourne-based, travel on request.',
        ctaLabel: 'Enquire Now',
        ctaUrl: 'https://claudiamartinez.com.au',
      },
    ],
    status: 'archived',
    featured: false,
    createdAt: '2011-01-01',
    expertiseIds: ['brand-photography', 'personal-brand'],
    seoTitle: 'Claudia Martinez Photography — Luxury Lifestyle & Interiors | Brunswick Melbourne',
    seoDescription: 'RMIT trained luxury lifestyle and interiors photographer. 13+ years experience. Brunswick, Melbourne. Billow Beach campaign photographer.',
  },

  // ─── Real: Content360 ──────────────────────────────────────────────────────
  {
    id: 'content360',
    slug: 'content360',
    name: 'Content360',
    tagline: 'The content conference for marketers and founders.',
    description: 'Content360 is a content marketing conference bringing together founders, marketers and creators to share strategies, tools and systems that move the needle. A key event in the CULO ecosystem calendar — where content strategy meets real-world execution. If you\'re serious about content as a growth engine, Content360 is where the conversations happen.',
    logo: '/placeholders/village-logo.svg',
    coverImage: '/placeholders/village-event.svg',
    founderId: 'shakas',
    category: 'event',
    location: sydney,
    industry: marketing,
    topics: [
      topics[9],  // Content Strategy
      topics[2],  // Content Systems
      topics[1],  // Founder Storytelling
      topics[0],  // AI Marketing
    ],
    website: 'https://content360.com.au',
    offers: [
      {
        id: 'content360-tickets',
        title: 'Conference Tickets',
        description: 'Join founders, marketers and creators for a full day of content strategy and execution.',
        ctaLabel: 'Get Tickets',
        ctaUrl: 'https://content360.com.au',
      },
    ],
    status: 'archived',
    featured: false,
    createdAt: '2022-01-01',
    expertiseIds: ['content-systems', 'content-strategy'],
    seoTitle: 'Content360 — Content Marketing Conference | CULO Ecosystem',
    seoDescription: 'The content conference for founders and marketers. Strategies, tools and systems for growing through content.',
  },

  // ─── Real: Techchella ──────────────────────────────────────────────────────
  {
    id: 'techchella',
    slug: 'techchella',
    name: 'Techchella',
    tagline: 'Where tech, startup culture and community collide.',
    description: 'Techchella is a tech and startup festival that brings together founders, investors and innovators for a high-energy event built around community, ideas and the future of technology. A speaking platform for CULO and PCM — where founder storytelling meets the startup world. Shakas has spoken at Techchella on AI-powered content systems and the future of marketing for founders.',
    logo: '/placeholders/village-logo.svg',
    coverImage: '/placeholders/village-event.svg',
    founderId: 'shakas',
    category: 'event',
    location: brisbane,
    industry: technology,
    topics: [
      topics[13], // Entrepreneurship
      topics[0],  // AI Marketing
      topics[1],  // Founder Storytelling
      topics[2],  // Content Systems
    ],
    website: 'https://techchella.com.au',
    offers: [
      {
        id: 'techchella-event',
        title: 'Techchella Event',
        description: 'A startup and tech festival for founders, investors and innovators. Brisbane.',
        ctaLabel: 'Find Out More',
        ctaUrl: 'https://techchella.com.au',
      },
    ],
    status: 'archived',
    featured: false,
    createdAt: '2020-01-01',
    expertiseIds: ['founder-storytelling', 'ai-marketing'],
    seoTitle: 'Techchella — Tech & Startup Festival | Brisbane',
    seoDescription: 'Where tech, startup culture and community collide. Shakas has spoken at Techchella on AI-powered content systems for founders.',
  },

  // ─── Real: Startup World Cup ───────────────────────────────────────────────
  {
    id: 'startup-world-cup',
    slug: 'startup-world-cup',
    name: 'Startup World Cup',
    tagline: 'The global startup competition.',
    description: 'Startup World Cup is a global startup competition and summit that brings together the world\'s best startups, investors and entrepreneurs. The Australian leg gives local founders a platform to pitch, connect and compete on a global stage. A key milestone in the CULO journey — speaking at Startup World Cup put CULO in front of an international audience of investors and founders.',
    logo: '/placeholders/village-logo.svg',
    coverImage: '/placeholders/village-event.svg',
    founderId: 'shakas',
    category: 'event',
    location: sydney,
    industry: technology,
    topics: [
      topics[13], // Entrepreneurship
      topics[0],  // AI Marketing
      topics[1],  // Founder Storytelling
    ],
    website: 'https://startupworldcup.io',
    offers: [
      {
        id: 'swc-competition',
        title: 'Startup World Cup Competition',
        description: 'The global stage for startups. Pitch to international investors and connect with the world\'s best founders.',
        ctaLabel: 'Find Out More',
        ctaUrl: 'https://startupworldcup.io',
      },
    ],
    status: 'archived',
    featured: false,
    createdAt: '2015-01-01',
    expertiseIds: ['founder-storytelling', 'ai-marketing'],
    seoTitle: 'Startup World Cup — Global Startup Competition | CULO Speaking',
    seoDescription: 'The global startup competition. Shakas spoke at Startup World Cup representing CULO — an AI-powered content app built inside Canva.',
  },

  // ─── Real: A11y Bytes ──────────────────────────────────────────────────────
  {
    id: 'a11y-bytes',
    slug: 'a11y-bytes',
    name: 'A11y Bytes',
    tagline: 'Accessibility education for developers and designers.',
    description: 'A11y Bytes is an accessibility-focused community and event series dedicated to making the digital world more inclusive. Conversations about web accessibility, inclusive design and the tools that make digital experiences work for everyone. A speaking platform in the CULO ecosystem — connecting the content creation world with the accessibility community.',
    logo: '/placeholders/village-logo.svg',
    coverImage: '/placeholders/village-cover.svg',
    founderId: 'shakas',
    category: 'community',
    location: brisbane,
    industry: technology,
    topics: [
      topics[13], // Entrepreneurship
      topics[9],  // Content Strategy
      topics[1],  // Founder Storytelling
    ],
    website: 'https://a11ybytes.org',
    offers: [
      {
        id: 'a11y-bytes-events',
        title: 'A11y Bytes Events',
        description: 'Accessibility education and community events for developers and designers.',
        ctaLabel: 'Get Involved',
        ctaUrl: 'https://a11ybytes.org',
      },
    ],
    status: 'archived',
    featured: false,
    createdAt: '2019-01-01',
    expertiseIds: ['content-systems'],
    seoTitle: 'A11y Bytes — Accessibility Community & Events | Brisbane',
    seoDescription: 'Accessibility education and community for developers and designers. Part of the broader CULO ecosystem speaking circuit.',
  },

  // ─── Real: The Marketing Club ──────────────────────────────────────────────
  {
    id: 'the-marketing-club',
    slug: 'the-marketing-club',
    name: 'The Marketing Club',
    tagline: 'Where marketers and founders share what actually works.',
    description: 'The Marketing Club is a professional community for marketers and founders who want to go deeper on strategy, systems and what\'s actually working right now. A peer community where people share real experiences, not polished content. PCM and CULO are active members — because the best ideas come from conversations, not conferences.',
    logo: '/placeholders/village-logo.svg',
    coverImage: '/placeholders/village-cover.svg',
    founderId: 'shakas',
    category: 'community',
    location: brisbane,
    industry: marketing,
    topics: [
      topics[9],  // Content Strategy
      topics[0],  // AI Marketing
      topics[13], // Entrepreneurship
      topics[2],  // Content Systems
    ],
    offers: [
      {
        id: 'marketing-club-membership',
        title: 'Community Membership',
        description: 'Join marketers and founders sharing strategies, tools and what\'s actually working.',
        ctaLabel: 'Join the Club',
        ctaUrl: 'https://prettycoolmarketing.com',
      },
    ],
    status: 'archived',
    featured: false,
    createdAt: '2022-01-01',
    expertiseIds: ['content-systems', 'ai-marketing'],
    seoTitle: 'The Marketing Club — Community for Marketers & Founders',
    seoDescription: 'A professional community for marketers and founders sharing what actually works. PCM and CULO are active members.',
  },

  // ─── Real: Agency Owners Community ────────────────────────────────────────
  {
    id: 'agency-owners-community',
    slug: 'agency-owners-community',
    name: 'Agency Owners Community',
    tagline: 'The inner circle for agency owners building sustainable businesses.',
    description: 'A professional community for agency owners navigating the realities of running a creative or marketing business — pricing, clients, systems and scale. Not a coaching program. Not a course. A real peer group for people who run real agencies. PCM participates as both a member and contributor, sharing the systems and frameworks behind CULO and digital marketing operations.',
    logo: '/placeholders/village-logo.svg',
    coverImage: '/placeholders/village-cover.svg',
    founderId: 'shakas',
    category: 'community',
    location: goldCoast,
    industry: marketing,
    topics: [
      topics[13], // Entrepreneurship
      topics[2],  // Content Systems
      topics[9],  // Content Strategy
      topics[12], // Lead Generation
    ],
    offers: [
      {
        id: 'aoc-membership',
        title: 'Community Membership',
        description: 'The peer group for agency owners building sustainable, scalable businesses.',
        ctaLabel: 'Find Out More',
        ctaUrl: 'https://prettycoolmarketing.com',
      },
    ],
    status: 'archived',
    featured: false,
    createdAt: '2021-01-01',
    expertiseIds: ['content-systems', 'founder-storytelling'],
    seoTitle: 'Agency Owners Community — Peer Group for Creative Agency Founders',
    seoDescription: 'A community for agency owners sharing real strategies for running sustainable creative businesses. PCM is an active member and contributor.',
  },
]

export const getBusiness        = (id: string)   => businesses.find(b => b.id   === id)
export const getBusinessBySlug  = (slug: string) => businesses.find(b => b.slug === slug)
export const getFeaturedBusinesses = () => businesses.filter(b => b.featured && b.status !== 'archived')
