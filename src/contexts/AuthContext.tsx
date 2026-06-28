import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { syncUserDataFromSupabase } from '../lib/sync'
import type { User } from '@supabase/supabase-js'

export interface AuthUser {
  id: string
  email: string
  role: 'admin' | 'founder' | 'visitor'
}

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  isConfigured: boolean
  signIn:  (email: string, password: string) => Promise<{ error: string | null }>
  signUp:  (email: string, password: string) => Promise<{ error: string | null; needsConfirmation: boolean }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function toAuthUser(supaUser: User): AuthUser {
  return { id: supaUser.id, email: supaUser.email ?? '', role: 'founder' }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      const stored = localStorage.getItem('culo_dev_user')
      if (stored) {
        try { setUser(JSON.parse(stored) as AuthUser) } catch { /* malformed */ }
      }
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setUser(toAuthUser(session.user))
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ? toAuthUser(session.user) : null)
      if (event === 'SIGNED_IN' && session?.user) {
        void syncUserDataFromSupabase(session.user.id)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signIn(email: string, password: string): Promise<{ error: string | null }> {
    if (!isSupabaseConfigured || !supabase) {
      const devUser: AuthUser = { id: 'dev-user', email, role: 'admin' }
      setUser(devUser)
      localStorage.setItem('culo_dev_user', JSON.stringify(devUser))
      return { error: null }
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }

  async function signUp(email: string, password: string): Promise<{ error: string | null; needsConfirmation: boolean }> {
    if (!isSupabaseConfigured || !supabase) {
      return { error: 'Supabase not configured. Sign up is unavailable in dev mode.', needsConfirmation: false }
    }
    const { data, error } = await supabase.auth.signUp({ email, password })
    return {
      error:              error?.message ?? null,
      needsConfirmation:  !error && !data.session,
    }
  }

  async function signOut(): Promise<void> {
    if (!isSupabaseConfigured || !supabase) {
      setUser(null)
      localStorage.removeItem('culo_dev_user')
      return
    }
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, loading, isConfigured: isSupabaseConfigured, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
