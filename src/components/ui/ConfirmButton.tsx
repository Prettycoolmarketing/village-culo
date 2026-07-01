import { useState } from 'react'

interface Props {
  label: string
  confirmLabel?: string
  message?: string
  onConfirm: () => void
  className?: string
  disabled?: boolean
}

/**
 * Inline two-step confirm — click once to arm, click "Confirm" to actually act.
 * Matches the existing inline-confirm pattern already used elsewhere in the
 * dashboard (e.g. import batch row delete) rather than introducing a modal
 * pattern that doesn't exist anywhere else in the app.
 */
export function ConfirmButton({ label, confirmLabel = 'Confirm', message, onConfirm, className, disabled }: Props) {
  const [armed, setArmed] = useState(false)

  if (armed) {
    return (
      <span className="inline-flex items-center gap-2">
        {message && <span className="text-xs text-[#6B7280]">{message}</span>}
        <button
          type="button"
          onClick={() => { setArmed(false); onConfirm() }}
          className="text-xs font-semibold text-red-600 hover:text-red-700 transition-colors"
        >
          {confirmLabel}
        </button>
        <button
          type="button"
          onClick={() => setArmed(false)}
          className="text-xs text-[#9CA3AF] hover:text-[#2D2A26] transition-colors"
        >
          Cancel
        </button>
      </span>
    )
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => setArmed(true)}
      className={className ?? 'text-xs text-[#9CA3AF] hover:text-red-500 transition-colors disabled:opacity-50'}
    >
      {label}
    </button>
  )
}
