import { Link } from 'react-router-dom'
import type { VillageContentIntelligence } from '../../types/villageIntelligence'

interface Props {
  intel: VillageContentIntelligence
  variant?: 'full' | 'sidebar'
}

export function VillageIntelligenceBlock({ intel, variant = 'full' }: Props) {
  const allQuestions = [...new Set([...intel.searchQuestions, ...intel.geoQuestions])]
  const displayQuestions = variant === 'sidebar' ? allQuestions.slice(0, 3) : allQuestions.slice(0, 6)
  const displayLessons   = variant === 'sidebar' ? intel.lessons.slice(0, 2) : intel.lessons.slice(0, 4)
  const allLocations     = [...new Set([...intel.cities, ...intel.regions, ...intel.countries])]

  const hasMeta    = intel.primaryTopics.length > 0 || allLocations.length > 0
  const hasSignals = displayLessons.length > 0 || intel.problems.length > 0 || intel.solutions.length > 0
  const hasQuestions = displayQuestions.length > 0

  if (!hasMeta && !hasSignals && !hasQuestions) return null

  return (
    <section
      className="bg-surface rounded-2xl border border-border p-5"
      aria-labelledby="village-intel-heading"
    >
      <h2 id="village-intel-heading" className="font-heading text-base font-semibold text-charcoal mb-4">
        Village Intelligence
      </h2>

      {/* Intent / Stage / Tone */}
      {variant === 'full' && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          <span className="font-body text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
            {intel.intent}
          </span>
          <span className="font-body text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-charcoal/10 text-charcoal">
            {intel.contentStage}
          </span>
          <span className="font-body text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-accent/15 text-amber-700">
            {intel.emotionalTone}
          </span>
        </div>
      )}

      {/* Primary Topics */}
      {intel.primaryTopics.length > 0 && (
        <div className="mb-4">
          <p className="font-body text-[10px] font-medium text-muted uppercase tracking-wide mb-2">Topics</p>
          <div className="flex flex-wrap gap-1.5" role="list" aria-label="Topics">
            {intel.primaryTopics.map(t => (
              <span
                key={t}
                role="listitem"
                className="font-body text-xs px-2.5 py-0.5 rounded-full bg-secondary/10 text-secondary"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Locations */}
      {allLocations.length > 0 && (
        <div className="mb-4">
          <p className="font-body text-[10px] font-medium text-muted uppercase tracking-wide mb-2">Locations</p>
          <div className="flex flex-wrap gap-1.5" role="list" aria-label="Locations">
            {allLocations.slice(0, 6).map(l => (
              <span
                key={l}
                role="listitem"
                className="font-body text-xs px-2.5 py-0.5 rounded-full bg-border text-charcoal/70"
              >
                {l}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* What this helps you understand */}
      {variant === 'full' && hasSignals && (
        <div className="mb-4 border-t border-border pt-4">
          <p className="font-body text-xs font-semibold text-charcoal mb-3">What this helps you understand</p>
          {displayLessons.length > 0 && (
            <ul className="space-y-1.5 mb-3">
              {displayLessons.map((l, i) => (
                <li key={i} className="font-body text-xs text-charcoal/80 leading-relaxed pl-3 border-l-2 border-secondary/30">
                  {l}
                </li>
              ))}
            </ul>
          )}
          {intel.solutions.length > 0 && (
            <ul className="space-y-1.5">
              {intel.solutions.slice(0, 2).map((s, i) => (
                <li key={i} className="font-body text-xs text-charcoal/70 leading-relaxed pl-3 border-l-2 border-primary/20 italic">
                  {s}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Industries (full only) */}
      {variant === 'full' && intel.industries.length > 0 && (
        <div className="mb-4">
          <p className="font-body text-[10px] font-medium text-muted uppercase tracking-wide mb-2">Industries</p>
          <div className="flex flex-wrap gap-1.5">
            {intel.industries.map(i => (
              <span key={i} className="font-body text-xs px-2.5 py-0.5 rounded-full bg-primary/5 text-primary/80">
                {i}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Questions this answers */}
      {hasQuestions && (
        <div className="border-t border-border pt-4">
          <p className="font-body text-xs font-semibold text-charcoal mb-3">Questions this answers</p>
          <ul className="space-y-2" role="list">
            {displayQuestions.map((q, i) => (
              <li key={i} className="font-body text-xs text-muted leading-relaxed italic">
                {q}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-border flex items-center justify-between flex-wrap gap-2">
        <p className="font-body text-[9px] text-muted/50">
          Village Intelligence · Engine v{intel.engineVersion}
        </p>
        <Link
          to="/dashboard/publish"
          className="font-body text-[10px] font-semibold text-primary hover:text-[#b05a35] transition-colors flex items-center gap-1"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Create with CULO
        </Link>
      </div>
    </section>
  )
}
