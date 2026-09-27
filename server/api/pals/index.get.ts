import { defineEventHandler } from 'h3'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { loadFriendIds, loadProfiles } from '~/server/utils/pals'
import { requireUser } from '~/server/utils/auth'

/** Accepted friends of the signed-in user. */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const service = getServiceClient()
  const friendIds = await loadFriendIds(service, user.id)
  const profiles = await loadProfiles(service, friendIds)

  return {
    success: true,
    pals: friendIds.map(id => profiles.get(id)).filter(Boolean),
    total: friendIds.length
  }
})
