'use client'

import { useActionState, useRef, useEffect } from 'react'
import { createProperty } from '@/lib/actions/properties'

type Landlord = { id: string; name: string }

export function NewPropertyForm({ landlords }: { landlords: Landlord[] }) {
  const [state, formAction, pending] = useActionState(createProperty, null)
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
      <h2 className="text-sm font-semibold text-ink">Add property</h2>

      {state?.error && (
        <div className="bg-clay-bg text-clay text-sm px-3.5 py-2.5 rounded-md">{state.error}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="block text-xs text-ink-soft mb-1.5">Property name</label>
          <input
            type="text"
            name="name"
            required
            placeholder="e.g. Ikeja Heights"
            className="w-full px-3.5 py-2.5 border border-line rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brass/40"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs text-ink-soft mb-1.5">Address</label>
          <input
            type="text"
            name="address"
            required
            placeholder="Street, area, city"
            className="w-full px-3.5 py-2.5 border border-line rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brass/40"
          />
        </div>
        <div>
          <label className="block text-xs text-ink-soft mb-1.5">Type</label>
          <select
            name="propertyType"
            defaultValue="residential"
            className="w-full px-3.5 py-2.5 border border-line rounded-md text-sm bg-panel focus:outline-none focus:ring-2 focus:ring-brass/40"
          >
            <option value="residential">Residential</option>
            <option value="commercial">Commercial</option>
            <option value="industrial">Industrial</option>
            <option value="land">Land</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-ink-soft mb-1.5">Landlord</label>
          <select
            name="landlordId"
            defaultValue=""
            className="w-full px-3.5 py-2.5 border border-line rounded-md text-sm bg-panel focus:outline-none focus:ring-2 focus:ring-brass/40"
          >
            <option value="">None yet</option>
            {landlords.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-ink-soft mb-1.5">Title type</label>
          <input
            type="text"
            name="titleType"
            placeholder="e.g. C of O"
            className="w-full px-3.5 py-2.5 border border-line rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brass/40"
          />
        </div>
        <div>
          <label className="block text-xs text-ink-soft mb-1.5">Size (sqm)</label>
          <input
            type="number"
            name="sizeSqm"
            min={0}
            step="0.1"
            className="w-full px-3.5 py-2.5 border border-line rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brass/40"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="bg-ink text-bone rounded-md px-4 py-2.5 text-sm font-medium disabled:opacity-60"
      >
        {pending ? 'Adding…' : 'Add property'}
      </button>
    </form>
  )
}
