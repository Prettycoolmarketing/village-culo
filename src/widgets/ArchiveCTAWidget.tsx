import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface ArchiveCTAWidgetProps {
  className?: string
  variant?: 'default' | 'minimal' | 'dark'
}

export function ArchiveCTAWidget({ className = '', variant = 'default' }: ArchiveCTAWidgetProps) {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      navigate(`/archive?q=${encodeURIComponent(query.trim())}`)
    } else {
      navigate('/archive')
    }
  }

  if (variant === 'minimal') {
    return (
      <section
        className={`text-center py-10 ${className}`}
        aria-label="Search the archive"
      >
        <p className="font-body text-muted text-sm mb-3">
          Looking for something specific?
        </p>
        <a href="/archive" className="text-sm font-medium text-primary hover:text-[#b05a35] transition-colors">
          Search the Archive →
        </a>
      </section>
    )
  }

  if (variant === 'dark') {
    return (
      <section
        className={`bg-charcoal rounded-2xl p-10 md:p-14 text-center ${className}`}
        aria-labelledby="archive-cta-heading"
      >
        <p className="font-body text-xs font-semibold text-primary/80 uppercase tracking-widest mb-4">Archive</p>
        <h2
          id="archive-cta-heading"
          className="font-heading text-3xl md:text-4xl font-semibold text-white mb-4 leading-snug"
        >
          Every story ever published<br />
          <span className="text-primary">lives here forever.</span>
        </h2>
        <p className="font-body text-base text-white/60 max-w-lg mx-auto mb-8">
          Search the full Village knowledge base. Founders, businesses, stories, ideas and events — all in one place.
        </p>

        <form onSubmit={handleSearch} className="max-w-md mx-auto" role="search">
          <label htmlFor="archive-search-dark" className="sr-only">Search the archive</label>
          <div className="flex gap-3">
            <input
              id="archive-search-dark"
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search founders, stories, ideas..."
              className="flex-1 px-5 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
            />
            <button
              type="submit"
              className="px-5 py-3 bg-primary text-white text-sm font-medium rounded-xl hover:bg-[#b05a35] transition-colors flex-shrink-0"
            >
              Search
            </button>
          </div>
        </form>

        <p className="font-body text-xs text-white/30 mt-4">
          Searching across founders, businesses, stories, ideas, locations and events.
        </p>
      </section>
    )
  }

  // Default
  return (
    <section
      className={`bg-background border border-border rounded-2xl p-10 md:p-14 text-center ${className}`}
      aria-labelledby="archive-cta-heading-default"
    >
      <p className="font-body text-xs font-semibold text-primary uppercase tracking-widest mb-3">Archive</p>
      <h2
        id="archive-cta-heading-default"
        className="font-heading text-3xl md:text-4xl font-semibold text-charcoal mb-3 leading-snug"
      >
        What do you want to learn today?
      </h2>
      <p className="font-body text-base text-muted max-w-md mx-auto mb-8">
        Search the Village knowledge base. Everything ever published — indexed by founder, topic, location, business and idea.
      </p>

      <form onSubmit={handleSearch} className="max-w-md mx-auto" role="search">
        <label htmlFor="archive-search" className="sr-only">Search the Village archive</label>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              id="archive-search"
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Founder storytelling, Brisbane, AI marketing..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-surface text-charcoal placeholder:text-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-3 bg-primary text-white text-sm font-medium rounded-xl hover:bg-[#b05a35] transition-colors flex-shrink-0"
          >
            Search
          </button>
        </div>
      </form>

      <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
        <span className="font-body text-xs text-muted">Popular:</span>
        {['AI Marketing', 'Founder Storytelling', 'Camera Roll', 'Brisbane', 'Content Systems'].map(term => (
          <button
            key={term}
            type="button"
            onClick={() => navigate(`/archive?q=${encodeURIComponent(term)}`)}
            className="text-xs px-3 py-1 rounded-full border border-border text-muted hover:border-primary hover:text-primary transition-colors"
          >
            {term}
          </button>
        ))}
      </div>
    </section>
  )
}
