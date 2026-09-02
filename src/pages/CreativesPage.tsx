import { usePageMeta } from '../utils/usePageMeta'
import { InnerContainer } from '../components/layout/PageContainer'
import { WaitlistForm } from '../components/ui/WaitlistForm'

const FORMATS = [
  { emoji: '📖', label: 'Blogs', desc: 'Turns what you actually said into a proper written article with a beginning, middle and point.' },
  { emoji: '✍️', label: 'Carousels', desc: 'Pulls the strongest ideas from your footage and turns them into swipeable slides ready to design and publish.' },
  { emoji: '🗣️', label: 'Talking Head Reels', desc: 'Your talking-head footage cleaned up with subtitles, hooks and captions so it is ready to post.' },
  { emoji: '🎙️', label: 'Voice Over Reels', desc: 'Your words layered over your own footage and shaped into a short-form story.' },
  { emoji: '🎥', label: 'Vlog Behind The Scenes Reels', desc: 'The in-between moments, the process and the stuff you probably filmed without knowing what to do with it yet.' },
  { emoji: '⚡', label: 'Quick Rhythm Reels', desc: 'Short, fast-paced edits with strong opening hooks and tighter cuts built for attention.' },
]

const STEPS = [
  {
    title: 'Answer a few personalised questions',
    image: '/creatives/step-1-about-you.png',
    bullets: [
      <>Complete the <strong className="text-charcoal font-semibold">About You</strong> section — a few quick details about your business and brand.</>,
      <>CULO uses that to generate personalised questions in <strong className="text-charcoal font-semibold">Shape Your Idea</strong>.</>,
      <>Your answers shape the hooks, captions, blogs, carousels and Quick Rhythm reel content CULO creates.</>,
    ],
  },
  {
    title: 'Upload your raw footage',
    image: '/creatives/step-2-uploading-media.png',
    bullets: [
      <>Upload your footage into the right Media Library section — B-roll, Talking Head, Voice Over, Vlog or Photos.</>,
      <><strong className="text-charcoal font-semibold">B-roll</strong> becomes background footage for Voice Over reels, or rotates silently in Quick Rhythm reels.</>,
      <><strong className="text-charcoal font-semibold">Talking Head, Voice Over</strong> and <strong className="text-charcoal font-semibold">Vlog</strong> clips are merged into a reel with subtitles, a hook and a caption.</>,
      <><strong className="text-charcoal font-semibold">Photos</strong> are merged into a carousel slideshow.</>,
    ],
  },
  {
    title: 'Get social media ready content back',
    image: '/creatives/step-3-ready-to-post.png',
    bullets: [
      <>Ready-to-post content across Quick Rhythm, Voice Over, Talking Head and Vlog Style formats.</>,
      <>Every reel comes subtitled, hooked and captioned — straight out of Canva.</>,
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
          <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight max-w-3xl mx-auto uppercase">
            CULO helps share your story.
          </h1>
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

      {/* ── What it makes ─────────────────────────────────────────────────── */}
      <section className="py-16 md:py-20" aria-labelledby="formats-heading">
        <InnerContainer>
          <div className="max-w-2xl">
            <p className="font-body text-xs font-semibold text-primary uppercase tracking-widest mb-3">
              What CULO Creatives makes
            </p>
            <h2 id="formats-heading" className="font-heading text-3xl sm:text-4xl font-bold text-charcoal mb-4 leading-tight">
              Edit your raw footage in one workspace
            </h2>
            <p className="font-body text-lg text-muted leading-relaxed">
              CULO is a Canva integrated app that turns your thoughts and raw footage into social media
              content. Designed for founders and creators, CULO helps you create blogs, carousels and multiple
              reel formats from the stories, experiences and insights you already have.
            </p>
          </div>
        </InnerContainer>
      </section>

      {/* ── Watch the demo ────────────────────────────────────────────────── */}
      <section className="py-16 md:py-20 bg-surface border-y border-border" aria-labelledby="demo-heading">
        <InnerContainer>
          <div className="max-w-2xl mx-auto mb-8 text-center">
            <p className="font-body text-xs font-semibold text-primary uppercase tracking-widest mb-3">
              See it in Canva
            </p>
            <h2 id="demo-heading" className="font-heading text-3xl sm:text-4xl font-bold text-charcoal leading-tight">
              Watch the demo.
            </h2>
          </div>
          <div className="max-w-3xl mx-auto">
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-charcoal">
              <video
                src="/creatives/culo-app-demo.mp4"
                controls
                preload="metadata"
                className="absolute inset-0 w-full h-full object-contain bg-black"
              />
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 mt-5">
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

      {/* ── What you get back ────────────────────────────────────────────────
        The two paragraphs describing what CULO actually hands back, together
        with the format boxes themselves — placed right after the demo so a
        founder who just watched it sees exactly what it produces.
      */}
      <section className="py-16 md:py-20" aria-labelledby="output-heading">
        <InnerContainer>
          <div className="max-w-2xl mb-12">
            <p className="font-body text-lg text-muted leading-relaxed mb-3">
              Upload your footage, answer a few personalised questions, and CULO creates blogs, carousels,
              talking head reels, voice over reels, vlog behind-the-scenes reels and quick rhythm reels.
            </p>
            <p className="font-body text-lg text-muted leading-relaxed">
              Every reel includes subtitles, an on-screen hook and a caption, ready to publish.
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

      {/* ── Founder note ──────────────────────────────────────────────────── */}
      <section className="py-16 md:py-20 bg-surface border-y border-border" aria-labelledby="founder-note-heading">
        <InnerContainer>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-center">
            <div>
              <p className="font-body text-xs font-semibold text-primary uppercase tracking-widest mb-4">
                From the founder
              </p>
              <p id="founder-note-heading" className="font-heading italic text-2xl sm:text-3xl text-charcoal leading-snug mb-6">
                "Business owners don't have time to learn another course or wrestle with AI prompts to get
                strong storytelling content. I took Pretty Cool Marketing's proven workflow and made it
                accessible inside Canva — for the billions of users who struggle to tell their story and show
                up in all formats online."
              </p>
              <p className="font-body text-sm text-muted">Shakas — CEO / Founder of Pretty Cool Marketing x CULO</p>
            </div>
            <div>
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-charcoal">
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
              <h2 className="font-heading text-4xl sm:text-6xl font-bold text-white mb-8 leading-tight">
                CULO is a Canva integrated app that turns your thoughts and raw footage into social media
                content.
              </h2>
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
