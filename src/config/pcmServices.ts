// Pretty Cool Marketing — the five service tiers, one source of truth.
// Marketing pages, checkout, the Capo tracker and the client dashboard all
// read from here so a price or an inclusion only ever changes in one place.

export type PcmServiceId = 'publishing' | 'social' | 'content' | 'creatives' | 'full'

export interface PcmService {
  id: PcmServiceId
  name: string
  /** Recurring price, AUD per month. */
  monthlyPrice: number
  monthlyLabel: string
  /** One-off Archive Transfer applies (quoted from archive size). */
  hasTransfer: boolean
  /** A content shoot is booked every 4 weeks. */
  hasShoots: boolean
  /** What this tier actually does, for dashboard section gating. */
  includes: { publishing: boolean; social: boolean; shoots: boolean }
  blurb: string
}

export const PCM_SERVICES: Record<PcmServiceId, PcmService> = {
  publishing: {
    id: 'publishing',
    name: 'Blog Management',
    monthlyPrice: 900,
    monthlyLabel: '$900 AUD / month',
    hasTransfer: true,
    hasShoots: false,
    includes: { publishing: true, social: false, shoots: false },
    blurb: 'Your archive brought into the Village and published as 30 structured founder articles a month.',
  },
  social: {
    id: 'social',
    name: 'Social Media Management',
    monthlyPrice: 3000,
    monthlyLabel: '$3,000 AUD / month',
    hasTransfer: false,
    hasShoots: false,
    includes: { publishing: false, social: true, shoots: false },
    blurb: 'You send the footage. We edit, get it approved, schedule and publish it across every platform.',
  },
  content: {
    id: 'content',
    name: 'Content Creator',
    monthlyPrice: 3888,
    monthlyLabel: '$3,888 AUD / month',
    hasTransfer: false,
    hasShoots: true,
    includes: { publishing: false, social: true, shoots: true },
    blurb: 'Social Media Management plus a content shoot with you every 4 weeks.',
  },
  creatives: {
    id: 'creatives',
    name: 'Village Creatives',
    monthlyPrice: 3900,
    monthlyLabel: '$3,900 AUD / month',
    hasTransfer: true,
    hasShoots: false,
    includes: { publishing: true, social: true, shoots: false },
    blurb: 'Blog Management and Social Media Management together — your archive published and your socials run.',
  },
  full: {
    id: 'full',
    name: 'Full Service',
    monthlyPrice: 4788,
    monthlyLabel: '$4,788 AUD / month',
    hasTransfer: true,
    hasShoots: true,
    includes: { publishing: true, social: true, shoots: true },
    blurb: 'Everything: your archive published, your socials run, and a content shoot every 4 weeks.',
  },
}

export const PCM_SERVICE_IDS: PcmServiceId[] = ['publishing', 'social', 'content', 'creatives', 'full']

/** Services bought through the dynamic quote checkout (have an Archive Transfer). */
export const PCM_QUOTE_SERVICES: PcmServiceId[] = ['publishing', 'creatives', 'full']
