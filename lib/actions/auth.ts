'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export type AuthActionState = { error: string } | null

export async function login(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are both required.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    // Supabase's own message is already safe to show as-is (doesn't reveal
    // whether the email exists), so we pass it straight through.
    return { error: error.message }
  }

  redirect('/dashboard')
}

export async function signup(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const firmName = formData.get('firmName') as string
  const ownerName = formData.get('ownerName') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!firmName || !ownerName || !email || !password) {
    return { error: 'All fields are required.' }
  }
  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters.' }
  }

  const supabase = await createClient()

  // Step 1: create the Supabase Auth user. The firm/owner name go into this
  // user's own metadata so they survive even if there's no session yet
  // (see below) — bootstrapProfile() reads them back later to finish setup.
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { firm_name: firmName, owner_name: ownerName } },
  })
  if (signUpError) {
    return { error: signUpError.message }
  }
  if (!signUpData.user) {
    return { error: 'Could not create the account. Please try again.' }
  }

  // If this Supabase project requires email confirmation, signUp() creates
  // the user but does NOT start a session — auth.uid() is null until they
  // click the confirmation link and log in. Calling the firm-creation RPC
  // right now would (correctly) be rejected by its own "must be logged in"
  // guard, so we don't even try; bootstrapProfile() finishes the job on
  // their first authenticated visit to /dashboard instead.
  if (!signUpData.session) {
    redirect('/signup/check-email')
  }

  // Step 2: create the firm + profile via the RPC from 03_functions.sql.
  // This runs as the just-created user (their session cookie was set by
  // signUp above), so it's subject to that function's own guard clauses —
  // not a separate elevated step we have to trust blindly.
  const subdomain = slugify(firmName)
  const { error: rpcError } = await supabase.rpc('create_firm_and_profile', {
    p_firm_name: firmName,
    p_subdomain: subdomain,
    p_owner_name: ownerName,
  })

  if (rpcError) {
    return { error: `Account created, but firm setup failed: ${rpcError.message}` }
  }

  redirect('/dashboard')
}

// Runs the same firm-creation RPC as signup() above, but from the dashboard
// layout, for a user who has a session and no profile yet — the case where
// email confirmation was required, so signup() couldn't create the firm at
// signup time and stashed firm_name/owner_name in the user's own metadata
// instead. Safe to call on every dashboard visit: a no-op once the profile
// exists, and the RPC itself refuses to run twice for the same user.
//
// Also handles the parallel case for an invited staff member: signupViaInvite()
// below stashes an invitation_token instead of firm_name/owner_name, and
// this calls accept_invitation() (supabase/05_role_gating_and_invitations.sql)
// instead of create_firm_and_profile() when it finds one.
export async function bootstrapProfileIfNeeded(): Promise<{ error: string } | null> {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) {
    return { error: 'Not signed in.' }
  }

  const invitationToken = userData.user.user_metadata?.invitation_token as string | undefined
  if (invitationToken) {
    const { error } = await supabase.rpc('accept_invitation', { p_token: invitationToken })
    return error ? { error: error.message } : null
  }

  const firmName = userData.user.user_metadata?.firm_name as string | undefined
  const ownerName = userData.user.user_metadata?.owner_name as string | undefined
  if (!firmName || !ownerName) {
    // Nothing to bootstrap from (e.g. this user signed up before this
    // metadata was captured) — not our problem to solve here.
    return { error: 'Missing firm details for this account.' }
  }

  const { error } = await supabase.rpc('create_firm_and_profile', {
    p_firm_name: firmName,
    p_subdomain: slugify(firmName),
    p_owner_name: ownerName,
  })

  return error ? { error: error.message } : null
}

// The invite-accept counterpart to signup() above. Email and role come from
// the invitation itself (looked up server-side, never trusted from the
// form), so there's nothing here a tampered request could use to join a
// different firm or grant itself a different role.
export async function signupViaInvite(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const token = formData.get('token') as string
  const name = formData.get('name') as string
  const password = formData.get('password') as string

  if (!token || !name || !password) {
    return { error: 'All fields are required.' }
  }
  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters.' }
  }

  const supabase = await createClient()

  const { data: invitationData, error: invitationError } = await supabase
    .rpc('get_invitation_by_token', { p_token: token })
    .single()
  const invitation = invitationData as { firm_name: string; role: string; email: string; valid: boolean } | null

  if (invitationError || !invitation || !invitation.valid) {
    return { error: 'This invitation is invalid or has expired.' }
  }

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: invitation.email,
    password,
    options: { data: { invitation_token: token, invitee_name: name } },
  })
  if (signUpError) return { error: signUpError.message }
  if (!signUpData.user) return { error: 'Could not create the account. Please try again.' }

  if (!signUpData.session) {
    redirect('/signup/check-email')
  }

  const { error: rpcError } = await supabase.rpc('accept_invitation', { p_token: token })
  if (rpcError) {
    return { error: `Account created, but joining the firm failed: ${rpcError.message}` }
  }

  redirect('/dashboard')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
