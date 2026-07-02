import { useEffect, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

// Primary: the three things a first-time visitor actually browses.
// Secondary (Discover menu): real, valuable destinations that don't need to
// compete for space in the main bar. Archive and Expertise keep their routes
// and all SEO/GEO value — they're reached through search, widgets and
// internal links rather than the navbar, same as any large content site.
const primaryLinks = [
  { to: '/',           label: 'Piazza',     exact: true  },
  { to: '/founders',   label: 'Founders',   exact: false },
  { to: '/stories',    label: 'Stories',    exact: false },
]

const discoverLinks = [
  { to: '/ideas',       label: 'Ideas'       },
  { to: '/mercato',     label: 'Mercato'     },
  { to: '/map',         label: 'Map'         },
  { to: '/noticeboard', label: 'Noticeboard' },
  { to: '/library',     label: 'Library'     },
]

function DiscoverMenu() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium font-body text-charcoal hover:text-primary hover:bg-primary/5 transition-colors duration-150"
      >
        Discover
        <svg className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div role="menu" className="absolute left-0 top-full mt-1 w-48 bg-surface border border-border rounded-xl shadow-lg py-1.5 z-50">
          {discoverLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block px-3.5 py-2 text-sm text-charcoal hover:bg-primary/5 hover:text-primary transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, loading } = useAuth()

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
            {primaryLinks.map(link => (
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
            <DiscoverMenu />
          </nav>

          {/* Desktop CTA */}
          {!loading && (
            <div className="hidden lg:flex items-center gap-4">
              {user ? (
                <>
                  <Link
                    to="/dashboard/home"
                    className="text-sm font-medium text-charcoal hover:text-primary transition-colors"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/dashboard/publish"
                    className="whitespace-nowrap px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-[#b05a35] transition-colors"
                  >
                    Publish
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/dashboard/login"
                    className="text-sm font-medium text-charcoal hover:text-primary transition-colors"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/onboarding"
                    className="whitespace-nowrap px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-[#b05a35] transition-colors"
                  >
                    Become a Publisher
                  </Link>
                </>
              )}
            </div>
          )}

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
            {primaryLinks.map(link => (
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
            <p className="px-3 pt-3 text-xs font-semibold text-muted uppercase tracking-widest">Discover</p>
            {discoverLinks.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
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
              {!loading && (user ? (
                <>
                  <Link
                    to="/dashboard/home"
                    onClick={() => setMobileOpen(false)}
                    className="block px-3 py-2.5 border border-border text-charcoal text-sm font-medium rounded-xl text-center hover:border-primary hover:text-primary transition-colors"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/dashboard/publish"
                    onClick={() => setMobileOpen(false)}
                    className="block px-3 py-2.5 bg-primary text-white text-sm font-medium rounded-xl text-center hover:bg-[#b05a35] transition-colors"
                  >
                    Publish
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/dashboard/login"
                    onClick={() => setMobileOpen(false)}
                    className="block px-3 py-2.5 border border-border text-charcoal text-sm font-medium rounded-xl text-center hover:border-primary hover:text-primary transition-colors"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/onboarding"
                    onClick={() => setMobileOpen(false)}
                    className="block px-3 py-2.5 bg-primary text-white text-sm font-medium rounded-xl text-center hover:bg-[#b05a35] transition-colors"
                  >
                    Become a Publisher
                  </Link>
                </>
              ))}
            </div>
          </div>
        </nav>
      )}
    </header>
  )
}
