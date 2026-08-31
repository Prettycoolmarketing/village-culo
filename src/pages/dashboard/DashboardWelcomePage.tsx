import { Link } from 'react-router-dom'

// Landing spot for orientation and promotion — everything that used to be
// bolted onto Publish or Import Content (How it works, what the Voice Brief
// is for, the CULO Creatives pitch + walkthrough) lives here instead, so
// those task pages stay focused on the one thing they're for. Laid out as a
// single top-to-bottom story rather than a two-column split, so it reads in
// the order a brand-new founder actually needs it: what this is → how it
// works → how to make the content itself → watch it happen.

const HOW_IT_WORKS_STEPS = [
  {
    title: 'Pick what you want to publish',
    desc: "Start with a video, story, blog, podcast, Canva design or something you've already imported.",
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
  },
  {
    title: 'Add the story around it',
    desc: 'Give CULO the context that makes the piece worth finding. What happened? What did you learn? Why does it matter now?',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M14 8h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />,
  },
  {
    title: 'Let Village Intelligence connect the dots',
    desc: 'CULO helps pull out the topics, questions, ideas, people, skills, keywords and insights hiding inside your work — connecting each piece back to the bigger story of you.',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.99-2.386l-.548-.547z" />,
  },
  {
    title: 'Check it, then publish',
    desc: "You're always in control. Preview the story, make changes and publish it to the Village when you're happy with it.",
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />,
  },
]

export function DashboardWelcomePage() {
  return (
    <div className="p-8 max-w-[1100px] flex flex-col gap-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── What is CULO Village? ────────────────────────────────────────── */}
      <section className="rounded-2xl px-8 py-10 sm:px-12 sm:py-12 bg-[#1B3A5C] text-white">
        <h1 className="font-heading text-2xl sm:text-3xl font-bold mb-4">What is CULO Village?</h1>
        <p className="text-sm sm:text-base text-white/85 leading-relaxed max-w-2xl mb-3">
          CULO Village brings the work you've already created into one connected place. Your YouTube videos,
          podcasts, blogs, Instagram posts, Canva designs and stories can all become part of your Village
          profile — without taking your content away from where it already lives. Original content stays at
          the source.
        </p>
        <p className="text-sm sm:text-base text-white/85 leading-relaxed max-w-2xl mb-6">
          The Village connects it, gives it context and helps turn years of scattered posts into a body of
          work that tells people who you are, what you know and what you've built. It all works best when it's
          grounded in your own voice — that's what your Voice &amp; Brand Brief is for.
        </p>
        <Link
          to="/dashboard/import-content"
          className="inline-flex text-sm font-semibold px-5 py-2.5 rounded-lg bg-white text-[#1B3A5C] hover:bg-white/90 transition-colors"
        >
          Set up your Voice &amp; Brand Brief →
        </Link>
      </section>

      {/* ── How CULO Village Works ───────────────────────────────────────── */}
      <section className="bg-white rounded-2xl border border-[#E8E4DD] px-8 py-8 sm:px-10 sm:py-10">
        <h2 className="text-lg font-semibold text-[#2D2A26] mb-6">How CULO Village Works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {HOW_IT_WORKS_STEPS.map(s => (
            <div key={s.title}>
              <div className="w-11 h-11 rounded-full bg-[#FBF1EB] text-[#C86A43] flex items-center justify-center shrink-0 mb-3">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  {s.icon}
                </svg>
              </div>
              <p className="text-base font-semibold text-[#2D2A26] mb-1">{s.title}</p>
              <p className="text-sm text-[#9CA3AF] leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── What is CULO Creatives, Exclusively in Canva? ────────────────── */}
      <section className="bg-white rounded-2xl border border-[#E8E4DD] px-8 py-8 sm:px-10 sm:py-10">
        <h2 className="text-lg font-semibold text-[#2D2A26] mb-3">What is CULO Creatives, Exclusively in Canva?</h2>
        <p className="text-sm text-[#6B7280] leading-relaxed max-w-2xl">
          CULO Creatives helps founders turn messy thoughts, stories and raw footage into different formats of
          content, directly inside Canva — nowhere else. Create there. Publish it here. Keep building your
          Village.
        </p>
      </section>

      {/* www.prettycoolmarketing.com/culo is a placeholder landing page — swap
          for the real Canva app link once CULO in Canva ships. */}
      <a
        href="https://www.prettycoolmarketing.com/culo"
        target="_blank"
        rel="noopener noreferrer"
        className="block bg-[#2D2A26] rounded-2xl px-8 py-8 sm:px-10 hover:bg-[#1a1815] transition-colors"
      >
        <p className="text-xs font-semibold text-[#C86A43] uppercase tracking-widest mb-4">
          Need help creating the content itself?
        </p>
        <div className="flex justify-end">
          <span className="inline-flex items-center gap-2 px-6 py-3 bg-[#C86A43] text-white text-base font-semibold rounded-xl">
            Create with CULO in Canva
          </span>
        </div>
      </a>

      {/* ── How-to video ─────────────────────────────────────────────────── */}
      <section>
        <p className="text-sm font-semibold text-[#2D2A26] mb-3">See how publishing works</p>
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-charcoal">
          <iframe
            src="https://www.youtube.com/embed/qe0pMAlpVFc?start=21"
            title="How to publish with CULO"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        </div>
      </section>
    </div>
  )
}
