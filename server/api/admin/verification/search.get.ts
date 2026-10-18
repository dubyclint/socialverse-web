import { getQuery } from 'h3'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { requireStaff } from '~/server/utils/staff'

/** Find users or Pages to assign a badge directly. */
export default defineEventHandler(async (event) => {
  await requireStaff(event, 'verification')
  const q = String(getQuery(event).q ?? '').trim().replace(/[%,()]/g, '')
  if (q.length < 2) return { results: [] }
  const service = getServiceClient()
  const [{ data: users }, { data: pages }] = await Promise.all([
    service.from('user').select('user_id, username, display_name, avatar_url, is_verified, verified_type')
      .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`).limit(10),
    service.from('pages').select('id, name, handle, avatar_url, is_verified, verified_type')
      .or(`handle.ilike.%${q}%,name.ilike.%${q}%`).limit(10)
  ])
  return {
    results: [
      ...(users ?? []).map(u => ({ kind: 'user' as const, id: u.user_id, name: u.display_name || u.username, handle: u.username, avatar_url: u.avatar_url, verified: u.is_verified, type: u.verified_type })),
      ...(pages ?? []).map(p => ({ kind: 'page' as const, id: p.id, name: p.name, handle: p.handle, avatar_url: p.avatar_url, verified: p.is_verified, type: p.verified_type }))
    ]
  }
})
