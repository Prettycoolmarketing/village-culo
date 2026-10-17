// One-time prefill hints for Import's connect forms — set when a URL for
// that platform turns up either from what a founder typed into Profile's
// research box, or from what research itself discovered while looking
// them up (their YouTube channel, their podcast), so they don't have to
// go find and retype a link Culo already has. Read once on mount and
// cleared immediately — stale forever otherwise if never opened.

type PrefillPlatform = 'youtube' | 'podcast' | 'website'

function key(founderId: string, platform: PrefillPlatform): string {
  return `culo_v1_connect_prefill_${platform}_${founderId}`
}

export function setConnectPrefill(founderId: string, platform: PrefillPlatform, url: string): void {
  try {
    localStorage.setItem(key(founderId, platform), url)
  } catch {
    // Private browsing / storage blocked — not worth failing research over.
  }
}

export function consumeConnectPrefill(founderId: string, platform: PrefillPlatform): string | null {
  try {
    const k = key(founderId, platform)
    const value = localStorage.getItem(k)
    if (value) localStorage.removeItem(k)
    return value
  } catch {
    return null
  }
}
