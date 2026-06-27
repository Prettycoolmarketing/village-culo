import type { Location } from '../types'

export const locations: Location[] = [
  {
    id: 'brisbane',
    slug: 'brisbane',
    name: 'Brisbane',
    state: 'QLD',
    country: 'Australia',
    description: 'A warm, creative city full of founders building something worth finding.',
    image: '/placeholders/village-location.svg',
  },
  {
    id: 'gold-coast',
    slug: 'gold-coast',
    name: 'Gold Coast',
    state: 'QLD',
    country: 'Australia',
    description: 'Sun, surf and a community of founders who know how to tell a story.',
    image: '/placeholders/village-location.svg',
  },
  {
    id: 'sydney',
    slug: 'sydney',
    name: 'Sydney',
    state: 'NSW',
    country: 'Australia',
    description: 'The harbour city. Ambitious founders building at scale.',
    image: '/placeholders/village-location.svg',
  },
  {
    id: 'melbourne',
    slug: 'melbourne',
    name: 'Melbourne',
    state: 'VIC',
    country: 'Australia',
    description: 'Where culture and commerce meet. A city that rewards depth.',
    image: '/placeholders/village-location.svg',
  },
  {
    id: 'perth',
    slug: 'perth',
    name: 'Perth',
    state: 'WA',
    country: 'Australia',
    description: 'Remote but resourceful. Founders who build their own way.',
    image: '/placeholders/village-location.svg',
  },
  {
    id: 'adelaide',
    slug: 'adelaide',
    name: 'Adelaide',
    state: 'SA',
    country: 'Australia',
    description: 'A city that punches above its weight. Quiet achievers with loud stories.',
    image: '/placeholders/village-location.svg',
  },
]

export const getLocation = (id: string) => locations.find(l => l.id === id)
