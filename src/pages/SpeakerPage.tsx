import { Link } from 'react-router-dom'
import { usePageMeta } from '../utils/usePageMeta'
import { normalizeUrl } from '../utils/url'
import { InnerContainer } from '../components/layout/PageContainer'
import { getFounderBySlug } from '../services/founders'
import { getBusinesses } from '../services/businesses'
import { getStories } from '../services/stories'
import { importedContentService } from '../services/importedContent'

// The one link handed to a podcast booker, journalist or conference
// organiser — built around the actual bookable ideas (what she'd speak
// about), with the four real businesses as the proof behind those ideas,
// not the headline act. Copy is authored (Shakas's own voice, given
// directly), while the credibility numbers and business links stay pulled
// from live data so they never drift out of date.
const TALKS: { title: string; paragraphs: string[] }[] = [
  {
    title: 'Your content already exists',
    paragraphs: [
      "Founders constantly tell me they don't have enough content.",
      'Most of the time, I think the opposite is true.',
      'They have years of expertise sitting in camera rolls, old captions, Zoom calls, podcast interviews, customer conversations and things they say every single day while running the business.',
      "The problem isn't always creating more.",
      'It is learning how to extract, structure and reuse what you already know.',
      'This talk is about turning lived experience into a repeatable content system without turning the founder into a full-time content creator.',
    ],
  },
  {
    title: 'Stop feeding the feed',
    paragraphs: [
      'We have built an internet where incredibly valuable founder knowledge is created for something designed to disappear.',
      'A Reel gets reach for a day. A LinkedIn post gets pushed down the profile. A story disappears. Then we make another one.',
      'I talk about what changes when we stop thinking about content only as social media and start treating it as a body of knowledge that compounds over time.',
      'What should live on social? What should become searchable? What should belong to the founder instead of the algorithm? And what happens when those things start working together?',
    ],
  },
  {
    title: "Your social audience isn't your only asset",
    paragraphs: [
      'Follower count is useful. But a founder’s actual asset is much bigger than the number sitting beside their Instagram name.',
      'It is their stories, knowledge, experience, opinions, expertise, relationships and the body of work proving what they know.',
      "I talk about building founder visibility that doesn't disappear when an algorithm changes, a platform dies or reach drops.",
      'Your audience matters. Your body of work matters too.',
    ],
  },
  {
    title: 'What happens when AI becomes part of the audience?',
    paragraphs: [
      "People aren't only finding businesses through Google and Instagram anymore. They are asking AI.",
      'Who knows about this? Who has experience doing that? Which founder should I listen to? Who can speak on this subject?',
      'That changes the way I think founders should publish.',
      'AI cannot understand years of expertise particularly well when it is scattered across hundreds of disconnected social posts with no context around who said it, what they know or how the ideas relate.',
      'I speak about the shift from simply making content for humans scrolling feeds to building a body of work that humans, search engines and AI can understand. Not writing for robots. Making the human behind the work clearer.',
    ],
  },
  {
    title: "Building technology when you didn't start in tech",
    paragraphs: [
      'I did not begin with code. I began with workflow knowledge.',
      'Photography and videography taught me how people actually make content. Running Stagger Inn Adventures taught me customer experience and what it means to build something while doing the work yourself. Billow Beach taught me product design from the problem backwards. Pretty Cool Marketing showed me exactly where founder content systems were breaking. And CULO came from trying to solve that workflow properly.',
      'I speak about becoming an Australian technology founder without following the traditional path into technology, and why sometimes the person closest to the broken workflow is exactly the person who should build the software.',
    ],
  },
  {
    title: 'Building in public before you feel ready',
    paragraphs: [
      'There is a strange pressure around startups to either look completely polished or stay quiet until you are. That isn’t how I’ve built.',
      'I document what is working, what isn’t, what we changed, what people told me, what I got wrong and what the product is becoming.',
      'I can talk about building while the answer is still moving, sharing an unfinished idea without pretending it is finished, and using real founder stories as part of the business rather than manufacturing a founder brand afterwards.',
    ],
  },
  {
    title: 'When your startup looks like it is trying to do too much',
    paragraphs: [
      'This is one I have had to answer myself. How do you explain several connected products without making the business sound like five businesses? How do you talk about the big vision without losing the entry point?',
      'How do you separate what gets someone in from what the ecosystem eventually becomes?',
      'For CULO, creation, publishing, discovery, founder identity and services all connect, but they cannot all be the first sentence of the pitch.',
      'I can speak about finding the wedge, explaining an ecosystem simply, handling the inevitable "you’re trying to do too much" feedback, and learning the difference between a long-term vision and the thing somebody needs to understand today.',
    ],
  },
  {
    title: 'From expertise to education',
    paragraphs: [
      'One of my biggest beliefs is that founder content should start with the person, not a generic content calendar.',
      'A hairdresser shouldn’t be asked the same questions as a naturopath. A tourism founder shouldn’t receive the same prompts as someone building SaaS.',
      'The valuable content lives in what that particular person has actually done, knows, believes and can teach.',
      'I talk about building content systems around experience first, then turning that experience into useful education, stories and searchable knowledge.',
    ],
  },
  {
    title: 'Building businesses around an actual problem',
    paragraphs: [
      "Billow Beach started because I wanted something at the beach that didn't exist. A bag. A towel. A pillow. One thing instead of three.",
      "CULO came from the same place. I wasn't trying to invent a trendy AI product. I was trying to fix a workflow I understood because I had lived inside it for years.",
      'I can speak about problem-led product design, testing ideas through your own life, and what changes when the founder is also the first real user.',
    ],
  },
  {
    title: 'Building a business without building a conventional life around it',
    paragraphs: [
      'I build while travelling Australia with Mitch and our two kids in a MAN truck. That is not the polished "digital nomad founder" version of the story.',
      'It is children, internet, deadlines, filming, product decisions, investor conversations, driving days, family and trying to work out what deserves your attention when everything is happening at once.',
      'I can talk about building companies around real life instead of waiting for the perfect office, perfect routine or perfect season to start.',
    ],
  },
]

