import { useSearchParams, Link } from 'react-router-dom'
import { usePageMeta } from '../utils/usePageMeta'
import { useInstantJoin } from '../hooks/useInstantJoin'
import { WebmailButtons } from '../components/ui/WebmailButtons'
import { Navbar } from '../components/layout/Navbar'
import { Footer } from '../components/layout/Footer'
import { InnerContainer } from '../components/layout/PageContainer'
import { StoryGrid } from '../widgets/StoryGrid'

// Resized/compressed from the original 1971x1430 PNG (~1MB) down to a
// 1200px-wide JPEG (~100KB) — the raw screenshot was slow to load in the
// hero, which is above the fold on first paint.
const HERO_IMAGE = '/join/join-hero.jpg'
const HERO_IMAGE_CANVA = '/join/join-hero-canva.jpg'

const GRID_ROW_1 = ['/join/grid-1.jpg', '/join/grid-2.jpg', '/join/grid-3.jpg']
const GRID_ROW_2 = ['/join/grid-4.jpg', '/join/grid-5.jpg', '/join/grid-6.jpg']

const OUTPUT_FORMATS = [
  { emoji: '📖', label: 'Blogs', desc: 'Turns what you actually said into a structured written story with a clear beginning, middle and point.' },
  { emoji: '✍️', label: 'Carousels', desc: 'Pulls the strongest ideas from your footage and turns them into swipeable content ready to design and publish.' },
  { emoji: '🗣️', label: 'Talking Head Reels', desc: 'Turns your talking-head footage into social-ready content with subtitles, hooks and captions.' },
  { emoji: '🎙️', label: 'Voice Over Reels', desc: 'Shapes your words into short-form stories layered over your own footage.' },
  { emoji: '🎥', label: 'Vlog Behind The Scenes Reels', desc: 'Turns your process, behind-the-scenes moments and everyday footage into content with a clear story.' },
  { emoji: '⚡', label: 'Quick Rhythm Reels', desc: 'Creates short, fast-paced edits with strong opening hooks and tighter cuts built to hold attention.' },
]

// Same "How it works" steps as CreativesPage's "Tell your story" section —
// reused verbatim (same images/copy) rather than re-described, so a founder
// gets the identical walkthrough whichever page they land on first.
const STEPS = [
  {
    title: 'Answer a few personalised questions',
    image: '/creatives/step-1-about-you.jpg',
    bullets: [
      <>Complete the <strong className="text-charcoal font-semibold">About You</strong> section with a few quick details about your business, expertise and brand.</>,
      <>CULO uses that information to generate personalised questions inside <strong className="text-charcoal font-semibold">Shape Your Idea</strong>.</>,
      <>Your answers help shape the hooks, captions, blogs, carousels and Quick Rhythm reels CULO creates.</>,
    ],
  },
  {
    title: 'Upload your raw footage',
    image: '/creatives/step-2-uploading-media.jpg',
    bullets: [
      <>Upload your existing footage into the relevant Media Library section: B-roll, Talking Head, Voice Over, Vlog or Photos.</>,
      <><strong className="text-charcoal font-semibold">B-roll</strong> can become background footage for Voice Over content or rotate through Quick Rhythm reels.</>,
      <><strong className="text-charcoal font-semibold">Talking Head, Voice Over</strong> and <strong className="text-charcoal font-semibold">Vlog</strong> clips can be structured into reels with subtitles, hooks and captions.</>,
      <><strong className="text-charcoal font-semibold">Photos</strong> can be turned into carousel content.</>,
    ],
  },
  {
    title: 'Get social media ready content back',
    image: '/creatives/step-3-ready-to-post.jpg',
    bullets: [
      <>Create ready-to-post content across Quick Rhythm, Voice Over, Talking Head and Vlog Style formats.</>,
      <>Your reels can come back with subtitles, hooks and captions, ready to finish and publish directly from Canva.</>,
    ],
  },
]

