import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const navLinks = [
  { to: '/',           label: 'Village',    exact: true  },
  { to: '/piazza',     label: 'Piazza',     exact: false },
  { to: '/founders',   label: 'Founders',   exact: false },
  { to: '/stories',    label: 'Stories',    exact: false },
  { to: '/ideas',      label: 'Ideas',      exact: false },
  { to: '/mercato',    label: 'Mercato',    exact: false },
  { to: '/map',        label: 'Map',        exact: false },
  { to: '/noticeboard',label: 'Noticeboard',exact: false },
  { to: '/archive',    label: 'Archive',    exact: false },
  { to: '/expertise',  label: 'Expertise',  exact: false },
  { to: '/library',    label: 'Library',    exact: false },
]

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, loading } = useAuth()

  const publishTo = user ? '/dashboard/publish' : '/piazza'

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface/95 backdrop-blur-sm border-b border-border shadow-sm" role="banner">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 flex-shrink-0"
            aria-label="CULO Village — Home"
          >
            <span
              className="font-heading text-2xl font-bold text-primary tracking-tight"
              aria-hidden="true"
            >
              CULO
            </span>
            <span className="hidden sm:inline font-body text-sm font-medium text-muted border-l border-border pl-2 ml-1">
              Village
            </span>
          </Link>

          {/* Desktop navigation */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="Main navigation">
            {navLinks.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.exact}
                className={({ isActive }) => `
                  px-3 py-2 rounded-lg text-sm font-medium font-body
                  transition-colors duration-150
                  ${isActive
                    ? 'text-primary bg-primary/8'
                    : 'text-charcoal hover:text-primary hover:bg-primary/5'
                  }
                `}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center gap-3">
            {!loading && (
              user ? (
                <Link
                  to="/dashboard/home"
                  className="px-4 py-2 border border-border text-charcoal text-sm font-medium rounded-xl hover:border-primary hover:text-primary transition-colors"
                >
                  Dashboard
                </Link>
              ) : (
                <Link
                  to="/dashboard/login"
                  className="px-4 py-2 border border-border text-charcoal text-sm font-medium rounded-xl hover:border-primary hover:text-primary transition-colors"
                >
                  Log in
                </Link>
              )
            )}
            <Link
              to={publishTo}
              className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-[#b05a35] transition-colors"
            >
              Publish a Story
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="lg:hidden p-2 rounded-lg text-charcoal hover:bg-border transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            aria-label="Toggle navigation menu"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              {mobileOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <nav
          id="mobile-menu"
          className="lg:hidden border-t border-border bg-surface"
          aria-label="Mobile navigation"
        >
          <div className="px-4 py-3 space-y-1">
            {navLinks.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.exact}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) => `
                  block px-3 py-2.5 rounded-xl text-sm font-medium font-body
                  transition-colors duration-150
                  ${isActive
                    ? 'text-primary bg-primary/8'
                    : 'text-charcoal hover:text-primary hover:bg-primary/5'
                  }
                `}
              >
                {link.label}
              </NavLink>
            ))}
            <div className="pt-3 border-t border-border mt-3 flex flex-col gap-2">
              {!loading && (
                user ? (
                  <Link
                    to="/dashboard/home"
                    onClick={() => setMobileOpen(false)}
                    className="block px-3 py-2.5 border border-border text-charcoal text-sm font-medium rounded-xl text-center hover:border-primary hover:text-primary transition-colors"
                  >
                    Dashboard
                  </Link>
                ) : (
                  <Link
                    to="/dashboard/login"
                    onClick={() => setMobileOpen(false)}
                    className="block px-3 py-2.5 border border-border text-charcoal text-sm font-medium rounded-xl text-center hover:border-primary hover:text-primary transition-colors"
                  >
                    Log in
                  </Link>
                )
              )}
              <Link
                to={publishTo}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2.5 bg-primary text-white text-sm font-medium rounded-xl text-center hover:bg-[#b05a35] transition-colors"
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
