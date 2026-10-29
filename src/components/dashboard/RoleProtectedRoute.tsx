import { useAuth, type UserRole } from '../../contexts/AuthContext'
import { AccessDeniedPage } from '../../pages/dashboard/AccessDeniedPage'
import type { ReactNode } from 'react'

/**
 * Gates a route (already inside the top-level <ProtectedRoute>) to a set of roles.
 * Assumes the caller is already authenticated — this only adds the role check on top,
 * it does not replace the auth/loading check in ProtectedRoute.
 */
export function RoleProtectedRoute({ allow, children }: { allow: UserRole[]; children: ReactNode }) {
  const { user, roleResolving } = useAuth()

  if (!user) return <AccessDeniedPage />

  if (!allow.includes(user.role)) {
    // A denial here might just be a provisional role guess still waiting
    // on a slow profiles query to land (see AuthContext's roleResolving) —
    // a real connection, especially an overseas one, can easily take
    // longer than the fast-path timeout. Hold a spinner instead of
    // bouncing to Access Denied for something that's likely to
    // self-correct in a few more seconds, rather than a real restriction.
    if (roleResolving) {
      return (
        <div className="min-h-screen bg-[#F8F5F0] flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-[#C86A43] border-t-transparent rounded-full animate-spin" />
        </div>
      )
    }
    return <AccessDeniedPage />
  }

  return <>{children}</>
}
