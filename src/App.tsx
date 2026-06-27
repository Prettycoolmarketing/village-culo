import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { Navbar } from './components/layout/Navbar'
import { Footer } from './components/layout/Footer'
import { usePageTitle } from './utils/usePageTitle'

import { VillagePage }        from './pages/VillagePage'
import { PiazzaPage }         from './pages/PiazzaPage'
import { FoundersPage }       from './pages/FoundersPage'
import { FounderProfilePage } from './pages/FounderProfilePage'
import { StoriesPage }        from './pages/StoriesPage'
import { StoryDetailPage }    from './pages/StoryDetailPage'
import { IdeasPage }          from './pages/IdeasPage'
import { IdeaDetailPage }     from './pages/IdeaDetailPage'
import { MercatoPage }        from './pages/MercatoPage'
import { BusinessProfilePage }from './pages/BusinessProfilePage'
import { MapPage }            from './pages/MapPage'
import { NoticeboardPage }    from './pages/NoticeboardPage'
import { ArchivePage }        from './pages/ArchivePage'

// Route structure mirrors future public URL schema:
// /founders/:slug  → /businesses/:slug  → /stories/:slug
// /ideas/:slug     → /locations/:slug   → /topics/:slug

function NotFound() {
  usePageTitle('Page Not Found')
  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4 pt-16">
      <div className="text-center max-w-lg">
        {/* Decorative */}
        <div
          className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6"
          aria-hidden="true"
        >
          <svg className="w-10 h-10 text-primary/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        </div>

        <p className="font-body text-xs font-semibold text-primary uppercase tracking-widest mb-3">
          404 — Not Found
        </p>
        <h1 className="font-heading text-4xl sm:text-5xl font-bold text-charcoal mb-4 leading-tight">
          This path hasn't been built in the Village yet.
        </h1>
        <p className="font-body text-lg text-muted leading-relaxed mb-8">
          The page you're looking for doesn't exist, or may have moved. The Village is still
          growing — check back as new content is published.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-[#b05a35] transition-colors"
          >
            Back to Village
          </Link>
          <Link
            to="/archive"
            className="px-5 py-2.5 border border-border text-charcoal text-sm font-medium rounded-xl hover:border-primary hover:text-primary transition-colors"
          >
            Search the Archive
          </Link>
          <Link
            to="/piazza"
            className="px-5 py-2.5 border border-border text-charcoal text-sm font-medium rounded-xl hover:border-primary hover:text-primary transition-colors"
          >
            Publish a Story
          </Link>
        </div>
      </div>
    </main>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen bg-background">
        <Navbar />
        <div className="flex-1">
          <Routes>
            <Route path="/"                   element={<VillagePage />} />
            <Route path="/piazza"             element={<PiazzaPage />} />
            <Route path="/founders"           element={<FoundersPage />} />
            <Route path="/founders/:slug"     element={<FounderProfilePage />} />
            <Route path="/stories"            element={<StoriesPage />} />
            <Route path="/stories/:slug"      element={<StoryDetailPage />} />
            <Route path="/ideas"              element={<IdeasPage />} />
            <Route path="/ideas/:slug"        element={<IdeaDetailPage />} />
            <Route path="/mercato"            element={<MercatoPage />} />
            <Route path="/businesses/:slug"   element={<BusinessProfilePage />} />
            <Route path="/map"                element={<MapPage />} />
            <Route path="/noticeboard"        element={<NoticeboardPage />} />
            <Route path="/archive"            element={<ArchivePage />} />
            <Route path="*"                   element={<NotFound />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </BrowserRouter>
  )
}
