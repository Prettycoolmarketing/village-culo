import { readCache, writeEntity, deleteEntity, type WriteResult } from '../lib/entityStore'
import type { Partner, PartnerFilter, PartnerFlag, PartnerFlagFilter, PartnerConversion, PartnerConversionFilter } from '../types/partner'

const KEYS = {
  partners:    'partners',
  flags:       'partner_flags',
  conversions: 'partner_conversions',
} as const

const TABLES = {
  partners:    'partners',
  flags:       'partner_flags',
  conversions: 'partner_conversions',
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

// ─── Conversions ─────────────────────────────────────────────────────────────

function toConversionRow(c: PartnerConversion, userId: string) {
  return {
    id:                       c.id,
    user_id:                  userId,
    partner_id:               c.partnerId,
    founder_id:               c.founderId,
    story_id:                 c.storyId ?? null,
    status:                   c.status,
    sale_amount_cents:        c.saleAmountCents,
    commission_amount_cents:  c.commissionAmountCents,
    founder_share_cents:      c.founderShareCents,
    currency:                 c.currency,
    payout_id:                c.payoutId ?? null,
    data:                     c,
  }
}

export const partnerConversionService = {
  getAll(filter?: PartnerConversionFilter): PartnerConversion[] {
    let items = readCache<PartnerConversion>(KEYS.conversions)
    if (filter?.founderId) items = items.filter(c => c.founderId === filter.founderId)
    if (filter?.partnerId) items = items.filter(c => c.partnerId === filter.partnerId)
    if (filter?.status)    items = items.filter(c => c.status === filter.status)
    if (filter?.unpaid)    items = items.filter(c => !c.payoutId)
    return items
  },

  upsert(conversion: PartnerConversion): Promise<WriteResult> {
    return writeEntity<PartnerConversion>({
      cacheKey: KEYS.conversions,
      item: { ...conversion, updatedAt: now() },
      table: TABLES.conversions,
      toRow: toConversionRow,
    })
  },
}

/**
 * commissionAmountCents × partner.founderRevenueSharePercent, frozen at
 * record time. Currency is hardcoded to USD for now — Stripe transfers,
 * founder payouts, and every $ figure in CAPO/Revenue assume USD throughout,
 * and there's no FX conversion anywhere in this system. Don't add a
 * currency param back here without also handling conversion at payout time.
 */
export function newPartnerConversion(input: {
  partner: Partner
  founderId: string
  storyId?: string
  saleAmountCents: number
  commissionAmountCents: number
  status?: PartnerConversion['status']
  notes?: string
}): PartnerConversion {
  const founderShareCents = Math.round(input.commissionAmountCents * (input.partner.founderRevenueSharePercent / 100))
  return {
    id: crypto.randomUUID(),
    partnerId: input.partner.id,
    founderId: input.founderId,
    storyId: input.storyId,
    status: input.status ?? 'confirmed',
    saleAmountCents: input.saleAmountCents,
    commissionAmountCents: input.commissionAmountCents,
    founderShareCents,
    currency: 'usd',
    notes: input.notes,
    createdAt: now(),
    updatedAt: now(),
  }
}
