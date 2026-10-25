import { requireUser } from '~/server/utils/auth'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { loadPage } from '~/server/utils/pages'

/** Toggle following a Page from the personal account. */
export default defineEventHandler(async (event) => {
  const page = await loadPage(getRouterParam(event, 'id') ?? '')
  const user = await requireUser(event)
  const service = getServiceClient()
  const { data: existing } = await service.from('page_follows').select('page_id').eq('page_id', page.id).eq('user_id', user.id).maybeSingle()
  const { error } = existing
    ? await service.from('page_follows').delete().eq('page_id', page.id).eq('user_id', user.id)
    : await service.from('page_follows').insert({ page_id: page.id, user_id: user.id })
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  if (!existing) {
    const { data: owner } = await service.from('pages').select('created_by_user_id, name').eq('id', page.id).single()
    if (owner?.created_by_user_id && owner.created_by_user_id !== user.id) {
      await service.from('notifications').insert({
        recipient_id: owner.created_by_user_id,
        notifier_id: user.id,
        event_type: 'PAGE_FOLLOWED',
        source_id: page.id,
        message_text: `started following your Page ${owner.name}`,
        is_read: false
      } as never)
    }
  }
  const { data: fresh } = await service.from('pages').select('followers_count').eq('id', page.id).single()
  return { following: !existing, followers_count: fresh?.followers_count ?? 0 }
})
