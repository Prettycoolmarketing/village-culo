import { enrollmentService, affiliateLinkService, programService } from './partnership'
import { normalizeUrl } from '../utils/url'

export type LinkType = 'village-program' | 'affiliate' | 'normal'

export interface LinkResolution {
  url: string
  type: LinkType
  programId?: string
  affiliateLinkId?: string
  trackingSlug?: string   // future: village.culo/go/{founderId}/{businessId}
}

// Follows the Recommendation Decision Tree exactly:
// 1. Approved rec + enrolled in Village Program → Village tracking link
// 2. Approved rec + founder affiliate link → founder's affiliate URL
// 3. Otherwise → normal business website
export function resolveRecommendationLink(
  founderId: string,
  businessId: string,
  businessWebsite?: string
): LinkResolution {
  const enrollment = enrollmentService.getActive(founderId, businessId)
  if (enrollment) {
    const prog = programService.get(enrollment.programId)
    return {
      url: normalizeUrl(prog?.landingPageUrl ?? businessWebsite),
      type: 'village-program',
      programId: enrollment.programId,
      trackingSlug: `${founderId}/${businessId}`,
    }
  }

  const affiliateLink = affiliateLinkService.getForBusiness(founderId, businessId)
  if (affiliateLink) {
    return {
      url: normalizeUrl(affiliateLink.affiliateUrl),
      type: 'affiliate',
      affiliateLinkId: affiliateLink.id,
    }
  }

  return { url: normalizeUrl(businessWebsite), type: 'normal' }
}
