'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentFirmId, getCurrentRole } from './helpers'
import { revalidatePath } from 'next/cache'

const APPROVER_ROLES = ['owner', 'senior_surveyor'] as const

export type ValuationActionState = { error: string } | null

const PURPOSES = ['mortgage', 'insurance', 'probate', 'rating', 'litigation', 'sale'] as const
const METHODS = ['comparative', 'investment', 'cost', 'profits'] as const

export async function createValuationJob(
  _prevState: ValuationActionState,
  formData: FormData
): Promise<ValuationActionState> {
  const clientName = formData.get('clientName') as string
  const propertyId = (formData.get('propertyId') as string) || null
  const purpose = formData.get('purpose') as string
  const method = formData.get('method') as string
  const feeRaw = formData.get('fee') as string

  if (!clientName?.trim()) {
    return { error: 'Client name is required.' }
  }
  if (!PURPOSES.includes(purpose as (typeof PURPOSES)[number])) {
    return { error: 'Please choose a valid purpose.' }
  }
  if (!METHODS.includes(method as (typeof METHODS)[number])) {
    return { error: 'Please choose a valid method.' }
  }
  const fee = feeRaw ? Number(feeRaw) : 0
  if (feeRaw && (Number.isNaN(fee) || fee < 0)) {
    return { error: 'Fee must be a positive number.' }
  }

  const supabase = await createClient()
  const firm = await getCurrentFirmId(supabase)
  if ('error' in firm) return firm

  const { error } = await supabase.from('valuation_jobs').insert({
    firm_id: firm.firmId,
    client_name: clientName.trim(),
    property_id: propertyId || null,
    purpose,
    method,
    fee,
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/valuations')
  return null
}

const STAGES = ['instructed', 'inspection', 'draft', 'approved'] as const

export async function updateValuationCalculation(
  _prevState: ValuationActionState,
  formData: FormData
): Promise<ValuationActionState> {
  const jobId = formData.get('jobId') as string
  const passingRentRaw = formData.get('passingRent') as string
  const yieldPctRaw = formData.get('yieldPct') as string
  const adjustmentsRaw = formData.get('adjustments') as string

  const passingRent = Number(passingRentRaw)
  const yieldPct = Number(yieldPctRaw)
  const adjustments = adjustmentsRaw ? Number(adjustmentsRaw) : 0

  if (Number.isNaN(passingRent) || passingRent < 0) {
    return { error: 'Passing rent must be a positive number.' }
  }
  if (Number.isNaN(yieldPct) || yieldPct <= 0 || yieldPct > 100) {
    return { error: 'Yield must be a percentage between 0 and 100.' }
  }
  if (Number.isNaN(adjustments)) {
    return { error: 'Adjustments must be a number.' }
  }

  // Investment method: capital value = net passing rent capitalised at the
  // chosen yield, then adjusted for anything the standard formula doesn't
  // capture (dilapidations, reversionary potential, etc).
  const marketValue = passingRent / (yieldPct / 100) + adjustments

  const supabase = await createClient()
  const { error } = await supabase
    .from('valuation_jobs')
    .update({
      passing_rent: passingRent,
      yield_pct: yieldPct,
      adjustments,
      market_value: marketValue,
    })
    .eq('id', jobId)

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/valuations/${jobId}`)
  revalidatePath('/dashboard/valuations')
  return null
}

export async function advanceValuationStage(
  _prevState: ValuationActionState,
  formData: FormData
): Promise<ValuationActionState> {
  const jobId = formData.get('jobId') as string
  const currentStage = formData.get('currentStage') as string

  const currentIndex = STAGES.indexOf(currentStage as (typeof STAGES)[number])
  if (currentIndex === -1 || currentIndex === STAGES.length - 1) {
    return { error: 'This job is already at its final stage.' }
  }
  const nextStage = STAGES[currentIndex + 1]

  const supabase = await createClient()

  if (nextStage === 'approved') {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) return { error: 'Your session has expired. Please sign in again.' }

    // Friendly error only — valuation_jobs_update_own_firm's WITH CHECK
    // (supabase/05_role_gating_and_invitations.sql) is what actually blocks
    // this for anyone but an owner or senior surveyor, regardless of what
    // this check does.
    const role = await getCurrentRole(supabase)
    if ('error' in role) return role
    if (!APPROVER_ROLES.includes(role.role as (typeof APPROVER_ROLES)[number])) {
      return { error: 'Only an owner or senior surveyor can approve a valuation.' }
    }

    const { error } = await supabase
      .from('valuation_jobs')
      .update({ stage: nextStage, approved_by: userData.user.id, approved_at: new Date().toISOString() })
      .eq('id', jobId)

    if (error) return { error: error.message }
  } else {
    const { error } = await supabase.from('valuation_jobs').update({ stage: nextStage }).eq('id', jobId)
    if (error) return { error: error.message }
  }

  revalidatePath(`/dashboard/valuations/${jobId}`)
  revalidatePath('/dashboard/valuations')
  revalidatePath('/dashboard')
  return null
}
