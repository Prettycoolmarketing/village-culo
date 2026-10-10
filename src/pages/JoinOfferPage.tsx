import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { usePageMeta } from '../utils/usePageMeta'
import { useAuth } from '../contexts/AuthContext'
import { getCurrentFounder } from '../services/currentFounder'
import { Navbar } from '../components/layout/Navbar'
import { Footer } from '../components/layout/Footer'
import { InnerContainer } from '../components/layout/PageContainer'
import { ComingSoonModal } from '../components/ui/ComingSoonModal'

// The step after JoinConfirmPage's set-password screen. Used to send
// straight to real Stripe checkout — Creatives isn't open for new
// signups yet, so the CTA now opens a Coming Soon modal instead (see
// ComingSoonModal). The Village option underneath is deliberately a
// quiet escape hatch, not a co-equal choice. Profile details aren't
// captured here at all; a founder who skips can fill those in anytime
// from their dashboard.

export function JoinOfferPage() {
  usePageMeta({ title: 'Start creating', ogType: 'website' })
  const { user, loading } = useAuth()
  const founder = getCurrentFounder(user)
  // Declared before the early returns below (rules of hooks) even though
  // it's only rendered once there's a real founder.
  const [showComingSoon, setShowComingSoon] = useState(false)

  // AuthContext's session restore is async — on a fresh page load (a
  // redeploy, a refresh, opening the link again) `user` starts out null
  // for a moment before it resolves. Redirecting to /join on that instant
  // was kicking already-logged-in founders back to the start of the whole
  // funnel every single time. Wait for loading to finish before deciding
  // there's really no founder.
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  if (!founder) return <Navigate to="/join" replace />

  // Keyed off what the founder's record actually says they got at signup
  // (tier), not which door they came through (signupProduct) — every new
  // signup gets the Standard $25/mo, 14-day-trial tier now regardless of
  // /join vs /joincanva, but founders who signed up earlier under the old
  // Collaborator cohort (free until 2027-01-01) keep that deal. See
  // ensureJoinedFounder.
  const isStandardTier = founder.creativeSubscription?.tier === 'standard'
  const alreadyLockedIn = !!founder.creativeSubscription?.stripeSubscriptionId

  return (
    <>
      <Navbar dark />
      <main className="min-h-screen bg-background">
        <section className="relative overflow-hidden pt-24 pb-16 md:py-20 text-center" aria-labelledby="offer-heading">
          <div className="absolute inset-0 bg-background" aria-hidden="true">
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
            <p className="font-body text-xs font-semibold text-primary uppercase tracking-widest mb-4">
              Welcome to The Culo Village
            </p>
            {/* The old $19/month "founding rate" copy is gone — that rate
                is becoming a discount code handed out individually
                (waitlist + existing Village members once Creatives is
                live), not something anyone sees as a selectable price
                here. A founder already locked into that legacy Stripe
                subscription still sees their real existing plan below,
                unchanged — this is just the new-offer copy for everyone
                else, and Creatives isn't open for new signups yet either
                way (see the Coming Soon modal on the CTA). */}
            <h1 id="offer-heading" className="font-heading text-3xl sm:text-4xl font-bold text-charcoal mb-4 leading-tight max-w-2xl mx-auto">
              Culo Creatives in Canva
            </h1>
            <p className="font-body text-base text-muted max-w-xl mx-auto leading-relaxed mb-8">
              Turn your raw footage and messy thoughts into finished blogs, carousels and reels, right inside
              Canva. Coming soon — we'll let you know the moment it's open.
            </p>
            {alreadyLockedIn ? (
              <p className="font-heading text-lg font-semibold text-charcoal">
                {isStandardTier ? "You're on the $25/month plan ✓" : "You're locked in at your founding rate ✓"}
              </p>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => setShowComingSoon(true)}
                  className="inline-flex px-8 py-4 bg-primary text-white text-base font-semibold rounded-xl hover:bg-[#b05a35] transition-colors"
                >
                  Try Culo Creatives in Canva
                </button>
                {/* Deliberately quieter than the orange CTA — the site's
                    established dark/secondary button, not a co-equal
                    high-contrast choice, since this is the less-likely path. */}
                <Link
                  to="/dashboard/welcome"
                  className="inline-flex px-8 py-4 bg-charcoal text-white text-base font-semibold rounded-xl hover:bg-[#1a1815] transition-colors"
                >
                  Not Now, Take Me to My Village Dashboard
                </Link>
              </div>
            )}
            <ComingSoonModal open={showComingSoon} onClose={() => setShowComingSoon(false)} />
          </InnerContainer>
        </section>

        <Footer />
      </main>
    </>
  )
}
