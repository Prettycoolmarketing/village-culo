import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { syncUserDataFromSupabase } from '../lib/sync'
import { syncPublishedContent } from '../lib/publicSync'
import type { User } from '@supabase/supabase-js'

/**
 * 'founder' is the only role a real signup ever gets by default. 'moderator' / 'editor' /
 * 'admin' / 'owner' grant access to CAPO (see RoleProtectedRoute + utils/permissions.ts)
 * and must be assigned explicitly — via the CAPO Team page (Owner-only, migration 007),
 * via Supabase user_metadata in production, or VITE_DEV_ADMIN_EMAILS in dev mode.
 * Never widen this default; see Sprint 19A audit for why that was previously a launch blocker.
 * 'owner' is reserved for the platform owner — see permissions.ts for what each tier can do.
 */
export type UserRole = 'founder' | 'moderator' | 'editor' | 'admin' | 'owner'

export interface AuthUser {
  id: string
  email: string
  role: UserRole
  /** Links this account directly to a Founder record once set (claim approval, profile creation). */
  founderId?: string
  /** Soft suspension — enforced by our own app (ProtectedRoute), not a Supabase Auth-level
   * ban (that needs a service-role backend, which doesn't exist yet — see migration 007). */
  suspended?: boolean
}

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  isConfigured: boolean
  signIn:  (email: string, password: string) => Promise<{ error: string | null }>
  signUp:  (email: string, password: string, redirectPath?: string) => Promise<{ error: string | null; needsConfirmation: boolean; alreadyRegistered: boolean }>
  signOut: () => Promise<void>
  resetPasswordForEmail: (email: string) => Promise<{ error: string | null }>
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const STAFF_ROLES: UserRole[] = ['moderator', 'editor', 'admin', 'owner']

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
type Profile = { role: string; founder_id: string | null; suspended: boolean | null }

