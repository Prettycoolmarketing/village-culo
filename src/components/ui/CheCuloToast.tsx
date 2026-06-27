import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

interface CheCuloToastProps {
  message: string
  href?: string
  visible: boolean
  onClose: () => void
  variant?: 'success' | 'activity'
}

export function CheCuloToast({
  message,
  href,
  visible,
  onClose,
  variant = 'activity',
}: CheCuloToastProps) {
  const closeRef = useRef<HTMLButtonElement>(null)

  // Move focus to close button when toast appears
  useEffect(() => {
    if (visible) closeRef.current?.focus()
  }, [visible])

  // Keyboard: Escape to dismiss
  useEffect(() => {
    if (!visible) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [visible, onClose])

  if (!visible) return null

  const isSuccess = variant === 'success'

  // Extract "Che CULO!!" from message for styled split
  const cheCuloPrefix = 'Che CULO!!'
  const hasPrefix = message.startsWith(cheCuloPrefix)
  const body = hasPrefix ? message.slice(cheCuloPrefix.length).trim() : message

  const inner = (
    <div className="flex items-start gap-3 flex-1 min-w-0">
      {/* Icon */}
      <span
        className={`flex-shrink-0 text-lg leading-none mt-0.5 ${isSuccess ? 'text-2xl' : ''}`}
        aria-hidden="true"
      >
        {isSuccess ? '🎉' : '🔔'}
      </span>

      {/* Text */}
      <div className="min-w-0 flex-1">
        {hasPrefix && (
          <span className="font-heading font-bold text-primary text-sm tracking-tight">
            Che CULO!!{' '}
          </span>
        )}
        <span className={`font-body text-sm text-white/90 leading-snug ${isSuccess ? 'font-medium' : ''}`}>
          {body}
        </span>
        {href && (
          <span className="font-body text-xs text-white/50 mt-0.5 block">
            Tap to read →
          </span>
        )}
      </div>
    </div>
  )

  return (
    // aria-live="polite" so screen readers announce it without interrupting
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-label={message}
      className={`
        w-full
        ${isSuccess
          ? 'bg-charcoal border-b border-primary/30'
          : 'bg-charcoal border-b border-white/8'
        }
        motion-safe:animate-slide-down
      `}
      style={{
        // Fallback for reduced motion — just appear, no slide
        animation: 'var(--toast-animation, none)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">

        {/* Clickable content */}
        {href ? (
          <Link
            to={href}
            className="flex items-start gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity"
            onClick={onClose}
            aria-label={message}
          >
            {inner}
          </Link>
        ) : (
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {inner}
          </div>
        )}

        {/* Dismiss */}
        <button
          ref={closeRef}
          onClick={onClose}
          aria-label="Dismiss announcement"
          className="flex-shrink-0 p-1.5 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/8 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
