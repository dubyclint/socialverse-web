import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import type { Database } from '~/types/database.types'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const limit = parseInt(query.limit as string) || 20
  const offset = parseInt(query.offset as string) || 0

  const user = await requireAuth(event)
  const supabase = await serverSupabaseClient<Database>(event)

  const scope = `sender_id.eq.${user.id},recipient_id.eq.${user.id}`

  const [{ data: rows, error }, { count }] = await Promise.all([
    supabase
      .from('gift_transactions')
      .select('id, gift_id, sender_id, recipient_id, credit_value, stream_id, created_at, gift_catalog(name, tier)')
      .or(scope)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1),
    supabase
      .from('gift_transactions')
      .select('id', { count: 'exact', head: true })
      .or(scope)
  ])

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  const transactions = (rows || []).map(row => ({
    id: row.id,
    type: row.sender_id === user.id ? 'sent' : 'received',
    amount: Number(row.credit_value),
    senderId: row.sender_id,
    recipientId: row.recipient_id,
    giftId: row.gift_id,
    giftName: row.gift_catalog?.name ?? null,
    giftTier: row.gift_catalog?.tier ?? null,
    streamId: row.stream_id,
    createdAt: row.created_at
  }))

  return {
    success: true,
    data: {
      transactions,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    }
  }
})
