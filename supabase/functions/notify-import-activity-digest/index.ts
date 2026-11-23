// CULO Village — notify-import-activity-digest Edge Function
//
// Replaces notify-first-import (deleted — see src/services/importedContent.ts
// for the bug this fixes). That function fired an instant staff email per
// NEW imported-content row from client code, gated on a local-cache check
// that races a connector scan's concurrent Promise.all upserts — confirmed
// real: 10 separate emails for one founder's first website-rss scan (15
// items landing near-simultaneously, each one reading the same stale
// "no real import yet" cache before any earlier call's result came back).
//
// Cron-invoked every 30 minutes (see migration — pg_cron needs the
// Dashboard SQL Editor to register a schedule, same as 030/045). Finds every
// founder who has at least one real (non-staffCreated) imported_content row
// but hasn't been alerted yet (firstImportAlertSentAt unset), batches all of
// them into ONE email, and marks each as alerted — same idempotent-forever
// field as before, just claimed by one process on a schedule instead of
// racing client calls, so a single run can never double-send regardless of
// how many items landed in between runs.
//
// Deploy: supabase functions deploy notify-import-activity-digest --no-verify-jwt

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.108.2'
import { sendEmail, emailLayout } from '../_shared/resend.ts'

const SUPABASE_URL          = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const STAFF_DIGEST_EMAIL = 'support@prettycoolmarketing.com'

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok')

  try {
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)

    // Every founder with at least one real import, grouped client-side —
    // the staffCreated !== true check (staff-authored items should never
    // count as a founder "importing") only needs to run once per row here,
    // not as a separate JSONB-text filter that can't cleanly distinguish
    // "absent" from "false" against Postgres anyway.
    const { data: importRows, error: importError } = await admin
      .from('imported_content')
      .select('founder_id, source_platform, data')
    if (importError) throw new Error(importError.message)

    const byFounder = new Map<string, { platform: string; count: number }>()
    for (const row of importRows ?? []) {
      const d = row.data as Record<string, unknown>
      if (d.staffCreated === true) continue
      const founderId = row.founder_id as string
      const existing = byFounder.get(founderId)
      if (existing) existing.count++
      else byFounder.set(founderId, { platform: (row.source_platform as string) || 'content', count: 1 })
    }
    if (byFounder.size === 0) {
      return new Response(JSON.stringify({ success: true, alerted: 0 }), { headers: { 'Content-Type': 'application/json' } })
    }

    const { data: founderRows, error: founderError } = await admin
      .from('founders')
      .select('id, data')
      .in('id', [...byFounder.keys()])
    if (founderError) throw new Error(founderError.message)

    const newlyAlerted: { id: string; name: string; email: string; platform: string; count: number }[] = []
    for (const row of founderRows ?? []) {
      const d = row.data as Record<string, unknown>
      if (d.firstImportAlertSentAt) continue
      const info = byFounder.get(row.id as string)
      if (!info) continue
      newlyAlerted.push({
        id: row.id as string,
        name: (d.name as string) || 'Someone',
        email: (d.signupEmail as string) || (d.claimEmail as string) || '',
        platform: info.platform,
        count: info.count,
      })
    }

    if (newlyAlerted.length === 0) {
      return new Response(JSON.stringify({ success: true, alerted: 0 }), { headers: { 'Content-Type': 'application/json' } })
    }

    const rows = newlyAlerted
      .map(f => `<li><strong>${f.name}</strong>${f.email ? ` — ${f.email}` : ''} — ${f.platform}, ${f.count} item${f.count === 1 ? '' : 's'}</li>`)
      .join('')
    const bodyHtml = `
      <p>${newlyAlerted.length} founder${newlyAlerted.length === 1 ? '' : 's'} imported content for the first time:</p>
      <ul>${rows}</ul>
      <p><a href="https://www.culovillage.com/dashboard/village/emails">See them in Culo Members →</a></p>
    `
    await sendEmail(
      STAFF_DIGEST_EMAIL,
      `${newlyAlerted.length} new founder${newlyAlerted.length === 1 ? '' : 's'} imported content`,
      emailLayout('Staff alert', bodyHtml),
    )

    // Marked AFTER the send so a failed send can retry on the next run
    // rather than silently never alerting on this founder again.
    const now = new Date().toISOString()
    for (const f of newlyAlerted) {
      const row = (founderRows ?? []).find(r => r.id === f.id)
      if (!row) continue
      await admin.from('founders').update({
        data: { ...(row.data as Record<string, unknown>), firstImportAlertSentAt: now },
      }).eq('id', f.id)
    }

    return new Response(JSON.stringify({ success: true, alerted: newlyAlerted.length }), { headers: { 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    })
  }
})
