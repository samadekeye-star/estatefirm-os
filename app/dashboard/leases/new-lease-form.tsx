'use client'

import { useActionState, useRef, useEffect } from 'react'
import { createLease } from '@/lib/actions/leases'

type VacantUnit = { id: string; label: string; propertyName: string }
type Tenant = { id: string; name: string }

export function NewLeaseForm({ vacantUnits, tenants }: { vacantUnits: VacantUnit[]; tenants: Tenant[] }) {
  const [state, formAction, pending] = useActionState(createLease, null)
  const formRef = useRef<HTMLFormElement>(null)
  const wasPending = useRef(false)

  useEffect(() => {
    if (wasPending.current && !pending && !state?.error) {
      formRef.current?.reset()
    }
    wasPending.current = pending
  }, [pending, state])

  if (vacantUnits.length === 0) {
    return (
      <div className="bg-panel border border-line rounded-xl p-5">
        <h2 className="text-sm font-semibold text-ink mb-1">Start a lease</h2>
        <p className="text-sm text-ink-soft">
          No vacant units right now — add a property and its units first, or wait for one to free up.
        </p>
      </div>
    )
  }

  if (tenants.length === 0) {
    return (
      <div className="bg-panel border border-line rounded-xl p-5">
        <h2 className="text-sm font-semibold text-ink mb-1">Start a lease</h2>
        <p className="text-sm text-ink-soft">Add a tenant first, then come back here to start their lease.</p>
      </div>
    )
  }

  return (
    <form ref={formRef} action={formAction} className="bg-panel border border-line rounded-xl p-5 space-y-4">
      <h2 className="text-sm font-semibold text-ink">Start a lease</h2>

      {state?.error && (
        <div className="bg-clay-bg text-clay text-sm px-3.5 py-2.5 rounded-md">{state.error}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-ink-soft mb-1.5">Unit</label>
          <select
            name="unitId"
            required
            defaultValue=""
            className="w-full px-3.5 py-2.5 border border-line rounded-md text-sm bg-panel focus:outline-none focus:ring-2 focus:ring-brass/40"
          >
            <option value="" disabled>
              Choose a vacant unit
            </option>
            {vacantUnits.map((u) => (
              <option key={u.id} value={u.id}>
                {u.propertyName} — {u.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-ink-soft mb-1.5">Tenant</label>
          <select
            name="tenantId"
            required
            defaultValue=""
            className="w-full px-3.5 py-2.5 border border-line rounded-md text-sm bg-panel focus:outline-none focus:ring-2 focus:ring-brass/40"
          >
            <option value="" disabled>
              Choose a tenant
            </option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-ink-soft mb-1.5">Start date</label>
          <input
            type="date"
            name="startDate"
            required
            className="w-full px-3.5 py-2.5 border border-line rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brass/40"
          />
        </div>
        <div>
          <label className="block text-xs text-ink-soft mb-1.5">End date</label>
          <input
            type="date"
            name="endDate"
            required
            className="w-full px-3.5 py-2.5 border border-line rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brass/40"
          />
        </div>
        <div>
          <label className="block text-xs text-ink-soft mb-1.5">Rent amount (₦)</label>
          <input
            type="number"
            name="rentAmount"
            required
            min={0}
            step="1000"
            className="w-full px-3.5 py-2.5 border border-line rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brass/40"
          />
        </div>
        <div>
          <label className="block text-xs text-ink-soft mb-1.5">Frequency</label>
          <select
            name="frequency"
            defaultValue="annual"
            className="w-full px-3.5 py-2.5 border border-line rounded-md text-sm bg-panel focus:outline-none focus:ring-2 focus:ring-brass/40"
          >
            <option value="annual">Annual</option>
            <option value="quarterly">Quarterly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="bg-ink text-bone rounded-md px-4 py-2.5 text-sm font-medium disabled:opacity-60"
      >
        {pending ? 'Saving…' : 'Start lease'}
      </button>
    </form>
  )
}
