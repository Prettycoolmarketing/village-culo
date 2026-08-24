import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { SearchInput } from '../ui/SearchInput'

// Archive and Expertise keep their routes and all SEO/GEO value — they're
// reached through search, widgets and internal links rather than the navbar,
// same as any large content site.
const primaryLinks = [
  { to: '/creatives',  label: 'Creatives',  exact: false },
  { to: '/founders',   label: 'Founders',   exact: false },
  { to: '/mercato',    label: 'Businesses', exact: false },
  { to: '/series',     label: 'Series',     exact: false },
  { to: '/stories',    label: 'Stories',    exact: false },
]


// Village Discovery (Sprint 6) — the search entry point the comment above
// promised but never wired in. Submits to Archive's existing search+facet
// engine (utils/search.ts) via the same ?q= param it already reads; no new
// search logic here, just a way to reach the one that already exists from
// anywhere on the site.
function NavSearch() {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')
  const navigate = useNavigate()
  const ref = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (!open) return
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  function submit(e: FormEvent) {
    e.preventDefault()
    const q = value.trim()
    if (!q) return
    navigate(`/archive?q=${encodeURIComponent(q)}`)
    setOpen(false)
    setValue('')
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        aria-label="Search the Village"
        className="p-2 rounded-lg text-charcoal hover:text-primary hover:bg-primary/5 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>
    )
  }

  return (
    <form ref={ref} onSubmit={submit}>
      <SearchInput
        id="nav-search"
        value={value}
        onChange={setValue}
        placeholder="Search founders, stories, ideas…"
        size="sm"
        className="w-56"
      />
    </form>
  )
}

function MobileSearch({ onSubmitted }: { onSubmitted: () => void }) {
  const [value, setValue] = useState('')
  const navigate = useNavigate()

  function submit(e: FormEvent) {
    e.preventDefault()
    const q = value.trim()
    if (!q) return
    navigate(`/archive?q=${encodeURIComponent(q)}`)
    onSubmitted()
  }

  return (
    <form onSubmit={submit} className="px-1 pb-2">
      <SearchInput
        id="mobile-nav-search"
        value={value}
        onChange={setValue}
        placeholder="Search the Village…"
        size="sm"
      />
    </form>
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
          </nav>

          {/* Search */}
          <div className="hidden lg:block">
            <NavSearch />
          </div>

          {/* Desktop CTA */}
          {!loading && (
            <div className="hidden lg:flex items-center gap-4">
              <Link
                to="/creatives"
                className="whitespace-nowrap px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-[#b05a35] transition-colors"
              >
                CULO in Canva
              </Link>
              {user ? (
                <Link
                  to="/dashboard/publish"
                  className="whitespace-nowrap px-4 py-2 bg-charcoal text-white text-sm font-medium rounded-xl hover:bg-[#1a1815] transition-colors"
                >
                  Publish
                </Link>
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
                    className="whitespace-nowrap px-4 py-2 bg-charcoal text-white text-sm font-medium rounded-xl hover:bg-[#1a1815] transition-colors"
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
            <MobileSearch onSubmitted={() => setMobileOpen(false)} />
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
            <div className="pt-3 border-t border-border mt-3 flex flex-col gap-2">
              <Link
                to="/creatives"
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2.5 bg-primary text-white text-sm font-medium rounded-xl text-center hover:bg-[#b05a35] transition-colors"
              >
                CULO in Canva
              </Link>
              {!loading && (user ? (
                <Link
                  to="/dashboard/publish"
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2.5 bg-charcoal text-white text-sm font-medium rounded-xl text-center hover:bg-[#1a1815] transition-colors"
                >
                  Publish
                </Link>
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
                    className="block px-3 py-2.5 bg-charcoal text-white text-sm font-medium rounded-xl text-center hover:bg-[#1a1815] transition-colors"
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
