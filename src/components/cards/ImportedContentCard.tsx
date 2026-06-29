import { Link } from 'react-router-dom'
import type { ImportedContent } from '../../types/importedContent'
import type { VillageContentIntelligence } from '../../types/villageIntelligence'
import { PLATFORM_LABELS, PLATFORM_COLORS } from '../../services/importedContent'

const EMBEDDABLE = new Set(['youtube', 'vimeo', 'tiktok'])

interface Props {
  content: ImportedContent
  compact?: boolean
  intel?: VillageContentIntelligence
}

export function ImportedContentCard({ content, compact = false, intel }: Props) {
  const platformLabel = PLATFORM_LABELS[content.sourcePlatform]
  const platformColor = PLATFORM_COLORS[content.sourcePlatform]
  const canEmbed      = EMBEDDABLE.has(content.sourcePlatform) && !!content.embedUrl

  return (
    <article className="bg-surface rounded-2xl border border-border overflow-hidden">

      {/* Embed / placeholder */}
      {canEmbed ? (
        <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
          <iframe
            src={content.embedUrl}
            title={content.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
            loading="lazy"
          />
        </div>
      ) : content.thumbnailUrl ? (
        <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
          <img
            src={content.thumbnailUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      ) : !compact ? (
        <div className="bg-[#F3EDE6] flex items-center justify-center" style={{ height: '120px' }}>
          <PlatformIcon platform={content.sourcePlatform} />
        </div>
      ) : null}

      {/* Body */}
      <div className="p-4">
        {/* Platform badge + source link */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className={`font-body text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${platformColor}`}>
            {platformLabel}
          </span>
          <a
            href={content.originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-body text-[10px] text-muted hover:text-primary transition-colors"
            aria-label={`View on ${platformLabel}`}
          >
            View on {platformLabel} ↗
          </a>
        </div>

        {/* Title */}
        <h3 className={`font-heading font-semibold text-charcoal leading-snug ${compact ? 'text-sm' : 'text-base'}`}>
          {content.title}
        </h3>

        {/* Description */}
        {content.description && !compact && (
          <p className="font-body text-sm text-muted mt-2 leading-relaxed line-clamp-3">
            {content.description}
          </p>
        )}

        {/* Diary note */}
        {content.diaryNote && (
          <p className="font-body text-xs text-muted/80 mt-3 leading-relaxed border-l-2 border-border pl-3 italic">
            {content.diaryNote}
          </p>
        )}

        {/* Intelligence topic chips */}
        {intel && intel.primaryTopics.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {intel.primaryTopics.slice(0, compact ? 2 : 4).map(t => (
              <span
                key={t}
                className="font-body text-[9px] px-2 py-0.5 rounded-full bg-secondary/10 text-secondary"
              >
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Create with CULO CTA */}
        {!compact && (
          <div className="mt-3 pt-3 border-t border-border">
            <Link
              to="/dashboard/publish"
              className="font-body text-[10px] font-semibold text-primary hover:text-[#b05a35] transition-colors flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Turn this into content with CULO
            </Link>
          </div>
        )}
      </div>
    </article>
  )
}

function PlatformIcon({ platform }: { platform: string }) {
  const icons: Record<string, string> = {
    youtube:   'M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0l-4.5-2.6v5.2L16 12z',
    vimeo:     'M19.59 5.29c-.166 3.696-2.746 8.757-7.74 15.183C6.782 27.11 3.64 30.372 1.155 30.372c-1.488 0-2.745-1.374-3.77-4.12C-3.88 22.358-5.5 12.64-7.92 12.64c-.566 0-2.538 1.19-5.917 3.564l-1.782-2.296a1089.3 1089.3 0 006.637-5.92C-5.87 5.49-3.19 3.82-1.14 3.82c2.923 0 4.716 2.193 5.377 6.58.724 4.6 1.226 7.47 1.507 8.585.838 3.803 1.755 5.702 2.753 5.702.782 0 1.955-1.238 3.52-3.714 1.566-2.476 2.402-4.36 2.507-5.648.222-2.137-.618-3.203-2.507-3.203-.893 0-1.813.204-2.762.618 1.836-6.016 5.348-8.938 10.535-8.768z',
    instagram: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z',
    linkedin:  'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
    tiktok:   'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z',
    podcast:  'M12 1a11 11 0 100 22A11 11 0 0012 1zm0 4a7 7 0 110 14A7 7 0 0112 5zm0 3a4 4 0 100 8 4 4 0 000-8zm0 2a2 2 0 110 4 2 2 0 010-4z',
    website:  'M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14',
  }
  const svgPath = icons[platform] ?? icons.website
  return (
    <svg className="w-10 h-10 text-[#D6C5B5]" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d={svgPath} />
    </svg>
  )
}
