import { useDictation } from '../../hooks/useDictation'

// Drop-in mic button for any textarea/input — wraps useDictation so a box
// that just needs "talk instead of type" doesn't need its own recognition
// wiring. Safe to use many at once (Q&A answer boxes in a list, say) since
// each instance owns its own recognition session.
export function DictationMicButton({ value, onChange, className, size = 'md' }: {
  value: string
  onChange: (v: string) => void
  className?: string
  size?: 'sm' | 'md'
}) {
  const { listening, toggle } = useDictation()
  const dims = size === 'sm' ? 'w-7 h-7' : 'w-10 h-10'
  const iconDims = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'

  return (
    <span className="relative inline-block shrink-0">
      {/* A pulsing button alone is easy to miss, or to second-guess if
          transcription lags a beat behind speech — this makes "yes, it's
          actually recording" unambiguous regardless of that delay. */}
      {listening && (
        <span className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap flex items-center gap-1 text-[10px] font-semibold text-red-600 bg-white px-1.5 py-0.5 rounded-full shadow-sm border border-red-100 pointer-events-none">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" aria-hidden="true" />
          Recording…
        </span>
      )}
      <button
        type="button"
        onClick={() => toggle(
          () => value,
          onChange,
          () => alert("Dictation isn't supported in this browser — try Chrome, Edge or Safari.")
        )}
        title={listening ? 'Recording — click to stop' : 'Answer out loud'}
        aria-label={listening ? 'Recording — click to stop' : 'Answer out loud'}
        className={`${dims} rounded-full flex items-center justify-center transition-colors ${
          listening ? 'bg-red-500 text-white animate-pulse' : 'bg-[#2D2A26] text-white hover:bg-[#1a1815]'
        } ${className ?? ''}`}
      >
        <svg className={iconDims} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 15a3 3 0 003-3V6a3 3 0 10-6 0v6a3 3 0 003 3z" />
          <path d="M19 11a1 1 0 10-2 0 5 5 0 01-10 0 1 1 0 10-2 0 7 7 0 006 6.93V20H9a1 1 0 100 2h6a1 1 0 100-2h-2v-2.07A7 7 0 0019 11z" />
        </svg>
      </button>
    </span>
  )
}
