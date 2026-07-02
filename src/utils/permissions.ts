import type { UserRole } from '../contexts/AuthContext'

/**
 * The single permission matrix for CAPO (formerly "Village HQ") — every CAPO
 * route reads from this, via RoleProtectedRoute (App.tsx) for enforcement and
 * DashboardLayout for nav visibility. Enforcement lives at the route level;
 * nav filtering is a convenience on top of that, never a substitute for it —
 * hiding a link does not gate the page it points to.
 *
 * Mirrors the role responsibilities from the CAPO sprint brief:
 *   Owner     — full system access, roles, settings, developer tools
 *   Admin     — founders, businesses, publishers, claims, featured, analytics
 *   Editor    — curate/feature content, publisher feeds, moderate stories
 *   Moderator — review claims, moderate reports, review imported content
 *   Founder   — their own workspace only, no CAPO access
 */
export type CapoSection =
  | 'overview' | 'founders' | 'imports' | 'claims' | 'emails'
  | 'featured' | 'analytics' | 'settings' | 'team'

export const CAPO_PERMISSIONS: Record<CapoSection, UserRole[]> = {
  overview:  ['moderator', 'editor', 'admin', 'owner'],
  founders:  ['editor', 'admin', 'owner'],
  imports:   ['moderator', 'admin', 'owner'],
  claims:    ['moderator', 'admin', 'owner'],
  emails:    ['admin', 'owner'],
  featured:  ['editor', 'admin', 'owner'],
  analytics: ['admin', 'owner'],
  settings:  ['owner'],
  team:      ['owner'],
}

export function canAccessCapoSection(role: UserRole | undefined, section: CapoSection): boolean {
  if (!role) return false
  return CAPO_PERMISSIONS[section].includes(role)
}

/** Any role that can reach at least one CAPO section — used to decide whether the CAPO nav group renders at all. */
export function hasAnyCapoAccess(role: UserRole | undefined): boolean {
  if (!role) return false
  return Object.values(CAPO_PERMISSIONS).some(roles => roles.includes(role))
}

export const ROLE_LABELS: Record<UserRole, string> = {
  founder: 'Founder',
  moderator: 'Moderator',
  editor: 'Editor',
  admin: 'Admin',
  owner: 'Owner',
}

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  founder: 'Manages their own profile, business and stories only. No CAPO access.',
  moderator: 'Reviews claims, moderates reports, reviews imported content.',
  editor: 'Curates and features content, manages publisher feeds, moderates stories.',
  admin: 'Manages founders, businesses, publishers, claims, featured content and analytics.',
  owner: 'Full system access — roles, settings, developer tools. Reserved for the platform owner.',
}

/** Assignable by the Team page — every role, though the UI reserves owner-granting for extra confirmation. */
export const ASSIGNABLE_ROLES: UserRole[] = ['founder', 'moderator', 'editor', 'admin', 'owner']
