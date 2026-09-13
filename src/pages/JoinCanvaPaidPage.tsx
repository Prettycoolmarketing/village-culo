import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { usePageMeta } from '../utils/usePageMeta'
import { useAuth } from '../contexts/AuthContext'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { createFounderFromCanvaCheckout } from '../services/joinFlow'
import { WebmailButtons } from '../components/ui/WebmailButtons'
import { Navbar } from '../components/layout/Navbar'
import { Footer } from '../components/layout/Footer'
import { InnerContainer } from '../components/layout/PageContainer'

// Where CANVA_UPSELL_PAYMENT_LINK redirects after a completed checkout —
// the "10 free tries used up, straight to Stripe" path inside the Canva
// app. Unlike /join/offer, no founder record exists yet at this point:
// Stripe collected the email at checkout, not a signup form, so this page
// reads that completed session, has the founder set a real password
// against the email Stripe already captured, then creates the account
// with the real subscription details already attached.

interface CheckoutInfo {
  email: string
  canvaUserId?: string
  customerId?: string
  subscriptionId?: string
}

export function JoinCanvaPaidPage() {
  usePageMeta({ title: 'Set up your account', ogType: 'website' })
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session_id')

  const [checkoutInfo, setCheckoutInfo] = useState<CheckoutInfo | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [alreadyMember, setAlreadyMember] = useState(false)
  const [checkEmail, setCheckEmail] = useState(false)

  useEffect(() => {
    if (!sessionId || !isSupabaseConfigured || !supabase) { setLoadError('Missing checkout session.'); return }
    void supabase.functions.invoke('stripe-canva-checkout-info', { body: { sessionId } })
      .then(({ data, error: err }) => {
        if (err || data?.error) { setLoadError(data?.error ?? 'Could not verify your checkout — please contact support.'); return }
        setCheckoutInfo(data as CheckoutInfo)
      })
      .catch(() => setLoadError('Could not verify your checkout — please contact support.'))
  }, [sessionId])

  // A confirmed founder lands back here (redirectPath below) with a real
  // session already established — finish creating the account then, using
  // the same checkout info re-fetched above from sessionId in the URL.
  useEffect(() => {
    if (!checkoutInfo || !isSupabaseConfigured || !supabase) return
    let settled = false
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user && !settled) { settled = true; void finish(session.user.id) }
    })
    return () => sub.subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkoutInfo])

  async function finish(userId: string) {
    if (!checkoutInfo) return
    const founderId = await createFounderFromCanvaCheckout(
      userId, checkoutInfo.email, checkoutInfo.canvaUserId, checkoutInfo.customerId, checkoutInfo.subscriptionId,
    )
    if (!founderId) { setError('Could not finish setting up your account. Please contact support.'); return }
    navigate('/dashboard/welcome', { replace: true })
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!checkoutInfo) return
    setError(null)
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return }

    setSubmitting(true)
    const redirectPath = `/join/canva-paid?session_id=${encodeURIComponent(sessionId ?? '')}`
    const result = await signUp(checkoutInfo.email, password, redirectPath)
    setSubmitting(false)

    if (result.alreadyRegistered) { setAlreadyMember(true); return }
    if (result.error) { setError(result.error); return }
    if (result.needsConfirmation) { setCheckEmail(true); return }

    // Immediate session (Supabase's "Confirm email" off) — the
    // onAuthStateChange listener above won't fire for a signUp() call that
    // already returns a session in the same tick, so finish explicitly.
    const userId = (await supabase?.auth.getUser())?.data.user?.id
    if (!userId) { setError('Could not create your account. Please try again.'); return }
    void finish(userId)
  }

  if (loadError) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-background flex items-center justify-center px-6">
          <div className="max-w-sm w-full text-center">
            <h1 className="font-heading text-2xl font-bold text-charcoal mb-3">Something went wrong</h1>
            <p className="font-body text-sm text-muted leading-relaxed mb-6">{loadError}</p>
            <p className="font-body text-sm text-muted">
              Your payment still went through — email{' '}
              <a href="mailto:support@prettycoolmarketing.com" className="text-primary underline">support@prettycoolmarketing.com</a>{' '}
              and we'll get your account sorted.
            </p>
          </div>
        </main>
      </>
    )
  }

  if (alreadyMember) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-background flex items-center justify-center px-6">
          <div className="max-w-sm w-full text-center">
            <h1 className="font-heading text-2xl font-bold text-charcoal mb-3">You already have an account</h1>
            <p className="font-body text-sm text-muted leading-relaxed mb-6">
              <span className="font-medium text-charcoal">{checkoutInfo?.email}</span> already has a Culo Village
              account. Sign in and we'll link your new subscription to it.
            </p>
            <div className="flex flex-col gap-3">
              <a href="/dashboard/login" className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-[#b05a35] transition-colors">
                Sign in
              </a>
            </div>
          </div>
        </main>
      </>
    )
  }

  if (checkEmail) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-background flex items-center justify-center px-6">
          <div className="max-w-md w-full text-center">
            <h1 className="font-heading text-2xl font-bold text-charcoal mb-3">Check your email</h1>
            <p className="font-body text-sm text-muted leading-relaxed mb-6">
              We sent a confirmation link to <span className="font-medium text-charcoal">{checkoutInfo?.email}</span>.
              Click it to finish setting up your account — your payment's already gone through.
            </p>
            <WebmailButtons />
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        <section className="py-20 md:py-28" aria-labelledby="canva-paid-heading">
          <InnerContainer>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-4xl mx-auto">
              <div>
                <p className="font-body text-xs font-semibold text-primary uppercase tracking-widest mb-4">
                  Your trial has started
                </p>
                <h1 id="canva-paid-heading" className="font-heading text-3xl sm:text-4xl font-bold text-charcoal mb-6 leading-tight">
                  One step left — set your password
                </h1>
                <p className="font-body text-base text-muted leading-relaxed mb-6">
                  Your 14-day free trial of Culo Creatives is already running. Set a password to access your
                  Culo Village account too — it comes with everything you make in Canva:
                </p>
                <ul className="font-body text-sm text-muted space-y-2 mb-8">
                  <li>· Every piece you publish, structured as its own webpage for AI and search to find you</li>
                  <li>· A permanent home for your content, not another post buried in a feed</li>
                  <li>· Free, forever — no separate charge on top of your Creatives subscription</li>
                </ul>
                {!checkoutInfo ? (
                  <p className="font-body text-sm text-muted">Loading your details…</p>
                ) : (
                  <form onSubmit={e => void handleSubmit(e)} className="flex flex-col gap-3 max-w-sm">
                    <input type="email" name="username" autoComplete="username" value={checkoutInfo.email} readOnly hidden />
                    <div className="rounded-xl px-4 py-3 bg-white border border-border text-sm text-charcoal">
                      {checkoutInfo.email}
                    </div>
                    <input
                      type="password"
                      required
                      autoComplete="new-password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Choose a password"
                      className="rounded-xl px-4 py-3 text-sm text-charcoal border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                    />
                    <input
                      type="password"
                      required
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Confirm password"
                      className="rounded-xl px-4 py-3 text-sm text-charcoal border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                    />
                    {error && <p className="font-body text-sm text-red-600">{error}</p>}
                    <button
                      type="submit"
                      disabled={submitting}
                      className="rounded-xl px-8 py-4 text-base font-semibold bg-primary text-white hover:bg-[#b05a35] disabled:opacity-60 transition-colors"
                    >
                      {submitting ? 'Setting up…' : 'Enter The Culo Village'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </InnerContainer>
        </section>
        <Footer />
      </main>
    </>
  )
}
