import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function LandlordDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: landlord }, { data: properties, error: propertiesError }] = await Promise.all([
    supabase
      .from('landlords')
      .select('id, name, phone, email, bank_name, bank_account, commission_rate, kyc_status, created_at')
      .eq('id', id)
      .single(),
    supabase
      .from('properties')
      .select('id, name, address, property_type, units ( id, status )')
      .eq('landlord_id', id)
      .order('name'),
  ])

  // RLS means a landlord belonging to another firm simply won't be found
  // here (zero rows, not a permission error) — notFound() is the right call.
  if (!landlord) notFound()

  type PropertyWithUnits = {
    id: string
    name: string
    address: string
    property_type: string
    units: { id: string; status: string }[]
  }
  const propertyRows = (properties ?? []) as unknown as PropertyWithUnits[]

  const totalUnits = propertyRows.reduce((sum, p) => sum + p.units.length, 0)
  const occupiedUnits = propertyRows.reduce(
    (sum, p) => sum + p.units.filter((u) => u.status === 'occupied').length,
    0
  )

  return (
    <div className="space-y-8">
      <div>
        <Link href="/dashboard/landlords" className="text-sm text-ink-soft hover:text-ink">
          ← Landlords
        </Link>
        <div className="flex items-start justify-between mt-2">
          <div>
            <h1 className="font-serif text-2xl font-semibold text-ink">{landlord.name}</h1>
            <p className="text-sm text-ink-soft mt-1">
              {landlord.phone ?? '—'}
              {landlord.email ? ` · ${landlord.email}` : ''}
            </p>
          </div>
          <span
            className={
              'text-xs uppercase tracking-wide font-medium px-2 py-0.5 rounded ' +
              (landlord.kyc_status === 'verified' ? 'bg-field-bg text-field' : 'bg-brass/10 text-brass-deep')
            }
          >
            {landlord.kyc_status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-panel border border-line rounded-xl p-4">
          <p className="text-xs text-ink-soft">Commission rate</p>
          <p className="text-lg font-semibold text-ink mt-1">{Number(landlord.commission_rate)}%</p>
        </div>
        <div className="bg-panel border border-line rounded-xl p-4">
          <p className="text-xs text-ink-soft">Properties</p>
          <p className="text-lg font-semibold text-ink mt-1">{propertyRows.length}</p>
        </div>
        <div className="bg-panel border border-line rounded-xl p-4">
          <p className="text-xs text-ink-soft">Units</p>
          <p className="text-lg font-semibold text-ink mt-1">
            {occupiedUnits}/{totalUnits} occupied
          </p>
        </div>
        <div className="bg-panel border border-line rounded-xl p-4">
          <p className="text-xs text-ink-soft">Bank details</p>
          <p className="text-sm text-ink mt-1 truncate">
            {landlord.bank_name ? `${landlord.bank_name} · ${landlord.bank_account ?? '—'}` : 'Not on file'}
          </p>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-ink mb-3">Properties</h2>
        <div className="bg-panel border border-line rounded-xl overflow-hidden">
          {propertiesError ? (
            <p className="text-sm text-clay p-5">Could not load properties: {propertiesError.message}</p>
          ) : propertyRows.length === 0 ? (
            <p className="text-sm text-ink-soft p-5">No properties on file for this landlord yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-ink-soft uppercase tracking-wide">
                  <th className="px-5 py-3 font-medium">Property</th>
                  <th className="px-5 py-3 font-medium">Address</th>
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 font-medium">Units</th>
                </tr>
              </thead>
              <tbody>
                {propertyRows.map((p) => (
                  <tr key={p.id} className="border-b border-line last:border-b-0">
                    <td className="px-5 py-3 text-ink font-medium">
                      <Link href={`/dashboard/properties/${p.id}`} className="hover:text-brass-deep">
                        {p.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-ink-soft">{p.address}</td>
                    <td className="px-5 py-3 text-ink-soft capitalize">{p.property_type}</td>
                    <td className="px-5 py-3 text-ink-soft">
                      {p.units.filter((u) => u.status === 'occupied').length}/{p.units.length} occupied
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
