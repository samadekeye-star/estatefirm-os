'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentFirmId } from './helpers'
import { revalidatePath } from 'next/cache'

export type PropertyActionState = { error: string } | null

const PROPERTY_TYPES = ['residential', 'commercial', 'industrial', 'land'] as const

export async function createProperty(
  _prevState: PropertyActionState,
  formData: FormData
): Promise<PropertyActionState> {
  const name = formData.get('name') as string
  const address = formData.get('address') as string
  const propertyType = formData.get('propertyType') as string
  const titleType = (formData.get('titleType') as string) || null
  const sizeSqmRaw = formData.get('sizeSqm') as string
  const landlordId = (formData.get('landlordId') as string) || null

  if (!name?.trim() || !address?.trim()) {
    return { error: 'Property name and address are required.' }
  }
  if (!PROPERTY_TYPES.includes(propertyType as (typeof PROPERTY_TYPES)[number])) {
    return { error: 'Please choose a valid property type.' }
  }
  const sizeSqm = sizeSqmRaw ? Number(sizeSqmRaw) : null
  if (sizeSqmRaw && (Number.isNaN(sizeSqm) || (sizeSqm as number) < 0)) {
    return { error: 'Size must be a positive number.' }
  }

  const supabase = await createClient()
  const firm = await getCurrentFirmId(supabase)
  if ('error' in firm) return firm

  const { error } = await supabase.from('properties').insert({
    firm_id: firm.firmId,
    landlord_id: landlordId || null,
    name: name.trim(),
    address: address.trim(),
    property_type: propertyType,
    title_type: titleType,
    size_sqm: sizeSqm,
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/properties')
  return null
}

export async function createUnit(
  _prevState: PropertyActionState,
  formData: FormData
): Promise<PropertyActionState> {
  const propertyId = formData.get('propertyId') as string
  const label = formData.get('label') as string
  const sizeSqmRaw = formData.get('sizeSqm') as string

  if (!propertyId || !label?.trim()) {
    return { error: 'Unit label is required.' }
  }
  const sizeSqm = sizeSqmRaw ? Number(sizeSqmRaw) : null
  if (sizeSqmRaw && (Number.isNaN(sizeSqm) || (sizeSqm as number) < 0)) {
    return { error: 'Size must be a positive number.' }
  }

  const supabase = await createClient()
  const firm = await getCurrentFirmId(supabase)
  if ('error' in firm) return firm

  const { error } = await supabase.from('units').insert({
    firm_id: firm.firmId,
    property_id: propertyId,
    label: label.trim(),
    size_sqm: sizeSqm,
  })

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/properties/${propertyId}`)
  return null
}
