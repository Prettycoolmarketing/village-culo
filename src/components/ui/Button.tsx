import React from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'accent'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  href?: string
  children: React.ReactNode
  className?: string
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:   'bg-primary text-white hover:bg-[#b05a35] shadow-sm',
  secondary: 'bg-secondary text-white hover:bg-[#4e5a3c] shadow-sm',
  accent:    'bg-accent text-charcoal hover:bg-[#c4963e] shadow-sm',
  outline:   'border-2 border-primary text-primary hover:bg-primary hover:text-white',
  ghost:     'text-charcoal hover:bg-border',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-5 py-2.5 text-sm rounded-xl',
  lg: 'px-7 py-3.5 text-base rounded-xl',
}

export function Button({ variant = 'primary', size = 'md', href, children, className = '', ...props }: ButtonProps) {
  const classes = `
    inline-flex items-center justify-center gap-2
    font-body font-medium
    transition-all duration-150
    focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${className}
  `

  if (href) {
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    )
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  )
}
