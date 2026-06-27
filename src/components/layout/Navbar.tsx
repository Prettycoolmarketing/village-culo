import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'

const navLinks = [
  { to: '/',            label: 'Village',     exact: true  },
  { to: '/piazza',      label: 'Piazza',      exact: false },
  { to: '/founders',    label: 'Founders',    exact: false },
  { to: '/stories',     label: 'Stories',     exact: false },
  { to: '/ideas',       label: 'Ideas',       exact: false },
  { to: '/mercato',     label: 'Mercato',     exact: false },
  { to: '/map',         label: 'Map',         exact: false },
  { to: '/noticeboard', label: 'Noticeboard', exact: false },
  { to: '/archive',     label: 'Archive',     exact: false },
]

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 bg-surface/96 backdrop-blur-md border-b border-border/60 shadow-sm"
      role="banner"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2.5 flex-shrink-0 group"
            aria-label="CULO Village — Home"
          >
            <div className="flex flex-col leading-none">
              <span className="font-heading text-2xl font-bold text-primary tracking-tight">
                CULO
              </span>
              <span className="font-heading text-[10px] italic text-muted/60 tracking-widest -mt-0.5 hidden sm:block">
                village
              </span>
            </div>
          </Link>

          {/* Desktop navigation */}
          <nav className="hidden lg:flex items-center gap-0.5" aria-label="Main navigation">
            {navLinks.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.exact}
                className={({ isActive }) => [
                  'relative px-3 py-2 rounded-lg text-sm font-medium font-body transition-all duration-150',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-cloud focus-visible:ring-offset-1',
                  isActive
                    ? 'text-cloud font-semibold'
                    : 'text-charcoal/65 hover:text-charcoal hover:bg-charcoal/4',
                ].join(' ')}
              >
                {({ isActive }) => (
                  <>
                    {link.label}
                    {isActive && (
                      <span
                        className="absolute bottom-0 left-2 right-2 h-0.5 bg-cloud rounded-full"
                        aria-hidden="true"
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Desktop actions */}
          <div className="hidden lg:flex items-center gap-2">
            <Link
              to="/piazza"
              className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-[#b05a35] active:bg-[#9a4d2d] transition-colors duration-150 shadow-sm"
            >
              Publish a Story
            </Link>
            {/* Profile placeholder */}
            <button
              className="p-2 rounded-lg text-muted hover:text-charcoal hover:bg-charcoal/5 transition-colors duration-150"
              aria-label="Account"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </button>
          </div>

          {/* Mobile menu toggle */}
          <button
            className="lg:hidden p-2 rounded-lg text-charcoal/70 hover:text-charcoal hover:bg-charcoal/5 transition-colors duration-150"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            aria-label="Toggle navigation menu"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
              {mobileOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              }
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <nav
          id="mobile-menu"
          className="lg:hidden border-t border-border/60 bg-surface/98 backdrop-blur-md"
          aria-label="Mobile navigation"
        >
          <div className="px-4 py-3 space-y-0.5">
            {navLinks.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.exact}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) => [
                  'block px-3 py-2.5 rounded-xl text-sm font-medium font-body transition-colors duration-150',
                  isActive
                    ? 'text-cloud bg-cloud/8 font-semibold'
                    : 'text-charcoal/70 hover:text-charcoal hover:bg-charcoal/4',
                ].join(' ')}
              >
                {link.label}
              </NavLink>
            ))}
            <div className="pt-3 border-t border-border/60 mt-2">
              <Link
                to="/piazza"
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl text-center hover:bg-[#b05a35] transition-colors duration-150 shadow-sm"
              >
                Publish a Story
              </Link>
            </div>
          </div>
        </nav>
      )}
    </header>
  )
}
