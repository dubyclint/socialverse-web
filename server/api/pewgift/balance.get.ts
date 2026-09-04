import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import type { Database } from '~/types/database.types'

const PEWGIFT_CURRENCY = 'PEW'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const supabase = await serverSupabaseClient<Database>(event)

  const { data: wallet, error } = await supabase
    .from('wallets')
    .select('balance, locked_balance, is_locked')
    .eq('user_id', user.id)
    .eq('currency', PEWGIFT_CURRENCY)
    .maybeSingle()

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  if (!wallet) {
    const { error: createErr } = await supabase
      .from('wallets')
      .upsert({ user_id: user.id, currency: PEWGIFT_CURRENCY, balance: 0 }, { onConflict: 'user_id,currency' })

    if (createErr) throw createError({ statusCode: 500, statusMessage: 'Failed to create wallet' })

    return { success: true, data: { balance: 0, lockedBalance: 0, isLocked: false, totalBalance: 0 } }
  }

  const balance = Number(wallet.balance) || 0
  const lockedBalance = Number(wallet.locked_balance) || 0

  return {
    success: true,
    data: {
      balance,
      lockedBalance,
      isLocked: wallet.is_locked,
      totalBalance: balance + lockedBalance
    }
  }
})
