// CULO Village — send-sequence-emails Edge Function
//
// Cron-invoked once a day (see migration 030). For every active enrollment,
// works out how many days have passed since it started and sends any step
// whose day has arrived and hasn't been sent yet. An enrollment moves to
// 'completed' once every step in its sequence has gone out. Deliberately
// simple, same spirit as send-campaign: no batching/backoff, no unsubscribe
// link yet.
//
// Deploy: supabase functions deploy send-sequence-emails --no-verify-jwt

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendEmail } from '../_shared/resend.ts'

const SUPABASE_URL          = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface SequenceStep { day: number; subject: string; bodyHtml: string }
interface Sequence { name: string; steps: SequenceStep[] }
interface Enrollment {
  sequenceId: string
  email: string
  name?: string
  startedAt: string
  sentDays: number[]
  status: 'active' | 'completed' | 'stopped'
}

const MS_PER_DAY = 24 * 60 * 60 * 1000

serve(async (req) => {
  // Allow either a real cron trigger (no auth needed, this function is
  // deployed --no-verify-jwt) or a manual staff-triggered run.
  if (req.method === 'OPTIONS') return new Response('ok')

  try {
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)

    const [{ data: sequenceRows, error: seqError }, { data: enrollmentRows, error: enrollError }] = await Promise.all([
      admin.from('email_sequences').select('id, data'),
      admin.from('email_sequence_enrollments').select('id, data').filter('data->>status', 'eq', 'active'),
    ])
    if (seqError) throw new Error(seqError.message)
    if (enrollError) throw new Error(enrollError.message)

    const sequences = new Map<string, Sequence>((sequenceRows ?? []).map(r => [r.id as string, r.data as Sequence]))

    let sent = 0
    for (const row of enrollmentRows ?? []) {
      const enrollment = row.data as Enrollment
      const sequence = sequences.get(enrollment.sequenceId)
      if (!sequence) continue

      const daysElapsed = Math.floor((Date.now() - new Date(enrollment.startedAt).getTime()) / MS_PER_DAY)
      const sentDays = new Set(enrollment.sentDays ?? [])
      const dueSteps = sequence.steps.filter(s => s.day <= daysElapsed && !sentDays.has(s.day)).sort((a, b) => a.day - b.day)

      for (const step of dueSteps) {
        // EMAIL_FROM is a noreply address with no monitored inbox — reply_to
        // gives recipients a real address to write back to instead of a bounce.
        const result = await sendEmail(enrollment.email, step.subject, step.bodyHtml, 'support@prettycoolmarketing.com')
        if (result.ok) { sentDays.add(step.day); sent++ }
      }

      const allSent = sequence.steps.every(s => sentDays.has(s.day))
      await admin.from('email_sequence_enrollments').update({
        data: { ...enrollment, sentDays: [...sentDays], status: allSent ? 'completed' : enrollment.status },
      }).eq('id', row.id)
    }

    return new Response(JSON.stringify({ ok: true, sent }), { headers: { 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    })
  }
})
