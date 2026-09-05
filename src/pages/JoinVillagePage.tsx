import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { usePageMeta } from '../utils/usePageMeta'
import { useAuth } from '../contexts/AuthContext'
import { ensureJoinedFounder } from '../services/joinFlow'
import { supabase } from '../lib/supabase'
import { WebmailButtons } from '../components/ui/WebmailButtons'
import { Navbar } from '../components/layout/Navbar'
import { Footer } from '../components/layout/Footer'
import { InnerContainer } from '../components/layout/PageContainer'

const HERO_IMAGE = '/join/join-hero.png'

const GRID_ROW_1 = ['/join/grid-1.png', '/join/grid-2.png', '/join/grid-3.png']
const GRID_ROW_2 = ['/join/grid-4.png', '/join/grid-5.png', '/join/grid-6.png']

// Same "How it works" steps as CreativesPage's "Tell your story" section —
// reused verbatim (same images/copy) rather than re-described, so a founder
// gets the identical walkthrough whichever page they land on first.
const STEPS = [
  {
    title: 'Answer a few personalised questions',
    image: '/creatives/step-1-about-you.png',
    bullets: [
      <>Complete the <strong className="text-charcoal font-semibold">About You</strong> section with a few quick details about your business and brand.</>,
      <>CULO uses that to generate personalised questions in <strong className="text-charcoal font-semibold">Shape Your Idea</strong>.</>,
      <>Your answers shape the hooks, captions, blogs, carousels and Quick Rhythm reels CULO creates.</>,
    ],
  },
  {
    title: 'Upload your raw footage',
    image: '/creatives/step-2-uploading-media.png',
    bullets: [
      <>Upload your footage into the right Media Library section: B-roll, Talking Head, Voice Over, Vlog or Photos.</>,
      <><strong className="text-charcoal font-semibold">B-roll</strong> becomes background footage for Voice Over reels, or rotates silently in Quick Rhythm reels.</>,
      <><strong className="text-charcoal font-semibold">Talking Head, Voice Over</strong> and <strong className="text-charcoal font-semibold">Vlog</strong> clips merge into a reel with subtitles, a hook and a caption.</>,
      <><strong className="text-charcoal font-semibold">Photos</strong> merge into a carousel slideshow.</>,
    ],
  },
  {
    title: 'Get social media ready content back',
    image: '/creatives/step-3-ready-to-post.png',
    bullets: [
      <>Ready to post content across Quick Rhythm, Voice Over, Talking Head and Vlog Style formats.</>,
      <>Every reel comes subtitled, hooked and captioned, straight out of Canva.</>,
    ],
  },
]

// The real, account-creating join flow — staged at /join rather than
// replacing the homepage's "coming soon" waitlist (see WaitlistForm), which
// stays live and untouched until the Canva app is actually approved. Once
// it's ready to go live, point culovillage.com's main flow here (or move
// this page to the root route). Creates a real account, not a waitlist row:
// email only, no password up front (better conversion — the founder sets a
// real password once inside the dashboard, via the "set your password"
// prompt in DashboardLayout).
//
// ?source=canva vs the default 'village' tags which funnel actually created
// the account, so CAPO can tell a Canva Marketplace deep-link apart from a
// direct culovillage.com signup. This is the exact URL the Canva app's
// "Join the Village" button should deep-link to: /join?source=canva

