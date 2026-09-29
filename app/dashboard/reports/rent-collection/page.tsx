import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PrintButton } from '../print-button'

function firstDayOfMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}
function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

type Row = {
  id: string
  due_date: string
  amount: number
  status: string
  paid_amount: number | null
  leases: {
    tenants: { name: string } | null
    units: { label: string; properties: { name: string } | null } | null
  } | null
}

export default async function RentCollectionPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>
}) {
  const { from = firstDayOfMonth(), to = todayISO() } = await searchParams
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('rent_ledger')
    .select(
      'id, due_date, amount, status, paid_amount, leases ( tenants ( name ), units ( label, properties ( name ) ) )'
    )
    .gte('due_date', from)
    .lte('due_date', to)
    .order('due_date', { ascending: true })

  const rows = (data ?? []) as unknown as Row[]

  const invoiced = rows.reduce((sum, r) => sum + Number(r.amount), 0)
  const collected = rows.reduce((sum, r) => sum + Number(r.paid_amount ?? 0), 0)
  const outstanding = invoiced - collected

  // Grouped by property, since that's how a firm usually reviews collection.
  const byProperty = new Map<string, { invoiced: number; collected: number; count: number }>()
  for (const r of rows) {
    const key = r.leases?.units?.properties?.name ?? 'Unassigned'
    const entry = byProperty.get(key) ?? { invoiced: 0, collected: 0, count: 0 }
    entry.invoiced += Number(r.amount)
    entry.collected += Number(r.paid_amount ?? 0)
    entry.count += 1
    byProperty.set(key, entry)
  }

  return (
    <div className="space-y-6">
      <div className="no-print flex items-start justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-ink">Rent collection</h1>
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

      <div>
        <p className="text-sm text-ink-soft">
          Period {from} to {to}
        </p>
      </div>

      {error ? (
        <p className="text-sm text-clay">Could not load rent ledger: {error.message}</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-panel border border-line rounded-xl p-4">
              <p className="text-xs text-ink-soft">Invoiced</p>
              <p className="text-lg font-semibold text-ink mt-1">₦{invoiced.toLocaleString()}</p>
            </div>
            <div className="bg-panel border border-line rounded-xl p-4">
              <p className="text-xs text-ink-soft">Collected</p>
              <p className="text-lg font-semibold text-ink mt-1">₦{collected.toLocaleString()}</p>
            </div>
            <div className="bg-panel border border-line rounded-xl p-4">
              <p className="text-xs text-ink-soft">Outstanding</p>
              <p className="text-lg font-semibold text-ink mt-1">₦{outstanding.toLocaleString()}</p>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-ink mb-3">By property</h2>
            <div className="bg-panel border border-line rounded-xl overflow-hidden">
              {byProperty.size === 0 ? (
                <p className="text-sm text-ink-soft p-5">No rent due in this period.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line text-left text-xs text-ink-soft uppercase tracking-wide">
                      <th className="px-5 py-3 font-medium">Property</th>
                      <th className="px-5 py-3 font-medium">Entries</th>
                      <th className="px-5 py-3 font-medium">Invoiced</th>
                      <th className="px-5 py-3 font-medium">Collected</th>
                      <th className="px-5 py-3 font-medium">Outstanding</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...byProperty.entries()].map(([name, v]) => (
                      <tr key={name} className="border-b border-line last:border-b-0">
                        <td className="px-5 py-3 text-ink font-medium">{name}</td>
                        <td className="px-5 py-3 text-ink-soft">{v.count}</td>
                        <td className="px-5 py-3 text-ink-soft">₦{v.invoiced.toLocaleString()}</td>
                        <td className="px-5 py-3 text-ink-soft">₦{v.collected.toLocaleString()}</td>
                        <td className="px-5 py-3 text-ink-soft">₦{(v.invoiced - v.collected).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-ink mb-3">All entries</h2>
            <div className="bg-panel border border-line rounded-xl overflow-hidden">
              {rows.length === 0 ? (
                <p className="text-sm text-ink-soft p-5">No rent due in this period.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line text-left text-xs text-ink-soft uppercase tracking-wide">
                      <th className="px-5 py-3 font-medium">Due date</th>
                      <th className="px-5 py-3 font-medium">Property / unit</th>
                      <th className="px-5 py-3 font-medium">Tenant</th>
                      <th className="px-5 py-3 font-medium">Amount</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.id} className="border-b border-line last:border-b-0">
                        <td className="px-5 py-3 text-ink-soft">{r.due_date}</td>
                        <td className="px-5 py-3 text-ink font-medium">
                          {r.leases?.units?.properties?.name ?? '—'} — {r.leases?.units?.label ?? '—'}
                        </td>
                        <td className="px-5 py-3 text-ink-soft">{r.leases?.tenants?.name ?? '—'}</td>
                        <td className="px-5 py-3 text-ink-soft">₦{Number(r.amount).toLocaleString()}</td>
                        <td className="px-5 py-3 text-ink-soft capitalize">{r.status}</td>
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
