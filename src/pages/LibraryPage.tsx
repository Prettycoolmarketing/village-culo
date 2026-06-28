import { useState } from 'react'
import { usePageTitle } from '../utils/usePageTitle'
import { Link } from 'react-router-dom'
import { libraryItems, productTypeLabel, statusLabel } from '../data/library'
import { LibraryCard } from '../components/cards/LibraryCard'
import { InnerContainer } from '../components/layout/PageContainer'
import type { ProductType, LibraryStatus } from '../types'

// ─── Filter types ───────────────────────────────────────────────────────────────

const PRODUCT_TYPES: { value: ProductType | ''; label: string }[] = [
  { value: '',               label: 'All types'    },
  { value: 'workbook',       label: 'Workbook'     },
  { value: 'canva-template', label: 'Canva Template'},
  { value: 'prompt-pack',    label: 'Prompt Pack'  },
  { value: 'framework',      label: 'Framework'    },
  { value: 'course',         label: 'Course'       },
  { value: 'toolkit',        label: 'Toolkit'      },
  { value: 'book',           label: 'Book'         },
  { value: 'ebook',          label: 'eBook'        },
  { value: 'guide',          label: 'Guide'        },
  { value: 'template',       label: 'Template'     },
  { value: 'checklist',      label: 'Checklist'    },
  { value: 'bundle',         label: 'Bundle'       },
]

const STATUSES: { value: LibraryStatus | ''; label: string }[] = [
  { value: '',              label: 'All'           },
  { value: 'available',     label: 'Available'     },
  { value: 'free-download', label: 'Free'          },
  { value: 'coming-soon',   label: 'Coming Soon'   },
  { value: 'pre-order',     label: 'Pre-order'     },
  { value: 'early-access',  label: 'Early Access'  },
]

// ─── Library Page ───────────────────────────────────────────────────────────────

export function LibraryPage() {
  usePageTitle('Library')

  const [query,       setQuery]       = useState('')
  const [productType, setProductType] = useState<ProductType | ''>('')
  const [status,      setStatus]      = useState<LibraryStatus | ''>('')

  const filtered = libraryItems.filter(item => {
    if (item.status === 'archived') return false
    if (productType && item.productType !== productType) return false
    if (status      && item.status      !== status)      return false
    if (query.trim()) {
      const q = query.toLowerCase()
      const searchable = [
        item.title, item.subtitle, item.description, item.why ?? '',
        productTypeLabel[item.productType],
        ...item.topics.map(t => t.name),
        statusLabel[item.status],
      ].join(' ').toLowerCase()
      if (!searchable.includes(q)) return false
    }
    return true
  })

  const featured = libraryItems.filter(i => i.featured && i.status !== 'archived')

  return (
    <main className="min-h-screen bg-background" id="library-index">

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="bg-charcoal pt-24 pb-14" aria-labelledby="library-heading">
        <InnerContainer>
          <div className="max-w-2xl">
            <p className="font-body text-xs font-semibold text-primary uppercase tracking-widest mb-4">
              CULO Village · Knowledge Library
            </p>
            <h1 id="library-heading" className="font-heading text-4xl sm:text-5xl font-bold text-white leading-tight mb-4">
              Library
            </h1>
            <p className="font-body text-lg text-white/60 leading-relaxed">
              The permanent home for everything founders in the Village have intentionally published —
              free or paid, digital or physical, template or framework or book.
              Purchasing is only one possible action. Discovery, learning and authority are the primary goals.
            </p>

            {/* Stats */}
            <div className="flex flex-wrap gap-8 mt-8">
              {[
                { count: filtered.length,                        label: 'Published items'   },
                { count: filtered.filter(i => i.status === 'free-download').length, label: 'Free resources' },
                { count: new Set(filtered.map(i => i.authorFounderId)).size, label: 'Creators' },
              ].map(stat => (
                <div key={stat.label} className="flex flex-col">
                  <span className="font-heading text-3xl font-bold text-white">{stat.count}</span>
                  <span className="font-body text-xs text-white/40 uppercase tracking-wide">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </InnerContainer>
      </section>

      {/* ── Search + filters ────────────────────────────────────────────────── */}
      <section className="bg-surface border-b border-border py-5 sticky top-16 z-30 shadow-sm" aria-label="Filter the Library">
        <InnerContainer>
          <div className="flex flex-wrap gap-3 items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-48 max-w-sm">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="search"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search the Library..."
                aria-label="Search Library items"
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-background text-charcoal text-sm font-body placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>

            {/* Type filter */}
            <div className="relative">
              <select
                value={productType}
                onChange={e => setProductType(e.target.value as ProductType | '')}
                aria-label="Filter by product type"
                className="appearance-none pl-3 pr-8 py-2 rounded-xl border border-border bg-background text-charcoal text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              >
                {PRODUCT_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {/* Status filter — pill buttons */}
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by availability">
              {STATUSES.map(s => (
                <button
                  key={s.value}
                  onClick={() => setStatus(s.value as LibraryStatus | '')}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium font-body transition-all ${
                    status === s.value
                      ? 'bg-primary text-white shadow-sm'
                      : 'border border-border text-muted hover:text-charcoal hover:border-primary'
                  }`}
                  aria-pressed={status === s.value}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Result count */}
            <p className="font-body text-sm text-muted ml-auto" aria-live="polite" aria-atomic="true">
              {filtered.length} {filtered.length === 1 ? 'item' : 'items'}
            </p>
          </div>
        </InnerContainer>
      </section>

      <div className="py-12 md:py-16">
        <InnerContainer>

          {/* ── Featured strip (only when no active filter) ─────────────────── */}
          {!query && !productType && !status && featured.length > 0 && (
            <section className="mb-16" aria-labelledby="featured-library-heading">
              <h2 id="featured-library-heading" className="font-heading text-2xl font-semibold text-charcoal mb-6">
                Featured
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {featured.map(item => (
                  <LibraryCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          )}

          {/* ── All / filtered results ──────────────────────────────────────── */}
          <section aria-labelledby="all-library-heading">
            <h2 id="all-library-heading" className="font-heading text-2xl font-semibold text-charcoal mb-6">
              {query || productType || status ? 'Results' : 'All Library Items'}
            </h2>

            {filtered.length === 0 ? (
              <div className="py-16 text-center bg-surface rounded-2xl border border-border">
                <p className="font-heading text-lg font-semibold text-charcoal mb-2">Nothing found</p>
                <p className="font-body text-sm text-muted mb-6">
                  Try a different search term or filter.
                </p>
                <button
                  onClick={() => { setQuery(''); setProductType(''); setStatus('') }}
                  className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-[#b05a35] transition-colors"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" role="list">
                {filtered.map(item => (
                  <li key={item.id}>
                    <LibraryCard item={item} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* ── Philosophy note ─────────────────────────────────────────────── */}
          <aside className="mt-16 bg-charcoal rounded-2xl p-8 text-center">
            <p className="font-heading text-xl italic font-semibold text-white/90 mb-3">
              "Library is not an online store."
            </p>
            <p className="font-body text-sm text-white/55 leading-relaxed max-w-xl mx-auto">
              It is the permanent home for everything a founder has intentionally published.
              Every item here connects to stories, ideas, expertise and the people behind them —
              because context is more valuable than content.
            </p>
            <Link
              to="/stories"
              className="mt-6 inline-block font-body text-sm font-medium text-primary hover:text-[#e08060] transition-colors"
            >
              Explore the Stories behind the Library →
            </Link>
          </aside>

        </InnerContainer>
      </div>
    </main>
  )
}
