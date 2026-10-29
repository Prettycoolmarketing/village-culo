// CULO Village — notify-import-errors Edge Function
//
// Instant staff alert, same "fire immediately" treatment as
// notify-new-signup/notify-first-import, for the other half of the
// request those two don't cover: a bulk import (DashboardBulkImportPage's
// VIF import) finishing with one or more founders that failed to import.
// Called fire-and-forget right after the import batch is logged — never
// blocks or delays the admin seeing their own (real, already-saved)
// results on screen.
//
// Deploy: supabase functions deploy notify-import-errors --no-verify-jwt

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { sendEmail, emailLayout } from '../_shared/resend.ts'

const STAFF_DIGEST_EMAIL = 'support@prettycoolmarketing.com'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface ImportError {
  name: string
  error: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })

  try {
    const body = await req.json() as { batchName?: string; errors?: ImportError[] }
    const errors = body.errors ?? []
    if (errors.length === 0) {
      return new Response(JSON.stringify({ success: true, skipped: true }), { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } })
    }

    const batchName = body.batchName || 'Unnamed batch'
    const errorRows = errors
      .map(e => `<li><strong>${e.name || 'Unknown'}</strong> — ${e.error}</li>`)
      .join('')

    const bodyHtml = `
      <p>${errors.length} founder${errors.length === 1 ? '' : 's'} failed to import in batch "${batchName}":</p>
      <ul>${errorRows}</ul>
      <p><a href="https://www.culovillage.com/dashboard/bulk-import">See Bulk Import →</a></p>
    `
    await sendEmail(STAFF_DIGEST_EMAIL, `Import errors: ${errors.length} failed in "${batchName}"`, emailLayout('Staff alert', bodyHtml))

    return new Response(JSON.stringify({ success: true }), { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
