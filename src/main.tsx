import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { hydrateStoreFromIndexedDB } from './lib/store.ts'

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
