import { Link } from 'react-router-dom'

const sections = [
  {
    heading: 'Discover',
    links: [
      { to: '/',            label: 'Piazza'      },
      { to: '/stories',     label: 'Stories'     },
      { to: '/ideas',       label: 'Ideas'       },
      { to: '/map',         label: 'Map'         },
      { to: '/archive',     label: 'Archive'     },
      { to: '/expertise',   label: 'Expertise'   },
      { to: '/library',     label: 'Library'     },
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
      { to: '/onboarding',     label: 'Become a Publisher' },
      { to: '/media-curator',  label: 'Media Curator'      },
    ],
  },
]

export function Footer() {
  return (
    <footer className="bg-charcoal text-white/80 font-body" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

          {/* Brand column */}
          <div className="md:col-span-1">
            <Link to="/" aria-label="CULO Village — Home">
              <span className="font-heading text-3xl font-bold text-primary">CULO</span>
              <span className="block font-body text-sm text-white/50 mt-1">Village</span>
            </Link>
            <p className="mt-4 text-sm text-white/60 leading-relaxed">
              Create in Canva.<br />
              Publish to the Village.<br />
              Be discovered for what you know.
            </p>
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
        </div>

        <div className="mt-14 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/40">
            © {new Date().getFullYear()} CULO Village · Pretty Cool Marketing · Brisbane, Australia
          </p>
          <p className="text-xs text-white/30">
            Create in Canva. Publish to the Village.
          </p>
        </div>
      </div>
    </footer>
  )
}
