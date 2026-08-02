import { serverSupabaseClient } from '#supabase/server'
import { createError } from 'h3'
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const userId = user.id as string
    const supabase = await serverSupabaseClient(event)

    // Get user wallet information
    const { data: wallet, error } = await supabase
      .from('user_wallets')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error || !wallet) {
      // Create wallet if it doesn't exist
      const { error: createErr } = await supabase
        .from('user_wallets')
        .insert({
          user_id: userId,
          pew_balance: 0,
          locked_balance: 0,
          is_locked: false
        })
        .select()
        .single()

      if (createErr) {
        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to create wallet'
        })
      }

      return {
        success: true,
        data: {
          balance: 0,
          lockedBalance: 0,
          isLocked: false,
          totalBalance: 0
        }
      }
    }

    return {
      success: true,
      data: {
        balance: parseFloat(wallet.pew_balance),
        lockedBalance: parseFloat(wallet.locked_balance),
        isLocked: wallet.is_locked,
        totalBalance: parseFloat(wallet.pew_balance) + parseFloat(wallet.locked_balance)
      }
    }

  } catch (error: any) {
    console.error('Balance API Error:', error)
    
    if ((error as any)?.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch balance'
    })
  }
})
