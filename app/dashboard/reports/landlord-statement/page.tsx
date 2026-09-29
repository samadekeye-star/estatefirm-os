import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PrintButton } from '../print-button'

function firstDayOfYear() {
  return `${new Date().getFullYear()}-01-01`
}
function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

type LedgerEntry = { id: string; due_date: string; amount: number; status: string; paid_amount: number | null }
type Lease = {
  id: string
  tenants: { name: string } | null
  rent_ledger: LedgerEntry[]
}
type Unit = { id: string; label: string; leases: Lease[] }
type PropertyWithLeases = { id: string; name: string; units: Unit[] }

export default async function LandlordStatementPage({
  searchParams,
}: {
  searchParams: Promise<{ landlordId?: string; from?: string; to?: string }>
}) {
  const { landlordId, from = firstDayOfYear(), to = todayISO() } = await searchParams
  const supabase = await createClient()

  const { data: landlords } = await supabase.from('landlords').select('id, name').order('name')

  let landlord: { id: string; name: string } | null = null
  let properties: PropertyWithLeases[] = []

  if (landlordId) {
    const [{ data: landlordRow }, { data: propertyRows }] = await Promise.all([
      supabase.from('landlords').select('id, name').eq('id', landlordId).single(),
      supabase
        .from('properties')
        .select(
          'id, name, units ( id, label, leases ( id, tenants ( name ), rent_ledger ( id, due_date, amount, status, paid_amount ) ) )'
        )
        .eq('landlord_id', landlordId)
        .order('name'),
    ])
    landlord = landlordRow
    properties = (propertyRows ?? []) as unknown as PropertyWithLeases[]
  }

  // All ledger entries due within [from, to], flattened with the property/
  // tenant they belong to, for both the line-item table and the totals.
  const lines = properties.flatMap((p) =>
    p.units.flatMap((u) =>
      u.leases.flatMap((l) =>
        l.rent_ledger
          .filter((e) => e.due_date >= from && e.due_date <= to)
          .map((e) => ({
            propertyName: p.name,
            unitLabel: u.label,
            tenantName: l.tenants?.name ?? '—',
            ...e,
          }))
      )
    )
  )
  lines.sort((a, b) => a.due_date.localeCompare(b.due_date))

  const collected = lines.reduce((sum, l) => sum + Number(l.paid_amount ?? 0), 0)
  const invoiced = lines.reduce((sum, l) => sum + Number(l.amount), 0)
  const outstanding = invoiced - collected

  return (
    <div className="space-y-6">
      <div className="no-print flex items-start justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-ink">Landlord statement</h1>
          <p className="text-sm text-ink-soft mt-1">
            <Link href="/dashboard/reports" className="hover:text-ink">
              ← Reports
            </Link>
          </p>
        </div>
        {landlord && <PrintButton />}
      </div>

      <form method="GET" className="no-print bg-panel border border-line rounded-xl p-5 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
        <div className="sm:col-span-2">
          <label className="block text-xs text-ink-soft mb-1.5">Landlord</label>
          <select
            name="landlordId"
            defaultValue={landlordId ?? ''}
            required
            className="w-full px-3.5 py-2.5 border border-line rounded-md text-sm bg-panel focus:outline-none focus:ring-2 focus:ring-brass/40"
          >
            <option value="" disabled>
              Choose a landlord
            </option>
            {(landlords ?? []).map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
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
        <div className="sm:col-span-4">
          <button type="submit" className="bg-ink text-bone rounded-md px-4 py-2.5 text-sm font-medium">
            Run statement
          </button>
        </div>
      </form>

      {landlord && (
        <div className="space-y-6">
          <div>
            <h2 className="font-serif text-xl font-semibold text-ink">{landlord.name}</h2>
            <p className="text-sm text-ink-soft mt-1">
              Statement period {from} to {to}
            </p>
          </div>

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

          <div className="bg-panel border border-line rounded-xl overflow-hidden">
            {lines.length === 0 ? (
              <p className="text-sm text-ink-soft p-5">No rent due in this period.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs text-ink-soft uppercase tracking-wide">
                    <th className="px-5 py-3 font-medium">Property / unit</th>
                    <th className="px-5 py-3 font-medium">Tenant</th>
                    <th className="px-5 py-3 font-medium">Due date</th>
                    <th className="px-5 py-3 font-medium">Amount</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l) => (
                    <tr key={l.id} className="border-b border-line last:border-b-0">
                      <td className="px-5 py-3 text-ink font-medium">
                        {l.propertyName} — {l.unitLabel}
                      </td>
                      <td className="px-5 py-3 text-ink-soft">{l.tenantName}</td>
                      <td className="px-5 py-3 text-ink-soft">{l.due_date}</td>
                      <td className="px-5 py-3 text-ink-soft">₦{Number(l.amount).toLocaleString()}</td>
                      <td className="px-5 py-3 text-ink-soft capitalize">{l.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
