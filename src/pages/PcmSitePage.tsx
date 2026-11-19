import { usePageMeta } from '../utils/usePageMeta'
import { InnerContainer } from '../components/layout/PageContainer'

// The standalone "who I am / what I do" page served at prettycoolmarketing.com
// (see PcmSiteRoot + main.tsx for the host switch). Same copy as the old
// systeme.io site, restyled with the Culo Village design system: Playfair /
// Inter, terracotta primary, blue-grey background, the soft radial-gradient
// hero, #EBF2F8 cards and the charcoal CTA band.
//
// It's a one-pager with its own slim header/footer — no Village navbar — and
// every "go deeper" CTA points at culovillage.com, where the real funnels,
// lead capture and Terms/Privacy live. All links are absolute so the page
// works on either domain.

const VILLAGE = 'https://www.culovillage.com'
const MARKETING = `${VILLAGE}/marketing`
const CALL_URL = 'https://calendly.com/prettycoolmarketing_/30min'
const CONTACT_URL = 'https://calendly.com/prettycoolmarketing_/branding?back=1'
const LINKEDIN_URL = 'https://www.linkedin.com/in/shakasdesigner'

const WHY_CHOOSE = [
  ['15+ years behind the camera', 'videography, photography, and visual storytelling'],
  ['Multiple successful business owner', 'I’ve launched, scaled, and sold my own brands'],
  ['Smooth onboarding & delivery systems', 'everything is clear, organised, and stress-free'],
  ['Automation-first approach', 'we build content and funnels that keep working for you'],
  ['Training included with every service', 'so you stay confident and in control'],
  ['Founder-led experience', 'you get real strategy from someone who’s lived it'],
] as const

const SITUATIONS = [
  ['A', 'I want my brand to look premium but don’t know how'],
  ['B', 'My camera roll is full but nothing gets posted'],
  ['C', 'Our ads go stale and need fresh creative weekly'],
  ['D', 'I have no systems in place to make sales'],
] as const

const ARCHETYPES = ['Talking Head', 'Quick Rhythm', 'Voice over', 'Static Posts', 'Ai Generated', 'Carousels & Captions']

const btnPrimary =
  'inline-flex items-center justify-center px-7 py-3.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-[#b05a35] transition-colors'
const btnDark =
  'inline-flex items-center justify-center px-7 py-3.5 bg-charcoal text-white text-sm font-semibold rounded-xl hover:bg-[#1a1815] transition-colors'

