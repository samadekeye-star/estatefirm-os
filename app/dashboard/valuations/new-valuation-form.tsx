'use client'

import { useActionState, useRef, useEffect } from 'react'
import { createValuationJob } from '@/lib/actions/valuations'

type Property = { id: string; name: string }

export function NewValuationForm({ properties }: { properties: Property[] }) {
  const [state, formAction, pending] = useActionState(createValuationJob, null)
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
      <h2 className="text-sm font-semibold text-ink">New valuation job</h2>

      {state?.error && (
        <div className="bg-clay-bg text-clay text-sm px-3.5 py-2.5 rounded-md">{state.error}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="block text-xs text-ink-soft mb-1.5">Client name</label>
          <input
            type="text"
            name="clientName"
            required
            placeholder="Who commissioned this valuation"
            className="w-full px-3.5 py-2.5 border border-line rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brass/40"
          />
        </div>
        <div>
          <label className="block text-xs text-ink-soft mb-1.5">Property</label>
          <select
            name="propertyId"
            defaultValue=""
            className="w-full px-3.5 py-2.5 border border-line rounded-md text-sm bg-panel focus:outline-none focus:ring-2 focus:ring-brass/40"
          >
            <option value="">Not on file yet</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-ink-soft mb-1.5">Purpose</label>
          <select
            name="purpose"
            defaultValue="mortgage"
            className="w-full px-3.5 py-2.5 border border-line rounded-md text-sm bg-panel focus:outline-none focus:ring-2 focus:ring-brass/40"
          >
            <option value="mortgage">Mortgage</option>
            <option value="insurance">Insurance</option>
            <option value="probate">Probate</option>
            <option value="rating">Rating</option>
            <option value="litigation">Litigation</option>
            <option value="sale">Sale</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-ink-soft mb-1.5">Method</label>
          <select
            name="method"
            defaultValue="comparative"
            className="w-full px-3.5 py-2.5 border border-line rounded-md text-sm bg-panel focus:outline-none focus:ring-2 focus:ring-brass/40"
          >
            <option value="comparative">Comparative</option>
            <option value="investment">Investment</option>
            <option value="cost">Cost</option>
            <option value="profits">Profits</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-ink-soft mb-1.5">Fee (₦)</label>
          <input
            type="number"
            name="fee"
            min={0}
            step="1000"
            className="w-full px-3.5 py-2.5 border border-line rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brass/40"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="bg-ink text-bone rounded-md px-4 py-2.5 text-sm font-medium disabled:opacity-60"
      >
        {pending ? 'Saving…' : 'Create job'}
      </button>
    </form>
  )
}
