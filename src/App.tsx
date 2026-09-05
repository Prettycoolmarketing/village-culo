import { BrowserRouter, Routes, Route, Link, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { seedStore } from './lib/seedStore'
import { syncPublishedContent } from './lib/publicSync'
import { AuthProvider }    from './contexts/AuthContext'

// Seed localStorage from static data on first load
seedStore()
import { ProtectedRoute }  from './components/dashboard/ProtectedRoute'
import { RoleProtectedRoute } from './components/dashboard/RoleProtectedRoute'
import { DashboardLayout } from './components/dashboard/DashboardLayout'
import { Navbar }          from './components/layout/Navbar'
import { Footer }          from './components/layout/Footer'
import { usePageTitle }    from './utils/usePageTitle'

// ─── Public pages ───────────────────────────────────────────────────────────────
import { VillagePage }        from './pages/VillagePage'
import { CreativesPage }      from './pages/CreativesPage'
import { FoundersPage }       from './pages/FoundersPage'
import { FounderProfilePage } from './pages/FounderProfilePage'
import { StoriesPage }        from './pages/StoriesPage'
import { SourcePlatformPage } from './pages/SourcePlatformPage'
import { TopicPage }          from './pages/TopicPage'
import { EditorialDetailPage } from './pages/EditorialDetailPage'
import { StoryDetailPage }    from './pages/StoryDetailPage'
import { SeriesDetailPage }   from './pages/SeriesDetailPage'
import { AllSeriesPage }      from './pages/AllSeriesPage'
import { IdeasPage }          from './pages/IdeasPage'
import { IdeaDetailPage }     from './pages/IdeaDetailPage'
import { MercatoPage }        from './pages/MercatoPage'
import { BusinessProfilePage }from './pages/BusinessProfilePage'
import { MapPage }            from './pages/MapPage'
import { NoticeboardPage }    from './pages/NoticeboardPage'
import { ArchivePage }        from './pages/ArchivePage'
import { ExpertisePage }      from './pages/ExpertisePage'
import { ExpertiseDetailPage }from './pages/ExpertiseDetailPage'
import { LibraryPage }        from './pages/LibraryPage'
import { LibraryDetailPage }  from './pages/LibraryDetailPage'
import { OnboardingPage }    from './pages/OnboardingPage'
import { JoinVillagePage }   from './pages/JoinVillagePage'
import { JoinConfirmPage }   from './pages/JoinConfirmPage'
import { JoinOfferPage }     from './pages/JoinOfferPage'

// ─── Dashboard pages ────────────────────────────────────────────────────────────
import { DashboardLoginPage }        from './pages/dashboard/DashboardLoginPage'
import { DashboardForgotPasswordPage } from './pages/dashboard/DashboardForgotPasswordPage'
import { DashboardResetPasswordPage }  from './pages/dashboard/DashboardResetPasswordPage'
import { DashboardProfilePage }      from './pages/dashboard/DashboardProfilePage'
import { StoryPreviewPage }          from './pages/dashboard/StoryPreviewPage'
import { DashboardIdeasPage }        from './pages/dashboard/DashboardIdeasPage'
import { DashboardLibraryPage }      from './pages/dashboard/DashboardLibraryPage'
import { DashboardMediaPage }        from './pages/dashboard/DashboardMediaPage'
import { DashboardImportSourcesPage }from './pages/dashboard/DashboardImportSourcesPage'
import { DashboardImportContentPage }from './pages/dashboard/DashboardImportContentPage'
import { DashboardWelcomePage }      from './pages/dashboard/DashboardWelcomePage'
import { DashboardCanvaCallbackPage } from './pages/dashboard/DashboardCanvaCallbackPage'
import { DashboardSettingsPage }         from './pages/dashboard/DashboardSettingsPage'
import { DashboardPublishPage }          from './pages/dashboard/DashboardPublishPage'
import { DashboardCuratedFounderBuilderPage } from './pages/dashboard/DashboardCuratedFounderBuilderPage'
import { DashboardBulkImportPage }            from './pages/dashboard/DashboardBulkImportPage'
import { VillageHQOverviewPage }              from './pages/dashboard/village/VillageHQOverviewPage'
import { VillageCuratedFoundersPage }         from './pages/dashboard/village/VillageCuratedFoundersPage'
import { VillageEmailExportPage }             from './pages/dashboard/village/VillageEmailExportPage'
import { VillageSettingsPage }                from './pages/dashboard/village/VillageSettingsPage'
import { CapoTeamPage }                       from './pages/dashboard/village/CapoTeamPage'
import { CapoOpportunitiesHubPage }           from './pages/dashboard/village/CapoOpportunitiesHubPage'
import { VillageUsagePage }                   from './pages/dashboard/village/VillageUsagePage'
import { VillageCreativeFeedbackPage }        from './pages/dashboard/village/VillageCreativeFeedbackPage'
import { DashboardCreativesPage }             from './pages/dashboard/DashboardCreativesPage'
import { ClaimProfilePage }             from './pages/ClaimProfilePage'
import { CAPO_PERMISSIONS } from './utils/permissions'

// ─── Scroll restoration ───────────────────────────────────────────────────────
// BrowserRouter doesn't reset scroll position on navigation — without this,
// clicking a story/article link while scrolled partway down a list opens the
// new page at that same scroll offset instead of the top.
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

// ─── 404 ────────────────────────────────────────────────────────────────────────

function NotFound() {
  usePageTitle('Page Not Found')
  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4 pt-16">
      <div className="text-center max-w-lg">
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
          The page you're looking for doesn't exist, or may have moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/" className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-[#b05a35] transition-colors">
            Back to Village
          </Link>
          <Link to="/archive" className="px-5 py-2.5 border border-border text-charcoal text-sm font-medium rounded-xl hover:border-primary hover:text-primary transition-colors">
            Search the Archive
          </Link>
          <Link to="/onboarding" className="px-5 py-2.5 border border-border text-charcoal text-sm font-medium rounded-xl hover:border-primary hover:text-primary transition-colors">
            Become a Publisher
          </Link>
        </div>
      </div>
    </main>
  )
}

