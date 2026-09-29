'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentFirmId } from './helpers'
import { revalidatePath } from 'next/cache'

export type DocumentActionState = { error: string } | null

const RELATED_TYPES = ['landlord', 'property', 'tenant', 'valuation_job'] as const
const TAGS = ['lease', 'title', 'inspection', 'arrears', 'report', 'general'] as const

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9.\-_]+/g, '_')
}

export async function uploadDocument(
  _prevState: DocumentActionState,
  formData: FormData
): Promise<DocumentActionState> {
  const relatedType = formData.get('relatedType') as string
  const relatedId = formData.get('relatedId') as string
  const tag = (formData.get('tag') as string) || 'general'
  const file = formData.get('file') as File | null

  if (!RELATED_TYPES.includes(relatedType as (typeof RELATED_TYPES)[number])) {
    return { error: 'Please choose what this document is about.' }
  }
  if (!relatedId) {
    return { error: 'Please choose the specific record this document belongs to.' }
  }
  if (!TAGS.includes(tag as (typeof TAGS)[number])) {
    return { error: 'Please choose a valid document type.' }
  }
  if (!file || file.size === 0) {
    return { error: 'Please choose a file to upload.' }
  }

  const supabase = await createClient()
  const firm = await getCurrentFirmId(supabase)
  if ('error' in firm) return firm

  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return { error: 'Your session has expired. Please sign in again.' }

  // The firm_id folder segment is what documents_select_own_firm and its
  // siblings (supabase/04_storage.sql) actually check — this path is the
  // real security boundary for the file itself, not just a naming scheme.
  const path = `${firm.firmId}/${relatedType}/${relatedId}/${Date.now()}-${sanitizeFileName(file.name)}`

  const { error: uploadError } = await supabase.storage.from('documents').upload(path, file, {
    contentType: file.type || 'application/octet-stream',
  })

  if (uploadError) {
    return { error: `Upload failed: ${uploadError.message}` }
  }

  const { error: insertError } = await supabase.from('documents').insert({
    firm_id: firm.firmId,
    related_type: relatedType,
    related_id: relatedId,
    tag,
    storage_path: path,
    file_name: file.name,
    uploaded_by: userData.user.id,
  })

  if (insertError) {
    // The file itself already made it into Storage — best-effort clean-up
    // so a failed row insert doesn't leave an orphaned, unlisted file behind.
    await supabase.storage.from('documents').remove([path])
    return { error: insertError.message }
  }

  revalidatePath('/dashboard/documents')
  return null
}
