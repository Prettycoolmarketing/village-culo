import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { getCurrentFounder } from '../../services/currentFounder'
import { creativeFeedbackService } from '../../services/creativeFeedback'
import { UPGRADE_PAYMENT_LINK, COLLABORATOR_PAYMENT_LINK, buildPaymentUrl } from '../../config/paymentLinks'
import { hasCreativeAccess } from '../../utils/creativeAccess'

// Where a founder gives their one piece of CULO Creatives feedback — doing
// so locks them into the $19/mo collaborator rate (see
// submit-creative-feedback Edge Function) rather than the $25/mo rate new
// members pay from launch onward. One open question, not a survey — see
// the plan this was built from: asking more than one thing here just adds
// friction to something that's meant to feel like a quick, genuine check-in.

export function DashboardCreativesPage() {
  const { user } = useAuth()
  const founder = getCurrentFounder(user)
  const [answer, setAnswer] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const subscription = founder?.creativeSubscription
  const alreadySubmitted = !!subscription?.feedbackSubmittedAt
  const hasAccess = hasCreativeAccess(subscription)

  const upgradeUrl = buildPaymentUrl(UPGRADE_PAYMENT_LINK, founder?.id ?? '', user?.email)
  const collaboratorUrl = buildPaymentUrl(COLLABORATOR_PAYMENT_LINK, founder?.id ?? '', user?.email)
  const hasBilling = !!subscription?.stripeSubscriptionId

  async function handleSubmit() {
    if (!founder || !answer.trim()) return
    setSubmitting(true)
    setError(null)
    const result = await creativeFeedbackService.submit({ founderId: founder.id, answer: answer.trim() })
    setSubmitting(false)
    if (!result.success) { setError(result.error ?? 'Could not submit feedback. Please try again.'); return }
    // Local optimistic update so the page reflects the lock-in immediately —
    // the next full founder sync will pick up the real record from Supabase.
    window.location.reload()
  }

  if (!founder) return null

  return (
    <div className="p-8 max-w-2xl" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <h1 className="text-2xl font-bold text-[#2D2A26] mb-2">CULO Creatives</h1>

      {!hasAccess && (
        <div className="bg-[#C86A43]/10 border border-[#C86A43]/30 rounded-2xl px-8 py-6 mb-6">
          <p className="text-base font-semibold text-[#2D2A26] mb-1">Your free access has ended</p>
          <p className="text-sm text-[#6B7280] mb-4 leading-relaxed">
            Upgrade to CULO Creatives for $25/month to keep creating in Canva.
          </p>
          <a
            href={upgradeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex px-5 py-2.5 bg-[#C86A43] text-white text-sm font-semibold rounded-lg hover:bg-[#b05a35] transition-colors"
          >
            Upgrade — $25/month
          </a>
        </div>
      )}

      {alreadySubmitted ? (
        <div className="bg-white rounded-2xl border border-[#E8E4DD] px-8 py-8">
          <p className="text-sm font-semibold text-[#5E6B4A] mb-2">Thanks — you're locked in at $19/month ✓</p>
          <p className="text-sm text-[#6B7280] leading-relaxed mb-4">
            Your feedback has been received. Your CULO Creatives rate is locked at $19/month, regardless of
            what it costs new members later.
          </p>
          {!hasBilling && (
            <>
              <p className="text-sm text-[#6B7280] leading-relaxed mb-4">
                Add your payment details now to keep this rate — you won't be charged until January 1, 2027.
              </p>
              <a
                href={collaboratorUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex px-5 py-2.5 bg-[#C86A43] text-white text-sm font-semibold rounded-lg hover:bg-[#b05a35] transition-colors"
              >
                Set up billing — $19/month from Jan 1, 2027
              </a>
            </>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E8E4DD] px-8 py-8">
          <p className="text-sm text-[#6B7280] leading-relaxed mb-6">
            Submitting this locks your CULO Creatives rate at <strong className="text-[#2D2A26] font-semibold">$19/month</strong>,
            even as the price goes up for new members later. You'll need to submit it before{' '}
            <strong className="text-[#2D2A26] font-semibold">January 1, 2027</strong> to keep using CULO
            Creatives past that date.
          </p>
          <label className="block text-sm font-semibold text-[#2D2A26] mb-2">
            What did you love and dislike about CULO Creatives?
          </label>
          <p className="text-xs text-[#9CA3AF] mb-3">
            Your feedback helps us improve, and we value your time and effort to explain your suggestions and
            feedback.
          </p>
          <textarea
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            rows={8}
            placeholder="What worked, what didn't, what you'd change..."
            className="w-full px-3 py-2.5 rounded-lg border border-[#E8E4DD] text-sm text-[#2D2A26] bg-white placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#C86A43]/30 focus:border-[#C86A43] resize-y transition-colors"
          />
          {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
          <button
            onClick={() => void handleSubmit()}
            disabled={!answer.trim() || submitting}
            className="mt-4 px-5 py-2.5 bg-[#C86A43] text-white text-sm font-semibold rounded-lg hover:bg-[#b05a35] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Submitting…' : 'Submit feedback and lock in $19/month'}
          </button>
        </div>
      )}
    </div>
  )
}
