import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { displayLeaseStatus } from '@/lib/lease-status'

const RENT_STATUS_LABEL: Record<string, string> = {
  due: 'Due',
  paid: 'Paid',
  partial: 'Partial',
  overdue: 'Overdue',
}

export default async function TenantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: tenant }, { data: leases, error: leasesError }] = await Promise.all([
    supabase
      .from('tenants')
      .select('id, name, phone, email, guarantor_name, guarantor_phone, created_at')
      .eq('id', id)
      .single(),
    supabase
      .from('leases')
      .select(
        'id, start_date, end_date, rent_amount, frequency, status, units ( label, properties ( id, name ) ), rent_ledger ( id, due_date, amount, status, paid_amount, paid_date )'
      )
      .eq('tenant_id', id)
      .order('start_date', { ascending: false }),
  ])

  if (!tenant) notFound()

  type LeaseRow = {
    id: string
    start_date: string
    end_date: string
    rent_amount: number
    frequency: string
    status: string
    units: { label: string; properties: { id: string; name: string } } | null
    rent_ledger: { id: string; due_date: string; amount: number; status: string; paid_amount: number | null; paid_date: string | null }[]
  }
  const leaseRows = (leases ?? []) as unknown as LeaseRow[]

  const today = new Date().toISOString().slice(0, 10)
  const allLedgerEntries = leaseRows.flatMap((l) => l.rent_ledger)
  const outstanding = allLedgerEntries
    .filter((e) => e.status === 'due' || e.status === 'partial')
    .reduce((sum, e) => sum + Number(e.amount) - Number(e.paid_amount ?? 0), 0)
  const overdueCount = allLedgerEntries.filter((e) => e.status === 'due' && e.due_date < today).length

  return (
    <div className="space-y-8">
      <div>
        <Link href="/dashboard/tenants" className="text-sm text-ink-soft hover:text-ink">
          ← Tenants
        </Link>
        <h1 className="font-serif text-2xl font-semibold text-ink mt-2">{tenant.name}</h1>
        <p className="text-sm text-ink-soft mt-1">
          {tenant.phone ?? '—'}
          {tenant.email ? ` · ${tenant.email}` : ''}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-panel border border-line rounded-xl p-4">
          <p className="text-xs text-ink-soft">Active leases</p>
          <p className="text-lg font-semibold text-ink mt-1">
            {leaseRows.filter((l) => l.status === 'active').length}
          </p>
        </div>
        <div className="bg-panel border border-line rounded-xl p-4">
          <p className="text-xs text-ink-soft">Outstanding rent</p>
          <p className="text-lg font-semibold text-ink mt-1">₦{outstanding.toLocaleString()}</p>
        </div>
        <div className="bg-panel border border-line rounded-xl p-4">
          <p className="text-xs text-ink-soft">Overdue entries</p>
          <p className="text-lg font-semibold text-ink mt-1">{overdueCount}</p>
        </div>
        <div className="bg-panel border border-line rounded-xl p-4">
          <p className="text-xs text-ink-soft">Guarantor</p>
          <p className="text-sm text-ink mt-1 truncate">{tenant.guarantor_name ?? 'Not on file'}</p>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-ink mb-3">Leases</h2>
        <div className="bg-panel border border-line rounded-xl overflow-hidden">
          {leasesError ? (
            <p className="text-sm text-clay p-5">Could not load leases: {leasesError.message}</p>
          ) : leaseRows.length === 0 ? (
            <p className="text-sm text-ink-soft p-5">No leases on file for this tenant yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-ink-soft uppercase tracking-wide">
                  <th className="px-5 py-3 font-medium">Property / unit</th>
                  <th className="px-5 py-3 font-medium">Term</th>
                  <th className="px-5 py-3 font-medium">Rent</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {leaseRows.map((l) => (
                  <tr key={l.id} className="border-b border-line last:border-b-0">
                    <td className="px-5 py-3 text-ink font-medium">
                      {l.units?.properties ? (
                        <Link href={`/dashboard/properties/${l.units.properties.id}`} className="hover:text-brass-deep">
                          {l.units.properties.name}
                        </Link>
                      ) : (
                        'Property no longer on file'
                      )}{' '}
                      <span className="text-ink-soft font-normal">— {l.units?.label ?? '—'}</span>
                    </td>
                    <td className="px-5 py-3 text-ink-soft">
                      {l.start_date} → {l.end_date}
                    </td>
                    <td className="px-5 py-3 text-ink-soft">
                      ₦{Number(l.rent_amount).toLocaleString()} / {l.frequency}
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs uppercase tracking-wide font-medium px-2 py-0.5 rounded bg-brass/10 text-brass-deep">
                        {displayLeaseStatus(l.status, l.end_date).replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-ink mb-3">Payment history</h2>
        <div className="bg-panel border border-line rounded-xl overflow-hidden">
          {allLedgerEntries.length === 0 ? (
            <p className="text-sm text-ink-soft p-5">No rent schedule yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-ink-soft uppercase tracking-wide">
                  <th className="px-5 py-3 font-medium">Due date</th>
                  <th className="px-5 py-3 font-medium">Amount</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Paid</th>
                </tr>
              </thead>
              <tbody>
                {[...allLedgerEntries]
                  .sort((a, b) => a.due_date.localeCompare(b.due_date))
                  .map((e) => (
                    <tr key={e.id} className="border-b border-line last:border-b-0">
                      <td className="px-5 py-3 text-ink-soft">{e.due_date}</td>
                      <td className="px-5 py-3 text-ink-soft">₦{Number(e.amount).toLocaleString()}</td>
                      <td className="px-5 py-3">
                        <span className="text-xs uppercase tracking-wide font-medium px-2 py-0.5 rounded bg-brass/10 text-brass-deep">
                          {e.status === 'due' && e.due_date < today ? 'Overdue' : RENT_STATUS_LABEL[e.status] ?? e.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-ink-soft">
                        {e.paid_date ? `₦${Number(e.paid_amount ?? 0).toLocaleString()} on ${e.paid_date}` : '—'}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
