import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getCurrentFounder } from '../services/currentFounder'
import { getFounder, updateFounder } from '../services/founders'
import { runFounderResearch } from '../services/editorialResearch'
import { writeOnboardingDraftsFromResearch } from '../services/onboardingResearch'
import { isThinResearch } from '../services/editorialEngine'
import { Navbar } from '../components/layout/Navbar'
import { JoinProgress } from '../components/ui/JoinProgress'

// Step 3 of signup — was previously invisible: /join/setup used to fire
// research AND the bio/article write in one fused background call, then
// redirect straight to Import with nothing on screen to show either stage
// actually happened or finished (see DashboardImportContentPage's running
// counter, added for the "nothing visible at all" half of that gap). Per
// direct product direction: this shouldn't be complicated — password, then
// profile + links, then Run research (see it complete), then Write article
// and bio (see it complete), then Next into Import. Two distinct, visible
// button presses instead of one fused call nobody could see progress on.
//
// runFounderResearch and writeOnboardingDraftsFromResearch already existed
// as separate functions (the second is what staff's own "Write bio and
// article from research" button already calls) — this just gives a
// self-serve founder the same two explicit steps staff always had.
type Phase = 'ready' | 'researching' | 'researched' | 'thin' | 'writing' | 'done' | 'error'

export function JoinResearchPage() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const founder = getCurrentFounder(user)

  const [phase, setPhase] = useState<Phase>('ready')
  const [error, setError] = useState<string | null>(null)
  const [bioWritten, setBioWritten] = useState(false)
  const [articleWritten, setArticleWritten] = useState(false)

  // Same cache-sync race as JoinSetupPage/DashboardCreativesPage.
  const [syncTick, setSyncTick] = useState(0)
  useEffect(() => {
    if (loading || founder || syncTick >= 20) return
    const timer = setTimeout(() => setSyncTick(t => t + 1), 500)
    return () => clearTimeout(timer)
  }, [loading, founder, syncTick])

  if (loading || (!founder && syncTick < 20) || !founder) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <p className="font-body text-sm text-muted">Loading…</p>
      </main>
    )
  }

  // onboardingStatus is a separate field from researchStatus (which
  // runFounderResearch already sets) — it's what DashboardLayout polls to
  // auto-progress 'ready' -> 'confirmed' the moment a founder opens their
  // dashboard, what send-nudges' "needs setup"/"ready to confirm" nudges
  // key off, and what Culo Members' status tag reads. Bypassing
  // runOnboardingResearch (which used to set this) means this page has to
  // set it itself, at the same two points that function always did:
  // 'researching' the moment a run starts, 'ready' once it's done — thin,
  // written, or skipped, same as that function's own finally block.
  async function markOnboardingStatus(status: 'researching' | 'ready') {
    if (!founder) return
    const latest = getFounder(founder.id) ?? founder
    await updateFounder({ ...latest, onboardingStatus: status })
  }

  async function handleRunResearch() {
    if (!founder) return
    setPhase('researching')
    setError(null)
    await markOnboardingStatus('researching')
    const result = await runFounderResearch(founder.id)
    if (!result.success || !result.ledger) {
      setPhase('error')
      setError(result.error ?? 'Research failed — please try again.')
      await markOnboardingStatus('ready')
      return
    }
    if (isThinResearch(result.ledger)) {
      setPhase('thin')
      await markOnboardingStatus('ready')
    } else {
      setPhase('researched')
    }
  }

  async function handleWrite() {
    if (!founder) return
    setPhase('writing')
    setError(null)
    const result = await writeOnboardingDraftsFromResearch(founder.id)
    setBioWritten(result.bioWritten)
    setArticleWritten(result.articleWritten)
    await markOnboardingStatus('ready')
    setPhase('done')
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background flex items-center justify-center px-6 py-24">
        <div className="max-w-sm md:max-w-lg w-full text-center">
          <JoinProgress step={3} />
          <h1 className="font-heading text-2xl md:text-4xl font-bold text-charcoal mb-2 md:mb-3">Building your profile</h1>

          {(phase === 'ready' || phase === 'researching') && (
            <>
              <p className="font-body text-sm md:text-base text-muted mb-8 md:mb-10">
                First, Culo looks up the links you gave us to verify who you are.
              </p>
              <button
                onClick={() => void handleRunResearch()}
                disabled={phase === 'researching'}
                className="rounded-xl px-8 py-3.5 md:py-4 text-sm md:text-base font-semibold bg-primary text-white hover:bg-[#b05a35] disabled:opacity-60 transition-colors"
              >
                {phase === 'researching' ? 'Researching…' : 'Run research'}
              </button>
            </>
          )}

          {phase === 'thin' && (
            <>
              <p className="font-body text-sm md:text-base text-muted mb-6">
                Culo couldn't confidently verify you from those links. You can try again with a different link,
                or go ahead and fill in your profile by hand.
              </p>
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <button
                  onClick={() => navigate('/join/setup')}
                  className="rounded-xl px-6 py-3 text-sm font-semibold border border-border text-charcoal hover:border-primary transition-colors"
                >
                  Try different links
                </button>
                <button
                  onClick={() => navigate('/dashboard/import-content', { replace: true })}
                  className="rounded-xl px-6 py-3 text-sm font-semibold bg-primary text-white hover:bg-[#b05a35] transition-colors"
                >
                  Skip for now
                </button>
              </div>
            </>
          )}

          {(phase === 'researched' || phase === 'writing') && (
            <>
              <p className="font-body text-sm text-[#5E6B4A] font-semibold mb-1">✓ Research complete</p>
              <p className="font-body text-sm md:text-base text-muted mb-8 md:mb-10">
                Now Culo writes your bio and first article from what it found.
              </p>
              <button
                onClick={() => void handleWrite()}
                disabled={phase === 'writing'}
                className="rounded-xl px-8 py-3.5 md:py-4 text-sm md:text-base font-semibold bg-primary text-white hover:bg-[#b05a35] disabled:opacity-60 transition-colors"
              >
                {phase === 'writing' ? 'Writing…' : 'Write article and bio'}
              </button>
            </>
          )}

          {phase === 'done' && (
            <>
              <p className="font-body text-sm text-[#5E6B4A] font-semibold mb-1">✓ Research complete</p>
              <p className="font-body text-sm text-[#5E6B4A] font-semibold mb-4">✓ Complete</p>
              {(!bioWritten || !articleWritten) && (
                <p className="font-body text-xs md:text-sm text-muted mb-6">
                  {!bioWritten && !articleWritten
                    ? 'What was found wasn\'t quite enough to write from confidently — you can add a bio by hand from your Profile page afterward.'
                    : !bioWritten
                      ? 'Your first article is ready to review. Your bio needs a bit more — add one by hand from your Profile page afterward.'
                      : 'Your bio is ready. The article needs a bit more — you can review and finish it from your Content tab afterward.'}
                </p>
              )}
              <p className="font-body text-sm md:text-base text-muted mb-8 md:mb-10">
                Next, import your previous posts — Culo restructures each one as its own web article.
              </p>
              <button
                onClick={() => navigate('/dashboard/import-content', { replace: true })}
                className="rounded-xl px-8 py-3.5 md:py-4 text-sm md:text-base font-semibold bg-primary text-white hover:bg-[#b05a35] transition-colors"
              >
                Next: Import your posts →
              </button>
            </>
          )}

          {phase === 'error' && (
            <>
              {error && <p className="font-body text-sm text-red-600 mb-4">{error}</p>}
              <button
                onClick={() => void handleRunResearch()}
                className="rounded-xl px-8 py-3.5 md:py-4 text-sm md:text-base font-semibold bg-primary text-white hover:bg-[#b05a35] transition-colors"
              >
                Try again
              </button>
            </>
          )}
        </div>
      </main>
    </>
  )
}
