import { createClient } from '@/lib/supabase/server'
import { NewDocumentForm } from './new-document-form'

const RELATED_TYPE_LABEL: Record<string, string> = {
  landlord: 'Landlord',
  property: 'Property',
  tenant: 'Tenant',
  valuation_job: 'Valuation job',
}

const TAG_LABEL: Record<string, string> = {
  lease: 'Lease',
  title: 'Title',
  inspection: 'Inspection',
  arrears: 'Arrears',
  report: 'Report',
  general: 'General',
}

type DocRow = {
  id: string
  tag: string
  file_name: string
  version: number
  storage_path: string
  related_type: string
  related_id: string
  created_at: string
}

export default async function DocumentsPage() {
  const supabase = await createClient()

  const [{ data: landlords }, { data: properties }, { data: tenants }, { data: valuationJobs }, { data: docs, error }] =
    await Promise.all([
      supabase.from('landlords').select('id, name').order('name'),
      supabase.from('properties').select('id, name').order('name'),
      supabase.from('tenants').select('id, name').order('name'),
      supabase.from('valuation_jobs').select('id, client_name').order('created_at', { ascending: false }),
      supabase
        .from('documents')
        .select('id, tag, file_name, version, storage_path, related_type, related_id, created_at')
        .order('created_at', { ascending: false }),
    ])

  const options = [
    ...(landlords ?? []).map((l) => ({ type: 'landlord', id: l.id as string, label: l.name as string })),
    ...(properties ?? []).map((p) => ({ type: 'property', id: p.id as string, label: p.name as string })),
    ...(tenants ?? []).map((t) => ({ type: 'tenant', id: t.id as string, label: t.name as string })),
    ...(valuationJobs ?? []).map((v) => ({
      type: 'valuation_job',
      id: v.id as string,
      label: `Valuation — ${v.client_name}`,
    })),
  ]

  const nameByKey = new Map(options.map((o) => [`${o.type}:${o.id}`, o.label]))

  const docRows = (docs ?? []) as DocRow[]
  const signedUrls = await Promise.all(
    docRows.map((d) => supabase.storage.from('documents').createSignedUrl(d.storage_path, 60 * 60))
  )

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-ink">Documents</h1>
        <p className="text-sm text-ink-soft mt-1">
          Leases, titles, inspection reports and anything else worth keeping on file.
        </p>
      </div>

      <NewDocumentForm options={options} />

      <div className="bg-panel border border-line rounded-xl overflow-hidden">
        {error ? (
          <p className="text-sm text-clay p-5">Could not load documents: {error.message}</p>
        ) : docRows.length === 0 ? (
          <p className="text-sm text-ink-soft p-5">No documents yet — upload the first one above.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-ink-soft uppercase tracking-wide">
                <th className="px-5 py-3 font-medium">File</th>
                <th className="px-5 py-3 font-medium">About</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Uploaded</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {docRows.map((d, i) => {
                const label = nameByKey.get(`${d.related_type}:${d.related_id}`) ?? 'Record no longer on file'
                const url = signedUrls[i].data?.signedUrl
                return (
                  <tr key={d.id} className="border-b border-line last:border-b-0">
                    <td className="px-5 py-3 text-ink font-medium">{d.file_name}</td>
                    <td className="px-5 py-3 text-ink-soft">
                      {RELATED_TYPE_LABEL[d.related_type] ?? d.related_type}: {label}
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs uppercase tracking-wide font-medium px-2 py-0.5 rounded bg-brass/10 text-brass-deep">
                        {TAG_LABEL[d.tag] ?? d.tag}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-ink-soft">{d.created_at.slice(0, 10)}</td>
                    <td className="px-5 py-3 text-right">
                      {url ? (
                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-brass-deep font-medium">
                          Download
                        </a>
                      ) : (
                        <span className="text-ink-soft">Link unavailable</span>
                      )}
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
