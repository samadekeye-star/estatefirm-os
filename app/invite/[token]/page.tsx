import { createClient } from '@/lib/supabase/server'
import { AcceptInviteForm } from './accept-invite-form'

const ROLE_LABEL: Record<string, string> = {
  owner: 'Owner',
  senior_surveyor: 'Senior surveyor',
  staff: 'Staff',
  read_only: 'Read only',
}

export default async function AcceptInvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = await createClient()

  const { data } = await supabase.rpc('get_invitation_by_token', { p_token: token }).single()
  const invitation = data as { firm_name: string; role: string; email: string; valid: boolean } | null

  const isValid = invitation?.valid === true

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink p-6">
      <div className="w-full max-w-sm bg-panel rounded-xl p-10 pb-8 shadow-2xl">
        <div className="flex items-center gap-2.5 mb-1">
          <svg width="24" height="24" viewBox="0 0 26 26" fill="none">
            <circle cx="13" cy="13" r="12" stroke="#A9814F" strokeWidth="1.4" />
            <path d="M13 4 L13 8 M13 18 L13 22 M4 13 L8 13 M18 13 L22 13" stroke="#A9814F" strokeWidth="1.4" />
            <circle cx="13" cy="13" r="3" fill="#A9814F" />
          </svg>
          <span className="font-serif text-lg font-semibold text-ink">EstateFirm OS</span>
        </div>

        {!isValid ? (
          <>
            <p className="text-sm text-ink-soft mt-6">
              This invitation is invalid or has expired. Ask whoever invited you to send a new one.
            </p>
          </>
        ) : (
          <>
            <p className="text-sm text-ink-soft mb-7 mt-1">
              You&apos;ve been invited to join <span className="text-ink font-medium">{invitation!.firm_name}</span> as{' '}
              {ROLE_LABEL[invitation!.role] ?? invitation!.role}. Set a password to finish joining.
            </p>
            <AcceptInviteForm token={token} email={invitation!.email} />
          </>
        )}
      </div>
    </div>
  )
}
