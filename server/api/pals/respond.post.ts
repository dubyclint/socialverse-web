import { createError, defineEventHandler, readBody } from 'h3'
import { serverSupabaseUser } from '#supabase/server'
import { getServiceClient } from '~/server/utils/supabase-admin'

type Action = 'accept' | 'decline' | 'cancel'

/** Accept or decline an incoming request, or cancel an outgoing one. */
export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const { requestId, action } = await readBody<{ requestId?: string, action?: Action }>(event)
  if (!requestId || !action || !['accept', 'decline', 'cancel'].includes(action)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid request' })
  }

  const service = getServiceClient()
  const { data: row } = await service
    .from('pals')
    .select('id, user_id, pal_id, status')
    .eq('id', requestId)
    .maybeSingle()

  if (!row || row.status !== 'pending') {
    throw createError({ statusCode: 404, statusMessage: 'Request not found' })
  }

  const isRecipient = row.pal_id === user.id
  const isSender = row.user_id === user.id
  if ((action === 'cancel' && !isSender) || (action !== 'cancel' && !isRecipient)) {
    throw createError({ statusCode: 403, statusMessage: 'Not your request' })
  }

  if (action === 'accept') {
    await service.from('pals').update({ status: 'accepted' }).eq('id', row.id)
    await service.from('notifications').insert({
      recipient_id: row.user_id,
      notifier_id: user.id,
      event_type: 'PAL_ACCEPTED',
      message_text: 'accepted your PAL request',
      source_id: user.id
    })
    return { success: true, status: 'accepted' }
  }

  await service.from('pals').delete().eq('id', row.id)
  return { success: true, status: action === 'cancel' ? 'cancelled' : 'declined' }
})
