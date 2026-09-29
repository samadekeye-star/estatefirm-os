import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { NewLandlordForm } from './new-landlord-form'

export default async function LandlordsPage() {
  const supabase = await createClient()

  // landlords_all_own_firm scopes this to the caller's firm automatically —
  // a landlord belonging to another firm simply cannot appear in this list.
  const { data: landlords, error } = await supabase
    .from('landlords')
    .select('id, name, phone, email, commission_rate, kyc_status, created_at')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-ink">Landlords</h1>
        <p className="text-sm text-ink-soft mt-1">Everyone your firm manages property or leases on behalf of.</p>
      </div>

      <NewLandlordForm />

      <div className="bg-panel border border-line rounded-xl overflow-hidden">
        {error ? (
          <p className="text-sm text-clay p-5">Could not load landlords: {error.message}</p>
        ) : !landlords || landlords.length === 0 ? (
          <p className="text-sm text-ink-soft p-5">No landlords yet — add your first one above.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-ink-soft uppercase tracking-wide">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Contact</th>
                <th className="px-5 py-3 font-medium">Commission</th>
                <th className="px-5 py-3 font-medium">KYC</th>
              </tr>
            </thead>
            <tbody>
              {landlords.map((l) => (
                <tr key={l.id} className="border-b border-line last:border-b-0">
                  <td className="px-5 py-3 text-ink font-medium">
                    <Link href={`/dashboard/landlords/${l.id}`} className="hover:text-brass-deep">
                      {l.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-ink-soft">
                    {l.phone ?? '—'}
                    {l.email ? ` · ${l.email}` : ''}
                  </td>
                  <td className="px-5 py-3 text-ink-soft">{Number(l.commission_rate)}%</td>
                  <td className="px-5 py-3">
                    <span
                      className={
                        'text-xs uppercase tracking-wide font-medium px-2 py-0.5 rounded ' +
                        (l.kyc_status === 'verified' ? 'bg-field-bg text-field' : 'bg-brass/10 text-brass-deep')
                      }
                    >
                      {l.kyc_status}
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
