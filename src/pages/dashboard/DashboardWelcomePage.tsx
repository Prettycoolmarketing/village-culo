import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { getCurrentFounder } from '../../services/currentFounder'
import { hasCreativeAccess } from '../../utils/creativeAccess'
import { STANDARD_PAYMENT_LINK, buildPaymentUrl } from '../../config/paymentLinks'

// TODO: swap for the real "open CULO Creatives in Canva" URL once the app
// clears Canva review (the app's own listing/deep-link URL from the Canva
// Developer Portal) — placeholder for now, same as CreateWithCuloCTA and
// DashboardCreativesPage's own CULO_CANVA_URL before this.
const REAL_CANVA_APP_URL = 'https://www.culovillage.com/creatives'

// Landing spot for orientation and promotion — everything that used to be
// bolted onto Publish or Import Content (How it works, what the Voice Brief
// is for) lives here instead, so those task pages stay focused on the one
// thing they're for. The CULO Creatives pitch + walkthrough itself moved to
// its own Welcome tab on the Culo Creatives in Canva page.


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

const CREATIVES_STEPS = [
  {
    title: 'Add your raw footage',
    desc: 'Drop your B-roll, talking-head clips, voice-overs and photos into the right Media Library section in the Canva app.',
  },
  {
    title: 'CULO shapes it into content',
    desc: 'The Canva app turns your raw material and messy thoughts into structured blogs, carousels and reels built around the real idea inside each piece.',
  },
  {
    title: 'Edit and brand it in Canva',
    desc: 'Everything opens in Canva as fully editable designs — your fonts, your colours, your style. Tweak anything before it goes anywhere.',
  },
  {
    title: 'Check it, then publish',
    desc: "Same as the Village — you're always in control. Review it, make changes, and publish it across your platforms and into your Culo Village library.",
  },
]

