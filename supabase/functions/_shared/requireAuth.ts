// CULO Village — shared auth check for --no-verify-jwt functions
//
// Several functions that call an expensive third-party API (an LLM, Apify
// for Instagram scraping, a remote media fetch) were deployed with
// --no-verify-jwt — needed so the client's own fetch doesn't get rejected
// before reaching the handler — but had NO check inside the function body
// either. verify_jwt off is a platform-level gate only: it does not mean
// "no auth," it means "this function decides for itself." These functions
// never did, so anyone who found the URL could trigger a paid Apify scrape
// or LLM call with no login at all, on the project's own bill.
//
// None of these functions write to the database themselves (the actual
// save always happens client-side afterward, under normal RLS), so this
// doesn't need to replicate each page's ownership rules — it only needs
// to confirm the caller is a real, currently signed-in user, which is
// what actually closes the anonymous-abuse hole. supabase-js already
// attaches the signed-in user's JWT as the Authorization header on every
// functions.invoke() call automatically; this just verifies it server-side
// instead of trusting it's there.
//
// Usage: const user = await requireAuth(req); if (!user) return unauthorized()

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL      = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!

export async function requireAuth(req: Request): Promise<{ id: string; email?: string } | null> {
  const authHeader = req.headers.get('Authorization')
  const token = authHeader?.replace(/^Bearer\s+/i, '')
  if (!token) return null

  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  const { data, error } = await client.auth.getUser(token)
  if (error || !data.user) return null
  return { id: data.user.id, email: data.user.email }
}

export function unauthorizedResponse(corsHeaders: Record<string, string>): Response {
  return new Response(JSON.stringify({ error: 'Sign in required.' }), {
    status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

// For the handful of functions that are admin/owner-only by design (e.g.
// Lead Sources — see CAPO_PERMISSIONS.leadSources), not just "any signed-in
// user." Needs the service role to read profiles.role, since RLS on that
// table has no policy letting a user read anyone else's row (or even
// their own via the anon-key client used in requireAuth above).
const SUPABASE_URL_          = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_ = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

export async function requireAdmin(req: Request): Promise<{ id: string; email?: string } | null> {
  const user = await requireAuth(req)
  if (!user) return null
  const admin = createClient(SUPABASE_URL_, SUPABASE_SERVICE_ROLE_)
  const { data } = await admin.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (!data || !['admin', 'owner'].includes(data.role as string)) return null
  return user
}

export function forbiddenResponse(corsHeaders: Record<string, string>): Response {
  return new Response(JSON.stringify({ error: 'Admin access required.' }), {
    status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
