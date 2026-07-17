// Founder Stripe Connect accounts and payout ledger. Row writes to
// founder_stripe_accounts happen server-side (Edge Functions, using the
// service role key) — a founder never sets their own stripe_account_id or
// flips payouts_enabled from the client, so there's no client-side upsert
// here, only reads from the synced cache.

import { readCache, writeEntity, type WriteResult } from '../lib/entityStore'
import type { FounderStripeAccount, PartnerPayout, PayoutStatus } from '../types/partner'

const KEYS = {
  stripeAccounts: 'founder_stripe_accounts',
  payouts:        'partner_payouts',
} as const

const TABLES = {
  payouts: 'partner_payouts',
} as const

function now() { return new Date().toISOString() }

export const stripeAccountService = {
  get(founderId: string): FounderStripeAccount | undefined {
    return readCache<FounderStripeAccount>(KEYS.stripeAccounts).find(a => a.founderId === founderId)
  },
}

function toPayoutRow(p: PartnerPayout, userId: string) {
  return {
    id:                  p.id,
    user_id:              userId,
    founder_id:           p.founderId,
    method:               p.method,
    status:               p.status,
    amount_cents:         p.amountCents,
    currency:             p.currency,
    stripe_transfer_id:   p.stripeTransferId ?? null,
    note:                 p.note ?? null,
    data:                 p,
  }
}

export const payoutService = {
  getAll(filter?: { founderId?: string; status?: PayoutStatus }): PartnerPayout[] {
    let items = readCache<PartnerPayout>(KEYS.payouts)
    if (filter?.founderId) items = items.filter(p => p.founderId === filter.founderId)
    if (filter?.status)    items = items.filter(p => p.status === filter.status)
    return items
  },

  upsert(payout: PartnerPayout): Promise<WriteResult> {
    return writeEntity<PartnerPayout>({
      cacheKey: KEYS.payouts,
      item: { ...payout, updatedAt: now() },
      table: TABLES.payouts,
      toRow: toPayoutRow,
    })
  },
}

/** A manual payout PCM staff paid outside Stripe (bank transfer, etc.) and are just recording. AUD only — see newPartnerConversion. */
export function newManualPayout(input: { founderId: string; amountCents: number; note?: string }): PartnerPayout {
  return {
    id: crypto.randomUUID(),
    founderId: input.founderId,
    method: 'manual',
    status: 'paid',
    amountCents: input.amountCents,
    currency: 'aud',
    note: input.note,
    createdAt: now(),
    updatedAt: now(),
  }
}
