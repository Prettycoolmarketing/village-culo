// CULO Village — enroll-email-sequence Edge Function
//
// Client-side signup flows (join, waitlist) run with the user's own JWT,
// not the service role, so they can't insert directly into
// email_sequence_enrollments (admin-only per migration 029). This is the
// one narrow door: takes a sequence id + email and creates an active
// enrollment, nothing else. Safe to call even before the named sequence
// has any steps — send-sequence-emails just finds nothing to send until
// staff add content in the Sequences tab, then the daily cron picks up
// every already-enrolled person automatically.
//
// Deploy: supabase functions deploy enroll-email-sequence --no-verify-jwt

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL          = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })

  try {
    const body = await req.json() as { sequenceId?: string; email?: string; name?: string; source?: string }
    const sequenceId = body.sequenceId?.trim()
    const email = body.email?.trim().toLowerCase()
    if (!sequenceId || !email || !email.includes('@')) throw new Error('sequenceId and a real email are required')

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)

    // Idempotent — one active enrollment per sequence per email, not a new
    // one every time someone re-triggers the same signup flow.
    const { data: existing } = await admin
      .from('email_sequence_enrollments')
      .select('id')
      .eq('sequence_id', sequenceId)
      .eq('email', email)
      .maybeSingle()
    if (existing) {
      return new Response(JSON.stringify({ success: true, alreadyEnrolled: true }), {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    const now = new Date().toISOString()
    const { error } = await admin.from('email_sequence_enrollments').insert({
      id: crypto.randomUUID(), sequence_id: sequenceId, email,
      data: { sequenceId, email, name: body.name, source: body.source, startedAt: now, sentDays: [], status: 'active' },
    })
    if (error) throw new Error(error.message)

    // A day:0 step used to only go out on the next scheduled daily cron
    // run (up to ~24h away depending on signup time), which read as "the
    // welcome email didn't send" even though it was only ever queued, not
    // broken — confirmed real: several real enrollments sitting at "0
    // sent" hours after signup. Calling send-sequence-emails right here
    // processes every due step across every active enrollment immediately
    // (not just this one), so a genuinely day:0 step goes out within
    // seconds of signing up instead of waiting on the clock. Actually
    // awaited, not fire-and-forget — an unawaited call risks the Deno
    // isolate terminating the moment this function's own response is sent,
    // before the fetch it kicked off ever completes. The caller
    // (joinFlow.ts) already doesn't await this whole enroll call itself,
    // so the extra latency here doesn't block signup either way. A
    // failure here is swallowed, never thrown — the daily cron is still
    // the real safety net regardless.
    try {
      await fetch(`${SUPABASE_URL}/functions/v1/send-sequence-emails`, { method: 'POST' })
    } catch { /* best-effort — the daily cron will still catch this */ }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
