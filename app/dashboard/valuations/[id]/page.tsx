import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CalculationForm } from './calculation-form'
import { StageActions } from './stage-actions'

const STAGE_LABEL: Record<string, string> = {
  instructed: 'Instructed',
  inspection: 'Inspection',
  draft: 'Draft',
  approved: 'Approved',
}

export default async function ValuationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: job } = await supabase
    .from('valuation_jobs')
    .select(
      'id, client_name, purpose, method, stage, fee, passing_rent, yield_pct, adjustments, market_value, properties ( name, address )'
    )
    .eq('id', id)
    .single()

  if (!job) {
    notFound()
  }

  const propertyName = (job.properties as unknown as { name: string; address: string } | null)?.name ?? 'Not on file'
  const propertyAddress = (job.properties as unknown as { name: string; address: string } | null)?.address

  return (
    <div className="space-y-8">
      <div>
        <Link href="/dashboard/valuations" className="text-sm text-brass-deep font-medium">
          &larr; Valuations
        </Link>
        <h1 className="font-serif text-2xl font-semibold text-ink mt-2">{job.client_name}</h1>
        <p className="text-sm text-ink-soft mt-1">
          {propertyName}
          {propertyAddress ? ` — ${propertyAddress}` : ''}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-panel border border-line rounded-xl p-4">
          <p className="text-xs text-ink-soft">Purpose</p>
          <p className="text-sm text-ink font-medium capitalize mt-1">{job.purpose}</p>
        </div>
        <div className="bg-panel border border-line rounded-xl p-4">
          <p className="text-xs text-ink-soft">Method</p>
          <p className="text-sm text-ink font-medium capitalize mt-1">{job.method}</p>
        </div>
        <div className="bg-panel border border-line rounded-xl p-4">
          <p className="text-xs text-ink-soft">Fee</p>
          <p className="text-sm text-ink font-medium mt-1">₦{Number(job.fee ?? 0).toLocaleString('en-NG')}</p>
        </div>
        <div className="bg-panel border border-line rounded-xl p-4">
          <p className="text-xs text-ink-soft">Stage</p>
          <p className="text-sm text-ink font-medium mt-1">{STAGE_LABEL[job.stage] ?? job.stage}</p>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-xl p-5">
        <h2 className="text-sm font-semibold text-ink mb-3">Progress</h2>
        <StageActions jobId={job.id} stage={job.stage} />
      </div>

      <CalculationForm
        jobId={job.id}
        passingRent={job.passing_rent}
        yieldPct={job.yield_pct}
        adjustments={job.adjustments}
        marketValue={job.market_value}
      />
    </div>
  )
}
