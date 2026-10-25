import { requireUser } from '~/server/utils/auth'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { canSeeStatus } from '~/server/utils/status-privacy'

/** Opens a status: records the viewer once; the author also gets the viewer list. */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = getRouterParam(event, 'id') ?? ''
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw createError({ statusCode: 400, statusMessage: 'Invalid status' })
  const db = getServiceClient()

  const { data: status } = await db
    .from('user_statuses')
    .select('id, user_id, content, caption, media_url, background_color, text_color, created_at, expires_at, view_count')
    .eq('id', id)
    .is('deleted_at', null)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()
  if (!status) throw createError({ statusCode: 404, statusMessage: 'This status has expired' })
  if (!await canSeeStatus(db, user.id, status.user_id)) {
    throw createError({ statusCode: 404, statusMessage: 'This status has expired' })
  }

  if (status.user_id !== user.id) {
    const { error } = await db.from('status_views').insert({ status_id: id, viewer_id: user.id })
    if (!error) {
      const { count } = await db.from('status_views').select('id', { count: 'exact', head: true }).eq('status_id', id)
      await db.from('user_statuses').update({ view_count: count ?? 0 }).eq('id', id)
    }
    return { success: true, data: { id, viewed: true } }
  }

  const { data: views } = await db.from('status_views').select('viewer_id, viewed_at').eq('status_id', id).order('viewed_at', { ascending: false }).limit(200)
  const viewerIds = (views ?? []).map(v => v.viewer_id)
  const { data: people } = viewerIds.length
    ? await db.from('user').select('user_id, username, display_name, avatar_url').in('user_id', viewerIds)
    : { data: [] as { user_id: string, username: string | null, display_name: string | null, avatar_url: string | null }[] }
  const byId = new Map((people ?? []).map(p => [p.user_id, p]))
  return {
    success: true,
    data: {
      id,
      view_count: viewerIds.length,
      viewers: (views ?? []).map(v => ({
        id: v.viewer_id,
        name: byId.get(v.viewer_id)?.display_name || byId.get(v.viewer_id)?.username || 'User',
        avatar_url: byId.get(v.viewer_id)?.avatar_url ?? null,
        viewed_at: v.viewed_at
      }))
    }
  }
})
