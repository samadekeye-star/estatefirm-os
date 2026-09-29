'use client'

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print bg-ink text-bone rounded-md px-4 py-2.5 text-sm font-medium"
    >
      Print / Save as PDF
    </button>
  )
}
