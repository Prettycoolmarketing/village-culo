import { supabase, isSupabaseConfigured } from '../lib/supabase'
import type { UserRole } from '../contexts/AuthContext'

export interface TeamMember {
  id: string
  email: string
  role: UserRole
  suspended: boolean
}

export interface TeamActionResult {
  success: boolean
  error?: string
}

export interface StaffInvite {
  email: string
  role: UserRole
  createdAt: string
}

/**
 * Every profile with a non-founder role — the current CAPO staff roster.
 * Requires the profiles_owner_read_all RLS policy (migration 007); returns
 * an empty list for anyone who isn't Owner (RLS just won't return rows).
 */
export async function getCapoStaff(): Promise<TeamMember[]> {
  if (!isSupabaseConfigured || !supabase) return []
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, role, suspended')
    .neq('role', 'founder')
    .order('role')
  if (error || !data) return []
  return data.map(row => ({ id: row.id, email: row.email ?? '', role: row.role as UserRole, suspended: row.suspended ?? false }))
}

/**
 * Looks up an existing registered account by exact email — the only way to
 * grant a role today (see the Team page's "search existing user" flow).
 * Real invite-by-email needs a service-role backend, which doesn't exist yet;
 * this function is the seam that would be swapped for a real invite call
 * later without changing the Team page's UI.
 */
export async function findUserByEmail(email: string): Promise<TeamMember | null> {
  if (!isSupabaseConfigured || !supabase) return null
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, role, suspended')
    .ilike('email', email.trim())
    .maybeSingle()
  if (error || !data) return null
  return { id: data.id, email: data.email ?? '', role: data.role as UserRole, suspended: data.suspended ?? false }
}

/** Sets a user's role and suspension via the admin_set_role RPC (migration 007) — Owner-only, enforced server-side. */
export async function setTeamMemberRole(userId: string, role: UserRole, suspended: boolean): Promise<TeamActionResult> {
  if (!isSupabaseConfigured || !supabase) return { success: false, error: 'Supabase not configured.' }
  const { error } = await supabase.rpc('admin_set_role', { target_user_id: userId, new_role: role, new_suspended: suspended })
  if (error) return { success: false, error: error.message }
  return { success: true }
}

export function removeTeamAccess(userId: string): Promise<TeamActionResult> {
  return setTeamMemberRole(userId, 'founder', false)
}

/**
 * Invites someone by email who hasn't signed up yet — the role is held in
 * `staff_invites` and applied automatically by the handle_new_user trigger
 * the moment they create an account with that email (migration 016).
 */
export async function inviteStaffByEmail(email: string, role: UserRole): Promise<TeamActionResult> {
  if (!isSupabaseConfigured || !supabase) return { success: false, error: 'Supabase not configured.' }
  const { error } = await supabase.rpc('admin_invite_staff', { target_email: email.trim(), new_role: role })
  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function cancelStaffInvite(email: string): Promise<TeamActionResult> {
  if (!isSupabaseConfigured || !supabase) return { success: false, error: 'Supabase not configured.' }
  const { error } = await supabase.rpc('admin_cancel_staff_invite', { target_email: email })
  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function getPendingStaffInvites(): Promise<StaffInvite[]> {
  if (!isSupabaseConfigured || !supabase) return []
  const { data, error } = await supabase
    .from('staff_invites')
    .select('email, role, created_at')
    .order('created_at', { ascending: false })
  if (error || !data) return []
  return data.map(row => ({ email: row.email, role: row.role as UserRole, createdAt: row.created_at }))
}
