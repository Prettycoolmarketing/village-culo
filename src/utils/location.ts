import type { Location } from '../types'

// The catch-all fallback for a region (used whenever a founder/business/story
// couldn't be matched to a real city) has an empty `state` — rendering
// `${name}, ${state}` for it produces "Australia, " with a dangling comma.
// Real cities still get the normal "City, State" treatment.
export function formatLocationLabel(location: Location): string {
  return location.state ? `${location.name}, ${location.state}` : location.name
}

// The fuller form, with country — for the founder hero, JSON-LD and map
// widget, which used to hardcode a literal ", Australia" onto every
// location regardless of where it actually was (making a UK/US/Asia
// founder's profile misreport its own country, and doubling up into
// "Australia, , Australia" for the unmatched-Australia catch-all, whose
// name is already just "Australia"). A city already names its own country
// (e.g. "New York, NY, United States"); the region-level catch-alls
// (Australia, United States, United Kingdom, Asia...) ARE the country name
// already, so it's never repeated.
export function formatLocationFull(location: Location): string {
  if (!location.state) return formatLocationLabel(location)
  return `${formatLocationLabel(location)}, ${location.country}`
}
