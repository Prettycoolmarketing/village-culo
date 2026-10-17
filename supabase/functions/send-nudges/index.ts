// CULO Village — send-nudges Edge Function
//
// Replaces notify-stuck-onboarding with the same pattern extended to every
// real drop-off point found while auditing the signup funnel, not just
// "ready to confirm". Runs once a day; each condition below is checked
// independently, and each founder can only ever receive a given nudge
// once (a dedicated *NudgeSentAt field per condition, same idempotency
// pattern throughout this codebase's email functions).
//
// Subject/body for each nudge live in email_nudge_templates (046), not
// hardcoded here — editable from the Nudges tab the same way a Sequence
// step is, no code deploy needed to change a sentence. Supported
// placeholders: {{name}} and, ready-to-confirm only, {{bioBlock}} (the
// founder's bio rendered as its own styled block, or empty string if they
// don't have one yet).
//
// The four conditions, and exactly when each fires relative to the
// founder's own timeline:
//
// 1. NEEDS SETUP — onboardingStatus 'needs_setup' for 24h+. Signed up,
//    never submitted their one-link /join/setup capture.
// 2. READY TO CONFIRM — onboardingStatus 'ready' for 24h+. Research
//    finished (bio + first article already written), never reopened the
//    dashboard for it to auto-progress (see DashboardLayout).
// 3. IMPORTED NOTHING — onboardingStatus 'confirmed' for 48h+, with zero
//    imported_content rows. Onboarding fully done, but they never touched
//    Import Content at all.
// 4. READY TO PUBLISH, UNTOUCHED — has at least one imported_content row
//    with status 'draft' and a real (non-placeholder) title, the oldest
//    such row imported 72h+ ago, and zero published/featured stories.
//    Real content sitting there, never pushed live.
//
// A staff digest to support@prettycoolmarketing.com lists everyone nudged
// this run, grouped by which condition, for manual follow-up.
//
// Deploy: supabase functions deploy send-nudges --no-verify-jwt

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendEmail, emailLayout } from '../_shared/resend.ts'

const SUPABASE_URL          = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const STAFF_DIGEST_EMAIL = 'support@prettycoolmarketing.com'
const HOUR = 60 * 60 * 1000

type NudgeField = 'needsSetupNudgeSentAt' | 'readyNudgeSentAt' | 'importNudgeSentAt' | 'publishNudgeSentAt'

interface FounderData {
  name?: string
  signupEmail?: string
  bio?: string
  onboardingStatus?: string
  needsSetupNudgeSentAt?: string
  readyNudgeSentAt?: string
  importNudgeSentAt?: string
  publishNudgeSentAt?: string
}
interface FounderRow { id: string; updated_at: string; data: FounderData }
interface NudgeTemplate { title: string; subject: string; bodyHtml: string }