const PANEL_TOPICS = [
  'Founder-led marketing and why founders already have more content than they think',
  'What founder visibility looks like after the social feed',
  'How AI changes founder discovery',
  'Why publishing is becoming part of founder infrastructure',
  'Turning raw footage and lived experience into searchable knowledge',
  "Building a technology company when you aren't from a traditional tech background",
  'How to explain a big startup vision without losing the first wedge',
  'What to do when investors tell you the business is trying to do too much',
  'Building products from workflow knowledge rather than starting with technology',
  'Building in public without overselling an unfinished product',
  'Product design through lived problems',
  'Building businesses, raising a family and working on the road',
]

// slug-agnostic match on business name — DB slugs on these have some
// trailing-character noise ("billow-beach-") from earlier imports, so
// matching on the trimmed, lowercased name is more reliable here than slug.
const BUSINESS_COPY: Record<string, { lesson: string; linkLabel: string }> = {
  'stagger inn adventures': {
    lesson: 'A Darwin-based 4WD tour company Mitch and I built and operated together. It taught me how to sell an experience, understand customers and build something while being completely inside the day-to-day operation.',
    linkLabel: 'See the archive ↗',
  },
  'billow beach': {
    lesson: 'A three-in-one beach bag I designed with an integrated towel and pillow because I wanted something that didn’t exist yet. It taught me product development, prototyping, manufacturing, branding and what happens after the idea when you actually have to bring a physical product to life.',
    linkLabel: 'billowbeach.com ↗',
  },
  'pretty cool marketing': {
    lesson: 'The service business that put me directly inside the content problem. Working with founders and businesses showed me that people weren’t short of expertise. They were short of a system for pulling it out, turning it into content and continuing to use it after the social post disappeared.',
    linkLabel: 'prettycoolmarketing.com ↗',
  },
  'the culo village': {
    lesson: 'The technology that grew out of everything before it. Culo Creatives turns founders’ raw footage, thoughts and experience into different content formats inside Canva. The Culo Village takes the growing body of work and gives it a structured, searchable home connected back to the founder.',
    linkLabel: 'culovillage.com ↗',
  },
}

