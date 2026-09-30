import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getCurrentFounder } from '../services/currentFounder'
import { updateFounder, uniqueFounderSlug } from '../services/founders'
import { runOnboardingResearch } from '../services/onboardingResearch'
import { Navbar } from '../components/layout/Navbar'

// The step /join used to skip entirely — name defaulted to the email's own
// local part and bio started blank, so a brand-new founder's profile had
// nothing on it until they went and filled it in themselves (most never
// did). This is the first thing a new signup sees instead of the empty
// dashboard: their real name, and one link CULO can actually research them
// from, before anything about them goes live. Kicks off the same
// research → write pipeline CAPO runs by hand for curated founders (see
// runOnboardingResearch) and hands off to /dashboard/welcome's loading
// state once that's running.
export function JoinSetupPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const founder = getCurrentFounder(user)

  const [name, setName] = useState('')
  const [link, setLink] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!founder) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <p className="font-body text-sm text-muted">Loading…</p>
      </main>
    )
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!founder) return
    if (!name.trim()) { setError('Your name is required.'); return }
    let url: URL
    try { url = new URL(link.trim()) } catch { setError('Enter a real link, starting with https://'); return }
    setSubmitting(true)
    setError(null)

    const result = await updateFounder({
      ...founder,
      name: name.trim(),
      slug: uniqueFounderSlug(name.trim(), founder.id),
    })
    if (!result.success) {
      setSubmitting(false)
      setError(result.error ?? 'Could not save. Please try again.')
      return
    }

    // Deliberately not awaited — this can take over a minute (research +
    // writing + audit), and /dashboard/welcome's loading state is what
    // shows progress from here, polling onboardingStatus rather than this
    // page holding the founder on a spinner until it's done.
    void runOnboardingResearch(founder.id, url.toString())
    navigate('/dashboard/welcome', { replace: true })
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background flex items-center justify-center px-6 py-24">
        <div className="max-w-sm w-full">
          <h1 className="font-heading text-2xl font-bold text-charcoal mb-2 text-center">Let's build your profile</h1>
          <p className="font-body text-sm text-muted text-center mb-8">
            Your name, and one link CULO can research — your YouTube channel, podcast, Instagram, TikTok or LinkedIn.
            We'll write your bio and your first article from it.
          </p>
          <form onSubmit={e => void handleSubmit(e)} className="flex flex-col gap-3">
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your full name"
              className="rounded-xl px-4 py-3 text-sm text-charcoal border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
            <input
              type="url"
              required
              value={link}
              onChange={e => setLink(e.target.value)}
              placeholder="https://youtube.com/@yourname"
              className="rounded-xl px-4 py-3 text-sm text-charcoal border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
            {error && <p className="font-body text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="mt-2 rounded-xl px-6 py-3 text-sm font-semibold bg-primary text-white hover:bg-[#b05a35] disabled:opacity-60 transition-colors"
            >
              {submitting ? 'Saving…' : 'Build my profile'}
            </button>
          </form>
        </div>
      </main>
    </>
  )
}