export function JoinVillagePage() {
  usePageMeta({
    title: 'Culo In Canva',
    description: 'Join the CULO Village for free access to Culo Creatives, exclusively in Canva, till January 1st 2027.',
    ogType: 'website',
  })

  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const source = searchParams.get('source') === 'canva' ? 'canva' : 'village'

  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkEmail, setCheckEmail] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) return
    setSubmitting(true)
    setError(null)

    // Founder never sees or needs this — it's a throwaway credential that
    // establishes their session; the very next step (JoinConfirmPage) has
    // them replace it with a real one.
    const throwawayPassword = crypto.randomUUID()
    const signUpResult = await signUp(trimmed, throwawayPassword, `/join/confirm?source=${source}`)

    if (signUpResult.error) {
      setSubmitting(false)
      setError(signUpResult.error)
      return
    }
    if (signUpResult.needsConfirmation) {
      // The overwhelmingly common case (Supabase's "Confirm email" is on) —
      // no session exists yet, so there's no userId to attach a founder
      // record to. JoinConfirmPage creates it once they click the email
      // link and land back here with a real session — see ensureJoinedFounder.
      setSubmitting(false)
      setCheckEmail(true)
      return
    }

    // Only reached when email confirmation is off and a session exists
    // immediately — same ensureJoinedFounder() call JoinConfirmPage makes,
    // so both paths converge on one function rather than duplicating it.
    const userId = (await supabase?.auth.getUser())?.data.user?.id
    setSubmitting(false)
    if (!userId) {
      setError('Could not create your account. Please try again.')
      return
    }
    await ensureJoinedFounder(userId, trimmed, source)
    navigate('/join/confirm', { replace: true })
  }

  if (checkEmail) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-background flex items-center justify-center px-6">
          <div className="max-w-md w-full text-center">
            <h1 className="font-heading text-2xl font-bold text-charcoal mb-3">Check your email</h1>
            <p className="font-body text-sm text-muted leading-relaxed mb-6">
              We sent a confirmation link to <span className="font-medium text-charcoal">{email}</span>. Click it,
              then come back here to get into your dashboard.
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

      {/* ── Hero / join form — dark, same charcoal treatment as Creatives'
          own hero. Copy + form on the left, hero photo on the right, so the
          image isn't just decoration stacked below — it sits right where
          the eye lands next. */}
      <section className="bg-charcoal py-20 md:py-28" aria-labelledby="join-heading">
        <InnerContainer>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="text-center lg:text-left">
              <p className="font-body text-xs font-semibold text-primary uppercase tracking-widest mb-4">
                Join The Culo Village
              </p>
              <h1 id="join-heading" className="font-heading text-4xl sm:text-5xl font-bold text-white mb-6 leading-tight">
                Access Culo Creatives<br />
                Exclusively In Canva
              </h1>
              <p className="font-body text-base md:text-lg text-white/70 leading-relaxed mb-10 max-w-xl mx-auto lg:mx-0">
                It's time to share your messy thoughts and raw footage into structured social media posts.
              </p>
              <form onSubmit={e => void handleSubmit(e)} className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto lg:mx-0">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  aria-label="Email address"
                  className="flex-1 min-w-0 rounded-xl px-5 py-4 text-base bg-white/10 text-white placeholder:text-white/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 transition-colors"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="shrink-0 rounded-xl px-8 py-4 text-base font-semibold bg-primary text-white hover:bg-[#b05a35] disabled:opacity-60 transition-colors"
                >
                  {submitting ? 'Joining…' : 'Join free'}
                </button>
              </form>
              {error && <p className="font-body text-sm text-red-400 text-center lg:text-left mt-3">{error}</p>}
              <p className="font-body text-xs text-white/40 mt-4">
                Free access to culo creatives in canva till january 1st 2027, no spam emails, publish in the village
              </p>
            </div>
            <img
              src={HERO_IMAGE}
              alt="A Canva project full of finished CULO Creatives content — vlog style reels, talking head reels, quick rhythm reels, voice over reels and captions, all generated from one founder's raw footage"
              className="w-full h-auto rounded-3xl"
            />
          </div>
        </InnerContainer>
      </section>

      {/* ── What is CULO Creatives — moved up right under the join form,
          on the Village's signature pale-blue gradient background (same
          soft radial circles as the homepage's HeroWidget). Copy sits next
          to the video, same side-by-side pattern as CreativesPage's "Watch
          the demo" section. */}
      <section className="relative overflow-hidden py-16 md:py-20" aria-labelledby="what-heading">
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-center">
            <div>
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-charcoal">
                <iframe
                  src="https://www.youtube.com/embed/qe0pMAlpVFc?start=22"
                  title="How to publish with CULO"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                />
              </div>
            </div>
            <div>
              <p className="font-body text-xs font-semibold text-primary uppercase tracking-widest mb-3">
                What is CULO Creatives in Canva?
              </p>
              <h2 id="what-heading" className="font-heading text-2xl sm:text-3xl font-bold text-charcoal leading-tight mb-5">
                Edit your raw footage in one workspace
              </h2>
              <p className="font-body text-base text-muted leading-relaxed mb-4">
                Culo Creatives is a design platform exclusively available in Canva helping founders edit their
                messy thoughts and raw footage into different formats of reels, carousels, captions and blogs
                for easy, humanised, storytelling, content.
              </p>
              <p className="font-body text-base text-muted leading-relaxed">
                A founder can have an amazing business and be genuinely talented and knowledgeable. But without
                consistent content that speaks to their audience with purposeful hooks, subtitles and captions,
                managed in one easy workspace, scheduled across every platform, and back-linked to their
                website and articles, they'll struggle with visibility and with keeping up with the demands of
                closed platform algorithms.
              </p>
            </div>
          </div>
        </InnerContainer>
      </section>

      {/* ── How it works — same "Tell your story" section as CreativesPage,
          now sitting above the screenshot grid instead of below it. */}
      <section className="py-16 md:py-20 bg-background border-y border-border" aria-labelledby="how-heading">
        <InnerContainer>
          <div className="max-w-2xl mb-12">
            <p className="font-body text-xs font-semibold text-primary uppercase tracking-widest mb-3">
              How it works
            </p>
            <h2 id="how-heading" className="font-heading text-3xl sm:text-4xl font-bold text-charcoal leading-tight">
              Tell your story.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((s, i) => (
              <div key={s.title}>
                <div className="rounded-xl overflow-hidden border border-border mb-4 bg-surface">
                  <img src={s.image} alt={`${s.title} — screenshot of CULO Creatives in Canva`} className="w-full h-auto" loading="lazy" />
                </div>
                <div className="w-11 h-11 rounded-full bg-primary/10 text-primary font-heading font-bold flex items-center justify-center mb-4">
                  {i + 1}
                </div>
                <p className="font-heading text-xl font-semibold text-charcoal mb-3">{s.title}</p>
                <ul className="space-y-2.5">
                  {s.bullets.map((b, j) => (
                    <li key={j} className="flex gap-2.5 font-body text-base text-muted leading-relaxed">
                      <span className="text-primary shrink-0" aria-hidden="true">•</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </InnerContainer>
      </section>

      {/* ── Product screenshot grid — 3 over 3, with the "raw footage" line
          as a single-line title spanning the top, now under How It Works. */}
      <section className="py-16 md:py-20 border-y border-border" aria-labelledby="product-heading">
        <InnerContainer>
          <h2 id="product-heading" className="font-heading text-xl sm:text-2xl lg:text-3xl font-bold text-charcoal text-center leading-tight mb-10 lg:whitespace-nowrap">
            Turn your raw footage into social media posts in one workspace
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
            {GRID_ROW_1.map(src => (
              <img key={src} src={src} alt="CULO Creatives in Canva" className="w-full h-auto rounded-2xl border border-border" />
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {GRID_ROW_2.map(src => (
              <img key={src} src={src} alt="CULO Creatives in Canva" className="w-full h-auto rounded-2xl border border-border" />
            ))}
          </div>
        </InnerContainer>
      </section>

      {/* ── Moving "The Culo Village" banner — dark, marquee-style, same
          repeated-wordmark treatment as a scrolling brand strip, sitting
          right above the Village pitch below it. */}
      <section className="bg-charcoal py-6 overflow-hidden" aria-hidden="true">
        <style>{`
          @keyframes culo-village-marquee {
            from { transform: translateX(0); }
            to   { transform: translateX(-50%); }
          }
        `}</style>
        <div className="flex w-max" style={{ animation: 'culo-village-marquee 24s linear infinite' }}>
          {[0, 1].map(group => (
            <div key={group} className="flex items-center shrink-0">
              {Array.from({ length: 8 }).map((_, i) => (
                <span key={i} className="flex items-center shrink-0">
                  <span className="font-heading text-2xl sm:text-3xl font-bold text-white/90 mx-6 whitespace-nowrap">
                    The Culo Village
                  </span>
                  <span className="text-primary text-2xl" aria-hidden="true">•</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ── What is The Culo Village — text left, a live scaled-down preview
          of a real founder page on the right, so it's an actual example
          rather than a description of one. */}
      <section className="py-16 md:py-20 bg-background" aria-labelledby="village-heading">
        <InnerContainer>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-center">
            <div>
              <p className="font-body text-xs font-semibold text-primary uppercase tracking-widest mb-3">
                What is The Culo Village?
              </p>
              <h2 id="village-heading" className="font-heading text-2xl sm:text-3xl font-bold text-charcoal leading-tight mb-5">
                Republish everything you've already posted across channels for discovery.
              </h2>
              <p className="font-body text-base text-muted leading-relaxed mb-8">
                The Culo Village helps founders structure their previously posted content across platforms and
                republish as individual webpages for AI search-ability as a joint publishing house.
              </p>
              <a href="#join-heading" className="inline-flex items-center gap-2 text-primary font-body text-sm font-semibold hover:text-[#b05a35] transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                Join to be discovered
              </a>
            </div>
            <a
              href="https://www.culovillage.com/founders/shakas-designer"
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-2xl overflow-hidden border border-border shadow-lg bg-white hover:shadow-xl transition-shadow"
              aria-label="See an example CULO Village founder page (opens in a new tab)"
            >
              <div className="flex items-center gap-1.5 px-4 py-2.5 bg-[#F3EDE6] border-b border-border">
                <span className="w-2.5 h-2.5 rounded-full bg-red-300" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-300" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-300" />
                <span className="ml-3 text-[10px] text-muted truncate font-body">culovillage.com/founders/shakas-designer</span>
              </div>
              <div className="relative overflow-hidden" style={{ aspectRatio: '4 / 3' }}>
                <iframe
                  src="https://www.culovillage.com/founders/shakas-designer"
                  title="Example CULO Village founder page"
                  className="absolute top-0 left-0 border-0 pointer-events-none"
                  style={{ width: '250%', height: '250%', transform: 'scale(0.4)', transformOrigin: 'top left' }}
                  loading="lazy"
                  tabIndex={-1}
                />
              </div>
            </a>
          </div>
        </InnerContainer>
      </section>

      <Footer />
    </main>
    </>
  )
}