// ─── Public layout (wraps all public-facing routes) ─────────────────────────────

function PublicLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <div className="flex-1">
        <Outlet />
      </div>
      <Footer />
    </div>
  )
}

// ─── App ────────────────────────────────────────────────────────────────────────

export default function App() {
  // getStories()/getFounder()/etc. are plain synchronous cache reads with no
  // built-in reactivity, so once syncPublishedContent() lands fresh data
  // nothing re-renders on its own — this re-render is what actually makes
  // the freshly-synced data show up, instead of whatever was cached from
  // this tab's last visit (the cause of pages looking "different" until a
  // hard refresh).
  const [, setSyncTick] = useState(0)
  useEffect(() => { void syncPublishedContent().then(() => setSyncTick(t => t + 1)) }, [])
  return (
    <BrowserRouter>
      <AuthProvider>
        <ScrollToTop />
        <Routes>

          {/* Standalone, no Navbar/Footer — same reason /dashboard/login is
              outside PublicLayout. Staged at /join (not the homepage) so it
              doesn't disturb the live "coming soon" waitlist while the
              Canva app is still in review — move/link this to
              culovillage.com's main flow once it's ready to go live.
              Deep-linked from the Canva Marketplace app via ?source=canva
              once it's live. */}
          <Route path="/join" element={<JoinVillagePage />} />
          {/* Where Supabase's confirmation email link actually lands (see
              AuthContext.signUp's redirectPath) — set password first, before
              ever reaching the dashboard. */}
          <Route path="/join/confirm" element={<JoinConfirmPage />} />
          {/* The pricing lock-in + simplified profile step, styled like the
              founder profile they're building. */}
          <Route path="/join/offer" element={<JoinOfferPage />} />

          {/* ── Dashboard (no public nav) ──────────────────────────────────── */}
          <Route path="/dashboard/login" element={<DashboardLoginPage />} />
          <Route path="/dashboard/forgot-password" element={<DashboardForgotPasswordPage />} />
          <Route path="/dashboard/reset-password" element={<DashboardResetPasswordPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="profile" replace />} />
            <Route path="home"           element={<Navigate to="/dashboard/profile" replace />} />
            <Route path="profile"        element={<DashboardProfilePage />}      />
            <Route path="preview/:importId" element={<StoryPreviewPage />}       />
            {/* Advanced business editing (Services, Discovery, Partnerships) moved into Profile's Businesses tab */}
            <Route path="businesses"     element={<Navigate to="/dashboard/profile?tab=businesses" replace />}   />
            <Route path="publish"         element={<DashboardPublishPage />}      />
            {/* Story editing moved into Profile's Content tab */}
            <Route path="stories"        element={<Navigate to="/dashboard/profile?tab=content&contentSubTab=published" replace />}      />
            <Route path="ideas"          element={<DashboardIdeasPage />}        />
            <Route path="library"        element={<DashboardLibraryPage />}      />
            <Route path="media"          element={<DashboardMediaPage />}        />
            <Route path="import-sources" element={<DashboardImportSourcesPage />}/>
            <Route path="import-content" element={<DashboardImportContentPage />}/>
            <Route path="welcome"        element={<DashboardWelcomePage />}      />
            {/* Series management moved into Profile's Content tab (Published > Series) — one spot to manage it */}
            <Route path="series"         element={<Navigate to="/dashboard/profile?tab=content&contentSubTab=published" replace />} />
            <Route path="canva/callback" element={<DashboardCanvaCallbackPage />}/>
            {/* Opportunities, Revenue, Claims, Spotlight, Sources and Partners
                are now sub-tabs of one "Opportunities" hub (see
                CapoOpportunitiesHubPage) — these keep old links/bookmarks
                working instead of 404ing. */}
            <Route path="opportunities"  element={<Navigate to="/dashboard/village/opportunities?tab=opportunities" replace />} />
            <Route path="revenue"           element={<Navigate to="/dashboard/village/opportunities?tab=revenue" replace />} />
            <Route path="village/opportunities" element={<RoleProtectedRoute allow={CAPO_PERMISSIONS.overview}><CapoOpportunitiesHubPage /></RoleProtectedRoute>} />
            {/* Superseded by the Founders page (village/founders) — this was
                a separate curated/pending/claimed listing with no nav link
                of its own, now consolidated there. */}
            <Route path="curated-profiles" element={<Navigate to="/dashboard/village/founders" replace />} />
            <Route path="curated-profiles/new" element={<RoleProtectedRoute allow={CAPO_PERMISSIONS.founders}><DashboardCuratedFounderBuilderPage /></RoleProtectedRoute>} />
            <Route path="bulk-import"          element={<RoleProtectedRoute allow={CAPO_PERMISSIONS.imports}><DashboardBulkImportPage /></RoleProtectedRoute>}            />
            <Route path="village"              element={<RoleProtectedRoute allow={CAPO_PERMISSIONS.overview}><VillageHQOverviewPage /></RoleProtectedRoute>}              />
            {/* Union of founders + imports permissions — Bulk Import (moderator-
                accessible) is now a tab on this page, which is otherwise
                editor-gated, so this route has to admit either role. */}
            <Route path="village/founders"     element={<RoleProtectedRoute allow={[...new Set([...CAPO_PERMISSIONS.founders, ...CAPO_PERMISSIONS.imports])]}><VillageCuratedFoundersPage /></RoleProtectedRoute>}         />
            <Route path="village/claims"       element={<Navigate to="/dashboard/village/opportunities?tab=claims" replace />} />
            {/* Bulk Import is now the "Bulk Import" tab on the Founders page —
                importing founders is a founders operation, not a system one. */}
            <Route path="village/imports"      element={<Navigate to="/dashboard/village/founders?tab=imports" replace />} />
            <Route path="village/emails"       element={<RoleProtectedRoute allow={CAPO_PERMISSIONS.emails}><VillageEmailExportPage /></RoleProtectedRoute>}             />
            <Route path="village/spotlight"    element={<Navigate to="/dashboard/village/opportunities?tab=spotlight" replace />} />
            <Route path="village/featured"     element={<Navigate to="/dashboard/village/opportunities?tab=spotlight" replace />}                                                              />
            <Route path="village/editorial"    element={<Navigate to="/dashboard/village/opportunities?tab=spotlight" replace />}                                                              />
            <Route path="village/sources"      element={<Navigate to="/dashboard/village/opportunities?tab=sources" replace />} />
            <Route path="village/partners"     element={<Navigate to="/dashboard/village/opportunities?tab=partners" replace />} />
            {/* Merged into Village Overview's Analytics tab. */}
            <Route path="village/analytics"    element={<Navigate to="/dashboard/village" replace />} />
            <Route path="village/settings"     element={<RoleProtectedRoute allow={CAPO_PERMISSIONS.settings}><VillageSettingsPage /></RoleProtectedRoute>}                />
            <Route path="village/team"         element={<RoleProtectedRoute allow={CAPO_PERMISSIONS.team}><CapoTeamPage /></RoleProtectedRoute>}                          />
            <Route path="settings"         element={<DashboardSettingsPage />}        />
            <Route path="creatives"        element={<DashboardCreativesPage />}       />
            <Route path="village/usage"    element={<RoleProtectedRoute allow={CAPO_PERMISSIONS.usage}><VillageUsagePage /></RoleProtectedRoute>} />
            <Route path="village/creative-feedback" element={<RoleProtectedRoute allow={CAPO_PERMISSIONS.creativeFeedback}><VillageCreativeFeedbackPage /></RoleProtectedRoute>} />
          </Route>

          {/* ── Public site (with Navbar + Footer) ────────────────────────── */}
          <Route element={<PublicLayout />}>
            <Route path="/"                   element={<VillagePage />}          />
            <Route path="/creatives"          element={<CreativesPage />}        />
            <Route path="/piazza"             element={<Navigate to="/" replace />}      />
            <Route path="/founders"           element={<FoundersPage />}         />
            <Route path="/founders/:slug"     element={<FounderProfilePage />}   />
            <Route path="/stories"            element={<StoriesPage />}          />
            <Route path="/series"             element={<AllSeriesPage />}        />
            <Route path="/from/:platform"     element={<SourcePlatformPage />}   />
            <Route path="/topics/:slug"       element={<TopicPage />}            />
            <Route path="/editorial/:slug"    element={<EditorialDetailPage />}  />
            <Route path="/stories/:slug"      element={<StoryDetailPage />}      />
            <Route path="/series/:slug"       element={<SeriesDetailPage />}     />
            <Route path="/ideas"              element={<IdeasPage />}            />
            <Route path="/ideas/:slug"        element={<IdeaDetailPage />}       />
            <Route path="/mercato"            element={<MercatoPage />}          />
            <Route path="/businesses/:slug"   element={<BusinessProfilePage />}  />
            <Route path="/map"                element={<MapPage />}              />
            <Route path="/noticeboard"        element={<NoticeboardPage />}      />
            <Route path="/archive"            element={<ArchivePage />}          />
            <Route path="/expertise"          element={<ExpertisePage />}        />
            <Route path="/expertise/:slug"    element={<ExpertiseDetailPage />}  />
            <Route path="/library"            element={<LibraryPage />}          />
            <Route path="/library/:slug"      element={<LibraryDetailPage />}    />
            <Route path="/onboarding"         element={<OnboardingPage />}       />
            <Route path="/claim/:slug"        element={<ClaimProfilePage />}     />
            <Route path="*"                   element={<NotFound />}             />
          </Route>

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
