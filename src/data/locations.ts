import type { Location } from '../types'

// Comprehensive Australia-wide list — every state and territory capital plus
// the regional centres founders actually come from. If someone still can't
// find their city, Onboarding's Location field offers an "Other" option that
// captures a free-text location instead of forcing a nearest-match guess.
//
// Card images: six hand-illustrated Italian-hillside-village scenes (same
// warm palette and "CULO VILLAGE" branding throughout — see
// public/placeholders/village-location*.svg) cycled across the list so
// "Explore by Location" doesn't render the identical image 35 times in a
// row. Coastal/beach towns lean toward the cliffside (2) and lakeside (5)
// scenes; inland/regional toward vineyard (3), piazza (4) and hill-town (6).
export const locations: Location[] = [
  // Queensland
  { id: 'brisbane',       slug: 'brisbane',       name: 'Brisbane',       state: 'QLD', country: 'Australia', description: 'A warm, creative city full of founders building something worth finding.', image: '/placeholders/village-location.svg' },
  { id: 'gold-coast',     slug: 'gold-coast',     name: 'Gold Coast',     state: 'QLD', country: 'Australia', description: 'Sun, surf and a community of founders who know how to tell a story.', image: '/placeholders/village-location-2.svg' },
  { id: 'sunshine-coast',  slug: 'sunshine-coast',  name: 'Sunshine Coast',  state: 'QLD', country: 'Australia', description: 'Relaxed pace, sharp businesses. Founders who build life around their work.', image: '/placeholders/village-location-2.svg' },
  { id: 'cairns',          slug: 'cairns',          name: 'Cairns',          state: 'QLD', country: 'Australia', description: 'Gateway to the reef and the tropics. Founders with big, warm ambitions.', image: '/placeholders/village-location-5.svg' },
  { id: 'townsville',      slug: 'townsville',      name: 'Townsville',      state: 'QLD', country: 'Australia', description: 'North Queensland grit. Businesses built to last.', image: '/placeholders/village-location-6.svg' },
  { id: 'toowoomba',       slug: 'toowoomba',       name: 'Toowoomba',       state: 'QLD', country: 'Australia', description: 'Garden city, growing founder community.', image: '/placeholders/village-location-3.svg' },
  { id: 'ipswich',         slug: 'ipswich',         name: 'Ipswich',         state: 'QLD', country: 'Australia', description: 'One of Australia\'s fastest-growing regions, full of new businesses.', image: '/placeholders/village-location-4.svg' },
  { id: 'mackay',          slug: 'mackay',          name: 'Mackay',          state: 'QLD', country: 'Australia', description: 'Regional Queensland, resourceful founders.', image: '/placeholders/village-location-2.svg' },
  { id: 'rockhampton',     slug: 'rockhampton',     name: 'Rockhampton',     state: 'QLD', country: 'Australia', description: 'Central Queensland\'s hub. Founders serving a wide region.', image: '/placeholders/village-location-6.svg' },
  { id: 'noosa',           slug: 'noosa',           name: 'Noosa',           state: 'QLD', country: 'Australia', description: 'Boutique and considered. Founders who care about craft.', image: '/placeholders/village-location-5.svg' },

  // New South Wales
  { id: 'sydney',          slug: 'sydney',          name: 'Sydney',          state: 'NSW', country: 'Australia', description: 'The harbour city. Ambitious founders building at scale.', image: '/placeholders/village-location-2.svg' },
  { id: 'newcastle',       slug: 'newcastle',       name: 'Newcastle',       state: 'NSW', country: 'Australia', description: 'Steel city turned creative hub. Founders reinventing what came before.', image: '/placeholders/village-location-4.svg' },
  { id: 'wollongong',      slug: 'wollongong',      name: 'Wollongong',      state: 'NSW', country: 'Australia', description: 'Coastal and close-knit. A community that backs its own.', image: '/placeholders/village-location-2.svg' },
  { id: 'central-coast',   slug: 'central-coast',   name: 'Central Coast',   state: 'NSW', country: 'Australia', description: 'Between two cities, building its own identity.', image: '/placeholders/village-location-5.svg' },
  { id: 'byron-bay',       slug: 'byron-bay',       name: 'Byron Bay',       state: 'NSW', country: 'Australia', description: 'Small town, outsized influence. Founders known well beyond it.', image: '/placeholders/village-location-2.svg' },
  { id: 'tweed-heads',     slug: 'tweed-heads',     name: 'Tweed Heads',     state: 'NSW', country: 'Australia', description: 'Border town energy, founders serving two states.', image: '/placeholders/village-location-5.svg' },
  { id: 'coffs-harbour',   slug: 'coffs-harbour',   name: 'Coffs Harbour',   state: 'NSW', country: 'Australia', description: 'Mid-north coast, steady and community-minded businesses.', image: '/placeholders/village-location-2.svg' },
  { id: 'wagga-wagga',     slug: 'wagga-wagga',     name: 'Wagga Wagga',     state: 'NSW', country: 'Australia', description: 'Regional NSW\'s biggest inland city. Founders who know their market.', image: '/placeholders/village-location-3.svg' },
  { id: 'albury',          slug: 'albury',          name: 'Albury',          state: 'NSW', country: 'Australia', description: 'On the Murray, on the border, building regardless.', image: '/placeholders/village-location-5.svg' },

  // Victoria
  { id: 'melbourne',       slug: 'melbourne',       name: 'Melbourne',       state: 'VIC', country: 'Australia', description: 'Where culture and commerce meet. A city that rewards depth.', image: '/placeholders/village-location-4.svg' },
  { id: 'geelong',         slug: 'geelong',         name: 'Geelong',         state: 'VIC', country: 'Australia', description: 'Coastal and confident. Victoria\'s second city, coming into its own.', image: '/placeholders/village-location-2.svg' },
  { id: 'ballarat',        slug: 'ballarat',        name: 'Ballarat',        state: 'VIC', country: 'Australia', description: 'Goldfields history, modern founders.', image: '/placeholders/village-location-6.svg' },
  { id: 'bendigo',         slug: 'bendigo',         name: 'Bendigo',         state: 'VIC', country: 'Australia', description: 'Regional Victoria at its most self-sufficient.', image: '/placeholders/village-location-3.svg' },
  { id: 'mornington-peninsula', slug: 'mornington-peninsula', name: 'Mornington Peninsula', state: 'VIC', country: 'Australia', description: 'Coastal lifestyle, considered businesses.', image: '/placeholders/village-location-5.svg' },

  // Western Australia
  { id: 'perth',           slug: 'perth',           name: 'Perth',           state: 'WA',  country: 'Australia', description: 'Remote but resourceful. Founders who build their own way.', image: '/placeholders/village-location.svg' },
  { id: 'fremantle',       slug: 'fremantle',       name: 'Fremantle',       state: 'WA',  country: 'Australia', description: 'Independent and proud of it. A port town full of makers.', image: '/placeholders/village-location-2.svg' },
  { id: 'bunbury',         slug: 'bunbury',         name: 'Bunbury',         state: 'WA',  country: 'Australia', description: 'The south west\'s hub, growing fast.', image: '/placeholders/village-location-5.svg' },

  // South Australia
  { id: 'adelaide',        slug: 'adelaide',        name: 'Adelaide',        state: 'SA',  country: 'Australia', description: 'A city that punches above its weight. Quiet achievers with loud stories.', image: '/placeholders/village-location-4.svg' },
  { id: 'mount-gambier',   slug: 'mount-gambier',   name: 'Mount Gambier',   state: 'SA',  country: 'Australia', description: 'South Australia\'s regional heart.', image: '/placeholders/village-location-3.svg' },

  // Tasmania
  { id: 'hobart',          slug: 'hobart',          name: 'Hobart',          state: 'TAS', country: 'Australia', description: 'Small, sharp and increasingly hard to ignore.', image: '/placeholders/village-location-6.svg' },
  { id: 'launceston',      slug: 'launceston',      name: 'Launceston',      state: 'TAS', country: 'Australia', description: 'Northern Tasmania\'s own thing entirely.', image: '/placeholders/village-location-3.svg' },

  // Australian Capital Territory
  { id: 'canberra',        slug: 'canberra',        name: 'Canberra',        state: 'ACT', country: 'Australia', description: 'More founders than the postcode suggests.', image: '/placeholders/village-location-4.svg' },

  // Northern Territory
  { id: 'darwin',          slug: 'darwin',          name: 'Darwin',          state: 'NT',  country: 'Australia', description: 'Tropical, resilient, unmistakably its own place.', image: '/placeholders/village-location-2.svg' },
  { id: 'alice-springs',   slug: 'alice-springs',   name: 'Alice Springs',   state: 'NT',  country: 'Australia', description: 'The centre of the country, home to founders who build against the odds.', image: '/placeholders/village-location-6.svg' },

  // Catch-all — kept last so it never crowds out a real city in the dropdown.
  { id: 'regional-remote', slug: 'regional-remote', name: 'Regional or Remote Australia', state: '', country: 'Australia', description: 'Wherever the work happens.', image: '/placeholders/village-location.svg' },
]

export const getLocation = (id: string) => locations.find(l => l.id === id)
