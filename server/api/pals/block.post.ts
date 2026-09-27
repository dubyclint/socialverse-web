import { createError, defineEventHandler, readBody } from 'h3'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { requireUser } from '~/server/utils/auth'

/** Block or unblock a user; blocking also removes any PAL relationship. */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const { userId, action } = await readBody<{ userId?: string, action?: 'block' | 'unblock' }>(event)
  if (!userId || userId === user.id || !action) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid request' })
  }

  const service = getServiceClient()

  if (action === 'unblock') {
    await service
      .from('user_blocks')
      .delete()
      .eq('blocker_id', user.id)
      .eq('blocked_id', userId)
    return { success: true, blocked: false }
  }

  const { error } = await service
    .from('user_blocks')
    .upsert({ blocker_id: user.id, blocked_id: userId }, { onConflict: 'blocker_id,blocked_id' })

  if (error) throw createError({ statusCode: 500, statusMessage: 'Could not block user' })

  await service
    .from('pals')
    .delete()
    .or(`and(user_id.eq.${user.id},pal_id.eq.${userId}),and(user_id.eq.${userId},pal_id.eq.${user.id})`)

  return { success: true, blocked: true }
})
