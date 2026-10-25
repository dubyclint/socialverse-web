import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import type { Database } from '~/types/database.types'

/** Clears the wallet gift dot: marks unread gift notifications as read. */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const supabase = await serverSupabaseClient<Database>(event)

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('recipient_id', user.id)
    .eq('event_type', 'GIFT_RECEIVED')
    .eq('is_read', false)

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return { success: true }
})
