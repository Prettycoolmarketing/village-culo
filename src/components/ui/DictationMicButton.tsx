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
    <button
      type="button"
      onClick={() => toggle(
        () => value,
        onChange,
        () => alert("Dictation isn't supported in this browser — try Chrome, Edge or Safari.")
      )}
      title={listening ? 'Stop dictating' : 'Answer out loud'}
      className={`shrink-0 ${dims} rounded-full flex items-center justify-center transition-colors ${
        listening ? 'bg-red-500 text-white animate-pulse' : 'bg-[#2D2A26] text-white hover:bg-[#1a1815]'
      } ${className ?? ''}`}
    >
      <svg className={iconDims} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 15a3 3 0 003-3V6a3 3 0 10-6 0v6a3 3 0 003 3z" />
        <path d="M19 11a1 1 0 10-2 0 5 5 0 01-10 0 1 1 0 10-2 0 7 7 0 006 6.93V20H9a1 1 0 100 2h6a1 1 0 100-2h-2v-2.07A7 7 0 0019 11z" />
      </svg>
    </button>
  )
}
