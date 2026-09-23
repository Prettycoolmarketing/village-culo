import { Link } from 'react-router-dom'
import { PLATFORM_LABELS, detectPlatform, generateEmbedUrl } from '../../services/importedContent'
import { normalizeUrl, looksLikeChannelUrl, isDirectVideoUrl } from '../../utils/url'

// Shared video-content renderer — used on a Story's own page and on a
// Founder's profile (Featured Video section) so both places play/link a
// video identically instead of maintaining two copies.
export function ReelContent({ reelUrl, title, summary, landscape = false, storyHref }: {
  reelUrl?: string
  title: string
  summary: string
  landscape?: boolean
  // Set only when this card is a preview of a DIFFERENT story than the page
  // it's rendered on (e.g. a founder profile's "Watch" list) — the CTA then
  // keeps the visitor on the Village, going to that story's own page,
  // instead of sending them straight to YouTube. Left unset when this is a
  // story's own page rendering its own video, where "watch on YouTube" is
  // the only sensible external option (there's no other article to send
  // them to).
  storyHref?: string
}) {
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
        // A fixed sm:w-[28rem]/sm:w-56 used to force this wider than
        // whatever container it was actually placed in (e.g. a sidebar
        // column, or a founder profile's main column), overflowing or
        // squeezing the text sibling down to one word per line. It still
        // squeezed after switching to max-w, because sm:max-w-none and
        // sm:max-w-[28rem] set the same CSS property at the same
        // breakpoint — Tailwind's generated order between a core utility
        // and an arbitrary-value one isn't the JSX order, so max-w-none
        // sometimes won and silently uncapped the width back to sm:w-full.
        // shrink (not shrink-0) plus min-w-0 lets it actually give up space
        // to the text sibling in a narrow container instead of just
        // capping out in a roomy one.
        className={`shrink min-w-0 w-full mx-auto bg-charcoal rounded-2xl overflow-hidden relative ${
          landscape ? 'max-w-md sm:mx-0 sm:max-w-[28rem]' : 'max-w-[260px] sm:mx-0 sm:max-w-56'
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
                {storyHref ? 'Read the story' : isChannelLink ? `Visit their ${platformLabel} channel` : `Watch on ${platformLabel}`}
              </p>
            </div>
            {storyHref ? (
              <Link to={storyHref} className="absolute inset-0" aria-label={`Read "${title}"`} />
            ) : reelUrl && (
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
        {storyHref ? (
          // A preview of another story (e.g. a founder profile's "Watch"
          // list) — keeps the visitor on the Village reading that story,
          // rather than routing them straight out to YouTube/Instagram/etc.
          <Link
            to={storyHref}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-charcoal text-white text-sm font-medium rounded-xl hover:bg-charcoal/80 transition-colors"
          >
            Read the story →
          </Link>
        ) : reelUrl && !isUploadedFile && (
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
