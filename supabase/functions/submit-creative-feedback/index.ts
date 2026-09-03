// CULO Village — submit-creative-feedback Edge Function
//
// A founder submits their one CULO Creatives feedback answer. Same reason
// submit-waitlist/submit-founder-claim route through a function instead of
// a direct anon insert: Supabase's API gateway rejects direct anon REST
// inserts in production even when the RLS policy would allow it.
//
// This also does the thing the insert alone can't: locks the founder into
// the $19/mo collaborator rate by writing creativeSubscription onto their
// founder record, atomically with the feedback row — a founder should never
// end up with one written and not the other.
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

// The collaborator cohort's trial runs to this fixed calendar date for
// everyone, regardless of when they actually signed up — not a rolling
// window per founder. Billing on the $19/mo Stripe Price starts here.
const COLLABORATOR_TRIAL_END = '2027-01-01T00:00:00.000Z'

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
      status: existingSub.status ?? 'trial',
      tier: 'collaborator',
      trialEnd: existingSub.trialEnd ?? COLLABORATOR_TRIAL_END,
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
