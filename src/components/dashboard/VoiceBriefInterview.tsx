import { useEffect, useRef, useState } from 'react'
import { runVoiceBriefInterviewTurn, type VoiceBriefInterviewMessage } from '../../services/blogWriter'

// Inline chat interview for a founder with no existing brief and nothing to
// hand to an outside AI to mine (a brand-new account has no prior chat
// history for that prompt to extract from) — this asks the same ground the
// copy-paste prompt covers, one real question at a time, right here.
// Finishing calls onComplete with the assembled brief, same handoff as a
// pasted-in or uploaded one.

export function VoiceBriefInterview({ founderName, onComplete, onCancel }: {
  founderName?: string
  onComplete: (brief: string) => void
  onCancel: () => void
}) {
  const [messages, setMessages] = useState<VoiceBriefInterviewMessage[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [finished, setFinished] = useState(false)
  const startedRef = useRef(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  async function sendTurn(nextMessages: VoiceBriefInterviewMessage[]) {
    setBusy(true)
    setError(null)
    const { turn, error: turnError } = await runVoiceBriefInterviewTurn({ founderName, messages: nextMessages })
    setBusy(false)
    if (turnError || !turn) {
      setError(turnError ?? 'Something went wrong. Please try again.')
      return
    }
    setMessages([...nextMessages, { role: 'assistant', content: turn.message }])
    if (turn.done && turn.brief) {
      setFinished(true)
      onComplete(turn.brief)
    }
  }

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true
    void sendTurn([])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleSend() {
    const text = input.trim()
    if (!text || busy || finished) return
    setInput('')
    void sendTurn([...messages, { role: 'user', content: text }])
  }

  return (
    <div className="bg-white rounded-xl border border-[#E8E4DD] p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-base font-semibold text-[#2D2A26]">Answer a few questions</p>
          <p className="text-xs text-[#9CA3AF] mt-0.5">One question at a time — answer like you're texting a friend. We'll build your brief from it.</p>
        </div>
        <button type="button" onClick={onCancel} className="text-xs text-[#9CA3AF] hover:text-[#C86A43] shrink-0">
          Cancel
        </button>
      </div>

      <div className="flex flex-col gap-3 max-h-96 overflow-y-auto pr-1">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-[#C86A43] text-white rounded-br-sm'
                  : 'bg-[#F8F5F0] text-[#2D2A26] rounded-bl-sm'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex justify-start">
            <div className="px-4 py-2.5 rounded-2xl rounded-bl-sm bg-[#F8F5F0] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C4BDB4] animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#C4BDB4] animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#C4BDB4] animate-bounce" />
            </div>
          </div>
        )}
        {finished && (
          <div className="px-4 py-3 bg-[#5E6B4A]/10 rounded-lg">
            <p className="text-xs text-[#5E6B4A] font-medium">
              Your brief is ready below — read it over, tweak anything, then it's saved automatically.
            </p>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      {!finished && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
            disabled={busy}
            placeholder="Type your answer…"
            className="flex-1 px-3 py-2.5 rounded-lg border border-[#E8E4DD] text-sm text-[#2D2A26] bg-white placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#C86A43]/30 focus:border-[#C86A43] transition-colors"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={busy || !input.trim()}
            className="shrink-0 px-5 py-2.5 rounded-lg bg-[#2D2A26] text-white text-sm font-semibold hover:bg-[#1a1815] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
      )}
    </div>
  )
}
