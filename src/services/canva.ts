// Client-side half of the Canva import flow. The actual OAuth token
// exchange, design listing, and slide export/parsing all happen in
// Edge Functions (supabase/functions/canva-*) — this file only ever
// handles the PKCE challenge (must be generated in the browser, per
// OAuth 2.0 Authorization Code + PKCE) and thin wrappers for calling
// those functions. No Canva secret ever touches this file.

import { supabase } from '../lib/supabase'

const CANVA_AUTHORIZE_URL = 'https://www.canva.com/api/oauth/authorize'
const PKCE_SESSION_PREFIX = 'canva_pkce_'

function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let str = ''
  for (const b of bytes) str += String.fromCharCode(b)
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function randomToken(): string {
  return base64UrlEncode(crypto.getRandomValues(new Uint8Array(32)).buffer)
}

async function challengeFromVerifier(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
  return base64UrlEncode(digest)
}

export function canvaRedirectUri(): string {
  return `${window.location.origin}/dashboard/canva/callback`
}

export function isCanvaConfigured(): boolean {
  return Boolean(import.meta.env.VITE_CANVA_CLIENT_ID)
}

/** Redirects the browser to Canva's own consent screen. Resumes in DashboardCanvaCallbackPage. */
export async function startCanvaConnect(founderId: string): Promise<void> {
  const clientId = import.meta.env.VITE_CANVA_CLIENT_ID as string | undefined
  if (!clientId) throw new Error('Canva import isn’t configured yet — VITE_CANVA_CLIENT_ID is missing.')

  const verifier = randomToken()
  const state = randomToken()
  sessionStorage.setItem(`${PKCE_SESSION_PREFIX}${state}`, verifier)
  sessionStorage.setItem('canva_connect_founder_id', founderId)

  const challenge = await challengeFromVerifier(verifier)
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: canvaRedirectUri(),
    scope: 'design:content:read design:meta:read asset:read',
    code_challenge: challenge,
    code_challenge_method: 'S256',
    state,
  })
  window.location.href = `${CANVA_AUTHORIZE_URL}?${params.toString()}`
}

/** Called by DashboardCanvaCallbackPage once Canva redirects back with ?code=&state=. */
export function consumeCanvaPkceVerifier(state: string): { verifier: string; founderId: string } | null {
  const verifier = sessionStorage.getItem(`${PKCE_SESSION_PREFIX}${state}`)
  const founderId = sessionStorage.getItem('canva_connect_founder_id')
  if (!verifier || !founderId) return null
  sessionStorage.removeItem(`${PKCE_SESSION_PREFIX}${state}`)
  return { verifier, founderId }
}

// supabase-js's FunctionsHttpError carries the raw Response on `.context` —
// when a call fails before our own function's try/catch runs (a gateway-
// level JWT rejection, a crash, a timeout), `data` never gets our own
// { error } shape. Reading the raw body text instead of falling back to a
// generic message is what actually surfaces the real cause in the UI.
// Platform-level failures (the function crashing before our own try/catch —
// e.g. a Supabase compute-resource limit) come back as raw JSON from the
// gateway, not our own { error } shape: {"code":"WORKER_RESOURCE_LIMIT",
// "message":"..."}. Showing that verbatim reads as a bug even when the
// underlying cause is legitimately platform-level, so known codes get a
// plain-English translation.
const PLATFORM_ERROR_MESSAGES: Record<string, string> = {
  WORKER_RESOURCE_LIMIT: 'That request needed more memory than this ran with — try again, or write this part in yourself instead.',
}

async function canvaFunctionError(data: { error?: string } | null, error: unknown, fallback: string): Promise<Error> {
  let detail = data?.error
  if (!detail && error && typeof error === 'object' && 'context' in error) {
    const ctx = (error as { context?: Response }).context
    if (ctx && typeof ctx.text === 'function') {
      try {
        const raw = (await ctx.text()).slice(0, 300)
        try {
          const parsed = JSON.parse(raw) as { code?: string; message?: string }
          detail = (parsed.code && PLATFORM_ERROR_MESSAGES[parsed.code]) || parsed.message || raw
        } catch {
          detail = raw
        }
      } catch { /* ignore */ }
    }
  }
  return new Error(detail || (error instanceof Error ? error.message : fallback))
}

export async function exchangeCanvaCode(founderId: string, code: string, codeVerifier: string): Promise<void> {
  if (!supabase) throw new Error('Not available in this environment.')
  const { data, error } = await supabase.functions.invoke<{ error?: string }>('canva-oauth-exchange', {
    body: { founderId, code, codeVerifier, redirectUri: canvaRedirectUri() },
  })
  if (error || data?.error) throw await canvaFunctionError(data ?? null, error, 'Could not connect your Canva account.')
}

