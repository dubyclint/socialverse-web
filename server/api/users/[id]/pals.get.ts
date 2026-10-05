import { createError, defineEventHandler, getRouterParam } from 'h3'
import { requireUser } from '~/server/utils/auth'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { DIRECTORY_COLUMNS, loadRelationships, toDirectoryProfile } from '~/server/utils/social-graph'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** A user's accepted PALs, annotated with the viewer's relationship to each. */
export default defineEventHandler(async (event) => {
  const viewer = await requireUser(event)
  const userId = getRouterParam(event, 'id') ?? ''
  if (!UUID_RE.test(userId)) throw createError({ statusCode: 400, statusMessage: 'Invalid user ID' })

  const service = getServiceClient()
  const { data: rows, error } = await service
    .from('pals')
    .select('user_id, pal_id')
    .eq('status', 'accepted')
    .or(`user_id.eq.${userId},pal_id.eq.${userId}`)
    .limit(200)
  if (error) throw createError({ statusCode: 500, statusMessage: 'Could not load PALs' })

  const ids = (rows ?? []).map(row => (row.user_id === userId ? row.pal_id : row.user_id))
  if (!ids.length) return { success: true, data: [], total: 0 }

  const [{ data: profiles }, relationships] = await Promise.all([
    service.from('user').select(DIRECTORY_COLUMNS).in('user_id', ids),
    loadRelationships(service, viewer.id, ids)
  ])

  return {
    success: true,
    data: (profiles ?? []).map(row => ({ ...toDirectoryProfile(row), relationship: relationships.get(row.user_id) })),
    total: ids.length
  }
})