export function SpeakerPage() {
  const founder = getFounderBySlug('shakas-designer')
  const businesses = founder ? getBusinesses({ founderId: founder.id }) : []
  const publishedStories = getStories({ publicOnly: true })
  const totalImports = importedContentService.getAll().length

  const sameAs = [
    founder?.linkedin, founder?.instagram, founder?.youtube,
    ...businesses.map(b => b.website),
  ].filter((u): u is string => !!u).map(u => normalizeUrl(u))

  const bioText = "Shakas Designer is an Australian technology founder, entrepreneur, photographer, videographer and content creator. Her path into technology started long before she wrote her first product brief.\n\nAfter more than 15 years working behind a camera, Shakas went on to co-found a 4WD tourism business, design Billow Beach, build Pretty Cool Marketing and eventually create CULO after repeatedly running into the same problem: founders had valuable stories, ideas and expertise everywhere, but no real system connecting it all together.\n\nToday she is building Culo Creatives, a Canva-native creation workflow for turning raw footage and founder knowledge into usable content, alongside The Culo Village, a founder publishing and discovery platform designed to make that growing body of work easier for people, search engines and AI to understand.\n\nShe travels Australia with her partner Mitch and their two children in a converted MAN truck while building, documenting and publishing the process as it happens."

  usePageMeta({
    title: 'Speaker & Press',
    description: "Shakas Designer — Australian technology founder building at the intersection of founder knowledge, content, search and AI discovery. Speaker topics, press enquiries and the four businesses behind CULO.",
    ogType: 'profile',
    ogImage: founder?.avatar,
    jsonLd: founder ? {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: founder.name.trim(),
      description: bioText,
      ...(founder.avatar ? { image: founder.avatar } : {}),
      ...(sameAs.length > 0 ? { sameAs } : {}),
      jobTitle: 'Founder',
      knowsAbout: TALKS.map(t => t.title),
      worksFor: businesses.map(b => ({ '@type': 'Organization', name: b.name.trim(), url: normalizeUrl(b.website) })),
    } : null,
  })

  if (!founder) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-4">
        <p className="font-body text-muted">Not available right now.</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="pt-32 pb-16 bg-surface border-b border-border">
        <InnerContainer>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-center">
            <div className="lg:col-span-2">
              <p className="font-body text-xs font-semibold text-primary uppercase tracking-widest mb-4">
                Speaker &amp; Press
              </p>
              <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold text-charcoal leading-tight mb-4">
                {founder.name.trim()}
              </h1>
              <p className="font-body text-lg text-muted leading-relaxed max-w-2xl mb-6">
                Australian technology founder, entrepreneur, creator and storyteller building at the
                intersection of founder knowledge, content, search and AI discovery.
              </p>
              <div className="font-body text-muted leading-relaxed max-w-2xl space-y-4 mb-8">
                <p>I didn't come into tech through a computer science degree or because I decided one day I wanted to build an app.</p>
                <p>I came into it after more than 15 years behind a camera, building a 4WD tour company, designing a product that didn't exist yet, running a marketing agency and watching the same problem follow founders everywhere I went:</p>
                <p className="font-semibold text-charcoal">They weren't short of things to say. Their best thinking was already buried inside years of content nobody could find anymore.</p>
                <p>That problem became CULO.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                {founder.linkedin && (
                  <a href={normalizeUrl(founder.linkedin)} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-[#b05a35] transition-colors">
                    Connect on LinkedIn ↗
                  </a>
                )}
                <a href="mailto:support@prettycoolmarketing.com?subject=Speaking%20%2F%20Press%20enquiry"
                  className="inline-flex items-center gap-2 px-5 py-2.5 border border-border text-charcoal text-sm font-semibold rounded-xl hover:border-primary hover:text-primary transition-colors">
                  Book me for a podcast, panel or event →
                </a>
              </div>
            </div>
            {founder.avatar && (
              <div className="lg:col-span-1 flex justify-center lg:justify-end">
                <img src={founder.avatar} alt={founder.name} className="w-48 h-48 sm:w-56 sm:h-56 rounded-2xl object-cover shadow-lg" />
              </div>
            )}
          </div>
        </InnerContainer>
      </section>

      {/* ── The thing I keep coming back to ─────────────────────────────── */}
      <section className="py-16">
        <InnerContainer>
          <div className="max-w-3xl">
            <p className="font-body text-xs font-semibold text-primary uppercase tracking-widest mb-3">The thing I keep coming back to</p>
            <blockquote className="font-heading text-2xl sm:text-3xl font-semibold text-charcoal leading-snug mb-6">
              "A founder posts something real, it performs for a day, then the algorithm moves on and
              their whole body of work disappears underneath whatever they posted next."
            </blockquote>
            <div className="font-body text-muted leading-relaxed space-y-4">
              <p>We have spent years teaching founders how to create more content.</p>
              <p>I'm much more interested in what happens to everything they have already made.</p>
              <p>The podcast interviews. The talking heads. The captions. The videos sitting on YouTube. The lessons they learnt building the business. The answers they have repeated to customers 100 times. The stories they probably don't even realise are valuable anymore.</p>
              <p>That is the problem behind Culo Creatives and The Culo Village.</p>
              <p>Culo Creatives helps pull more useful content out of the footage and thoughts a founder already has. The Culo Village gives that work somewhere permanent to live, connects it back to the founder and structures it so people, search engines and AI can understand the body of work as a whole.</p>
              <p className="font-semibold text-charcoal">Social media distributes the moment. The Village builds what stays behind.</p>
            </div>
          </div>
        </InnerContainer>
      </section>

      {/* ── What I speak about ──────────────────────────────────────────── */}
      <section className="py-16 bg-surface border-y border-border">
        <InnerContainer>
          <p className="font-body text-xs font-semibold text-primary uppercase tracking-widest mb-3">What I speak about</p>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-charcoal mb-10">Bookable talks</h2>
          <div className="flex flex-col gap-10 max-w-3xl">
            {TALKS.map(talk => (
              <div key={talk.title}>
                <h3 className="font-heading text-xl font-semibold text-charcoal mb-3">{talk.title}</h3>
                <div className="font-body text-muted leading-relaxed space-y-2.5">
                  {talk.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
                </div>
              </div>
            ))}
          </div>

          <div className="max-w-3xl mt-14 pt-10 border-t border-border">
            <h3 className="font-heading text-lg font-semibold text-charcoal mb-4">Good conversations for panels and podcasts</h3>
            <p className="font-body text-muted mb-4">I'm particularly interested in conversations around:</p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 font-body text-sm text-muted list-disc list-inside">
              {PANEL_TOPICS.map(topic => <li key={topic}>{topic}</li>)}
            </ul>
          </div>
        </InnerContainer>
      </section>

      {/* ── Built from doing it, not just talking about it ──────────────── */}
      <section className="py-16">
        <InnerContainer>
          <p className="font-body text-xs font-semibold text-primary uppercase tracking-widest mb-3">Built from doing it, not just talking about it</p>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-charcoal mb-2">Four businesses. Four very different lessons.</h2>
          <p className="font-body text-muted mb-8">Every idea above is backed by something real I've actually built.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {businesses.map(b => {
              const key = b.name.trim().toLowerCase()
              const copy = BUSINESS_COPY[key]
              const href = key === 'stagger inn adventures'
                ? `/businesses/${b.slug}`
                : normalizeUrl(b.website)
              return (
                <a
                  key={b.id}
                  href={href}
                  {...(key !== 'stagger inn adventures' ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  className="block bg-surface rounded-2xl border border-border p-6 hover:border-primary/40 transition-colors"
                >
                  <p className="font-heading text-lg font-semibold text-charcoal mb-2">{b.name.trim()}</p>
                  <p className="font-body text-sm text-muted leading-relaxed mb-4">{copy?.lesson ?? b.tagline}</p>
                  <span className="font-body text-xs font-semibold text-primary">{copy?.linkLabel ?? `${b.website} ↗`}</span>
                </a>
              )
            })}
          </div>

          <div className="grid grid-cols-3 gap-4 mt-10 max-w-xl">
            <div className="bg-surface rounded-xl border border-border px-4 py-3">
              <p className="font-heading text-2xl font-bold text-charcoal">{publishedStories.length}</p>
              <p className="font-body text-xs text-muted mt-0.5">Founder stories published through the platform</p>
            </div>
            <div className="bg-surface rounded-xl border border-border px-4 py-3">
              <p className="font-heading text-2xl font-bold text-charcoal">{totalImports}</p>
              <p className="font-body text-xs text-muted mt-0.5">Pieces of content processed</p>
            </div>
            <div className="bg-surface rounded-xl border border-border px-4 py-3">
              <p className="font-heading text-2xl font-bold text-charcoal">{businesses.length}</p>
              <p className="font-body text-xs text-muted mt-0.5">Businesses built</p>
            </div>
          </div>
        </InnerContainer>
      </section>

      {/* ── About Shakas ─────────────────────────────────────────────────── */}
      <section className="py-16 bg-surface border-y border-border">
        <InnerContainer>
          <div className="max-w-3xl">
            <p className="font-body text-xs font-semibold text-primary uppercase tracking-widest mb-3">About Shakas</p>
            <div className="font-body text-muted leading-relaxed whitespace-pre-line">
              {bioText}
            </div>
          </div>
        </InnerContainer>
      </section>

      {/* ── Press / speaking CTA ─────────────────────────────────────────── */}
      <section className="py-16 bg-charcoal">
        <InnerContainer>
          <div className="max-w-2xl">
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-white mb-3">
              For podcast hosts, journalists and event organisers
            </h2>
            <p className="font-body text-white/70 leading-relaxed mb-4">
              If you want a polished founder story about somebody who built a startup in a straight
              line, I am probably not it.
            </p>
            <p className="font-body text-white/70 leading-relaxed mb-6">
              If you want a conversation about what actually happens while you're figuring it out,
              why founder knowledge is getting lost online, what AI discovery changes, how real
              experience becomes content, or how somebody with a camera background ended up building
              technology inside Canva, there is plenty to talk about.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="mailto:support@prettycoolmarketing.com?subject=Speaking%20%2F%20Press%20enquiry"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-[#b05a35] transition-colors">
                Book me for an interview, panel or event →
              </a>
              {founder.linkedin && (
                <a href={normalizeUrl(founder.linkedin)} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 border border-white/20 text-white text-sm font-semibold rounded-xl hover:border-white/40 transition-colors">
                  Connect on LinkedIn ↗
                </a>
              )}
              <Link to="/founders/shakas-designer"
                className="inline-flex items-center gap-2 px-5 py-2.5 border border-white/20 text-white text-sm font-semibold rounded-xl hover:border-white/40 transition-colors">
                Read my full founder profile →
              </Link>
            </div>
          </div>
        </InnerContainer>
      </section>
    </main>
  )
}
