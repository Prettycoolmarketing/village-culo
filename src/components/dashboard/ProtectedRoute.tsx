import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { isSupabaseConfigured } from '../../lib/supabase'
import { SupabaseSetupBanner } from './SupabaseSetupBanner'
import type { ReactNode } from 'react'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F5F0] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#C86A43] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return <Navigate to="/dashboard/login" replace />

  return (
    <>
      {!isSupabaseConfigured && (
        <div className="px-8 pt-6">
          <SupabaseSetupBanner />
        </div>
      )}
      {children}
    </>
  )
}
