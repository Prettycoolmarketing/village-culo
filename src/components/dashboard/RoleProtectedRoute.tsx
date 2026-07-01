import { useAuth, type UserRole } from '../../contexts/AuthContext'
import { AccessDeniedPage } from '../../pages/dashboard/AccessDeniedPage'
import type { ReactNode } from 'react'

/**
 * Gates a route (already inside the top-level <ProtectedRoute>) to a set of roles.
 * Assumes the caller is already authenticated — this only adds the role check on top,
 * it does not replace the auth/loading check in ProtectedRoute.
 */
export function RoleProtectedRoute({ allow, children }: { allow: UserRole[]; children: ReactNode }) {
  const { user } = useAuth()

  if (!user || !allow.includes(user.role)) {
    return <AccessDeniedPage />
  }

  return <>{children}</>
}
