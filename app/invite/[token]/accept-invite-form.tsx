'use client'

import { useActionState } from 'react'
import { signupViaInvite } from '@/lib/actions/auth'

export function AcceptInviteForm({ token, email }: { token: string; email: string }) {
  const [state, formAction, pending] = useActionState(signupViaInvite, null)

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />

      {state?.error && <div className="bg-clay-bg text-clay text-sm px-3.5 py-2.5 rounded-md">{state.error}</div>}

      <div>
        <label className="block text-xs text-ink-soft mb-1.5">Email</label>
        <input
          type="email"
          value={email}
          disabled
          className="w-full px-3.5 py-2.5 border border-line rounded-md text-sm bg-bone-dim text-ink-soft"
        />
      </div>
      <div>
        <label className="block text-xs text-ink-soft mb-1.5">Your name</label>
        <input
          type="text"
          name="name"
          required
          placeholder="Your full name"
          className="w-full px-3.5 py-2.5 border border-line rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brass/40"
        />
      </div>
      <div>
        <label className="block text-xs text-ink-soft mb-1.5">Password</label>
        <input
          type="password"
          name="password"
          required
          minLength={8}
          placeholder="At least 8 characters"
          className="w-full px-3.5 py-2.5 border border-line rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brass/40"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-ink text-bone rounded-md px-4 py-2.5 text-sm font-medium disabled:opacity-60"
      >
        {pending ? 'Joining…' : 'Join the firm'}
      </button>
    </form>
  )
}
