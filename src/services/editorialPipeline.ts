// Shared, single-founder version of the full editorial pipeline
// (Research -> Write bio -> Audit -> Write one article per valid source ->
// Audit each) — extracted from DashboardBulkImportPage's
// handleRunEditorialPipeline so a single-founder creation flow (the
// Curated Founder Builder) can run the exact same real pipeline instead of
// just the research step. Deliberately has no progress-step callbacks the
// bulk page's UI needs (a progress bar across many founders) — just runs
// start to finish and reports what happened, for a caller that only cares
// about one founder at a time.

import { getFounder, updateFounder } from './founders'
import { runFounderResearch } from './editorialResearch'
import { writeProfileBio, runAudit, writeArticlesFromLedger } from './editorialItems'

export interface PipelineResult {
  researched: boolean
  bioWritten: boolean
  articlesWritten: number
  error?: string
}

export async function runFullEditorialPipeline(founderId: string): Promise<PipelineResult> {
  const founder = getFounder(founderId)
  if (!founder) return { researched: false, bioWritten: false, articlesWritten: 0, error: 'Founder not found.' }

  // Same guard as the bulk pipeline — never silently re-run a founder
  // that's already been researched (duplicate drafts/audits, real API
  // spend for nothing new). Re-researching on purpose is still the
  // explicit "Re-run research" button inside Edit.
  if (founder.evidenceLedger) return { researched: false, bioWritten: false, articlesWritten: 0 }

  const research = await runFounderResearch(founderId)
  if (!research.success || !research.ledger) {
    return { researched: false, bioWritten: false, articlesWritten: 0, error: research.error ?? 'Research failed.' }
  }

  // Confirmed real bug: this only ever wrote the researched bio into the
  // editorial_items DRAFT table, auditing it there — never into the
  // founder's actual `bio` field. A founder published straight after
  // running this still showed the old generic curatedBio template, since
  // nothing had copied the real researched bio across (same persistBio
  // step FounderEditModal's BioDraftBlock does manually — this is that,
  // automatic, so Publish has something real to publish without a
  // separate manual step in between).
  //
  // Second confirmed real bug, found right alongside it: this copied the
  // draft into `bio` completely regardless of auto_publish_allowed (the
  // Risk Gate's verdict) — a low-identity-confidence research run still
  // got its AI-written bio published straight to the live profile every
  // time, even though the panel told staff "Needs human review before
  // anything is written." A blocked draft now stays in editorial_items for
  // a human to read in Edit (see FounderEditModal's BioDraftBlock) instead
  // of overwriting the real bio on its own.
  let bioWritten = false
  const bioResult = await writeProfileBio(founderId)
  if (bioResult.success && bioResult.item?.draft_content?.body) {
    const audited = await runAudit(bioResult.item)
    bioWritten = audited.success
    if (bioResult.item.auto_publish_allowed) {
      const latest = getFounder(founderId) ?? founder
      await updateFounder({ ...latest, bio: bioResult.item.draft_content.body })
    }
  }

  const articlesWritten = await writeArticlesFromLedger(founderId, research.ledger)

  return { researched: true, bioWritten, articlesWritten }
}
