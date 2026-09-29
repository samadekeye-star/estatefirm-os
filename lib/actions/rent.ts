'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type RentActionState = { error: string } | null

export async function recordPayment(
  _prevState: RentActionState,
  formData: FormData
): Promise<RentActionState> {
  const entryId = formData.get('entryId') as string
  const paidAmountRaw = formData.get('paidAmount') as string

  if (!entryId) {
    return { error: 'Missing rent ledger entry.' }
  }

  const supabase = await createClient()

  // rent_ledger_all_own_firm scopes this to the caller's firm — an entry ID
  // from another firm simply won't be found, not a permission error.
  const { data: entry, error: fetchError } = await supabase
    .from('rent_ledger')
    .select('amount')
    .eq('id', entryId)
    .single()

  if (fetchError || !entry) {
    return { error: 'That rent entry could not be found.' }
  }

  const fullAmount = Number(entry.amount)
  const paidAmount = paidAmountRaw ? Number(paidAmountRaw) : fullAmount

  if (Number.isNaN(paidAmount) || paidAmount <= 0) {
    return { error: 'Payment amount must be a positive number.' }
  }

  const status = paidAmount >= fullAmount ? 'paid' : 'partial'

  const { error } = await supabase
    .from('rent_ledger')
    .update({
      status,
      paid_amount: paidAmount,
      paid_date: new Date().toISOString().slice(0, 10),
    })
    .eq('id', entryId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/rent')
  revalidatePath('/dashboard')
  return null
}
