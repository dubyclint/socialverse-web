import { getServiceClient } from '~/server/utils/supabase-admin'
import { resolveActor } from '~/server/utils/actor'
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import type { Database } from '~/types/database.types'

type NotificationRow = Database['public']['Tables']['notifications']['Row']

interface NotificationsResponse {
  success: boolean
  data: NotificationRow[]
  unread: number
  gifts: number
}

export default defineEventHandler(async (event): Promise<NotificationsResponse> => {
  const user = await requireAuth(event)
  const query = getQuery(event)
  const limit = Math.min(100, Math.max(1, Number.parseInt(String(query.limit ?? '20'), 10) || 20))

  const supabase = getServiceClient()
  const actor = await resolveActor(event)
  const pageId = actor.type === 'PAGE' ? actor.id : null

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq(pageId ? 'recipient_page_id' : 'recipient_id', pageId ?? user.id)
    .filter('recipient_page_id', pageId ? 'not.is' : 'is', 'null')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  const [{ count }, { count: gifts }] = await Promise.all([
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq(pageId ? 'recipient_page_id' : 'recipient_id', pageId ?? user.id)
      .filter('recipient_page_id', pageId ? 'not.is' : 'is', 'null')
      .eq('is_read', false),
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq(pageId ? 'recipient_page_id' : 'recipient_id', pageId ?? user.id)
      .filter('recipient_page_id', pageId ? 'not.is' : 'is', 'null')
      .eq('event_type', 'GIFT_RECEIVED')
      .eq('is_read', false)
  ])

  return {
    success: true,
    data: data ?? [],
    unread: count ?? 0,
    gifts: gifts ?? 0
  }
})
