import { createError, defineEventHandler, readBody } from 'h3'
import { serverSupabaseUser } from '#supabase/server'
import { getServiceClient } from '~/server/utils/supabase-admin'

/** Removes an accepted PAL relationship in either direction. */
export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

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