export function DashboardWelcomePage() {
  const { user } = useAuth()
  const founder = getCurrentFounder(user)
  const canUseCreatives = hasCreativeAccess(founder?.creativeSubscription)

  // Canva-sourced founders (joined via /joincanva) skip the Village-first
  // "how it works" welcome entirely — they came here wanting Canva, not to
  // learn about republishing old content. Their whole point of landing here
  // is one decision: enter payment details to start the 14-day trial, then
  // go straight into the Canva app. Village/waitlist founders keep today's
  // unchanged two-section layout below.
  const isCanvaFounder = founder?.signupProduct === 'canva'
  const hasBilling = !!founder?.creativeSubscription?.stripeSubscriptionId
  if (isCanvaFounder) {
    const trialUrl = buildPaymentUrl(STANDARD_PAYMENT_LINK, founder?.id ?? '', user?.email)
    return (
      <div className="p-8 sm:pt-12 flex flex-col gap-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <div className="px-8 sm:px-12">
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[#2D2A26]">Welcome to Culo Creatives in Canva</h1>
          <p className="text-sm text-[#6B7280] mt-1.5 max-w-2xl">
            {hasBilling
              ? "You're all set — jump back into Canva to keep creating."
              : 'Start your 14-day free trial to turn your raw footage into finished blogs, carousels and reels, right inside Canva.'}
          </p>
        </div>
        <section className="w-full bg-white rounded-2xl border border-[#E8E4DD] px-8 py-8 sm:px-12 sm:py-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {CREATIVES_STEPS.map((s, i) => (
              <div key={s.title}>
                <div className="w-11 h-11 rounded-full bg-[#EBF2F8] text-[#3E6E92] flex items-center justify-center shrink-0 mb-3 text-sm font-bold">
                  {i + 1}
                </div>
                <p className="text-base font-semibold text-[#2D2A26] mb-1">{s.title}</p>
                <p className="text-sm text-[#9CA3AF] leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:items-end gap-4 pt-4">
            <a
              href={hasBilling ? REAL_CANVA_APP_URL : trialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex justify-center sm:inline-flex text-base font-semibold px-6 py-5 rounded-xl bg-[#2D2A26] text-white hover:bg-[#1a1815] transition-colors w-full sm:w-auto"
            >
              {hasBilling ? 'Open Culo Creatives in Canva' : 'Start my 14-day free trial'}
            </a>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="p-8 sm:pt-12 flex flex-col gap-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* ── Welcome ───────────────────────────────────────────────────────── */}
      {/* Matches the px-8 sm:px-12 inner padding every section below uses, so
          the heading text lines up with the box content instead of sitting
          flush with the outer page edge. */}
      <div className="px-8 sm:px-12">
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[#2D2A26]">Welcome to The Culo Village x Culo Creatives in Canva</h1>
        <p className="text-sm text-[#6B7280] mt-1.5 max-w-2xl">
          Follow the steps to be celebrated for your content and edit simply in one repeatable marketing workflow.
        </p>
      </div>

      {/* Every section below spans the full width of the content pane (not
          boxed into a narrower max-width column) but keeps its own rounded
          corners rather than running edge-to-edge square. */}

      {/* ── How The Culo Village Works ───────────────────────────────────── */}
      <section className="w-full bg-white rounded-2xl border border-[#E8E4DD] px-8 py-8 sm:px-12 sm:py-10">
        <Link to="/dashboard/import-content" className="group block">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#2D2A26] mb-4 group-hover:text-[#C86A43] transition-colors">
            How The Culo Village Works <span className="text-[#C86A43] text-lg font-normal">→</span>
          </h2>
          <p className="text-sm text-[#6B7280] leading-relaxed max-w-2xl mb-6">
            The Culo Village structures your previously posted content from disconnected channels and accounts
            across platforms like YouTube, podcasts, Instagram and blogs, and republishes them as individual web
            articles for AI search-ability and to position you as an authority in your field.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-4">
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
        </Link>
        <div className="flex flex-col sm:items-end gap-4 pt-4">
          <Link
            to="/dashboard/import-content"
            className="flex justify-center sm:inline-flex text-base font-semibold px-6 py-5 rounded-xl bg-[#C86A43] text-white hover:bg-[#b05a35] transition-colors w-full sm:w-auto"
          >
            Import your content into The Village
          </Link>
        </div>
      </section>

      {/* ── How Culo Creatives Works ──────────────────────────────────────── */}
      <section className="w-full bg-white rounded-2xl border border-[#E8E4DD] px-8 py-8 sm:px-12 sm:py-10">
        <Link to="/dashboard/creatives" className="group block">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#2D2A26] mb-4 group-hover:text-[#C86A43] transition-colors">
            How Culo Creatives Works <span className="text-[#C86A43] text-lg font-normal">→</span>
          </h2>
          <p className="text-sm text-[#6B7280] leading-relaxed max-w-2xl mb-6">
            Culo Creatives is the Canva app that turns your raw footage and messy thoughts into finished
            blogs, carousels and reels — exclusively in Canva, in your own brand. Once it's made, you check
            it and publish it the same way you publish anything in the Village.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-4">
            {CREATIVES_STEPS.map((s, i) => (
              <div key={s.title}>
                <div className="w-11 h-11 rounded-full bg-[#EBF2F8] text-[#3E6E92] flex items-center justify-center shrink-0 mb-3 text-sm font-bold">
                  {i + 5}
                </div>
                <p className="text-base font-semibold text-[#2D2A26] mb-1">{s.title}</p>
                <p className="text-sm text-[#9CA3AF] leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </Link>
        <div className="flex flex-col sm:items-end gap-4 pt-4">
          {canUseCreatives ? (
            <Link
              to="/dashboard/creatives"
              className="flex justify-center sm:inline-flex text-base font-semibold px-6 py-5 rounded-xl bg-[#2D2A26] text-white hover:bg-[#1a1815] transition-colors w-full sm:w-auto"
            >
              Create with Culo Creatives in Canva
            </Link>
          ) : (
            <Link
              to="/dashboard/creatives"
              className="flex justify-center sm:inline-flex text-base font-semibold px-6 py-5 rounded-xl bg-[#2D2A26] text-white hover:bg-[#1a1815] transition-colors w-full sm:w-auto"
            >
              Get Culo Creatives in Canva — lock in $19/month
            </Link>
          )}
        </div>
      </section>
    </div>
  )
}
