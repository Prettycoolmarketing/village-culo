import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { getFounder } from './founders'
import { passesRiskGate } from './editorialEngine'
import type { EvidenceLedger } from '../types/editorialEngine'
import type { Founder } from '../types'

// Culo Editorial Engine, Sprint 2 — Stage 2 (Writer). Directly against the
// editorial_items table (no local cache layer yet — this is a low-volume,
// manual-trigger feature for now, not something read on every page load).

export interface AuditIssue {
  sentence: string
  issue_type: 'INVENTED_FACT' | 'DROPPED_ATTRIBUTION' | 'OVERSTATED_CONFIDENCE' | 'FACTUAL_DRIFT'
  explanation: string
}

export interface EditorialItemRow {
  id: string
  founder_id: string
  imported_content_id: string | null
  type: 'profile_bio' | 'source_article'
  draft_content: { title?: string; body: string; byline?: string; claim_ids_used?: string[] } | null
  // pending/pass/review/reject are the Auditor's own machine verdict.
  // approved is set only by a human in the Review Queue — see approveItem.
  editorial_status: 'pending' | 'pass' | 'review' | 'reject' | 'approved'
  auditor_notes: AuditIssue[] | null
  auto_publish_allowed: boolean
  created_at: string
}

// Fixed, never model-written — the legal requirement from the editorial
// engine's own design discussion: a piece must never read as if the
// founder wrote or endorsed it themselves. A constant here is safer than
// asking the Writer prompt to produce it, since a byline is exactly the
// kind of line that must never vary or go missing on one run.
const CULO_BYLINE = 'Written by Culo'

export async function getEditorialItems(founderId: string): Promise<EditorialItemRow[]> {
  if (!isSupabaseConfigured || !supabase) return []
  const { data, error } = await supabase
    .from('editorial_items')
    .select('*')
    .eq('founder_id', founderId)
    .order('created_at', { ascending: true })
  if (error || !data) return []
  return data as EditorialItemRow[]
}

// Across every founder — the Review Queue's own data source. Low-volume
// by design (manual trigger, one founder at a time upstream), so one
// unfiltered select is fine; revisit with real pagination if that stops
// being true once bulk import can create these automatically.
export async function getAllEditorialItems(): Promise<EditorialItemRow[]> {
  if (!isSupabaseConfigured || !supabase) return []
  const { data, error } = await supabase
    .from('editorial_items')
    .select('*')
    .order('created_at', { ascending: false })
  if (error || !data) return []
  return data as EditorialItemRow[]
}

// The human sign-off the agreed design requires — an Auditor "pass" (or a
// "review" a human decided was actually fine) routes here, never straight
// to publish on its own. This is the one action in the whole pipeline a
// model never gets to take for itself.
export async function approveItem(itemId: string): Promise<WriteResult> {
  if (!isSupabaseConfigured || !supabase) return { success: false, error: 'Not configured.' }
  const { data, error } = await supabase
    .from('editorial_items')
    .update({ editorial_status: 'approved' })
    .eq('id', itemId)
    .select()
    .single()
  if (error || !data) return { success: false, error: error?.message ?? 'Could not approve.' }
  return { success: true, item: data as EditorialItemRow }
}

// Publishing a founder's profile is now the one human approval moment for
// everything the editorial engine wrote them (see publishFounderArticles) —
// bios included, not just articles, and regardless of whatever audit
// verdict an item is currently sitting at. Staff already had their chance
// to delete/edit anything off; Publish ships what's left. Silently a no-op
// when Supabase isn't configured, same as every other editorial_items call.
export async function approveAllForFounder(founderId: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return
  await supabase.from('editorial_items').update({ editorial_status: 'approved' }).eq('founder_id', founderId).neq('editorial_status', 'approved')
}

// Bulk version of approveItem — "Confirm all" in the UI, for approving
// every already-passing draft in one action instead of clicking Approve
// once per item. Deliberately still only approves items already at
// "pass" (never "review" or "pending") — a bulk action is not a way to
// skip the one review a "review"/"pending" item is still waiting on.
export async function approveAllPassing(itemIds: string[]): Promise<{ approved: number; failed: number }> {
  if (!isSupabaseConfigured || !supabase || itemIds.length === 0) return { approved: 0, failed: 0 }
  const { data, error } = await supabase
    .from('editorial_items')
    .update({ editorial_status: 'approved' })
    .in('id', itemIds)
    .eq('editorial_status', 'pass')
    .select('id')
  if (error) return { approved: 0, failed: itemIds.length }
  return { approved: data?.length ?? 0, failed: 0 }
}

