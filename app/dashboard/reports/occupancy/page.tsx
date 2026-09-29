import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PrintButton } from '../print-button'

type Unit = {
  id: string
  label: string
  status: string
  leases: { end_date: string; status: string; tenants: { name: string } | null }[]
}
type PropertyWithUnits = { id: string; name: string; units: Unit[] }

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export default async function OccupancyReportPage() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('properties')
    .select(
      'id, name, units ( id, label, status, leases ( end_date, status, tenants ( name ) ) )'
    )
    .order('name')

  const properties = (data ?? []) as unknown as PropertyWithUnits[]
  const today = todayISO()
  const sixtyDaysOut = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const allUnits = properties.flatMap((p) => p.units.map((u) => ({ ...u, propertyName: p.name })))
  const occupiedCount = allUnits.filter((u) => u.status === 'occupied').length
  const vacantCount = allUnits.filter((u) => u.status === 'vacant').length

  // Active lease per unit, if any, picked as the one with the latest end date
  // — good enough for a single-current-lease-per-unit app like this one.
  function activeLease(u: Unit) {
    return u.leases
      .filter((l) => l.status === 'active' || l.status === 'renewal_due' || l.status === 'notice_served')
      .sort((a, b) => b.end_date.localeCompare(a.end_date))[0]
  }

  const expiringSoon = allUnits
    .map((u) => ({ ...u, lease: activeLease(u) }))
    .filter((u) => u.lease && u.lease.end_date >= today && u.lease.end_date <= sixtyDaysOut)
    .sort((a, b) => (a.lease!.end_date).localeCompare(b.lease!.end_date))

  return (
    <div className="space-y-6">
      <div className="no-print flex items-start justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-ink">Occupancy</h1>
          <p className="text-sm text-ink-soft mt-1">
            <Link href="/dashboard/reports" className="hover:text-ink">
              ← Reports
            </Link>
          </p>
        </div>
        <PrintButton />
      </div>

      <p className="text-sm text-ink-soft">As of {today}</p>

      {error ? (
        <p className="text-sm text-clay">Could not load properties: {error.message}</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-panel border border-line rounded-xl p-4">
              <p className="text-xs text-ink-soft">Total units</p>
              <p className="text-lg font-semibold text-ink mt-1">{allUnits.length}</p>
            </div>
            <div className="bg-panel border border-line rounded-xl p-4">
              <p className="text-xs text-ink-soft">Occupied</p>
              <p className="text-lg font-semibold text-ink mt-1">
                {occupiedCount} ({allUnits.length ? Math.round((occupiedCount / allUnits.length) * 100) : 0}%)
              </p>
            </div>
            <div className="bg-panel border border-line rounded-xl p-4">
              <p className="text-xs text-ink-soft">Vacant</p>
              <p className="text-lg font-semibold text-ink mt-1">{vacantCount}</p>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-ink mb-3">Leases expiring within 60 days</h2>
            <div className="bg-panel border border-line rounded-xl overflow-hidden">
              {expiringSoon.length === 0 ? (
                <p className="text-sm text-ink-soft p-5">Nothing expiring in the next 60 days.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line text-left text-xs text-ink-soft uppercase tracking-wide">
                      <th className="px-5 py-3 font-medium">Property / unit</th>
                      <th className="px-5 py-3 font-medium">Tenant</th>
                      <th className="px-5 py-3 font-medium">Lease end</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expiringSoon.map((u) => (
                      <tr key={u.id} className="border-b border-line last:border-b-0">
                        <td className="px-5 py-3 text-ink font-medium">
                          {u.propertyName} — {u.label}
                        </td>
                        <td className="px-5 py-3 text-ink-soft">{u.lease?.tenants?.name ?? '—'}</td>
                        <td className="px-5 py-3 text-ink-soft">{u.lease?.end_date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-ink mb-3">All units by property</h2>
            <div className="bg-panel border border-line rounded-xl overflow-hidden">
              {allUnits.length === 0 ? (
                <p className="text-sm text-ink-soft p-5">No units on file yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line text-left text-xs text-ink-soft uppercase tracking-wide">
                      <th className="px-5 py-3 font-medium">Property</th>
                      <th className="px-5 py-3 font-medium">Unit</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allUnits.map((u) => (
                      <tr key={u.id} className="border-b border-line last:border-b-0">
                        <td className="px-5 py-3 text-ink font-medium">{u.propertyName}</td>
                        <td className="px-5 py-3 text-ink-soft">{u.label}</td>
                        <td className="px-5 py-3">
                          <span
                            className={
                              'text-xs uppercase tracking-wide font-medium px-2 py-0.5 rounded ' +
                              (u.status === 'occupied' ? 'bg-field-bg text-field' : 'bg-brass/10 text-brass-deep')
                            }
                          >
                            {u.status}
                          </span>
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
