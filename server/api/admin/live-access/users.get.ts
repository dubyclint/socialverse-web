import { getQuery } from 'h3'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { requireStaff } from '~/server/utils/staff'
import { getLiveEligibility } from '~/server/utils/live-access'

/** Users matching the search (or with an admin override when no search), with live eligibility. */
export default defineEventHandler(async (event) => {
  await requireStaff(event, 'compliance')
  const q = String(getQuery(event).q ?? '').trim().replace(/[%,()]/g, '')
  const service = getServiceClient()
  let ids: string[]
  if (q.length >= 2) {
    const { data } = await service.from('user').select('user_id')
      .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`).limit(15)
    ids = (data ?? []).map(u => u.user_id)
  } else {
    const { data } = await service.from('live_access' as never).select('user_id').order('updated_at', { ascending: false }).limit(30)
    ids = ((data ?? []) as { user_id: string }[]).map(row => row.user_id)
  }
  if (!ids.length) return { users: [] }
  const { data: people } = await service.from('user').select('user_id, username, display_name, avatar_url').in('user_id', ids)
  const users = await Promise.all((people ?? []).map(async person => ({
    id: person.user_id,
    name: person.display_name || person.username,
    username: person.username,
    avatar_url: person.avatar_url,
    eligibility: await getLiveEligibility(person.user_id)
  })))
  return { users }
})
