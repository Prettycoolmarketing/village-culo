import type { Location } from '../types'

export const locations: Location[] = [
  {
    id: 'brisbane',
    slug: 'brisbane',
    name: 'Brisbane',
    state: 'QLD',
    country: 'Australia',
    description: 'A warm, creative city full of founders building something worth finding.',
    image: 'https://images.unsplash.com/photo-1566734904496-9309bb1798ae?w=800&q=80',
  },
  {
    id: 'gold-coast',
    slug: 'gold-coast',
    name: 'Gold Coast',
    state: 'QLD',
    country: 'Australia',
    description: 'Sun, surf and a community of founders who know how to tell a story.',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
  },
  {
    id: 'sydney',
    slug: 'sydney',
    name: 'Sydney',
    state: 'NSW',
    country: 'Australia',
    description: 'The harbour city. Ambitious founders building at scale.',
    image: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800&q=80',
  },
  {
    id: 'melbourne',
    slug: 'melbourne',
    name: 'Melbourne',
    state: 'VIC',
    country: 'Australia',
    description: 'Where culture and commerce meet. A city that rewards depth.',
    image: 'https://images.unsplash.com/photo-1545044846-351ba102b6d5?w=800&q=80',
  },
  {
    id: 'perth',
    slug: 'perth',
    name: 'Perth',
    state: 'WA',
    country: 'Australia',
    description: 'Remote but resourceful. Founders who build their own way.',
    image: 'https://images.unsplash.com/photo-1529180979161-06b8b6d6f2be?w=800&q=80',
  },
  {
    id: 'adelaide',
    slug: 'adelaide',
    name: 'Adelaide',
    state: 'SA',
    country: 'Australia',
    description: 'A city that punches above its weight. Quiet achievers with loud stories.',
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&q=80',
  },
]

export const getLocation = (id: string) => locations.find(l => l.id === id)
