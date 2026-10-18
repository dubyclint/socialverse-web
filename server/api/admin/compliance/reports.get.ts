import { getQuery } from 'h3'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { requireStaff } from '~/server/utils/staff'

/** User reports and flagged content awaiting review. */
export default defineEventHandler(async (event) => {
  await requireStaff(event, 'compliance')
  const status = String(getQuery(event).status ?? 'pending')
  const service = getServiceClient()
  let reportsQuery = service.from('reports')
    .select('id, reporter_id, reported_user_id, post_id, comment_id, reason, description, status, created_at')
    .order('created_at', { ascending: false }).limit(100)
  if (status !== 'all') reportsQuery = reportsQuery.eq('status', status)
  const [{ data: reports, error }, { data: flagged }] = await Promise.all([
    reportsQuery,
    service.from('flagged_content').select('id, content_id, content_type, reason, flagged_by, created_at')
      .is('resolved_at', null).order('created_at', { ascending: false }).limit(100)
  ])
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  const ids = [...new Set([...(reports ?? []).flatMap(r => [r.reporter_id, r.reported_user_id]), ...(flagged ?? []).map(f => f.flagged_by)]
    .filter((id): id is string => !!id))]
  const { data: people } = ids.length ? await service.from('user').select('user_id, username').in('user_id', ids) : { data: [] }
  const names = new Map((people ?? []).map(p => [p.user_id, p.username]))
  return {
    reports: (reports ?? []).map(r => ({ ...r, reporter: names.get(r.reporter_id ?? '') ?? null, reported: names.get(r.reported_user_id ?? '') ?? null })),
    flagged: (flagged ?? []).map(f => ({ ...f, flagger: names.get(f.flagged_by ?? '') ?? null }))
  }
})
