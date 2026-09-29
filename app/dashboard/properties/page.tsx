import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { NewPropertyForm } from './new-property-form'

export default async function PropertiesPage() {
  const supabase = await createClient()

  const [{ data: properties, error }, { data: landlords }] = await Promise.all([
    supabase
      .from('properties')
      .select('id, name, address, property_type, landlords ( name ), units ( id, status )')
      .order('created_at', { ascending: false }),
    supabase.from('landlords').select('id, name').order('name'),
  ])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-ink">Properties</h1>
        <p className="text-sm text-ink-soft mt-1">Buildings and land your firm manages, with their units.</p>
      </div>

      <NewPropertyForm landlords={landlords ?? []} />

      <div className="bg-panel border border-line rounded-xl overflow-hidden">
        {error ? (
          <p className="text-sm text-clay p-5">Could not load properties: {error.message}</p>
        ) : !properties || properties.length === 0 ? (
          <p className="text-sm text-ink-soft p-5">No properties yet — add your first one above.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-ink-soft uppercase tracking-wide">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Address</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Landlord</th>
                <th className="px-5 py-3 font-medium">Units</th>
              </tr>
            </thead>
            <tbody>
              {properties.map((p) => {
                const units = (p.units ?? []) as { id: string; status: string }[]
                const occupied = units.filter((u) => u.status === 'occupied').length
                const landlordName = (p.landlords as unknown as { name: string } | null)?.name ?? '—'
                return (
                  <tr key={p.id} className="border-b border-line last:border-b-0">
                    <td className="px-5 py-3">
                      <Link href={`/dashboard/properties/${p.id}`} className="text-ink font-medium hover:text-brass-deep">
                        {p.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-ink-soft">{p.address}</td>
                    <td className="px-5 py-3 text-ink-soft capitalize">{p.property_type}</td>
                    <td className="px-5 py-3 text-ink-soft">{landlordName}</td>
                    <td className="px-5 py-3 text-ink-soft">
                      {occupied} / {units.length} occupied
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
