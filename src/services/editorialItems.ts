import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { getFounder } from './founders'
import { passesRiskGate } from './editorialEngine'
import type { EvidenceLedger } from '../types/editorialEngine'

// Culo Editorial Engine, Sprint 2 — Stage 2 (Writer). Directly against the
// editorial_items table (no local cache layer yet — this is a low-volume,
// manual-trigger feature for now, not something read on every page load).

export interface EditorialItemRow {
  id: string
  founder_id: string
  imported_content_id: string | null
  type: 'profile_bio' | 'source_article'
  draft_content: { title?: string; body: string; claim_ids_used?: string[] } | null
  editorial_status: 'pending' | 'pass' | 'review' | 'reject'
  auto_publish_allowed: boolean
  created_at: string
}

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
      draft_content: draft,
      auto_publish_allowed: autoPublishAllowed,
    })
    .select()
    .single()
  if (dbError || !data) return { success: false, error: dbError?.message ?? 'Could not save draft.' }
  return { success: true, item: data as EditorialItemRow }
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
      draft_content: draft,
      auto_publish_allowed: autoPublishAllowed,
    })
    .select()
    .single()
  if (dbError || !data) return { success: false, error: dbError?.message ?? 'Could not save draft.' }
  return { success: true, item: data as EditorialItemRow }
}
