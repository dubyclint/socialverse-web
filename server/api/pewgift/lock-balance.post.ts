import { supabase } from '~/utils/supabase'

interface LockBalanceRequest {
  userId: string
  isLocked: boolean
  isPremium: boolean
  isAdmin?: boolean
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<LockBalanceRequest>(event)
    
    if (!body.userId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'User ID is required'
      })
    }

    // Check if user is premium or admin
    if (!body.isPremium && !body.isAdmin) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Balance lock feature is only available for premium users. Upgrade to premium to access this security feature.'
      })
    }

    // Get current wallet
    const { data: wallet, error: walletError } = await supabase
      .from('user_wallets')
      .select('*')
      .eq('user_id', body.userId)
      .single()

    if (walletError || !wallet) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Wallet not found'
      })
    }

    // Update lock status
    const { data: updatedWallet, error: updateError } = await supabase
      .from('user_wallets')
      .update({
        is_locked: body.isLocked,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', body.userId)
      .select()
      .single()

    if (updateError) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to update balance lock status'
      })
    }

    // If unlocking balance, move locked_balance to pew_balance
    if (!body.isLocked && wallet.locked_balance > 0) {
      const { error: unlockError } = await supabase
        .from('user_wallets')
        .update({
          pew_balance: parseFloat(wallet.pew_balance) + parseFloat(wallet.locked_balance),
          locked_balance: 0,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', body.userId)

      if (unlockError) {
        console.error('Failed to unlock balance:', unlockError)
        // Don't throw error here, lock status was already updated
      }
    }

    // Create audit log
    const { error: logError } = await supabase
      .from('balance_lock_logs')
      .insert({
        user_id: body.userId,
        action: body.isLocked ? 'locked' : 'unlocked',
        previous_status: wallet.is_locked,
        new_status: body.isLocked,
        performed_by: body.isAdmin ? 'admin' : 'user',
        created_at: new Date().toISOString()
      })

    if (logError) {
      console.error('Failed to create balance lock log:', logError)
    }

    // Create notification
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: body.userId,
        type: 'balance_lock_changed',
        title: body.isLocked ? '🔒 Balance Locked' : '🔓 Balance Unlocked',
        message: body.isLocked 
          ? 'Your PEW balance has been locked for security. All send, withdraw, and swap functions are disabled.'
          : 'Your PEW balance has been unlocked. You can now send, withdraw, and swap PEW.',
        data: {
          isLocked: body.isLocked,
          timestamp: new Date().toISOString()
        },
        is_read: false,
        created_at: new Date().toISOString()
      })

    if (notificationError) {
      console.error('Failed to create balance lock notification:', notificationError)
    }

    return {
      success: true,
      message: body.isLocked 
        ? 'Balance locked successfully. All transactions are now disabled for security.'
        : 'Balance unlocked successfully. You can now perform transactions.',
      data: {
        isLocked: body.isLocked,
        balance: parseFloat(updatedWallet.pew_balance),
        lockedBalance: parseFloat(updatedWallet.locked_balance),
        timestamp: new Date().toISOString()
      }
    }

  } catch (error) {
    console.error('Lock Balance API Error:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update balance lock status'
    })
  }
})
