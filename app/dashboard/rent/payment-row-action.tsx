'use client'

import { useActionState } from 'react'
import { recordPayment } from '@/lib/actions/rent'

export function PaymentRowAction({ entryId, outstanding }: { entryId: string; outstanding: number }) {
  const [state, formAction, pending] = useActionState(recordPayment, null)

  return (
    <form action={formAction} className="flex items-center justify-end gap-2">
      <input type="hidden" name="entryId" value={entryId} />
      <input
        type="number"
        name="paidAmount"
        defaultValue={outstanding}
        min={0}
        step="1000"
        className="w-28 px-2 py-1.5 border border-line rounded-md text-xs text-right focus:outline-none focus:ring-2 focus:ring-brass/40"
      />
      <button
        type="submit"
        disabled={pending}
        className="text-xs font-medium bg-ink text-bone rounded-md px-3 py-1.5 disabled:opacity-60 whitespace-nowrap"
      >
        {pending ? 'Saving…' : 'Record payment'}
      </button>
      {state?.error && <span className="text-xs text-clay">{state.error}</span>}
    </form>
  )
}
