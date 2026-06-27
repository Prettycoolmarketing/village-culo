import type { Talk } from '../types'

export const talks: Talk[] = [
  {
    id: 'culo-canva-talk',
    title: 'Building a Content OS Inside Canva: The CULO Story',
    event: 'Canva Create Brisbane',
    date: '2024-05-12',
    location: 'Brisbane, QLD',
    description: 'How Pretty Cool Marketing built a full content operating system inside a design tool — and what it taught us about where content tools are heading for small business founders.',
    founderId: 'shakas',
    topicIds: ['canva-workflows', 'content-systems', 'ai-marketing'],
    expertiseIds: ['content-systems', 'ai-marketing'],
  },
  {
    id: 'founder-story-talk',
    title: 'The 5 Stories Every Founder Should Have Published',
    event: 'Brisbane Founders Meetup',
    date: '2024-08-22',
    location: 'Brisbane, QLD',
    description: 'A talk on the five story archetypes that every founder has access to — and why most never publish them. Includes the framework used inside CULO to extract publishable stories from everyday business experiences.',
    founderId: 'shakas',
    topicIds: ['founder-storytelling', 'content-strategy'],
    expertiseIds: ['founder-storytelling'],
  },
  {
    id: 'techchella-talk',
    title: 'AI-Powered Content Systems for Founders — Without the Jargon',
    event: 'Techchella',
    date: '2024-10-18',
    location: 'Brisbane, QLD',
    description: 'A practical talk for founders on using AI to produce more content without producing generic content. The CULO approach: footage first, AI second. Real stories, structured by machine. Delivered at Techchella — Brisbane\'s tech and startup festival.',
    founderId: 'shakas',
    topicIds: ['ai-marketing', 'content-systems', 'founder-storytelling'],
    expertiseIds: ['ai-marketing', 'content-systems'],
  },
  {
    id: 'startup-world-cup-talk',
    title: 'CULO: A Content App for Every Founder, Built Inside the Tool They Already Use',
    event: 'Startup World Cup — Australia',
    date: '2025-03-07',
    location: 'Sydney, NSW',
    description: 'Presenting CULO to investors and founders at the Australian leg of the Startup World Cup. A five-minute pitch on why content creation for founders is broken, what CULO does differently, and why Canva was the only platform that made sense.',
    founderId: 'shakas',
    topicIds: ['entrepreneurship', 'ai-marketing', 'canva-workflows'],
    expertiseIds: ['ai-marketing', 'content-systems'],
  },
  {
    id: 'content-day-brisbane',
    title: 'Camera Roll to Content Engine — Live Workshop',
    event: 'Content Creating Days Brisbane',
    date: '2025-04-12',
    location: 'Brisbane, QLD',
    description: 'A full-day live content creation event. Founders bring their phone and their stories and leave with two weeks of published content. The first Content Creating Day — Brisbane cohort. Part workshop, part content sprint, part community.',
    founderId: 'shakas',
    topicIds: ['camera-roll-marketing', 'content-systems', 'canva-workflows'],
    expertiseIds: ['content-systems', 'founder-storytelling'],
  },
  {
    id: 'a11y-bytes-talk',
    title: 'Accessible Storytelling: Making Content That Works for Everyone',
    event: 'A11y Bytes',
    date: '2025-05-20',
    location: 'Brisbane, QLD',
    description: 'A talk on accessibility in digital content — captions, alt text, content structure, and why CULO bakes these in by default. Presented to the A11y Bytes community: developers and designers working on inclusive digital experiences.',
    founderId: 'shakas',
    topicIds: ['content-systems', 'content-strategy', 'short-form-video'],
    expertiseIds: ['content-systems'],
  },
]

export const getTalk = (id: string) => talks.find(t => t.id === id)
export const getTalksForFounder = (founderId: string) => talks.filter(t => t.founderId === founderId)
export const getTalksForExpertise = (expertiseId: string) =>
  talks.filter(t => t.expertiseIds.includes(expertiseId))
