import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import type { Database } from '~/types/database.types'

type NotificationRow = Database['public']['Tables']['notifications']['Row']

interface NotificationsResponse {
  success: boolean
  data: NotificationRow[]
  unread: number
}

export default defineEventHandler(async (event): Promise<NotificationsResponse> => {
  const user = await requireAuth(event)
  const query = getQuery(event)
  const limit = Math.min(100, Math.max(1, Number.parseInt(String(query.limit ?? '20'), 10) || 20))

  const supabase = await serverSupabaseClient<Database>(event)

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('recipient_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  const rows = data ?? []

  return {
    success: true,
    data: rows,
    unread: rows.filter(row => !row.is_read).length
  }
})
