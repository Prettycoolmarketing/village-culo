import type { FeaturedInMatch } from '../../services/relationships'
import { normalizeUrl } from '../../utils/url'

// Public-facing recognition section — a founder/business/story appearing here
// means CAPO has genuinely created a `featured_in` edge to a real Source (see
// supabase/migrations/008_village_graph.sql). Renders nothing if empty: this
// is never a placeholder ("As featured in...") shown before there's anything
// real to show.

interface FeaturedInSectionProps {
  items: FeaturedInMatch[]
  headingId: string
  className?: string
}

export function FeaturedInSection({ items, headingId, className = '' }: FeaturedInSectionProps) {
  if (items.length === 0) return null

  return (
    <section aria-labelledby={headingId} className={className}>
      <h2 id={headingId} className="font-heading text-lg font-semibold text-charcoal mb-3">Featured In</h2>
      <div className="flex flex-wrap gap-2">
        {items.map(({ source, why }) => {
          const linkClass = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-sm text-charcoal hover:border-primary hover:text-primary transition-colors'
          return source.url ? (
            <a
              key={source.id}
              href={normalizeUrl(source.url)}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
              title={why}
            >
              <span className="font-medium">{source.name}</span>
            </a>
          ) : (
            <span key={source.id} className={linkClass} title={why}>
              <span className="font-medium">{source.name}</span>
            </span>
          )
        })}
      </div>
    </section>
  )
}
