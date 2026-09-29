import type { SupabaseClient } from '@supabase/supabase-js'

// Shared by every create action: the firm_id to insert with never comes from
// the client (a hidden form field would be trivial to tamper with) — it's
// always looked up server-side from the caller's own profile. The
// landlords_all_own_firm-style WITH CHECK policies would reject a spoofed
// value anyway, but this is simpler than asking every form to not ask.
export async function getCurrentFirmId(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>
): Promise<{ firmId: string } | { error: string }> {
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) {
    return { error: 'Your session has expired. Please sign in again.' }
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('firm_id')
    .eq('id', userData.user.id)
    .single()

  if (error || !profile) {
    return { error: 'Could not determine your firm. Please sign in again.' }
  }

  return { firmId: profile.firm_id as string }
}
