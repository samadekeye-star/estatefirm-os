import Link from 'next/link'

const REPORTS = [
  {
    href: '/dashboard/reports/landlord-statement',
    title: 'Landlord statement',
    description: "Rent collected and outstanding across one landlord's properties, for a period — what you'd send them.",
  },
  {
    href: '/dashboard/reports/rent-collection',
    title: 'Rent collection',
    description: 'Firm-wide rent collected vs. outstanding over a date range, by property and tenant.',
  },
  {
    href: '/dashboard/reports/occupancy',
    title: 'Occupancy',
    description: 'Vacant vs. occupied units across every property, with lease expiry dates.',
  },
  {
    href: '/dashboard/reports/valuations',
    title: 'Valuation summary',
    description: 'Valuation jobs by stage, with fees and market values, over a period.',
  },
]

export default function ReportsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-ink">Reports</h1>
        <p className="text-sm text-ink-soft mt-1">
          Each report opens on screen — use your browser&apos;s print button (or Ctrl/Cmd+P) to save it as a PDF.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {REPORTS.map((r) => (
          <Link
            key={r.href}
            href={r.href}
            className="block bg-panel border border-line rounded-xl p-5 hover:border-brass/50 transition-colors"
          >
            <h2 className="text-sm font-semibold text-ink">{r.title}</h2>
            <p className="text-sm text-ink-soft mt-1.5">{r.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
