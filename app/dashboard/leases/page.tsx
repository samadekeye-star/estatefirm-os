import { createClient } from '@/lib/supabase/server'
import { NewLeaseForm } from './new-lease-form'
import { LeaseActions } from './lease-actions'
import { displayLeaseStatus } from '@/lib/lease-status'

function formatNaira(n: number) {
  return '₦' + n.toLocaleString('en-NG', { maximumFractionDigits: 0 })
}

type LeaseRow = {
  id: string
  start_date: string
  end_date: string
  rent_amount: number
  frequency: string
  status: string
  tenants: { name: string } | null
  units: { label: string; properties: { name: string } | null } | null
}

export default async function LeasesPage() {
  const supabase = await createClient()

  const [{ data: leases, error }, { data: vacantUnitsRaw }, { data: tenants }] = await Promise.all([
    supabase
      .from('leases')
      .select('id, start_date, end_date, rent_amount, frequency, status, tenants ( name ), units ( label, properties ( name ) )')
      .order('start_date', { ascending: false }),
    supabase
      .from('units')
      .select('id, label, properties ( name )')
      .eq('status', 'vacant')
      .order('label'),
    supabase.from('tenants').select('id, name').order('name'),
  ])

  const vacantUnits = (vacantUnitsRaw ?? []).map((u) => ({
    id: u.id as string,
    label: u.label as string,
    propertyName: (u.properties as unknown as { name: string } | null)?.name ?? 'Unknown property',
  }))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-ink">Leases</h1>
        <p className="text-sm text-ink-soft mt-1">Active and past tenancy agreements.</p>
      </div>

      <NewLeaseForm vacantUnits={vacantUnits} tenants={tenants ?? []} />

      <div className="bg-panel border border-line rounded-xl overflow-hidden">
        {error ? (
          <p className="text-sm text-clay p-5">Could not load leases: {error.message}</p>
        ) : !leases || leases.length === 0 ? (
          <p className="text-sm text-ink-soft p-5">No leases yet — start one above.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-ink-soft uppercase tracking-wide">
                <th className="px-5 py-3 font-medium">Tenant</th>
                <th className="px-5 py-3 font-medium">Unit</th>
                <th className="px-5 py-3 font-medium">Rent</th>
                <th className="px-5 py-3 font-medium">Term</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {(leases as unknown as LeaseRow[]).map((l) => (
                <tr key={l.id} className="border-b border-line last:border-b-0">
                  <td className="px-5 py-3 text-ink font-medium">{l.tenants?.name ?? '—'}</td>
                  <td className="px-5 py-3 text-ink-soft">
                    {l.units?.properties?.name ?? 'Unknown'} &middot; {l.units?.label ?? ''}
                  </td>
                  <td className="px-5 py-3 text-ink-soft">
                    {formatNaira(Number(l.rent_amount))} / {l.frequency}
                  </td>
                  <td className="px-5 py-3 text-ink-soft">
                    {l.start_date} &ndash; {l.end_date}
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-xs uppercase tracking-wide font-medium px-2 py-0.5 rounded bg-field-bg text-field">
                      {displayLeaseStatus(l.status, l.end_date).replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <LeaseActions leaseId={l.id} status={l.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
