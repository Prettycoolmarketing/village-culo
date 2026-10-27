import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getCurrentFounder } from '../services/currentFounder'
import { updateFounder, uniqueFounderSlug } from '../services/founders'
import { runOnboardingResearch } from '../services/onboardingResearch'
import { Navbar } from '../components/layout/Navbar'
import { JoinProgress } from '../components/ui/JoinProgress'

// The step /join used to skip entirely — name defaulted to the email's own
// local part and bio started blank, so a brand-new founder's profile had
// nothing on it until they went and filled it in themselves (most never
// did). This is the first thing a new signup sees instead of the empty
// dashboard: their real name, and a few real links — simple separate
// questions, same idea as the claim page, rather than one combined field.
//
// Used to ask for a single "most-known link or @handle" field. Confirmed
// real gap: a founder with several real, verifiable public profiles
// (website, Instagram, LinkedIn...) could only ever submit ONE of them —
// if that one happened to be unreachable, private, or too thin for
// research to confidently verify, the whole run came back
// researchFoundNothing even though the other links she had would have
// worked. Each field here, once filled, saves straight onto the matching
// founder field (website/instagram/linkedin/youtube) BEFORE research
// runs — runFounderResearch's own profileSources builder (see
// editorialResearch.ts) already pulls from all of those automatically, so
// just saving them first is enough; no change needed to research itself.
// Kicks off the same research → write pipeline CAPO runs by hand for
// curated founders (see runOnboardingResearch) and hands off to
// /dashboard/welcome's running-research counter.
const LINK_FIELDS = [
  { key: 'website' as const, label: 'Website', placeholder: 'yourbusiness.com' },
  { key: 'instagram' as const, label: 'Instagram', placeholder: '@yourusername' },
  { key: 'linkedin' as const, label: 'LinkedIn', placeholder: 'linkedin.com/in/yourname' },
  { key: 'youtube' as const, label: 'YouTube', placeholder: '@yourchannel' },
]

// Auto-prepend https:// rather than making a founder notice and fix a
// scheme-less link themselves (confirmed real friction). A bare "@handle"
// is left as-is — founder.instagram etc. don't require a full URL, and
// runOnboardingResearch/runFounderResearch both already treat a plain
// handle as a real research lead, not just a link.
function normalizeLink(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed || trimmed.startsWith('@')) return trimmed
  try {
    return new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`).toString()
  } catch {
    return trimmed
  }
}

export function JoinSetupPage() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const founder = getCurrentFounder(user)

  const [name, setName] = useState('')
  const [links, setLinks] = useState<Record<typeof LINK_FIELDS[number]['key'], string>>({
    website: '', instagram: '', linkedin: '', youtube: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Same cache-sync race as DashboardCreativesPage: a brand-new signup
  // landing here right after confirming their email can hit this page
  // before syncUserDataFromSupabase has populated the local founder cache.
  // `loading` is only AuthContext's own session restore, not that sync, so
  // without a retry this used to show "Loading…" forever with no recovery —
  // nothing here re-renders once the sync actually lands. Poll for up to
  // ~10s before genuinely giving up.
  const [syncTick, setSyncTick] = useState(0)
  useEffect(() => {
    if (loading || founder || syncTick >= 20) return
    const timer = setTimeout(() => setSyncTick(t => t + 1), 500)
    return () => clearTimeout(timer)
  }, [loading, founder, syncTick])

  if (loading || (!founder && syncTick < 20)) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <p className="font-body text-sm text-muted">Loading…</p>
      </main>
    )
  }
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
    const normalized = Object.fromEntries(
      LINK_FIELDS.map(f => [f.key, normalizeLink(links[f.key])]),
    ) as Record<typeof LINK_FIELDS[number]['key'], string>
    const filled = LINK_FIELDS.filter(f => normalized[f.key])
    if (filled.length === 0) { setError('Add at least one real link — website, Instagram, LinkedIn or YouTube.'); return }

    setSubmitting(true)
    setError(null)

    // The first one filled (in the order shown) becomes the "primary"
    // identifier — builds the first draft import and seeds Import's
    // connect-form prefill. Every other field saved below still feeds
    // research automatically via profileSources, it just isn't the one
    // the initial article gets built from.
    const primaryIdentifier = normalized[filled[0].key]

    const result = await updateFounder({
      ...founder,
      name: name.trim(),
      slug: uniqueFounderSlug(name.trim(), founder.id),
      website:   normalized.website || founder.website,
      instagram: normalized.instagram || founder.instagram,
      linkedin:  normalized.linkedin || founder.linkedin,
      youtube:   normalized.youtube || founder.youtube,
    })
    if (!result.success) {
      setSubmitting(false)
      setError(result.error ?? 'Could not save. Please try again.')
      return
    }

    // Deliberately not awaited — this can take over a minute (research +
    // writing + audit), and /dashboard/welcome's running-research counter
    // is what shows progress from here, polling onboardingStatus rather
    // than this page holding the founder on a spinner until it's done.
    void runOnboardingResearch(founder.id, primaryIdentifier)
    navigate('/dashboard/welcome', { replace: true })
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background flex items-center justify-center px-6 py-24">
        <div className="max-w-sm md:max-w-lg w-full">
          <JoinProgress step={2} />
          <h1 className="font-heading text-2xl md:text-4xl font-bold text-charcoal mb-2 md:mb-3 text-center">Let's build your profile</h1>
          <p className="font-body text-sm md:text-base text-muted text-center mb-8 md:mb-10">
            We'll write your bio and first article — add any real links you have, then you can go ahead and
            import your content.
          </p>
          <form onSubmit={e => void handleSubmit(e)} className="flex flex-col gap-3 md:gap-4">
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your full name"
              className="rounded-xl px-4 py-3 md:px-5 md:py-4 text-sm md:text-base text-charcoal border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
            <p className="font-body text-xs md:text-sm text-muted mt-2 -mb-1">
              Add at least one — the more you give us, the better we can find and verify you.
            </p>
            {LINK_FIELDS.map(f => (
              <div key={f.key}>
                <label htmlFor={`setup-link-${f.key}`} className="font-body text-xs md:text-sm text-muted block mb-1">
                  {f.label}
                </label>
                <input
                  id={`setup-link-${f.key}`}
                  type="text"
                  value={links[f.key]}
                  onChange={e => setLinks(prev => ({ ...prev, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="w-full rounded-xl px-4 py-3 md:px-5 md:py-4 text-sm md:text-base text-charcoal border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                />
              </div>
            ))}
            {error && <p className="font-body text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="mt-2 rounded-xl px-6 py-3 md:py-4 text-sm md:text-base font-semibold bg-primary text-white hover:bg-[#b05a35] disabled:opacity-60 transition-colors"
            >
              {submitting ? 'Saving…' : 'Build my profile'}
            </button>
          </form>
        </div>
      </main>
    </>
  )
}
