'use client'

import { useActionState } from 'react'
import { advanceValuationStage } from '@/lib/actions/valuations'

const NEXT_LABEL: Record<string, string> = {
  instructed: 'Move to inspection',
  inspection: 'Move to draft',
  draft: 'Approve',
}

export function StageActions({ jobId, stage }: { jobId: string; stage: string }) {
  const [state, formAction, pending] = useActionState(advanceValuationStage, null)

  if (stage === 'approved') {
    return <p className="text-sm text-field font-medium">This valuation has been approved.</p>
  }

  return (
    <form action={formAction} className="flex items-center gap-3">
      <input type="hidden" name="jobId" value={jobId} />
      <input type="hidden" name="currentStage" value={stage} />
      <button
        type="submit"
        disabled={pending}
        className="bg-ink text-bone rounded-md px-4 py-2.5 text-sm font-medium disabled:opacity-60"
      >
        {pending ? 'Saving…' : NEXT_LABEL[stage] ?? 'Advance'}
      </button>
      {state?.error && <span className="text-sm text-clay">{state.error}</span>}
    </form>
  )
}
