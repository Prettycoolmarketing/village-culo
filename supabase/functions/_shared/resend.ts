// Thin wrapper over Resend's REST API — the only email-sending path in this
// codebase. Every transactional email (claim received/approved/rejected,
// staff invite) goes through sendEmail() so there is exactly one place that
// knows the API key and the "from" address.
//
// Requires two Supabase secrets to actually send anything:
//   RESEND_API_KEY  — from resend.com's dashboard
//   EMAIL_FROM      — a verified sender, e.g. "CULO Village <hello@culovillage.com>"
// Silently no-ops (logs a warning, returns ok:false) when either is missing,
// so a claim/invite flow never fails just because email isn't configured yet.
//
// replyTo is optional — EMAIL_FROM is a noreply address (no monitored inbox
// behind it), so anything a recipient might reasonably reply to (campaigns,
// nurture sequences) should pass a real monitored address here instead of
// leaving replies to bounce.

export async function sendEmail(to: string, subject: string, html: string, replyTo?: string): Promise<{ ok: boolean; error?: string }> {
  const apiKey = Deno.env.get('RESEND_API_KEY')
  const from = Deno.env.get('EMAIL_FROM')

  if (!apiKey || !from) {
    console.warn('sendEmail skipped — RESEND_API_KEY or EMAIL_FROM not set')
    return { ok: false, error: 'Email not configured' }
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to, subject, html, ...(replyTo ? { reply_to: replyTo } : {}) }),
  })

  if (!res.ok) {
    const body = await res.text()
    console.error('Resend send failed', res.status, body)
    return { ok: false, error: `Resend error ${res.status}` }
  }

  return { ok: true }
}

// Shared visual wrapper matching the warm/terracotta brand. unsubscribeUrl
// is optional and only meant for real bulk mail (newsletters) — a
// transactional email (claim approved, staff invite) has no business
// offering to unsubscribe someone from it, so callers that don't pass it
// get the layout unchanged, with no footer image either (that's a
// newsletter-branding touch, not something a receipt-style email needs).
const FOOTER_IMAGE_URL = 'https://www.culovillage.com/creatives/culo-media-2.png'

export function emailLayout(preheader: string, bodyHtml: string, unsubscribeUrl?: string): string {
  return `
  <div style="font-family:Georgia,'Times New Roman',serif;background:#F8F5F0;padding:32px 16px;">
    <div style="max-width:480px;margin:0 auto;background:#FFFFFF;border-radius:16px;overflow:hidden;border:1px solid #E8E4DD;">
      <div style="background:#2D2A26;padding:18px 28px;text-align:center;">
        <span style="color:#F9E4C0;font-size:12px;letter-spacing:1.5px;">THE CULO VILLAGE &times; CULO CREATIVES IN CANVA</span>
      </div>
      <div style="padding:28px;color:#2D2A26;font-size:15px;line-height:1.6;">
        ${bodyHtml}
      </div>
      ${unsubscribeUrl ? `
      <a href="https://www.culovillage.com" style="display:block;line-height:0;">
        <img src="${FOOTER_IMAGE_URL}" alt="The Culo Village" width="480" style="width:100%;height:auto;display:block;" />
      </a>
      <div style="padding:24px 28px;border-top:1px solid #E8E4DD;font-family:Arial,sans-serif;">
        <p style="margin:0 0 4px;font-weight:bold;font-size:13px;color:#2D2A26;">The Culo Village</p>
        <p style="margin:0 0 16px;font-size:12px;line-height:1.6;color:#6B7280;">A joint publishing house for founders. We restructure your previously posted content from across platforms and republish each piece as its own webpage, structured for AI and search to actually find you.</p>
        <p style="margin:0 0 4px;font-weight:bold;font-size:13px;color:#2D2A26;">Culo Creatives in Canva</p>
        <p style="margin:0;font-size:12px;line-height:1.6;color:#6B7280;">A design platform, exclusively in Canva, that helps founders turn messy thoughts and raw footage into finished blogs, carousels and reels — in your own brand, ready to publish.</p>
      </div>` : ''}
    </div>
    <p style="max-width:480px;margin:16px auto 0;color:#9CA3AF;font-size:11px;text-align:center;font-family:Arial,sans-serif;">${preheader}</p>
    ${unsubscribeUrl ? `<p style="max-width:480px;margin:8px auto 0;text-align:center;font-family:Arial,sans-serif;"><a href="${unsubscribeUrl}" style="color:#9CA3AF;font-size:11px;">Unsubscribe</a></p>` : ''}
  </div>`
}

export function emailButton(label: string, url: string): string {
  return `<a href="${url}" style="display:inline-block;margin-top:16px;padding:12px 22px;background:#C86A43;color:#FFFFFF;text-decoration:none;border-radius:10px;font-weight:bold;font-family:Arial,sans-serif;font-size:14px;">${label}</a>`
}
