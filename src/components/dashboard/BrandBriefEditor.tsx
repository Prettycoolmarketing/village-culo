import { useRef, useState } from 'react'
import { VOICE_BRIEF_INTERVIEW_PROMPT } from '../../services/blogWriter'
import { BrandBriefQuestions } from './BrandBriefQuestions'

const inputClass =
  'w-full px-3 py-2.5 rounded-lg border border-[#E8E4DD] text-sm text-[#2D2A26] bg-white placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#C86A43]/30 focus:border-[#C86A43] transition-colors'

// One box, not two — the Voice Brief (how you sound) and Insight Brief
// (what you know/believe) used to be separate cards asking for almost the
// same thing twice. Both founder fields still exist underneath (generate-
// blog treats them differently: one shapes tone, the other only ever
// supplies a lesson, never a fact) but there is no real reason a founder
// should do this twice — one document, saved to both.
export function BrandBriefEditor({ value, updatedAt, onChange, founderName: _founderName }: {
  value: string | undefined
  updatedAt: string | undefined
  onChange: (value: string | undefined) => void
  founderName?: string
}) {
  const [copiedPrompt, setCopiedPrompt] = useState(false)
  const [fileStatus, setFileStatus] = useState<'idle' | 'loading' | 'added'>('idle')
  const [answering, setAnswering] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFile(file: File | undefined) {
    if (!file) return
    setFileStatus('loading')
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onChange(reader.result)
        setFileStatus('added')
        setTimeout(() => setFileStatus('idle'), 2000)
      } else {
        setFileStatus('idle')
      }
    }
    reader.onerror = () => setFileStatus('idle')
    reader.readAsText(file)
  }

  function handleCopyPrompt() {
    void navigator.clipboard.writeText(VOICE_BRIEF_INTERVIEW_PROMPT)
    setCopiedPrompt(true)
    setTimeout(() => setCopiedPrompt(false), 2000)
  }

  return (
    <div className="bg-white rounded-xl border border-[#E8E4DD] px-8 py-7">
      <div className="mb-6">
        <p className="text-lg font-semibold text-[#2D2A26]">Tell us who you are and what you know</p>
        <p className="text-sm text-[#9CA3AF] mt-1 leading-relaxed">
          Your <strong className="text-[#6B7280] font-semibold">Brand Brief</strong> helps CULO sound like
          you and draw on what you actually know — not generic AI. Paste or upload one below, or copy our
          prompt into any AI you already use, answer what it asks, then bring the result back here.
        </p>
        {updatedAt && (
          <p className="text-xs text-[#9CA3AF] mt-1.5">
            Last updated {new Date(updatedAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        )}
      </div>

      {answering ? (
        <BrandBriefQuestions
          onComplete={brief => { onChange(brief); setAnswering(false) }}
          onCancel={() => setAnswering(false)}
        />
      ) : (
      <div className="bg-[#FBF1EB] rounded-lg p-8 flex flex-col gap-4">
        <textarea
          value={value ?? ''}
          onChange={e => onChange(e.target.value || undefined)}
          placeholder="Paste your Brand Brief here, or upload a file below…"
          className={inputClass + ' resize-none font-mono text-sm flex-1 min-h-48 p-4 bg-white'}
        />
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => setAnswering(true)}
            className="text-sm font-semibold px-4 py-2.5 rounded-lg border border-[#3E6E92] text-[#3E6E92] hover:bg-[#3E6E92] hover:text-white transition-colors"
          >
            I don't use AI — answer a few questions instead
          </button>
          <button
            type="button"
            onClick={handleCopyPrompt}
            className="text-sm font-semibold px-4 py-2.5 rounded-lg bg-[#2D2A26] text-white hover:bg-[#1a1815] transition-colors"
          >
            {copiedPrompt ? 'Copied ✓' : 'Copy Brain Transfer prompt'}
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={fileStatus === 'loading'}
            className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-lg bg-[#C86A43] text-white hover:bg-[#b05a35] disabled:opacity-70 disabled:cursor-wait transition-colors shrink-0"
          >
            {fileStatus === 'loading' ? (
              <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin shrink-0" aria-hidden="true" />
            ) : fileStatus === 'added' ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            )}
            {fileStatus === 'loading' ? 'Reading file…' : fileStatus === 'added' ? 'Added ✓' : 'Upload .md or .txt file'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".md,.txt,text/markdown,text/plain"
            className="hidden"
            onChange={e => handleFile(e.target.files?.[0])}
          />
        </div>
      </div>
      )}
    </div>
  )
}
