// Shared by every Edge Function that fetches a URL supplied by a founder
// (podcast RSS/website discovery/resolve-podcast) — a founder can paste
// *any* URL, so every outbound fetch here is a potential SSRF vector into
// this project's own network (Supabase internals, cloud metadata endpoints,
// other services on the same host). This is the one place those rules live;
// every caller goes through it instead of a bare `fetch()`.

const BLOCKED_HOSTNAMES = new Set(['localhost', '0.0.0.0', '[::1]', '::1'])

// Cloud metadata endpoints — never reachable, regardless of protocol.
const BLOCKED_EXACT_IPS = new Set(['169.254.169.254', 'metadata.google.internal'])

function isPrivateIPv4(host: string): boolean {
  const m = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (!m) return false
  const [a, b] = [Number(m[1]), Number(m[2])]
  if (a === 10) return true
  if (a === 127) return true
  if (a === 169 && b === 254) return true
  if (a === 172 && b >= 16 && b <= 31) return true
  if (a === 192 && b === 168) return true
  if (a === 0) return true
  return false
}

function isBlockedHost(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/^\[|\]$/g, '')
  if (BLOCKED_HOSTNAMES.has(h)) return true
  if (BLOCKED_EXACT_IPS.has(h)) return true
  if (isPrivateIPv4(h)) return true
  // Any IPv6 unique-local/link-local range (fc00::/7, fe80::/10) — coarse
  // prefix check is enough here since browsers/DNS won't hand these out
  // for a legitimate public podcast/website host anyway.
  if (/^f[cd]/i.test(h) || /^fe[89ab]/i.test(h)) return true
  return false
}

export class SafeFetchError extends Error {}

export interface SafeFetchOptions {
  maxRedirects?: number
  maxBytes?: number
  timeoutMs?: number
  headers?: Record<string, string>
}

const DEFAULTS = { maxRedirects: 5, maxBytes: 5_000_000, timeoutMs: 10_000 }

/**
 * Validates the URL and every redirect hop against the SSRF blocklist,
 * enforces a request timeout and a response-size cap, and returns the body
 * as text. Throws SafeFetchError with a user-safe message on any violation.
 */
export async function safeFetchText(inputUrl: string, opts: SafeFetchOptions = {}): Promise<string> {
  const { maxRedirects, maxBytes, timeoutMs, headers } = { ...DEFAULTS, ...opts }

  let current = inputUrl
  for (let hop = 0; hop <= maxRedirects; hop++) {
    let parsed: URL
    try {
      parsed = new URL(current)
    } catch {
      throw new SafeFetchError('That URL is not valid.')
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new SafeFetchError('Only http and https URLs are supported.')
    }
    if (isBlockedHost(parsed.hostname)) {
      throw new SafeFetchError('That address can’t be fetched.')
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)
    let res: Response
    try {
      res = await fetch(parsed.toString(), {
        headers: { 'User-Agent': 'CULOVillageFeedFetcher/1.0', ...headers },
        redirect: 'manual',
        signal: controller.signal,
      })
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new SafeFetchError('That request took too long to respond.')
      }
      throw new SafeFetchError('Could not reach that address.')
    } finally {
      clearTimeout(timeout)
    }

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('location')
      if (!location) throw new SafeFetchError('That address redirected without a destination.')
      current = new URL(location, parsed).toString()
      continue
    }

    if (!res.ok) {
      throw new SafeFetchError(`That address responded with ${res.status}.`)
    }

    const lengthHeader = res.headers.get('content-length')
    if (lengthHeader && Number(lengthHeader) > maxBytes) {
      throw new SafeFetchError('That response was too large.')
    }

    const reader = res.body?.getReader()
    if (!reader) return await res.text()
    const chunks: Uint8Array[] = []
    let total = 0
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      total += value.byteLength
      if (total > maxBytes) {
        void reader.cancel()
        throw new SafeFetchError('That response was too large.')
      }
      chunks.push(value)
    }
    const combined = new Uint8Array(total)
    let offset = 0
    for (const chunk of chunks) { combined.set(chunk, offset); offset += chunk.byteLength }
    return new TextDecoder('utf-8').decode(combined)
  }

  throw new SafeFetchError('Too many redirects.')
}
