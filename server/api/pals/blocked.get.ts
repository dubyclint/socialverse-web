import { createError, defineEventHandler } from 'h3'
import { serverSupabaseUser } from '#supabase/server'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { loadProfiles } from '~/server/utils/pals'

/** Users the signed-in account has blocked. */
export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const service = getServiceClient()
  const { data } = await service
    .from('user_blocks')
    .select('blocked_id, created_at')
    .eq('blocker_id', user.id)
    .order('created_at', { ascending: false })

  const ids = (data ?? []).map(row => row.blocked_id).filter((id): id is string => Boolean(id))
  const profiles = await loadProfiles(service, ids)

  return {
    success: true,
    blocked: ids.map(id => profiles.get(id)).filter(Boolean)
  }
})
