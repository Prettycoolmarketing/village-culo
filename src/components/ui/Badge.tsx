
type BadgeVariant = 'primary' | 'secondary' | 'accent' | 'cloud' | 'stories' | 'ideas' | 'mercato' | 'map' | 'noticeboard' | 'founders' | 'piazza' | 'neutral'

interface BadgeProps {
  label: string
  variant?: BadgeVariant
  className?: string
}

const variantClasses: Record<BadgeVariant, string> = {
  primary:     'bg-primary/10 text-primary',
  secondary:   'bg-secondary/10 text-secondary',
  accent:      'bg-accent/10 text-[#8a6a1e]',
  cloud:       'bg-cloud/10 text-cloud',
  stories:     'bg-primary/10 text-primary',
  ideas:       'bg-secondary/10 text-secondary',
  mercato:     'bg-accent/10 text-[#8a6a1e]',
  map:         'bg-[#7A9B76]/10 text-[#4e6b4a]',
  noticeboard: 'bg-[#B85C3A]/10 text-[#B85C3A]',
  founders:    'bg-[#A8532E]/10 text-[#A8532E]',
  piazza:      'bg-[#8C6850]/10 text-[#8C6850]',
  neutral:     'bg-border/60 text-muted',
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
