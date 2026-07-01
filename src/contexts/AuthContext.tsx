import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { syncUserDataFromSupabase } from '../lib/sync'
import type { User } from '@supabase/supabase-js'
import type { VillageRole } from '../types/villageSettings'

/**
 * 'founder' is the only role a real signup ever gets by default. 'admin' / 'editor' /
 * 'moderator' grant access to Village HQ (see RoleProtectedRoute) and must be assigned
 * explicitly — via Supabase user_metadata in production, or VITE_DEV_ADMIN_EMAILS in dev mode.
 * Never widen this default; see Sprint 19A audit for why that was previously a launch blocker.
 */
export type UserRole = 'founder' | 'admin' | 'editor' | 'moderator'

export interface AuthUser {
  id: string
  email: string
  role: UserRole
  /** Links this account directly to a Founder record once set (claim approval, profile creation). */
  founderId?: string
  /** Finer-grained Village HQ permission tier (see VILLAGE_ROLE_CONFIGS). Defaults to `role` when unset. */
  villageRole?: VillageRole
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

const ADMIN_ROLES: UserRole[] = ['admin', 'editor', 'moderator']

/** Comma-separated allowlist of dev-mode emails that should land as admin. Documented in .env.example. */
const DEV_ADMIN_EMAILS = (import.meta.env.VITE_DEV_ADMIN_EMAILS ?? '')
  .split(',')
  .map((e: string) => e.trim().toLowerCase())
  .filter(Boolean)

/**
 * The `profiles` table (Sprint 19B migration 002) is the real source of truth for
 * role/founderId — it has no client UPDATE policy, so unlike auth.user_metadata it
 * cannot be self-edited by the signed-in user. user_metadata is read only as a
 * fallback (e.g. the row hasn't synced yet) and is never trusted for role alone.
 */
async function toAuthUser(supaUser: User): Promise<AuthUser> {
  const meta = supaUser.user_metadata ?? {}
  const fallbackRole: UserRole = ADMIN_ROLES.includes(meta.role) ? meta.role : 'founder'

  const base: AuthUser = {
    id: supaUser.id,
    email: supaUser.email ?? '',
    role: fallbackRole,
    founderId: typeof meta.founder_id === 'string' ? meta.founder_id : undefined,
    villageRole: typeof meta.village_role === 'string' ? (meta.village_role as VillageRole) : undefined,
  }

  if (!supabase) return base

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, founder_id, village_role')
    .eq('id', supaUser.id)
    .maybeSingle()

  if (!profile) return base

  return {
    ...base,
    role: (['founder', ...ADMIN_ROLES].includes(profile.role) ? profile.role : base.role) as UserRole,
    founderId: profile.founder_id ?? base.founderId,
    villageRole: (profile.village_role as VillageRole | null) ?? base.villageRole,
  }
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

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) setUser(await toAuthUser(session.user))
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      void (async () => {
        setUser(session?.user ? await toAuthUser(session.user) : null)
        if (event === 'SIGNED_IN' && session?.user) {
          void syncUserDataFromSupabase()
        }
      })()
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signIn(email: string, password: string): Promise<{ error: string | null }> {
    if (!isSupabaseConfigured || !supabase) {
      const isDevAdmin = DEV_ADMIN_EMAILS.includes(email.trim().toLowerCase())
      const devUser: AuthUser = {
        id: isDevAdmin ? 'dev-admin' : 'dev-user',
        email,
        role: isDevAdmin ? 'admin' : 'founder',
      }
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
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/dashboard/home` },
    })
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
