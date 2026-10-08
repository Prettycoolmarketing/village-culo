import { supabase, isSupabaseConfigured } from '../lib/supabase'
import type { LeadComment } from './leadSources'

// Persisted version of a LeadComment — Lead Sources' search results are
// ephemeral (gone on the next search), this is the "actually keep this
// one" list. One row per Instagram handle (see migration 043's unique
// index) — saving someone already saved just refreshes their row (latest
// comment/source) rather than duplicating them.
export interface SourcedLead extends LeadComment {
  savedAt: string
}

export async function getSourcedLeads(): Promise<SourcedLead[]> {
  if (!isSupabaseConfigured || !supabase) return []
  const { data, error } = await supabase.from('sourced_leads').select('data').order('created_at', { ascending: false })
  if (error || !data) return []
  return data.map(r => r.data as SourcedLead)
}

export async function saveSourcedLeads(leads: LeadComment[]): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured || !supabase) return { success: false, error: 'Not configured.' }
  if (leads.length === 0) return { success: true }
  const now = new Date().toISOString()
  const rows = leads.map(lead => ({
    id: crypto.randomUUID(),
    handle: lead.handle,
    data: { ...lead, savedAt: now } as SourcedLead,
  }))
  const { error } = await supabase.from('sourced_leads').upsert(rows, { onConflict: 'handle' })
  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function removeSourcedLead(handle: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured || !supabase) return { success: false, error: 'Not configured.' }
  const { error } = await supabase.from('sourced_leads').delete().eq('handle', handle)
  if (error) return { success: false, error: error.message }
  return { success: true }
}
