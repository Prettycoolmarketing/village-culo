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

export async function exchangeCanvaCode(founderId: string, code: string, codeVerifier: string): Promise<void> {
  if (!supabase) throw new Error('Not available in this environment.')
  const { data, error } = await supabase.functions.invoke<{ error?: string }>('canva-oauth-exchange', {
    body: { founderId, code, codeVerifier, redirectUri: canvaRedirectUri() },
  })
  if (error || data?.error) {
    // supabase-js's FunctionsHttpError carries the raw Response on `.context`
    // — read the body text directly rather than assuming it's JSON shaped
    // like { error }, so a gateway-level failure (bad JWT, function crash
    // before our own try/catch) shows its real message instead of a generic
    // fallback that hides what actually went wrong.
    let detail = data?.error
    if (!detail && error && typeof error === 'object' && 'context' in error) {
      const ctx = (error as { context?: Response }).context
      if (ctx && typeof ctx.text === 'function') {
        try { detail = (await ctx.text()).slice(0, 300) } catch { /* ignore */ }
      }
    }
    throw new Error(detail || (error instanceof Error ? error.message : 'Could not connect your Canva account.'))
  }
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
  if (error || data?.error) throw new Error(data?.error ?? 'Could not load your Canva designs.')
  return data?.designs ?? []
}

export interface CanvaImportResult {
  title: string
  imageUrls: string[]
  slideTexts: string[]
  combinedText: string
}

export async function importCanvaDesign(founderId: string, designId: string): Promise<CanvaImportResult> {
  if (!supabase) throw new Error('Not available in this environment.')
  const { data, error } = await supabase.functions.invoke<CanvaImportResult & { error?: string }>('canva-import-design', {
    body: { founderId, designId },
  })
  if (error || data?.error) throw new Error(data?.error ?? 'Could not import that design.')
  return data as CanvaImportResult
}
