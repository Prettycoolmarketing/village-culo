import React from 'react'
import { Link } from 'react-router-dom'
import { locations } from '../data/locations'
import { getStoriesByLocation } from '../data/stories'
import { SectionHeading } from '../components/layout/PageContainer'

interface MapPreviewWidgetProps {
  heading?: string
  subheading?: string
  action?: { label: string; href: string }
  limit?: number
  className?: string
}

export function MapPreviewWidget({
  heading = 'Explore by Location',
  subheading = 'Discover founders, businesses and stories from across Australia.',
  action = { label: 'View Map', href: '/map' },
  limit = 6,
  className = '',
}: MapPreviewWidgetProps) {
  const displayLocations = locations.slice(0, limit)

  return (
    <section aria-label={heading} className={className}>
      <SectionHeading title={heading} subtitle={subheading} action={action} />

      <div
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4"
        role="list"
        aria-label="Locations"
      >
        {displayLocations.map(location => {
          const storyCount = getStoriesByLocation(location.id).length
          return (
            <article
              key={location.id}
              role="listitem"
              aria-label={`${location.name} — ${storyCount} ${storyCount === 1 ? 'story' : 'stories'}`}
            >
              <Link
                to={`/map?location=${location.slug}`}
                className="group block rounded-2xl overflow-hidden shadow-card hover:shadow-md transition-all duration-300"
              >
                {/* Location image */}
                <div className="relative overflow-hidden" style={{ aspectRatio: '3/4' }}>
                  <img
                    src={location.image}
                    alt={`${location.name}, ${location.state}, Australia`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-charcoal/10 to-transparent" aria-hidden="true" />

                  {/* Location info overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <h3 className="font-heading text-sm font-semibold text-white leading-tight">
                      {location.name}
                    </h3>
                    <p className="font-body text-xs text-white/70">{location.state}</p>
                    <p className="font-body text-xs text-white/60 mt-1">
                      {storyCount > 0
                        ? `${storyCount} ${storyCount === 1 ? 'story' : 'stories'}`
                        : 'Be first'
                      }
                    </p>
                  </div>
                </div>
              </Link>
            </article>
          )
        })}
      </div>
    </section>
  )
}
