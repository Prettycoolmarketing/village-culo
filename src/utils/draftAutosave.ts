// Generic localStorage draft-persistence — same "don't lose what I typed if I
// navigate away or the tab closes before I hit Save" pattern used by the
// Publish wizard (DASHBOARD_PUBLISH_DRAFT_KEY), applied to any keyed form.
// Purely local, no network — cleared once the real save succeeds.

export function loadDraft<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

export function saveDraft<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage full or unavailable — the explicit Save button still works, so
    // silently skip the convenience autosave rather than surface an error.
  }
}

export function clearDraft(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    // Nothing to clean up if storage isn't available in the first place.
  }
}
