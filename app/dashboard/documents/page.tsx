import { createClient } from '@/lib/supabase/server'
import { NewDocumentForm } from './new-document-form'
import { DocumentsTable, type DocumentRow } from './documents-table'

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

  // Resolved once here (not in the client component) since it needs the
  // server-fetched name lookups and signed URLs — the client component just
  // filters this already-flat, already-authorized list by text.
  const tableRows: DocumentRow[] = docRows.map((d, i) => ({
    id: d.id,
    fileName: d.file_name,
    aboutLabel: `${RELATED_TYPE_LABEL[d.related_type] ?? d.related_type}: ${
      nameByKey.get(`${d.related_type}:${d.related_id}`) ?? 'Record no longer on file'
    }`,
    tagLabel: TAG_LABEL[d.tag] ?? d.tag,
    createdAt: d.created_at,
    url: signedUrls[i].data?.signedUrl ?? null,
  }))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-ink">Documents</h1>
        <p className="text-sm text-ink-soft mt-1">
          Leases, titles, inspection reports and anything else worth keeping on file.
        </p>
      </div>

      <NewDocumentForm options={options} />

      {error ? (
        <div className="bg-panel border border-line rounded-xl p-5">
          <p className="text-sm text-clay">Could not load documents: {error.message}</p>
        </div>
      ) : (
        <DocumentsTable rows={tableRows} />
      )}
    </div>
  )
}
