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

  // Step 1: create the Supabase Auth user.
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  })
  if (signUpError) {
    return { error: signUpError.message }
  }
  if (!signUpData.user) {
    return { error: 'Could not create the account. Please try again.' }
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

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
