import { usePageMeta } from '../utils/usePageMeta'
import { InnerContainer } from '../components/layout/PageContainer'
import { WaitlistForm } from '../components/ui/WaitlistForm'

const FORMATS = [
  { emoji: '📝', label: 'Blog', desc: 'Turns what you actually said into a proper written article with a beginning, middle and point.' },
  { emoji: '🎠', label: 'Carousel', desc: 'Pulls the strongest ideas from your footage and turns them into swipeable slides ready to design and publish.' },
  { emoji: '🎥', label: 'Talking Head Reel', desc: 'Your talking-head footage cleaned up with subtitles, hooks and captions so it is ready to post.' },
  { emoji: '🎙️', label: 'Voiceover Reel', desc: 'Your words layered over your own footage and shaped into a short-form story.' },
  { emoji: '🎬', label: 'Vlog / Behind the Scenes', desc: 'The in-between moments, the process and the stuff you probably filmed without knowing what to do with it yet.' },
  { emoji: '⚡', label: 'Quick Rhythm Reel', desc: 'Short, fast-paced edits with strong opening hooks and tighter cuts built for attention.' },
]

const STEPS = [
  {
    title: 'Let CULO get to know you',
    paragraphs: [
      <>Tell CULO about your business, your audience, your voice and the stories behind what you do.</>,
      <>So what it creates sounds like <strong className="text-charcoal font-semibold">you</strong>, not whoever used the app before you.</>,
    ],
  },
  {
    title: 'Drop in the footage you already have',
    paragraphs: [
      <>Upload the raw videos sitting in your camera roll, content folder or Canva media library.</>,
      <>No need to trim it first. No need to decide what format it should become. That is CULO's job.</>,
    ],
  },
  {
    title: 'Turn one upload into multiple pieces',
    paragraphs: [
      <>CULO pulls different angles, formats and stories from the same footage and builds them inside Canva.</>,
      <>Blogs. Carousels. Reels. Voiceovers. Vlogs. You edit what you want, make it yours and publish when you are ready.</>,
    ],
  },
]

