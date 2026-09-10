// Pretty Cool Marketing — client tracker ("Capo" staff view).
//
// Local cache in localStorage, mirrored to the shared `pcm_clients` table
// (see migration 031) so a client created server-side by stripe-pcm-webhook
// — no staff data entry involved — shows up here too. Every mutation here
// pushes to Supabase best-effort (fire-and-forget, same spirit as the rest
// of this codebase's cache-first services); call syncPcmClientsFromServer()
// on page load to pull down anything created outside this browser.
//
// Pipeline model — the four stages the client's work moves through. Each
// stage is a toggle staff flip as the work progresses:
//
//   1. Raw content received     off = waiting on the client to send material
//   2. Editing                  on  = content is being edited in Culo Creatives
//   3. Approvals                 on  = sent to the client, waiting on their sign-off
//   4. Live                      on  = scheduled / published across platforms + the Village
//
// The client's "current stage" is the highest stage reached.

import { supabase, isSupabaseConfigured } from './supabase'

const KEY = 'pcm_clients_v1'

export type PcmOfferId = 'publishing' | 'social' | 'content' | 'full'

// Old records used tier2/tier3 before the packages were split out — map
// them on read so nothing breaks.
const LEGACY_OFFERS: Record<string, PcmOfferId> = { tier2: 'social', tier3: 'full' }
function normalizeOffer(o: string): PcmOfferId {
  if (o === 'publishing' || o === 'social' || o === 'content' || o === 'full') return o
  return LEGACY_OFFERS[o] ?? 'publishing'
}

export type PcmStageId = 'raw' | 'editing' | 'approvals' | 'live'

export const PCM_STAGES: { id: PcmStageId; label: string; hint: string }[] = [
  { id: 'raw',       label: 'Raw content received', hint: 'Client has emailed their footage / MD files / drive links.' },
  { id: 'editing',   label: 'Editing',              hint: 'Content is being edited in Culo Creatives.' },
  { id: 'approvals', label: 'Approvals sent',       hint: 'Canva approval link sent — waiting on the client to sign off.' },
  { id: 'live',      label: 'Live',                 hint: 'Scheduled / published across platforms and the Village.' },
]

export interface PcmActivityEntry {
  at: string       // ISO timestamp
  text: string
}

export interface PcmClient {
  id: string
  name: string
  email: string
  offer: PcmOfferId
  startDate: string          // ISO date (yyyy-mm-dd)
  nextShootDate: string      // ISO date, Tier 3 only — '' otherwise
  stages: Record<PcmStageId, string | null>   // stage id -> ISO timestamp it was completed, or null
  notes: string
  activity: PcmActivityEntry[]
  createdAt: string
  // The Village founder PCM is fulfilling for. Once linked and marked
  // managed, that founder's self-serve publishing limits/meters are turned
  // off (founder.pcmManaged) and their monthly publish volume shows here
  // as a service deliverable instead.
  founderId?: string
  monthlyTarget?: number       // blogs/posts to publish per month (default 30)
}

export const PCM_OFFER_LABELS: Record<PcmOfferId, string> = {
  publishing: 'Publishing',
  social:     'Social Media',
  content:    'Content',
  full:       'Full Service',
}

/** Order for package tabs in Capo. */
export const PCM_OFFER_IDS: PcmOfferId[] = ['publishing', 'social', 'content', 'full']

function read(): PcmClient[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    return (JSON.parse(raw) as PcmClient[]).map(c => ({ ...c, offer: normalizeOffer(c.offer as string) }))
  } catch {
    return []
  }
}

function write(clients: PcmClient[]): void {
  localStorage.setItem(KEY, JSON.stringify(clients))
}

function pushToServer(client: PcmClient): void {
  if (!isSupabaseConfigured || !supabase) return
  void supabase.from('pcm_clients').upsert({
    id: client.id, founder_id: client.founderId ?? null, email: client.email, data: client,
  }).then(({ error }) => { if (error) console.warn('pcm_clients sync failed', error) })
}

/** Pulls every row from the shared table and merges it into the local cache
 *  — server data wins on conflict, since that's the durable copy. Call this
 *  once when the tracker/detail pages mount. */
export async function syncPcmClientsFromServer(): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return
  const { data, error } = await supabase.from('pcm_clients').select('data')
  if (error || !data) return
  const serverClients = data.map(row => row.data as PcmClient)
  const local = read()
  const byId = new Map(local.map(c => [c.id, c]))
  for (const c of serverClients) byId.set(c.id, c)
  write([...byId.values()])
}

export function getPcmClients(): PcmClient[] {
  return read().sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function getPcmClient(id: string): PcmClient | undefined {
  return read().find(c => c.id === id)
}

export function createPcmClient(input: {
  name: string
  email: string
  offer: PcmOfferId
  startDate: string
  nextShootDate?: string
}): PcmClient {
  const now = new Date().toISOString()
  const client: PcmClient = {
    id: `pcm_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: input.name.trim(),
    email: input.email.trim(),
    offer: input.offer,
    startDate: input.startDate,
    nextShootDate: input.nextShootDate ?? '',
    stages: { raw: null, editing: null, approvals: null, live: null },
    notes: '',
    activity: [{ at: now, text: 'Client added to the tracker.' }],
    createdAt: now,
  }
  write([...read(), client])
  pushToServer(client)
  return client
}

export function updatePcmClient(id: string, patch: Partial<PcmClient>): PcmClient | undefined {
  const clients = read()
  const idx = clients.findIndex(c => c.id === id)
  if (idx < 0) return undefined
  clients[idx] = { ...clients[idx], ...patch }
  write(clients)
  pushToServer(clients[idx])
  return clients[idx]
}

export function deletePcmClient(id: string): void {
  write(read().filter(c => c.id !== id))
  if (isSupabaseConfigured && supabase) void supabase.from('pcm_clients').delete().eq('id', id)
}

function logActivity(client: PcmClient, text: string): PcmActivityEntry[] {
  return [{ at: new Date().toISOString(), text }, ...client.activity].slice(0, 200)
}

/** Flip a pipeline stage on/off. Recorded with a timestamp + activity entry. */
export function togglePcmStage(id: string, stage: PcmStageId, done: boolean): PcmClient | undefined {
  const client = getPcmClient(id)
  if (!client) return undefined
  const label = PCM_STAGES.find(s => s.id === stage)?.label ?? stage
  return updatePcmClient(id, {
    stages: { ...client.stages, [stage]: done ? new Date().toISOString() : null },
    activity: logActivity(client, `${label} — marked ${done ? 'done' : 'not done'}.`),
  })
}

export function addPcmActivity(id: string, text: string): PcmClient | undefined {
  const client = getPcmClient(id)
  if (!client) return undefined
  return updatePcmClient(id, { activity: logActivity(client, text) })
}

/** The furthest stage reached, for the list view badge. */
export function currentStage(client: PcmClient): { id: PcmStageId | 'new'; label: string } {
  for (let i = PCM_STAGES.length - 1; i >= 0; i--) {
    if (client.stages[PCM_STAGES[i].id]) {
      return { id: PCM_STAGES[i].id, label: PCM_STAGES[i].label }
    }
  }
  return { id: 'new', label: 'Waiting on raw content' }
}
