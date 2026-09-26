import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { LibraryItem, LibraryPurchaseLink, LibraryStatus, PurchaseProvider } from '../../types'
import { updateLibraryItem } from '../../services/library'

const INPUT_CLS = 'w-full px-3 py-2 rounded-lg border border-[#E8E4DD] text-sm text-[#2D2A26] focus:outline-none focus:border-[#C86A43] bg-white'
const LABEL_CLS = 'block text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide mb-1'

const STATUS_OPTIONS: LibraryStatus[] = [
  'available', 'coming-soon', 'pre-order', 'free-download', 'external', 'members-only', 'early-access', 'sold-out',
]

const PROVIDER_OPTIONS: PurchaseProvider[] = [
  'internal', 'amazon', 'audible', 'shopify', 'gumroad', 'etsy', 'website', 'url',
]

function emptyLink(): LibraryPurchaseLink {
  return { label: 'Buy now', url: '', provider: 'url' }
}

export function LibraryItemEditModal({ item, onClose, onSaved }: {
  item: LibraryItem
  onClose: () => void
  onSaved: (i: LibraryItem) => void
}) {
  const [title, setTitle]             = useState(item.title)
  const [description, setDescription] = useState(item.description)
  const [status, setStatus]           = useState<LibraryStatus>(item.status)
  const [price, setPrice]             = useState(item.price ?? '')
  // Every sale/download link this product is available at — this is the
  // "where can someone actually buy it" area, editable right from Profile
  // instead of only being reachable through the full Library page.
  const [links, setLinks]             = useState<LibraryPurchaseLink[]>(
    item.purchaseLinks.length > 0 ? item.purchaseLinks : [emptyLink()],
  )
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  function updateLink(i: number, patch: Partial<LibraryPurchaseLink>) {
    setLinks(prev => prev.map((l, j) => j === i ? { ...l, ...patch } : l))
    setSaved(false)
  }

  function addLink() {
    setLinks(prev => [...prev, emptyLink()])
  }

  function removeLink(i: number) {
    setLinks(prev => prev.filter((_, j) => j !== i))
  }

  async function handleSave() {
    setSaving(true); setSaveError(null); setSaved(false)
    const next: LibraryItem = {
      ...item,
      title: title.trim() || item.title,
      description: description.trim(),
      status,
      price: price.trim() || undefined,
      // A link with no URL yet isn't a real sale link — drop it rather than
      // save a "Buy now" button that goes nowhere.
      purchaseLinks: links.filter(l => l.url.trim()).map(l => ({ ...l, label: l.label.trim() || 'Buy now', url: l.url.trim() })),
    }
    const result = await updateLibraryItem(next)
    setSaving(false)
    if (!result.success) { setSaveError(result.error ?? 'Could not save. Try again.'); return }
    setSaved(true)
    onSaved(next)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div
        className="relative bg-[#FAF8F5] rounded-2xl shadow-2xl w-full max-w-xl max-h-[85vh] overflow-y-auto p-6"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
        role="dialog"
        aria-modal="true"
        aria-label={`Edit ${item.title}`}
      >
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-lg bg-[#F3EDE6] flex-shrink-0 overflow-hidden">
              {item.coverImage && <img src={item.coverImage} alt="" className="w-full h-full object-cover" />}
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold text-[#2D2A26] truncate">{item.title}</p>
              <p className="text-xs text-[#9CA3AF] truncate">/library/{item.slug}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#9CA3AF] hover:text-[#2D2A26] transition-colors text-xl leading-none px-1" aria-label="Close">×</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className={LABEL_CLS}>Title</label>
            <input className={INPUT_CLS} value={title} onChange={e => { setTitle(e.target.value); setSaved(false) }} />
          </div>
          <div>
            <label className={LABEL_CLS}>Description</label>
            <textarea className={`${INPUT_CLS} resize-y`} rows={4} value={description} onChange={e => { setDescription(e.target.value); setSaved(false) }} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLS}>Availability</label>
              <select className={INPUT_CLS} value={status} onChange={e => { setStatus(e.target.value as LibraryStatus); setSaved(false) }}>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace('-', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL_CLS}>Price</label>
              <input className={INPUT_CLS} placeholder="Free" value={price} onChange={e => { setPrice(e.target.value); setSaved(false) }} />
            </div>
          </div>

          {/* ── Sale links ──────────────────────────────────────────────── */}
          <div>
            <label className={LABEL_CLS}>Where people can buy or get it</label>
            <div className="space-y-2">
              {links.map((link, i) => (
                <div key={i} className="flex items-center gap-2 bg-white rounded-lg border border-[#E8E4DD] p-2.5">
                  <select
                    value={link.provider}
                    onChange={e => updateLink(i, { provider: e.target.value as PurchaseProvider })}
                    className="text-xs px-2 py-1.5 rounded-md border border-[#E8E4DD] bg-white shrink-0"
                  >
                    {PROVIDER_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <input
                    type="text"
                    placeholder="Button label (e.g. Buy on Amazon)"
                    value={link.label}
                    onChange={e => updateLink(i, { label: e.target.value })}
                    className="text-sm px-2 py-1.5 rounded-md border border-[#E8E4DD] bg-white w-40 shrink-0"
                  />
                  <input
                    type="url"
                    placeholder="https://…"
                    value={link.url}
                    onChange={e => updateLink(i, { url: e.target.value })}
                    className="text-sm px-2 py-1.5 rounded-md border border-[#E8E4DD] bg-white flex-1 min-w-0"
                  />
                  <button
                    type="button"
                    onClick={() => removeLink(i)}
                    className="text-[#9CA3AF] hover:text-red-500 transition-colors text-sm shrink-0 px-1"
                    aria-label="Remove this link"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addLink}
              className="mt-2 text-xs font-semibold text-[#C86A43] hover:underline"
            >
              + Add another link
            </button>
          </div>

          {saveError && <p className="text-xs text-red-600">{saveError}</p>}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => void handleSave()}
              disabled={saving}
              className="px-5 py-2.5 bg-[#C86A43] text-white text-sm font-semibold rounded-xl hover:bg-[#b05a35] disabled:opacity-60 transition-colors"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            {saved && <span className="text-xs font-semibold text-[#5E6B4A]">Saved ✓</span>}
            <Link
              to={`/library/${item.slug}`}
              target="_blank"
              className="text-xs font-semibold text-[#9CA3AF] hover:text-[#C86A43] transition-colors ml-auto"
            >
              View public page ↗
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