export function CreativesPage() {
  usePageMeta({
    title: 'CULO Creatives — Exclusively in Canva',
    description: 'CULO Creatives turns your raw footage into blogs, carousels and reels — exclusively in Canva. The Canva editing app built for founders who are short on time, not ideas. Join the waitlist.',
    keywords: [
      'CULO Creatives', 'Canva app', 'Canva editing app', 'Canva integration', 'exclusively in Canva',
      'content creation app', 'video editing for founders', 'AI content creation', 'social media content from video',
      'reel editing app', 'carousel maker', 'founder content marketing', 'turn video into blog',
    ],
    ogType: 'website',
  })

  return (
    <main className="min-h-screen bg-background">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="bg-charcoal py-24 md:py-28 relative overflow-hidden text-center">
        <InnerContainer>
          <p className="font-body text-xs font-semibold text-primary uppercase tracking-widest mb-4">
            Coming soon · Exclusively in Canva
          </p>
          <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight max-w-3xl mx-auto">
            What is CULO Creatives? Coming soon exclusively to Canva!
          </h1>
        </InnerContainer>
      </section>

      {/* ── What it makes ─────────────────────────────────────────────────── */}
      <section className="py-16 md:py-20" aria-labelledby="formats-heading">
        <InnerContainer>
          <div className="max-w-2xl mb-12">
            <p className="font-body text-xs font-semibold text-primary uppercase tracking-widest mb-3">
              What CULO Creatives makes
            </p>
            <h2 id="formats-heading" className="font-heading text-3xl sm:text-4xl font-bold text-charcoal mb-4 leading-tight">
              One upload. A whole stack of content.
            </h2>
            <p className="font-body text-lg text-muted leading-relaxed mb-3">
              Give CULO one piece of raw footage and it turns it into multiple ready-to-use formats inside Canva.
            </p>
            <p className="font-body text-lg text-muted leading-relaxed mb-3">
              No bouncing between editing apps. No rebuilding the same idea five different ways. No starting
              from a blank page every time you want to post.
            </p>
            <p className="font-body text-lg text-muted leading-relaxed">
              Just more from what you already made.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FORMATS.map(f => (
              <div key={f.label} className="bg-surface border border-border rounded-2xl p-6">
                <span className="text-3xl mb-3 block">{f.emoji}</span>
                <p className="font-heading text-lg font-semibold text-charcoal mb-1.5">{f.label}</p>
                <p className="font-body text-sm text-muted leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </InnerContainer>
      </section>

      {/* ── How it works ──────────────────────────────────────────────────── */}
      <section className="py-16 md:py-20 bg-surface border-y border-border" aria-labelledby="how-heading">
        <InnerContainer>
          <div className="max-w-2xl mb-12">
            <p className="font-body text-xs font-semibold text-primary uppercase tracking-widest mb-3">
              How it works
            </p>
            <h2 id="how-heading" className="font-heading text-3xl sm:text-4xl font-bold text-charcoal leading-tight">
              You bring the footage. CULO does the pulling apart.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((s, i) => (
              <div key={s.title}>
                <div className="w-11 h-11 rounded-full bg-primary/10 text-primary font-heading font-bold flex items-center justify-center mb-4">
                  {i + 1}
                </div>
                <p className="font-heading text-xl font-semibold text-charcoal mb-2">{s.title}</p>
                {s.paragraphs.map((p, j) => (
                  <p key={j} className="font-body text-base text-muted leading-relaxed mb-2 last:mb-0">{p}</p>
                ))}
              </div>
            ))}
          </div>
        </InnerContainer>
      </section>

      {/* ── Watch the demo ────────────────────────────────────────────────── */}
      <section className="py-16 md:py-20" aria-labelledby="demo-heading">
        <InnerContainer>
          <div className="max-w-2xl mb-8">
            <p className="font-body text-xs font-semibold text-primary uppercase tracking-widest mb-3">
              See it in Canva
            </p>
            <h2 id="demo-heading" className="font-heading text-3xl sm:text-4xl font-bold text-charcoal leading-tight">
              Watch the demo.
            </h2>
          </div>
          <div className="max-w-3xl">
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-charcoal">
              <video
                src="/creatives/culo-app-demo.mp4"
                controls
                preload="metadata"
                className="absolute inset-0 w-full h-full object-contain bg-black"
              />
            </div>
            <div className="flex flex-wrap items-center gap-4 mt-5">
              <a
                href="https://canva.link/gh6qvlru340vrnt"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-[#b05a35] transition-colors"
              >
                Try the CULO Creatives template in Canva ↗
              </a>
              <a
                href="https://www.youtube.com/watch?v=Gg0zgIjZROI"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-muted hover:text-primary transition-colors"
              >
                Watch on YouTube ↗
              </a>
            </div>
          </div>
        </InnerContainer>
      </section>

      {/* ── Problem / solution ────────────────────────────────────────────── */}
      <section className="py-16 md:py-20" aria-labelledby="freedom-heading">
        <InnerContainer>
          <div className="bg-charcoal rounded-3xl overflow-hidden grid grid-cols-1 lg:grid-cols-2 items-center">
            <div className="px-8 py-14 md:px-16 md:py-16">
              <p className="font-body text-xs font-semibold text-primary uppercase tracking-widest mb-3">
                Have more freedom
              </p>
              <p className="font-heading text-xl sm:text-2xl text-white/80 leading-snug mb-3">
                Most founders aren't short on ideas.
              </p>
              <h2 id="freedom-heading" className="font-heading text-3xl sm:text-4xl font-bold text-white leading-tight mb-8">
                They're short on time. Stop working yourself into the ground just to show up on social media.
              </h2>
              <div className="max-w-md">
                <WaitlistForm source="creatives-problem-solution" dark />
              </div>
            </div>
            <img
              src="https://d1yei2z3i6k35z.cloudfront.net/9196234/69133710b9de8_6cb2e91d97660f3581a9b04a089d6263.jpg"
              alt="A founder with more freedom, having handed their content creation over to CULO Creatives"
              className="w-full h-full min-h-64 object-cover"
            />
          </div>
        </InnerContainer>
      </section>

      {/* ── Founder note ──────────────────────────────────────────────────── */}
      <section className="py-16 md:py-20 bg-surface border-y border-border" aria-labelledby="founder-note-heading">
        <InnerContainer>
          <div className="max-w-2xl mx-auto text-center">
            <p className="font-body text-xs font-semibold text-primary uppercase tracking-widest mb-4">
              From the founder
            </p>
            <p id="founder-note-heading" className="font-heading text-2xl sm:text-3xl text-charcoal leading-snug mb-6">
              "Business owners don't have time to learn another course or wrestle with AI prompts. They just
              want their story turned into content that sounds like them."
            </p>
            <p className="font-body text-sm text-muted mb-8">Shakas — Founder, CULO &amp; Pretty Cool Marketing</p>
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-charcoal text-left">
              <iframe
                src="https://www.youtube.com/embed/Mv40KqkNwM8?start=250"
                title="Shakas speaking on Canva and digital accessibility"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            </div>
            <p className="font-body text-xs text-muted mt-3">Shakas speaking on Canva and digital accessibility.</p>
          </div>
        </InnerContainer>
      </section>

      {/* ── Final CTA / waitlist ─────────────────────────────────────────────
        The flagship waitlist moment — held for the bottom of the page so
        everything above it makes the case first.
      */}
      <section className="bg-charcoal pt-20 pb-24 relative overflow-hidden">
        <InnerContainer>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="font-body text-xs font-semibold text-primary uppercase tracking-widest mb-4">
                Coming soon · Exclusively in Canva
              </p>
              <h2 className="font-heading text-4xl sm:text-6xl font-bold text-white mb-6 leading-tight">
                CULO Creatives is coming to Canva.
              </h2>
              <p className="font-body text-lg sm:text-xl text-white/70 leading-relaxed mb-8 max-w-2xl">
                The Canva editing app that turns your raw footage and messy thoughts into blogs, carousels and
                reels — without ever leaving Canva. Built for founders who aren't short on ideas, just short
                on time.
              </p>
              <div className="max-w-md">
                <WaitlistForm source="creatives-final-cta" dark />
                <p className="font-body text-xs text-white/40 mt-3">
                  We hate spam. Your email stays private — we'll only email you when it's ready.
                </p>
              </div>
            </div>
            <div className="relative">
              <img
                src="/creatives/culo-canva-hero.png"
                alt="CULO Creatives inside Canva — turn your expertise into structured content in Canva, then publish in the Village for discovery"
                className="w-full h-auto rounded-3xl"
              />
            </div>
          </div>
        </InnerContainer>
      </section>

    </main>
  )
}
