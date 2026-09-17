
type BadgeVariant = 'primary' | 'secondary' | 'accent' | 'stories' | 'ideas' | 'mercato' | 'map' | 'noticeboard' | 'founders' | 'piazza' | 'neutral'

interface BadgeProps {
  label: string
  variant?: BadgeVariant
  className?: string
}

const variantClasses: Record<BadgeVariant, string> = {
  primary:     'bg-primary/10 text-primary',
  // "secondary" is used sitewide specifically for Topic badges (cards,
  // detail pages, widgets) — recoloured from green to the same light blue
  // used elsewhere for informational tags, rather than the secondary brand
  // green, which reads as more of a "success/active" colour than a plain tag.
  secondary:   'bg-[#EBF2F8] text-[#3E6E92]',
  accent:      'bg-accent/10 text-accent',
  stories:     'bg-primary/10 text-primary',
  // Recoloured from green to the same light blue as "secondary" — an Idea
  // tag is informational like a Topic tag, not a "success/active" state.
  ideas:       'bg-[#EBF2F8] text-[#3E6E92]',
  mercato:     'bg-primary/10 text-primary',
  map:         'bg-[#7A9B76]/10 text-[#4e6b4a]',
  noticeboard: 'bg-[#B85C3A]/10 text-[#B85C3A]',
  founders:    'bg-[#A8532E]/10 text-[#A8532E]',
  piazza:      'bg-[#8C6850]/10 text-[#8C6850]',
  neutral:     'bg-border text-muted',
}

export function Badge({ label, variant = 'neutral', className = '' }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-0.5 rounded-full
        text-xs font-medium font-body tracking-wide
        ${variantClasses[variant]}
        ${className}
      `}
    >
      {label}
    </span>
  )
}
