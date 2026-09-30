import { getFounder, updateFounder } from './founders'
import { runFounderResearch } from './editorialResearch'
import { writeProfileBio, writeSourceArticle, runAudit } from './editorialItems'
import { importedContentService, buildDraftImport } from './importedContent'
import { normalizeBlogSpacing } from '../utils/blogFormatting'

// Runs the exact research → write → audit pipeline CAPO staff already
// trigger by hand for curated founders (see DashboardBulkImportPage's "run
// full pipeline"), automatically, for a brand-new self-serve signup's one
// capture link from /join/setup — no staff in the loop. onboardingStatus is
// what /dashboard/welcome polls to know when to stop showing the loading
// state, the same idea researchStatus already serves for the CAPO queue.
//
// Bio is written straight onto the founder record once it's ready, same as
// the curated pipeline treats it ("the draft IS the bio the moment it's
// written") — but the article is deliberately left as an ImportedContent
// draft, not published, so a brand-new founder sees and can edit what Culo
// wrote about them before anything about them goes live.
export async function runOnboardingResearch(founderId: string, link: string): Promise<void> {
  const seed = getFounder(founderId)
  if (!seed) return
  await updateFounder({ ...seed, onboardingStatus: 'researching' })

  const draft = buildDraftImport(founderId, link)
  await importedContentService.upsert(draft)

  const research = await runFounderResearch(founderId)
  if (!research.success || !research.ledger) {
    const founderAfter = getFounder(founderId)
    if (founderAfter) await updateFounder({ ...founderAfter, onboardingStatus: 'ready' })
    return
  }

  const bioResult = await writeProfileBio(founderId)
  if (bioResult.success && bioResult.item) {
    await runAudit(bioResult.item)
    const bioText = bioResult.item.draft_content?.body
    if (bioText) {
      const founderNow = getFounder(founderId)
      if (founderNow) await updateFounder({ ...founderNow, bio: bioText })
    }
  }

  const validSources = research.ledger.source_assessments.filter(s => s.source_valid)
  const primarySource = validSources.find(s => s.url === link) ?? validSources[0]
  if (primarySource) {
    const articleResult = await writeSourceArticle(founderId, draft.id, primarySource)
    if (articleResult.success && articleResult.item) {
      await runAudit(articleResult.item)
      if (articleResult.item.draft_content?.body) {
        await importedContentService.upsert({
          ...draft,
          title: articleResult.item.draft_content.title || draft.title,
          description: normalizeBlogSpacing(articleResult.item.draft_content.body),
        })
      }
    }
  }

  const founderFinal = getFounder(founderId)
  if (founderFinal) await updateFounder({ ...founderFinal, onboardingStatus: 'ready' })
}
