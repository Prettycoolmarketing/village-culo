import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { getCurrentFounderId } from '../../services/currentFounder'
import { getFounder } from '../../services/founders'
import { importedContentService, PLATFORM_LABELS as IMPORT_PLATFORM_LABELS } from '../../services/importedContent'
import { getUnlockedImportedIds, hasArchiveAccess } from '../../utils/archiveUnlock'
import { getArchiveTier, ARCHIVE_UNLOCK_FREE_COUNT } from '../../config/archiveUnlock'
import { buildPaymentUrl } from '../../config/paymentLinks'
import { SourceIcon } from '../../components/ui/SourceIcon'

// The "money screen" — shown once, right after an import, when a founder
// has more than the free preview count sitting in their archive. Full width
// (matches every other dashboard page, no artificial max-w) with one
// persistent dark CTA panel on the right rather than repeating the same
// pitch in three separate boxes down the page. Skipped entirely (see the
// "Go to Content" link on Import Content) once a founder has already
// unlocked, or if they genuinely have 10 or fewer pieces — there's nothing
// to sell someone who has nothing locked.
export function DashboardArchiveFoundPage() {
  const [showWhy, setShowWhy] = useState(false)
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

  const unlockButton = (className: string) =>
    tier.paymentLink ? (
      <a
        href={buildPaymentUrl(tier.paymentLink, founder.id, user?.email)}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        Unlock your archive — {tier.priceLabel}
      </a>
    ) : (
      <a
        href={`mailto:support@prettycoolmarketing.com?subject=${encodeURIComponent(`Archive unlock — ${totalCount} pieces (${founder.name})`)}`}
        className={className}
      >
        Get a quote — {tier.priceLabel}
      </a>
    )

  return (
    <div className="p-8 sm:pt-14" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <p className="text-sm font-semibold text-[#C86A43] uppercase tracking-widest mb-3">We found your story</p>
      <h1 className="text-3xl sm:text-4xl font-bold text-[#2D2A26] mb-3">
        {totalCount} piece{totalCount === 1 ? '' : 's'} of your story, detected
      </h1>
      <p className="text-sm text-[#6B7280] mb-2 max-w-2xl">
        Your{' '}
        <Link to="/dashboard/profile?tab=content&contentSubTab=ready" className="text-[#C86A43] font-semibold hover:underline">
          {ARCHIVE_UNLOCK_FREE_COUNT} strongest posts
        </Link>{' '}
        are free, forever.
      </p>
      <button
        onClick={() => setShowWhy(v => !v)}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#C86A43] hover:text-[#b05a35] transition-colors mb-6"
      >
        Why publishing your archive here is worth it
        <svg className={`w-3.5 h-3.5 transition-transform ${showWhy ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {showWhy && (
        <div className="bg-[#FBF1EB] border border-[#C86A43]/20 rounded-xl p-5 mb-8 max-w-2xl">
          <p className="text-sm text-[#2D2A26] leading-relaxed">
            Every piece you publish here becomes a real web page of your own — link it to your website or share it
            on LinkedIn, and it works as a genuine backlink pointing straight back to you, the kind of credibility a
            PR agency would normally charge you to build. A page-per-post archive like this is also exactly what AI
            search actually reads — structured articles, not a caption buried in someone else's feed — so it's how
            you get found there instead of staying invisible to it. Add the Village badge to your own site, and
            every one of those links leads straight back to you too.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 items-start">
        {/* Left: the actual case for unlocking — what's waiting, and what it
            looks like once it's live. */}
        <div className="flex flex-col gap-8 min-w-0">
          <div>
            <p className="text-xs font-semibold text-[#C86A43] uppercase tracking-wide mb-3">
              Waiting to be unlocked ({locked.length})
            </p>
            <div className="bg-white rounded-xl border border-[#E8E4DD] overflow-hidden grid grid-cols-1 sm:grid-cols-2">
              {lockedShown.map((item, i) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 px-5 py-3.5 border-b border-[#F3EDE6] ${i % 2 === 0 ? 'sm:border-r' : ''}`}
                >
                  <img src={item.thumbnailUrl} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0 bg-[#F3EDE6]" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <SourceIcon platform={item.sourcePlatform} size="sm" />
                      <p className="text-sm font-semibold text-[#2D2A26] truncate">{item.title}</p>
                    </div>
                    <p className="text-xs text-[#9CA3AF] mt-0.5">{IMPORT_PLATFORM_LABELS[item.sourcePlatform] ?? item.sourcePlatform}</p>
                  </div>
                  <svg className="w-3.5 h-3.5 text-[#C86A43] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              ))}
              {locked.length > lockedShown.length && (
                <div className="px-5 py-3.5 text-sm text-[#9CA3AF] sm:col-span-2 border-t border-[#F3EDE6]">
                  + {locked.length - lockedShown.length} more
                </div>
              )}
            </div>
          </div>

          {/* A real, clickable preview of what one of these looks like once
              it's a real Village article — always one of the founder's
              actual free-10 pieces (never a locked one, nothing to preview
              there yet), grounding the pitch in something concrete. */}
          {previewMock && (
            <div className="max-w-xl">
              <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide mb-3">What it looks like published</p>
              <Link
                to={`/dashboard/preview/${previewMock.id}`}
                className="block bg-white rounded-xl border border-[#E8E4DD] overflow-hidden hover:border-[#C86A43]/40 hover:shadow-lg transition-all"
              >
                <img src={previewMock.thumbnailUrl} alt="" className="w-full aspect-video object-cover bg-[#F3EDE6]" />
                <div className="p-5">
                  <p className="text-[10px] text-[#9CA3AF] uppercase tracking-widest mb-1.5">culovillage.com/founders/{founder.slug}/...</p>
                  <p className="text-lg font-bold text-[#2D2A26] leading-snug mb-2">{previewMock.title}</p>
                  <p className="text-sm text-[#6B7280] leading-relaxed line-clamp-3">
                    {previewMock.description || previewMock.subtitle || 'Structured, searchable, and yours — republished as a real web page.'}
                  </p>
                </div>
              </Link>
            </div>
          )}
        </div>

        {/* Right: one persistent CTA, not repeated three times down the
            page. Dark charcoal like the site's other primary panels (see
            Profile > Content's "Create with CULO in Canva" block), so it
            reads as the one clear next step rather than another white card
            blending into the rest. */}
        <div className="lg:sticky lg:top-8 bg-[#2D2A26] rounded-2xl p-7 flex flex-col gap-4">
          <div>
            <p className="text-xl font-bold text-white mb-1.5">
              {locked.length} more piece{locked.length === 1 ? '' : 's'} waiting
            </p>
            <p className="text-sm text-white/60 leading-relaxed">
              Keep your Village free with your {ARCHIVE_UNLOCK_FREE_COUNT} strongest pieces, or bring your complete{' '}
              {totalCount}-piece archive in for good.
            </p>
          </div>
          {unlockButton('flex items-center justify-center w-full px-5 py-3.5 bg-[#C86A43] text-white text-sm font-semibold rounded-xl hover:bg-[#b05a35] transition-colors')}
          <Link
            to="/dashboard/profile?tab=content&contentSubTab=ready"
            className="text-center text-sm font-medium text-white/50 hover:text-white transition-colors"
          >
            Stay free with {ARCHIVE_UNLOCK_FREE_COUNT}
          </Link>
        </div>
      </div>
    </div>
  )
}
