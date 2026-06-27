import type { CaseStudy } from '../types'

export const caseStudies: CaseStudy[] = [
  {
    id: 'pcm-founder-content',
    slug: 'pcm-founder-content',
    title: 'How a Brisbane Founder Built a 6-Month Content Library in One Workshop',
    summary: 'A solo founder came to Pretty Cool Marketing with zero published content and no idea where to start. Eight weeks later, they had a full content system, a 6-month story bank and their first three pieces of content published.',
    challenge: 'The founder had been in business for two years but had never published a single piece of content. They knew they had stories worth telling but could not translate their experiences into something publishable without spending hours they did not have.',
    outcome: 'After one Story Extraction Workshop and two strategy sessions, the founder had a documented content system, 24 ready-to-publish story briefs, and a publishing rhythm they could sustain independently. Within 8 weeks of publishing, they had their first inbound lead from content.',
    result: 'First inbound lead from content within 8 weeks of first publish.',
    founderId: 'shakas',
    businessId: 'pretty-cool-marketing',
    topicIds: ['founder-storytelling', 'content-systems'],
    expertiseIds: ['founder-storytelling', 'content-systems'],
    relatedStoryIds: [],
    createdAt: '2024-07-01',
  },
  {
    id: 'okafor-content-system',
    slug: 'okafor-content-system',
    title: 'Replacing a Founder\'s Broken Content Calendar with a System That Actually Works',
    summary: 'A Sydney-based SaaS company was producing content but it was inconsistent, unmeasured and never converted. Okafor Studio audited and rebuilt their content operation from the ground up.',
    challenge: 'Three team members were producing content without coordination. No clear ownership, no templates, no measurement. The founder was manually reviewing everything before publish, creating a bottleneck that meant content only went out sporadically.',
    outcome: 'After a six-week engagement, the team had a documented content system with clear ownership, a shared template library and a weekly publishing cadence that required no founder review. Content output doubled in the first month.',
    result: 'Content output doubled in month one. Founder removed from review process entirely.',
    founderId: 'james-okafor',
    businessId: 'okafor-studio',
    topicIds: ['content-systems', 'content-strategy'],
    expertiseIds: ['content-systems'],
    relatedStoryIds: [],
    createdAt: '2024-08-15',
  },
]

export const getCaseStudy = (id: string) => caseStudies.find(c => c.id === id)
export const getCaseStudiesForBusiness = (businessId: string) =>
  caseStudies.filter(c => c.businessId === businessId)
export const getCaseStudiesForFounder = (founderId: string) =>
  caseStudies.filter(c => c.founderId === founderId)
export const getCaseStudiesForExpertise = (expertiseId: string) =>
  caseStudies.filter(c => c.expertiseIds.includes(expertiseId))
