import type { Founder, Business, Story, LibraryItem, Media, Service } from '../types'

export type MissingSeverity = 'critical' | 'important' | 'nice-to-have'

export interface MissingItem {
  field: string
  /** Warm, human description of what's left — never "error"/"missing"/"required". */
  label: string
  /** Button text for the fix — every recommendation has a next action. */
  action: string
  severity: MissingSeverity
}

function isPlaceholder(url: string | undefined): boolean {
  if (!url) return true
  return url.includes('/placeholders/')
}

export function getFounderMissingItems(founder: Founder): MissingItem[] {
  const m: MissingItem[] = []
  if (isPlaceholder(founder.avatar))
    m.push({ field: 'avatar',          label: 'Add a profile photo so readers recognise you',      action: 'Upload Photo',    severity: 'critical'      })
  if (isPlaceholder(founder.coverImage))
    m.push({ field: 'coverImage',      label: 'Choose a cover image for your profile',              action: 'Choose Cover',    severity: 'important'     })
  if (!founder.bio || founder.bio.length < 100)
    m.push({ field: 'bio',             label: 'Tell your story — a fuller bio helps people connect', action: 'Write Bio',       severity: 'critical'      })
  if (!founder.website)
    m.push({ field: 'website',         label: 'Add your website so people can find you',            action: 'Add Website',     severity: 'important'     })
  if (!founder.instagram && !founder.linkedin)
    m.push({ field: 'socials',         label: 'Link a social profile to build trust',               action: 'Add Social Link', severity: 'important'     })
  if (!founder.topics || founder.topics.length === 0)
    m.push({ field: 'topics',          label: 'Add topics to help people discover you',             action: 'Add Topics',      severity: 'critical'      })
  if (!founder.faqs || founder.faqs.length === 0)
    m.push({ field: 'faqs',            label: 'Answer a few FAQs to boost your search presence',    action: 'Add FAQs',        severity: 'nice-to-have'  })
  if (!founder.seoTitle)
    m.push({ field: 'seoTitle',        label: 'Give your page a custom search title',               action: 'Add Page Title',  severity: 'nice-to-have'  })
  if (!founder.seoDescription)
    m.push({ field: 'seoDescription',  label: 'Write a short search description',                   action: 'Add Description', severity: 'nice-to-have'  })
  return m
}

export function getBusinessMissingItems(business: Business): MissingItem[] {
  const m: MissingItem[] = []
  if (isPlaceholder(business.logo))
    m.push({ field: 'logo',            label: 'Upload a logo so people recognise your brand',       action: 'Upload Logo',     severity: 'critical'      })
  if (isPlaceholder(business.coverImage))
    m.push({ field: 'coverImage',      label: 'Choose a cover image for your business',             action: 'Choose Cover',    severity: 'critical'      })
  if (!business.description || business.description.length < 100)
    m.push({ field: 'description',     label: 'Describe what your business does',                   action: 'Write Description', severity: 'critical'    })
  if (!business.website)
    m.push({ field: 'website',         label: 'Add your website',                                   action: 'Add Website',     severity: 'important'     })
  if (!business.instagram && !business.linkedin)
    m.push({ field: 'socials',         label: 'Link your social profiles',                          action: 'Add Social Links', severity: 'important'    })
  if (!business.offers || business.offers.length === 0)
    m.push({ field: 'offers',          label: 'Add an offer so people know how to work with you',   action: 'Add Offer',       severity: 'important'     })
  if (!business.faqs || business.faqs.length === 0)
    m.push({ field: 'faqs',            label: 'Answer a few FAQs for your customers',                action: 'Add FAQs',        severity: 'nice-to-have'  })
  if (!business.seoTitle)
    m.push({ field: 'seoTitle',        label: 'Give your page a custom search title',               action: 'Add Page Title',  severity: 'nice-to-have'  })
  if (!business.seoDescription)
    m.push({ field: 'seoDescription',  label: 'Write a short search description',                   action: 'Add Description', severity: 'nice-to-have'  })
  return m
}

