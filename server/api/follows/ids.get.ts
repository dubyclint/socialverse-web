import { defineEventHandler } from 'h3'
import { requireUser } from '~/server/utils/auth'
import { getServiceClient } from '~/server/utils/supabase-admin'

/** Ids of every account the caller follows; drives follow buttons across the app. */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const { data } = await getServiceClient()
    .from('follows')
    .select('following_id')
    .eq('follower_id', user.id)
  return { success: true, data: (data ?? []).map(row => row.following_id) }
})
