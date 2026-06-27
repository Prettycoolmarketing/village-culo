import { Link } from 'react-router-dom'

const sections = [
  {
    heading: 'Discover',
    links: [
      { to: '/',            label: 'Village'     },
      { to: '/stories',     label: 'Stories'     },
      { to: '/ideas',       label: 'Ideas'       },
      { to: '/map',         label: 'Map'         },
      { to: '/archive',     label: 'Archive'     },
    ],
  },
  {
    heading: 'People',
    links: [
      { to: '/founders',    label: 'Founders'    },
      { to: '/mercato',     label: 'Mercato'     },
      { to: '/noticeboard', label: 'Noticeboard' },
    ],
  },
  {
    heading: 'Publish',
    links: [
      { to: '/piazza',      label: 'Piazza'         },
      { to: '/piazza',      label: 'Submit a Story'  },
    ],
  },
]

export function Footer() {
  return (
    <footer className="bg-charcoal text-white/70 font-body" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 md:gap-12">

          {/* Brand column — spans 2 cols */}
          <div className="md:col-span-2">
            <Link to="/" className="inline-block mb-5" aria-label="CULO Village — Home">
              <span className="font-heading text-3xl font-bold text-primary leading-none block">CULO</span>
              <span className="font-heading text-xs italic text-cloud/70 tracking-widest mt-0.5 block">
                share your story
              </span>
            </Link>

            <p className="text-sm text-white/55 leading-relaxed max-w-xs">
              Create in Canva.<br />
              Publish to the Village.<br />
              Be discovered for what you know.
            </p>

            {/* Social icons */}
            <div className="flex gap-3 mt-6">
              {[
                { label: 'Instagram', path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z' },
                { label: 'LinkedIn', path: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' },
              ].map(({ label, path }) => (
                <button
                  key={label}
                  aria-label={label}
                  className="w-9 h-9 rounded-xl bg-white/5 hover:bg-cloud/20 flex items-center justify-center text-white/40 hover:text-cloud transition-all duration-200"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d={path} />
                  </svg>
                </button>
              ))}
            </div>
          </div>

          {/* Navigation columns */}
          {sections.map(section => (
            <nav key={section.heading} aria-label={`${section.heading} links`}>
              <h3 className="font-body text-xs font-semibold text-cloud/80 uppercase tracking-widest mb-4">
                {section.heading}
              </h3>
              <ul className="space-y-3">
                {section.links.map(link => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-white/50 hover:text-cloud transition-colors duration-150"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-14 pt-8 border-t border-white/8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/30">
            © {new Date().getFullYear()} CULO Village · Pretty Cool Marketing · Brisbane, Australia
          </p>
          <p className="text-xs text-white/20 italic font-heading">
            Create in Canva. Publish to the Village.
          </p>
        </div>
      </div>
    </footer>
  )
}
