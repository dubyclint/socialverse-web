import { createError, defineEventHandler } from 'h3'
import { serverSupabaseUser } from '#supabase/server'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { loadProfiles } from '~/server/utils/pals'

/** Pending friend requests, split into incoming and outgoing. */
export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const service = getServiceClient()

  const { data, error } = await service
    .from('pals')
    .select('id, user_id, pal_id, created_at')
    .eq('status', 'pending')
    .or(`user_id.eq.${user.id},pal_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  if (error) throw createError({ statusCode: 500, statusMessage: 'Could not load requests' })

  const rows = data ?? []
  const otherIds = rows.map(row => (row.user_id === user.id ? row.pal_id : row.user_id))
  const profiles = await loadProfiles(service, otherIds)

  const shape = (row: typeof rows[number], otherId: string) => ({
    requestId: row.id,
    createdAt: row.created_at,
    user: profiles.get(otherId) ?? null
  })

  return {
    success: true,
    incoming: rows.filter(row => row.pal_id === user.id).map(row => shape(row, row.user_id)),
    outgoing: rows.filter(row => row.user_id === user.id).map(row => shape(row, row.pal_id))
  }
})
