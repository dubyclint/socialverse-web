// ============================================================================
// FILE: /server/api/user/notifications.get.ts
// ============================================================================
// Purpose:
// - Return notifications for authenticated user
// - Prefer event.context.user (set by auth middleware)
// - Fallback to Bearer JWT decode only if context user missing
// - Return clean 401 for auth failures (not 500)
// ============================================================================

import jwt from 'jsonwebtoken'

interface Notification {
  id: string
  user_id: string
  type?: string
  title?: string
  message?: string
  data?: Record<string, any>
  read?: boolean
  is_read?: boolean
  created_at: string
  updated_at?: string
  [key: string]: any
}

interface NotificationsResponse {
  success: boolean
  notifications: Notification[]
  total: number
  page: number
  limit: number
  has_more: boolean
  message?: string
}

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function resolveUserIdFromContext(event: any): string | null {
  const user = event?.context?.user
  return user?.id || user?.user_id || user?.sub || null
}

function resolveUserIdFromBearer(event: any): string | null {
  const authHeader = getHeader(event, 'authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null

  const token = authHeader.slice(7).trim()
  if (!token) return null

  try {
    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) return null

    const decoded: any = jwt.verify(token, jwtSecret)
    return decoded?.sub || decoded?.user_id || decoded?.id || null
  } catch {
    return null
  }
}

export default defineEventHandler(async (event): Promise<NotificationsResponse> => {
  // --------------------------------------------------------------------------
  // 1) Resolve authenticated user
  // --------------------------------------------------------------------------
  const userId = resolveUserIdFromContext(event) || resolveUserIdFromBearer(event)

  if (!userId) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  if (!uuidRegex.test(userId)) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  // --------------------------------------------------------------------------
  // 2) Pagination
  // --------------------------------------------------------------------------
  const query = getQuery(event)
  const page = Math.max(1, Number.parseInt(String(query.page ?? '1'), 10) || 1)
  const limit = Math.min(100, Math.max(1, Number.parseInt(String(query.limit ?? '20'), 10) || 20))
  const offset = (page - 1) * limit

  // --------------------------------------------------------------------------
  // 3) Fetch notifications
  // --------------------------------------------------------------------------
  const { getSupabaseAdmin } = await import('~/server/utils/supabase')
  const supabase = await getSupabaseAdmin()

  const { data, error, count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  // If notifications table not present yet, return empty success response.
  if (error) {
    const msg = String(error.message || '')
    const code = String((error as any).code || '')

    if (
      msg.includes('does not exist') ||
      code === 'PGRST116' ||
      code === '42P01'
    ) {
      return {
        success: true,
        notifications: [],
        total: 0,
        page,
        limit,
        has_more: false,
        message: 'Notifications not available yet'
      }
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch notifications'
    })
  }

  const notifications: Notification[] = (data || []).map((notif: any) => ({
    ...notif,
    read: typeof notif.read === 'boolean' ? notif.read : Boolean(notif.is_read)
  }))

  const total = count ?? 0
  const has_more = offset + limit < total

  return {
    success: true,
    notifications,
    total,
    page,
    limit,
    has_more
  }
})
