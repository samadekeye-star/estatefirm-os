import { createClient } from '@/lib/supabase/server'
import { displayLeaseStatus } from '@/lib/lease-status'

function formatNaira(n: number) {
  return '₦' + n.toLocaleString('en-NG', { maximumFractionDigits: 0 })
}

function startOfMonthISO() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10)
}

function inDaysISO(days: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function todayISOForOverdue() {
  return new Date().toISOString().slice(0, 10)
}

export default async function DashboardPage() {
  const supabase = await createClient()

  // All of these run scoped to the caller's firm — RLS enforces that at the
  // database level, so there is no firm_id filter to remember to add here.
  const [
    { count: unitsTotal },
    { count: unitsOccupied },
    { data: rentThisMonth },
    { count: leasesExpiring },
    { count: valuationsInProgress },
    { data: overdueRent },
    { data: leasesNeedingAttention },
  ] = await Promise.all([
    supabase.from('units').select('id', { count: 'exact', head: true }),
    supabase.from('units').select('id', { count: 'exact', head: true }).eq('status', 'occupied'),
    supabase
      .from('rent_ledger')
      .select('paid_amount')
      .in('status', ['paid', 'partial'])
      .gte('paid_date', startOfMonthISO()),
    supabase
      .from('leases')
      .select('id', { count: 'exact', head: true })
      .in('status', ['active', 'renewal_due'])
      .lte('end_date', inDaysISO(60)),
    supabase
      .from('valuation_jobs')
      .select('id', { count: 'exact', head: true })
      .neq('stage', 'approved'),
    // "Overdue" isn't a status anything sets on its own — nothing here runs
    // on a schedule to flip it — so it's computed as "still due, past its
    // due date" at query time instead of trusted from a stored flag that
    // would otherwise just sit stale at 'due' forever.
    supabase
      .from('rent_ledger')
      .select('id, amount, due_date, leases ( tenants ( name ) )')
      .eq('status', 'due')
      .lt('due_date', todayISOForOverdue())
      .order('due_date', { ascending: true })
      .limit(5),
    // Same principle as "Overdue rent" above: nothing sets 'renewal_due' on
    // its own, so an active lease within the renewal window is matched
    // directly here rather than relying on a stored status that would
    // otherwise never change. 'notice_served' is a real, manually-set
    // status (see lib/actions/leases.ts → serveNotice), so that one is
    // still matched as a stored value.
    supabase
      .from('leases')
      .select('id, end_date, status, tenants ( name ), units ( label, properties ( name ) )')
      .or(`status.eq.notice_served,and(status.eq.active,end_date.lte.${inDaysISO(60)})`)
      .order('end_date', { ascending: true })
      .limit(5),
  ])

  const occupancyRate = unitsTotal ? Math.round(((unitsOccupied ?? 0) / unitsTotal) * 100) : 0
  const rentCollected = (rentThisMonth ?? []).reduce((sum, r) => sum + Number(r.paid_amount ?? 0), 0)

  const kpis = [
    { label: 'Occupancy rate', value: `${occupancyRate}%`, hint: `${unitsOccupied ?? 0} of ${unitsTotal ?? 0} units` },
    { label: 'Rent collected this month', value: formatNaira(rentCollected), hint: 'Paid or partially paid' },
    { label: 'Leases expiring (60 days)', value: String(leasesExpiring ?? 0), hint: 'Active or renewal due' },
    { label: 'Valuation jobs in progress', value: String(valuationsInProgress ?? 0), hint: 'Not yet approved' },
  ]

  type OverdueRow = { id: string; amount: number; due_date: string; leases: { tenants: { name: string } | null } | null }
  type AttentionRow = {
    id: string
    end_date: string
    status: string
    tenants: { name: string } | null
    units: { label: string; properties: { name: string } | null } | null
  }

  const overdue = (overdueRent ?? []) as unknown as OverdueRow[]
  const attention = (leasesNeedingAttention ?? []) as unknown as AttentionRow[]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-ink">Overview</h1>
        <p className="text-sm text-ink-soft mt-1">Where things stand across your firm right now.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="bg-panel border border-line rounded-xl p-5">
            <p className="text-xs text-ink-soft">{k.label}</p>
            <p className="font-serif text-2xl font-semibold text-ink mt-1.5">{k.value}</p>
            <p className="text-xs text-ink-soft mt-1">{k.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-panel border border-line rounded-xl p-5">
          <h2 className="text-sm font-semibold text-ink mb-3">Overdue rent</h2>
          {overdue.length === 0 ? (
            <p className="text-sm text-ink-soft">Nothing overdue right now.</p>
          ) : (
            <ul className="space-y-2.5">
              {overdue.map((row) => (
                <li key={row.id} className="flex items-center justify-between text-sm">
                  <span className="text-ink">{row.leases?.tenants?.name ?? 'Unknown tenant'}</span>
                  <span className="text-clay font-medium">{formatNaira(Number(row.amount))}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-panel border border-line rounded-xl p-5">
          <h2 className="text-sm font-semibold text-ink mb-3">Leases needing attention</h2>
          {attention.length === 0 ? (
            <p className="text-sm text-ink-soft">No renewals or notices pending.</p>
          ) : (
            <ul className="space-y-2.5">
              {attention.map((row) => (
                <li key={row.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="text-ink">{row.tenants?.name ?? 'Unknown tenant'}</p>
                    <p className="text-xs text-ink-soft">
                      {row.units?.properties?.name ?? 'Unknown property'} &middot; {row.units?.label ?? ''}
                    </p>
                  </div>
                  <span className="text-xs uppercase tracking-wide text-brass-deep font-medium">
                    {displayLeaseStatus(row.status, row.end_date).replace('_', ' ')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
