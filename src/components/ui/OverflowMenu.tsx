import { useEffect, useRef, useState } from 'react'

interface OverflowMenuProps {
  onEdit?: () => void
  onDuplicate?: () => void
  onArchive?: () => void
  onRestore?: () => void
  onDelete?: () => void
  archived?: boolean
  className?: string
}

/**
 * Shared ⋮ action menu used on every creator-owned entity card/row —
 * Edit / Duplicate / Archive (or Restore, when already archived) / Delete.
 * Delete always requires an inline confirm step; never fires immediately.
 */
export function OverflowMenu({ onEdit, onDuplicate, onArchive, onRestore, onDelete, archived, className }: OverflowMenuProps) {
  const [open, setOpen] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setConfirmingDelete(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  function close() {
    setOpen(false)
    setConfirmingDelete(false)
  }

  return (
    <div ref={ref} className={`relative shrink-0 ${className ?? ''}`}>
      <button
        type="button"
        onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
        aria-label="More actions"
        aria-haspopup="menu"
        aria-expanded={open}
        className="w-7 h-7 flex items-center justify-center rounded-lg text-[#9CA3AF] hover:text-[#2D2A26] hover:bg-[#F3EDE6] transition-colors"
      >
        ⋮
      </button>

      {open && (
        <div
          role="menu"
          onClick={e => e.stopPropagation()}
          className="absolute right-0 top-8 z-20 w-44 bg-white rounded-xl border border-[#E8E4DD] shadow-lg py-1.5 flex flex-col"
        >
          {confirmingDelete ? (
            <div className="px-3 py-2 flex flex-col gap-2">
              <p className="text-xs text-[#6B7280]">Delete this? This can't be undone.</p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => { close(); onDelete?.() }}
                  className="text-xs font-semibold text-red-600 hover:text-red-700 transition-colors"
                >
                  Confirm Delete
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  className="text-xs text-[#9CA3AF] hover:text-[#2D2A26] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              {onEdit && (
                <button type="button" role="menuitem" onClick={() => { close(); onEdit() }}
                  className="text-left px-3 py-2 text-sm text-[#2D2A26] hover:bg-[#F8F5F0] transition-colors">
                  Edit
                </button>
              )}
              {onDuplicate && (
                <button type="button" role="menuitem" onClick={() => { close(); onDuplicate() }}
                  className="text-left px-3 py-2 text-sm text-[#2D2A26] hover:bg-[#F8F5F0] transition-colors">
                  Duplicate
                </button>
              )}
              {archived
                ? onRestore && (
                  <button type="button" role="menuitem" onClick={() => { close(); onRestore() }}
                    className="text-left px-3 py-2 text-sm text-[#2D2A26] hover:bg-[#F8F5F0] transition-colors">
                    Restore
                  </button>
                )
                : onArchive && (
                  <button type="button" role="menuitem" onClick={() => { close(); onArchive() }}
                    className="text-left px-3 py-2 text-sm text-[#2D2A26] hover:bg-[#F8F5F0] transition-colors">
                    Archive
                  </button>
                )}
              {onDelete && (
                <button type="button" role="menuitem" onClick={() => setConfirmingDelete(true)}
                  className="text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                  Delete
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