export function PcmSitePage() {
  // The same page is reachable on culovillage.com/pcm-site for previewing —
  // keep that copy out of search so it never competes with the real domain.
  const onPcmDomain = typeof window !== 'undefined' && /(^|\.)prettycoolmarketing\.com$/i.test(window.location.hostname)

  usePageMeta({
    title: 'Pretty Cool Marketing',
    description:
      'Pretty Cool Marketing builds content systems for Australian founders, turning raw footage, stories and expertise into reels, blogs and strategic social media content.',
    keywords: ['Pretty Cool Marketing', 'social media management', 'digital marketing operations', 'content creation', 'Australia'],
    noindex: !onPcmDomain,
  })

  return (
    <div className="min-h-screen bg-background font-body text-charcoal">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <header className="bg-surface border-b border-border">
        <InnerContainer className="flex items-center justify-between h-16">
          <a href="/" className="font-heading text-lg sm:text-xl font-bold text-charcoal">
            Pretty Cool <span className="text-primary">Marketing</span>
          </a>
          <nav className="flex items-center gap-5 sm:gap-8 text-sm font-medium">
            <a href={VILLAGE} className="text-charcoal hover:text-primary transition-colors">The Culo Village</a>
            <a href={`${VILLAGE}/speaker`} className="text-charcoal hover:text-primary transition-colors">Speaker</a>
          </nav>
        </InnerContainer>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-background py-16 md:py-24 border-b border-border">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
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
          <div className="grid gap-10 lg:gap-16 items-center lg:grid-cols-2">
            <div>
              <p className="text-xs font-semibold text-charcoal/70 uppercase tracking-widest mb-4">
                Pretty Cool Marketing
              </p>
              <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-bold text-charcoal leading-tight mb-6">
                Your brand deserves to be seen everywhere.
              </h1>
              <div className="text-base sm:text-lg text-charcoal/80 leading-relaxed max-w-xl">
                <p className="mb-4">
                  We turn your photos, stories, and chaos into a content engine that builds visibility, trust, and sales.
                </p>
                <p className="mb-8">How? Thanks to Culo Creatives in Canva and The Culo Village!</p>
              </div>
              <a href={MARKETING} className={btnPrimary}>Explore services</a>
              <p className="mt-6 text-sm text-muted">
                Australia-wide <span className="text-primary">✦</span> Limited spots monthly <span className="text-primary">✦</span> Travel options available
              </p>
            </div>
            <div className="lg:justify-self-end w-full lg:max-w-md">
              <div className="rounded-3xl overflow-hidden shadow-lg border border-border bg-surface">
                <img
                  src="/assets/pcm/glamping.jpg"
                  alt="Glamping tents lit with fairy lights at dusk"
                  className="w-full h-80 lg:h-[26rem] object-cover"
                />
              </div>
            </div>
          </div>
        </InnerContainer>
      </section>

      {/* ── What makes us different ──────────────────────────────────────── */}
      <section className="py-16 md:py-20 bg-surface border-b border-border">
        <InnerContainer>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-charcoal mb-10 leading-tight text-center">
            Explore What Makes Us Different
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {['Social Media Management', 'Digital Marketing Operations'].map(label => (
              <a
                key={label}
                href={MARKETING}
                className="group bg-[#EBF2F8] border border-[#CFE0EE] rounded-2xl p-10 shadow-card hover:shadow-md transition-all flex items-center justify-between gap-4"
              >
                <h3 className="font-heading text-2xl font-bold text-charcoal leading-tight">{label}</h3>
                <span className="text-primary text-xl group-hover:translate-x-1 transition-transform" aria-hidden="true">→</span>
              </a>
            ))}
          </div>
        </InnerContainer>
      </section>

      {/* ── Meet the founder ─────────────────────────────────────────────── */}
      <section className="py-16 md:py-24 bg-background border-b border-border">
        <InnerContainer>
          <div className="grid gap-10 lg:gap-16 items-center lg:grid-cols-2">
            <div className="lg:order-2">
              <p className="text-xs font-semibold text-charcoal/70 uppercase tracking-widest mb-4">Meet The Founder</p>
              <h2 className="font-heading text-3xl md:text-5xl font-bold text-charcoal leading-tight mb-6">
                Hey! I’m Shakas!
              </h2>
              <div className="text-base sm:text-lg text-charcoal/80 leading-relaxed space-y-4 max-w-xl">
                <p>
                  I’ve built multiple businesses from scratch - from an adventure tour company to a patented lifestyle product.
                </p>
                <p>
                  Every win, every pivot, every messy middle taught me the one thing most business owners struggle to
                  implement is you need a system!
                </p>
                <p>I built it for you to use however have a team ready to partner with you</p>
                <p>
                  We specialise in branded content creation, multi-archetype reel editing, and building automated content
                  systems that founders can manage effortlessly long-term.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 mt-8">
                <a href={CALL_URL} className={btnPrimary}>Book a free strategy call</a>
                <a href={`${VILLAGE}/culocreatives`} className={btnDark}>Want to do it yourself?</a>
              </div>
            </div>
            <div className="lg:order-1 flex justify-center">
              <div className="w-full max-w-sm rounded-3xl overflow-hidden shadow-lg border border-border bg-surface">
                <img src="/assets/pcm/shakas.png" alt="Shakas, founder of Pretty Cool Marketing" className="w-full aspect-square object-cover" />
              </div>
            </div>
          </div>
        </InnerContainer>
      </section>

      {/* ── Why choose ───────────────────────────────────────────────────── */}
      <section className="py-16 md:py-20 bg-surface border-b border-border">
        <InnerContainer>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-charcoal mb-10 leading-tight text-center">
            Why Choose <br className="sm:hidden" />Pretty Cool Marketing?
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {WHY_CHOOSE.map(([title, body], i) => (
              <div key={title} className="bg-[#EBF2F8] border border-[#CFE0EE] rounded-2xl p-8 shadow-card">
                <span className={`font-heading text-3xl font-bold ${i % 2 === 0 ? 'text-[#3E6E92]' : 'text-primary'}`}>{i + 1}</span>
                <h3 className="font-heading text-lg font-bold text-charcoal mt-2 mb-2 leading-snug">{title}</h3>
                <p className="text-muted leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </InnerContainer>
      </section>

      {/* ── Speaking + Canva banner ──────────────────────────────────────── */}
      <section className="py-16 md:py-20 bg-background border-b border-border">
        <InnerContainer>
          <div className="grid gap-10 lg:gap-16 items-center lg:grid-cols-2">
            <div className="flex justify-center">
              <div className="w-full max-w-sm rounded-3xl overflow-hidden shadow-lg border border-border bg-surface">
                <img src="/assets/pcm/shakas-speaking.png" alt="Shakas speaking on stage" className="w-full aspect-square object-cover" />
              </div>
            </div>
            <div>
              <p className="inline-block px-4 py-2 rounded-full bg-[#FBF1EB] text-sm font-semibold text-charcoal mb-6">
                ✨ <a href={`${VILLAGE}/creatives`} className="underline hover:text-primary">Culo Creatives coming soon to Canva !</a> ✨
              </p>
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-charcoal leading-tight mb-6">
                Contact Shakas
              </h2>
              <div className="flex flex-col sm:flex-row gap-3">
                <a href={CONTACT_URL} className={btnPrimary}>Contact Shakas</a>
                <a href={`${VILLAGE}/speaker`} className={btnDark}>Speaker</a>
              </div>
            </div>
          </div>
        </InnerContainer>
      </section>

      {/* ── Apply — blue section, orange buttons ─────────────────────────── */}
      <section className="py-16 md:py-20 bg-[#EBF2F8] border-b border-[#CFE0EE]">
        <InnerContainer>
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-charcoal leading-tight">
                Let's Elevate Your Digital Marketing Presence
              </h2>
              <p className="mt-4 text-lg text-charcoal/80 leading-relaxed">
                You’ll receive access to our rates and an invitation to book your strategy call on the next page.
              </p>
            </div>
            <div className="md:justify-self-end w-full md:max-w-md bg-surface border border-border rounded-2xl p-8 shadow-lg">
              <p className="font-heading text-xl font-bold text-charcoal mb-4">Which best describes your situation right now?</p>
              <ul className="space-y-3 mb-6">
                {SITUATIONS.map(([letter, text]) => (
                  <li key={letter} className="flex gap-3 text-charcoal/80 leading-snug">
                    <span className="font-heading font-bold text-primary">{letter}:</span>
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
              <a href={MARKETING} className={`${btnPrimary} w-full`}>Apply</a>
            </div>
          </div>
        </InnerContainer>
      </section>

      {/* ── Archetypes — charcoal band, same as Culo's bottom CTA ────────── */}
      <section className="py-16 md:py-24 bg-background">
        <InnerContainer>
          <div className="bg-charcoal rounded-3xl px-8 py-14 md:px-16 md:py-20 text-center">
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-4">Social media archetypes</p>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-5 leading-tight max-w-2xl mx-auto">
              What are social media archetypes?
            </h2>
            <p className="text-lg text-white/70 leading-relaxed mb-8 max-w-2xl mx-auto">
              Knowing your archetype is like having a cheat code for your content creation game.
            </p>
            <div className="flex flex-wrap justify-center gap-2.5">
              {ARCHETYPES.map(a => (
                <span key={a} className="px-4 py-2 rounded-full bg-white/10 text-white/90 text-sm font-medium">{a}</span>
              ))}
            </div>
          </div>
        </InnerContainer>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="bg-charcoal text-white/80" role="contentinfo">
        <InnerContainer className="py-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div>
              <p className="font-heading text-2xl font-bold text-white">
                Pretty Cool <span className="text-primary">Marketing</span>
              </p>
              <p className="text-sm text-white/50 mt-1">Part of The Culo Village</p>
            </div>
            <nav className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
              <a href={`${VILLAGE}/terms`} className="text-white/60 hover:text-white transition-colors">Terms and Conditions</a>
              <a href={`${VILLAGE}/privacy`} className="text-white/60 hover:text-white transition-colors">Privacy Policy</a>
              <a href={LINKEDIN_URL} className="text-white/60 hover:text-white transition-colors" target="_blank" rel="noopener noreferrer">LinkedIn</a>
              <a href={VILLAGE} className="text-white/60 hover:text-white transition-colors">The Culo Village</a>
              <a href={`${VILLAGE}/speaker`} className="text-white/60 hover:text-white transition-colors">Speaker</a>
            </nav>
          </div>
        </InnerContainer>
      </footer>
    </div>
  )
}
