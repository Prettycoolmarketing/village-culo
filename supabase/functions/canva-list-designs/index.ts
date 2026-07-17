// CULO Village — canva-list-designs Edge Function
//
// Lists a founder's own recent Canva designs so the Import Content page can
// show a picker. Deliberately returns only what the UI needs (id, title,
// thumbnail) — never the raw Canva API response.
//
// Deploy: supabase functions deploy canva-list-designs

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getValidCanvaAccessToken, assertOwnsFounder } from '../_shared/canva.ts'

const SUPABASE_URL          = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY     = Deno.env.get('SUPABASE_ANON_KEY')!
const SUPABASE_SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface CanvaDesignItem {
  id: string
  title?: string
  thumbnail?: { url?: string }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Not signed in.' }), {
      status: 401, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }

  try {
    const { founderId } = await req.json()
    if (!founderId) throw new Error('founderId is required')

    const asCaller = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: authHeader } } })
    await assertOwnsFounder(asCaller, founderId)

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)
    const accessToken = await getValidCanvaAccessToken(admin, founderId)

    const res = await fetch('https://api.canva.com/rest/v1/designs?ownership=owned&sort_by=modified_descending', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const body = await res.json()
    if (!res.ok) throw new Error(body.message ?? 'Could not reach Canva.')

    const items: CanvaDesignItem[] = body.items ?? []
    const designs = items.map(item => ({
      id: item.id,
      title: item.title || 'Untitled design',
      thumbnailUrl: item.thumbnail?.url,
    }))

    return new Response(JSON.stringify({ designs }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
