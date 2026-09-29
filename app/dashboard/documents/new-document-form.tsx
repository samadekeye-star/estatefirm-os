'use client'

import { useActionState, useRef, useEffect, useState } from 'react'
import { uploadDocument } from '@/lib/actions/documents'

type RelatedOption = { type: string; id: string; label: string }

const RELATED_TYPE_LABEL: Record<string, string> = {
  landlord: 'Landlord',
  property: 'Property',
  tenant: 'Tenant',
  valuation_job: 'Valuation job',
}

export function NewDocumentForm({ options }: { options: RelatedOption[] }) {
  const [state, formAction, pending] = useActionState(uploadDocument, null)
  const [relatedType, setRelatedType] = useState('landlord')
  const formRef = useRef<HTMLFormElement>(null)
  const wasPending = useRef(false)

  useEffect(() => {
    if (wasPending.current && !pending && !state?.error) {
      formRef.current?.reset()
      setRelatedType('landlord')
    }
    wasPending.current = pending
  }, [pending, state])

  const filteredOptions = options.filter((o) => o.type === relatedType)

  return (
    <form ref={formRef} action={formAction} className="bg-panel border border-line rounded-xl p-5 space-y-4">
      <h2 className="text-sm font-semibold text-ink">Upload document</h2>

      {state?.error && (
        <div className="bg-clay-bg text-clay text-sm px-3.5 py-2.5 rounded-md">{state.error}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-ink-soft mb-1.5">About</label>
          <select
            name="relatedType"
            value={relatedType}
            onChange={(e) => setRelatedType(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-line rounded-md text-sm bg-panel focus:outline-none focus:ring-2 focus:ring-brass/40"
          >
            {Object.entries(RELATED_TYPE_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-ink-soft mb-1.5">Record</label>
          <select
            name="relatedId"
            required
            defaultValue=""
            disabled={filteredOptions.length === 0}
            className="w-full px-3.5 py-2.5 border border-line rounded-md text-sm bg-panel focus:outline-none focus:ring-2 focus:ring-brass/40 disabled:opacity-50"
          >
            <option value="" disabled>
              {filteredOptions.length === 0 ? 'None on file yet' : 'Choose one'}
            </option>
            {filteredOptions.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-ink-soft mb-1.5">Document type</label>
          <select
            name="tag"
            defaultValue="general"
            className="w-full px-3.5 py-2.5 border border-line rounded-md text-sm bg-panel focus:outline-none focus:ring-2 focus:ring-brass/40"
          >
            <option value="lease">Lease</option>
            <option value="title">Title</option>
            <option value="inspection">Inspection</option>
            <option value="arrears">Arrears</option>
            <option value="report">Report</option>
            <option value="general">General</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-ink-soft mb-1.5">File (up to 15MB)</label>
          <input
            type="file"
            name="file"
            required
            className="w-full text-sm text-ink-soft file:mr-3 file:px-3 file:py-1.5 file:rounded-md file:border-0 file:bg-ink file:text-bone file:text-xs file:font-medium"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={pending || filteredOptions.length === 0}
        className="bg-ink text-bone rounded-md px-4 py-2.5 text-sm font-medium disabled:opacity-60"
      >
        {pending ? 'Uploading…' : 'Upload'}
      </button>
    </form>
  )
}
