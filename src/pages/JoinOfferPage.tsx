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
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const founder = getCurrentFounder(user)

  const [name, setName] = useState(founder?.name ?? '')
  const [bio, setBio] = useState(founder?.bio ?? '')
  const [website, setWebsite] = useState(founder?.website ?? '')
  const [saving, setSaving] = useState(false)
  const [showProfile, setShowProfile] = useState(false)

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

        {/* ── You're already a member — same pale-blue gradient treatment as
            /join's "What is CULO Creatives" section, running underneath both
            the intro copy and the revealed profile form so it reads as one
            cohesive block instead of a white section breaking it up. */}
        <section className="relative overflow-hidden py-16 md:py-20" aria-labelledby="village-instead-heading">
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
          <InnerContainer className="relative max-w-2xl text-center">
            <p className="font-body text-xs font-semibold text-primary uppercase tracking-widest mb-4">
              You're already a member
            </p>
            <h2 id="village-instead-heading" className="font-heading text-2xl sm:text-3xl font-bold text-charcoal mb-4 leading-tight">
              Not ready for Creatives yet? Keep publishing in the Village.
            </h2>
            <p className="font-body text-base text-muted leading-relaxed mb-8 max-w-xl mx-auto">
              You've already joined the Culo Village — publish your existing content as individual webpages so
              it's discoverable across the Village and by AI search. You can come back and lock in Culo
              Creatives in Canva anytime before January 1, 2027 from your dashboard.
            </p>
            {!showProfile && (
              <button
                onClick={() => setShowProfile(true)}
                className="inline-flex px-8 py-4 bg-charcoal text-white text-base font-semibold rounded-xl hover:bg-[#1a1815] transition-colors"
              >
                Continue publishing in the Village
              </button>
            )}
          </InnerContainer>

          {showProfile && (
          <InnerContainer className="relative max-w-2xl mt-4">
            {/* ── Simplified profile — styled like the start of a founder
                profile, since this is exactly what they're building. Every
                field is optional; Continue always works. */}
            <div className="bg-white rounded-2xl border border-border px-8 py-8">
              <h3 className="font-heading text-xl font-semibold text-charcoal mb-1">Your founder profile</h3>
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
            </div>
          </InnerContainer>
          )}
        </section>

        <Footer />
      </main>
    </>
  )
}
