import type { UserRole } from '../contexts/AuthContext'

/**
 * The single permission matrix for CAPO — every CAPO route reads from this,
 * via RoleProtectedRoute (App.tsx) for enforcement and DashboardLayout for
 * nav visibility. Enforcement lives at the route level; nav filtering is a
 * convenience on top of that, never a substitute for it.
 *
 * Two staff roles:
 *   Admin (owner) — sees and does everything.
 *   Capo (editor) — Pretty Cool Marketing (Client Tracker + Leads) and
 *                   People (Founders + Email Lists). Nothing else.
 *
 * `admin` and `moderator` are legacy roles kept for existing accounts:
 * `admin` is treated as full access alongside `owner`; `moderator` has no
 * CAPO access and should be re-set to Capo or Admin.
 */
export type CapoSection =
  | 'overview' | 'founders' | 'imports' | 'claims' | 'emails'
  | 'featured' | 'analytics' | 'settings' | 'team' | 'editorial' | 'partners'
  | 'usage' | 'creativeFeedback' | 'pcm'

const ADMIN: UserRole[] = ['admin', 'owner']
const CAPO_AND_ADMIN: UserRole[] = ['editor', 'admin', 'owner']

export const CAPO_PERMISSIONS: Record<CapoSection, UserRole[]> = {
  overview:  ADMIN,
  founders:  CAPO_AND_ADMIN,
  imports:   ADMIN,
  claims:    ADMIN,
  emails:    CAPO_AND_ADMIN,
  featured:  ADMIN,
  analytics: ADMIN,
  settings:  ADMIN,
  team:      ADMIN,
  editorial: ADMIN,
  partners:  ADMIN,
  usage:            ADMIN,
  creativeFeedback: ADMIN,
  pcm:              CAPO_AND_ADMIN,
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
  editor: 'Capo',
  admin: 'Admin',
  owner: 'Admin',
}

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  founder: 'Manages their own profile, business and stories only. No CAPO access.',
  moderator: 'Legacy role — no CAPO access. Re-set to Capo or Admin.',
  editor: 'Pretty Cool Marketing (Client Tracker and Leads) and People (Founders and Email Lists). Nothing else.',
  admin: 'Sees and does everything across CAPO.',
  owner: 'Sees and does everything across CAPO.',
}

/** The two staff roles offered on the Team page. `editor` is shown as "Capo", `owner` as "Admin". */
export const ASSIGNABLE_ROLES: UserRole[] = ['editor', 'owner']
