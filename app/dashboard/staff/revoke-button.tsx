'use client'

import { useTransition } from 'react'
import { revokeInvitation } from '@/lib/actions/invitations'

export function RevokeButton({ invitationId }: { invitationId: string }) {
  const [pending, startTransition] = useTransition()

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm('Revoke this invitation?')) {
          startTransition(async () => {
            await revokeInvitation(invitationId)
          })
        }
      }}
      className="text-xs text-ink-soft hover:text-clay border border-line rounded px-2 py-1 disabled:opacity-50"
    >
      Revoke
    </button>
  )
}
