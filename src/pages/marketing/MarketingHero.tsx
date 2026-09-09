import type { ReactNode } from 'react'
import { InnerContainer } from '../../components/layout/PageContainer'

/**
 * The hero at the top of every PCM funnel. Two columns on desktop:
 * left = kicker + title + description, right = the price / payment card
 * (or, on the landing page, the primary CTAs). Stacks on mobile.
 *
 * Palette: Culo Village branding — the soft blue/olive radial-gradient
 * background used on the homepage and /join, then a light background with
 * white cards below.
 */
export function MarketingHero({
  kicker,
  title,
  description,
  right,
}: {
  kicker: string
  title: ReactNode
  description: ReactNode
  right?: ReactNode
}) {
  return (
    <section className="relative overflow-hidden bg-background py-16 md:py-24 border-b border-border">
      {/* Soft radial gradient — same as the homepage / Join hero */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #7CA9CC 0%, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-24 -left-24 w-[400px] h-[400px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #5E6B4A 0%, transparent 70%)' }}
        />
      </div>
      <InnerContainer className="relative">
        <div className={`grid gap-10 lg:gap-16 items-center ${right ? 'lg:grid-cols-2' : ''}`}>
          {/* Left — the pitch */}
          <div>
            <p className="font-body text-xs font-semibold text-charcoal/70 uppercase tracking-widest mb-4">
              {kicker}
            </p>
            <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-bold text-charcoal leading-tight mb-6">
              {title}
            </h1>
            <div className="font-body text-base sm:text-lg text-charcoal/80 leading-relaxed max-w-xl [&_a]:text-charcoal [&_a]:underline">
              {description}
            </div>
          </div>

          {/* Right — price / payment / CTA */}
          {right && (
            <div className="lg:justify-self-end w-full lg:max-w-sm">
              {right}
            </div>
          )}
        </div>
      </InnerContainer>
    </section>
  )
}

/** The price card that sits in the hero's right column on the offer pages. */
export function MarketingPriceCard({
  price,
  cadence,
  note,
  children,
}: {
  price: string
  cadence: string
  note?: string
  children: ReactNode
}) {
  return (
    <div className="bg-[#EBF2F8] border border-[#CFE0EE] rounded-2xl p-8 shadow-lg">
      <p className="font-heading text-4xl font-bold text-charcoal">{price}</p>
      <p className="font-body text-sm text-muted mt-1 mb-5">{cadence}</p>
      {children}
      {note && <p className="font-body text-xs text-muted mt-3">{note}</p>}
    </div>
  )
}
