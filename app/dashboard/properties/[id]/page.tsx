import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { NewUnitForm } from './new-unit-form'

export default async function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: property }, { data: units, error: unitsError }] = await Promise.all([
    supabase
      .from('properties')
      .select('id, name, address, property_type, title_type, size_sqm, landlords ( name )')
      .eq('id', id)
      .single(),
    supabase.from('units').select('id, label, size_sqm, status').eq('property_id', id).order('label'),
  ])

  // RLS means a property belonging to another firm simply won't be found
  // here (zero rows, not a permission error) — notFound() is the right
  // response either way, not a special "not allowed" case to distinguish.
  if (!property) {
    notFound()
  }

  const landlordName = (property.landlords as unknown as { name: string } | null)?.name ?? 'No landlord on file'

  return (
    <div className="space-y-8">
      <div>
        <Link href="/dashboard/properties" className="text-sm text-brass-deep font-medium">
          &larr; Properties
        </Link>
        <h1 className="font-serif text-2xl font-semibold text-ink mt-2">{property.name}</h1>
        <p className="text-sm text-ink-soft mt-1">{property.address}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-panel border border-line rounded-xl p-4">
          <p className="text-xs text-ink-soft">Type</p>
          <p className="text-sm text-ink font-medium capitalize mt-1">{property.property_type}</p>
        </div>
        <div className="bg-panel border border-line rounded-xl p-4">
          <p className="text-xs text-ink-soft">Landlord</p>
          <p className="text-sm text-ink font-medium mt-1">{landlordName}</p>
        </div>
        <div className="bg-panel border border-line rounded-xl p-4">
          <p className="text-xs text-ink-soft">Title</p>
          <p className="text-sm text-ink font-medium mt-1">{property.title_type ?? '—'}</p>
        </div>
        <div className="bg-panel border border-line rounded-xl p-4">
          <p className="text-xs text-ink-soft">Size</p>
          <p className="text-sm text-ink font-medium mt-1">
            {property.size_sqm ? `${property.size_sqm} sqm` : '—'}
          </p>
        </div>
      </div>

      <NewUnitForm propertyId={property.id} />

      <div className="bg-panel border border-line rounded-xl overflow-hidden">
        {unitsError ? (
          <p className="text-sm text-clay p-5">Could not load units: {unitsError.message}</p>
        ) : !units || units.length === 0 ? (
          <p className="text-sm text-ink-soft p-5">No units yet — add the first one above.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-ink-soft uppercase tracking-wide">
                <th className="px-5 py-3 font-medium">Unit</th>
                <th className="px-5 py-3 font-medium">Size</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {units.map((u) => (
                <tr key={u.id} className="border-b border-line last:border-b-0">
                  <td className="px-5 py-3 text-ink font-medium">{u.label}</td>
                  <td className="px-5 py-3 text-ink-soft">{u.size_sqm ? `${u.size_sqm} sqm` : '—'}</td>
                  <td className="px-5 py-3">
                    <span
                      className={
                        'text-xs uppercase tracking-wide font-medium px-2 py-0.5 rounded ' +
                        (u.status === 'occupied' ? 'bg-clay-bg text-clay' : 'bg-field-bg text-field')
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
  )
}
