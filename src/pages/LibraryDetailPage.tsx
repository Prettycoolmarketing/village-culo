import { useParams, Link } from 'react-router-dom'
import { usePageTitle } from '../utils/usePageTitle'
import { productTypeLabel, statusLabel } from '../data/library'
import { getLibraryItemBySlug, getLibraryItems } from '../services/library'
import { getFounder } from '../services/founders'
import { getBusiness } from '../services/businesses'
import { Avatar } from '../components/ui/Avatar'
import { Badge } from '../components/ui/Badge'
import { LibraryCard } from '../components/cards/LibraryCard'
import { InnerContainer } from '../components/layout/PageContainer'

// ─── Provider button label ──────────────────────────────────────────────────────

const providerLabel: Record<string, string> = {
  internal: 'Purchase',
  amazon:   'Buy on Amazon',
  audible:  'Listen on Audible',
  shopify:  'Visit Store',
  gumroad:  'Buy on Gumroad',
  etsy:     'Buy on Etsy',
  website:  'Buy Direct',
  url:      'Buy Now',
}

// ─── Created-from icon ──────────────────────────────────────────────────────────

const createdFromIcon: Record<string, string> = {
  idea:       '💡',
  story:      '📖',
  milestone:  '🏁',
  talk:       '🎤',
  experience: '🌀',
  decision:   '✅',
}

// ─── Status colour ──────────────────────────────────────────────────────────────

const statusColour: Record<string, string> = {
  'available':     'bg-secondary/15 text-secondary',
  'free-download': 'bg-secondary/15 text-secondary',
  'coming-soon':   'bg-muted/20 text-muted',
  'pre-order':     'bg-accent/15 text-[#8a6a1e]',
  'sold-out':      'bg-border text-muted',
  'early-access':  'bg-primary/15 text-primary',
  'members-only':  'bg-primary/15 text-primary',
  'external':      'bg-border text-charcoal',
}

// ─── Not Found ──────────────────────────────────────────────────────────────────

function LibraryNotFound({ slug }: { slug: string }) {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="font-heading text-2xl font-semibold text-charcoal mb-3">Item not found</h1>
        <p className="font-body text-muted mb-8">
          No Library item exists for <code className="text-sm bg-border px-1.5 py-0.5 rounded">{slug}</code>.
        </p>
        <Link to="/library" className="px-5 py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-[#b05a35] transition-colors">
          Browse the Library
        </Link>
      </div>
    </main>
  )
}

// ─── Library Detail Page ─────────────────────────────────────────────────────────

