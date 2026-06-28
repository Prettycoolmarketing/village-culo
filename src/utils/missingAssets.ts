import type { Founder, Business, Story, LibraryItem, Media, Service } from '../types'

export type MissingSeverity = 'critical' | 'important' | 'nice-to-have'

export interface MissingItem {
  field: string
  label: string
  severity: MissingSeverity
}

function isPlaceholder(url: string | undefined): boolean {
  if (!url) return true
  return url.includes('/placeholders/')
}

export function getFounderMissingItems(founder: Founder): MissingItem[] {
  const m: MissingItem[] = []
  if (isPlaceholder(founder.avatar))
    m.push({ field: 'avatar',          label: 'Profile photo — using placeholder',      severity: 'critical'      })
  if (isPlaceholder(founder.coverImage))
    m.push({ field: 'coverImage',      label: 'Cover image — using placeholder',        severity: 'important'     })
  if (!founder.bio || founder.bio.length < 100)
    m.push({ field: 'bio',             label: 'Bio too short (aim for 200+ chars)',      severity: 'critical'      })
  if (!founder.website)
    m.push({ field: 'website',         label: 'Website URL',                            severity: 'important'     })
  if (!founder.instagram && !founder.linkedin)
    m.push({ field: 'socials',         label: 'At least one social link',               severity: 'important'     })
  if (!founder.topics || founder.topics.length === 0)
    m.push({ field: 'topics',          label: 'Topics required for knowledge graph',    severity: 'critical'      })
  if (!founder.faqs || founder.faqs.length === 0)
    m.push({ field: 'faqs',            label: 'FAQs help search discoverability',       severity: 'nice-to-have'  })
  if (!founder.seoTitle)
    m.push({ field: 'seoTitle',        label: 'SEO page title',                         severity: 'nice-to-have'  })
  if (!founder.seoDescription)
    m.push({ field: 'seoDescription',  label: 'SEO meta description',                  severity: 'nice-to-have'  })
  return m
}

export function getBusinessMissingItems(business: Business): MissingItem[] {
  const m: MissingItem[] = []
  if (isPlaceholder(business.logo))
    m.push({ field: 'logo',            label: 'Logo — using placeholder',               severity: 'critical'      })
  if (isPlaceholder(business.coverImage))
    m.push({ field: 'coverImage',      label: 'Cover image — using placeholder',        severity: 'critical'      })
  if (!business.description || business.description.length < 100)
    m.push({ field: 'description',     label: 'Description too short',                  severity: 'critical'      })
  if (!business.website)
    m.push({ field: 'website',         label: 'Website URL',                            severity: 'important'     })
  if (!business.instagram && !business.linkedin)
    m.push({ field: 'socials',         label: 'Social links',                           severity: 'important'     })
  if (!business.offers || business.offers.length === 0)
    m.push({ field: 'offers',          label: 'Offers / CTAs',                          severity: 'important'     })
  if (!business.faqs || business.faqs.length === 0)
    m.push({ field: 'faqs',            label: 'FAQs',                                   severity: 'nice-to-have'  })
  if (!business.seoTitle)
    m.push({ field: 'seoTitle',        label: 'SEO page title',                         severity: 'nice-to-have'  })
  if (!business.seoDescription)
    m.push({ field: 'seoDescription',  label: 'SEO meta description',                  severity: 'nice-to-have'  })
  return m
}