export async function getCanvaStatus(founderId: string): Promise<boolean> {
  if (!supabase) return false
  const { data } = await supabase.functions.invoke<{ connected: boolean }>('canva-status', { body: { founderId } })
  return data?.connected ?? false
}

export interface CanvaDesignSummary {
  id: string
  title: string
  thumbnailUrl?: string
}

export async function listCanvaDesigns(founderId: string): Promise<CanvaDesignSummary[]> {
  if (!supabase) return []
  const { data, error } = await supabase.functions.invoke<{ designs?: CanvaDesignSummary[]; error?: string }>('canva-list-designs', {
    body: { founderId },
  })
  if (error || data?.error) throw await canvaFunctionError(data ?? null, error, 'Could not load your Canva designs.')
  return data?.designs ?? []
}

export interface CanvaImportResult {
  title: string
  imageUrls: string[]
  // pageNumbers[i] is the real Canva page (1-indexed) behind imageUrls[i] —
  // NOT always i+1, since a skipped slide shifts every later index. Anything
  // that needs to re-export a specific slide (e.g. Reel video) must look up
  // this array rather than assuming the position.
  pageNumbers: number[]
  // Graceful-degradation flags — a very large/photo-heavy design can exceed
  // what the import function safely holds in memory. When these are set the
  // import still succeeds, just with fewer slides than the full design.
  imagesSkipped?: number
  slidesTruncated?: boolean
}

interface CanvaImagesResult {
  title: string
  imageUrls: string[]
  pageNumbers?: number[]
  imagesSkipped?: number
  slidesTruncated?: boolean
  error?: string
}

// canva-export-images (JPG export + Storage re-upload) runs alone here —
// text is no longer pulled for the whole design up front. A photo-heavy
// design's full PPTX (needed for text) can be huge even when a founder only
// ever needs text from the 1-2 slides they group into a piece at a time;
// see fetchCanvaSlideTexts, called on demand per group instead.
export async function importCanvaDesign(founderId: string, designId: string): Promise<CanvaImportResult> {
  if (!supabase) throw new Error('Not available in this environment.')
  const { data, error } = await supabase.functions.invoke<CanvaImagesResult>('canva-export-images', {
    body: { founderId, designId },
  })
  if (error || data?.error) throw await canvaFunctionError(data ?? null, error, 'Could not import that design.')
  return {
    title: data!.title,
    imageUrls: data!.imageUrls,
    pageNumbers: data!.pageNumbers ?? data!.imageUrls.map((_, i) => i + 1),
    imagesSkipped: data!.imagesSkipped,
    slidesTruncated: data!.slidesTruncated,
  }
}

interface CanvaTextResult {
  textsByPage: Record<number, string>
  textExtractionSkipped?: boolean
  error?: string
}

export interface CanvaSlideTexts {
  textsByPage: Record<number, string>
  textExtractionSkipped: boolean
}

/**
 * Pulls text for only the given Canva page numbers (1-indexed) — called
 * once a founder groups specific slides into a piece, not for the whole
 * design. Keeps the underlying PPTX export tiny regardless of how large the
 * overall design is, since Canva's export `pages` field scopes the file to
 * just those slides.
 */
export async function fetchCanvaSlideTexts(founderId: string, designId: string, pageNumbers: number[]): Promise<CanvaSlideTexts> {
  if (!supabase) throw new Error('Not available in this environment.')
  const { data, error } = await supabase.functions.invoke<CanvaTextResult>('canva-export-text', {
    body: { founderId, designId, pageNumbers },
  })
  if (error || data?.error) throw await canvaFunctionError(data ?? null, error, 'Could not read the text on those slides.')
  return {
    textsByPage: data?.textsByPage ?? {},
    textExtractionSkipped: data?.textExtractionSkipped ?? false,
  }
}

/**
 * Exports a single Canva page as an actual video (Phase 2 of the Reel
 * grouping flow — see canva-export-reel-video). Slower than the image/text
 * exports (real video encoding on Canva's side), so this is called
 * separately, after a Reel piece is already saved, rather than blocking the
 * initial "Create pieces" save.
 */
export async function exportCanvaReelVideo(founderId: string, designId: string, pageNumber: number, orientation: 'vertical' | 'horizontal' = 'vertical'): Promise<string> {
  if (!supabase) throw new Error('Not available in this environment.')
  const { data, error } = await supabase.functions.invoke<{ videoUrl?: string; error?: string }>('canva-export-reel-video', {
    body: { founderId, designId, pageNumber, orientation },
  })
  if (error || data?.error) throw await canvaFunctionError(data ?? null, error, 'Could not export that video.')
  if (!data?.videoUrl) throw new Error('The video export returned no result.')
  return data.videoUrl
}
