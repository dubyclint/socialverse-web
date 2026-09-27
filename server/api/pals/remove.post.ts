import { createError, defineEventHandler, readBody } from 'h3'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { requireUser } from '~/server/utils/auth'

/** Removes an accepted PAL relationship in either direction. */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const { userId } = await readBody<{ userId?: string }>(event)
  if (!userId) throw createError({ statusCode: 400, statusMessage: 'Invalid request' })

  const service = getServiceClient()
  const { error } = await service
    .from('pals')
    .delete()
    .or(`and(user_id.eq.${user.id},pal_id.eq.${userId}),and(user_id.eq.${userId},pal_id.eq.${user.id})`)

  if (error) throw createError({ statusCode: 500, statusMessage: 'Could not remove PAL' })

  return { success: true }
})
