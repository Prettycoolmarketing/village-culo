import type { Talk } from '../types'

export const talks: Talk[] = [
  {
    id: 'culo-launch-talk',
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
]

export const getTalk = (id: string) => talks.find(t => t.id === id)
export const getTalksForFounder = (founderId: string) => talks.filter(t => t.founderId === founderId)
export const getTalksForExpertise = (expertiseId: string) =>
  talks.filter(t => t.expertiseIds.includes(expertiseId))
