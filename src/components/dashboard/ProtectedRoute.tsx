import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { isSupabaseConfigured } from '../../lib/supabase'
import { SupabaseSetupBanner } from './SupabaseSetupBanner'
import type { ReactNode } from 'react'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading, signOut } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F5F0] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#C86A43] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return <Navigate to="/dashboard/login" replace />

  if (user.suspended) {
    return (
      <div className="min-h-screen bg-[#F8F5F0] flex items-center justify-center px-6">
        <div className="max-w-sm text-center">
          <h1 className="text-xl font-bold text-[#2D2A26] mb-2">Account suspended</h1>
          <p className="text-sm text-[#6B7280] mb-6">Your access has been suspended. Contact the Village team if you think this is a mistake.</p>
          <button onClick={() => void signOut()} className="text-sm text-[#C86A43] hover:underline">Sign out</button>
        </div>
      </div>
    )
  }

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
