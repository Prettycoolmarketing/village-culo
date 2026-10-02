// MVP1 of the Lead Sources tool (Founder Management → Lead Sources,
// admin-only — see CAPO_PERMISSIONS.leadSources): paste one public
// Instagram Reel/post URL, get back the accessible public commenters.
// Deliberately minimal — no Australia filtering, no AI scoring, no profile
// enrichment, no queue. Just: does this provider actually return real,
// usable commenter data for our real test URLs? Everything past that is a
// later decision, not built yet.
//
// Provider is isolated behind this one function so it can be swapped
// without touching the frontend — today it's the apidojo Instagram
// Comments Scraper actor on Apify (pay-per-result, ~$0.50/1,000 comments),
// chosen for price and a documented input/output shape, not because it's
// the only option. See CULO_Scrape_Founder_Qualification_Technical_Spec.md
// section 23/25 for the adapter reasoning.
//
// Deploy: supabase functions deploy scrape-instagram-comments --no-verify-jwt

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const APIFY_ACTOR_ID = 'apidojo~instagram-comments-scraper'

interface RequestBody {
  url: string
  maxItems?: number
}

export interface LeadComment {
  displayName: string
  handle: string
  profileUrl: string
  commentText: string
  sourceUrl: string
  likeCount?: number
  createdAt?: string
}

// Instagram/Facebook share links carry tracking params (?stkn=, ?mibextid=)
// that mean nothing to the provider and nothing to us — stripped before the
// provider call and before using the URL as sourceUrl, same normalization
// the spec calls for (section 40), just inline rather than a separate step
// since there's only one provider call in this MVP.
function normalizeUrl(raw: string): string {
  try {
    const u = new URL(raw.trim())
    u.search = ''
    return u.toString()
  } catch {
    return raw.trim()
  }
}

interface ApifyCommentItem {
  message?: string
  createdAt?: string
  likeCount?: number
  user?: {
    username?: string
    fullName?: string
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })

  try {
    const body = await req.json() as RequestBody
    const sourceUrl = normalizeUrl(body?.url ?? '')
    if (!sourceUrl || !/instagram\.com/i.test(sourceUrl)) {
      throw new Error('Paste a public Instagram post or Reel URL.')
    }

    const apiKey = Deno.env.get('APIFY_API_KEY')
    if (!apiKey) throw new Error('Lead Sources is not configured yet — missing Apify API key.')

    const maxItems = body?.maxItems && body.maxItems > 0 ? Math.min(body.maxItems, 1000) : 200

    const res = await fetch(
      `https://api.apify.com/v2/acts/${APIFY_ACTOR_ID}/run-sync-get-dataset-items?token=${apiKey}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ startUrls: [sourceUrl], maxItems }),
      },
    )

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Apify request failed (${res.status}): ${errText.slice(0, 500)}`)
    }

    const items = await res.json() as ApifyCommentItem[]
    const comments: LeadComment[] = items
      .filter(item => item.user?.username)
      .map(item => ({
        displayName: item.user?.fullName?.trim() || item.user!.username!,
        handle: item.user!.username!,
        profileUrl: `https://www.instagram.com/${item.user!.username}/`,
        commentText: item.message ?? '',
        sourceUrl,
        likeCount: item.likeCount,
        createdAt: item.createdAt,
      }))

    return new Response(JSON.stringify({ comments, totalFromProvider: items.length }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
