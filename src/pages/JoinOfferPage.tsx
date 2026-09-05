import { Link, Navigate } from 'react-router-dom'
import { usePageMeta } from '../utils/usePageMeta'
import { useAuth } from '../contexts/AuthContext'
import { getCurrentFounder } from '../services/currentFounder'
import { COLLABORATOR_PAYMENT_LINK, buildPaymentUrl } from '../config/paymentLinks'
import { Navbar } from '../components/layout/Navbar'
import { Footer } from '../components/layout/Footer'
import { InnerContainer } from '../components/layout/PageContainer'

// The step after JoinConfirmPage's set-password screen. Payment is the
// actual point of this page (see the launch plan) — the Village option
// underneath is deliberately a quiet escape hatch, not a co-equal choice,
// so it doesn't visually compete with the $19/month offer. Profile details
// aren't captured here at all; a founder who skips can fill those in
// anytime from their dashboard.

export function JoinOfferPage() {
  usePageMeta({ title: 'Start creating', ogType: 'website' })
  const { user, loading } = useAuth()
  const founder = getCurrentFounder(user)

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

  const paymentUrl = buildPaymentUrl(COLLABORATOR_PAYMENT_LINK, founder.id, user?.email)
  const alreadyLockedIn = !!founder.creativeSubscription?.stripeSubscriptionId

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        <section className="relative overflow-hidden py-16 md:py-20 text-center" aria-labelledby="offer-heading">
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(135deg, #DCEBF5 0%, #EAF2F8 45%, #F3F7FA 100%)' }}
            aria-hidden="true"
          >
            <div
              className="absolute -top-32 -right-32 w-[550px] h-[550px] rounded-full opacity-50"
              style={{ background: 'radial-gradient(circle, #7CA9CC 0%, transparent 70%)' }}
            />
            <div
              className="absolute -bottom-24 -left-24 w-[450px] h-[450px] rounded-full opacity-30"
              style={{ background: 'radial-gradient(circle, #5E6B4A 0%, transparent 70%)' }}
            />
          </div>
          <InnerContainer className="relative">
            <p className="font-body text-xs font-semibold text-primary uppercase tracking-widest mb-4">
              Founding collaborator offer
            </p>
            <h1 id="offer-heading" className="font-heading text-3xl sm:text-4xl font-bold text-charcoal mb-4 leading-tight max-w-2xl mx-auto">
              Lock in free access to Culo Creatives in Canva until January 1, 2027
            </h1>
            <p className="font-body text-base text-muted max-w-xl mx-auto leading-relaxed mb-8">
              Add your payment details now and you're locked at <strong className="text-charcoal">$19/month AUD</strong>.
              <br /><br />
              Free until Jan 1, 2027, then $19/month AUD for as long as you stay subscribed. Wait, or cancel
              before then, and it's <strong className="text-charcoal">$25/month AUD</strong> like everyone else
              who joins later.
            </p>
            {alreadyLockedIn ? (
              <p className="font-heading text-lg font-semibold text-charcoal">You're locked in at $19/month AUD ✓</p>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href={paymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex px-8 py-4 bg-primary text-white text-base font-semibold rounded-xl hover:bg-[#b05a35] transition-colors"
                >
                  Lock in Culo Creatives in Canva, forever $19 a month
                </a>
                {/* Deliberately quieter than the orange CTA — the site's
                    established dark/secondary button, not a co-equal
                    high-contrast choice, since this is the less-likely path. */}
                <Link
                  to="/dashboard/welcome"
                  className="inline-flex px-8 py-4 bg-charcoal text-white text-base font-semibold rounded-xl hover:bg-[#1a1815] transition-colors"
                >
                  Not now, take me to my village dashboard
                </Link>
              </div>
            )}
          </InnerContainer>
        </section>

        <Footer />
      </main>
    </>
  )
}
