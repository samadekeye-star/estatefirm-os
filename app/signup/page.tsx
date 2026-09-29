'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { signup } from '@/lib/actions/auth'

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signup, null)

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
        <p className="text-sm text-ink-soft mb-7">Register your firm &mdash; a private workspace, ready in a minute.</p>

        {state?.error && (
          <div className="bg-clay-bg text-clay text-sm px-3.5 py-2.5 rounded-md mb-4">
            {state.error}
          </div>
        )}

        <form action={formAction} className="space-y-4">
          <div>
            <label className="block text-xs text-ink-soft mb-1.5">Firm name</label>
            <input
              type="text"
              name="firmName"
              required
              placeholder="e.g. Balogun & Co Surveyors"
              className="w-full px-3.5 py-2.5 border border-line rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brass/40"
            />
          </div>
          <div>
            <label className="block text-xs text-ink-soft mb-1.5">Your name</label>
            <input
              type="text"
              name="ownerName"
              required
              placeholder="Your full name"
              className="w-full px-3.5 py-2.5 border border-line rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brass/40"
            />
          </div>
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
              placeholder="At least 8 characters"
              className="w-full px-3.5 py-2.5 border border-line rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brass/40"
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="w-full bg-ink text-bone rounded-md py-2.5 text-sm font-medium disabled:opacity-60"
          >
            {pending ? 'Creating your workspace…' : 'Create firm workspace'}
          </button>
        </form>

        <p className="text-center text-xs text-ink-soft mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-brass-deep font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
