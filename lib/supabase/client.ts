import { createBrowserClient } from '@supabase/ssr'

// Used in Client Components ('use client'). Reads the publishable key,
// which is safe to ship to the browser by design — RLS is what actually
// protects data, not keeping this key secret.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}
