import { supabase, isSupabaseConfigured } from '../lib/supabase'
import type { VillageImportPackage } from '../types/villageImport'

// Skips the manual "ask Claude elsewhere, paste the JSON back in" step —
// see supabase/functions/convert-spreadsheet-to-vif. Staff upload the .csv
// their spreadsheet exported directly; this calls the AI mapping edge
// function and hands back the same VillageImportPackage shape a hand-built
// VIF JSON file would, which then runs through the existing
// parseVIF/validateVIF/importVIF pipeline completely unchanged.

async function functionErrorMessage(error: unknown, fallback: string): Promise<string> {
  if (error && typeof error === 'object' && 'context' in error) {
    const ctx = (error as { context?: Response }).context
    if (ctx && typeof ctx.text === 'function') {
      try {
        const raw = (await ctx.text()).slice(0, 400)
        try {
          const parsed = JSON.parse(raw) as { message?: string; error?: string }
          return parsed.message || parsed.error || raw
        } catch {
          return raw
        }
      } catch { /* ignore, fall through */ }
    }
  }
  return error instanceof Error ? error.message : fallback
}

export async function convertSpreadsheetToVIF(csvText: string, batchName?: string): Promise<{ vif?: VillageImportPackage; error?: string }> {
  if (!isSupabaseConfigured || !supabase) return { error: 'Not available in this environment' }
  const { data, error } = await supabase.functions.invoke<{ vif?: VillageImportPackage; error?: string }>(
    'convert-spreadsheet-to-vif', { body: { csvText, batchName } },
  )
  if (error) return { error: await functionErrorMessage(error, 'Conversion failed.') }
  if (data?.error) return { error: data.error }
  if (!data?.vif) return { error: 'AI returned nothing usable' }
  return { vif: data.vif }
}

// Sibling to convertSpreadsheetToVIF, for raw messy text instead of a CSV —
// the common real case: a pasted Facebook comment thread full of real leads
// (name + business + link) mixed in with UI noise. See
// supabase/functions/convert-text-to-vif for the extraction rules.
export async function convertTextToVIF(rawText: string, batchName?: string): Promise<{ vif?: VillageImportPackage; error?: string }> {
  if (!isSupabaseConfigured || !supabase) return { error: 'Not available in this environment' }
  const { data, error } = await supabase.functions.invoke<{ vif?: VillageImportPackage; error?: string }>(
    'convert-text-to-vif', { body: { rawText, batchName } },
  )
  if (error) return { error: await functionErrorMessage(error, 'Conversion failed.') }
  if (data?.error) return { error: data.error }
  if (!data?.vif) return { error: 'AI returned nothing usable' }
  return { vif: data.vif }
}
