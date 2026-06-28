import type { Founder } from '../types'
import { locations } from './locations'
import { industries } from './industries'
import { topics } from './topics'

const brisbane  = locations[0]
const melbourne = locations[3]

const marketing    = industries[0]
const photography  = industries[1]
const retail       = industries[8]

export const founders: Founder[] = [

  // ─── Shakas ─────────────────────────────────────────────────────────────────
  {
    id: 'shakas',
    slug: 'shakas',
    name: 'Shakas',
    bio: 'Founder of Pretty Cool Marketing and creator of CULO — a content app built inside Canva that turns raw footage and founder stories into reels, blogs and carousels. I\'ve spent 15+ years behind cameras documenting people, places and stories across Australia. Before PCM I co-founded an outback tour company, designed a 3-in-1 beach bag, and I\'m currently writing a psychological drama novel while traveling Australia with my family. We turn your photos, stories and chaos into a content engine that builds visibility, trust and sales. Being bad at posting isn\'t your problem — not having a system is.',
    avatar: '/assets/shakas-on-the-road.jpg',
    coverImage: '/assets/culo-brand-cover.png',
    location: brisbane,
    industry: marketing,
    businessId: 'pretty-cool-marketing',
    topics: [
      topics[1],  // Founder Storytelling
      topics[2],  // Content Systems
      topics[3],  // Camera Roll Marketing
      topics[4],  // Canva Workflows
      topics[0],  // AI Marketing
    ],
    website: 'https://prettycoolmarketing.com',
    instagram: 'https://instagram.com/shakasdesigner',
    linkedin: 'https://linkedin.com/in/shakasdesigner',
    status: 'archived',
    featured: true,
    createdAt: '2024-01-15',
    expertiseIds: ['founder-storytelling', 'content-systems', 'ai-marketing', 'short-form-video'],
    talkIds: ['culo-canva-talk', 'founder-story-talk', 'content-day-brisbane', 'techchella-talk', 'startup-world-cup-talk'],
    timeline: [
      {
        id: 't0',
        date: '2009-01-01',
        title: '15 Years Behind a Camera Begins',
        description: 'Started in videography and photography — documenting people, places and stories. Shot weddings, commercial work, travel and real life across Australia.',
        type: 'milestone',
      },
      {
        id: 't1',
        date: '2018-06-01',
        title: 'Co-Founded Stagger Inn Adventures',
        description: 'Built an outback tour company with Mitch. Led tours through regional Australia, capturing stories from some of the most remote landscapes in the country.',
        type: 'business',
      },
      {
        id: 't2',
        date: '2021-01-01',
        title: 'Founded Pretty Cool Marketing',
        description: 'Shifted from documenting stories for others to building the systems that help founders tell their own. Your brand deserves to be seen everywhere.',
        type: 'business',
      },
      {
        id: 't3',
        date: '2022-09-01',
        title: 'Designed Billow Beach',
        description: 'A literal 10-year dream made real. Designed Billow Beach — a 3-in-1 beach bag with integrated XL towel and pillow, designed in Australia.',
        type: 'product',
      },
      {
        id: 't4',
        date: '2023-06-01',
        title: 'Started Building CULO',
        description: 'After 15 years of watching founders sit on footage they never used, started building a content app inside Canva. Stop working your CULO off just to be on social media.',
        type: 'product',
      },
      {
        id: 't5',
        date: '2024-01-01',
        title: "Started Writing Where's Robyn",
        description: 'Began a psychological drama novel. The storytelling instinct behind a marketing system turned out to have a lot more to say in fiction.',
        type: 'milestone',
      },
      {
        id: 't6',
        date: '2024-01-15',
        title: 'Launched CULO Village',
        description: 'Opened the Village as the permanent knowledge graph for the CULO ecosystem — where founder stories, ideas and expertise live forever.',
        type: 'product',
      },
    ],
    seoTitle: 'Shakas — Founder, Storyteller, Creator | Pretty Cool Marketing & CULO',
    seoDescription: 'Helping founders turn real experiences into content that compounds. Creator of CULO — the content app built inside Canva. Founder of Pretty Cool Marketing. Billow Beach designer. Author of Where\'s Robyn.',
  },

  // ─── Simone Pansino — We The Stars ──────────────────────────────────────────
  {
    id: 'simone-pansino',
    slug: 'simone-pansino',
    name: 'Simone Pansino',
    bio: 'Founder of We The Stars — a Brisbane lifestyle and fashion brand built from a vision of creativity, colour and authentic self-expression. Simone left a restrictive legal career to build something based entirely on her creative instincts. "My dream was created from my vision of expressing my creativity, colours, a love of styling and playing dress ups. Creating something based on my creative visions has been scary and has been a major learning curve." A collaborator with Billow Beach and an inspiring example of building a life that matches your imagination.',
    avatar: '',
    coverImage: '/placeholders/village-cover.svg',
    location: brisbane,
    industry: retail,
    businessId: 'we-the-stars',
    topics: [
      topics[13], // Entrepreneurship
      topics[8],  // Authenticity
      topics[6],  // Personal Brand
    ],
    status: 'archived',
    featured: false,
    createdAt: '2025-07-17',
    expertiseIds: ['personal-brand', 'founder-storytelling'],
    seoTitle: 'Simone Pansino — Founder of We The Stars | Brisbane Creative',
    seoDescription: 'Founder of We The Stars. From legal career to lifestyle brand. Brisbane creative building a business based on creative vision and authentic self-expression.',
  },

  // ─── Claudia Martinez — Photographer ────────────────────────────────────────
  {
    id: 'claudia-martinez',
    slug: 'claudia-martinez',
    name: 'Claudia Martinez',
    bio: 'Luxury lifestyle and interiors photographer based in Brunswick, Melbourne. 13+ years of experience. RMIT trained. Claudia specialises in editorial lifestyle photography that transforms products into aspirational experiences. Her collaboration with Billow Beach positioned the brand not just as a product — but as a little luxury. "Building a business doesn\'t happen in isolation. It\'s about finding the right people — those who elevate, interpret, and amplify your vision."',
    avatar: '',
    coverImage: '/placeholders/village-cover.svg',
    location: melbourne,
    industry: photography,
    businessId: 'claudia-martinez-photography',
    topics: [
      topics[8],  // Authenticity
      topics[6],  // Personal Brand
      topics[1],  // Founder Storytelling
    ],
    status: 'archived',
    featured: false,
    createdAt: '2025-07-17',
    expertiseIds: ['brand-photography', 'personal-brand'],
    seoTitle: 'Claudia Martinez — Luxury Lifestyle Photographer | Brunswick Melbourne',
    seoDescription: 'Luxury lifestyle and interiors photographer. RMIT trained. 13+ years experience. Brunswick, Melbourne. Editorial photography for brands that want to be more than a product.',
  },

  // ─── Murrakee — Model & Creator ─────────────────────────────────────────────
  {
    id: 'murrakee',
    slug: 'murrakee',
    name: 'Murrakee',
    bio: 'Indigenous model and creator based in Brisbane, working across Queensland\'s coastal regions including the Gold Coast. Murrakee brings strength, softness and real cultural power to fashion and lifestyle campaigns. A storyteller whose presence in mainstream lifestyle and beachwear challenges the status quo. Featured as a Billow Beach Rising Talent — one to watch across Brisbane, Gold Coast and beyond. "Representation matters. When young Indigenous women are seen in beachwear, lifestyle, and fashion campaigns — it challenges the status quo."',
    avatar: '',
    coverImage: '/assets/billow-beach-lifestyle.jpg',
    location: brisbane,
    industry: marketing,
    businessId: 'billow-beach',
    topics: [
      topics[8],  // Authenticity
      topics[6],  // Personal Brand
      topics[1],  // Founder Storytelling
    ],
    status: 'archived',
    featured: false,
    createdAt: '2025-07-17',
    expertiseIds: ['personal-brand'],
    seoTitle: 'Murrakee — Indigenous Model & Creator | Brisbane Queensland',
    seoDescription: 'Indigenous model and creator based in Brisbane. Works across Queensland coastal regions. Billow Beach Rising Talent. Authentic representation in lifestyle and fashion.',
  },
]

export const getFounder         = (id: string)   => founders.find(f => f.id   === id)
export const getFounderBySlug   = (slug: string) => founders.find(f => f.slug === slug)
export const getFeaturedFounders = () => founders.filter(f => f.featured && f.status !== 'archived')