async function toAuthUser(supaUser: User, onLateProfile?: (user: AuthUser) => void): Promise<AuthUser> {
  const meta = supaUser.user_metadata ?? {}
  // Nothing in this codebase ever writes `role` into Supabase user_metadata
  // (confirmed: no edge function, no client code, anywhere) — so this
  // fallback is in practice always 'founder' for every staff member, every
  // single time the profiles fetch below times out. That turned the
  // timeout fix (see its own comment) into a different real bug: any CAPO
  // staff member's session silently downgrades to 'founder' — "Staff
  // access required" on a real admin/owner account — whenever that one
  // query is merely slow, not broken, and stayed downgraded for the rest
  // of the session since nothing ever retried it. onLateProfile below is
  // the actual fix for that; this fallback only covers the (rare) case
  // where the profiles row genuinely can't be reached at all.
  const fallbackRole: UserRole = STAFF_ROLES.includes(meta.role) ? meta.role : 'founder'

  const base: AuthUser = {
    id: supaUser.id,
    email: supaUser.email ?? '',
    role: fallbackRole,
    founderId: typeof meta.founder_id === 'string' ? meta.founder_id : undefined,
  }

  if (!supabase) return base

  function toFinal(profile: Profile): AuthUser {
    return {
      ...base,
      role: (['founder', ...STAFF_ROLES].includes(profile.role) ? profile.role : base.role) as UserRole,
      founderId: profile.founder_id ?? base.founderId,
      suspended: profile.suspended ?? false,
    }
  }

  // Confirmed real, live, serious: this had no timeout and nothing
  // downstream caught a hang here — the one `.then()` callback that
  // awaits this (AuthProvider's session restore, below) has setLoading(false)
  // sitting right after it with no finally/catch, so a stalled query (a
  // network blip, RLS slowness, anything short of a clean fast failure)
  // left `loading` stuck true forever. Navbar's entire CTA area, "Log in"
  // included, is gated on `!loading` — stuck loading means no login
  // button ever appears again, not even on a fresh reload, since this
  // runs on every single page load for every user. A few real signups
  // hit exactly this. Falls back to `base` (role/founderId from the
  // session's own metadata) rather than hang indefinitely — kept
  // separate from the actual query promise (profileFetch) so a slow-but-
  // real response can still be used once it lands, see below.
  const profileFetch: Promise<Profile | null> = (async () => {
    try {
      const { data } = await supabase.from('profiles').select('role, founder_id, suspended').eq('id', supaUser.id).maybeSingle()
      return data as Profile | null
    } catch {
      return null
    }
  })()

  const profile = await Promise.race([
    profileFetch,
    new Promise<null>(resolve => setTimeout(() => resolve(null), 8000)),
  ])

  if (profile) return toFinal(profile)

  // Timed out, not necessarily failed — the real query may still land a
  // few seconds later. When it does, correct the session's role in place
  // instead of leaving it stuck on the 'founder' guess for the rest of
  // this session. A no-op when the caller doesn't pass one (e.g. nothing
  // downstream can act on a late correction) or when it never resolves.
  if (onLateProfile) {
    void profileFetch.then(late => { if (late) onLateProfile(toFinal(late)) })
  }
  return base
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
      try {
      if (session?.user) {
        const sessionUserId = session.user.id
        const restoredUser = await toAuthUser(session.user, lateUser => {
          // Only apply if this is still the signed-in session — a late
          // profile response landing after sign-out/switching accounts
          // must never silently reinstate the old user.
          setUser(current => (current?.id === sessionUserId ? lateUser : current))
        })
        setUser(restoredUser)
        // onAuthStateChange's SIGNED_IN branch doesn't fire for a session
        // restored from storage on a plain reload — without this, a CAPO
        // staff member's 'founders' cache would only ever get the full
        // table at the moment they originally signed in, then silently
        // fall back to founders_safe (the same stripped view a visitor
        // gets) on every reload after, since syncPublishedContent() always
        // runs unconditionally on mount too. Re-sync here so a reload
        // gives staff the same real data a fresh sign-in would.
        //
        // Both this call and App.tsx's unconditional syncPublishedContent()
        // write the same 'founders' cache key (full table vs. founders_safe)
        // and pullVisibleRows does a full replace — whichever settles last
        // wins. Awaiting the same memoized public-sync promise first makes
        // the order explicit: the public pull always lands, then (for CAPO
        // staff) this admin pull always overwrites it last, deterministically.
        //
        // Tried making `loading` wait on this sync (so the dashboard never
        // renders before its data has actually landed) and reverted it
        // same session — it blocks `loading` for every page, including the
        // public marketing pages' own Navbar (see Navbar's `loading` ->
        // its "Dashboard" button), not just the admin dashboard that
        // actually needed it. A visitor just waiting for the homepage nav
        // to show a button is a worse, more universal regression than the
        // narrower admin-dashboard staleness this was trying to fix. Real
        // fix still needed is scoped to the dashboard routes specifically
        // (a loading state the Founders/Content pages themselves await,
        // not a global one), not attempted here yet.
        void syncPublishedContent().finally(() => {
          void syncUserDataFromSupabase(STAFF_ROLES.includes(restoredUser.role))
        })
      }
      } catch {
        // toAuthUser already has its own timeout/fallback now, but this
        // belt-and-suspenders catch means literally nothing in here can
        // skip setLoading(false) below — the one thing that must always
        // run no matter what, since the Navbar's login button (and
        // everything else gated on `loading`) depends on it.
      } finally {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      void (async () => {
        const sessionUserId = session?.user?.id
        const nextUser = session?.user
          ? await toAuthUser(session.user, lateUser => {
              setUser(current => (current?.id === sessionUserId ? lateUser : current))
            })
          : null
        setUser(nextUser)
        if (event === 'SIGNED_IN' && session?.user) {
          // See the getSession() branch above for why this awaits the
          // shared public-sync promise first instead of racing it.
          void syncPublishedContent().finally(() => {
            void syncUserDataFromSupabase(!!nextUser && STAFF_ROLES.includes(nextUser.role))
          })
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

  async function signUp(email: string, password: string, redirectPath = '/dashboard/home'): Promise<{ error: string | null; needsConfirmation: boolean; alreadyRegistered: boolean }> {
    if (!isSupabaseConfigured || !supabase) {
      return { error: 'Supabase not configured. Sign up is unavailable in dev mode.', needsConfirmation: false, alreadyRegistered: false }
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}${redirectPath}` },
    })
    // With "Confirm email" on, Supabase deliberately fakes a success when the
    // email already exists (anti-enumeration) — the tell is an empty
    // identities array on the returned user. Surface that so the join flow
    // can send them to sign in / reset instead of "check your email".
    const alreadyRegistered = !error && !data.session && Array.isArray(data.user?.identities) && data.user!.identities!.length === 0
    const rawMsg = error?.message?.trim()
    // This used to say "If you already have one, sign in instead" — wrong
    // and misleading for this branch specifically. alreadyRegistered above
    // is the ONLY reliable signal Supabase gives for "this email already
    // has an account" (confirmed directly: a real new signup attempt for a
    // brand-new email hit this exact branch and showed that text, which
    // sent someone looking for an account that never existed). An opaque/
    // malformed error here just means the signup call failed for some
    // other real reason we can't see — never assume which.
    const friendly = rawMsg && (rawMsg === '{}' || rawMsg.startsWith('{') || /non-2xx/i.test(rawMsg))
      ? 'Something went wrong creating your account. Please try again in a moment — if it keeps happening, contact support.'
      : rawMsg ?? null
    return {
      error:              friendly,
      needsConfirmation:  !error && !data.session && !alreadyRegistered,
      alreadyRegistered,
    }
  }

  async function resetPasswordForEmail(email: string): Promise<{ error: string | null }> {
    if (!isSupabaseConfigured || !supabase) {
      return { error: 'Supabase not configured. Password reset is unavailable in dev mode.' }
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/dashboard/reset-password`,
    })
    // Auth server errors from a misconfigured/failing email provider can come
    // back with no real message (supabase-js then falls back to the raw,
    // unhelpful response body, e.g. literally "{}") — never show that raw text.
    const message = error?.message?.trim()
    const isUninformative = !message || message === '{}' || message.startsWith('{')
    return { error: error ? (isUninformative ? 'Could not send the reset email. Please try again shortly.' : message!) : null }
  }

  async function updatePassword(newPassword: string): Promise<{ error: string | null }> {
    if (!isSupabaseConfigured || !supabase) {
      return { error: 'Supabase not configured. Password reset is unavailable in dev mode.' }
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    const message = error?.message?.trim()
    const isUninformative = !message || message === '{}' || message.startsWith('{')
    return { error: error ? (isUninformative ? 'Could not update your password. Please try again.' : message!) : null }
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
    <AuthContext.Provider value={{ user, loading, isConfigured: isSupabaseConfigured, signIn, signUp, signOut, resetPasswordForEmail, updatePassword }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
