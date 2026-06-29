import { useEffect } from 'react'

const SITE_NAME = 'CULO Village'
const MARKER    = 'data-page-meta'
const LD_MARKER = 'data-page-jsonld'

export interface PageMetaOptions {
  title?: string
  description?: string
  keywords?: string[]
  ogType?: 'website' | 'article' | 'profile'
  ogImage?: string
  jsonLd?: Record<string, unknown> | null
}

function cleanup() {
  document.querySelectorAll(`[${MARKER}]`).forEach(el => el.remove())
  document.querySelectorAll(`[${LD_MARKER}]`).forEach(el => el.remove())
}

function addMeta(name: string, content: string, attr = 'name') {
  const el = document.createElement('meta')
  el.setAttribute(attr, name)
  el.setAttribute('content', content)
  el.setAttribute(MARKER, '')
  document.head.appendChild(el)
}

function addLink(rel: string, href: string) {
  const el = document.createElement('link')
  el.setAttribute('rel', rel)
  el.setAttribute('href', href)
  el.setAttribute(MARKER, '')
  document.head.appendChild(el)
}

function addJsonLd(data: Record<string, unknown>) {
  const el = document.createElement('script')
  el.setAttribute('type', 'application/ld+json')
  el.setAttribute(LD_MARKER, '')
  el.textContent = JSON.stringify(data)
  document.head.appendChild(el)
}

export function usePageMeta(options: PageMetaOptions) {
  useEffect(() => {
    cleanup()

    const title    = options.title ? `${options.title} | ${SITE_NAME}` : SITE_NAME
    const desc     = options.description?.slice(0, 160) ?? ''
    const canonical = `${window.location.origin}${window.location.pathname}`

    document.title = title

    if (desc) addMeta('description', desc)

    if (options.keywords && options.keywords.length > 0) {
      addMeta('keywords', options.keywords.slice(0, 15).join(', '))
    }

    addLink('canonical', canonical)

    addMeta('og:site_name', SITE_NAME, 'property')
    addMeta('og:type', options.ogType ?? 'website', 'property')
    addMeta('og:url', canonical, 'property')
    addMeta('og:title', title, 'property')
    if (desc) addMeta('og:description', desc, 'property')
    if (options.ogImage) addMeta('og:image', options.ogImage, 'property')

    addMeta('twitter:card', options.ogImage ? 'summary_large_image' : 'summary')
    addMeta('twitter:title', title)
    if (desc) addMeta('twitter:description', desc)
    if (options.ogImage) addMeta('twitter:image', options.ogImage)

    if (options.jsonLd) addJsonLd(options.jsonLd)

    return cleanup
  })
}
