import { serverSupabaseClient, serverSupabaseServiceRole } from '#supabase/server'
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import type { Database } from '~/types/database.types'

interface DeleteAccountBody {
  confirm?: string
  reason?: string
}

interface DeleteAccountResponse {
  success: true
  deletedAt: string
}

/**
 * Store-required account deletion. Blocks while value is still held so funds are
 * never destroyed silently, anonymises the profile, then removes the auth user.
 */
export default defineEventHandler(async (event): Promise<DeleteAccountResponse> => {
  const user = await requireAuth(event)
  const body = await readBody<DeleteAccountBody>(event)

  if (body?.confirm !== 'DELETE') {
    throw createError({ statusCode: 400, statusMessage: 'Type DELETE to confirm account deletion' })
  }

  const client = await serverSupabaseClient<Database>(event)

  const { data: wallets, error: walletError } = await client
    .from('wallets')
    .select('balance, locked_balance, currency')
    .eq('user_id', user.id)

  if (walletError) throw createError({ statusCode: 500, statusMessage: walletError.message })

  const held = (wallets ?? []).filter(w => (w.balance ?? 0) > 0 || (w.locked_balance ?? 0) > 0)
  if (held.length > 0) {
    throw createError({
      statusCode: 409,
      statusMessage:
        'Withdraw or settle your remaining balance and close open trades before deleting your account.'
    })
  }

  const { count: openTrades, error: tradeError } = await client
    .from('p2p_trades')
    .select('id', { count: 'exact', head: true })
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .in('status', ['created', 'funded', 'disputed'])

  if (tradeError) throw createError({ statusCode: 500, statusMessage: tradeError.message })
  if ((openTrades ?? 0) > 0) {
    throw createError({ statusCode: 409, statusMessage: 'Close your open P2P trades before deleting your account.' })
  }

  const deletedAt = new Date().toISOString()
  const service = serverSupabaseServiceRole<Database>(event)

  const { error: anonymiseError } = await service
    .from('user')
    .update({
      is_banned: false,
      bio: null,
      avatar_url: null,
      phone_hash: null,
      push_token: null,
      updated_at: deletedAt
    })
    .eq('user_id', user.id)

  if (anonymiseError) throw createError({ statusCode: 500, statusMessage: anonymiseError.message })

  const { error: authError } = await service.auth.admin.deleteUser(user.id)
  if (authError) throw createError({ statusCode: 500, statusMessage: authError.message })

  return { success: true, deletedAt }
})
