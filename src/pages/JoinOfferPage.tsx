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
        <section className="bg-charcoal py-16 md:py-20 text-center">
          <InnerContainer>
            <p className="font-body text-xs font-semibold text-primary uppercase tracking-widest mb-4">
              Founding collaborator offer
            </p>
            <h1 className="font-heading text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight max-w-2xl mx-auto">
              Lock in free access to Culo Creatives in Canva until January 1, 2027
            </h1>
            <p className="font-body text-base text-white/70 max-w-xl mx-auto leading-relaxed mb-8">
              Add your payment details now and you're locked at <strong className="text-white">$19/month</strong> —
              free until Jan 1, 2027, then $19/month for as long as you stay subscribed. Wait, or cancel before
              then, and it's <strong className="text-white">$25/month</strong> like everyone else who joins later.
            </p>
            {alreadyLockedIn ? (
              <p className="font-heading text-lg font-semibold text-white">You're locked in at $19/month ✓</p>
            ) : (
              <a
                href={paymentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex px-8 py-4 bg-primary text-white text-base font-semibold rounded-xl hover:bg-[#b05a35] transition-colors"
              >
                Lock in Culo Creatives in Canva — $19/month
              </a>
            )}
          </InnerContainer>
        </section>

        {/* ── Quiet escape hatch, not a second offer — a founder who isn't
            ready to pay yet is still already a Village member either way,
            so this is just "skip for now," not a real second choice. */}
        <section className="py-10 text-center">
          <InnerContainer>
            <Link
              to="/dashboard/welcome"
              className="font-body text-sm text-muted hover:text-charcoal transition-colors"
            >
              Not now, take me to my dashboard →
            </Link>
          </InnerContainer>
        </section>

        <Footer />
      </main>
    </>
  )
}
