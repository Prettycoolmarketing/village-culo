import { resolveRecommendationLink } from '../../services/linkResolver'
import { trackingService } from '../../services/partnership'

interface Props {
  founderId: string
  businessId: string
  recommendationId: string
  storyId?: string
  businessWebsite?: string
  sourcePage: 'story' | 'founder' | 'business'
  className?: string
}

export function TrackedRecommendationLink({
  founderId,
  businessId,
  recommendationId,
  storyId,
  businessWebsite,
  sourcePage,
  className = '',
}: Props) {
  const resolution = resolveRecommendationLink(founderId, businessId, businessWebsite)
  if (!resolution.url) return null

  const label =
    resolution.type === 'village-program' ? 'Visit with partner link' :
    resolution.type === 'affiliate'       ? 'Visit recommendation'    :
    'Visit business'

  function handleClick() {
    void trackingService.record({
      founderId,
      businessId,
      recommendationId,
      storyId,
      linkType: resolution.type,
      redirectUrl: resolution.url,
      sourcePage,
    })
    window.open(resolution.url, '_blank', 'noopener,noreferrer')
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={className}
    >
      {label} ↗
    </button>
  )
}
