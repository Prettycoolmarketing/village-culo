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
    paragraphs: [
      <>Founders begin by answering questions about their business, their audience and their brand.</>,
      <>CULO continues by generating 3 more personalised questions, so no output is ever the same.</>,
    ],
  },
  {
    title: 'Add your raw footage',
    paragraphs: [
      <>Add your raw footage in the provided media library and CULO will edit it into social media ready posts.</>,
    ],
  },
  {
    title: 'Get social media ready content back',
    paragraphs: [
      <>CULO creates a minimum of 5 social media ready reels, carousels and blogs for your website.</>,
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
          <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight max-w-3xl mx-auto mb-6">
            CULO helps founders share their story.
          </h1>
          <p className="font-body text-lg md:text-xl text-white/70 leading-relaxed max-w-2xl mx-auto">
            CULO is a Canva integrated app that turns your thoughts and raw footage into social media content.
            Designed for founders and creators, CULO helps you create blogs, carousels and multiple reel
            formats from the stories, experiences and insights you already have.
          </p>
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

      {/* ── Problem statement ─────────────────────────────────────────────── */}
      <section className="py-16 md:py-20 text-center">
        <InnerContainer>
          <p className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-charcoal leading-tight max-w-2xl mx-auto">
            Stop working your CULO off just to be on social media.
          </p>
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