export function LibraryDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const item     = getLibraryItemBySlug(slug ?? '')
  usePageTitle(item ? [item.title, 'Library'] : 'Library')

  if (!item || item.status === 'archived') return <LibraryNotFound slug={slug ?? ''} />

  const founder  = getFounder(item.authorFounderId)
  const business = item.businessId ? getBusiness(item.businessId) : undefined

  const typeLabel   = productTypeLabel[item.productType] ?? item.productType
  const statusBadge = statusLabel[item.status]           ?? item.status
  const colour      = statusColour[item.status]          ?? 'bg-border text-charcoal'

  // Related from same founder/business, different slug
  const related = getLibraryItems()
    .filter(l => l.status !== 'archived' && l.slug !== item.slug && (
      l.authorFounderId === item.authorFounderId ||
      l.topics.some(t => item.topics.some(it => it.id === t.id))
    ))
    .slice(0, 3)

  const canPurchase = ['available', 'free-download', 'pre-order', 'external', 'early-access'].includes(item.status)

  return (
    <main className="min-h-screen bg-background" id={`library-${item.slug}`}>

      {/* ── Breadcrumb ──────────────────────────────────────────────────────── */}
      <nav className="bg-surface border-b border-border pt-20 pb-4" aria-label="Breadcrumb">
        <InnerContainer>
          <ol className="flex items-center gap-2 text-sm font-body text-muted" role="list">
            <li><Link to="/" className="hover:text-primary transition-colors">Village</Link></li>
            <li aria-hidden="true" className="text-border">›</li>
            <li><Link to="/library" className="hover:text-primary transition-colors">Library</Link></li>
            <li aria-hidden="true" className="text-border">›</li>
            <li className="text-charcoal font-medium truncate" aria-current="page">{item.title}</li>
          </ol>
        </InnerContainer>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="bg-charcoal" aria-labelledby="library-item-title">
        <InnerContainer>
          <div className="py-14 grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-14 items-start">

            {/* Cover image */}
            <div className="lg:col-span-2">
              <div className="rounded-2xl overflow-hidden shadow-lg aspect-[3/4] max-w-xs">
                <img
                  src={item.coverImage}
                  alt={`Cover of ${item.title}`}
                  className="w-full h-full object-cover"
                  loading="eager"
                />
              </div>
              {/* Preview images */}
              {item.previewImages && item.previewImages.length > 0 && (
                <div className="flex gap-2 mt-3">
                  {item.previewImages.map((img, i) => (
                    <div key={i} className="w-16 h-20 rounded-lg overflow-hidden border-2 border-white/20">
                      <img src={img} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Meta */}
            <div className="lg:col-span-3">
              {/* Type + Status */}
              <div className="flex items-center gap-2 mb-4">
                <span className="font-body text-xs font-semibold text-white/50 uppercase tracking-widest">{typeLabel}</span>
                <span className={`font-body text-xs font-semibold px-2 py-0.5 rounded-full ${colour}`}>
                  {statusBadge}
                </span>
              </div>

              <h1 id="library-item-title" className="font-heading text-3xl sm:text-4xl font-bold text-white leading-tight mb-3">
                {item.title}
              </h1>
              {item.subtitle && (
                <p className="font-heading text-lg italic text-white/60 mb-5">{item.subtitle}</p>
              )}

              {/* Author */}
              {founder && (
                <Link
                  to={`/founders/${founder.slug}`}
                  className="inline-flex items-center gap-2.5 mb-5 group"
                  aria-label={`By ${founder.name}`}
                >
                  <Avatar src={founder.avatar} alt={founder.name} size="sm" className="ring-2 ring-white/20" />
                  <div>
                    <p className="font-body text-sm font-semibold text-white group-hover:text-primary transition-colors">
                      {founder.name}
                    </p>
                    {business && (
                      <p className="font-body text-xs text-white/50">{business.name}</p>
                    )}
                  </div>
                </Link>
              )}

              {/* Topics */}
              {item.topics.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-6">
                  {item.topics.map(t => (
                    <span key={t.id} className="font-body text-xs bg-white/10 text-white/70 px-2.5 py-1 rounded-full">
                      {t.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Price + Purchase */}
              {canPurchase && (
                <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                  {item.price && (
                    <div className="mb-4">
                      <span className="font-heading text-3xl font-bold text-white">{item.price}</span>
                      {item.currency && item.price !== 'Free' && (
                        <span className="font-body text-sm text-white/50 ml-2">{item.currency}</span>
                      )}
                    </div>
                  )}

                  {/* Multiple purchase links */}
                  <div className="flex flex-col gap-2">
                    {item.purchaseLinks.map((link, i) => (
                      <a
                        key={i}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-colors ${
                          i === 0
                            ? 'bg-primary text-white hover:bg-[#b05a35]'
                            : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                        }`}
                        aria-label={`${link.label} — ${item.title}`}
                      >
                        {providerLabel[link.provider] ?? link.label}
                        {link.note && <span className="text-xs opacity-70">· {link.note}</span>}
                      </a>
                    ))}
                  </div>

                  {item.deliveryMethod && (
                    <p className="font-body text-xs text-white/40 mt-3 text-center">
                      {item.deliveryMethod === 'digital' ? '📥 Digital delivery' : ''}
                      {item.deliveryMethod === 'physical' ? '📦 Physical delivery' : ''}
                      {item.deliveryMethod === 'digital-and-physical' ? '📥📦 Digital + Physical' : ''}
                    </p>
                  )}
                </div>
              )}

              {/* Coming soon state */}
              {item.status === 'coming-soon' && (
                <div className="bg-white/5 rounded-2xl p-5 border border-white/10 text-center">
                  <p className="font-heading text-lg font-semibold text-white mb-2">Coming Soon</p>
                  {item.purchaseLinks[0] && (
                    <a
                      href={item.purchaseLinks[0].url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block px-5 py-3 bg-white/10 text-white rounded-xl text-sm font-semibold hover:bg-white/20 transition-colors border border-white/20"
                    >
                      {item.purchaseLinks[0].label}
                      {item.purchaseLinks[0].note && ` · ${item.purchaseLinks[0].note}`}
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </InnerContainer>
      </section>

      {/* ── Main content ────────────────────────────────────────────────────── */}
      <div className="py-14">
        <InnerContainer>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-14">

            {/* ── Left: Description + Created From ─────────────────────────── */}
            <div className="lg:col-span-2 flex flex-col gap-14">

              {/* Description */}
              <section aria-labelledby="description-heading">
                <h2 id="description-heading" className="font-heading text-2xl font-semibold text-charcoal mb-4">
                  About this {typeLabel}
                </h2>
                <p className="font-body text-base text-charcoal/80 leading-relaxed">{item.description}</p>
              </section>

              {/* Why this exists */}
              {item.why && (
                <section aria-labelledby="why-heading">
                  <h2 id="why-heading" className="font-heading text-2xl font-semibold text-charcoal mb-4">
                    Why this exists
                  </h2>
                  <blockquote className="border-l-4 border-primary pl-5">
                    <p className="font-body text-base text-charcoal/80 leading-relaxed italic">
                      "{item.why}"
                    </p>
                    {founder && (
                      <footer className="mt-3 font-body text-sm text-muted">
                        — {founder.name}
                      </footer>
                    )}
                  </blockquote>
                </section>
              )}

              {/* Behind the product — Created From timeline */}
              {item.createdFrom && item.createdFrom.length > 0 && (
                <section aria-labelledby="created-from-heading">
                  <h2 id="created-from-heading" className="font-heading text-2xl font-semibold text-charcoal mb-2">
                    Behind this {typeLabel}
                  </h2>
                  <p className="font-body text-sm text-muted mb-6">
                    The journey that led to this being created.
                  </p>
                  <ol className="relative border-l border-border space-y-8 pl-6" role="list">
                    {[...item.createdFrom]
                      .sort((a, b) => a.date.localeCompare(b.date))
                      .map(entry => (
                        <li key={entry.id} className="relative" role="listitem">
                          <div className="absolute -left-[1.625rem] top-0.5 flex items-center justify-center w-6 h-6 rounded-full bg-surface border-2 border-primary" aria-hidden="true">
                            <span className="text-xs">{createdFromIcon[entry.type] ?? '○'}</span>
                          </div>
                          <time className="font-body text-xs text-muted font-medium block mb-1" dateTime={entry.date}>
                            {new Date(entry.date).toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })}
                          </time>
                          <h3 className="font-heading text-base font-semibold text-charcoal mb-1">{entry.title}</h3>
                          <p className="font-body text-sm text-muted leading-relaxed">{entry.description}</p>
                        </li>
                      ))}
                    {/* Final node: published */}
                    <li className="relative" role="listitem">
                      <div className="absolute -left-[1.625rem] top-0.5 flex items-center justify-center w-6 h-6 rounded-full bg-primary border-2 border-primary" aria-hidden="true">
                        <span className="text-xs">📚</span>
                      </div>
                      <time className="font-body text-xs text-muted font-medium block mb-1" dateTime={item.createdAt}>
                        {new Date(item.createdAt).toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })}
                      </time>
                      <h3 className="font-heading text-base font-semibold text-primary mb-1">Published to the Village</h3>
                    </li>
                  </ol>
                </section>
              )}

              {/* Keep exploring */}
              <section aria-labelledby="explore-heading">
                <h2 id="explore-heading" className="font-heading text-2xl font-semibold text-charcoal mb-6">
                  Keep Exploring
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { to: '/stories',     label: 'Stories'   },
                    { to: '/ideas',       label: 'Ideas'     },
                    { to: '/expertise',   label: 'Expertise' },
                    { to: '/library',     label: 'Library'   },
                  ].map(link => (
                    <Link
                      key={link.to}
                      to={link.to}
                      className="flex items-center justify-center py-3 rounded-xl border border-border bg-surface text-sm font-medium text-charcoal hover:border-primary hover:text-primary transition-colors"
                    >
                      {link.label} →
                    </Link>
                  ))}
                </div>
              </section>

            </div>

            {/* ── Right sidebar ─────────────────────────────────────────────── */}
            <aside className="lg:col-span-1 flex flex-col gap-8" aria-label="Library item details">

              {/* About the author */}
              {founder && (
                <section aria-labelledby="author-heading">
                  <h2 id="author-heading" className="font-heading text-lg font-semibold text-charcoal mb-4">
                    About the Author
                  </h2>
                  <div className="bg-surface rounded-2xl border border-border p-5">
                    <Link to={`/founders/${founder.slug}`} className="flex items-center gap-3 mb-3 group">
                      <Avatar src={founder.avatar} alt={founder.name} size="md" className="ring-2 ring-border" />
                      <div>
                        <p className="font-body text-sm font-semibold text-charcoal group-hover:text-primary transition-colors">{founder.name}</p>
                        {business && <p className="font-body text-xs text-muted">{business.name}</p>}
                        <p className="font-body text-xs text-muted">{founder.location.name}</p>
                      </div>
                    </Link>
                    <p className="font-body text-sm text-muted leading-relaxed line-clamp-3">{founder.bio}</p>
                    <Link to={`/founders/${founder.slug}`} className="mt-3 block text-sm font-medium text-primary hover:text-[#b05a35] transition-colors">
                      View full profile →
                    </Link>
                  </div>
                </section>
              )}

              {/* Details */}
              <section aria-labelledby="details-heading">
                <h2 id="details-heading" className="font-heading text-lg font-semibold text-charcoal mb-4">Details</h2>
                <div className="bg-surface rounded-2xl border border-border p-5">
                  <dl className="space-y-3 font-body text-sm">
                    <div>
                      <dt className="text-muted text-xs font-medium uppercase tracking-wide mb-1">Type</dt>
                      <dd className="text-charcoal">{typeLabel}</dd>
                    </div>
                    <div>
                      <dt className="text-muted text-xs font-medium uppercase tracking-wide mb-1">Status</dt>
                      <dd>
                        <span className={`font-body text-xs font-semibold px-2 py-0.5 rounded-full ${colour}`}>
                          {statusBadge}
                        </span>
                      </dd>
                    </div>
                    {item.deliveryMethod && (
                      <div>
                        <dt className="text-muted text-xs font-medium uppercase tracking-wide mb-1">Delivery</dt>
                        <dd className="text-charcoal capitalize">{item.deliveryMethod.replace('-and-', ' + ')}</dd>
                      </div>
                    )}
                    {item.location && (
                      <div>
                        <dt className="text-muted text-xs font-medium uppercase tracking-wide mb-1">Created in</dt>
                        <dd className="text-charcoal">{item.location.name}, {item.location.state}</dd>
                      </div>
                    )}
                    {item.topics.length > 0 && (
                      <div>
                        <dt className="text-muted text-xs font-medium uppercase tracking-wide mb-1">Topics</dt>
                        <dd className="flex flex-wrap gap-1.5">
                          {item.topics.map(t => (
                            <Badge key={t.id} label={t.name} variant="secondary" />
                          ))}
                        </dd>
                      </div>
                    )}
                    <div>
                      <dt className="text-muted text-xs font-medium uppercase tracking-wide mb-1">Added to Village</dt>
                      <dd className="text-charcoal">
                        {new Date(item.createdAt).toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })}
                      </dd>
                    </div>
                  </dl>
                </div>
              </section>

              {/* Business */}
              {business && (
                <section aria-labelledby="business-heading">
                  <h2 id="business-heading" className="font-heading text-lg font-semibold text-charcoal mb-4">Business</h2>
                  <Link
                    to={`/businesses/${business.slug}`}
                    className="flex items-center gap-3 bg-surface rounded-xl p-3 border border-border hover:border-primary hover:shadow-sm transition-all group"
                  >
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-border flex-shrink-0">
                      <img src={business.logo} alt="" className="w-full h-full object-cover" loading="lazy" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-body text-sm font-semibold text-charcoal group-hover:text-primary transition-colors truncate">{business.name}</p>
                      <p className="font-body text-xs text-muted">{business.location.name}</p>
                    </div>
                  </Link>
                </section>
              )}

              {/* Related Library items */}
              {related.length > 0 && (
                <section aria-labelledby="related-library-heading">
                  <h2 id="related-library-heading" className="font-heading text-lg font-semibold text-charcoal mb-4">
                    You might also like
                  </h2>
                  <div className="flex flex-col gap-3">
                    {related.map(rel => (
                      <LibraryCard key={rel.id} item={rel} variant="compact" />
                    ))}
                  </div>
                  <Link to="/library" className="mt-4 block text-sm font-medium text-primary hover:text-[#b05a35] transition-colors">
                    Browse all Library →
                  </Link>
                </section>
              )}

            </aside>
          </div>
        </InnerContainer>
      </div>

    </main>
  )
}
