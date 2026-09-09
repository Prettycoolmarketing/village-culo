import type { ReactNode } from 'react'
import { InnerContainer } from '../../components/layout/PageContainer'

/**
 * The dark hero at the top of every PCM funnel. Two columns on desktop:
 * left = kicker + title + description, right = the price / payment card
 * (or, on the landing page, the primary CTAs). Stacks on mobile.
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
    <section className="bg-pcm-dark py-16 md:py-24">
      <InnerContainer>
        <div className={`grid gap-10 lg:gap-16 items-center ${right ? 'lg:grid-cols-2' : ''}`}>
          {/* Left — the pitch */}
          <div>
            <p className="font-body text-xs font-semibold text-pcm-orange uppercase tracking-widest mb-4">
              {kicker}
            </p>
            <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
              {title}
            </h1>
            <div className="font-body text-base sm:text-lg text-white/70 leading-relaxed max-w-xl">
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
    <div className="bg-pcm-sand rounded-2xl p-7 shadow-lg">
      <p className="font-heading text-4xl font-bold text-pcm-ink">{price}</p>
      <p className="font-body text-sm text-pcm-muted mt-1 mb-5">{cadence}</p>
      {children}
      {note && <p className="font-body text-xs text-pcm-muted mt-3">{note}</p>}
    </div>
  )
}
