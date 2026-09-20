import { createError, defineEventHandler, readBody } from 'h3'
import { serverSupabaseUser } from '#supabase/server'
import { getServiceClient } from '~/server/utils/supabase-admin'

/**
 * Sends a friend request. If the other side already requested us, the pair is
 * accepted immediately (the WhatsApp-style "you both added each other" case).
 */
export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const { userId } = await readBody<{ userId?: string }>(event)
  if (!userId || userId === user.id) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid recipient' })
  }

  const service = getServiceClient()

  const { data: blocked } = await service
    .from('user_blocks')
    .select('id')
    .or(`and(blocker_id.eq.${user.id},blocked_id.eq.${userId}),and(blocker_id.eq.${userId},blocked_id.eq.${user.id})`)
    .maybeSingle()

  if (blocked) throw createError({ statusCode: 403, statusMessage: 'Request not allowed' })

  const { data: existing } = await service
    .from('pals')
    .select('id, user_id, pal_id, status')
    .or(`and(user_id.eq.${user.id},pal_id.eq.${userId}),and(user_id.eq.${userId},pal_id.eq.${user.id})`)
    .maybeSingle()

  if (existing?.status === 'accepted') {
    return { success: true, status: 'accepted' }
  }

  if (existing && existing.status === 'pending' && existing.pal_id === user.id) {
    await service.from('pals').update({ status: 'accepted' }).eq('id', existing.id)
    await service.from('notifications').insert({
      recipient_id: userId,
      notifier_id: user.id,
      event_type: 'PAL_ACCEPTED',
      message_text: 'You are now PALs',
      source_id: user.id
    })
    return { success: true, status: 'accepted' }
  }

  if (existing) {
    await service
      .from('pals')
      .update({ status: 'pending', user_id: user.id, pal_id: userId })
      .eq('id', existing.id)
  } else {
    const { error } = await service
      .from('pals')
      .insert({ user_id: user.id, pal_id: userId, status: 'pending' })
    if (error) throw createError({ statusCode: 500, statusMessage: 'Could not send request' })
  }

  await service.from('notifications').insert({
    recipient_id: userId,
    notifier_id: user.id,
    event_type: 'PAL_REQUEST',
    message_text: 'sent you a PAL request',
    source_id: user.id
  })

  return { success: true, status: 'pending' }
})
