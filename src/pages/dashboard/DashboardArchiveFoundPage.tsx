import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { getCurrentFounderId } from '../../services/currentFounder'
import { getFounder } from '../../services/founders'
import { importedContentService } from '../../services/importedContent'
import { getUnlockedImportedIds, hasArchiveAccess } from '../../utils/archiveUnlock'
import { getArchiveTier, ARCHIVE_UNLOCK_FREE_COUNT } from '../../config/archiveUnlock'
import { buildPaymentUrl } from '../../config/paymentLinks'

// The "money screen" — shown once, right after an import, when a founder
// has more than the free preview count sitting in their archive. Full width
// (matches every other dashboard page, no artificial max-w) with one
// persistent dark CTA panel on the right rather than repeating the same
// pitch in three separate boxes down the page. Skipped entirely (see the
// "Go to Content" link on Import Content) once a founder has already
// unlocked, or if they genuinely have 10 or fewer pieces — there's nothing
// to sell someone who has nothing locked.
export function DashboardArchiveFoundPage() {
  const { user } = useAuth()
  const founderId = getCurrentFounderId(user) ?? 'dev-user'
  const founder = getFounder(founderId)
  if (!founder) return null

  const allImported = importedContentService.getAll({ founderId })
  const totalCount = allImported.length
  const unlockedIds = getUnlockedImportedIds(allImported, founder)
  const unlocked = allImported.filter(i => unlockedIds.has(i.id))
  const locked = allImported.filter(i => !unlockedIds.has(i.id))

  // Nothing to sell — either already unlocked, or the whole archive already
  // fits inside the free preview. Straight to Content instead.
  if (hasArchiveAccess(founder) || locked.length === 0) {
    return <Navigate to="/dashboard/profile?tab=content&contentSubTab=ready" replace />
  }

  const tier = getArchiveTier(totalCount)
  const previewMock = unlocked[0]
  const lockedShown = locked.slice(0, 12)

  return (
    <div className="p-8 sm:pt-14" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <p className="text-sm font-semibold text-[#C86A43] uppercase tracking-widest mb-3">We found your story</p>
      <h1 className="text-2xl sm:text-3xl font-bold text-[#2D2A26] mb-6 leading-tight">
        We have detected <span className="text-4xl sm:text-5xl text-[#C86A43]">{totalCount}</span>{' '}
        piece{totalCount === 1 ? '' : 's'} of your story
      </h1>

      <Link
        to="/dashboard/profile?tab=content&contentSubTab=ready"
        className="inline-flex items-center px-6 py-3.5 bg-[#C86A43] text-white text-base font-semibold rounded-xl hover:bg-[#b05a35] transition-colors mb-4"
      >
        Your {ARCHIVE_UNLOCK_FREE_COUNT} strongest posts are free, forever
      </Link>
      <div className="mb-8 max-w-2xl flex flex-col gap-2.5">
        <p className="text-base font-bold text-[#2D2A26]">Why publishing your archive here is worth it</p>
        <p className="text-sm text-[#6B7280] leading-relaxed">
          Every piece you publish here becomes a real web page of your own.
        </p>
        <p className="text-sm text-[#6B7280] leading-relaxed">
          Link it to your website or share it on LinkedIn, and it works as a genuine backlink pointing straight
          back to you, the kind of credibility a PR agency would normally charge you to build.
        </p>
        <p className="text-sm text-[#6B7280] leading-relaxed">
          A page-per-post archive like this is also exactly what AI search actually reads: structured articles,
          not a caption buried in someone else's feed, so it's how you get found there instead of staying
          invisible to it.
        </p>
        <p className="text-sm text-[#6B7280] leading-relaxed">
          Add the Village badge to your own site, and every one of those links leads straight back to you too.
        </p>
      </div>

      {/* The whole upsell, full width: the unlock stat is itself the
          button (no separate colored panel repeating the same pitch), next
          to a real preview of what it looks like once it's live. */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch mb-10 pt-6">
        {tier.paymentLink ? (
          <a
            href={buildPaymentUrl(tier.paymentLink, founder.id, user?.email)}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col justify-center gap-3 bg-[#FBF1EB] hover:bg-[#C86A43] border-2 border-[#C86A43]/20 rounded-2xl p-12 transition-colors"
          >
            <p className="text-lg font-semibold text-[#C86A43] group-hover:text-white/80 uppercase tracking-wide transition-colors">Waiting to be unlocked</p>
            <p className="text-8xl sm:text-9xl font-bold text-[#2D2A26] group-hover:text-white transition-colors">{locked.length}</p>
            <p className="text-xl font-semibold text-[#C86A43] group-hover:text-white transition-colors mt-2">
              Unlock now — {tier.priceLabel} →
            </p>
          </a>
        ) : (
          <a
            href={`mailto:support@prettycoolmarketing.com?subject=${encodeURIComponent(`Archive unlock — ${totalCount} pieces (${founder.name})`)}`}
            className="group flex flex-col justify-center gap-3 bg-[#FBF1EB] hover:bg-[#C86A43] border-2 border-[#C86A43]/20 rounded-2xl p-12 transition-colors"
          >
            <p className="text-lg font-semibold text-[#C86A43] group-hover:text-white/80 uppercase tracking-wide transition-colors">Waiting to be unlocked</p>
            <p className="text-8xl sm:text-9xl font-bold text-[#2D2A26] group-hover:text-white transition-colors">{locked.length}</p>
            <p className="text-xl font-semibold text-[#C86A43] group-hover:text-white transition-colors mt-2">
              Get a quote — {tier.priceLabel} →
            </p>
          </a>
        )}

        {/* A real, clickable preview of what one of these looks like once
            it's a real Village article — always one of the founder's
            actual free-10 pieces (never a locked one, nothing to preview
            there yet), grounding the pitch in something concrete. */}
        {previewMock && (
          <Link
            to={`/dashboard/preview/${previewMock.id}`}
            className="flex flex-col bg-white rounded-2xl border-2 border-[#E8E4DD] overflow-hidden hover:border-[#C86A43]/40 hover:shadow-lg transition-all"
          >
            <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide px-5 pt-5">What it looks like published</p>
            <img src={previewMock.thumbnailUrl} alt="" className="w-full aspect-video object-cover bg-[#F3EDE6] mt-3" />
            <div className="p-5">
              <p className="text-[10px] text-[#9CA3AF] uppercase tracking-widest mb-1.5">culovillage.com/founders/{founder.slug}/...</p>
              <p className="text-lg font-bold text-[#2D2A26] leading-snug mb-2">{previewMock.title}</p>
              <p className="text-sm text-[#6B7280] leading-relaxed line-clamp-3">
                {previewMock.description || previewMock.subtitle || 'Structured, searchable, and yours, republished as a real web page.'}
              </p>
            </div>
          </Link>
        )}
      </div>

      {/* The locked pieces themselves, underneath — blurred the same way
          Content's Ready to Publish tab shows a locked row, so this reads
          as one consistent "this is what's behind the paywall" treatment
          across both pages, rather than two different styles. */}
      <div>
        <p className="text-lg font-bold text-[#2D2A26] uppercase tracking-wide mb-3">Locked ({locked.length})</p>
        <div className="bg-white rounded-xl border border-[#E8E4DD] divide-y divide-[#F3EDE6]">
          {lockedShown.map(item => (
            <div key={item.id} className="flex items-center gap-4 px-5 py-4">
              <img src={item.thumbnailUrl} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0 bg-[#F3EDE6] opacity-40 grayscale" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#9CA3AF] truncate blur-[3px] select-none">{item.title}</p>
              </div>
            </div>
          ))}
          {locked.length > lockedShown.length && (
            <div className="px-5 py-3.5 text-sm text-[#9CA3AF]">
              + {locked.length - lockedShown.length} more
            </div>
          )}
        </div>

        {/* A second unlock CTA right at the bottom — a founder who's
            scrolled all the way through the blurred list shouldn't have to
            scroll back up to actually unlock it. */}
        {tier.paymentLink ? (
          <a
            href={buildPaymentUrl(tier.paymentLink, founder.id, user?.email)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 flex items-center justify-center w-full px-8 py-6 bg-[#FBF1EB] hover:bg-[#C86A43] border-2 border-[#C86A43]/20 rounded-2xl text-xl font-semibold text-[#C86A43] hover:text-white transition-colors"
          >
            Unlock all {locked.length} pieces — {tier.priceLabel} →
          </a>
        ) : (
          <a
            href={`mailto:support@prettycoolmarketing.com?subject=${encodeURIComponent(`Archive unlock — ${totalCount} pieces (${founder.name})`)}`}
            className="mt-6 flex items-center justify-center w-full px-8 py-6 bg-[#FBF1EB] hover:bg-[#C86A43] border-2 border-[#C86A43]/20 rounded-2xl text-xl font-semibold text-[#C86A43] hover:text-white transition-colors"
          >
            Get a quote — {tier.priceLabel} →
          </a>
        )}
      </div>
    </div>
  )
}
