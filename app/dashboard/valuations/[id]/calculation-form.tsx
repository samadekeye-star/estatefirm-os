'use client'

import { useActionState } from 'react'
import { updateValuationCalculation } from '@/lib/actions/valuations'

function formatNaira(n: number) {
  return '₦' + n.toLocaleString('en-NG', { maximumFractionDigits: 0 })
}

type Props = {
  jobId: string
  passingRent: number | null
  yieldPct: number | null
  adjustments: number | null
  marketValue: number | null
}

export function CalculationForm({ jobId, passingRent, yieldPct, adjustments, marketValue }: Props) {
  const [state, formAction, pending] = useActionState(updateValuationCalculation, null)

  return (
    <form action={formAction} className="bg-panel border border-line rounded-xl p-5 space-y-4">
      <h2 className="text-sm font-semibold text-ink">Investment method calculation</h2>
      <p className="text-xs text-ink-soft -mt-2">Capital value = passing rent &divide; (yield &divide; 100) + adjustments</p>
      <input type="hidden" name="jobId" value={jobId} />

      {state?.error && (
        <div className="bg-clay-bg text-clay text-sm px-3.5 py-2.5 rounded-md">{state.error}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-ink-soft mb-1.5">Passing rent (₦/yr)</label>
          <input
            type="number"
            name="passingRent"
            required
            min={0}
            step="1000"
            defaultValue={passingRent ?? ''}
            className="w-full px-3.5 py-2.5 border border-line rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brass/40"
          />
        </div>
        <div>
          <label className="block text-xs text-ink-soft mb-1.5">Yield (%)</label>
          <input
            type="number"
            name="yieldPct"
            required
            min={0.1}
            max={100}
            step="0.1"
            defaultValue={yieldPct ?? ''}
            className="w-full px-3.5 py-2.5 border border-line rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brass/40"
          />
        </div>
        <div>
          <label className="block text-xs text-ink-soft mb-1.5">Adjustments (₦)</label>
          <input
            type="number"
            name="adjustments"
            step="1000"
            defaultValue={adjustments ?? 0}
            className="w-full px-3.5 py-2.5 border border-line rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brass/40"
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <button
          type="submit"
          disabled={pending}
          className="bg-ink text-bone rounded-md px-4 py-2.5 text-sm font-medium disabled:opacity-60"
        >
          {pending ? 'Calculating…' : 'Calculate'}
        </button>
        {marketValue != null && (
          <div className="text-right">
            <p className="text-xs text-ink-soft">Market value</p>
            <p className="font-serif text-xl font-semibold text-ink">{formatNaira(marketValue)}</p>
          </div>
        )}
      </div>
    </form>
  )
}
