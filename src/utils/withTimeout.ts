// Extracted after the same hang bug turned up independently in four import
// paths (Instagram/iCloud/Snapchat archive uploads, the VIF bulk importer's
// writes) — none of their underlying calls (Supabase Storage, a DB write, an
// edge function round trip, a <video> element event wait) had any timeout of
// their own, so a stalled network call just hung the awaiting code forever:
// no error, no catch, no progress update. Confirmed real on the Instagram
// importer (a founder stuck at "Uploading media 24 of 106…" with nothing in
// the console). Wrapping the call turns a hang into a rejection, which lets
// existing error handling (a retry, a skip-this-item, a caught failure) do
// its job instead of the operation freezing silently.
export function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms)
    promise.then(
      v => { clearTimeout(timer); resolve(v) },
      e => { clearTimeout(timer); reject(e) },
    )
  })
}
