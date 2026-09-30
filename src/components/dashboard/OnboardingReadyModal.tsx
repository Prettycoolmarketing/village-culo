import { getFounder, updateFounder } from '../../services/founders'
import { importedContentService } from '../../services/importedContent'
import type { Founder } from '../../types'

// The result of /join/setup's capture link. Mounted dashboard-wide (see
// DashboardLayout), not on the welcome page specifically — research can
// take over a minute, and a founder who didn't sit and wait for it may
// well have already moved on to Import Content or anywhere else by the
// time it's ready. Bio is already live on the founder record by this point
// (see runOnboardingResearch — bio is treated as final the moment it's
// written, same as the curated pipeline), but the article stays an
// unpublished ImportedContent draft: publishing it is still a real,
// separate, deliberate click.
export function OnboardingReadyModal({ founder }: { founder: Founder }) {
  const draftArticle = importedContentService.getAll({ founderId: founder.id })[0]
  const hasBio = !!founder.bio?.trim()

  async function dismiss(clearBio: boolean) {
    const live = getFounder(founder.id) ?? founder
    await updateFounder({ ...live, onboardingStatus: 'confirmed', bio: clearBio ? '' : live.bio })
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl max-w-md w-full px-8 py-8" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <h2 className="text-xl font-bold text-[#2D2A26] mb-1">
          {hasBio ? "Here's your profile" : "We couldn't find much yet"}
        </h2>
        {hasBio ? (
          <>
            <p className="text-sm text-[#9CA3AF] mb-4">{founder.name} · /founders/{founder.slug}</p>
            <p className="text-sm text-[#6B7280] leading-relaxed whitespace-pre-line max-h-48 overflow-y-auto mb-4">{founder.bio}</p>
            {draftArticle && (
              <div className="rounded-xl bg-[#FBF1EB] px-4 py-3 mb-5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#C86A43] mb-1">First article, ready to publish</p>
                <p className="text-sm font-semibold text-[#2D2A26]">{draftArticle.title}</p>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => void dismiss(false)}
                className="flex-1 text-sm font-semibold px-5 py-3 rounded-xl bg-[#C86A43] text-white hover:bg-[#b05a35] transition-colors"
              >
                Looks good, continue
              </button>
              <button
                onClick={() => void dismiss(true)}
                className="flex-1 text-sm font-semibold px-5 py-3 rounded-xl border border-[#E8E4DD] text-[#6B7280] hover:bg-[#FDFCFB] transition-colors"
              >
                I'll write it myself
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-[#6B7280] leading-relaxed mb-6">
              That link didn't give us enough to write from. No problem — import your previously posted content
              to be republished as individual web articles instead.
            </p>
            <button
              onClick={() => void dismiss(false)}
              className="w-full text-sm font-semibold px-5 py-3 rounded-xl bg-[#C86A43] text-white hover:bg-[#b05a35] transition-colors"
            >
              Got it
            </button>
          </>
        )}
      </div>
    </div>
  )
}
