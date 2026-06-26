import React from 'react'
import { Link } from 'react-router-dom'
import { filterEvents } from '../utils/filters'
import { EventCard } from '../components/cards/EventCard'
import { SectionHeading } from '../components/layout/PageContainer'

interface NoticeboardPreviewWidgetProps {
  heading?: string
  subheading?: string
  limit?: number
  className?: string
}

export function NoticeboardPreviewWidget({
  heading = 'Noticeboard',
  subheading = 'Events, collaborations and opportunities from the Village.',
  limit = 3,
  className = '',
}: NoticeboardPreviewWidgetProps) {
  const events = filterEvents({ limit })

  return (
    <section aria-label={heading} className={className}>
      <SectionHeading
        title={heading}
        subtitle={subheading}
        action={{ label: 'View All', href: '/noticeboard' }}
      />

      {events.length === 0 ? (
        <div className="text-center py-10">
          <p className="font-body text-muted text-sm">Nothing on the noticeboard yet. Check back soon.</p>
        </div>
      ) : (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          role="list"
          aria-label={`${events.length} notices`}
        >
          {events.map(event => (
            <div key={event.id} role="listitem">
              <EventCard event={event} variant="default" />
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 text-center">
        <Link
          to="/noticeboard"
          className="inline-flex items-center gap-2 px-6 py-3 border-2 border-primary text-primary text-sm font-medium rounded-xl hover:bg-primary hover:text-white transition-colors"
        >
          View All Events &amp; Opportunities
        </Link>
      </div>
    </section>
  )
}
