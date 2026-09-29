'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type LandlordActionState = { error: string } | null

export async function createLandlord(
  _prevState: LandlordActionState,
  formData: FormData
): Promise<LandlordActionState> {
  const name = formData.get('name') as string
  const phone = (formData.get('phone') as string) || null
  const email = (formData.get('email') as string) || null
  const bankName = (formData.get('bankName') as string) || null
  const bankAccount = (formData.get('bankAccount') as string) || null
  const commissionRateRaw = formData.get('commissionRate') as string

  if (!name || !name.trim()) {
    return { error: 'Landlord name is required.' }
  }

  const commissionRate = commissionRateRaw ? Number(commissionRateRaw) : 10
  if (Number.isNaN(commissionRate) || commissionRate < 0 || commissionRate > 100) {
    return { error: 'Commission rate must be a number between 0 and 100.' }
  }

  const supabase = await createClient()

  // No firm_id is passed in from the client — it isn't in this form at all.
  // The landlords_all_own_firm policy's WITH CHECK would reject a spoofed
  // value anyway, but the simplest thing here is to just not ask for one:
  // it's set by a trigger-free default via current_firm_id() only through
  // the RLS check, so we must supply it explicitly to satisfy NOT NULL —
  // pulled from the caller's own profile, not from client input.
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) {
    return { error: 'Your session has expired. Please sign in again.' }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('firm_id')
    .eq('id', userData.user.id)
    .single()

  if (profileError || !profile) {
    return { error: 'Could not determine your firm. Please sign in again.' }
  }

  const { error } = await supabase.from('landlords').insert({
    firm_id: profile.firm_id,
    name: name.trim(),
    phone,
    email,
    bank_name: bankName,
    bank_account: bankAccount,
    commission_rate: commissionRate,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/landlords')
  return null
}
