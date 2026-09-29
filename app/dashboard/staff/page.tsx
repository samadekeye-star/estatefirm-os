import { createClient } from '@/lib/supabase/server'
import { InviteStaffForm } from './invite-staff-form'
import { RevokeButton } from './revoke-button'

const ROLE_LABEL: Record<string, string> = {
  owner: 'Owner',
  senior_surveyor: 'Senior surveyor',
  staff: 'Staff',
  read_only: 'Read only',
}

export default async function StaffPage() {
  const supabase = await createClient()

  const { data: userData } = await supabase.auth.getUser()
  const [{ data: profile }, { data: profiles, error: profilesError }, { data: invitations }] = await Promise.all([
    supabase.from('profiles').select('role').eq('id', userData.user?.id ?? '').single(),
    supabase.from('profiles').select('id, name, role, created_at').order('created_at', { ascending: true }),
    supabase
      .from('invitations')
      .select('id, email, role, status, expires_at, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: false }),
  ])

  const isOwner = profile?.role === 'owner'

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-ink">Staff</h1>
        <p className="text-sm text-ink-soft mt-1">Everyone signed in under your firm.</p>
      </div>

      {isOwner ? (
        <InviteStaffForm />
      ) : (
        <div className="bg-panel border border-line rounded-xl p-5">
          <p className="text-sm text-ink-soft">Only an owner can invite new staff.</p>
        </div>
      )}

      <div>
        <h2 className="text-sm font-semibold text-ink mb-3">Team</h2>
        <div className="bg-panel border border-line rounded-xl overflow-hidden">
          {profilesError ? (
            <p className="text-sm text-clay p-5">Could not load staff: {profilesError.message}</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-ink-soft uppercase tracking-wide">
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Role</th>
                </tr>
              </thead>
              <tbody>
                {(profiles ?? []).map((p) => (
                  <tr key={p.id} className="border-b border-line last:border-b-0">
                    <td className="px-5 py-3 text-ink font-medium">{p.name}</td>
                    <td className="px-5 py-3 text-ink-soft">{ROLE_LABEL[p.role] ?? p.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {isOwner && (invitations ?? []).length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-ink mb-3">Pending invitations</h2>
          <div className="bg-panel border border-line rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-ink-soft uppercase tracking-wide">
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">Role</th>
                  <th className="px-5 py-3 font-medium">Expires</th>
                  <th className="px-5 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {(invitations ?? []).map((inv) => (
                  <tr key={inv.id} className="border-b border-line last:border-b-0">
                    <td className="px-5 py-3 text-ink font-medium">{inv.email}</td>
                    <td className="px-5 py-3 text-ink-soft">{ROLE_LABEL[inv.role] ?? inv.role}</td>
                    <td className="px-5 py-3 text-ink-soft">{inv.expires_at.slice(0, 10)}</td>
                    <td className="px-5 py-3 text-right">
                      <RevokeButton invitationId={inv.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
