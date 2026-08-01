import { useRef, useState } from 'react'
import { VOICE_BRIEF_INTERVIEW_PROMPT } from '../../services/blogWriter'

const inputClass =
  'w-full px-3 py-2.5 rounded-lg border border-[#E8E4DD] text-sm text-[#2D2A26] bg-white placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#C86A43]/30 focus:border-[#C86A43] transition-colors'

export function VoiceBriefEditor({ value, updatedAt, onChange }: {
  value: string | undefined
  updatedAt: string | undefined
  onChange: (value: string | undefined) => void
}) {
  const [showPrompt, setShowPrompt] = useState(false)
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

  return (
    <div className="bg-white rounded-xl border border-[#E8E4DD] px-5 py-4 flex flex-col gap-3">
      <div>
        <p className="text-sm font-semibold text-[#2D2A26]">Voice & Brand Brief</p>
        <p className="text-xs text-[#9CA3AF] mt-0.5 leading-relaxed">
          Who you are, your real chapters, how you write, and what to never say. Required before Instagram
          Archive import will write blogs for you — without a real brief, every generated blog reads the
          same regardless of which video it's attached to, which hurts both search ranking and AI discovery.
        </p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg bg-[#C86A43] text-white hover:bg-[#b05a35] transition-colors shadow-sm"
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
        <button
          type="button"
          onClick={() => setShowPrompt(v => !v)}
          className="text-xs font-semibold text-[#C86A43] hover:underline"
        >
          {showPrompt ? 'Hide' : "Not sure what to write? Get a prompt for your AI"}
        </button>
        {updatedAt && (
          <span className="text-[10px] text-[#9CA3AF] ml-auto">Last updated {new Date(updatedAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        )}
      </div>

      {showPrompt && (
        <div className="bg-[#F8F5F0] rounded-lg p-4">
          <p className="text-xs text-[#6B7280] mb-2 leading-relaxed">
            Paste this into ChatGPT, Claude, or whatever AI you already use — it'll interview you and hand
            back a finished brief you can paste or upload here.
          </p>
          <pre className="text-[11px] text-[#4B4845] whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto bg-white rounded-lg border border-[#E8E4DD] p-3">
            {VOICE_BRIEF_INTERVIEW_PROMPT}
          </pre>
          <button
            type="button"
            onClick={handleCopyPrompt}
            className="mt-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#2D2A26] text-white hover:bg-[#1a1815] transition-colors"
          >
            {copied ? 'Copied ✓' : 'Copy prompt'}
          </button>
        </div>
      )}

      <textarea
        value={value ?? ''}
        onChange={e => onChange(e.target.value || undefined)}
        rows={10}
        placeholder="Paste your Voice & Brand Brief here, or upload a file above…"
        className={inputClass + ' resize-y font-mono text-xs'}
      />
    </div>
  )
}
