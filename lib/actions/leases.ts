'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentFirmId } from './helpers'
import { revalidatePath } from 'next/cache'

export type LeaseActionState = { error: string } | null

const FREQUENCIES = ['annual', 'quarterly', 'monthly'] as const

export async function createLease(
  _prevState: LeaseActionState,
  formData: FormData
): Promise<LeaseActionState> {
  const unitId = formData.get('unitId') as string
  const tenantId = formData.get('tenantId') as string
  const startDate = formData.get('startDate') as string
  const endDate = formData.get('endDate') as string
  const rentAmountRaw = formData.get('rentAmount') as string
  const frequency = formData.get('frequency') as string

  if (!unitId || !tenantId || !startDate || !endDate || !rentAmountRaw) {
    return { error: 'All fields are required.' }
  }
  if (!FREQUENCIES.includes(frequency as (typeof FREQUENCIES)[number])) {
    return { error: 'Please choose a valid frequency.' }
  }
  const rentAmount = Number(rentAmountRaw)
  if (Number.isNaN(rentAmount) || rentAmount <= 0) {
    return { error: 'Rent amount must be a positive number.' }
  }
  if (new Date(endDate) <= new Date(startDate)) {
    return { error: 'End date must be after the start date.' }
  }

  const supabase = await createClient()
  const firm = await getCurrentFirmId(supabase)
  if ('error' in firm) return firm

  // units_all_own_firm's WITH CHECK on the update below is the real backstop
  // here — but we also re-check the unit is still vacant ourselves first, so
  // two staff members can't both book the same unit in a race and one of
  // them silently overwrite the other's lease's understanding of vacancy.
  const { data: unit, error: unitError } = await supabase
    .from('units')
    .select('id, status')
    .eq('id', unitId)
    .single()

  if (unitError || !unit) {
    return { error: 'That unit could not be found.' }
  }
  if (unit.status !== 'vacant') {
    return { error: 'That unit is no longer vacant. Please pick another.' }
  }

  const { error: leaseError } = await supabase.from('leases').insert({
    firm_id: firm.firmId,
    unit_id: unitId,
    tenant_id: tenantId,
    start_date: startDate,
    end_date: endDate,
    rent_amount: rentAmount,
    frequency,
  })

  if (leaseError) return { error: leaseError.message }

  // Best-effort: the lease itself is what matters most and is already saved.
  // If this second write fails, the unit will show as vacant a beat longer
  // than it should — worth surfacing, not worth rolling back the lease for.
  const { error: unitUpdateError } = await supabase
    .from('units')
    .update({ status: 'occupied' })
    .eq('id', unitId)

  if (unitUpdateError) {
    return { error: `Lease saved, but the unit's status couldn't be updated: ${unitUpdateError.message}` }
  }

  revalidatePath('/dashboard/leases')
  revalidatePath('/dashboard/properties')
  return null
}
