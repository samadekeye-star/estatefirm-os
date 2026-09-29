'use client'

import { useState, useTransition } from 'react'
import { serveNotice, markVacated } from '@/lib/actions/leases'

export function LeaseActions({ leaseId, status }: { leaseId: string; status: string }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  if (status === 'vacated') return null

  function run(action: (id: string) => Promise<{ error: string } | null>) {
    setError(null)
    startTransition(async () => {
      const result = await action(leaseId)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div className="flex items-center justify-end gap-2">
      {error && <span className="text-xs text-clay">{error}</span>}
      {status !== 'notice_served' && (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(serveNotice)}
          className="text-xs text-ink-soft hover:text-ink border border-line rounded px-2 py-1 disabled:opacity-50"
        >
          Serve notice
        </button>
      )}
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (confirm('Mark this lease vacated and free up the unit?')) run(markVacated)
        }}
        className="text-xs text-ink-soft hover:text-ink border border-line rounded px-2 py-1 disabled:opacity-50"
      >
        Mark vacated
      </button>
    </div>
  )
}
