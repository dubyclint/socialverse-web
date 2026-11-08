import { requireUser } from '~/server/utils/auth'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { resolveActor } from '~/server/utils/actor'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = getRouterParam(event, 'id') ?? ''
  const actor = await resolveActor(event)
  const base = getServiceClient()
    .from('user_statuses')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  const { data, error } = await (actor.type === 'PAGE' ? base.eq('page_id', actor.id) : base.eq('user_id', user.id).is('page_id', null))
    .select('id')
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  if (!data?.length) throw createError({ statusCode: 404, statusMessage: 'Status not found' })
  return { success: true }
})
