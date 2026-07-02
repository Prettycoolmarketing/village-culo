import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { canAccessCapoSection, hasAnyCapoAccess } from '../../utils/permissions'
import type { ReactNode } from 'react'

// ─── Icon helpers ───────────────────────────────────────────────────────────────

function Icon({ path }: { path: string }) {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  )
}

const icons = {
  home:       'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  revenue:    'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  profile:    'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  biz:        'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  publish:    'M13 10V3L4 14h7v7l9-11h-7z',
  stories:    'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
  ideas:      'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
  library:    'M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z',
  media:      'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
  importc:    'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4',
  services:   'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  import:     'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12',
  settings:   'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  curated:    'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  signout:    'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
  partnership:'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
  analytics:  'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  email:      'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  featured:   'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
  hq:         'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  claims:     'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  back:       'M10 19l-7-7m0 0l7-7m-7 7h18',
}

// ─── NavItem ────────────────────────────────────────────────────────────────────

function NavItem({ to, label, icon }: { to: string; label: string; icon: ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors ${
          isActive
            ? 'bg-[#C86A43]/10 text-[#C86A43] font-medium'
            : 'text-[#4B4845] hover:bg-[#F3EDE6] hover:text-[#2D2A26]'
        }`
      }
    >
      {icon}
      {label}
    </NavLink>
  )
}

function SectionLabel({ label }: { label: string }) {
  return (
    <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-widest px-2.5 pt-5 pb-1.5">
      {label}
    </p>
  )
}

// ─── DashboardLayout ────────────────────────────────────────────────────────────

export function DashboardLayout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const showCapoNav = hasAnyCapoAccess(user?.role)

  async function handleSignOut() {
    await signOut()
    navigate('/dashboard/login')
  }

  return (
    <div className="flex h-screen bg-[#F8F5F0] overflow-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Left sidebar ────────────────────────────────────────────────────── */}
      <aside className="w-56 shrink-0 border-r border-[#E8E4DD] bg-white flex flex-col overflow-y-auto">

        {/* Brand mark */}
        <div className="px-4 py-4 border-b border-[#E8E4DD]">
          <Link to="/" className="flex items-center gap-2.5 group" title="Return to the public Village">
            <div className="w-8 h-8 rounded-xl bg-[#C86A43] flex items-center justify-center shrink-0">
              <span className="text-white text-sm font-bold leading-none">C</span>
            </div>
            <div className="leading-none">
              <p className="text-[13px] font-bold text-[#2D2A26] group-hover:text-[#C86A43] transition-colors">CULO</p>
              <p className="text-[10px] text-[#9CA3AF] mt-0.5">Publisher</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-3 flex flex-col">
          <Link
            to="/"
            className="flex items-center gap-2.5 px-2.5 py-2 mb-1 rounded-lg text-sm text-[#6B7280] hover:bg-[#F3EDE6] hover:text-[#2D2A26] transition-colors"
          >
            <Icon path={icons.back} />
            Explore Village
          </Link>
          <NavItem to="/dashboard/home" label="Overview"       icon={<Icon path={icons.home}    />} />

          <NavLink
            to="/dashboard/publish"
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl text-sm font-bold transition-colors mb-1 ${
                isActive
                  ? 'bg-[#C86A43] text-white'
                  : 'bg-[#C86A43]/10 text-[#C86A43] hover:bg-[#C86A43]/20'
              }`
            }
          >
            <Icon path={icons.publish} />
            Publish
          </NavLink>

          <SectionLabel label="My Content" />
          <NavItem to="/dashboard/profile"        label="Profile"         icon={<Icon path={icons.profile}  />} />
          <NavItem to="/dashboard/businesses"     label="Businesses"      icon={<Icon path={icons.biz}      />} />
          <NavItem to="/dashboard/stories"        label="My Publications" icon={<Icon path={icons.stories}  />} />
          <NavItem to="/dashboard/ideas"          label="Ideas"           icon={<Icon path={icons.ideas}    />} />
          <NavItem to="/dashboard/library"        label="Library"         icon={<Icon path={icons.library}  />} />
          <NavItem to="/dashboard/media"          label="Media"           icon={<Icon path={icons.media}    />} />
          <NavItem to="/dashboard/import-content" label="Import Content"  icon={<Icon path={icons.importc}  />} />

          <SectionLabel label="Opportunities" />
          <NavItem to="/dashboard/opportunities"  label="Opportunities"   icon={<Icon path={icons.partnership} />} />
          <NavItem to="/dashboard/revenue"        label="Revenue"         icon={<Icon path={icons.revenue}     />} />

          {showCapoNav && (
            <>
              <SectionLabel label="CAPO" />
              <NavItem to="/dashboard/village" label="Overview" icon={<Icon path={icons.hq} />} />

              {(canAccessCapoSection(user?.role, 'founders') || canAccessCapoSection(user?.role, 'team')) && (
                <>
                  <SectionLabel label="People" />
                  {canAccessCapoSection(user?.role, 'founders') && (
                    <NavItem to="/dashboard/village/founders" label="Founders" icon={<Icon path={icons.curated} />} />
                  )}
                  {canAccessCapoSection(user?.role, 'team') && (
                    <NavItem to="/dashboard/village/team" label="Staff" icon={<Icon path={icons.profile} />} />
                  )}
                </>
              )}

              {(canAccessCapoSection(user?.role, 'claims') || canAccessCapoSection(user?.role, 'featured')) && (
                <>
                  <SectionLabel label="Content" />
                  {canAccessCapoSection(user?.role, 'claims') && (
                    <NavItem to="/dashboard/village/claims" label="Claims" icon={<Icon path={icons.claims} />} />
                  )}
                  {canAccessCapoSection(user?.role, 'featured') && (
                    <NavItem to="/dashboard/village/featured" label="Featured" icon={<Icon path={icons.featured} />} />
                  )}
                  {canAccessCapoSection(user?.role, 'featured') && (
                    <NavItem to="/dashboard/village/media-curator" label="Media Curator" icon={<Icon path={icons.media} />} />
                  )}
                </>
              )}

              {canAccessCapoSection(user?.role, 'emails') && (
                <>
                  <SectionLabel label="Growth" />
                  <NavItem to="/dashboard/village/emails" label="Email Lists" icon={<Icon path={icons.email} />} />
                </>
              )}

              {canAccessCapoSection(user?.role, 'analytics') && (
                <>
                  <SectionLabel label="Insights" />
                  <NavItem to="/dashboard/village/analytics" label="Analytics" icon={<Icon path={icons.analytics} />} />
                </>
              )}

              {(canAccessCapoSection(user?.role, 'imports') || canAccessCapoSection(user?.role, 'settings')) && (
                <>
                  <SectionLabel label="System" />
                  {canAccessCapoSection(user?.role, 'imports') && (
                    <NavItem to="/dashboard/village/imports" label="Imports" icon={<Icon path={icons.import} />} />
                  )}
                  {canAccessCapoSection(user?.role, 'settings') && (
                    <NavItem to="/dashboard/village/settings" label="Settings" icon={<Icon path={icons.settings} />} />
                  )}
                </>
              )}
            </>
          )}

          <SectionLabel label="Tools" />
          <NavItem to="/dashboard/import-sources" label="Import Sources"  icon={<Icon path={icons.import}   />} />
        </nav>

        {/* Bottom: settings + user */}
        <div className="px-2 py-3 border-t border-[#E8E4DD]">
          <NavItem to="/dashboard/settings" label="Settings" icon={<Icon path={icons.settings} />} />
          <div className="mt-3 px-2.5 flex items-center justify-between">
            <p className="text-xs text-[#6B7280] truncate max-w-[120px]">{user?.email}</p>
            <button
              onClick={handleSignOut}
              title="Sign out"
              className="text-[#9CA3AF] hover:text-[#C86A43] transition-colors"
            >
              <Icon path={icons.signout} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content ────────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
