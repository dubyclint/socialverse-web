import { readBody } from 'h3'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { logStaffAction, requireStaff } from '~/server/utils/staff'

/** Resolve a report or flag; optionally remove the reported post or comment. */
export default defineEventHandler(async (event) => {
  const staff = await requireStaff(event, 'compliance')
  const body = await readBody<{ kind?: 'report' | 'flag', id?: string, outcome?: 'dismissed' | 'actioned', removeContent?: boolean }>(event)
  if (!body?.id || (body.kind !== 'report' && body.kind !== 'flag')) throw createError({ statusCode: 400, statusMessage: 'kind and id are required' })
  const outcome = body.outcome === 'actioned' ? 'actioned' : 'dismissed'
  const service = getServiceClient()
  const now = new Date().toISOString()

  if (body.kind === 'report') {
    const { data: report } = await service.from('reports').select('id, post_id, comment_id').eq('id', body.id).maybeSingle()
    if (!report) throw createError({ statusCode: 404, statusMessage: 'Report not found' })
    if (body.removeContent) {
      if (report.comment_id) await service.from('comments').delete().eq('id', report.comment_id)
      else if (report.post_id) await service.from('posts').delete().eq('id', report.post_id)
    }
    const { error } = await service.from('reports').update({ status: outcome, updated_at: now }).eq('id', body.id)
    if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  } else {
    const { data: flag } = await service.from('flagged_content').select('id, content_id, content_type').eq('id', body.id).maybeSingle()
    if (!flag) throw createError({ statusCode: 404, statusMessage: 'Flag not found' })
    if (body.removeContent && flag.content_type === 'post') await service.from('posts').delete().eq('id', flag.content_id)
    if (body.removeContent && flag.content_type === 'comment') await service.from('comments').delete().eq('id', flag.content_id)
    const { error } = await service.from('flagged_content').update({ resolved_at: now }).eq('id', body.id)
    if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  }
  await logStaffAction(staff.id, `resolve_${body.kind}`, body.kind, body.id, { outcome, removedContent: Boolean(body.removeContent) })
  return { success: true }
})
