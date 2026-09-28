import type { Location } from '../types'

// The catch-all "Australia" fallback (used whenever a founder/business/story
// couldn't be matched to a real city) has an empty `state` — rendering
// `${name}, ${state}` for it produces "Australia, " with a dangling comma,
// and FounderProfilePage's hero additionally appended a literal ", Australia"
// on top of that, making it "Australia, , Australia". Real cities still get
// the normal "City, State" treatment.
export function formatLocationLabel(location: Location): string {
  return location.state ? `${location.name}, ${location.state}` : location.name
}
