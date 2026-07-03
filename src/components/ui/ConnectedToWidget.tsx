import { Link } from 'react-router-dom'
import type { ConnectedToMatch } from '../../services/relationships'

// The Wikipedia-style "connected to" surface from planning: one ranked list
// spanning every entity type, powered entirely by the graph (explicit edges +
// the one derived signal, similar-topic founders). Deliberately secondary —
// it supplements the page's specific Related Founders/Businesses/Stories
// sections rather than replacing them, and renders nothing until real edges
// exist. Ranked by confidence, never a flat unranked dump of raw edges.

const TYPE_LABEL: Record<ConnectedToMatch['entityType'], string> = {
  founder: 'Founder', business: 'Business', story: 'Story', idea: 'Idea',
}

const RELATIONSHIP_LABEL: Record<ConnectedToMatch['relationshipType'], string> = {
  owned_by: 'Owner', written_by: 'Author', mentions: 'Mentioned',
  featured_in: 'Featured In', imported_from: 'Imported', created_with: 'Created With',
  works_with: 'Collaborator', similar_topic: 'Similar Topics',
}

interface ConnectedToWidgetProps {
  items: ConnectedToMatch[]
  headingId: string
  className?: string
}

export function ConnectedToWidget({ items, headingId, className = '' }: ConnectedToWidgetProps) {
  if (items.length === 0) return null

  return (
    <section aria-labelledby={headingId} className={className}>
      <h2 id={headingId} className="font-heading text-lg font-semibold text-charcoal mb-3">Connected To</h2>
      <ul className="flex flex-col gap-1.5" role="list">
        {items.map(item => (
          <li key={`${item.entityType}:${item.entityId}`}>
            <Link
              to={item.url}
              title={item.why}
              className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg border border-border hover:border-primary transition-colors group"
            >
              <span className="min-w-0">
                <span className="text-sm text-charcoal group-hover:text-primary transition-colors truncate block">{item.label}</span>
                <span className="text-xs text-muted">{TYPE_LABEL[item.entityType]}</span>
              </span>
              <span className="text-[10px] font-medium text-muted uppercase tracking-wide shrink-0">
                {RELATIONSHIP_LABEL[item.relationshipType]}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
