import { Link } from 'react-router-dom'
import type { LibraryItem } from '../../types'
import { productTypeLabel, statusLabel } from '../../data/library'
import { normalizeUrl } from '../../utils/url'

interface LibraryCardProps {
  item: LibraryItem
  variant?: 'default' | 'compact' | 'featured'
}

const statusColour: Record<string, string> = {
  'available':     'bg-secondary/15 text-secondary',
  'free-download': 'bg-secondary/15 text-secondary',
  'coming-soon':   'bg-muted/20 text-muted',
  'pre-order':     'bg-accent/15 text-[#8a6a1e]',
  'sold-out':      'bg-border text-muted',
  'early-access':  'bg-primary/15 text-primary',
  'members-only':  'bg-primary/15 text-primary',
  'external':      'bg-border text-charcoal',
}

export function LibraryCard({ item, variant = 'default' }: LibraryCardProps) {
  const typeLabel   = productTypeLabel[item.productType] ?? item.productType
  const statusBadge = statusLabel[item.status] ?? item.status
  const colour      = statusColour[item.status] ?? 'bg-border text-charcoal'

  if (variant === 'compact') {
    return (
      <article className="group flex gap-3 bg-surface rounded-xl border border-border p-3 hover:border-primary hover:shadow-sm transition-all">
        {/* Thumbnail */}
        <Link to={`/library/${item.slug}`} className="flex-shrink-0" aria-hidden="true" tabIndex={-1}>
          <div className="w-14 h-20 rounded-lg overflow-hidden bg-border">
            <img
              src={item.coverImage}
              alt=""
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          </div>
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-body text-xs text-muted">{typeLabel}</span>
            <span className={`font-body text-xs font-semibold px-1.5 py-0.5 rounded-full ${colour}`}>
              {statusBadge}
            </span>
          </div>
          <h3 className="font-heading text-sm font-semibold text-charcoal leading-snug mb-1">
            <Link
              to={`/library/${item.slug}`}
              className="hover:text-primary transition-colors focus:outline-none focus-visible:underline"
            >
              {item.title}
            </Link>
          </h3>
          {item.price && item.status !== 'free-download' && item.status !== 'coming-soon' && (
            <p className="font-body text-xs font-semibold text-primary">{item.price}</p>
          )}
          {item.status === 'free-download' && (
            <p className="font-body text-xs font-semibold text-secondary">Free</p>
          )}
        </div>
      </article>
    )
  }

  return (
    <article className="group flex flex-col bg-surface rounded-2xl border border-border overflow-hidden hover:border-primary hover:shadow-md transition-all duration-200">
      {/* Cover */}
      <Link to={`/library/${item.slug}`} className="block relative overflow-hidden" style={{ aspectRatio: '3/2' }} aria-hidden="true" tabIndex={-1}>
        <img
          src={item.coverImage}
          alt=""
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 via-transparent to-transparent" aria-hidden="true" />
        {/* Type + status overlay */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <span className="font-body text-xs font-semibold bg-charcoal/80 text-white/90 px-2 py-0.5 rounded-full backdrop-blur-sm">
            {typeLabel}
          </span>
          <span className={`font-body text-xs font-semibold px-2 py-0.5 rounded-full ${colour}`}>
            {statusBadge}
          </span>
        </div>
        {/* Price bottom-right */}
        {item.price && item.status !== 'free-download' && (
          <div className="absolute bottom-3 right-3">
            <span className="font-heading text-sm font-bold text-white bg-charcoal/70 px-2.5 py-1 rounded-xl backdrop-blur-sm">
              {item.price}
            </span>
          </div>
        )}
        {item.status === 'free-download' && (
          <div className="absolute bottom-3 right-3">
            <span className="font-heading text-sm font-bold text-white bg-secondary/80 px-2.5 py-1 rounded-xl backdrop-blur-sm">
              Free
            </span>
          </div>
        )}
      </Link>

      {/* Body */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-heading text-base font-semibold text-charcoal leading-snug mb-1">
          <Link
            to={`/library/${item.slug}`}
            className="hover:text-primary transition-colors focus:outline-none focus-visible:underline"
          >
            {item.title}
          </Link>
        </h3>

        {item.subtitle && (
          <p className="font-body text-xs text-muted leading-relaxed mb-3 line-clamp-2">
            {item.subtitle}
          </p>
        )}

        {/* Topics */}
        {item.topics.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {item.topics.slice(0, 2).map(t => (
              <span key={t.id} className="font-body text-xs bg-secondary/10 text-secondary px-2 py-0.5 rounded-full">
                {t.name}
              </span>
            ))}
          </div>
        )}

        {/* Purchase links */}
        <div className="mt-auto pt-4 border-t border-border">
          {item.purchaseLinks.length === 1 ? (
            <a
              href={normalizeUrl(item.purchaseLinks[0].url)}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center px-4 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-[#b05a35] transition-colors"
              aria-label={`${item.purchaseLinks[0].label} — ${item.title}`}
            >
              {item.purchaseLinks[0].label}
            </a>
          ) : (
            <div className="flex flex-wrap gap-2">
              {item.purchaseLinks.map((link, i) => (
                <a
                  key={i}
                  href={normalizeUrl(link.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex-1 text-center px-3 py-2 text-xs font-semibold rounded-xl transition-colors ${
                    i === 0
                      ? 'bg-primary text-white hover:bg-[#b05a35]'
                      : 'border border-border text-charcoal hover:border-primary hover:text-primary'
                  }`}
                  aria-label={`${link.label} — ${item.title}`}
                >
                  {link.label}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
