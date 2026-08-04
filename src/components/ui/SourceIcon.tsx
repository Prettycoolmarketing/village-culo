// Small brand-colour icon shown beside each connector/platform's name —
// purely visual, no new source types implied. Inline SVGs, not external
// image requests, so the page never depends on a logo asset that might 404.
export type SourcePlatform = 'youtube' | 'instagram' | 'canva' | 'website' | 'podcast' | 'vimeo' | 'linkedin' | 'tiktok' | string

export function SourceIcon({ platform, size = 'md' }: { platform: SourcePlatform; size?: 'sm' | 'md' | 'lg' }) {
  const box = size === 'lg' ? 'w-11 h-11 rounded-xl' : size === 'sm' ? 'w-7 h-7 rounded-lg' : 'w-9 h-9 rounded-xl'
  const icon = size === 'lg' ? 'w-5 h-5' : size === 'sm' ? 'w-3.5 h-3.5' : 'w-4.5 h-4.5'
  const common = `${box} flex items-center justify-center shrink-0`

  if (platform === 'youtube') {
    return (
      <div className={`${common} bg-[#FF0000]`}>
        <svg className={`${icon} text-white`} viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
      </div>
    )
  }
  if (platform === 'instagram') {
    return (
      <div className={common} style={{ background: 'linear-gradient(135deg, #f9ce34, #ee2a7b, #6228d7)' }}>
        <svg className={`${icon} text-white`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
        </svg>
      </div>
    )
  }
  if (platform === 'canva') {
    return (
      <div className={common} style={{ background: 'linear-gradient(135deg, #00c4cc, #7d2ae8)' }}>
        <svg className={`${icon} text-white`} viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth={2} /><ellipse cx="12" cy="13" rx="5" ry="3.2" /></svg>
      </div>
    )
  }
  if (platform === 'website') {
    return (
      <div className={`${common} bg-[#2D2A26]`}>
        <svg className={`${icon} text-white`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
          <circle cx="12" cy="12" r="9" /><path strokeLinecap="round" d="M3 12h18M12 3c2.5 2.7 3.8 6 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-6-3.8-9s1.3-6.3 3.8-9z" />
        </svg>
      </div>
    )
  }
  if (platform === 'podcast') {
    return (
      <div className={`${common} bg-[#8B5CF6]`}>
        <svg className={`${icon} text-white`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
          <rect x="9" y="3" width="6" height="11" rx="3" /><path strokeLinecap="round" d="M5 11a7 7 0 0014 0M12 18v3" />
        </svg>
      </div>
    )
  }
  if (platform === 'vimeo') {
    return (
      <div className={`${common} bg-[#1AB7EA]`}>
        <svg className={`${icon} text-white`} viewBox="0 0 24 24" fill="currentColor"><path d="M22 7.4c-.1 2-1.5 4.7-4.2 8.1-2.8 3.5-5.1 5.3-7.1 5.3-1.2 0-2.2-1.1-3.1-3.4L6 12.2C5.3 9.9 4.6 8.7 3.8 8.7c-.2 0-.7.3-1.6 1L1.5 8.9c1-.9 2-1.8 2.9-2.7C5.7 4.9 6.7 4.2 7.4 4.1c1.6-.2 2.6.9 3 3.3.4 2.6.7 4.3.9 4.9.5 2.2 1 3.3 1.6 3.3.5 0 1.1-.7 2-2.2.9-1.4 1.3-2.5 1.4-3.3.1-1.2-.4-1.9-1.6-1.9-.5 0-1.1.1-1.7.4 1.1-3.7 3.3-5.5 6.4-5.4 2.3 0 3.4 1.6 3.1 4.2z" /></svg>
      </div>
    )
  }
  if (platform === 'linkedin') {
    return (
      <div className={`${common} bg-[#0A66C2]`}>
        <svg className={`${icon} text-white`} viewBox="0 0 24 24" fill="currentColor"><path d="M6.94 5a2 2 0 11-4-.002 2 2 0 014 .002zM7 8.48H3V21h4V8.48zm6.32 0H9.34V21h3.94v-6.57c0-3.66 4.77-3.96 4.77 0V21H22v-7.93c0-6.17-7.06-5.94-8.68-2.91V8.48z" /></svg>
      </div>
    )
  }
  if (platform === 'tiktok') {
    return (
      <div className={`${common} bg-[#000000]`}>
        <svg className={`${icon} text-white`} viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 3c.3 2 1.7 3.6 3.8 3.9v2.7a6.6 6.6 0 01-3.8-1.2v6.8a5.3 5.3 0 11-5.3-5.3c.2 0 .5 0 .7.1v2.8a2.6 2.6 0 102.6 2.6V3h2z" /></svg>
      </div>
    )
  }
  return (
    <div className={`${common} bg-[#F3EDE6]`}>
      <svg className={`${icon} text-[#9CA3AF]`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M4 6h16M4 6a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V8a2 2 0 00-2-2H4z" />
      </svg>
    </div>
  )
}