function render(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce((text, [key, value]) => text.replaceAll(`{{${key}}}`, value), template)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok')

  try {
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)
    const now = Date.now()
    const stuckFor = (updatedAt: string) => now - new Date(updatedAt).getTime()

    const [{ data: allFounders, error: fErr }, { data: templateRows, error: tErr }] = await Promise.all([
      admin.from('founders').select('id, updated_at, data'),
      admin.from('email_nudge_templates').select('id, data'),
    ])
    if (fErr) throw new Error(fErr.message)
    if (tErr) throw new Error(tErr.message)
    const founders = (allFounders ?? []).map(r => r as unknown as FounderRow)
    const templates = new Map<string, NudgeTemplate>((templateRows ?? []).map(r => [r.id as string, r.data as NudgeTemplate]))

    async function sendNudge(founder: FounderRow, field: NudgeField, vars: Record<string, string>): Promise<boolean> {
      const template = templates.get(field)
      const email = founder.data.signupEmail
      if (!template || !email) return false
      const subject = render(template.subject, vars)
      const bodyHtml = render(template.bodyHtml, vars)
      const result = await sendEmail(email, subject, emailLayout('The Culo Village: Brisbane, Australia', bodyHtml), 'connect@culovillage.com')
      if (!result.ok) return false
      await admin.from('founders').update({ data: { ...founder.data, [field]: new Date().toISOString() } }).eq('id', founder.id)
      return true
    }

    const notified: Record<string, string[]> = { needsSetup: [], ready: [], importedNothing: [], publishUntouched: [] }

    // 1. Needs setup, 24h+
    for (const f of founders) {
      if (f.data.onboardingStatus !== 'needs_setup' || f.data.needsSetupNudgeSentAt) continue
      if (stuckFor(f.updated_at) < 24 * HOUR) continue
      const name = f.data.name || 'there'
      if (await sendNudge(f, 'needsSetupNudgeSentAt', { name })) notified.needsSetup.push(`${name} <${f.data.signupEmail}>`)
    }

    // 2. Ready to confirm, 24h+ (the original notify-stuck-onboarding condition)
    for (const f of founders) {
      if (f.data.onboardingStatus !== 'ready' || f.data.readyNudgeSentAt) continue
      if (stuckFor(f.updated_at) < 24 * HOUR) continue
      const name = f.data.name || 'there'
      const bio = f.data.bio?.trim()
      const bioBlock = bio ? `<div style="background:#F8F5F0;border-radius:12px;padding:16px 20px;margin:20px 0;"><p style="font-size:13px;color:#9CA3AF;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">Your bio</p><p style="margin:0;white-space:pre-line;">${bio}</p></div>` : ''
      if (await sendNudge(f, 'readyNudgeSentAt', { name, bioBlock })) notified.ready.push(`${name} <${f.data.signupEmail}>`)
    }

    // 3. Confirmed, 48h+, zero imports
    const confirmedCandidates = founders.filter(f => f.data.onboardingStatus === 'confirmed' && !f.data.importNudgeSentAt && stuckFor(f.updated_at) >= 48 * HOUR)
    if (confirmedCandidates.length > 0) {
      const { data: importRows } = await admin.from('imported_content').select('founder_id').in('founder_id', confirmedCandidates.map(f => f.id))
      const hasImports = new Set((importRows ?? []).map(r => r.founder_id as string))
      for (const f of confirmedCandidates) {
        if (hasImports.has(f.id)) continue
        const name = f.data.name || 'there'
        if (await sendNudge(f, 'importNudgeSentAt', { name })) notified.importedNothing.push(`${name} <${f.data.signupEmail}>`)
      }
    }

    // 4. Has real ready-to-publish drafts, oldest one 72h+ old, zero published, not yet nudged
    const candidateIds = founders.filter(f => !f.data.publishNudgeSentAt).map(f => f.id)
    if (candidateIds.length > 0) {
      const [{ data: draftRows }, { data: storyRows }] = await Promise.all([
        admin.from('imported_content').select('founder_id, data').eq('data->>status', 'draft').in('founder_id', candidateIds),
        admin.from('stories').select('founder_id').in('founder_id', candidateIds).in('data->>status', ['published', 'featured']),
      ])
      const publishedFounders = new Set((storyRows ?? []).map(r => r.founder_id as string))
      const oldestDraftByFounder = new Map<string, number>()
      for (const row of draftRows ?? []) {
        const data = row.data as { title?: string; importedAt?: string }
        const title = data.title?.trim() ?? ''
        if (!title || /^Imported from /i.test(title)) continue // placeholder title, not a real candidate
        const importedAt = data.importedAt ? new Date(data.importedAt).getTime() : now
        const founderId = row.founder_id as string
        const existing = oldestDraftByFounder.get(founderId)
        if (existing === undefined || importedAt < existing) oldestDraftByFounder.set(founderId, importedAt)
      }
      for (const f of founders) {
        if (f.data.publishNudgeSentAt || publishedFounders.has(f.id)) continue
        const oldest = oldestDraftByFounder.get(f.id)
        if (oldest === undefined || now - oldest < 72 * HOUR) continue
        const name = f.data.name || 'there'
        if (await sendNudge(f, 'publishNudgeSentAt', { name })) notified.publishUntouched.push(`${name} <${f.data.signupEmail}>`)
      }
    }

    const total = Object.values(notified).reduce((n, arr) => n + arr.length, 0)
    if (total > 0) {
      const section = (title: string, list: string[]) => list.length > 0 ? `<p><strong>${title}</strong></p><ul>${list.map(n => `<li>${n}</li>`).join('')}</ul>` : ''
      const digestHtml = [
        section('Needs setup (24h+)', notified.needsSetup),
        section('Ready to confirm (24h+)', notified.ready),
        section('Imported nothing (48h+)', notified.importedNothing),
        section('Ready to publish, untouched (72h+)', notified.publishUntouched),
      ].join('')
      await sendEmail(STAFF_DIGEST_EMAIL, `${total} founder${total === 1 ? '' : 's'} nudged today`, emailLayout('Staff digest', digestHtml))
    }

    return new Response(JSON.stringify({ ok: true, notified: total, breakdown: Object.fromEntries(Object.entries(notified).map(([k, v]) => [k, v.length])) }), { headers: { 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    })
  }
})
