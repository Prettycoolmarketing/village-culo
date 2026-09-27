import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { getFounder, updateFounder } from './founders'
import { importedContentService } from './importedContent'
import { getBusinesses } from './businesses'
import type { EvidenceLedger } from '../types/editorialEngine'

// Stage 1 (Researcher). A founder's own imported content items are the
// natural place to start — real links (article/YouTube/podcast/product)
// already curated — but they're never a requirement: a founder curated
// from a spreadsheet with no links yet still gets researched from their
// name and whatever identifying info exists (bio, business, location,
// industry). That spreadsheet data is there to help find the right
// person, not to gate whether research runs at all — see identityHints
// below, and the same "unverified lead, not a fact" discipline that
// already applies to existingBio.
export interface ResearchResult {
  success: boolean
  ledger?: EvidenceLedger
  error?: string
}

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

  const business = getBusinesses({ founderId })[0]
  const identityHints = [
    business ? `Runs ${business.name}${business.description ? ` (${business.description})` : ''}` : undefined,
    founder.industry?.name ? `Industry: ${founder.industry.name}` : undefined,
    founder.location?.name ? `Based in ${founder.location.name}, ${founder.location.state}` : undefined,
  ].filter(Boolean).join('. ')

  await updateFounder({ ...founder, researchStatus: 'researching', researchRequestedAt: new Date().toISOString() })

  const { data, error } = await supabase.functions.invoke<{ ledger?: EvidenceLedger; error?: string }>(
    'editorial-research',
    {
      body: {
        founderId,
        founderName: founder.name,
        existingBio: founder.bio,
        identityHints: identityHints || undefined,
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
