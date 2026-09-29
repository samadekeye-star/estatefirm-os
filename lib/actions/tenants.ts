'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentFirmId } from './helpers'
import { revalidatePath } from 'next/cache'

export type TenantActionState = { error: string } | null

export async function createTenant(
  _prevState: TenantActionState,
  formData: FormData
): Promise<TenantActionState> {
  const name = formData.get('name') as string
  const phone = (formData.get('phone') as string) || null
  const email = (formData.get('email') as string) || null
  const guarantorName = (formData.get('guarantorName') as string) || null
  const guarantorPhone = (formData.get('guarantorPhone') as string) || null

  if (!name?.trim()) {
    return { error: 'Tenant name is required.' }
  }

  const supabase = await createClient()
  const firm = await getCurrentFirmId(supabase)
  if ('error' in firm) return firm

  const { error } = await supabase.from('tenants').insert({
    firm_id: firm.firmId,
    name: name.trim(),
    phone,
    email,
    guarantor_name: guarantorName,
    guarantor_phone: guarantorPhone,
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/tenants')
  return null
}
