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

export async function sendEmail(to: string, subject: string, html: string): Promise<{ ok: boolean; error?: string }> {
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
    body: JSON.stringify({ from, to, subject, html }),
  })

  if (!res.ok) {
    const body = await res.text()
    console.error('Resend send failed', res.status, body)
    return { ok: false, error: `Resend error ${res.status}` }
  }

  return { ok: true }
}

// Shared visual wrapper — plain, readable, matches the warm/terracotta brand
// without depending on any images (inbox-safe).
export function emailLayout(preheader: string, bodyHtml: string): string {
  return `
  <div style="font-family:Georgia,'Times New Roman',serif;background:#F8F5F0;padding:32px 16px;">
    <div style="max-width:480px;margin:0 auto;background:#FFFFFF;border-radius:16px;overflow:hidden;border:1px solid #E8E4DD;">
      <div style="background:#2D2A26;padding:20px 28px;">
        <span style="color:#F9E4C0;font-size:14px;letter-spacing:3px;">CULO VILLAGE</span>
      </div>
      <div style="padding:28px;color:#2D2A26;font-size:15px;line-height:1.6;">
        ${bodyHtml}
      </div>
    </div>
    <p style="max-width:480px;margin:16px auto 0;color:#9CA3AF;font-size:11px;text-align:center;font-family:Arial,sans-serif;">${preheader}</p>
  </div>`
}

export function emailButton(label: string, url: string): string {
  return `<a href="${url}" style="display:inline-block;margin-top:16px;padding:12px 22px;background:#C86A43;color:#FFFFFF;text-decoration:none;border-radius:10px;font-weight:bold;font-family:Arial,sans-serif;font-size:14px;">${label}</a>`
}
