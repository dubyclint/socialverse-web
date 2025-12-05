// FILE: /server/routes/wallet.ts - FIXED
// ============================================================================

import { UserWalletModel } from '~/server/models/user-wallet'
import { getSupabaseClient } from '~/server/utils/database'

interface WalletUpdateRequest {
  userId: string
  balances?: {
    usdt?: number
    usdc?: number
    btc?: number
    eth?: number
    sol?: number
    matic?: number
    xaut?: number
  }
}

export default defineEventHandler(async (event) => {
  try {
    const method = event.node.req.method

    if (method === 'GET') {
      return await handleGetWallet(event)
    } else if (method === 'POST') {
      return await handleUpdateWallet(event)
    } else {
      throw createError({
        statusCode: 405,
        statusMessage: 'Method Not Allowed'
      })
    }
  } catch (error: any) {
    console.error('[Wallet] Error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Wallet operation failed'
    })
  }
})

async function handleGetWallet(event: any) {
  const supabase = await getSupabaseClient();
  const { userId } = getQuery(event)

  if (!userId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing userId parameter'
    })
  }

  const { data, error } = await supabase
    .from('user_wallets')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    throw error
  }

  return data || {
    user_id: userId,
    usdt: 0,
    usdc: 0,
    btc: 0,
    eth: 0,
    sol: 0,
    matic: 0,
    xaut: 0
  }
}

async function handleUpdateWallet(event: any) {
  const supabase = await getSupabaseClient();
  const body = await readBody<WalletUpdateRequest>(event)
  const { userId, balances } = body

  if (!userId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing userId'
    })
  }

  // Check if wallet exists
  const { data: existingWallet } = await supabase
    .from('user_wallets')
    .select('id')
    .eq('user_id', userId)
    .single()

  let result

  if (existingWallet) {
    // Update existing wallet
    const { data, error } = await supabase
      .from('user_wallets')
      .update({
        ...balances,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()

    if (error) throw error
    result = data
  } else {
    // Create new wallet
    const { data, error } = await supabase
      .from('user_wallets')
      .insert([{
        user_id: userId,
        ...balances,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()

    if (error) throw error
    result = data
  }

  return result
}
