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

  const { data: lease, error: leaseError } = await supabase
    .from('leases')
    .insert({
      firm_id: firm.firmId,
      unit_id: unitId,
      tenant_id: tenantId,
      start_date: startDate,
      end_date: endDate,
      rent_amount: rentAmount,
      frequency,
    })
    .select('id')
    .single()

  if (leaseError || !lease) return { error: leaseError?.message ?? 'Could not create the lease.' }

  // Best-effort from here on: the lease itself is what matters most and is
  // already saved. If either of these two follow-up writes fails, that's
  // worth surfacing, but not worth rolling back the lease for.
  const { error: unitUpdateError } = await supabase
    .from('units')
    .update({ status: 'occupied' })
    .eq('id', unitId)

  if (unitUpdateError) {
    return { error: `Lease saved, but the unit's status couldn't be updated: ${unitUpdateError.message}` }
  }

  const scheduleError = await generateRentLedger(supabase, {
    firmId: firm.firmId,
    leaseId: lease.id as string,
    startDate,
    endDate,
    rentAmount,
    frequency: frequency as (typeof FREQUENCIES)[number],
  })

  if (scheduleError) {
    return { error: `Lease saved, but the rent schedule couldn't be generated: ${scheduleError}` }
  }

  revalidatePath('/dashboard/leases')
  revalidatePath('/dashboard/properties')
  revalidatePath('/dashboard/rent')
  revalidatePath('/dashboard')
  return null
}

// Builds one rent_ledger row per period from the lease's start date up to
// (but not including) its end date — each row is what's owed for that
// period, at 'due' status, ready for a payment to be recorded against it
// later. A lease running well past a normal term is capped rather than
// looped forever on a typo'd end date decades out.
const MAX_LEDGER_ENTRIES = 120

async function generateRentLedger(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  opts: {
    firmId: string
    leaseId: string
    startDate: string
    endDate: string
    rentAmount: number
    frequency: (typeof FREQUENCIES)[number]
  }
): Promise<string | null> {
  const stepMonths = { monthly: 1, quarterly: 3, annual: 12 }[opts.frequency]

  const end = new Date(opts.endDate)
  const rows: { firm_id: string; lease_id: string; due_date: string; amount: number; status: string }[] = []

  let cursor = new Date(opts.startDate)
  let guard = 0
  while (cursor < end && guard < MAX_LEDGER_ENTRIES) {
    rows.push({
      firm_id: opts.firmId,
      lease_id: opts.leaseId,
      due_date: cursor.toISOString().slice(0, 10),
      amount: opts.rentAmount,
      status: 'due',
    })
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + stepMonths, cursor.getDate())
    guard += 1
  }

  if (rows.length === 0) return null

  const { error } = await supabase.from('rent_ledger').insert(rows)
  return error ? error.message : null
}

// Manual, staff-triggered status changes. Unlike 'renewal_due' (computed at
// display time — see lib/lease-status.ts), these two are real decisions a
// person makes, not a date crossing a threshold, so they're stored.
export async function serveNotice(leaseId: string): Promise<{ error: string } | null> {
  const supabase = await createClient()
  const { error } = await supabase.from('leases').update({ status: 'notice_served' }).eq('id', leaseId)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/leases')
  revalidatePath('/dashboard')
  return null
}

export async function markVacated(leaseId: string): Promise<{ error: string } | null> {
  const supabase = await createClient()

  const { data: lease, error: leaseError } = await supabase
    .from('leases')
    .select('id, unit_id')
    .eq('id', leaseId)
    .single()
  if (leaseError || !lease) return { error: 'That lease could not be found.' }

  const { error: updateError } = await supabase.from('leases').update({ status: 'vacated' }).eq('id', leaseId)
  if (updateError) return { error: updateError.message }

  // Best-effort: the lease is already updated, which is what matters most.
  const { error: unitError } = await supabase.from('units').update({ status: 'vacant' }).eq('id', lease.unit_id)
  if (unitError) {
    return { error: `Lease marked vacated, but the unit's status couldn't be updated: ${unitError.message}` }
  }

  revalidatePath('/dashboard/leases')
  revalidatePath('/dashboard/properties')
  revalidatePath('/dashboard')
  return null
}
