import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import type { Database } from '~/types/database.types'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const supabase = await serverSupabaseClient<Database>(event)

  const [sent, received] = await Promise.all([
    supabase.from('gift_transactions').select('credit_value').eq('sender_id', user.id),
    supabase.from('gift_transactions').select('credit_value').eq('recipient_id', user.id)
  ])

  if (sent.error || received.error) {
    throw createError({
      statusCode: 500,
      statusMessage: sent.error?.message || received.error?.message || 'Failed to load summary'
    })
  }

  const total = (rows: { credit_value: number | string | null }[] | null) =>
    (rows || []).reduce((sum, row) => sum + Number(row.credit_value ?? 0), 0)

  return {
    success: true,
    data: {
      sent: total(sent.data),
      received: total(received.data)
    }
  }
})
