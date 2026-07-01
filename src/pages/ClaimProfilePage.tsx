import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { usePageMeta } from '../utils/usePageMeta'
import { useAuth } from '../contexts/AuthContext'
import { getFounders } from '../services/founders'
import { founderClaimService } from '../services/founderClaim'
import { InnerContainer } from '../components/layout/PageContainer'

export function ClaimProfilePage() {
  const { slug } = useParams<{ slug: string }>()
  const { user } = useAuth()
  const founder = getFounders().find(f => f.slug === slug)
  usePageMeta({
    title:       founder ? `Claim ${founder.name}'s Profile` : 'Claim a Profile',
    description: founder
      ? `Claim your CULO Village profile for ${founder.name} to edit, import content, and publish with CULO.`
      : 'Claim your CULO Village founder profile.',
  })

  const [name, setName]             = useState('')
  const [email, setEmail]           = useState('')
  const [message, setMessage]       = useState('')
  const [evidenceUrl, setEvidenceUrl] = useState('')
  const [submitted, setSubmitted]   = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState('')

  // Not found
  if (!founder || (founder.status !== 'published' && founder.status !== 'featured')) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-4 pt-20">
        <div className="text-center max-w-md">
          <h1 className="font-heading text-2xl font-semibold text-charcoal mb-3">Profile not found</h1>
          <p className="font-body text-muted mb-6">
            We couldn't find a public profile with this URL.
          </p>
          <Link to="/founders" className="text-sm font-medium text-primary hover:underline">
            Browse all founders →
          </Link>
        </div>
      </main>
    )
  }

  // Already claimed / verified — don't show form
  if (founder.profileStatus === 'claimed' || founder.profileStatus === 'verified') {
    return (
      <main className="min-h-screen bg-background pt-20">
        <InnerContainer>
          <div className="max-w-lg mx-auto text-center py-20">
            <div className="w-14 h-14 rounded-full bg-secondary/15 flex items-center justify-center mx-auto mb-5" aria-hidden="true">
              <svg className="w-7 h-7 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h1 className="font-heading text-2xl font-semibold text-charcoal mb-3">
              This profile has been {founder.profileStatus === 'verified' ? 'verified' : 'claimed'}
            </h1>
            <p className="font-body text-muted mb-6 leading-relaxed">
              {founder.name}'s profile is already {founder.profileStatus === 'verified' ? 'verified' : 'owned'} by its founder. If you believe there is an error, please contact CULO Village.
            </p>
            <Link
              to={`/founders/${founder.slug}`}
              className="text-sm font-medium text-primary hover:underline"
            >
              ← Back to {founder.name}'s profile
            </Link>
          </div>
        </InnerContainer>
      </main>
    )
  }

  // Pending
  if (founder.profileStatus === 'claim-pending') {
    return (
      <main className="min-h-screen bg-background pt-20">
        <InnerContainer>
          <div className="max-w-lg mx-auto text-center py-20">
            <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-5" aria-hidden="true">
              <svg className="w-7 h-7 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="font-heading text-2xl font-semibold text-charcoal mb-3">
              Claim pending review
            </h1>
            <p className="font-body text-muted mb-6 leading-relaxed">
              A claim has already been submitted for {founder.name}'s profile and is currently under review. You'll receive a response by email once reviewed.
            </p>
            <Link
              to={`/founders/${founder.slug}`}
              className="text-sm font-medium text-primary hover:underline"
            >
              ← Back to {founder.name}'s profile
            </Link>
          </div>
        </InnerContainer>
      </main>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!name.trim() || !email.trim()) {
      setError('Please fill in your name and email.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.')
      return
    }

    setSubmitting(true)
    try {
      await founderClaimService.create({
        founderId:        founder!.id,
        requesterName:    name.trim(),
        requesterEmail:   email.trim(),
        requesterMessage: message.trim() || undefined,
        evidenceUrl:      evidenceUrl.trim() || undefined,
        requesterUserId:  user?.email === email.trim() ? user.id : undefined,
      })
      setSubmitted(true)
    } catch {
      setError('Something went wrong submitting your claim. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <main className="min-h-screen bg-background pt-20">
        <InnerContainer>
          <div className="max-w-lg mx-auto text-center py-20">
            <div className="w-14 h-14 rounded-full bg-secondary/15 flex items-center justify-center mx-auto mb-5" aria-hidden="true">
              <svg className="w-7 h-7 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="font-heading text-2xl font-semibold text-charcoal mb-3">
              Claim submitted
            </h1>
            <p className="font-body text-muted mb-2 leading-relaxed">
              Thank you, {name}. Your claim for {founder.name}'s profile has been received.
            </p>
            <p className="font-body text-sm text-muted mb-8 leading-relaxed">
              Our team will review your request and reach out to you at <strong>{email}</strong> within a few business days.
            </p>
            <Link
              to={`/founders/${founder.slug}`}
              className="text-sm font-medium text-primary hover:underline"
            >
              ← Back to {founder.name}'s profile
            </Link>
          </div>
        </InnerContainer>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background pt-20">

      {/* Breadcrumb */}
      <nav className="bg-surface border-b border-border pb-4 pt-4" aria-label="Breadcrumb">
        <InnerContainer>
          <ol className="flex items-center gap-2 text-sm font-body text-muted flex-wrap" role="list">
            <li><Link to="/" className="hover:text-primary transition-colors">Village</Link></li>
            <li aria-hidden="true" className="text-border">›</li>
            <li><Link to="/founders" className="hover:text-primary transition-colors">Founders</Link></li>
            <li aria-hidden="true" className="text-border">›</li>
            <li>
              <Link to={`/founders/${founder.slug}`} className="hover:text-primary transition-colors">
                {founder.name}
              </Link>
            </li>
            <li aria-hidden="true" className="text-border">›</li>
            <li className="text-charcoal font-medium" aria-current="page">Claim Profile</li>
          </ol>
        </InnerContainer>
      </nav>

      <div className="py-12">
        <InnerContainer>
          <div className="max-w-2xl mx-auto">

            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-5">
                {founder.avatar && (
                  <img
                    src={founder.avatar}
                    alt=""
                    className="w-14 h-14 rounded-full object-cover ring-2 ring-border"
                  />
                )}
                <div>
                  <h1 className="font-heading text-2xl sm:text-3xl font-bold text-charcoal leading-tight">
                    Claim {founder.name}'s Profile
                  </h1>
                  <p className="font-body text-sm text-muted mt-0.5">
                    {founder.industry.name} · {founder.location.name}
                  </p>
                </div>
              </div>

              {/* Ethics note */}
              <div className="bg-[#5E6B4A]/10 border border-[#5E6B4A]/20 rounded-xl px-5 py-4">
                <p className="font-body text-sm text-[#5E6B4A] leading-relaxed font-semibold mb-1">
                  About this profile
                </p>
                <p className="font-body text-sm text-charcoal/80 leading-relaxed">
                  This profile was curated by CULO Village using publicly available content and original source links.
                  If you are {founder.name}, you can claim ownership. We will verify your identity and transfer
                  control so you can edit, update and manage this profile directly.
                </p>
                {founder.curatedAt && (
                  <p className="font-body text-xs text-muted mt-2">
                    Curated by {founder.curatedBy ?? 'CULO Village'} · {new Date(founder.curatedAt).toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })}
                  </p>
                )}
              </div>
            </div>

            {/* Claim form */}
            <form onSubmit={handleSubmit} noValidate>
              <div className="bg-white rounded-2xl border border-border p-6 flex flex-col gap-5">
                <h2 className="font-heading text-lg font-semibold text-charcoal">
                  Your details
                </h2>

                <div>
                  <label className="block font-body text-sm font-semibold text-charcoal mb-1.5" htmlFor="claim-name">
                    Full name <span className="text-primary">*</span>
                  </label>
                  <input
                    id="claim-name"
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    autoComplete="name"
                    className="w-full px-3 py-2.5 text-sm border border-border rounded-xl focus:outline-none focus:border-primary transition-colors"
                    placeholder={`e.g. ${founder.name}`}
                  />
                </div>

                <div>
                  <label className="block font-body text-sm font-semibold text-charcoal mb-1.5" htmlFor="claim-email">
                    Email address <span className="text-primary">*</span>
                  </label>
                  <input
                    id="claim-email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="w-full px-3 py-2.5 text-sm border border-border rounded-xl focus:outline-none focus:border-primary transition-colors"
                    placeholder="you@yourdomain.com"
                  />
                  <p className="font-body text-xs text-muted mt-1.5">
                    We'll use this to verify your identity and follow up.
                  </p>
                </div>

                <div>
                  <label className="block font-body text-sm font-semibold text-charcoal mb-1.5" htmlFor="claim-evidence">
                    Evidence URL
                  </label>
                  <input
                    id="claim-evidence"
                    type="url"
                    value={evidenceUrl}
                    onChange={e => setEvidenceUrl(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-border rounded-xl focus:outline-none focus:border-primary transition-colors"
                    placeholder="https://yourwebsite.com or linkedin.com/in/you"
                  />
                  <p className="font-body text-xs text-muted mt-1.5">
                    A link that confirms your identity — your website, LinkedIn, YouTube channel, or social profile.
                  </p>
                </div>

                <div>
                  <label className="block font-body text-sm font-semibold text-charcoal mb-1.5" htmlFor="claim-message">
                    Message
                  </label>
                  <textarea
                    id="claim-message"
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2.5 text-sm border border-border rounded-xl focus:outline-none focus:border-primary transition-colors resize-none"
                    placeholder="Anything you'd like to add — how we can verify you, or changes you'd like to request."
                  />
                </div>

                {error && (
                  <p className="font-body text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-2.5 rounded-xl" role="alert">
                    {error}
                  </p>
                )}

                <div className="flex items-center gap-4 pt-1">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-[#b05a35] disabled:opacity-60 transition-colors"
                  >
                    {submitting ? 'Submitting…' : 'Submit Claim'}
                  </button>
                  <Link
                    to={`/founders/${founder.slug}`}
                    className="font-body text-sm text-muted hover:text-charcoal transition-colors"
                  >
                    Cancel
                  </Link>
                </div>
              </div>
            </form>

            {/* Transparency footer */}
            <p className="font-body text-xs text-muted/70 mt-6 leading-relaxed text-center">
              If this is your profile and you would like changes or removal instead of claiming it,
              mention that in your message above. CULO Village is committed to transparency and will
              honour all reasonable removal requests.
            </p>
          </div>
        </InnerContainer>
      </div>
    </main>
  )
}
