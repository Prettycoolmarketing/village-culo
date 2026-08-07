import { useRef, useState } from 'react'
import { VOICE_BRIEF_INTERVIEW_PROMPT } from '../../services/blogWriter'

const inputClass =
  'w-full px-3 py-2.5 rounded-lg border border-[#E8E4DD] text-sm text-[#2D2A26] bg-white placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#C86A43]/30 focus:border-[#C86A43] transition-colors'

export function VoiceBriefEditor({ value, updatedAt, onChange }: {
  value: string | undefined
  updatedAt: string | undefined
  onChange: (value: string | undefined) => void
}) {
  const [copiedPrompt, setCopiedPrompt] = useState(false)
  const [copiedBrief, setCopiedBrief] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFile(file: File | undefined) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') onChange(reader.result)
    }
    reader.readAsText(file)
  }

  function handleCopyPrompt() {
    void navigator.clipboard.writeText(VOICE_BRIEF_INTERVIEW_PROMPT)
    setCopiedPrompt(true)
    setTimeout(() => setCopiedPrompt(false), 2000)
  }

  function handleDownloadPrompt() {
    const blob = new Blob([VOICE_BRIEF_INTERVIEW_PROMPT], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'story-voice-extraction-prompt.md'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  function handleCopyBrief() {
    if (!value) return
    void navigator.clipboard.writeText(value)
    setCopiedBrief(true)
    setTimeout(() => setCopiedBrief(false), 2000)
  }

  function handleClearBrief() {
    if (!value) return
    if (!window.confirm('Delete your Voice & Brand Brief? This can\'t be undone.')) return
    onChange(undefined)
  }

  return (
    <div className="bg-white rounded-xl border border-[#E8E4DD] px-8 py-7">
      <div className="mb-6">
        <p className="text-lg font-semibold text-[#2D2A26]">Voice &amp; Brand Brief</p>
        <p className="text-sm text-[#9CA3AF] mt-1 leading-relaxed max-w-4xl">
          This is why CULO can find and sound like you: search engines and AI tools surface content that
          clearly reads as one real person with a consistent voice, not generic AI writing. Without a brief,
          every piece reads the same no matter which video it's attached to — with one, CULO knows who you
          are, the real chapters of your story, how you actually talk, and what you'd never say, so what it
          writes actually sounds like you and holds up for both search ranking and AI discovery.
        </p>
        {updatedAt && (
          <p className="text-xs text-[#9CA3AF] mt-1.5">
            Last updated {new Date(updatedAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        )}
      </div>

      {/* Small side (just enough to hand someone a prompt) next to the big
          side (where the actual brief — the thing with real content — gets
          pasted). Both cards share the same padding/button sizing so they
          read as one cohesive pair, even though the columns aren't equal
          width — one holds a button, the other holds a founder's whole brief. */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-6 items-stretch">
        <div className="bg-[#F8F5F0] rounded-lg p-6 flex flex-col justify-center gap-4">
          <div>
            <p className="text-sm font-semibold text-[#2D2A26] mb-1">Don't want to write it from scratch?</p>
            <p className="text-sm text-[#6B7280] leading-relaxed">
              Copy this, hand it to whatever AI you already talk to. It reads back through what you've
              already told it — not a cold interview — and only asks you anything if it's genuinely missing.
              Paste what it gives you on the right, or upload it as a file.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={handleCopyPrompt}
              className="text-base font-semibold px-6 py-3.5 rounded-lg bg-[#2D2A26] text-white hover:bg-[#1a1815] transition-colors shadow-sm"
            >
              {copiedPrompt ? 'Copied ✓' : 'Copy this prompt'}
            </button>
            <button
              type="button"
              onClick={handleDownloadPrompt}
              className="text-sm font-semibold px-4 py-2 rounded-lg border border-[#E8E4DD] text-[#2D2A26] bg-white hover:border-[#C86A43]/50 transition-colors"
            >
              Download as .md
            </button>
          </div>
        </div>

        <div className="bg-[#F8F5F0] rounded-lg p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-[#2D2A26]">Bring the brief back here</p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 text-base font-semibold px-6 py-3.5 rounded-lg bg-[#C86A43] text-white hover:bg-[#b05a35] transition-colors shadow-sm shrink-0"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Upload .md or .txt file
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".md,.txt,text/markdown,text/plain"
              className="hidden"
              onChange={e => handleFile(e.target.files?.[0])}
            />
          </div>
          <textarea
            value={value ?? ''}
            onChange={e => onChange(e.target.value || undefined)}
            placeholder="Paste your Voice & Brand Brief here, or upload a file above…"
            className={inputClass + ' resize-none font-mono text-sm flex-1 min-h-48 p-4 bg-white'}
          />
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleCopyBrief}
              disabled={!value}
              className="text-sm font-semibold px-4 py-2 rounded-lg border border-[#E8E4DD] text-[#2D2A26] bg-white hover:border-[#C86A43]/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {copiedBrief ? 'Copied ✓' : 'Copy'}
            </button>
            <button
              type="button"
              onClick={handleClearBrief}
              disabled={!value}
              className="text-sm font-semibold px-4 py-2 rounded-lg border border-[#E8E4DD] text-red-600 bg-white hover:border-red-300 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
