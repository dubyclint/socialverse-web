import { requireUser } from '~/server/utils/auth'
import { getServiceClient } from '~/server/utils/supabase-admin'

/** Number of the caller's P2P trades still in progress (for the sidebar badge). */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const { count } = await getServiceClient().from('p2p_trades')
    .select('id', { count: 'exact', head: true })
    .or(`seller_id.eq.${user.id},buyer_id.eq.${user.id}`)
    .in('status', ['funded', 'disputed'])
  return { count: count ?? 0 }
})
