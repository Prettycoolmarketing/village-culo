import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

// prettycoolmarketing.com points at this same Vercel project, but it serves
// its own standalone one-pager (PcmSitePage) instead of the Village app.
// Decided purely by hostname, so culovillage.com is never affected.
const isPcmHost = /(^|\.)prettycoolmarketing\.com$/i.test(window.location.hostname)

if (isPcmHost) {
  // The old systeme.io site's legal URLs live on in people's bookmarks and
  // emails; the real Terms/Privacy are on the Village now.
  const legal: Record<string, string> = {
    '/termsandconditions': 'https://www.culovillage.com/terms',
    '/privacypolicy': 'https://www.culovillage.com/privacy',
  }
  const path = window.location.pathname.replace(/\/+$/, '').toLowerCase()
  if (legal[path]) {
    window.location.replace(legal[path])
  } else if (path !== '') {
    window.location.replace('/')
  } else {
    void import('./pages/PcmSitePage').then(({ PcmSitePage }) => {
      createRoot(document.getElementById('root')!).render(
        <StrictMode>
          <PcmSitePage />
        </StrictMode>,
      )
    })
  }
} else {
  void Promise.all([import('./App.tsx'), import('./lib/store.ts')]).then(([{ default: App }, { hydrateStoreFromIndexedDB }]) => {
    // Races the IndexedDB read against a short timeout rather than awaiting it
    // unconditionally — this only ever matters for "paint something before the
    // network sync lands," never for correctness (every page's own sync still
    // runs regardless), so a slow or broken IndexedDB must never meaningfully
    // delay the app's first render.
    void Promise.race([
      hydrateStoreFromIndexedDB(),
      new Promise(resolve => setTimeout(resolve, 300)),
    ]).finally(() => {
      createRoot(document.getElementById('root')!).render(
        <StrictMode>
          <App />
        </StrictMode>,
      )
    })
  })
}
