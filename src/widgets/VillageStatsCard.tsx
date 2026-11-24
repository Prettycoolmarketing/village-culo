import { Link } from 'react-router-dom'
import { locations } from '../data/locations'
import { getStories } from '../services/stories'
import { getFounders } from '../services/founders'
import { getBusinesses } from '../services/businesses'
import { getIdeas } from '../services/ideas'

// Extracted from HeroWidget.tsx's own "Village at a glance" stat strip so
// founder and business pages can show the same real, live counts instead of
// each page inventing its own version — publicOnly throughout, same
// definition the homepage and Archive already use, so a visitor sees the
// same numbers wherever this shows up.
function villageStats() {
  return [
    { count: getStories({ publicOnly: true }).length,    label: 'Stories',    href: '/stories' },
    { count: getFounders({ publicOnly: true }).length,   label: 'Founders',   href: '/founders' },
    { count: getBusinesses({ publicOnly: true }).length, label: 'Businesses', href: '/businesses' },
    { count: getIdeas({ publicOnly: true }).length,      label: 'Ideas',      href: '/ideas' },
    { count: locations.length,                           label: 'Locations', href: '/map' },
  ]
}

export function VillageStatsCard({ className = '' }: { className?: string }) {
  return (
    <aside
      className={`flex flex-col gap-6 bg-surface/80 backdrop-blur-sm rounded-2xl p-6 border border-border shadow-md min-w-[180px] ${className}`}
      aria-label="Village at a glance"
    >
      <p className="font-body text-xs font-semibold text-muted uppercase tracking-widest">
        Village
      </p>
      {villageStats().map(stat => (
        <Link
          key={stat.label}
          to={stat.href}
          className="group flex flex-col"
          aria-label={`${stat.count} ${stat.label} in the Village`}
        >
          <span className="font-heading text-3xl font-bold text-charcoal group-hover:text-primary transition-colors">
            {stat.count}
          </span>
          <span className="font-body text-xs text-muted group-hover:text-primary transition-colors">
            {stat.label}
          </span>
        </Link>
      ))}
    </aside>
  )
}
