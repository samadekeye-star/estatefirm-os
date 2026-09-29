'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentFirmId } from './helpers'
import { revalidatePath } from 'next/cache'

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