// A human override, distinct from the Auditor's own "reject" verdict —
// used when a CAPO reviewer disagrees with a "pass" or "review" and wants
// it out of the queue without waiting for a re-audit to catch up.
export async function rejectItem(itemId: string): Promise<WriteResult> {
  if (!isSupabaseConfigured || !supabase) return { success: false, error: 'Not configured.' }
  const { data, error } = await supabase
    .from('editorial_items')
    .update({ editorial_status: 'reject' })
    .eq('id', itemId)
    .select()
    .single()
  if (error || !data) return { success: false, error: error?.message ?? 'Could not reject.' }
  return { success: true, item: data as EditorialItemRow }
}

interface WriteResult {
  success: boolean
  item?: EditorialItemRow
  error?: string
}

// One founder's first name — the founder's own stated preference this
// session (used in reporting after the first full-name reference) rather
// than a generic style default.
function firstNameOf(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName
}

async function callWriter(
  type: 'profile_bio' | 'source_article',
  founderName: string,
  claims: EvidenceLedger['claims'],
  targetSource?: EvidenceLedger['source_assessments'][number],
): Promise<{ draft?: { title?: string; body: string; claim_ids_used?: string[] }; error?: string }> {
  if (!isSupabaseConfigured || !supabase) return { error: 'Not configured.' }
  const { data, error } = await supabase.functions.invoke<{ draft?: { title?: string; body: string; claim_ids_used?: string[] }; error?: string }>(
    'editorial-write',
    { body: { type, founderName, firstName: firstNameOf(founderName), claims, targetSource } },
  )
  if (error || data?.error || !data?.draft) {
    return { error: data?.error || (error instanceof Error ? error.message : 'Writer failed.') }
  }
  return { draft: data.draft }
}

// Writes the one profile_bio item for a founder from their existing
// evidence ledger. Safe to call again — inserts a new row each time
// (editorial_version isn't auto-incremented yet; that's a later pass once
// the review queue actually needs to diff versions).
export async function writeProfileBio(founderId: string): Promise<WriteResult> {
  if (!isSupabaseConfigured || !supabase) return { success: false, error: 'Not configured.' }
  const founder = getFounder(founderId)
  const ledger = founder?.evidenceLedger
  if (!founder || !ledger) return { success: false, error: 'Run research before writing.' }

  const claims = ledger.claims.filter(c => c.human_review !== 'rejected')
  const { draft, error } = await callWriter('profile_bio', founder.name, claims)
  if (error || !draft) return { success: false, error: error ?? 'Writer returned nothing.' }

  const autoPublishAllowed = passesRiskGate(ledger)
  const { data, error: dbError } = await supabase
    .from('editorial_items')
    .insert({
      founder_id: founderId,
      type: 'profile_bio',
      draft_content: { ...draft, byline: CULO_BYLINE },
      auto_publish_allowed: autoPublishAllowed,
    })
    .select()
    .single()
  if (dbError || !data) return { success: false, error: dbError?.message ?? 'Could not save draft.' }
  return { success: true, item: data as EditorialItemRow }
}

