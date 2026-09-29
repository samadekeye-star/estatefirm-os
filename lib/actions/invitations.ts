'use server'

import { randomUUID } from 'crypto'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { getCurrentFirmId, getCurrentRole } from './helpers'
import { revalidatePath } from 'next/cache'

export type InvitationActionState = { error: string } | { link: string } | null

const ROLES = ['owner', 'senior_surveyor', 'staff', 'read_only'] as const

async function currentOrigin() {
  const h = await headers()
  const proto = h.get('x-forwarded-proto') ?? 'https'
  const host = h.get('host')
  return `${proto}://${host}`
}

export async function createInvitation(
  _prevState: InvitationActionState,
  formData: FormData
): Promise<InvitationActionState> {
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const role = formData.get('role') as string

  if (!email) return { error: 'Email is required.' }
  if (!ROLES.includes(role as (typeof ROLES)[number])) return { error: 'Please choose a valid role.' }

  const supabase = await createClient()

  // Friendly error only — invitations_insert_owner_only's WITH CHECK
  // (supabase/05_role_gating_and_invitations.sql) is what actually stops
  // anyone but an owner from creating an invitation.
  const roleResult = await getCurrentRole(supabase)
  if ('error' in roleResult) return roleResult
  if (roleResult.role !== 'owner') return { error: 'Only an owner can invite staff.' }

  const firm = await getCurrentFirmId(supabase)
  if ('error' in firm) return firm

  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return { error: 'Your session has expired. Please sign in again.' }

  const token = randomUUID()

  const { error } = await supabase.from('invitations').insert({
    firm_id: firm.firmId,
    email,
    role,
    token,
    invited_by: userData.user.id,
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/staff')

  const origin = await currentOrigin()
  return { link: `${origin}/invite/${token}` }
}

export async function revokeInvitation(invitationId: string): Promise<{ error: string } | null> {
  const supabase = await createClient()
  const { error } = await supabase.from('invitations').update({ status: 'revoked' }).eq('id', invitationId)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/staff')
  return null
}
