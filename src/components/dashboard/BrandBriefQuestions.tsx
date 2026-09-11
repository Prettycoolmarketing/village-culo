import { useState } from 'react'
import { DictationMicButton } from '../ui/DictationMicButton'

// Replaces the old back-and-forth chat interview — a fixed set of
// questions, each with its own answer box and a microphone (free, local
// Web Speech API, same as story dictation elsewhere) so someone who'd
// rather talk than type can answer out loud. Everything happens inline in
// this one box — no popup, no page jump, nothing to lose on mobile.
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
  'Who do you help, and what result do they get from working with you?',
  'What topics or subjects do you usually talk about in your content?',
  "What's a phrase or saying you use a lot that sounds like you?",
  'How would a friend describe the way you talk — casual, direct, warm, blunt?',
  'Are there any words or phrases you never want used to describe you or your brand?',
  "What's the one thing you want someone to understand after reading your profile?",
  "What's a real result or transformation you've helped create for someone?",
]

function QuestionField({ question, value, onChange }: {
  question: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <div className="flex items-start gap-2">
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={2}
          placeholder={question}
          className="flex-1 px-3 py-2.5 rounded-lg border border-[#E8E4DD] text-sm text-[#2D2A26] bg-white placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#C86A43]/30 focus:border-[#C86A43] resize-none transition-colors"
        />
        <DictationMicButton value={value} onChange={onChange} />
      </div>
    </div>
  )
}

export function BrandBriefQuestions({ onComplete, onCancel }: {
  onComplete: (brief: string) => void
  onCancel: () => void
}) {
  const [answers, setAnswers] = useState<string[]>(() => QUESTIONS.map(() => ''))
  const answeredCount = answers.filter(a => a.trim()).length

  function finish() {
    const brief = QUESTIONS.map((q, i) => `**${q}**\n${answers[i]?.trim() || '(not answered)'}`).join('\n\n')
    onComplete(brief)
  }

  return (
    <div className="bg-white rounded-xl border border-[#E8E4DD] p-6 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-base font-semibold text-[#2D2A26]">Answer a few questions</p>
          <p className="text-xs text-[#9CA3AF] mt-0.5">Answer as many as you like, in any order. Type or tap the mic to talk.</p>
        </div>
        <button type="button" onClick={onCancel} className="text-xs text-[#9CA3AF] hover:text-[#C86A43] shrink-0">
          Cancel
        </button>
      </div>

      <div className="flex flex-col gap-3 max-h-[28rem] overflow-y-auto pr-1">
        {QUESTIONS.map((q, i) => (
          <QuestionField
            key={q}
            question={q}
            value={answers[i] ?? ''}
            onChange={v => setAnswers(prev => prev.map((a, j) => j === i ? v : a))}
          />
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={finish}
          disabled={answeredCount === 0}
          className="px-5 py-2.5 rounded-lg bg-[#2D2A26] text-white text-sm font-semibold hover:bg-[#1a1815] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Build my brief ({answeredCount}/{QUESTIONS.length} answered)
        </button>
      </div>
    </div>
  )
}