// Stage 3 — Auditor. Checks an already-written draft against the same
// evidence ledger it was written from — a second, independent pass, not
// the Writer re-checking its own work. Never rewrites, never re-searches;
// only produces a verdict (pass/review/reject) and, when it finds
// something, a list of specific sentence-level issues for the review
// queue to show.
export async function runAudit(item: EditorialItemRow): Promise<WriteResult> {
  if (!isSupabaseConfigured || !supabase) return { success: false, error: 'Not configured.' }
  const founder = getFounder(item.founder_id)
  const ledger = founder?.evidenceLedger
  if (!founder || !ledger) return { success: false, error: 'No evidence ledger found for this founder.' }
  if (!item.draft_content?.body) return { success: false, error: 'This item has no draft to audit.' }

  const claims = ledger.claims.filter(c => c.human_review !== 'rejected')
  const { data, error } = await supabase.functions.invoke<{ result?: { verdict: 'pass' | 'review' | 'reject'; issues: AuditIssue[] }; error?: string }>(
    'editorial-audit',
    {
      body: {
        founderName: founder.name,
        draftTitle: item.draft_content.title,
        draftBody: item.draft_content.body,
        claims,
      },
    },
  )
  if (error || data?.error || !data?.result) {
    return { success: false, error: data?.error || (error instanceof Error ? error.message : 'Audit failed.') }
  }

  // A clean pass — zero issues found — goes straight to approved rather
  // than sitting in "needs review" waiting for a human to confirm what the
  // Auditor already confirmed. Per direct instruction: a "review" verdict,
  // or a "pass" that still carries an issue note, still needs a human's
  // eyes; only a genuinely clean pass skips that step, to keep the
  // Editorial research panel from filling up with items that don't
  // actually need attention.
  const finalStatus = data.result.verdict === 'pass' && data.result.issues.length === 0
    ? 'approved'
    : data.result.verdict

  const { data: updated, error: dbError } = await supabase
    .from('editorial_items')
    .update({
      editorial_status: finalStatus,
      auditor_notes: data.result.issues,
      last_verified_at: new Date().toISOString(),
    })
    .eq('id', item.id)
    .select()
    .single()
  if (dbError || !updated) return { success: false, error: dbError?.message ?? 'Could not save audit result.' }
  return { success: true, item: updated as EditorialItemRow }
}

// Writes one source_article item for a specific valid source. Call once
// per source_assessment where source_valid is true — never for a
// rejected source (nothing to write about).
export async function writeSourceArticle(
  founderId: string,
  importedContentId: string | undefined,
  source: EvidenceLedger['source_assessments'][number],
): Promise<WriteResult> {
  if (!isSupabaseConfigured || !supabase) return { success: false, error: 'Not configured.' }
  const founder = getFounder(founderId)
  const ledger = founder?.evidenceLedger
  if (!founder || !ledger) return { success: false, error: 'Run research before writing.' }
  if (!source.source_valid) return { success: false, error: 'This source was assessed as invalid — nothing to write.' }

  const claims = ledger.claims.filter(c => c.human_review !== 'rejected')
  const { draft, error } = await callWriter('source_article', founder.name, claims, source)
  if (error || !draft) return { success: false, error: error ?? 'Writer returned nothing.' }

  const autoPublishAllowed = passesRiskGate(ledger)
  const { data, error: dbError } = await supabase
    .from('editorial_items')
    .insert({
      founder_id: founderId,
      imported_content_id: importedContentId ?? null,
      type: 'source_article',
      draft_content: { ...draft, byline: CULO_BYLINE },
      auto_publish_allowed: autoPublishAllowed,
    })
    .select()
    .single()
  if (dbError || !data) return { success: false, error: dbError?.message ?? 'Could not save draft.' }
  return { success: true, item: data as EditorialItemRow }
}

// A real status readout built only from what the data already records —
// not a background job queue. Nothing in this pipeline runs unattended
// yet: research, writing and auditing each still need a staff member's
// browser tab open to trigger them. Shared between the Editorial Queue's
// Pipeline Status board and each founder row in Bulk Import, so staff can
// see where a founder sits without expanding anything.
export function pipelineStage(founder: Founder, founderItems: EditorialItemRow[]): { label: string; color: string } {
  if (founder.researchStatus === 'researching') return { label: 'Researching…', color: 'bg-blue-50 text-blue-700' }
  if (founder.researchStatus === 'failed') return { label: 'Research failed', color: 'bg-red-50 text-red-600' }
  if (!founder.evidenceLedger) return { label: 'Not started', color: 'bg-[#F3EDE6] text-[#9CA3AF]' }
  if (founderItems.length === 0) return { label: 'Researched — ready to write', color: 'bg-blue-50 text-blue-700' }
  if (founderItems.some(i => i.editorial_status === 'approved')) return { label: 'Approved — ready to publish', color: 'bg-[#3E6E92]/10 text-[#3E6E92]' }
  if (founderItems.every(i => i.editorial_status === 'pending')) return { label: 'Written — awaiting audit', color: 'bg-amber-50 text-amber-700' }
  return { label: 'Audited — awaiting CAPO review', color: 'bg-amber-50 text-amber-700' }
}
