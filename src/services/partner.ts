import { readCache, writeEntity, deleteEntity, type WriteResult } from '../lib/entityStore'
import type { Partner, PartnerFilter, PartnerFlag, PartnerFlagFilter } from '../types/partner'

const KEYS = {
  partners: 'partners',
  flags:    'partner_flags',
} as const

const TABLES = {
  partners: 'partners',
  flags:    'partner_flags',
} as const

function now() { return new Date().toISOString() }

function toPartnerRow(p: Partner, userId: string) {
  return {
    id:                             p.id,
    user_id:                        userId,
    business_id:                    p.businessId ?? null,
    status:                         p.status,
    source:                         p.source,
    founder_revenue_share_percent: p.founderRevenueSharePercent,
    sponsored:                     p.sponsored,
    data:                          p,
  }
}

export const partnerService = {
  getAll(filter?: PartnerFilter): Partner[] {
    let items = readCache<Partner>(KEYS.partners)
    if (filter?.status)    items = items.filter(p => p.status === filter.status)
    if (filter?.businessId) items = items.filter(p => p.businessId === filter.businessId)
    if (filter?.sponsored !== undefined) items = items.filter(p => p.sponsored === filter.sponsored)
    return items
  },

  get(id: string): Partner | undefined {
    return readCache<Partner>(KEYS.partners).find(p => p.id === id)
  },

  upsert(partner: Partner): Promise<WriteResult> {
    return writeEntity<Partner>({
      cacheKey: KEYS.partners,
      item: { ...partner, updatedAt: now() },
      table: TABLES.partners,
      toRow: toPartnerRow,
    })
  },

  delete(id: string): Promise<WriteResult> {
    return deleteEntity({ cacheKey: KEYS.partners, id, table: TABLES.partners })
  },
}

export function newPartnerRequest(input: {
  businessId: string
  name: string
  logo?: string
  website?: string
  pitch: string
  applicationUrl: string
  requestedByFounderId?: string
}): Partner {
  return {
    id: crypto.randomUUID(),
    businessId: input.businessId,
    name: input.name,
    logo: input.logo,
    website: input.website,
    pitch: input.pitch,
    applicationUrl: input.applicationUrl,
    status: 'pending',
    source: 'business-request',
    founderRevenueSharePercent: 50,
    sponsored: false,
    requestedByFounderId: input.requestedByFounderId,
    createdAt: now(),
    updatedAt: now(),
  }
}

function toFlagRow(f: PartnerFlag, userId: string) {
  return {
    id:          f.id,
    user_id:     userId,
    partner_id:  f.partnerId,
    story_id:    f.storyId ?? null,
    founder_id:  f.founderId ?? null,
    status:      f.status,
    data:        f,
  }
}

export const partnerFlagService = {
  getAll(filter?: PartnerFlagFilter): PartnerFlag[] {
    let items = readCache<PartnerFlag>(KEYS.flags)
    if (filter?.status)    items = items.filter(f => f.status === filter.status)
    if (filter?.partnerId) items = items.filter(f => f.partnerId === filter.partnerId)
    return items
  },

  upsert(flag: PartnerFlag): Promise<WriteResult> {
    return writeEntity<PartnerFlag>({
      cacheKey: KEYS.flags,
      item: { ...flag, updatedAt: now() },
      table: TABLES.flags,
      toRow: toFlagRow,
    })
  },
}

export function newPartnerFlag(input: { partnerId: string; storyId?: string; founderId?: string; reason: string; contextSnippet?: string }): PartnerFlag {
  return {
    id: crypto.randomUUID(),
    partnerId: input.partnerId,
    storyId: input.storyId,
    founderId: input.founderId,
    status: 'pending',
    reason: input.reason,
    contextSnippet: input.contextSnippet,
    createdAt: now(),
    updatedAt: now(),
  }
}
