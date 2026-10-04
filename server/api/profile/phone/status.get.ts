import { getServiceClient } from '~/server/utils/supabase-admin'
import { requireUser } from '~/server/utils/auth'

interface PhoneStatusResponse {
  phone: string | null
  phone_country: string | null
  phone_verified: boolean
  pending_phone: string | null
  verifying: boolean
  awaiting_contact: boolean
  revert_until: string | null
}

export default defineEventHandler(async (event): Promise<PhoneStatusResponse> => {
  const user = await requireUser(event)
  const service = getServiceClient()
  const now = new Date().toISOString()

  const [{ data: row, error }, { data: pending }, { data: revertable }] = await Promise.all([
    service.from('user').select('phone, phone_country, phone_verified').eq('user_id', user.id).maybeSingle(),
    service.from('phone_verifications').select('phone, token_expires_at, chat_id').eq('user_id', user.id).maybeSingle(),
    service
      .from('phone_history')
      .select('revert_until')
      .eq('user_id', user.id)
      .in('reason', ['update', 'verified'])
      .is('reverted_at', null)
      .gt('revert_until', now)
      .order('changed_at', { ascending: false })
      .limit(1)
      .maybeSingle()
  ])
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  const verifying = Boolean(pending?.token_expires_at && pending.token_expires_at > now)
  return {
    phone: row?.phone ?? null,
    phone_country: row?.phone_country ?? null,
    phone_verified: row?.phone_verified ?? false,
    pending_phone: pending?.phone ?? null,
    verifying,
    awaiting_contact: verifying && Boolean(pending?.chat_id),
    revert_until: revertable?.revert_until ?? null
  }
})
