import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { logout, bootstrapProfileIfNeeded } from '@/lib/actions/auth'
import { GlobalSearch } from './global-search'

const NAV_LIVE = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/dashboard/landlords', label: 'Landlords' },
  { href: '/dashboard/properties', label: 'Properties & units' },
  { href: '/dashboard/tenants', label: 'Tenants' },
  { href: '/dashboard/leases', label: 'Leases' },
  { href: '/dashboard/rent', label: 'Rent ledger' },
  { href: '/dashboard/valuations', label: 'Valuations' },
  { href: '/dashboard/documents', label: 'Documents' },
  { href: '/dashboard/reports', label: 'Reports' },
  { href: '/dashboard/staff', label: 'Staff' },
]

const NAV_COMING_SOON: string[] = []

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()

  if (!userData.user) {
    redirect('/login')
  }

  // profiles_select_same_firm lets this read any profile in the same firm,
  // but we only ever ask for our own row here.
  let { data: profile } = await supabase
    .from('profiles')
    .select('name, role, firms ( name )')
    .eq('id', userData.user.id)
    .single()

  // A signed-in user with no profile row is someone whose signup couldn't
  // create their firm yet — email confirmation was required, so there was
  // no session at signup time (see lib/actions/auth.ts). Finish that setup
  // now that they're actually logged in; harmless to attempt otherwise,
  // since it's a no-op once the profile already exists. Confirmed working
  // end-to-end against the live project on 2026-09-29.
  if (!profile) {
    const bootstrapResult = await bootstrapProfileIfNeeded()
    if (!bootstrapResult) {
      const { data: retried } = await supabase
        .from('profiles')
        .select('name, role, firms ( name )')
        .eq('id', userData.user.id)
        .single()
      profile = retried
    }
  }

  const firmName = (profile?.firms as unknown as { name: string } | null)?.name ?? 'Your firm'

  return (
    <div className="min-h-screen flex bg-bone">
      <aside className="no-print w-60 flex-shrink-0 bg-ink text-bone flex flex-col">
        <div className="px-5 py-6 flex items-center gap-2.5 border-b border-white/10">
          <svg width="22" height="22" viewBox="0 0 26 26" fill="none" className="flex-shrink-0">
            <circle cx="13" cy="13" r="12" stroke="#A9814F" strokeWidth="1.4" />
            <path d="M13 4 L13 8 M13 18 L13 22 M4 13 L8 13 M18 13 L22 13" stroke="#A9814F" strokeWidth="1.4" />
            <circle cx="13" cy="13" r="3" fill="#A9814F" />
          </svg>
          <span className="font-serif text-base font-semibold truncate">EstateFirm OS</span>
        </div>

        <div className="px-5 py-4 border-b border-white/10">
          <p className="text-sm font-medium truncate">{firmName}</p>
          <p className="text-xs text-bone/60 truncate">{profile?.name ?? userData.user.email}</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV_LIVE.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-3 py-2 rounded-md text-sm text-bone/90 hover:bg-white/10 transition-colors"
            >
              {item.label}
            </Link>
          ))}
          {NAV_COMING_SOON.map((label) => (
            <div
              key={label}
              className="px-3 py-2 rounded-md text-sm text-bone/35 flex items-center justify-between"
            >
              <span>{label}</span>
              <span className="text-[10px] uppercase tracking-wide border border-bone/20 rounded px-1.5 py-0.5">
                Soon
              </span>
            </div>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-white/10">
          <form action={logout}>
            <button
              type="submit"
              className="w-full text-left px-3 py-2 rounded-md text-sm text-bone/70 hover:bg-white/10 hover:text-bone transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 min-w-0 p-8">
        <div className="no-print mb-6">
          <GlobalSearch />
        </div>
        {children}
      </main>
    </div>
  )
}
