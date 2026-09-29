import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PrintButton } from '../print-button'

const STAGE_LABEL: Record<string, string> = {
  instructed: 'Instructed',
  inspection: 'Inspection',
  draft: 'Draft',
  approved: 'Approved',
}

function firstDayOfYear() {
  return `${new Date().getFullYear()}-01-01`
}
function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

type Job = {
  id: string
  client_name: string
  purpose: string
  stage: string
  fee: number
  market_value: number | null
  created_at: string
}

export default async function ValuationSummaryPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>
}) {
  const { from = firstDayOfYear(), to = todayISO() } = await searchParams
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('valuation_jobs')
    .select('id, client_name, purpose, stage, fee, market_value, created_at')
    .gte('created_at', `${from}T00:00:00`)
    .lte('created_at', `${to}T23:59:59`)
    .order('created_at', { ascending: false })

  const jobs = (data ?? []) as Job[]

  const byStage = new Map<string, number>()
  for (const j of jobs) {
    byStage.set(j.stage, (byStage.get(j.stage) ?? 0) + 1)
  }
  const totalFees = jobs.reduce((sum, j) => sum + Number(j.fee ?? 0), 0)
  const approvedValue = jobs
    .filter((j) => j.stage === 'approved' && j.market_value != null)
    .reduce((sum, j) => sum + Number(j.market_value), 0)

  return (
    <div className="space-y-6">
      <div className="no-print flex items-start justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-ink">Valuation summary</h1>
          <p className="text-sm text-ink-soft mt-1">
            <Link href="/dashboard/reports" className="hover:text-ink">
              ← Reports
            </Link>
          </p>
        </div>
        <PrintButton />
      </div>

      <form method="GET" className="no-print bg-panel border border-line rounded-xl p-5 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
        <div>
          <label className="block text-xs text-ink-soft mb-1.5">From</label>
          <input
            type="date"
            name="from"
            defaultValue={from}
            className="w-full px-3.5 py-2.5 border border-line rounded-md text-sm bg-panel focus:outline-none focus:ring-2 focus:ring-brass/40"
          />
        </div>
        <div>
          <label className="block text-xs text-ink-soft mb-1.5">To</label>
          <input
            type="date"
            name="to"
            defaultValue={to}
            className="w-full px-3.5 py-2.5 border border-line rounded-md text-sm bg-panel focus:outline-none focus:ring-2 focus:ring-brass/40"
          />
        </div>
        <div>
          <button type="submit" className="bg-ink text-bone rounded-md px-4 py-2.5 text-sm font-medium">
            Run report
          </button>
        </div>
      </form>

      <p className="text-sm text-ink-soft">
        Jobs instructed between {from} and {to}
      </p>

      {error ? (
        <p className="text-sm text-clay">Could not load valuation jobs: {error.message}</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-panel border border-line rounded-xl p-4">
              <p className="text-xs text-ink-soft">Jobs</p>
              <p className="text-lg font-semibold text-ink mt-1">{jobs.length}</p>
            </div>
            <div className="bg-panel border border-line rounded-xl p-4">
              <p className="text-xs text-ink-soft">Total fees</p>
              <p className="text-lg font-semibold text-ink mt-1">₦{totalFees.toLocaleString()}</p>
            </div>
            <div className="bg-panel border border-line rounded-xl p-4">
              <p className="text-xs text-ink-soft">Approved market value</p>
              <p className="text-lg font-semibold text-ink mt-1">₦{approvedValue.toLocaleString()}</p>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-ink mb-3">By stage</h2>
            <div className="bg-panel border border-line rounded-xl overflow-hidden">
              {byStage.size === 0 ? (
                <p className="text-sm text-ink-soft p-5">No valuation jobs in this period.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line text-left text-xs text-ink-soft uppercase tracking-wide">
                      <th className="px-5 py-3 font-medium">Stage</th>
                      <th className="px-5 py-3 font-medium">Jobs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(['instructed', 'inspection', 'draft', 'approved'] as const).map((stage) =>
                      byStage.has(stage) ? (
                        <tr key={stage} className="border-b border-line last:border-b-0">
                          <td className="px-5 py-3 text-ink font-medium">{STAGE_LABEL[stage]}</td>
                          <td className="px-5 py-3 text-ink-soft">{byStage.get(stage)}</td>
                        </tr>
                      ) : null
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-ink mb-3">All jobs</h2>
            <div className="bg-panel border border-line rounded-xl overflow-hidden">
              {jobs.length === 0 ? (
                <p className="text-sm text-ink-soft p-5">No valuation jobs in this period.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line text-left text-xs text-ink-soft uppercase tracking-wide">
                      <th className="px-5 py-3 font-medium">Client</th>
                      <th className="px-5 py-3 font-medium">Purpose</th>
                      <th className="px-5 py-3 font-medium">Stage</th>
                      <th className="px-5 py-3 font-medium">Fee</th>
                      <th className="px-5 py-3 font-medium">Market value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map((j) => (
                      <tr key={j.id} className="border-b border-line last:border-b-0">
                        <td className="px-5 py-3 text-ink font-medium">
                          <Link href={`/dashboard/valuations/${j.id}`} className="hover:text-brass-deep">
                            {j.client_name}
                          </Link>
                        </td>
                        <td className="px-5 py-3 text-ink-soft capitalize">{j.purpose}</td>
                        <td className="px-5 py-3 text-ink-soft">{STAGE_LABEL[j.stage] ?? j.stage}</td>
                        <td className="px-5 py-3 text-ink-soft">₦{Number(j.fee ?? 0).toLocaleString()}</td>
                        <td className="px-5 py-3 text-ink-soft">
                          {j.market_value != null ? `₦${Number(j.market_value).toLocaleString()}` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
