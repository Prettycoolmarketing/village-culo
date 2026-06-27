import type { ImportSuggestion } from '../types'

// ─────────────────────────────────────────────────────────────────────────────
// Suggested text fields discovered from public sources.
// Every entry is pending founder review. None are published until approved.
// confidenceLevel reflects how well the discovered text maps to the target field.
// ─────────────────────────────────────────────────────────────────────────────

export const importSuggestions: ImportSuggestion[] = [

  // ─── Shakas — Bio ────────────────────────────────────────────────────────────

  {
    id: 'suggest-shakas-bio-linkedin',
    field: 'bio',
    suggestedValue: 'Founder of Pretty Cool Marketing. I help founders build content systems that work without burning out. 15+ years in video, photography and storytelling. Creator of CULO — a content app built inside Canva. Currently traveling Australia with my family and writing a psychological drama novel.',
    sourceUrl: 'https://linkedin.com/in/shakasdesigner',
    sourceType: 'linkedin',
    confidenceLevel: 'high',
    reviewStatus: 'needs-review',
    relatedFounderId: 'shakas',
    createdAt: '2024-01-15',
  },

  {
    id: 'suggest-shakas-bio-instagram',
    field: 'bio',
    suggestedValue: 'Content systems for founders who are done doing it manually. Creator of CULO. Pretty Cool Marketing. Billow Beach. Where\'s Robyn.',
    sourceUrl: 'https://instagram.com/shakasdesigner',
    sourceType: 'instagram',
    confidenceLevel: 'medium',
    reviewStatus: 'needs-review',
    relatedFounderId: 'shakas',
    createdAt: '2024-01-15',
  },

  // ─── Shakas — Expertise ───────────────────────────────────────────────────────

  {
    id: 'suggest-shakas-expertise-linkedin',
    field: 'expertiseAreas',
    suggestedValue: 'Content Systems, Canva Workflows, Founder Storytelling, Short-Form Video, AI-Assisted Marketing, Digital Marketing Strategy',
    sourceUrl: 'https://linkedin.com/in/shakasdesigner',
    sourceType: 'linkedin',
    confidenceLevel: 'high',
    reviewStatus: 'needs-review',
    relatedFounderId: 'shakas',
    createdAt: '2024-01-15',
  },

  // ─── Pretty Cool Marketing — Business Description ─────────────────────────────

  {
    id: 'suggest-pcm-description-website',
    field: 'businessDescription',
    suggestedValue: 'Pretty Cool Marketing is a content systems and digital marketing agency. We help founders turn their real experiences, raw footage and expertise into content systems that run across websites, social media, blogs, reels, carousels and distribution channels. Your brand deserves to be seen everywhere.',
    sourceUrl: 'https://prettycoolmarketing.com',
    sourceType: 'official-website',
    confidenceLevel: 'high',
    reviewStatus: 'needs-review',
    relatedFounderId: 'shakas',
    relatedBusinessId: 'pretty-cool-marketing',
    createdAt: '2024-01-15',
  },

  {
    id: 'suggest-pcm-tagline-website',
    field: 'tagline',
    suggestedValue: 'Being bad at posting isn\'t your problem — not having a system is.',
    sourceUrl: 'https://prettycoolmarketing.com',
    sourceType: 'official-website',
    confidenceLevel: 'high',
    reviewStatus: 'approved',
    approvedValue: 'Being bad at posting isn\'t your problem — not having a system is.',
    relatedFounderId: 'shakas',
    relatedBusinessId: 'pretty-cool-marketing',
    createdAt: '2024-01-15',
  },

  {
    id: 'suggest-pcm-services-website',
    field: 'serviceDescription',
    suggestedValue: 'Visibility Flow Management — we map your entire content system, identify your story bank, choose your formats and build a publishing rhythm that runs without you having to think about it every day.',
    sourceUrl: 'https://prettycoolmarketing.com',
    sourceType: 'official-website',
    confidenceLevel: 'high',
    reviewStatus: 'needs-review',
    relatedFounderId: 'shakas',
    relatedBusinessId: 'pretty-cool-marketing',
    createdAt: '2024-01-15',
  },

  {
    id: 'suggest-pcm-faq-website',
    field: 'faqAnswer',
    suggestedValue: 'We work with founders and small business owners who know they have a story worth telling but haven\'t had a system to tell it. Most of our clients have been posting inconsistently for years and are ready to stop guessing.',
    sourceUrl: 'https://prettycoolmarketing.com',
    sourceType: 'official-website',
    confidenceLevel: 'medium',
    reviewStatus: 'needs-review',
    relatedFounderId: 'shakas',
    relatedBusinessId: 'pretty-cool-marketing',
    createdAt: '2024-01-15',
  },

  // ─── CULO — Description ───────────────────────────────────────────────────────

  {
    id: 'suggest-culo-description-website',
    field: 'businessDescription',
    suggestedValue: 'CULO is a Canva-integrated content editing and publishing app. It transforms your raw footage, thoughts and lived experience into blogs, reels, carousels, captions and searchable knowledge — without leaving Canva. Stop working your CULO off just to be on social media.',
    sourceUrl: 'https://prettycoolmarketing.com/culo',
    sourceType: 'official-website',
    confidenceLevel: 'high',
    reviewStatus: 'needs-review',
    relatedFounderId: 'shakas',
    relatedBusinessId: 'culo',
    createdAt: '2024-01-15',
  },

  {
    id: 'suggest-culo-tagline-website',
    field: 'tagline',
    suggestedValue: 'Stop working your CULO off just to be on social media.',
    sourceUrl: 'https://prettycoolmarketing.com/culo',
    sourceType: 'official-website',
    confidenceLevel: 'high',
    reviewStatus: 'approved',
    approvedValue: 'Stop working your CULO off just to be on social media.',
    relatedFounderId: 'shakas',
    relatedBusinessId: 'culo',
    createdAt: '2024-01-15',
  },

  {
    id: 'suggest-culo-faq-canva',
    field: 'faqAnswer',
    suggestedValue: 'CULO lives inside Canva because founders are already using Canva. We didn\'t want to create another app that requires another login and another workflow. CULO plugs into the tool you\'re already in.',
    sourceUrl: 'https://prettycoolmarketing.com/culo',
    sourceType: 'official-website',
    confidenceLevel: 'medium',
    reviewStatus: 'needs-review',
    relatedFounderId: 'shakas',
    relatedBusinessId: 'culo',
    createdAt: '2024-01-15',
  },

  // ─── Billow Beach — Description ───────────────────────────────────────────────

  {
    id: 'suggest-billow-description-website',
    field: 'businessDescription',
    suggestedValue: 'Billow Beach is a 3-in-1 beach bag with an integrated pillow and towel. Designed in Australia for people who actually go to the beach. One product. Nothing left behind.',
    sourceUrl: 'https://billowbeach.com.au',
    sourceType: 'official-website',
    confidenceLevel: 'high',
    reviewStatus: 'needs-review',
    relatedFounderId: 'shakas',
    relatedBusinessId: 'billow-beach',
    createdAt: '2024-01-15',
  },

  {
    id: 'suggest-billow-tagline-website',
    field: 'tagline',
    suggestedValue: 'The beach bag designed for people who actually go to the beach.',
    sourceUrl: 'https://billowbeach.com.au',
    sourceType: 'official-website',
    confidenceLevel: 'high',
    reviewStatus: 'needs-review',
    relatedFounderId: 'shakas',
    relatedBusinessId: 'billow-beach',
    createdAt: '2024-01-15',
  },

  // ─── YouTube — Video Titles (Shakas Designer) ─────────────────────────────────

  {
    id: 'suggest-youtube-video-1',
    field: 'libraryItemTitle',
    suggestedValue: 'How I Turn My Camera Roll Into Content — The Full System',
    sourceUrl: 'https://youtube.com/@shakasdesigner',
    sourceType: 'youtube',
    confidenceLevel: 'high',
    reviewStatus: 'needs-review',
    relatedFounderId: 'shakas',
    relatedBusinessId: 'pretty-cool-marketing',
    createdAt: '2024-01-15',
  },

  {
    id: 'suggest-youtube-video-2',
    field: 'libraryItemTitle',
    suggestedValue: 'Why I Built CULO Inside Canva (Not As A Standalone App)',
    sourceUrl: 'https://youtube.com/@shakasdesigner',
    sourceType: 'youtube',
    confidenceLevel: 'high',
    reviewStatus: 'needs-review',
    relatedFounderId: 'shakas',
    relatedBusinessId: 'culo',
    createdAt: '2024-01-15',
  },

  {
    id: 'suggest-youtube-video-3',
    field: 'storyTitle',
    suggestedValue: 'What Running An Outback Tour Company Taught Me About Storytelling',
    sourceUrl: 'https://youtube.com/@shakasdesigner',
    sourceType: 'youtube',
    confidenceLevel: 'medium',
    reviewStatus: 'needs-review',
    relatedFounderId: 'shakas',
    relatedBusinessId: 'stagger-inn-adventures',
    createdAt: '2024-01-15',
  },

  // ─── Where's Robyn — Author Description ──────────────────────────────────────

  {
    id: 'suggest-wheres-robyn-description',
    field: 'libraryItemDescription',
    suggestedValue: "Where's Robyn is a psychological drama novel in progress. A woman named Robyn vanishes — not taken, not missing. Gone by choice. The story follows the people left behind and what her absence reveals about each of them. Written by Shakas while traveling Australia with a young family. Due 2026.",
    sourceUrl: 'https://instagram.com/shakasdesigner',
    sourceType: 'instagram',
    confidenceLevel: 'medium',
    reviewStatus: 'needs-review',
    relatedFounderId: 'shakas',
    relatedBusinessId: 'wheres-robyn',
    createdAt: '2024-01-15',
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const getSuggestion         = (id: string) => importSuggestions.find(s => s.id === id)
export const getSuggestionsForFounder  = (founderId: string) => importSuggestions.filter(s => s.relatedFounderId === founderId)
export const getSuggestionsForBusiness = (businessId: string) => importSuggestions.filter(s => s.relatedBusinessId === businessId)
export const getPendingSuggestions = () => importSuggestions.filter(s => s.reviewStatus === 'needs-review' || s.reviewStatus === 'pending')
export const getApprovedSuggestions = () => importSuggestions.filter(s => s.reviewStatus === 'approved')
