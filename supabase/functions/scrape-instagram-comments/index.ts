// MVP1 of the Lead Sources tool (Founder Management → Lead Sources,
// admin-only — see CAPO_PERMISSIONS.leadSources): paste one public
// Instagram Reel/post URL, get back the accessible public commenters.
// Deliberately minimal — no Australia filtering, no AI scoring, no profile
// enrichment, no queue. Just: does this provider actually return real,
// usable commenter data for our real test URLs? Everything past that is a
// later decision, not built yet.
//
// Provider is isolated behind this one function so it can be swapped
// without touching the frontend — now the official `apify/instagram-scraper`
// actor (~$2.30/1,000 comments), switched from the cheaper apidojo one
// after real testing showed every URL capping at ~10 comments regardless
// of maxItems requested. That cap turned out to be the Apify ACCOUNT'S
// Free plan (one page of comments per post, ~15), not the actor — so this
// switch alone won't lift it; a paid Apify plan (Starter, $29/mo) is what
// actually removes the per-post page cap. Still switching because this is
// Apify's own first-party actor with a documented, more reliable output
// shape. See CULO_Scrape_Founder_Qualification_Technical_Spec.md section
// 23/25 for the adapter reasoning.
//
// Deploy: supabase functions deploy scrape-instagram-comments --no-verify-jwt

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const APIFY_ACTOR_ID = 'apify~instagram-scraper'

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
  text?: string
  timestamp?: string
  likesCount?: number
  ownerUsername?: string
  owner?: {
    username?: string
    full_name?: string | null
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
      `https://api.apify.com/v2/acts/${APIFY_ACTOR_ID}/run-sync-get-dataset-items?token=${apiKey}&timeout=180`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ resultsType: 'comments', directUrls: [sourceUrl], resultsLimit: maxItems }),
      },
    )

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Apify request failed (${res.status}): ${errText.slice(0, 500)}`)
    }

    const items = await res.json() as ApifyCommentItem[]
    const comments: LeadComment[] = items
      .filter(item => (item.ownerUsername || item.owner?.username))
      .map(item => {
        const username = (item.ownerUsername || item.owner!.username)!
        return {
          displayName: item.owner?.full_name?.trim() || username,
          handle: username,
          profileUrl: `https://www.instagram.com/${username}/`,
          commentText: item.text ?? '',
          sourceUrl,
          likeCount: item.likesCount,
          createdAt: item.timestamp,
        }
      })

    return new Response(JSON.stringify({ comments, totalFromProvider: items.length }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
