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
import { writeProfileBio, runAudit, writeArticlesFromLedger, getEditorialItems } from './editorialItems'

export interface PipelineResult {
  researched: boolean
  bioWritten: boolean
  articlesWritten: number
  error?: string
}

export async function runFullEditorialPipeline(founderId: string): Promise<PipelineResult> {
  try {
    return await runFullEditorialPipelineInner(founderId)
  } catch (err) {
    // Confirmed real: nothing in this function (or its bulk-loop caller,
    // VillageCuratedFoundersPage's runResearchSelected) ever caught an
    // unexpected exception — one founder hitting something unforeseen
    // (a network blip, an unexpected API response shape) killed the
    // WHOLE batch loop outright, leaving every founder after it
    // completely unprocessed (research never run, nothing written) and
    // the progress bar frozen forever with no error ever shown — read by
    // staff as "it just stopped." Every known failure mode inside this
    // pipeline already returns a proper {error} result; this is the
    // backstop for the unknown ones, so a single founder's genuinely
    // unexpected failure can never take the rest of a bulk run with it.
    return { researched: false, bioWritten: false, articlesWritten: 0, error: err instanceof Error ? err.message : 'Unexpected error.' }
  }
}

async function runFullEditorialPipelineInner(founderId: string): Promise<PipelineResult> {
  const founder = getFounder(founderId)
  if (!founder) return { researched: false, bioWritten: false, articlesWritten: 0, error: 'Founder not found.' }

  // Never silently re-run a founder that's already been researched
  // (duplicate drafts/audits, real API spend for nothing new) —
  // re-researching on purpose is still the explicit "Re-run research"
  // button inside Edit. But a ledger existing doesn't mean this founder
  // is actually done: confirmed real — a bulk run that died partway
  // through (see runFullEditorialPipeline's own catch above) left
  // founders with a completed ledger and ZERO editorial_items, since the
  // write step never got a chance to run for them. The old version of
  // this guard treated "has a ledger" as "fully done" and skipped them
  // outright, meaning simply re-selecting and re-running the bulk button
  // couldn't recover them either — it'd silently no-op every time. Now
  // only skips research itself (never redone), and still resumes
  // straight into writing from the existing ledger if nothing's been
  // written yet.
  let ledger = founder.evidenceLedger
  if (ledger) {
    const existingItems = await getEditorialItems(founderId)
    if (existingItems.length > 0) return { researched: false, bioWritten: false, articlesWritten: 0 }
  } else {
    const research = await runFounderResearch(founderId)
    if (!research.success || !research.ledger) {
      return { researched: false, bioWritten: false, articlesWritten: 0, error: research.error ?? 'Research failed.' }
    }
    ledger = research.ledger
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

  const articlesWritten = await writeArticlesFromLedger(founderId, ledger)

  return { researched: true, bioWritten, articlesWritten }
}
