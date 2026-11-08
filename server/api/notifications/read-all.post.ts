import { getServiceClient } from '~/server/utils/supabase-admin'
import { resolveActor } from '~/server/utils/actor'
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const supabase = getServiceClient()
  const actor = await resolveActor(event)
  const pageId = actor.type === 'PAGE' ? actor.id : null

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq(pageId ? 'recipient_page_id' : 'recipient_id', pageId ?? user.id)
    .filter('recipient_page_id', pageId ? 'not.is' : 'is', 'null')
    .eq('is_read', false)

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return { success: true }
})
