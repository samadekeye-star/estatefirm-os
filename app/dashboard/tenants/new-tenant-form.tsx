'use client'

import { useActionState, useRef, useEffect } from 'react'
import { createTenant } from '@/lib/actions/tenants'

export function NewTenantForm() {
  const [state, formAction, pending] = useActionState(createTenant, null)
  const formRef = useRef<HTMLFormElement>(null)
  const wasPending = useRef(false)

  useEffect(() => {
    if (wasPending.current && !pending && !state?.error) {
      formRef.current?.reset()
    }
    wasPending.current = pending
  }, [pending, state])

  return (
    <form ref={formRef} action={formAction} className="bg-panel border border-line rounded-xl p-5 space-y-4">
      <h2 className="text-sm font-semibold text-ink">Add tenant</h2>

      {state?.error && (
        <div className="bg-clay-bg text-clay text-sm px-3.5 py-2.5 rounded-md">{state.error}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="block text-xs text-ink-soft mb-1.5">Name</label>
          <input
            type="text"
            name="name"
            required
            placeholder="Tenant's full name"
            className="w-full px-3.5 py-2.5 border border-line rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brass/40"
          />
        </div>
        <div>
          <label className="block text-xs text-ink-soft mb-1.5">Phone</label>
          <input
            type="text"
            name="phone"
            placeholder="080…"
            className="w-full px-3.5 py-2.5 border border-line rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brass/40"
          />
        </div>
        <div>
          <label className="block text-xs text-ink-soft mb-1.5">Email</label>
          <input
            type="email"
            name="email"
            placeholder="tenant@email.com"
            className="w-full px-3.5 py-2.5 border border-line rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brass/40"
          />
        </div>
        <div>
          <label className="block text-xs text-ink-soft mb-1.5">Guarantor name</label>
          <input
            type="text"
            name="guarantorName"
            className="w-full px-3.5 py-2.5 border border-line rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brass/40"
          />
        </div>
        <div>
          <label className="block text-xs text-ink-soft mb-1.5">Guarantor phone</label>
          <input
            type="text"
            name="guarantorPhone"
            className="w-full px-3.5 py-2.5 border border-line rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brass/40"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="bg-ink text-bone rounded-md px-4 py-2.5 text-sm font-medium disabled:opacity-60"
      >
        {pending ? 'Adding…' : 'Add tenant'}
      </button>
    </form>
  )
}
