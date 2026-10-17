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
//
// `identifier` is either a real link (https://...) OR just a bare
// username/handle (e.g. "@shakasdesign") — a founder shouldn't have to
// know or go find the exact URL of their own most-used account. A link
// seeds a draft import up front, same as always. A handle has no URL to
// seed anything from yet, so it's stashed as a research hint instead (same
// field — claimNotes — a curated founder's background notes already feed
// into identityHints with zero source links, see runFounderResearch) and
// runFounderResearch's own web search is what actually finds their real
// profiles (LinkedIn included) from it. Once research returns, whichever
// source it found (or the exact link, if one was given) becomes the first
// article's source — the draft import for a handle only gets built here,
// after research has actually found a real URL to build it from.
export async function runOnboardingResearch(founderId: string, identifier: string): Promise<void> {
  const seed = getFounder(founderId)
  if (!seed) return
  await updateFounder({ ...seed, onboardingStatus: 'researching' })

  // Everything below this point was NOT wrapped — if writeSourceArticle,
  // runAudit, or any other step threw, the whole function died silently
  // and the founder stayed on onboardingStatus 'researching' forever, with
  // no error, no recovery, and sometimes a half-built empty draft import
  // left behind (confirmed real: a test signup's handle resolved to a
  // source the writer choked on, leaving a "1 item imported" draft with no
  // title/description and the founder stuck mid-research indefinitely).
  // This guarantees onboardingStatus always reaches 'ready' — success or
  // failure — the same resilience already applied to runFounderResearch's
  // own researchStatus handling.
  let draft: ReturnType<typeof buildDraftImport> | null = null
  try {
    const isLink = /^https?:\/\//i.test(identifier)
    draft = isLink ? buildDraftImport(founderId, identifier) : null
    if (draft) {
      draft.staffCreated = true
      await importedContentService.upsert(draft)
    } else {
      const founderBeforeResearch = getFounder(founderId)
      if (founderBeforeResearch) {
        await updateFounder({
          ...founderBeforeResearch,
          claimNotes: [founderBeforeResearch.claimNotes, `Most known username/handle: ${identifier}`].filter(Boolean).join('. '),
        })
      }
    }

    const research = await runFounderResearch(founderId)
    if (!research.success || !research.ledger) return

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
    const primarySource = validSources.find(s => s.url === identifier) ?? validSources[0]
    if (primarySource) {
      // A handle never got a draft import built up front — build one now,
      // from whichever real source research actually found.
      if (!draft) {
        draft = buildDraftImport(founderId, primarySource.url)
        draft.staffCreated = true
        await importedContentService.upsert(draft)
      }
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
  } catch (err) {
    console.error('runOnboardingResearch failed', err)
  } finally {
    // A draft that never actually got a written article (research failed,
    // writeSourceArticle choked, or the whole thing threw) is just a
    // placeholder with a generic "Imported from X" title and no real
    // description — not worth leaving behind as a phantom "1 item" in
    // Content with nothing in it to review. Clean it up rather than make a
    // founder go find and delete junk themselves.
    if (draft) {
      const finalState = importedContentService.get(draft.id)
      if (finalState && !finalState.description?.trim()) {
        await importedContentService.delete(draft.id)
      }
    }
    const founderFinal = getFounder(founderId)
    if (founderFinal) await updateFounder({ ...founderFinal, onboardingStatus: 'ready' })
  }
}
