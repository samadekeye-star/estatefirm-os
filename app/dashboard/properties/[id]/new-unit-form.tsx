'use client'

import { useActionState, useRef, useEffect } from 'react'
import { createUnit } from '@/lib/actions/properties'

export function NewUnitForm({ propertyId }: { propertyId: string }) {
  const [state, formAction, pending] = useActionState(createUnit, null)
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
      <h2 className="text-sm font-semibold text-ink">Add unit</h2>
      <input type="hidden" name="propertyId" value={propertyId} />

      {state?.error && (
        <div className="bg-clay-bg text-clay text-sm px-3.5 py-2.5 rounded-md">{state.error}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-ink-soft mb-1.5">Label</label>
          <input
            type="text"
            name="label"
            required
            placeholder="e.g. Flat 2B, Shop 4"
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
        {pending ? 'Adding…' : 'Add unit'}
      </button>
    </form>
  )
}
