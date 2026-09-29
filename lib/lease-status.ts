// Nothing runs on a schedule to flip a lease from 'active' to 'renewal_due'
// as its end date approaches — same class of bug as the dashboard's
// "Overdue rent" widget (see app/dashboard/page.tsx), so it's computed here
// at display time instead of trusted from the stored `status` column.
// 'notice_served' and 'vacated' stay real, manually-set statuses (a human
// decision, not a date crossing a threshold), so those pass through as-is.
export const RENEWAL_WINDOW_DAYS = 60

export function displayLeaseStatus(status: string, endDate: string, today = new Date()): string {
  if (status !== 'active') return status
  const todayISO = today.toISOString().slice(0, 10)
  const windowEnd = new Date(today.getTime() + RENEWAL_WINDOW_DAYS * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)
  if (endDate <= windowEnd && endDate >= todayISO) return 'renewal_due'
  return status
}
