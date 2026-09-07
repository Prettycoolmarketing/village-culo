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
// has more than the free preview count sitting in their archive. Shows
// them their own strongest pieces already ready, a mock-up of what one
// looks like published, and one clear choice: stay free with the preview,
// or unlock everything they just brought in. Skipped entirely (see the
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
  const previewRest = unlocked.slice(0, ARCHIVE_UNLOCK_FREE_COUNT)

  return (
    <div className="p-8 max-w-5xl" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <p className="text-sm font-semibold text-[#C86A43] uppercase tracking-widest mb-2">We found your story</p>
      <h1 className="text-2xl sm:text-3xl font-bold text-[#2D2A26] mb-2">
        {totalCount} piece{totalCount === 1 ? '' : 's'} of your story, detected
      </h1>
      <p className="text-sm text-[#6B7280] mb-8 max-w-2xl">
        Your {ARCHIVE_UNLOCK_FREE_COUNT} strongest pieces are ready to publish free, right now. The rest of what you
        just imported — {locked.length} more — is safely sitting there, waiting to be added to your Village.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 mb-10">
        <div>
          <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide mb-3">
            Ready now — free, forever
          </p>
          <div className="bg-white rounded-xl border border-[#E8E4DD] divide-y divide-[#F3EDE6]">
            {previewRest.map(item => (
              <div key={item.id} className="flex items-center gap-4 px-5 py-3.5">
                <img src={item.thumbnailUrl} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0 bg-[#F3EDE6]" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <SourceIcon platform={item.sourcePlatform} size="sm" />
                    <p className="text-sm font-semibold text-[#2D2A26] truncate">{item.title}</p>
                  </div>
                  <p className="text-xs text-[#9CA3AF] mt-0.5">{IMPORT_PLATFORM_LABELS[item.sourcePlatform] ?? item.sourcePlatform}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* A mock-up of what one of these looks like once it's a real
            Village article — grounds the abstract "unlock your archive"
            pitch in something concrete they're already looking at. */}
        {previewMock && (
          <div>
            <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide mb-3">What it looks like published</p>
            <div className="bg-white rounded-xl border border-[#E8E4DD] overflow-hidden">
              <img src={previewMock.thumbnailUrl} alt="" className="w-full aspect-video object-cover bg-[#F3EDE6]" />
              <div className="p-4">
                <p className="text-[10px] text-[#9CA3AF] uppercase tracking-widest mb-1">culovillage.com/founders/{founder.slug}</p>
                <p className="text-base font-bold text-[#2D2A26] leading-snug mb-1.5">{previewMock.title}</p>
                <p className="text-xs text-[#6B7280] leading-relaxed line-clamp-3">
                  {previewMock.description || previewMock.subtitle || 'Structured, searchable, and yours — republished as a real web page.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border-2 border-[#E8E4DD] p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <p className="text-lg font-bold text-[#2D2A26] mb-1">
            {locked.length} more piece{locked.length === 1 ? '' : 's'} waiting in your archive
          </p>
          <p className="text-sm text-[#6B7280]">
            Keep your Village completely free and publish your {ARCHIVE_UNLOCK_FREE_COUNT} strongest pieces, or
            bring your complete {totalCount}-piece archive in for good.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
          <Link
            to="/dashboard/profile?tab=content&contentSubTab=ready"
            className="px-5 py-3 text-sm font-semibold text-[#6B7280] hover:text-[#2D2A26] transition-colors"
          >
            Stay free with {ARCHIVE_UNLOCK_FREE_COUNT}
          </Link>
          {tier.paymentLink ? (
            <a
              href={buildPaymentUrl(tier.paymentLink, founder.id, user?.email)}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-[#C86A43] text-white text-sm font-semibold rounded-xl hover:bg-[#b05a35] transition-colors whitespace-nowrap"
            >
              Complete my archive — {tier.priceLabel}
            </a>
          ) : (
            <a
              href={`mailto:support@prettycoolmarketing.com?subject=${encodeURIComponent(`Archive unlock — ${totalCount} pieces (${founder.name})`)}`}
              className="px-6 py-3 bg-[#C86A43] text-white text-sm font-semibold rounded-xl hover:bg-[#b05a35] transition-colors whitespace-nowrap"
            >
              Get a quote — {tier.priceLabel}
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
