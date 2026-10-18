import { getQuery } from 'h3'
import { requireUser } from '~/server/utils/auth'
import { getServiceClient } from '~/server/utils/supabase-admin'

/** Latest verification request and current badge for yourself or a Page (?pageId=). */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const pageId = typeof getQuery(event).pageId === 'string' ? String(getQuery(event).pageId) : null
  const service = getServiceClient()

  let query = service.from('badge_requests')
    .select('id, status, category, review_note, created_at, updated_at')
    .order('created_at', { ascending: false })
    .limit(1)
  query = pageId ? query.eq('page_id', pageId) : query.eq('user_id', user.id).is('page_id', null)
  const { data: requests } = await query

  const badge = pageId
    ? (await service.from('pages').select('is_verified, verified_type').eq('id', pageId).maybeSingle()).data
    : (await service.from('user').select('is_verified, verified_type').eq('user_id', user.id).maybeSingle()).data
  const row = badge as { is_verified?: boolean | null, verified_type?: string | null } | null
  return {
    verified: Boolean(row?.is_verified),
    type: row?.verified_type ?? null,
    request: requests?.[0] ?? null
  }
})
