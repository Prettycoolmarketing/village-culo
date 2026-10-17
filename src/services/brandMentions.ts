import { supabase, isSupabaseConfigured } from '../lib/supabase'

export class BrandMentionsError extends Error {}

// Scans a founder's own published story text for real brand/product names
// — run on demand from the Affiliate Links tab, never automatically, since
// it's a real AI call over potentially a lot of text.
export async function detectBrandMentions(
  text: string,
  founderName: string,
  ownBusinessNames: string[],
): Promise<string[]> {
  if (!isSupabaseConfigured || !supabase) throw new BrandMentionsError('Not configured.')
  if (!text.trim()) return []

  const { data, error } = await supabase.functions.invoke<{ brands?: string[]; error?: string }>(
    'extract-brand-mentions',
    { body: { text, founderName, ownBusinessNames } },
  )
  if (error) throw new BrandMentionsError(error.message)
  if (data?.error) throw new BrandMentionsError(data.error)
  return data?.brands ?? []
}
