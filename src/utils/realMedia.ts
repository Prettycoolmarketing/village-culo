import type { Founder, Story } from '../types'

// Culo Village's own default avatar/cover fallbacks — real photo URLs
// never equal these literally, so this is a safe, exact check rather than
// a guess. Used specifically to keep the homepage's rotating "featured"
// spotlights (Story/Founder of the Day, Featured Founders, Latest
// Stories preview) from filling up with the generic Culo logo the moment
// a founder hasn't uploaded a real photo yet — the plain, full /founders
// and /stories listings still show everyone regardless, this is only
// about what gets spotlighted.
const DEFAULT_AVATAR = '/placeholders/village-founder.svg'
const DEFAULT_COVER = '/assets/culo-brand-cover.png'

export function hasRealAvatar(founder: Pick<Founder, 'avatar'> | null | undefined): boolean {
  return !!founder?.avatar && founder.avatar !== DEFAULT_AVATAR
}

export function hasRealCoverImage(story: Pick<Story, 'coverImage'> | null | undefined): boolean {
  return !!story?.coverImage && story.coverImage !== DEFAULT_COVER
}