export function getStoryMissingItems(story: Story): MissingItem[] {
  const m: MissingItem[] = []
  if (isPlaceholder(story.coverImage))
    m.push({ field: 'coverImage',      label: 'Cover image — using placeholder',        severity: 'critical'      })
  if (!story.summary || story.summary.length < 80)
    m.push({ field: 'summary',         label: 'Summary too short',                      severity: 'critical'      })
  if (story.contentTypes.includes('blog') && !story.blog)
    m.push({ field: 'blog',            label: 'Blog content missing',                   severity: 'critical'      })
  if (story.contentTypes.includes('carousel') && (!story.carouselImages || story.carouselImages.length === 0))
    m.push({ field: 'carouselImages',  label: 'Carousel images missing',                severity: 'critical'      })
  if (story.contentTypes.includes('reel') && !story.reelUrl)
    m.push({ field: 'reelUrl',         label: 'Reel URL missing',                       severity: 'critical'      })
  if (!story.ctaUrl)
    m.push({ field: 'cta',             label: 'CTA URL missing',                        severity: 'important'     })
  if (!story.ideaIds || story.ideaIds.length === 0)
    m.push({ field: 'ideas',           label: 'No connected ideas',                     severity: 'important'     })
  if (!story.seoTitle)
    m.push({ field: 'seoTitle',        label: 'SEO page title',                         severity: 'nice-to-have'  })
  if (!story.seoDescription)
    m.push({ field: 'seoDescription',  label: 'SEO meta description',                  severity: 'nice-to-have'  })
  return m
}

export function getMediaMissingItems(asset: Media): MissingItem[] {
  const m: MissingItem[] = []
  if (!asset.altText)
    m.push({ field: 'altText',         label: 'Alt text — required for accessibility',  severity: 'critical'      })
  if (!asset.approved)
    m.push({ field: 'approved',        label: 'Asset not yet approved',                 severity: 'important'     })
  if (asset.relatedFounderIds.length === 0 && asset.relatedBusinessIds.length === 0 && asset.relatedStoryIds.length === 0)
    m.push({ field: 'relationships',   label: 'Not linked to any Village object',       severity: 'important'     })
  if (!asset.caption)
    m.push({ field: 'caption',         label: 'Caption',                                severity: 'nice-to-have'  })
  if (!asset.credit)
    m.push({ field: 'credit',          label: 'Photo credit',                           severity: 'nice-to-have'  })
  return m
}

export function getLibraryMissingItems(item: LibraryItem): MissingItem[] {
  const m: MissingItem[] = []
  if (isPlaceholder(item.coverImage))
    m.push({ field: 'coverImage',      label: 'Cover image — using placeholder',        severity: 'critical'      })
  if (!item.description || item.description.length < 80)
    m.push({ field: 'description',     label: 'Description too short',                  severity: 'critical'      })
  if (!item.purchaseLinks || item.purchaseLinks.length === 0)
    m.push({ field: 'purchaseLinks',   label: 'No purchase or access link',             severity: 'important'     })
  if (!item.seoTitle)
    m.push({ field: 'seoTitle',        label: 'SEO page title',                         severity: 'nice-to-have'  })
  if (!item.seoDescription)
    m.push({ field: 'seoDescription',  label: 'SEO meta description',                  severity: 'nice-to-have'  })
  return m
}

export function getServiceMissingItems(service: Service): MissingItem[] {
  const m: MissingItem[] = []
  if (!service.description || service.description.length < 60)
    m.push({ field: 'description',     label: 'Description too short',                  severity: 'critical'      })
  if (!service.ctaUrl)
    m.push({ field: 'ctaUrl',          label: 'CTA / booking URL missing',              severity: 'important'     })
  if (!service.price)
    m.push({ field: 'price',           label: 'Price not set',                          severity: 'nice-to-have'  })
  if (!service.deliverable)
    m.push({ field: 'deliverable',     label: 'Deliverable description missing',        severity: 'nice-to-have'  })
  return m
}

export function getMissingCounts(items: MissingItem[]) {
  return {
    critical:  items.filter(i => i.severity === 'critical').length,
    important: items.filter(i => i.severity === 'important').length,
    nice:      items.filter(i => i.severity === 'nice-to-have').length,
    total:     items.length,
  }
}

export function getHealthScore(items: MissingItem[]): number {
  const { critical, important } = getMissingCounts(items)
  return Math.max(0, 100 - critical * 20 - important * 10)
}
