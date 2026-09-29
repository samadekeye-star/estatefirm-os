'use client'

import { useActionState, useState } from 'react'
import { createInvitation, type InvitationActionState } from '@/lib/actions/invitations'

const ROLE_LABEL: Record<string, string> = {
  owner: 'Owner',
  senior_surveyor: 'Senior surveyor',
  staff: 'Staff',
  read_only: 'Read only',
}

export function InviteStaffForm() {
  const [state, formAction, pending] = useActionState<InvitationActionState, FormData>(createInvitation, null)
  const [copied, setCopied] = useState(false)

  const link = state && 'link' in state ? state.link : null
  const error = state && 'error' in state ? state.error : null

  async function copyLink() {
    if (!link) return
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard access can fail (permissions, non-secure context) — the
      // link is still shown and selectable, so this isn't fatal.
    }
  }

  return (
    <form action={formAction} className="bg-panel border border-line rounded-xl p-5 space-y-4">
      <h2 className="text-sm font-semibold text-ink">Invite staff</h2>
      <p className="text-xs text-ink-soft -mt-2">
        Creates a one-time signup link, valid for 7 days, for you to send them yourself.
      </p>

      {error && <div className="bg-clay-bg text-clay text-sm px-3.5 py-2.5 rounded-md">{error}</div>}

      {link && (
        <div className="bg-field-bg text-field text-sm px-3.5 py-2.5 rounded-md flex items-center justify-between gap-3">
          <span className="truncate">{link}</span>
          <button type="button" onClick={copyLink} className="text-xs font-medium underline flex-shrink-0">
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-ink-soft mb-1.5">Email</label>
          <input
            type="email"
            name="email"
            required
            placeholder="colleague@example.com"
            className="w-full px-3.5 py-2.5 border border-line rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brass/40"
          />
        </div>
        <div>
          <label className="block text-xs text-ink-soft mb-1.5">Role</label>
          <select
            name="role"
            defaultValue="staff"
            className="w-full px-3.5 py-2.5 border border-line rounded-md text-sm bg-panel focus:outline-none focus:ring-2 focus:ring-brass/40"
          >
            {Object.entries(ROLE_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="bg-ink text-bone rounded-md px-4 py-2.5 text-sm font-medium disabled:opacity-60"
      >
        {pending ? 'Creating link…' : 'Create invite link'}
      </button>
    </form>
  )
}
