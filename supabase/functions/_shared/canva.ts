// Shared by every canva-* Edge Function (list-designs, import-design) —
// resolves a founder's stored Canva token, transparently refreshing it via
// Canva's refresh_token grant when it's expired (or about to). Never
// imported by anything outside supabase/functions — this only exists
// because the Connect API access token is short-lived (~4 hours) but a
// founder's connection should keep working indefinitely without them
// reconnecting.

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CANVA_CLIENT_ID     = Deno.env.get('CANVA_CLIENT_ID')
const CANVA_CLIENT_SECRET = Deno.env.get('CANVA_CLIENT_SECRET')

interface CanvaAccountRow {
  founder_id: string
  access_token: string
  refresh_token: string
  expires_at: string
}

/** Returns a definitely-valid access token for this founder, refreshing and persisting a new one if needed. Throws if not connected. */
export async function getValidCanvaAccessToken(admin: SupabaseClient, founderId: string): Promise<string> {
  const { data: account, error } = await admin
    .from('founder_canva_accounts').select('*').eq('founder_id', founderId).single<CanvaAccountRow>()
  if (error || !account) throw new Error('This founder has not connected Canva yet.')

  const expiresAt = new Date(account.expires_at).getTime()
  // Refresh a little early rather than racing an export job against expiry mid-flight.
  if (expiresAt - Date.now() > 60_000) return account.access_token

  if (!CANVA_CLIENT_ID || !CANVA_CLIENT_SECRET) throw new Error('Canva import is not configured on this deployment.')

  const basicAuth = btoa(`${CANVA_CLIENT_ID}:${CANVA_CLIENT_SECRET}`)
  const form = new URLSearchParams({ grant_type: 'refresh_token', refresh_token: account.refresh_token })
  const res = await fetch('https://api.canva.com/rest/v1/oauth/token', {
    method: 'POST',
    headers: { Authorization: `Basic ${basicAuth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form,
  })
  const token = await res.json()
  if (!res.ok) throw new Error(token.error_description ?? token.error ?? 'Canva connection expired — reconnect it from Import Content.')

  const newExpiresAt = new Date(Date.now() + (Number(token.expires_in) || 3600) * 1000).toISOString()
  await admin.from('founder_canva_accounts').update({
    access_token: token.access_token,
    refresh_token: token.refresh_token ?? account.refresh_token,
    expires_at: newExpiresAt,
  }).eq('founder_id', founderId)

  return token.access_token
}

/** Verifies the caller (their own JWT, via RLS) actually owns this founder before any Canva-account access. */
export async function assertOwnsFounder(asCaller: SupabaseClient, founderId: string): Promise<void> {
  const { data, error } = await asCaller.from('founders').select('id').eq('id', founderId).single()
  if (error || !data) throw new Error('You do not have access to this founder profile.')
}
