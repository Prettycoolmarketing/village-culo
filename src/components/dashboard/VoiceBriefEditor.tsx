import { useRef, useState } from 'react'
import { VOICE_BRIEF_INTERVIEW_PROMPT } from '../../services/blogWriter'

const inputClass =
  'w-full px-3 py-2.5 rounded-lg border border-[#E8E4DD] text-sm text-[#2D2A26] bg-white placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#C86A43]/30 focus:border-[#C86A43] transition-colors'

export function VoiceBriefEditor({ value, updatedAt, onChange }: {
  value: string | undefined
  updatedAt: string | undefined
  onChange: (value: string | undefined) => void
}) {
  const [copied, setCopied] = useState(false)
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
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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

  return (
    <div className="bg-white rounded-xl border border-[#E8E4DD] px-6 py-5">
      <div className="mb-4">
        <p className="text-sm font-semibold text-[#2D2A26]">Voice &amp; Brand Brief</p>
        <p className="text-xs text-[#9CA3AF] mt-0.5 leading-relaxed max-w-3xl">
          Who you are, the real chapters of your story, how you actually talk, what you'd never say. This is
          what turns your Instagram archive into real blogs in your own voice — without it, every piece reads
          the same no matter which video it's attached to, and that costs you both search ranking and AI discovery.
        </p>
        {updatedAt && (
          <p className="text-[10px] text-[#9CA3AF] mt-1">
            Last updated {new Date(updatedAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Hand your brain over to your AI, then bring the brief back here. */}
        <div className="bg-[#F8F5F0] rounded-lg p-4 flex flex-col">
          <p className="text-xs font-semibold text-[#2D2A26] mb-1">Don't want to write it from scratch?</p>
          <p className="text-xs text-[#6B7280] mb-2 leading-relaxed">
            Copy this, hand it to whatever AI you already talk to — it'll interview you like it actually knows
            you, then write the brief. Paste what it gives you below, or upload it as a file.
          </p>
          <pre className="text-[11px] text-[#4B4845] whitespace-pre-wrap leading-relaxed flex-1 min-h-64 max-h-96 overflow-y-auto bg-white rounded-lg border border-[#E8E4DD] p-3">
            {VOICE_BRIEF_INTERVIEW_PROMPT}
          </pre>
          <div className="flex items-center gap-2 mt-3">
            <button
              type="button"
              onClick={handleCopyPrompt}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#2D2A26] text-white hover:bg-[#1a1815] transition-colors"
            >
              {copied ? 'Copied ✓' : 'Copy this prompt'}
            </button>
            <button
              type="button"
              onClick={handleDownloadPrompt}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#E8E4DD] text-[#2D2A26] bg-white hover:border-[#C86A43]/50 transition-colors"
            >
              Download as .md
            </button>
          </div>
        </div>

        <div className="flex flex-col">
          <div className="flex items-center justify-between gap-3 mb-2">
            <p className="text-xs font-semibold text-[#2D2A26]">Bring the brief back here</p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg bg-[#C86A43] text-white hover:bg-[#b05a35] transition-colors shadow-sm shrink-0"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
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
            className={inputClass + ' resize-none font-mono text-xs flex-1 min-h-64'}
          />
        </div>
      </div>
    </div>
  )
}
