// CULO Village — submit-creative-feedback Edge Function
//
// A founder submits their one CULO Creatives feedback answer. Same reason
// submit-waitlist/submit-founder-claim route through a function instead of
// a direct anon insert: Supabase's API gateway rejects direct anon REST
// inserts in production even when the RLS policy would allow it.
//
// Used to also lock the founder into the $19/mo collaborator rate as a
// side effect of giving feedback — that was a pre-launch pre-order
// mechanic that predates the pricing unification (every new signup now
// gets the same Standard $25/mo, 14-day-trial tier regardless of source;
// the legacy $19/mo deal is only for founders who already had it, plus a
// hand-keyed FOUNDER19 coupon for the curated waitlist). Left in, this
// would have let anyone get the legacy rate for free just by answering one
// question — removed. This just records the feedback now.
//
// Deploy: supabase functions deploy submit-creative-feedback --no-verify-jwt

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL          = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface FeedbackBody {
  founderId: string
  answer: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })

  try {
    const body = await req.json() as FeedbackBody
    const founderId = body.founderId?.trim()
    const answer = body.answer?.trim()
    if (!founderId) throw new Error('founderId is required')
    if (!answer) throw new Error('An answer is required')

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)

    const { data: founderRow, error: founderErr } = await admin
      .from('founders').select('data').eq('id', founderId).single()
    if (founderErr || !founderRow) throw new Error('Founder not found')

    const founderData = founderRow.data as Record<string, unknown>
    const existingSub = (founderData.creativeSubscription ?? {}) as Record<string, unknown>
    if (existingSub.feedbackSubmittedAt) {
      throw new Error('Feedback has already been submitted for this account')
    }

    const nowIso = new Date().toISOString()
    const entry = {
      id: crypto.randomUUID(),
      founderId,
      answer,
      createdAt: nowIso,
    }

    const { error: insertError } = await admin.from('creative_feedback').insert({
      id: entry.id,
      founder_id: founderId,
      data: entry,
    })
    if (insertError) throw new Error(insertError.message)

    const updatedSubscription = {
      ...existingSub,
      feedbackSubmittedAt: nowIso,
    }
    const { error: updateError } = await admin.from('founders')
      .update({ data: { ...founderData, creativeSubscription: updatedSubscription } })
      .eq('id', founderId)
    if (updateError) throw new Error(updateError.message)

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
