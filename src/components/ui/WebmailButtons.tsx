// Quick "open your inbox" shortcuts shown on Check-your-email screens —
// generic provider inbox links, not tied to the specific address, since
// mail apps don't support deep-linking into someone else's inbox by email.
const PROVIDERS = [
  { label: 'Open Gmail',   url: 'https://mail.google.com/mail/u/0/#inbox' },
  { label: 'Open Outlook', url: 'https://outlook.live.com/mail/0/inbox' },
  { label: 'Open Yahoo',   url: 'https://mail.yahoo.com/' },
]

// `dark` is for a dark/charcoal background (e.g. VillagePage's hero) — the
// default light-bordered/dark-text styling is unreadable there.
export function WebmailButtons({ dark = false }: { dark?: boolean } = {}) {
  return (
    <div className="flex flex-col gap-2 mb-5">
      {PROVIDERS.map(p => (
        <a
          key={p.label}
          href={p.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`block w-full py-2.5 border text-sm font-medium rounded-lg transition-colors text-center ${
            dark
              ? 'border-white/20 text-white/80 hover:border-primary/60 hover:text-white'
              : 'border-[#E8E4DD] text-[#2D2A26] hover:border-[#C86A43]/40 hover:text-[#C86A43]'
          }`}
        >
          {p.label}
        </a>
      ))}
    </div>
  )
}
