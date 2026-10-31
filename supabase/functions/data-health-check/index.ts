// CULO Village — data-health-check Edge Function
//
// Runs weekly, catches the same classes of problem a manual audit found
// on 2026-10-31 (orphaned profiles.founder_id, dangling founderId/
// businessId references, published content with no real body, duplicate
// slugs) automatically, instead of waiting for someone to notice or run
// another one-off audit. Read-only — reports, never fixes, since some of
// these (e.g. a dangling founderId on a real draft business) need a human
// judgment call about what the right fix actually is, not an automated
// guess.
//
// Each check is independent; one failing doesn't stop the others from
// running or reporting. Only sends an email when there's actually
// something to report — a clean week means silence, not a "nothing found"
// email nobody needs to read.
//
// Deploy: supabase functions deploy data-health-check --no-verify-jwt
// Schedule: see supabase/migrations for the cron.schedule call (same
// pattern as send-nudges-daily) — run once manually in the Supabase
// dashboard SQL Editor, cron.schedule() needs more privilege than a
// normal migration run has.

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendEmail, emailLayout } from '../_shared/resend.ts'

const SUPABASE_URL          = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const STAFF_DIGEST_EMAIL = 'support@prettycoolmarketing.com'

interface Finding { label: string; count: number; examples: string[] }

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok')

  try {
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)
    const findings: Finding[] = []

    // 1. profiles.founder_id pointing at a founder row that doesn't exist
    // — the exact Greta Chesterman bug class (broken signup, invisible in
    // Culo Members, "needs setup" never resolving).
    {
      const { data } = await admin.from('profiles').select('id, email, founder_id').not('founder_id', 'is', null)
      const rows = data ?? []
      const { data: founderRows } = await admin.from('founders').select('id')
      const founderIds = new Set((founderRows ?? []).map(f => f.id as string))
      const orphans = rows.filter(r => !founderIds.has(r.founder_id as string))
      if (orphans.length > 0) {
        findings.push({ label: 'profiles.founder_id pointing at a founder row that no longer exists (broken signup/login)', count: orphans.length, examples: orphans.slice(0, 5).map(o => `${o.email} → ${o.founder_id}`) })
      }
    }

    // 2. businesses.founderId / stories.founderId / imported_content.founder_id
    // pointing at a founder row that doesn't exist.
    {
      const { data: founderRows } = await admin.from('founders').select('id')
      const founderIds = new Set((founderRows ?? []).map(f => f.id as string))

      const { data: biz } = await admin.from('businesses').select('id, data').not('data->>founderId', 'is', null).neq('data->>founderId', '')
      const bizOrphans = (biz ?? []).filter(b => !founderIds.has((b.data as { founderId?: string }).founderId as string))
      if (bizOrphans.length > 0) {
        findings.push({ label: 'businesses with a founderId pointing at a founder row that doesn\'t exist', count: bizOrphans.length, examples: bizOrphans.slice(0, 5).map(b => `${(b.data as { name?: string }).name ?? b.id}`) })
      }

      const { data: stories } = await admin.from('stories').select('id, data').not('data->>founderId', 'is', null).neq('data->>founderId', '')
      const storyOrphans = (stories ?? []).filter(s => !founderIds.has((s.data as { founderId?: string }).founderId as string))
      if (storyOrphans.length > 0) {
        findings.push({ label: 'stories with a founderId pointing at a founder row that doesn\'t exist', count: storyOrphans.length, examples: storyOrphans.slice(0, 5).map(s => `${(s.data as { title?: string }).title ?? s.id}`) })
      }
    }

    // 3. Published content with a suspiciously empty body — the Sarah
    // Dunning bug class (live, public, blank page).
    {
      const { data: stories } = await admin.from('stories').select('id, data').in('status', ['published', 'featured'])
      const emptyStories = (stories ?? []).filter(s => {
        const d = s.data as { blog?: string }
        return !d.blog || d.blog.trim().length < 20
      })
      if (emptyStories.length > 0) {
        findings.push({ label: 'published stories with little or no real body text (looks blank/broken live)', count: emptyStories.length, examples: emptyStories.slice(0, 5).map(s => `${(s.data as { title?: string }).title ?? s.id}`) })
      }

      const { data: founders } = await admin.from('founders').select('id, data').in('status', ['published', 'featured'])
      const emptyFounders = (founders ?? []).filter(f => {
        const d = f.data as { bio?: string }
        return !d.bio || d.bio.trim().length < 20
      })
      if (emptyFounders.length > 0) {
        findings.push({ label: 'published founder profiles with little or no real bio (looks blank/broken live)', count: emptyFounders.length, examples: emptyFounders.slice(0, 5).map(f => `${(f.data as { name?: string }).name ?? f.id}`) })
      }
    }

    // 4. Duplicate slugs — founders and businesses both expect a unique
    // public URL; a collision means one of the two is unreachable.
    {
      for (const table of ['founders', 'businesses'] as const) {
        const { data } = await admin.from(table).select('id, slug').not('slug', 'is', null)
        const seen = new Map<string, number>()
        for (const row of data ?? []) {
          const slug = row.slug as string
          seen.set(slug, (seen.get(slug) ?? 0) + 1)
        }
        const dupes = [...seen.entries()].filter(([, n]) => n > 1)
        if (dupes.length > 0) {
          findings.push({ label: `duplicate ${table}.slug values (one of each pair is unreachable at its own URL)`, count: dupes.length, examples: dupes.slice(0, 5).map(([slug, n]) => `${slug} (${n}×)`) })
        }
      }
    }

    if (findings.length === 0) {
      return new Response(JSON.stringify({ ok: true, findings: 0 }), { headers: { 'Content-Type': 'application/json' } })
    }

    const sections = findings
      .map(f => `<p><strong>${f.label}</strong> — ${f.count}</p><ul>${f.examples.map(e => `<li>${e}</li>`).join('')}</ul>`)
      .join('')
    await sendEmail(
      STAFF_DIGEST_EMAIL,
      `Weekly data health check: ${findings.length} issue type(s) found`,
      emailLayout('Data health check', `<p>Found this week — none of these auto-fix themselves, each needs a quick look:</p>${sections}`),
    )

    return new Response(JSON.stringify({ ok: true, findings: findings.length }), { headers: { 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
  }
})
