// Quick "open your inbox" shortcuts shown on Check-your-email screens —
// generic provider inbox links, not tied to the specific address, since
// mail apps don't support deep-linking into someone else's inbox by email.
const PROVIDERS = [
  { label: 'Open Gmail',   url: 'https://mail.google.com/mail/u/0/#inbox' },
  { label: 'Open Outlook', url: 'https://outlook.live.com/mail/0/inbox' },
  { label: 'Open Yahoo',   url: 'https://mail.yahoo.com/' },
]

export function WebmailButtons() {
  return (
    <div className="flex flex-col gap-2 mb-5">
      {PROVIDERS.map(p => (
        <a
          key={p.label}
          href={p.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full py-2.5 border border-[#E8E4DD] text-[#2D2A26] text-sm font-medium rounded-lg hover:border-[#C86A43]/40 hover:text-[#C86A43] transition-colors text-center"
        >
          {p.label}
        </a>
      ))}
    </div>
  )
}
