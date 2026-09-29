'use server'

import { createClient } from '@/lib/supabase/server'

export type SearchResult = {
  type: 'landlord' | 'property' | 'tenant' | 'valuation_job'
  typeLabel: string
  id: string
  label: string
  sublabel?: string
  href: string
}

// Landlords and tenants don't have their own detail pages yet, so those
// results link to the list page rather than a specific record — still
// useful (gets you to the right module fast), just not a deep link.
const TYPE_LABEL: Record<SearchResult['type'], string> = {
  landlord: 'Landlord',
  property: 'Property',
  tenant: 'Tenant',
  valuation_job: 'Valuation',
}

export async function globalSearch(query: string): Promise<SearchResult[]> {
  const q = query.trim()
  if (q.length < 2) return []

  const supabase = await createClient()
  const pattern = `%${q}%`

  // Each of these is already scoped to the caller's firm by RLS — this is
  // a convenience lookup across modules, not a new access path.
  const [{ data: landlords }, { data: properties }, { data: tenants }, { data: valuationJobs }] =
    await Promise.all([
      supabase.from('landlords').select('id, name').ilike('name', pattern).limit(5),
      supabase.from('properties').select('id, name, address').ilike('name', pattern).limit(5),
      supabase.from('tenants').select('id, name').ilike('name', pattern).limit(5),
      supabase.from('valuation_jobs').select('id, client_name').ilike('client_name', pattern).limit(5),
    ])

  const results: SearchResult[] = [
    ...(landlords ?? []).map((l) => ({
      type: 'landlord' as const,
      typeLabel: TYPE_LABEL.landlord,
      id: l.id as string,
      label: l.name as string,
      href: '/dashboard/landlords',
    })),
    ...(properties ?? []).map((p) => ({
      type: 'property' as const,
      typeLabel: TYPE_LABEL.property,
      id: p.id as string,
      label: p.name as string,
      sublabel: p.address as string,
      href: `/dashboard/properties/${p.id}`,
    })),
    ...(tenants ?? []).map((t) => ({
      type: 'tenant' as const,
      typeLabel: TYPE_LABEL.tenant,
      id: t.id as string,
      label: t.name as string,
      href: '/dashboard/tenants',
    })),
    ...(valuationJobs ?? []).map((v) => ({
      type: 'valuation_job' as const,
      typeLabel: TYPE_LABEL.valuation_job,
      id: v.id as string,
      label: v.client_name as string,
      href: `/dashboard/valuations/${v.id}`,
    })),
  ]

  return results
}