// The real, account-creating join flow, staged at /join. Every "coming
// soon" spot that used to be a bare email-capture waitlist (homepage hero,
// Archive page, the Canva CTA banner) now points here directly instead —
// joining the Village itself is real and live, only Culo Creatives in
// Canva is still pending approval. Creates a real account, not a waitlist
// row: email only, no password up front (better conversion — the founder
// sets a real password once inside the dashboard, via the "set your
// password" prompt in DashboardLayout).
//
// ?source=canva vs the default 'village' tags which funnel actually created
// the account, so CAPO can tell a Canva Marketplace deep-link apart from a
// direct culovillage.com signup. This is the exact URL the Canva app's
// "Join the Village" button should deep-link to: /join?source=canva

export function JoinVillagePage() {
  const [searchParams] = useSearchParams()
  const source = searchParams.get('source') === 'canva' ? 'canva' : 'village'
  const isCanva = source === 'canva'
  // Present when this visitor arrived via the "Continue in The Culo Village"
  // link inside the Canva app itself (not just /joincanva generally) — lets
  // village-culo's Stripe webhook notify the Canva app's own backend once
  // this founder actually starts paying, so CULO Creatives can gate premium
  // actions behind subscription status. See ensureJoinedFounder.
  const canvaUserId = searchParams.get('canvaUserId')?.trim() || undefined
  // The link pasted into the actual Canva Marketplace app listing (what a
  // user clicking "Culo Creatives" inside Canva's own app directory lands
  // on) — a real account, same as /joincanva. Kept as its own URL (rather
  // than reusing /joincanva) purely so CAPO can tell "came from the
  // Marketplace listing" apart from "clicked the button on
  // culovillage.com" later, via the ?via= tag — no behavior difference yet.

  // isCanva now only changes framing/emphasis (this visitor came in wanting
  // to create vs. wanting to market) — every self-serve signup, /join or
  // /joincanva alike, gets the same $25/mo, 14-day-trial Standard tier (see
  // ensureJoinedFounder), so pricing copy below is unified, not branched.
  usePageMeta(isCanva ? {
    title: 'Culo Creatives in Canva',
    description: 'Try Culo Creatives in Canva free for 14 days — turn your raw footage into finished blogs, carousels and reels.',
    ogType: 'website',
  } : {
    title: 'Culo In Canva',
    description: 'Join the CULO Village — republish your content, and try Culo Creatives in Canva free for 14 days.',
    ogType: 'website',
  })

  const { email, setEmail, submitting, error, checkEmail, alreadyMember, handleSubmit } = useInstantJoin(source, canvaUserId)

  if (alreadyMember) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-background flex items-center justify-center px-6">
          <div className="max-w-md w-full text-center">
            <h1 className="font-heading text-2xl font-bold text-charcoal mb-3">You're already a member</h1>
            <p className="font-body text-sm text-muted leading-relaxed mb-6">
              <span className="font-medium text-charcoal">{email}</span> already has a Culo Village account.
              Sign in to pick up where you left off.
            </p>
            <div className="flex flex-col gap-3">
              <Link to="/dashboard/login" className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-[#b05a35] transition-colors">
                Sign in
              </Link>
              <Link to="/dashboard/forgot-password" className="text-sm font-semibold text-primary hover:underline">
                Forgot or never set a password? Reset it →
              </Link>
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
      <section className="bg-charcoal pt-28 pb-16 md:py-28" aria-labelledby="join-heading">
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
                Turn the content you've already created into a discoverable body of work in The Culo Village, then
                use Culo Creatives inside Canva to turn your messy thoughts and raw footage into structured social
                media content.
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
                  {submitting ? 'Joining…' : 'Join the Village'}
                </button>
              </form>
              {error && <p className="font-body text-sm text-red-400 text-center lg:text-left mt-3">{error}</p>}
              <p className="font-body text-xs text-white/40 mt-4">
                The Culo Village is free, forever · Culo Creatives in Canva: 14-day free trial, then $25 AUD/month · No spam emails
              </p>
              <Link to="/join?source=canva" className="inline-block font-body text-sm font-semibold text-white hover:text-primary transition-colors mt-4 underline underline-offset-4 decoration-white/30 hover:decoration-primary">
                Learn more about Culo Creatives in Canva →
              </Link>
            </div>
            <img
              src={isCanva ? HERO_IMAGE_CANVA : HERO_IMAGE}
              alt="A Canva project full of finished CULO Creatives content — vlog style reels, talking head reels, quick rhythm reels, voice over reels and captions, all generated from one founder's raw footage"
              className="w-full h-auto rounded-3xl"
            />
          </div>
        </InnerContainer>
      </section>

      {/* ── Moving "The Culo Village" banner — dark, marquee-style, same
          repeated-wordmark treatment as a scrolling brand strip, sitting
          right above the Village pitch below it. Placed right after the
          hero, ahead of the Creatives walkthrough, so a founder knows what
          the Village actually is before reading three sections about the
          Creatives tool inside it. */}
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
                Turn everything you've already created into a body of work people can discover.
              </h2>
              <p className="font-body text-base text-muted leading-relaxed mb-4">
                The Culo Village is a founder publishing network that brings together the content, ideas,
                businesses and expertise you've already shared across the internet.
              </p>
              <p className="font-body text-base text-muted leading-relaxed mb-4">
                Republish your social posts, podcast appearances, videos, articles and other existing content as
                individual web stories connected to your founder profile, creating one growing body of work
                designed for discovery across people, search engines and AI.
              </p>
              <p className="font-body text-base text-muted leading-relaxed mb-8">
                Membership is free, forever, and your first 10 published stories are included. Culo Creatives,
                the editing tool inside Canva covered next, is a separate optional add-on with a 14-day free
                trial, then $25 AUD/month.
              </p>
              <a href="#join-heading" className="inline-flex items-center gap-2 text-primary font-body text-sm font-semibold hover:text-[#b05a35] transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                Create your founder profile
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

      {/* ── Moving "Culo Creatives in Canva" banner — blue, mirrors the
          dark "The Culo Village" strip above, sitting right before the
          Creatives walkthrough video. */}
      <section className="bg-charcoal py-6 overflow-hidden" aria-hidden="true">
        <style>{`
          @keyframes culo-creatives-marquee {
            from { transform: translateX(0); }
            to   { transform: translateX(-50%); }
          }
        `}</style>
        <div className="flex w-max" style={{ animation: 'culo-creatives-marquee 24s linear infinite' }}>
          {[0, 1].map(group => (
            <div key={group} className="flex items-center shrink-0">
              {Array.from({ length: 8 }).map((_, i) => (
                <span key={i} className="flex items-center shrink-0">
                  <span className="font-heading text-2xl sm:text-3xl font-bold text-primary mx-6 whitespace-nowrap">
                    Culo Creatives in Canva
                  </span>
                  <span className="text-white/70 text-2xl" aria-hidden="true">•</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ── What is CULO Creatives — on the Village's signature pale-blue
          gradient background (same soft radial circles as the homepage's
          HeroWidget). Copy sits next to the video, same side-by-side
          pattern as CreativesPage's "Watch the demo" section. */}
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
                Turn your raw footage into social media content in one workspace.
              </h2>
              <p className="font-body text-base text-muted leading-relaxed mb-4">
                Culo Creatives is a content creation tool available exclusively inside Canva that helps founders
                turn messy thoughts and raw footage into reels, carousels, captions and blogs built around what
                they actually know, say and experience.
              </p>
              <p className="font-body text-base text-muted leading-relaxed mb-4">
                A founder can have an incredible business and years of knowledge, but consistently turning that
                expertise into useful content takes time.
              </p>
              <p className="font-body text-base text-muted leading-relaxed">
                Culo Creatives helps structure your ideas, footage and stories into different content formats
                with hooks, subtitles and captions, all inside the Canva workspace you already use.
              </p>
            </div>
          </div>
        </InnerContainer>
      </section>

      {/* ── Product screenshot grid — 3 over 3, with the "raw footage" line
          as a single-line title spanning the top, now above How It Works. */}
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

      {/* ── How it works — same "Tell your story" section as CreativesPage,
          now sitting below the screenshot grid instead of above it. */}
      <section className="py-16 md:py-20 bg-background border-y border-border" aria-labelledby="how-heading">
        <InnerContainer>
          <div className="max-w-2xl mb-14 md:mb-12">
            <p className="font-body text-xs font-semibold text-primary uppercase tracking-widest mb-3">
              How it works
            </p>
            <h2 id="how-heading" className="font-heading text-3xl sm:text-4xl font-bold text-charcoal leading-tight">
              Tell your story.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
            {STEPS.map((s, i) => (
              <div key={s.title}>
                <div className="rounded-xl overflow-hidden border border-border mb-6 md:mb-4 bg-surface">
                  <img src={s.image} alt={`${s.title} — screenshot of CULO Creatives in Canva`} className="w-full h-auto" loading="lazy" />
                </div>
                <div className="w-11 h-11 rounded-full bg-primary/10 text-primary font-heading font-bold flex items-center justify-center mb-6 md:mb-4">
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

      {/* ── Final CTA ─────────────────────────────────────────────────────── */}
      <section className="py-16 md:py-20 text-center" aria-label="Join The Culo Village">
        <InnerContainer>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-charcoal mb-4 leading-tight">
            Every founder has a story worth finding.
          </h2>
          <p className="font-body text-base text-muted leading-relaxed mb-2 max-w-xl mx-auto">
            Create with Culo Creatives, publish your existing and future work in The Culo Village, then share
            your stories wherever your audience already finds you.
          </p>
          <p className="font-body text-base text-muted leading-relaxed mb-8 max-w-xl mx-auto">
            Instead of letting your best ideas disappear into individual feeds, build a connected body of work
            around who you are, what you know and what you've built.
          </p>
          <a
            href="#join-heading"
            className="inline-flex items-center justify-center px-8 py-4 bg-primary text-white text-base font-semibold rounded-xl hover:bg-[#b05a35] transition-colors"
          >
            Join The Culo Village
          </a>
        </InnerContainer>
      </section>

      {/* ── What Culo Creatives turns your footage into — moved here from
          the standalone Creatives page, which will point straight at this
          /join funnel soon (keeping its "Creatives" label in the nav). */}
      <section className="py-16 md:py-20" aria-labelledby="output-heading">
        <InnerContainer>
          <h2 id="output-heading" className="font-heading text-2xl sm:text-3xl font-bold text-charcoal text-center leading-tight mb-10">
            What Culo Creatives turns your footage into
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {OUTPUT_FORMATS.map(f => (
              <div key={f.label} className="bg-surface border border-border rounded-2xl p-6">
                <span className="text-3xl mb-3 block">{f.emoji}</span>
                <p className="font-heading text-lg font-semibold text-charcoal mb-1.5">{f.label}</p>
                <p className="font-body text-sm text-muted leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </InnerContainer>
      </section>

      {/* ── Explore the village — real evidence, not just the pitch above.
          On the same blue treatment as "What is CULO Creatives" above, with
          a short paragraph about the Village's actual services (not just
          the story grid alone), since this is the section that should sell
          what membership includes, not only show finished output. */}
      <section className="relative overflow-hidden py-16 md:py-20" aria-labelledby="explore-heading">
        <div className="absolute inset-0 bg-background" aria-hidden="true">
          <div
            className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, #7CA9CC 0%, transparent 70%)' }}
          />
          <div
            className="absolute -bottom-24 -right-24 w-[400px] h-[400px] rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #5E6B4A 0%, transparent 70%)' }}
          />
        </div>
        <InnerContainer className="relative">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <p className="font-body text-xs font-semibold text-primary uppercase tracking-widest mb-3">
              Explore the Village
            </p>
            <h2 id="explore-heading" className="font-heading text-2xl sm:text-3xl font-bold text-charcoal leading-tight mb-4">
              Incredible founders building a body of work from the knowledge they already share online.
            </h2>
            <p className="font-body text-base text-muted leading-relaxed mb-4">
              Every founder in The Culo Village gets a public profile connecting who they are, what they've
              built and the stories, ideas and expertise they've already shared.
            </p>
            <p className="font-body text-base text-muted leading-relaxed">
              Each piece of content can become its own published story, creating a growing body of work
              designed to be discovered by people, search engines and AI.
            </p>
          </div>
          <StoryGrid
            filter={{ publicOnly: true }}
            columns={3}
            cardVariant="vertical"
            limit={3}
            hideEmpty
            action={{ label: 'See all stories', href: '/stories' }}
          />
        </InnerContainer>
      </section>

      {/* ── Founder note ──────────────────────────────────────────────────── */}
      <section className="py-16 md:py-20 bg-background border-y border-border" aria-labelledby="founder-note-heading">
        <InnerContainer>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-center">
            <div>
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-charcoal">
                <iframe
                  src="https://www.youtube.com/embed/Mv40KqkNwM8?start=250"
                  title="Shakas presenting CULO Creatives in Canva for World Digital Accessibility Day with A11yBytes"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                />
              </div>
              <p className="font-body text-xs text-muted mt-3">
                Shakas presenting CULO Creatives in Canva for World Digital Accessibility Day with{' '}
                <a
                  href="https://a11ybytes.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  A11yBytes
                </a>
              </p>
            </div>
            <div className="text-center">
              <p className="font-body text-xs font-semibold text-primary uppercase tracking-widest mb-4">
                From the founder
              </p>
              <p id="founder-note-heading" className="font-body text-base sm:text-lg text-charcoal leading-relaxed mb-6">
                "Business owners don't have time to learn another course or wrestle with AI prompts to get
                strong storytelling content. I took Pretty Cool Marketing's proven workflow and made it
                accessible inside Canva — for the billions of users who struggle to tell their story and show
                up in all formats online."
              </p>
              <p className="font-body text-sm text-muted">Shakas — CEO / Founder of Pretty Cool Marketing x CULO</p>
            </div>
          </div>
        </InnerContainer>
      </section>

      {/* ── Want it done for you — bridges into Pretty Cool Marketing's
          done-for-you services for anyone who'd rather not run the
          publishing themselves. */}
      <section className="py-16 md:py-20 bg-charcoal text-center" aria-labelledby="services-heading">
        <InnerContainer className="max-w-2xl">
          <p className="font-body text-xs font-semibold text-primary uppercase tracking-widest mb-4">
            Would rather not do this yourself?
          </p>
          <h2 id="services-heading" className="font-heading text-2xl sm:text-3xl font-bold text-white mb-4 leading-tight">
            Pretty Cool Marketing can run it for you
          </h2>
          <p className="font-body text-base text-white/70 leading-relaxed mb-8">
            Send us your footage and archive, and we run Culo Creatives for you — turning it into finished
            blogs, carousels and reels, publishing it into the Village and scheduling it across every platform,
            no Canva editing required on your end.
          </p>
          <Link
            to="/marketing"
            className="inline-flex items-center justify-center px-8 py-4 bg-primary text-white text-base font-semibold rounded-xl hover:bg-[#b05a35] transition-colors"
          >
            See our services →
          </Link>
        </InnerContainer>
      </section>

      <Footer />
    </main>
    </>
  )
}