export function getStoryMissingItems(story: Story): MissingItem[] {
  const m: MissingItem[] = []
  if (isPlaceholder(story.coverImage))
    m.push({ field: 'coverImage',      label: 'Choose a cover image for this story',                action: 'Choose Cover',    severity: 'critical'      })
  if (!story.summary || story.summary.length < 80)
    m.push({ field: 'summary',         label: 'Write a summary so readers know what this is about', action: 'Write Summary',   severity: 'critical'      })
  if (story.contentTypes.includes('blog') && !story.blog)
    m.push({ field: 'blog',            label: 'Add your blog content',                              action: 'Write Blog',      severity: 'critical'      })
  if (story.contentTypes.includes('carousel') && (!story.carouselImages || story.carouselImages.length === 0))
    m.push({ field: 'carouselImages',  label: 'Add images for your carousel',                       action: 'Add Images',      severity: 'critical'      })
  if (story.contentTypes.includes('reel') && !story.reelUrl)
    m.push({ field: 'reelUrl',         label: 'Add a link to your reel',                            action: 'Add Reel Link',   severity: 'critical'      })
  if (!story.ctaUrl)
    m.push({ field: 'cta',             label: 'Add a call-to-action link',                          action: 'Add CTA Link',    severity: 'important'     })
  if (!story.ideaIds || story.ideaIds.length === 0)
    m.push({ field: 'ideas',           label: 'Connect an idea to strengthen your story',           action: 'Connect Idea',    severity: 'important'     })
  if (!story.seoTitle)
    m.push({ field: 'seoTitle',        label: 'Give your page a custom search title',               action: 'Add Page Title',  severity: 'nice-to-have'  })
  if (!story.seoDescription)
    m.push({ field: 'seoDescription',  label: 'Write a short search description',                   action: 'Add Description', severity: 'nice-to-have'  })
  return m
}

export function getMediaMissingItems(asset: Media): MissingItem[] {
  const m: MissingItem[] = []
  if (!asset.altText)
    m.push({ field: 'altText',         label: 'Describe this image so everyone can enjoy it',       action: 'Add Alt Text',    severity: 'critical'      })
  if (!asset.approved)
    m.push({ field: 'approved',        label: 'Waiting on approval before it goes live',            action: 'Request Review',  severity: 'important'     })
  if (asset.relatedFounderIds.length === 0 && asset.relatedBusinessIds.length === 0 && asset.relatedStoryIds.length === 0)
    m.push({ field: 'relationships',   label: 'Connect this to a founder, business or story',       action: 'Connect',         severity: 'important'     })
  if (!asset.caption)
    m.push({ field: 'caption',         label: 'Add a caption',                                      action: 'Add Caption',     severity: 'nice-to-have'  })
  if (!asset.credit)
    m.push({ field: 'credit',          label: 'Credit the photographer or creator',                 action: 'Add Credit',      severity: 'nice-to-have'  })
  return m
}

export function getLibraryMissingItems(item: LibraryItem): MissingItem[] {
  const m: MissingItem[] = []
  if (isPlaceholder(item.coverImage))
    m.push({ field: 'coverImage',      label: 'Choose a cover image',                               action: 'Choose Cover',    severity: 'critical'      })
  if (!item.description || item.description.length < 80)
    m.push({ field: 'description',     label: 'Describe this resource for readers',                 action: 'Write Description', severity: 'critical'    })
  if (!item.purchaseLinks || item.purchaseLinks.length === 0)
    m.push({ field: 'purchaseLinks',   label: 'Add a link so people can access this',               action: 'Add Link',        severity: 'important'     })
  if (!item.seoTitle)
    m.push({ field: 'seoTitle',        label: 'Give your page a custom search title',               action: 'Add Page Title',  severity: 'nice-to-have'  })
  if (!item.seoDescription)
    m.push({ field: 'seoDescription',  label: 'Write a short search description',                   action: 'Add Description', severity: 'nice-to-have'  })
  return m
}

export function getServiceMissingItems(service: Service): MissingItem[] {
  const m: MissingItem[] = []
  if (!service.description || service.description.length < 60)
    m.push({ field: 'description',     label: 'Describe what people are booking',                   action: 'Write Description', severity: 'critical'    })
  if (!service.ctaUrl)
    m.push({ field: 'ctaUrl',          label: 'Add a booking or contact link',                      action: 'Add Booking Link', severity: 'important'    })
  if (!service.price)
    m.push({ field: 'price',           label: 'Add pricing so people know what to expect',          action: 'Add Price',       severity: 'nice-to-have'  })
  if (!service.deliverable)
    m.push({ field: 'deliverable',     label: 'Describe what people receive',                       action: 'Add Deliverable', severity: 'nice-to-have'  })
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
