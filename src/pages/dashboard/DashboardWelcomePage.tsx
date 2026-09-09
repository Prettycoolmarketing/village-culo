import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { getCurrentFounder } from '../../services/currentFounder'
import { hasCreativeAccess } from '../../utils/creativeAccess'
import { UPGRADE_PAYMENT_LINK, buildPaymentUrl } from '../../config/paymentLinks'

// Landing spot for orientation and promotion — everything that used to be
// bolted onto Publish or Import Content (How it works, what the Voice Brief
// is for) lives here instead, so those task pages stay focused on the one
// thing they're for. The CULO Creatives pitch + walkthrough itself moved to
// its own Welcome tab on the Culo Creatives in Canva page.

const CULO_CANVA_URL = 'https://www.culovillage.com/creatives'

const HOW_IT_WORKS_STEPS = [
  {
    title: 'Connect your accounts',
    desc: 'Link the accounts, channels and platforms where your work or knowledge is already spread out.',
  },
  {
    title: 'Republish for ultimate visibility',
    desc: "Your imported content is restructured into valuable articles linking to its relevant sources, or feel free to re-edit your words.",
  },
  {
    title: 'Village Intelligence connects the dots',
    desc: 'CULO detects your topics, questions/answers, ideas, keywords and insights hiding inside your work, and connects each piece back to you, positioning you as an authority in your field.',
  },
  {
    title: 'Check it, then publish',
    desc: "You're always in control. Preview the story, make changes and publish it to the Village when you're happy with your story.",
  },
]

export function DashboardWelcomePage() {
  const { user } = useAuth()
  const founder = getCurrentFounder(user)
  const canUseCreatives = hasCreativeAccess(founder?.creativeSubscription)
  const upgradeUrl = buildPaymentUrl(UPGRADE_PAYMENT_LINK, founder?.id ?? '', user?.email)

  return (
    <div className="p-8 sm:pt-12 flex flex-col gap-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* ── Welcome ───────────────────────────────────────────────────────── */}
      {/* Matches the px-8 sm:px-12 inner padding every section below uses, so
          the heading text lines up with the box content instead of sitting
          flush with the outer page edge. */}
      <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[#2D2A26] px-8 sm:px-12">Welcome to The Culo Village</h1>

      {/* Every section below spans the full width of the content pane (not
          boxed into a narrower max-width column) but keeps its own rounded
          corners rather than running edge-to-edge square. */}

      {/* ── How The Culo Village Works ───────────────────────────────────── */}
      <section className="w-full bg-white rounded-2xl border border-[#E8E4DD] px-8 py-8 sm:px-12 sm:py-10">
        <h2 className="text-lg font-semibold text-[#2D2A26] mb-3">How The Culo Village Works</h2>
        <p className="text-sm text-[#6B7280] leading-relaxed max-w-2xl mb-6">
          The Culo Village structures your previously posted content from disconnected channels and accounts
          across platforms like YouTube, podcasts, Instagram and blogs, and republishes them as individual web
          articles for AI search-ability and to position you as an authority in your field.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {HOW_IT_WORKS_STEPS.map((s, i) => (
            <div key={s.title}>
              <div className="w-11 h-11 rounded-full bg-[#FBF1EB] text-[#C86A43] flex items-center justify-center shrink-0 mb-3 text-sm font-bold">
                {i + 1}
              </div>
              <p className="text-base font-semibold text-[#2D2A26] mb-1">{s.title}</p>
              <p className="text-sm text-[#9CA3AF] leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-col sm:items-end gap-4 pt-4">
          <Link
            to="/dashboard/import-content"
            className="flex justify-center sm:inline-flex text-base font-semibold px-6 py-5 rounded-xl bg-[#C86A43] text-white hover:bg-[#b05a35] transition-colors w-full sm:w-auto"
          >
            Import your content into The Village
          </Link>
          <a
            href={canUseCreatives ? CULO_CANVA_URL : upgradeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex justify-center sm:inline-flex text-base font-semibold px-6 py-5 rounded-xl bg-[#2D2A26] text-white hover:bg-[#1a1815] transition-colors w-full sm:w-auto"
          >
            Create with Culo Creatives in Canva
          </a>
        </div>
      </section>
    </div>
  )
}
