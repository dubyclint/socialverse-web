import { requireAdmin, logAdminAction } from '~/server/gateway/auth/auth-utils'
import { getSupabaseAdmin } from '~/server/utils/supabase'

type BalanceAction = 'add' | 'subtract' | 'set'

interface BalanceAdjustmentBody {
  userId?: string
  amount?: number
  action?: BalanceAction
  reason?: string
}

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const body = await readBody<BalanceAdjustmentBody>(event)

  const userId = body?.userId
  const amount = Number(body?.amount)
  const action: BalanceAction = body?.action ?? 'add'

  if (!userId || !Number.isFinite(amount)) {
    throw createError({ statusCode: 400, statusMessage: 'userId and a numeric amount are required' })
  }

  const supabase = await getSupabaseAdmin()

  const { data: wallet, error: walletError } = await supabase
    .from('wallets')
    .select('balance')
    .eq('user_id', userId)
    .maybeSingle()

  if (walletError) {
    throw createError({ statusCode: 500, statusMessage: walletError.message })
  }

  const currentBalance = Number(wallet?.balance ?? 0)
  const nextBalance =
    action === 'set' ? amount : action === 'subtract' ? currentBalance - amount : currentBalance + amount

  if (nextBalance < 0) {
    throw createError({ statusCode: 400, statusMessage: 'Adjustment would take the wallet below zero' })
  }

  const { error: upsertError } = await supabase
    .from('wallets')
    .upsert({ user_id: userId, balance: nextBalance, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })

  if (upsertError) {
    throw createError({ statusCode: 500, statusMessage: upsertError.message })
  }

  const delta = nextBalance - currentBalance
  if (delta !== 0) {
    const { error: ledgerError } = await supabase.from('transactions').insert({
      user_id: userId,
      amount: Math.abs(delta),
      type: delta > 0 ? 'credit' : 'debit',
      description: body?.reason || 'Administrative balance adjustment',
      icon: '🛠️',
      metadata: { admin_id: admin.id, action }
    })

    if (ledgerError) {
      throw createError({ statusCode: 500, statusMessage: ledgerError.message })
    }
  }

  await logAdminAction(admin.id, 'balance_adjustment', userId, 'wallet', { action, amount, nextBalance })

  return { success: true, balance: nextBalance }
})
