'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { login } from '@/lib/actions/auth'

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, null)

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink p-6">
      <div className="w-full max-w-sm bg-panel rounded-xl p-10 pb-8 shadow-2xl">
        <div className="flex items-center gap-2.5 mb-1">
          <svg width="24" height="24" viewBox="0 0 26 26" fill="none">
            <circle cx="13" cy="13" r="12" stroke="#A9814F" strokeWidth="1.4" />
            <path d="M13 4 L13 8 M13 18 L13 22 M4 13 L8 13 M18 13 L22 13" stroke="#A9814F" strokeWidth="1.4" />
            <circle cx="13" cy="13" r="3" fill="#A9814F" />
          </svg>
          <span className="font-serif text-lg font-semibold text-ink">EstateFirm OS</span>
        </div>
        <p className="text-sm text-ink-soft mb-7">Sign in to your firm&rsquo;s workspace.</p>

        {state?.error && (
          <div className="bg-clay-bg text-clay text-sm px-3.5 py-2.5 rounded-md mb-4">
            {state.error}
          </div>
        )}

        <form action={formAction} className="space-y-4">
          <div>
            <label className="block text-xs text-ink-soft mb-1.5">Email</label>
            <input
              type="email"
              name="email"
              required
              placeholder="you@yourfirm.ng"
              className="w-full px-3.5 py-2.5 border border-line rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brass/40"
            />
          </div>
          <div>
            <label className="block text-xs text-ink-soft mb-1.5">Password</label>
            <input
              type="password"
              name="password"
              required
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 border border-line rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brass/40"
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="w-full bg-ink text-bone rounded-md py-2.5 text-sm font-medium disabled:opacity-60"
          >
            {pending ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-xs text-ink-soft mt-6">
          New firm?{' '}
          <Link href="/signup" className="text-brass-deep font-medium">
            Register your firm
          </Link>
        </p>
      </div>
    </div>
  )
}
