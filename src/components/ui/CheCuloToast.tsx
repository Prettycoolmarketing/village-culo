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

  useEffect(() => {
    if (visible) closeRef.current?.focus()
  }, [visible])

  useEffect(() => {
    if (!visible) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [visible, onClose])

  // Auto-dismiss after 7 seconds
  useEffect(() => {
    if (!visible) return
    const timer = setTimeout(onClose, 7000)
    return () => clearTimeout(timer)
  }, [visible, onClose])

  if (!visible) return null

  const isSuccess = variant === 'success'

  const cheCuloPrefix = 'Che CULO!!'
  const hasPrefix = message.startsWith(cheCuloPrefix)
  const body = hasPrefix ? message.slice(cheCuloPrefix.length).trim() : message

  const inner = (
    <div className="flex items-start gap-3 flex-1 min-w-0">
      <span
        className={`flex-shrink-0 text-base leading-none mt-0.5 ${isSuccess ? 'text-xl' : ''}`}
        aria-hidden="true"
      >
        {isSuccess ? '🎉' : '🔔'}
      </span>
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
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-label={message}
      className="fixed bottom-5 left-5 z-50 w-80 max-w-[calc(100vw-2.5rem)]"
    >
      <div
        className={`
          rounded-2xl shadow-2xl border
          ${isSuccess
            ? 'bg-charcoal border-primary/40'
            : 'bg-charcoal border-white/10'
          }
          animate-slide-up-fade
        `}
      >
        <div className="px-4 py-3.5 flex items-start gap-3">
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

          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Dismiss"
            className="flex-shrink-0 p-1 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 mt-0.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
