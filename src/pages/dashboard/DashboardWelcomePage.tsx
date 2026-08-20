import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

// Landing spot for orientation and promotion — everything that used to be
// bolted onto Publish or Import Content (How it works, what the Voice Brief
// is for, the CULO Creatives pitch + walkthrough) lives here instead, so
// those task pages stay focused on the one thing they're for. Collapsibles
// keep this useful on a second visit without it reading as a wall of text.

const HOW_IT_WORKS_STEPS = [
  {
    title: 'Pick a format',
    desc: 'Choose how you want to share your content in The Village.',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
  },
  {
    title: 'Add your content',
    desc: "You'll add your text, media, and details in the next steps.",
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M14 8h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />,
  },
  {
    title: 'Village Intelligence',
    desc: "We'll help you extract topics, keywords, insights and more.",
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.99-2.386l-.548-.547z" />,
  },
  {
    title: 'Preview & publish',
    desc: 'Review everything before it goes live in The Village.',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />,
  },
]

function CollapsibleSection({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: ReactNode }) {
  return (
    <details open={defaultOpen} className="group bg-white rounded-2xl border border-[#E8E4DD]">
      <summary className="flex items-center justify-between gap-3 px-6 py-5 cursor-pointer list-none">
        <p className="text-lg font-semibold text-[#2D2A26]">{title}</p>
        <svg className="w-4 h-4 text-[#9CA3AF] transition-transform group-open:rotate-180 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </summary>
      <div className="px-6 pb-6 pt-1 border-t border-[#F3EDE6]">
        {children}
      </div>
    </details>
  )
}

export function DashboardWelcomePage() {
  return (
    <div className="p-8 max-w-[1600px]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#2D2A26]">Welcome to CULO Village</h1>
        <p className="text-sm text-[#6B7280] mt-1 max-w-2xl leading-relaxed">
          Everything you need to know before you bring your work in and start publishing — come back here any
          time you need a refresher.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* ── Left: orientation ────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4">
          <CollapsibleSection title="What is CULO Village?" defaultOpen>
            <p className="text-sm text-[#6B7280] leading-relaxed">
              CULO Village is where founders bring their existing work — YouTube, podcasts, blogs, Instagram,
              Canva designs — into one place, and where that work becomes a real, discoverable body of content.
              Nothing gets re-uploaded or taken away from where it already lives; it's embedded from the
              original source and given the context it needs to make sense as a whole story, not a pile of
              disconnected posts.
            </p>
          </CollapsibleSection>

          <CollapsibleSection title="How it works" defaultOpen>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
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
          </CollapsibleSection>

          <CollapsibleSection title="What is the Voice & Brand Brief?">
            <p className="text-sm text-[#6B7280] leading-relaxed mb-4">
              It's why CULO can find and sound like you: search engines and AI tools surface content that
              clearly reads as one real person with a consistent voice, not generic AI writing. Without a
              brief, every piece reads the same no matter which video it's attached to — with one, CULO knows
              who you are, the real chapters of your story, how you actually talk, and what you'd never say.
              You can build one right inside Import Content, either by answering a few questions or by
              bringing in something you've already written.
            </p>
            <Link
              to="/dashboard/import-content"
              className="inline-flex text-sm font-semibold px-4 py-2 rounded-lg bg-[#2D2A26] text-white hover:bg-[#1a1815] transition-colors"
            >
              Set up your Voice & Brand Brief →
            </Link>
          </CollapsibleSection>
        </div>

        {/* ── Right: CULO Creatives ────────────────────────────────────────── */}
        <div className="flex flex-col gap-4">
          {/* www.prettycoolmarketing.com/culo is a placeholder landing page — swap
              for the real Canva app link once CULO in Canva ships. */}
          <a
            href="https://www.prettycoolmarketing.com/culo"
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-[#2D2A26] rounded-2xl px-8 py-8 hover:bg-[#1a1815] transition-colors"
          >
            <div className="flex flex-col gap-5">
              <p className="font-heading text-2xl font-semibold text-white leading-snug">
                CULO Creatives helps founders turn their messy thoughts and raw footage into different formats
                of content, exclusively in Canva.
              </p>
              <span className="self-start inline-flex items-center gap-2 px-6 py-3 bg-[#C86A43] text-white text-base font-semibold rounded-xl">
                Create with CULO in Canva
              </span>
            </div>
          </a>

          <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-charcoal">
            <iframe
              src="https://www.youtube.com/embed/qe0pMAlpVFc?start=21"
              title="How to publish with CULO"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
