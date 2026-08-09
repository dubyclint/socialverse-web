// Closed-loop credit wallet controller. Every balance movement goes through the
// row-locking money-core functions (`transfer_pewgift`, `send_pewgift`,
// `settle_deposit`); nothing here writes a balance directly.

import { serverSupabaseClient } from '#supabase/server'
import type { H3Event } from 'h3'
import { UserWalletModel, PEWGIFT_CURRENCY } from '~/server/models/user-wallet'
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import { mapGiftError } from '~/server/utils/pewgift-errors'
import type { Database } from '~/types/database.types'

export interface WalletTransferRequest {
  recipientId: string
  amount: number
  reference?: string
}

export class WalletController {
  static async getWallet(event: H3Event) {
    const user = await requireAuth(event)
    const wallet = await UserWalletModel.ensure(user.id)
    return { success: true, data: wallet }
  }

  static async getBalance(event: H3Event) {
    const user = await requireAuth(event)
    const wallet = await UserWalletModel.ensure(user.id)

    return {
      success: true,
      data: {
        currency: PEWGIFT_CURRENCY,
        balance: Number(wallet.balance),
        lockedBalance: Number(wallet.locked_balance),
        isLocked: wallet.is_locked
      }
    }
  }

  /** Peer-to-peer credit transfer. */
  static async transfer(event: H3Event) {
    const user = await requireAuth(event)
    const { recipientId, amount, reference } = await readBody<WalletTransferRequest>(event)

    if (!recipientId || !amount || amount <= 0) {
      throw createError({ statusCode: 400, statusMessage: 'Recipient and a positive amount are required' })
    }

    const supabase = await serverSupabaseClient<Database>(event)
    const { data, error } = await supabase.rpc('transfer_pewgift', {
      p_sender_id: user.id,
      p_recipient_id: recipientId,
      p_amount: amount,
      p_debit_type: 'P2P_TIPPING_SENT',
      p_credit_type: 'P2P_TIPPING_RECEIVED',
      p_reference_id: reference ?? undefined,
      p_metadata: {}
    })

    if (error) throw mapGiftError(error)

    return { success: true, data: { newBalance: Number(data) } }
  }

  static async setLock(event: H3Event) {
    const user = await requireAuth(event)
    const { isLocked } = await readBody<{ isLocked: boolean }>(event)
    const wallet = await UserWalletModel.setLocked(user.id, Boolean(isLocked))

    return { success: true, data: { isLocked: wallet.is_locked } }
  }

  static async getTransactions(event: H3Event) {
    const user = await requireAuth(event)
    const query = getQuery(event)
    const limit = Math.min(parseInt(query.limit as string) || 50, 200)

    return { success: true, data: await UserWalletModel.getLedger(user.id, limit) }
  }
}
