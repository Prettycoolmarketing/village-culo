import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { topics } from '../data/topics'
import { VillageStatsCard } from './VillageStatsCard'

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
        {/* Sky-blue decorative circle — top right, soft Mediterranean-cloud feel */}
        <div
          className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #7CA9CC 0%, transparent 70%)' }}
        />
        {/* Olive circle — bottom left */}
        <div
          className="absolute -bottom-24 -left-24 w-[400px] h-[400px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #5E6B4A 0%, transparent 70%)' }}
        />
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
            className="font-heading text-5xl sm:text-6xl md:text-7xl font-bold text-charcoal leading-[1.05] mb-6"
          >
            Raw Footage And Content<br />
            <span className="text-primary">Spread Across Platforms?</span>
          </h1>

          {/* Subheadline — leads with the Village's real, live benefit
              (republishing, today) before the Creatives/Canva teaser, not
              after. Confirmed real: three separate outside cold-outreach
              tools, reading this page unprompted, each summarised CULO
              Creatives as the main product and the Village as a "waitlist"
              feeding it — the reverse of reality (the Village is live now,
              Creatives is the one still coming). All three read the old
              order (Canva mentioned first) and weighted it as the headline
              fact. */}
          <p className="font-body text-lg md:text-xl text-muted leading-relaxed max-w-xl mb-6">
            The Culo Village republishes your existing posts as individual web articles, live today, so people and
            AI tools can find your work. Join now and you'll be first in line when Culo Creatives — our editing
            app coming to Canva — launches.
          </p>

          <Link
            to="/join"
            className="inline-flex items-center justify-center px-6 py-3 mb-10 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-[#b05a35] transition-colors"
          >
            Join the Village
          </Link>

          {/* Search */}
          <form
            onSubmit={handleSearch}
            role="search"
            aria-label="Search the Village"
            className="mb-8"
          >
            <label
              htmlFor="hero-search"
              className="block font-body text-sm font-medium text-charcoal mb-2"
            >
              What do you want to learn today?
            </label>
            <div className="flex gap-3 max-w-lg">
              <div className="relative flex-1">
                <svg
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted pointer-events-none"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
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
                    placeholder:text-muted text-base
                    shadow-card
                    focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                    transition-shadow
                  "
                />
              </div>
              <button
                type="submit"
                className="
                  px-6 py-4 bg-primary text-white font-medium rounded-2xl
                  hover:bg-[#b05a35] active:bg-[#9a4d2d]
                  transition-colors flex-shrink-0 shadow-card
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
                "
              >
                Search
              </button>
            </div>
          </form>

          {/* Popular topic pills */}
          <nav aria-label="Popular topics">
            <p className="font-body text-xs text-muted font-medium mb-3 uppercase tracking-wide">
              Popular topics
            </p>
            <ul className="flex flex-wrap gap-2" role="list">
              {popularTopics.map(topic => (
                <li key={topic.id}>
                  <Link
                    to={`/archive?q=${encodeURIComponent(topic.name)}`}
                    className="
                      inline-flex items-center px-4 py-1.5 rounded-full
                      bg-surface border border-border
                      font-body text-sm text-charcoal
                      hover:border-primary hover:text-primary hover:bg-primary/5
                      transition-all duration-150
                      shadow-sm
                    "
                  >
                    {topic.name}
                    <span className="ml-1.5 text-xs text-muted">{topic.count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <Link
            to="/founders"
            className="inline-flex items-center justify-center px-6 py-3 mt-8 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-[#b05a35] transition-colors"
          >
            Explore the Village
          </Link>
        </div>

        {/* ── Floating stat strip — right side on large screens ─────────────── */}
        <VillageStatsCard className="hidden lg:flex absolute right-8 top-1/2 -translate-y-1/2" />
      </div>

      {/* ── Bottom fade into next section ────────────────────────────────────── */}
      <div
        className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-surface to-transparent pointer-events-none"
        aria-hidden="true"
      />
    </section>
  )
}
