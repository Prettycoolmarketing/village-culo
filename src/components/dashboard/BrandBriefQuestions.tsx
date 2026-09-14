import { useState } from 'react'
import { DictationMicButton } from '../ui/DictationMicButton'

// Replaces the old back-and-forth chat interview — a fixed set of prompts
// to read through and answer in one go, either typed or talked out loud
// (free, local Web Speech API, same as story dictation elsewhere) into a
// single box. Everything happens inline in this one box — no popup, no
// page jump, nothing to lose on mobile.
//
// One box rather than one per question: switching fields mid-thought broke
// up a natural, talked-through answer — someone dictating tends to run
// several of these together in one breath anyway, so the questions are
// just a numbered list to read down while they talk, not separate inputs.
//
// This is the lightweight, quick-answer fallback for someone with no
// existing AI/document — not the deep story extraction the full copy-paste
// Brain Transfer prompt does. That one prompt stays comprehensive and
// identical for everyone (new self-serve users, PCM clients, whoever they
// become later) since it's meant to gather everything, once, regardless of
// funnel. This shorter set only needs to cover what a self-serve founder's
// own Profile (bio, tone) and their imports (subtitles, topic tagging)
// actually draw on day to day — not full blog/authority-positioning depth.
const QUESTIONS = [
  "What's your business or brand called, and what do you actually do, in plain words?",
  "Who do you help, what result do they get from working with you, and do you have a real example or transformation you can share?",
  'What topics or subjects do you usually talk about in your content?',
  "How would you describe the way you talk — a phrase you use a lot, your general tone (casual, direct, warm, blunt), and any words you never want used to describe you?",
  "What's the one thing you want someone to understand after reading your profile?",
]

export function BrandBriefQuestions({ onComplete, onCancel }: {
  onComplete: (brief: string) => void
  onCancel: () => void
}) {
  const [answer, setAnswer] = useState('')

  return (
    <div className="bg-white rounded-xl border border-[#E8E4DD] p-6 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-base font-semibold text-[#2D2A26]">Answer a few questions</p>
          <p className="text-xs text-[#9CA3AF] mt-0.5">Read through the prompts below, then type or talk your answers into the box in any order.</p>
        </div>
        <button type="button" onClick={onCancel} className="text-xs text-[#9CA3AF] hover:text-[#C86A43] shrink-0">
          Cancel
        </button>
      </div>

      <ol className="flex flex-col gap-2 list-decimal list-inside">
        {QUESTIONS.map(q => (
          <li key={q} className="text-sm text-[#2D2A26] leading-relaxed">{q}</li>
        ))}
      </ol>

      <div className="flex items-start gap-2">
        <textarea
          value={answer}
          onChange={e => setAnswer(e.target.value)}
          rows={10}
          placeholder="Type or talk your answers here — cover as many of the prompts above as you like, in any order…"
          className="flex-1 px-3 py-2.5 rounded-lg border border-[#E8E4DD] text-sm text-[#2D2A26] bg-white placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#C86A43]/30 focus:border-[#C86A43] resize-y transition-colors"
        />
        <DictationMicButton value={answer} onChange={setAnswer} />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onComplete(answer.trim())}
          disabled={!answer.trim()}
          className="px-5 py-2.5 rounded-lg bg-[#2D2A26] text-white text-sm font-semibold hover:bg-[#1a1815] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Build my brief
        </button>
      </div>
    </div>
  )
}
