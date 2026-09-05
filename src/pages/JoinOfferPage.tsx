import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { usePageMeta } from '../utils/usePageMeta'
import { useAuth } from '../contexts/AuthContext'
import { getCurrentFounder } from '../services/currentFounder'
import { updateFounder } from '../services/founders'
import { COLLABORATOR_PAYMENT_LINK, buildPaymentUrl } from '../config/paymentLinks'
import { Navbar } from '../components/layout/Navbar'
import { Footer } from '../components/layout/Footer'
import { InnerContainer } from '../components/layout/PageContainer'

// The step after JoinConfirmPage's set-password screen — styled like a
// founder profile (the thing they're actually building) with the pricing
// lock-in offer up top. Every field here is optional and "Continue" always
// works — per the brief, this needs to feel like a founder profile they're
// filling in, not a signup form blocking them from moving on.

export function JoinOfferPage() {
  usePageMeta({ title: 'Lock in your rate', ogType: 'website' })
  const { user } = useAuth()
  const navigate = useNavigate()
  const founder = getCurrentFounder(user)

  const [name, setName] = useState(founder?.name ?? '')
  const [bio, setBio] = useState(founder?.bio ?? '')
  const [website, setWebsite] = useState(founder?.website ?? '')
  const [saving, setSaving] = useState(false)

  if (!founder) return <Navigate to="/join" replace />

  const paymentUrl = buildPaymentUrl(COLLABORATOR_PAYMENT_LINK, founder.id, user?.email)
  const alreadyLockedIn = !!founder.creativeSubscription?.stripeSubscriptionId

  async function handleSave() {
    if (!founder) return
    setSaving(true)
    await updateFounder({
      ...founder,
      name: name.trim() || founder.name,
      bio: bio.trim(),
      website: website.trim() || undefined,
    })
    setSaving(false)
    navigate('/dashboard/welcome')
  }

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
            <p className="font-body text-base text-white/70 max-w-xl mx-auto leading-relaxed">
              Add your payment details now and you're locked at <strong className="text-white">$19/month</strong> —
              free until Jan 1, 2027, then $19/month for as long as you stay subscribed. Wait, or cancel before
              then, and it's <strong className="text-white">$25/month</strong> like everyone else who joins later.
            </p>
          </InnerContainer>
        </section>

        <section className="py-12 md:py-16">
          <InnerContainer className="max-w-2xl">
            {alreadyLockedIn ? (
              <div className="bg-white rounded-2xl border border-border px-8 py-8 text-center mb-10">
                <p className="font-heading text-lg font-semibold text-charcoal mb-2">You're locked in at $19/month ✓</p>
                <p className="font-body text-sm text-muted">You won't be charged until January 1, 2027.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-border px-8 py-8 text-center mb-10">
                <a
                  href={paymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex px-8 py-4 bg-primary text-white text-base font-semibold rounded-xl hover:bg-[#b05a35] transition-colors"
                >
                  Lock in $19/month — free until Jan 1, 2027
                </a>
                <p className="font-body text-xs text-muted mt-3">
                  Opens Stripe's secure checkout. You can also do this later from your dashboard.
                </p>
              </div>
            )}

            {/* ── Simplified profile — styled like the start of a founder
                profile, since this is exactly what they're building. Every
                field is optional; Continue always works. */}
            <h2 className="font-heading text-xl font-semibold text-charcoal mb-1">Your founder profile</h2>
            <p className="font-body text-sm text-muted mb-6">
              A few details for your CULO Village profile — you can add or change these anytime.
            </p>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block font-body text-xs font-semibold text-charcoal uppercase tracking-wide mb-1.5">Name</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full rounded-xl px-4 py-3 text-sm text-charcoal border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block font-body text-xs font-semibold text-charcoal uppercase tracking-wide mb-1.5">Bio</label>
                <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  rows={4}
                  placeholder="What you do and who you help..."
                  className="w-full rounded-xl px-4 py-3 text-sm text-charcoal border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors resize-y"
                />
              </div>
              <div>
                <label className="block font-body text-xs font-semibold text-charcoal uppercase tracking-wide mb-1.5">Website or link</label>
                <input
                  value={website}
                  onChange={e => setWebsite(e.target.value)}
                  placeholder="yourbusiness.com"
                  className="w-full rounded-xl px-4 py-3 text-sm text-charcoal border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 mt-8">
              <Link to="/dashboard/welcome" className="font-body text-sm text-muted hover:text-charcoal transition-colors">
                Skip for now →
              </Link>
              <button
                onClick={() => void handleSave()}
                disabled={saving}
                className="px-6 py-3 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-[#b05a35] disabled:opacity-60 transition-colors"
              >
                {saving ? 'Saving…' : 'Save and continue to dashboard'}
              </button>
            </div>
          </InnerContainer>
        </section>

        <Footer />
      </main>
    </>
  )
}
