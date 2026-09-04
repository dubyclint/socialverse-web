import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import type { Database } from '~/types/database.types'

const PEWGIFT_CURRENCY = 'PEW'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody<{ isLocked: boolean }>(event)
  const supabase = await serverSupabaseClient<Database>(event)

  // Entitlement is decided server side; the client cannot claim premium/admin.
  const { data: profile } = await supabase
    .from('user')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle()

  const isPrivileged = profile?.role === 'admin' || profile?.role === 'manager'

  if (!isPrivileged) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Balance lock is only available to premium users. Upgrade to enable this security feature.'
    })
  }

  const { data: wallet, error: walletError } = await supabase
    .from('wallets')
    .select('balance, locked_balance, is_locked')
    .eq('user_id', user.id)
    .eq('currency', PEWGIFT_CURRENCY)
    .maybeSingle()

  if (walletError) throw createError({ statusCode: 500, statusMessage: walletError.message })
  if (!wallet) throw createError({ statusCode: 404, statusMessage: 'Wallet not found' })

  const lockedBalance = Number(wallet.locked_balance) || 0
  const balance = Number(wallet.balance) || 0

  // Unlocking returns any held credits to the spendable balance.
  const next = body.isLocked
    ? { is_locked: true }
    : { is_locked: false, balance: balance + lockedBalance, locked_balance: 0 }

  const { data: updated, error: updateError } = await supabase
    .from('wallets')
    .update({ ...next, updated_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .eq('currency', PEWGIFT_CURRENCY)
    .select('balance, locked_balance, is_locked')
    .single()

  if (updateError) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to update balance lock status' })
  }

  await supabase.from('audit_logs').insert({
    user_id: user.id,
    action: body.isLocked ? 'wallet_locked' : 'wallet_unlocked',
    timestamp: new Date().toISOString(),
    ip_address: getRequestIP(event, { xForwardedFor: true }) || 'unknown',
    user_agent: getRequestHeader(event, 'user-agent') || 'unknown'
  })

  await supabase.from('notifications').insert({
    recipient_id: user.id,
    event_type: 'SYSTEM_ALERT',
    source_id: user.id,
    message_text: body.isLocked
      ? 'Your Pewgift balance has been locked. Sends and withdrawals are disabled.'
      : 'Your Pewgift balance has been unlocked.'
  })

  return {
    success: true,
    message: body.isLocked ? 'Balance locked successfully.' : 'Balance unlocked successfully.',
    data: {
      isLocked: updated.is_locked,
      balance: Number(updated.balance),
      lockedBalance: Number(updated.locked_balance)
    }
  }
})
