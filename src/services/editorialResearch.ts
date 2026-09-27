import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { getFounder, updateFounder } from './founders'
import { importedContentService } from './importedContent'
import type { EvidenceLedger } from '../types/editorialEngine'

// Sprint 1 of the Culo Editorial Engine — Stage 1 (Researcher) only. This
// is deliberately not wired into Bulk Import yet; it's a manual, one-
// founder-at-a-time trigger so the pipeline can be proven on a real,
// known-good case (Vinisha Rathod) before anything touches a real batch.
// See supabase/functions/editorial-research and the build order agreed
// alongside it.

export interface ResearchResult {
  success: boolean
  ledger?: EvidenceLedger
  error?: string
}

// A founder's own content items are the source list — the same real links
// (article/YouTube/podcast/product) already curated, not a new input.
export async function runFounderResearch(founderId: string): Promise<ResearchResult> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: 'Research requires a configured Supabase project.' }
  }
  const founder = getFounder(founderId)
  if (!founder) return { success: false, error: 'Founder not found.' }

  const items = importedContentService.getAll({ founderId })
  const sources = items
    .filter(i => i.originalUrl)
    .map(i => ({
      importedContentId: i.id,
      url: i.originalUrl,
      sourceType: i.sourcePlatform === 'youtube' ? 'youtube' as const
        : i.sourcePlatform === 'podcast' ? 'podcast' as const
        : i.sourcePlatform === 'website' ? 'website' as const
        : 'other' as const,
    }))
  if (sources.length === 0) {
    return { success: false, error: 'This founder has no linked content to research yet.' }
  }

  await updateFounder({ ...founder, researchStatus: 'researching', researchRequestedAt: new Date().toISOString() })

  const { data, error } = await supabase.functions.invoke<{ ledger?: EvidenceLedger; error?: string }>(
    'editorial-research',
    {
      body: {
        founderId,
        founderName: founder.name,
        existingBio: founder.bio,
        existingHeadline: undefined,
        sources,
      },
    },
  )

  if (error || data?.error || !data?.ledger) {
    const message = data?.error || (error instanceof Error ? error.message : 'Research failed.')
    await updateFounder({ ...founder, researchStatus: 'failed' })
    return { success: false, error: message }
  }

  await updateFounder({
    ...founder,
    researchStatus: 'done',
    researchCompletedAt: new Date().toISOString(),
    evidenceLedger: data.ledger,
  })

  return { success: true, ledger: data.ledger }
}
