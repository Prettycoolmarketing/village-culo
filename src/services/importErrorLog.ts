import { supabase } from '../lib/supabase'

// Every self-serve import form shows a failure inline (setError) and stops
// there — nothing was ever persisted, so staff had no way to know an import
// path was broken until a founder happened to mention it. Confirmed real:
// the YouTube API key broke for an unknown stretch with zero trace anywhere.
// Best-effort and fire-and-forget on purpose — logging a failure must never
// itself become a second failure the founder has to deal with.
export type ImportSourceType = 'youtube' | 'podcast-rss' | 'website-rss' | 'instagram' | 'snapchat' | 'mention-article' | 'episode'

export function logImportError(founderId: string, sourceType: ImportSourceType, message: string, inputValue?: string): void {
  if (!supabase) return
  void supabase.from('founder_import_errors').insert({
    id: crypto.randomUUID(),
    founder_id: founderId,
    source_type: sourceType,
    message: message.slice(0, 2000),
    input_value: inputValue?.slice(0, 2000),
  }).then(({ error }) => {
    if (error) console.error('[importErrorLog] Could not log import error', error)
  })
}
