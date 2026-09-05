import { Link } from 'react-router-dom'

// Discover mirrors the navbar's primaryLinks (src/components/layout/Navbar.tsx)
// exactly, same order — the footer had drifted to a different, older set of
// links than what's actually in the top nav.
const sections = [
  {
    heading: 'Discover',
    links: [
      { to: '/creatives', label: 'Creatives'  },
      { to: '/founders',  label: 'Founders'   },
      { to: '/mercato',   label: 'Businesses' },
      { to: '/stories',   label: 'Stories'    },
    ],
  },
  {
    heading: 'More',
    links: [
      { to: '/series',      label: 'Series'      },
      { to: '/ideas',       label: 'Ideas'       },
      { to: '/map',         label: 'Map'         },
      { to: '/archive',     label: 'Archive'     },
      { to: '/expertise',   label: 'Expertise'   },
      { to: '/library',     label: 'Library'     },
      { to: '/noticeboard', label: 'Noticeboard' },
    ],
  },
]

const publishSection = {
  heading: 'Publish',
  links: [
    { to: '/onboarding', label: 'Become a Publisher' },
  ],
}

// Shakas's own accounts (see src/data/founders.ts 'shakas' record and
// src/data/media.ts) — the person behind CULO, not the CULO Village brand
// accounts, which is why this is its own "Meet the founder" column rather
// than folded into the brand column above.
const FOUNDER_SOCIALS = [
  {
    label: 'Instagram',
    url: 'https://instagram.com/shakasdesigner',
    icon: <path d="M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.256 1.216.6 1.772 1.153a4.908 4.908 0 011.153 1.772c.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 01-1.153 1.772 4.915 4.915 0 01-1.772 1.153c-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 01-1.772-1.153 4.904 4.904 0 01-1.153-1.772c-.248-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428a4.88 4.88 0 011.153-1.772A4.897 4.897 0 015.45 2.525c.638-.248 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2zm0 1.802c-2.67 0-2.986.01-4.04.059-.976.045-1.505.207-1.858.344-.466.181-.8.398-1.15.748-.35.35-.566.684-.747 1.15-.137.353-.3.882-.344 1.857-.048 1.055-.058 1.37-.058 4.04 0 2.67.01 2.986.058 4.04.045.976.207 1.505.344 1.858.181.466.398.8.748 1.15.35.35.683.566 1.15.747.352.137.881.3 1.857.344 1.054.048 1.37.058 4.04.058 2.67 0 2.986-.01 4.04-.058.976-.045 1.505-.207 1.858-.344.466-.181.8-.398 1.15-.748.35-.35.566-.683.747-1.15.137-.352.3-.881.344-1.857.048-1.054.058-1.37.058-4.04 0-2.67-.01-2.986-.058-4.04-.045-.976-.207-1.505-.344-1.858a3.09 3.09 0 00-.748-1.15 3.09 3.09 0 00-1.15-.747c-.352-.137-.881-.3-1.857-.344-1.054-.048-1.37-.058-4.04-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 8.468a3.333 3.333 0 100-6.666 3.333 3.333 0 000 6.666zm6.538-8.671a1.2 1.2 0 11-2.4 0 1.2 1.2 0 012.4 0z" />,
  },
  {
    label: 'LinkedIn',
    url: 'https://linkedin.com/in/shakasdesigner',
    icon: <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />,
  },
  {
    label: 'YouTube',
    url: 'https://youtube.com/@shakasdesigner',
    icon: <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />,
  },
]

export function Footer() {
  return (
    <footer className="bg-charcoal text-white/80 font-body" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10">

          {/* Brand column */}
          <div className="md:col-span-1">
            <Link to="/" aria-label="CULO Village — Home">
              <span className="font-heading text-3xl font-bold text-primary">CULO</span>
              <span className="block font-body text-sm text-white/50 mt-1">Village</span>
            </Link>
            <p className="mt-4 text-sm text-white/60 leading-relaxed">
              Create in CULO in Canva.<br />
              Publish to The Village.<br />
              Be discovered for what you know.
            </p>
            <Link to="/" aria-label="CULO Village — Home" className="inline-block mt-5 -ml-3 sm:-ml-4">
              <img src="/culo_logo.png" alt="CULO Village" className="w-40 h-40 sm:w-56 sm:h-56 opacity-80 hover:opacity-100 transition-opacity" />
            </Link>
          </div>

          {/* Navigation columns */}
          {sections.map(section => (
            <nav key={section.heading} aria-label={`${section.heading} links`}>
              <h3 className="font-heading text-white font-semibold text-base mb-4">{section.heading}</h3>
              <ul className="space-y-2.5">
                {section.links.map(link => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-white/60 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          {/* Meet the founder — sits between More and Publish */}
          <div>
            <h3 className="font-heading text-white font-semibold text-base mb-4">Meet the founder</h3>
            <p className="text-sm text-white/60 leading-relaxed mb-4">
              Shakas is a serial entrepreneur — she previously owned a tour company, designed a unique 3-in-1
              beach bag, and is proud owner of Pretty Cool Marketing x The Culo Village.
            </p>
            <div className="flex items-center gap-3">
              {FOUNDER_SOCIALS.map(social => (
                <a
                  key={social.label}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    {social.icon}
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Publish */}
          <nav aria-label={`${publishSection.heading} links`}>
            <h3 className="font-heading text-white font-semibold text-base mb-4">{publishSection.heading}</h3>
            <ul className="space-y-2.5">
              {publishSection.links.map(link => (
                <li key={link.label}>
                  <Link to={link.to} className="text-sm text-white/60 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-14 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/40">
            © {new Date().getFullYear()} CULO Village ·{' '}
            <a href="https://www.prettycoolmarketing.com" target="_blank" rel="noopener noreferrer" className="hover:text-white/70 transition-colors">
              Pretty Cool Marketing
            </a>{' '}
            · Brisbane, Australia
          </p>
          <p className="text-xs text-white/30">
            Create in CULO in Canva. Publish to The Village.
          </p>
        </div>
      </div>
    </footer>
  )
}
