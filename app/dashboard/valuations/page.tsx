import { createClient } from '@/lib/supabase/server'
import { NewValuationForm } from './new-valuation-form'

function formatNaira(n: number) {
  return '₦' + n.toLocaleString('en-NG', { maximumFractionDigits: 0 })
}

const STAGE_LABEL: Record<string, string> = {
  instructed: 'Instructed',
  inspection: 'Inspection',
  draft: 'Draft',
  approved: 'Approved',
}

export default async function ValuationsPage() {
  const supabase = await createClient()

  const [{ data: jobs, error }, { data: properties }] = await Promise.all([
    supabase
      .from('valuation_jobs')
      .select('id, client_name, purpose, method, stage, fee, market_value, properties ( name )')
      .order('created_at', { ascending: false }),
    supabase.from('properties').select('id, name').order('name'),
  ])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-ink">Valuations</h1>
        <p className="text-sm text-ink-soft mt-1">Valuation instructions from intake through to approval.</p>
      </div>

      <NewValuationForm properties={properties ?? []} />

      <div className="bg-panel border border-line rounded-xl overflow-hidden">
        {error ? (
          <p className="text-sm text-clay p-5">Could not load valuation jobs: {error.message}</p>
        ) : !jobs || jobs.length === 0 ? (
          <p className="text-sm text-ink-soft p-5">No valuation jobs yet — create one above.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-ink-soft uppercase tracking-wide">
                <th className="px-5 py-3 font-medium">Client</th>
                <th className="px-5 py-3 font-medium">Property</th>
                <th className="px-5 py-3 font-medium">Purpose</th>
                <th className="px-5 py-3 font-medium">Method</th>
                <th className="px-5 py-3 font-medium">Fee</th>
                <th className="px-5 py-3 font-medium">Stage</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => {
                const propertyName = (j.properties as unknown as { name: string } | null)?.name ?? 'Not on file'
                return (
                  <tr key={j.id} className="border-b border-line last:border-b-0">
                    <td className="px-5 py-3 text-ink font-medium">{j.client_name}</td>
                    <td className="px-5 py-3 text-ink-soft">{propertyName}</td>
                    <td className="px-5 py-3 text-ink-soft capitalize">{j.purpose}</td>
                    <td className="px-5 py-3 text-ink-soft capitalize">{j.method}</td>
                    <td className="px-5 py-3 text-ink-soft">{formatNaira(Number(j.fee ?? 0))}</td>
                    <td className="px-5 py-3">
                      <span className="text-xs uppercase tracking-wide font-medium px-2 py-0.5 rounded bg-brass/10 text-brass-deep">
                        {STAGE_LABEL[j.stage] ?? j.stage}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
