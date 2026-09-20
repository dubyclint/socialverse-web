import { createError, defineEventHandler } from 'h3'
import { serverSupabaseUser } from '#supabase/server'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { loadFriendIds, loadProfiles } from '~/server/utils/pals'

/** Accepted friends of the signed-in user. */
export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const service = getServiceClient()
  const friendIds = await loadFriendIds(service, user.id)
  const profiles = await loadProfiles(service, friendIds)

  return {
    success: true,
    pals: friendIds.map(id => profiles.get(id)).filter(Boolean),
    total: friendIds.length
  }
})
