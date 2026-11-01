// A real, live founder page shown in a scaled-down browser-chrome frame —
// "show, don't tell" for what The Culo Village actually is. Was copy-pasted
// identically in VillagePage.tsx's hero and JoinVillagePage.tsx's "What is
// The Culo Village" section; extracted here rather than pasting a third
// copy into JoinVillagePage's own hero.
interface LiveFounderPagePreviewProps {
  slug?: string
  // No default display/rounding/border/shadow baked in here — callers
  // want different values (hidden lg:block vs block, rounded-2xl vs
  // rounded-3xl, border-border vs border-white/10, shadow-lg vs
  // shadow-xl) and Tailwind utility classes don't reliably override by
  // prop-append order (equal-specificity classes, last-in-stylesheet
  // wins, not last-in-DOM) — every caller supplies its own full set.
  className?: string
}

export function LiveFounderPagePreview({ slug = 'shakas-designer', className = '' }: LiveFounderPagePreviewProps) {
  const url = `https://www.culovillage.com/founders/${slug}`
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`overflow-hidden bg-white transition-shadow ${className}`}
      aria-label="See an example CULO Village founder page (opens in a new tab)"
    >
      <div className="flex items-center gap-1.5 px-4 py-2.5 bg-[#F3EDE6] border-b border-border">
        <span className="w-2.5 h-2.5 rounded-full bg-red-300" />
        <span className="w-2.5 h-2.5 rounded-full bg-amber-300" />
        <span className="w-2.5 h-2.5 rounded-full bg-green-300" />
        <span className="ml-3 text-[10px] text-muted truncate font-body">{url.replace('https://', '')}</span>
      </div>
      <div className="relative overflow-hidden" style={{ aspectRatio: '4 / 3' }}>
        <iframe
          src={url}
          title="Example CULO Village founder page"
          className="absolute top-0 left-0 border-0 pointer-events-none"
          style={{ width: '250%', height: '250%', transform: 'scale(0.4)', transformOrigin: 'top left' }}
          loading="lazy"
          tabIndex={-1}
        />
      </div>
    </a>
  )
}
