import { supabase, isSupabaseConfigured } from '../lib/supabase'

// MVP1 only — see supabase/functions/scrape-instagram-comments and
// CULO_Scrape_Founder_Qualification_Technical_Spec.md. One call, one
// Instagram URL, the raw accessible commenters back. No Australia
// filtering, no scoring, no storage — this is a data-quality test tool,
// not the qualification pipeline the full spec describes.

export interface LeadComment {
  displayName: string
  handle: string
  profileUrl: string
  commentText: string
  sourceUrl: string
  likeCount?: number
  createdAt?: string
}

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

export async function testInstagramCommentImport(url: string): Promise<{ comments?: LeadComment[]; error?: string }> {
  if (!isSupabaseConfigured || !supabase) return { error: 'Not available in this environment' }
  const { data, error } = await supabase.functions.invoke<{ comments?: LeadComment[]; error?: string }>(
    'scrape-instagram-comments', { body: { url } },
  )
  if (error) return { error: await functionErrorMessage(error, 'Import failed.') }
  if (data?.error) return { error: data.error }
  if (!data?.comments) return { error: 'No comments returned.' }
  return { comments: data.comments }
}
