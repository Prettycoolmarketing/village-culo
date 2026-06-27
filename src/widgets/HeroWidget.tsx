import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { topics } from '../data/topics'

// Curated topic pills shown in the hero — highest-count topics
const popularTopics = topics
  .sort((a, b) => b.count - a.count)
  .slice(0, 8)

interface HeroWidgetProps {
  className?: string
}

export function HeroWidget({ className = '' }: HeroWidgetProps) {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    navigate(q ? `/archive?q=${encodeURIComponent(q)}` : '/archive')
  }

  return (
    <section
      className={`relative overflow-hidden ${className}`}
      aria-labelledby="hero-heading"
    >
      {/* ── Background ─────────────────────────────────────────────────────── */}
      <div className="absolute inset-0 bg-background" aria-hidden="true">
        {/* Warm decorative circle — top right */}
        <div
          className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #C86A43 0%, transparent 70%)' }}
        />
        {/* Olive circle — bottom left */}
        <div
          className="absolute -bottom-24 -left-24 w-[400px] h-[400px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #5E6B4A 0%, transparent 70%)' }}
        />
        {/* Subtle grid pattern */}
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.03]"
          aria-hidden="true"
        >
          <defs>
            <pattern id="village-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#2D2A26" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#village-grid)" />
        </svg>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20 md:pt-36 md:pb-28">
        <div className="max-w-3xl">

          {/* Eyebrow */}
          <p className="font-body text-sm font-semibold text-primary uppercase tracking-widest mb-6">
            CULO Village
          </p>

          {/* Headline */}
          <h1
            id="hero-heading"
            className="font-heading text-5xl sm:text-6xl md:text-7xl font-bold text-charcoal leading-[1.05] tracking-tight mb-5"
          >
            Every founder<br />
            has a story<br />
            <em className="not-italic text-primary">worth finding.</em>
          </h1>

          {/* Subheadline */}
          <p className="font-body text-lg md:text-xl text-muted leading-relaxed max-w-lg mb-10">
            Explore stories, ideas, businesses and people publishing real knowledge through CULO.
          </p>

          {/* Search */}
          <form
            onSubmit={handleSearch}
            role="search"
            aria-label="Search the Village"
            className="mb-8"
          >
            <label
              htmlFor="hero-search"
              className="block font-body text-sm font-semibold text-charcoal mb-2.5"
            >
              What do you want to learn today?
            </label>
            <div className="flex gap-2.5 max-w-xl">
              <div className="relative flex-1">
                <svg
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cloud/70 pointer-events-none"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  id="hero-search"
                  type="search"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Founder storytelling, Brisbane, AI marketing..."
                  className="
                    w-full pl-12 pr-4 py-4 rounded-2xl
                    border border-border bg-surface text-charcoal
                    placeholder:text-muted/60 text-base
                    shadow-search
                    focus:outline-none focus:ring-2 focus:ring-cloud/50 focus:border-cloud/30
                    transition-all duration-200
                  "
                />
              </div>
              <button
                type="submit"
                className="
                  px-6 py-4 bg-primary text-white font-semibold rounded-2xl
                  hover:bg-[#b05a35] active:bg-[#9a4d2d]
                  transition-colors duration-150 flex-shrink-0 shadow-sm
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-cloud focus-visible:ring-offset-2
                "
              >
                Search
              </button>
            </div>
          </form>

          {/* Popular topic pills */}
          <nav aria-label="Popular topics">
            <p className="font-body text-xs text-muted/70 font-semibold mb-3 uppercase tracking-widest">
              Popular topics
            </p>
            <ul className="flex flex-wrap gap-2" role="list">
              {popularTopics.map(topic => (
                <li key={topic.id}>
                  <Link
                    to={`/archive?q=${encodeURIComponent(topic.name)}`}
                    className="
                      inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full
                      bg-surface border border-border/80
                      font-body text-sm text-charcoal/75
                      hover:border-cloud/50 hover:text-cloud hover:bg-cloud/5
                      transition-all duration-150 shadow-sm
                    "
                  >
                    {topic.name}
                    <span className="text-xs text-muted/60">{topic.count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* ── Floating stat strip — right side on large screens ─────────────── */}
        <aside
          className="
            hidden lg:flex flex-col gap-5
            absolute right-8 top-1/2 -translate-y-1/2
            bg-surface/85 backdrop-blur-md rounded-2xl p-6
            border border-border/60 shadow-md
            min-w-[160px]
          "
          aria-label="Village at a glance"
        >
          <p className="font-body text-xs font-semibold text-muted/60 uppercase tracking-widest">
            Village
          </p>
          {[
            { count: '8', label: 'Stories',    href: '/stories'  },
            { count: '6', label: 'Founders',   href: '/founders' },
            { count: '5', label: 'Businesses', href: '/mercato'  },
            { count: '6', label: 'Ideas',      href: '/ideas'    },
            { count: '6', label: 'Locations',  href: '/map'      },
          ].map(stat => (
            <Link
              key={stat.label}
              to={stat.href}
              className="group flex flex-col"
              aria-label={`${stat.count} ${stat.label} in the Village`}
            >
              <span className="font-heading text-3xl font-bold text-charcoal group-hover:text-cloud transition-colors duration-150">
                {stat.count}
              </span>
              <span className="font-body text-xs text-muted group-hover:text-cloud transition-colors duration-150">
                {stat.label}
              </span>
            </Link>
          ))}
        </aside>
      </div>

      {/* ── Bottom fade into next section ────────────────────────────────────── */}
      <div
        className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-surface to-transparent pointer-events-none"
        aria-hidden="true"
      />
    </section>
  )
}
