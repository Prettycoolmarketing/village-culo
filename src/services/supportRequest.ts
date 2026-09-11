import { supabase, isSupabaseConfigured } from '../lib/supabase'

export async function submitSupportRequest(input: { name: string; email: string; message: string; source?: string }): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured || !supabase) return { success: false, error: 'Not available in this environment' }
  const { data, error } = await supabase.functions.invoke<{ success?: boolean; error?: string }>('submit-support-request', { body: input })
  if (error) return { success: false, error: error.message }
  if (data?.error) return { success: false, error: data.error }
  return { success: true }
}
