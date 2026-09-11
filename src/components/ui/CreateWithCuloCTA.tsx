interface Props {
  variant?: 'banner' | 'button' | 'inline'
  label?: string
}

// Every "Create/Continue with CULO in Canva" button across the app points
// here — one link to update, not a dozen. Currently the Join the Village
// page, where visitors enter their email; swap for the real Canva app link
// once CULO in Canva ships.
const CULO_CANVA_URL = 'https://www.culovillage.com/join'

export function CreateWithCuloCTA({ variant = 'button', label }: Props) {
  const href = CULO_CANVA_URL

  if (variant === 'banner') {
    return (
      <div className="bg-[#2D2A26] rounded-2xl px-6 py-5 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="font-heading text-base font-semibold text-white leading-snug">
              {label ?? 'Turn your experience into content'}
            </p>
            <p className="font-body text-sm text-white/60 mt-0.5">
              CULO Creatives helps founders edit content into different formats, exclusively in Canva.
            </p>
          </div>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 bg-[#C86A43] text-white text-sm font-semibold rounded-xl hover:bg-[#b05a35] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Create with CULO in Canva
          </a>
        </div>
        {/* Canva approval is still pending, but "Create with CULO in Canva"
            above already leads to the real Village signup — this used to
            be a separate bare email-capture waitlist for something that
            doesn't exist yet. "Locked in" is a specific, real claim that
            only becomes true once billing is actually set up on the
            founding rate inside the dashboard (DashboardCreativesPage) —
            starting here just gets a founder in line for that. */}
        <p className="font-body text-xs text-white/50 border-t border-white/10 pt-4">
          Start above and we'll notify you — with the chance to lock in the founding rate — the moment
          Culo Creatives is live.
        </p>
      </div>
    )
  }

  if (variant === 'inline') {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 font-body text-sm font-semibold text-primary hover:text-[#b05a35] transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        {label ?? 'Create with CULO in Canva'}
      </a>
    )
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 px-4 py-2 bg-[#2D2A26] text-white text-sm font-semibold rounded-xl hover:bg-[#1a1815] transition-colors"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
      {label ?? 'Create with CULO in Canva'}
    </a>
  )
}
