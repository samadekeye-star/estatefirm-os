import { createClient } from '@/lib/supabase/server'
import { NewTenantForm } from './new-tenant-form'

export default async function TenantsPage() {
  const supabase = await createClient()

  const { data: tenants, error } = await supabase
    .from('tenants')
    .select('id, name, phone, email, guarantor_name')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-ink">Tenants</h1>
        <p className="text-sm text-ink-soft mt-1">Everyone renting through your firm.</p>
      </div>

      <NewTenantForm />

      <div className="bg-panel border border-line rounded-xl overflow-hidden">
        {error ? (
          <p className="text-sm text-clay p-5">Could not load tenants: {error.message}</p>
        ) : !tenants || tenants.length === 0 ? (
          <p className="text-sm text-ink-soft p-5">No tenants yet — add your first one above.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-ink-soft uppercase tracking-wide">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Contact</th>
                <th className="px-5 py-3 font-medium">Guarantor</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => (
                <tr key={t.id} className="border-b border-line last:border-b-0">
                  <td className="px-5 py-3 text-ink font-medium">{t.name}</td>
                  <td className="px-5 py-3 text-ink-soft">
                    {t.phone ?? '—'}
                    {t.email ? ` · ${t.email}` : ''}
                  </td>
                  <td className="px-5 py-3 text-ink-soft">{t.guarantor_name ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
