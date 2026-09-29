import { createClient } from '@/lib/supabase/server'
import { PaymentRowAction } from './payment-row-action'

function formatNaira(n: number) {
  return '₦' + n.toLocaleString('en-NG', { maximumFractionDigits: 0 })
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

type LedgerRow = {
  id: string
  due_date: string
  amount: number
  status: string
  paid_amount: number | null
  leases: { tenants: { name: string } | null; units: { label: string; properties: { name: string } | null } | null } | null
}

export default async function RentPage() {
  const supabase = await createClient()

  const { data: entries, error } = await supabase
    .from('rent_ledger')
    .select('id, due_date, amount, status, paid_amount, leases ( tenants ( name ), units ( label, properties ( name ) ) )')
    .order('due_date', { ascending: true })

  const today = todayISO()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-ink">Rent ledger</h1>
        <p className="text-sm text-ink-soft mt-1">
          Every scheduled payment across all leases. Entries are generated automatically when a lease starts.
        </p>
      </div>

      <div className="bg-panel border border-line rounded-xl overflow-hidden">
        {error ? (
          <p className="text-sm text-clay p-5">Could not load the rent ledger: {error.message}</p>
        ) : !entries || entries.length === 0 ? (
          <p className="text-sm text-ink-soft p-5">
            Nothing here yet — start a lease under Leases and its payment schedule will appear here.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-ink-soft uppercase tracking-wide">
                <th className="px-5 py-3 font-medium">Due date</th>
                <th className="px-5 py-3 font-medium">Tenant</th>
                <th className="px-5 py-3 font-medium">Unit</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {(entries as unknown as LedgerRow[]).map((e) => {
                const isOverdue = e.status === 'due' && e.due_date < today
                const outstanding = Number(e.amount) - Number(e.paid_amount ?? 0)
                const statusLabel = isOverdue ? 'Overdue' : e.status
                const statusClass =
                  e.status === 'paid'
                    ? 'bg-field-bg text-field'
                    : isOverdue
                      ? 'bg-clay-bg text-clay'
                      : e.status === 'partial'
                        ? 'bg-brass/10 text-brass-deep'
                        : 'bg-bone-dim text-ink-soft'

                return (
                  <tr key={e.id} className="border-b border-line last:border-b-0">
                    <td className="px-5 py-3 text-ink-soft">{e.due_date}</td>
                    <td className="px-5 py-3 text-ink font-medium">{e.leases?.tenants?.name ?? '—'}</td>
                    <td className="px-5 py-3 text-ink-soft">
                      {e.leases?.units?.properties?.name ?? 'Unknown'} &middot; {e.leases?.units?.label ?? ''}
                    </td>
                    <td className="px-5 py-3 text-ink-soft">{formatNaira(Number(e.amount))}</td>
                    <td className="px-5 py-3">
                      <span className={'text-xs uppercase tracking-wide font-medium px-2 py-0.5 rounded ' + statusClass}>
                        {statusLabel}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {e.status !== 'paid' && <PaymentRowAction entryId={e.id} outstanding={outstanding} />}
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
