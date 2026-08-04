import { PLATFORM_LABELS, detectPlatform, generateEmbedUrl } from '../../services/importedContent'
import { normalizeUrl, looksLikeChannelUrl, isDirectVideoUrl } from '../../utils/url'

// Shared video-content renderer — used on a Story's own page and on a
// Founder's profile (Featured Video section) so both places play/link a
// video identically instead of maintaining two copies.
export function ReelContent({ reelUrl, title, summary, landscape = false }: { reelUrl?: string; title: string; summary: string; landscape?: boolean }) {
  const isChannelLink = looksLikeChannelUrl(reelUrl)
  const isUploadedFile = isDirectVideoUrl(reelUrl)
  const platform = reelUrl ? detectPlatform(reelUrl) : undefined
  const embedUrl = reelUrl && platform && !isChannelLink && !isUploadedFile ? generateEmbedUrl(reelUrl, platform) : undefined
  const platformLabel = platform ? PLATFORM_LABELS[platform] : 'the original platform'

  return (
    <div className="flex flex-col sm:flex-row gap-6 items-start" aria-label="Video content">
      {/* Only an actual Reel gets the vertical phone frame — a landscape
          video (YouTube, talking head) stretched into 9:16 is what was
          reading as blurry/cropped. */}
      <div
        className={`flex-shrink-0 w-full mx-auto bg-charcoal rounded-2xl overflow-hidden relative ${
          landscape ? 'max-w-md sm:max-w-none sm:mx-0 sm:w-[28rem]' : 'max-w-[260px] sm:max-w-none sm:mx-0 sm:w-56'
        }`}
        style={{ aspectRatio: landscape ? '16/9' : '9/16' }}
        aria-label="Video preview"
      >
        {isUploadedFile ? (
          <video
            src={reelUrl}
            controls
            preload="metadata"
            className="absolute inset-0 w-full h-full object-contain bg-black"
          />
        ) : embedUrl ? (
          <iframe
            src={embedUrl}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        ) : (
          <>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">
                {isChannelLink ? (
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </div>
              <p className="font-body text-xs text-white/60 leading-relaxed">
                {isChannelLink ? `Visit their ${platformLabel} channel` : `Watch on ${platformLabel}`}
              </p>
            </div>
            {reelUrl && (
              <a
                href={normalizeUrl(reelUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute inset-0"
                aria-label={isChannelLink ? `Visit "${title}" on ${platformLabel}` : `Watch "${title}" on ${platformLabel}`}
              />
            )}
          </>
        )}
      </div>

      {/* Video context */}
      <div className="flex-1 min-w-0">
        <p className="font-body text-xs font-semibold text-primary uppercase tracking-widest mb-3">Video</p>
        <h3 className="font-heading text-xl font-semibold text-charcoal leading-snug mb-3">{title}</h3>
        {summary && <p className="font-body text-base text-muted leading-relaxed mb-5">{summary}</p>}
        {reelUrl && !isUploadedFile && (
          <a
            href={normalizeUrl(reelUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-charcoal text-white text-sm font-medium rounded-xl hover:bg-charcoal/80 transition-colors"
          >
            {isChannelLink ? `Visit ${platformLabel} channel` : `Watch on ${platformLabel}`} ↗
          </a>
        )}
      </div>
    </div>
  )
}
