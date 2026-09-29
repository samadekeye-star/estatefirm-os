import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Used in Server Components, Server Actions, and Route Handlers. Reads the
// caller's session from cookies, so every query made with this client is
// automatically scoped to whoever is actually logged in on this request —
// there's no separate step to "pass the user's identity in," which is what
// makes it hard to accidentally query as the wrong person.
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from a Server Component that can't set cookies (no
            // response to attach them to) — middleware.ts is what actually
            // refreshes the session on every request, so this is safe to
            // ignore here rather than crash the render.
          }
        },
      },
    }
  )
}
