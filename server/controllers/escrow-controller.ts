// server/controllers/escrow-controller.ts
// ============================================================================
// CONSOLIDATED ESCROW CONTROLLER
// Merges: escrow-contract-controller.js + escrow-push-controller.js
// ============================================================================

import { EscrowTradeModel } from '~/server/models/escrow-trade'
import { supabase } from '~/server/utils/database'
import { sendPush } from '~/push-engine'
import { ethers } from 'ethers'
import EscrowDealABI from '@/abis/EscrowDeal.json'
import type { H3Event } from 'h3'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface CreateEscrowRequest {
  buyerId: string
  sellerId: string
  amount: number
  token: string
  tradeId: string
}

// ============================================================================
// ESCROW CONTROLLER
// ============================================================================

const ESCROW_CONTRACT_ADDRESS = process.env.ESCROW_CONTRACT_ADDRESS || '0xYourEscrowDealAddress'
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL)
const signer = new ethers.Wallet(process.env.PRIVATE_KEY || '', provider)
const escrowContract = new ethers.Contract(ESCROW_CONTRACT_ADDRESS, EscrowDealABI, signer)

export class EscrowController {
  /**
   * Create a new escrow deal
   */
  static async createDeal(event: H3Event) {
    try {
      const body = await readBody(event)
      const { buyerId, sellerId, amount, token, tradeId } = body as CreateEscrowRequest
      const userId = event.context.user?.id

      if (!userId) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
      }

      // Verify user is buyer or seller
      if (userId !== buyerId && userId !== sellerId) {
        throw createError({ statusCode: 403, statusMessage: 'Unauthorized' })
      }

      // Create escrow on blockchain
      const tx = await escrowContract.createDeal(sellerId, amount)
      await tx.wait()

      // Create escrow record in database
      const escrow = await EscrowTradeModel.create({
        trade_id: tradeId,
        buyer_id: buyerId,
        seller_id: sellerId,
        amount,
        token,
        holder_id: ESCROW_CONTRACT_ADDRESS
      })

      return { success: true, data: escrow, txHash: tx.hash }
    } catch (error: any) {
      console.error('Error creating escrow deal:', error)
      throw error
    }
  }

  /**
   * Lock funds in escrow
   */
  static async lockFunds(event: H3Event) {
    try {
      const body = await readBody(event)
      const { escrowId } = body
      const userId = event.context.user?.id

      if (!userId) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
      }

      const escrow = await EscrowTradeModel.getById(escrowId)
      if (!escrow) {
        throw createError({ statusCode: 404, statusMessage: 'Escrow not found' })
      }

      // Lock funds on blockchain
      const tx = await escrowContract.lockFunds(escrowId, escrow.amount)
      await tx.wait()

      // Update escrow status
      const updatedEscrow = await EscrowTradeModel.lockFunds(escrowId, [])

      return { success: true, data: updatedEscrow, txHash: tx.hash }
    } catch (error: any) {
      console.error('Error locking funds:', error)
      throw error
    }
  }

  /**
   * Release escrow to seller
   */
  static async releaseDeal(event: H3Event) {
    try {
      const body = await readBody(event)
      const { escrowId } = body
      const userId = event.context.user?.id

      if (!userId) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
      }

      const escrow = await EscrowTradeModel.getById(escrowId)
      if (!escrow) {
        throw createError({ statusCode: 404, statusMessage: 'Escrow not found' })
      }

      // Release on blockchain
      const tx = await escrowContract.releaseDeal(escrowId)
      await tx.wait()

      // Update escrow status
      const updatedEscrow = await EscrowTradeModel.releaseFunds(escrowId)

      // Send push notification to seller
      const { data: seller } = await supabase
        .from('users')
        .select('device_token')
        .eq('id', escrow.seller_id)
        .single()

      if (seller?.device_token) {
        await sendPush(seller.device_token, '💰 Escrow Released', 'Your trade funds have been released.')
      }

      return { success: true, data: updatedEscrow, txHash: tx.hash }
    } catch (error: any) {
      console.error('Error releasing escrow:', error)
      throw error
    }
  }

  /**
   * Refund escrow to buyer
   */
  static async refundDeal(event: H3Event) {
    try {
      const body = await readBody(event)
      const { escrowId, reason } = body
      const userId = event.context.user?.id

      if (!userId) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
      }

      const escrow = await EscrowTradeModel.getById(escrowId)
      if (!escrow) {
        throw createError({ statusCode: 404, statusMessage: 'Escrow not found' })
      }

      // Refund on blockchain
      const tx = await escrowContract.refundDeal(escrowId)
      await tx.wait()

      // Update escrow status
      const updatedEscrow = await EscrowTradeModel.refundFunds(escrowId)

      // Send push notification to buyer
      const { data: buyer } = await supabase
        .from('users')
        .select('device_token')
        .eq('id', escrow.buyer_id)
        .single()

      if (buyer?.device_token) {
        await sendPush(buyer.device_token, '↩️ Escrow Refunded', `Your trade has been refunded. Reason: ${reason}`)
      }

      return { success: true, data: updatedEscrow, txHash: tx.hash }
    } catch (error: any) {
      console.error('Error refunding escrow:', error)
      throw error
    }
  }

  /**
   * Dispute escrow
   */
  static async disputeDeal(event: H3Event) {
    try {
      const body = await readBody(event)
      const { escrowId, reason } = body
      const userId = event.context.user?.id

      if (!userId) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
      }

      const escrow = await EscrowTradeModel.getById(escrowId)
      if (!escrow) {
        throw createError({ statusCode: 404, statusMessage: 'Escrow not found' })
      }

      // Update escrow status
      const updatedEscrow = await EscrowTradeModel.dispute(escrowId)

      // Notify both parties
      const { data: buyer } = await supabase
        .from('users')
        .select('device_token')
        .eq('id', escrow.buyer_id)
        .single()

      const { data: seller } = await supabase
        .from('users')
        .select('device_token')
        .eq('id', escrow.seller_id)
        .single()

      if (buyer?.device_token) {
        await sendPush(buyer.device_token, '⚠️ Escrow Disputed', `Your trade has been disputed. Reason: ${reason}`)
      }

      if (seller?.device_token) {
        await sendPush(seller.device_token, '⚠️ Escrow Disputed', `Your trade has been disputed. Reason: ${reason}`)
      }

      return { success: true, data: updatedEscrow }
    } catch (error: any) {
      console.error('Error disputing escrow:', error)
      throw error
    }
  }

  /**
   * Get escrow details
   */
  static async getEscrow(event: H3Event) {
    try {
      const { escrowId } = getRouterParams(event)

      const escrow = await EscrowTradeModel.getById(escrowId)
      if (!escrow) {
        throw createError({ statusCode: 404, statusMessage: 'Escrow not found' })
      }

      const transactions = await EscrowTradeModel.getTransactions(escrowId)

      return { success: true, data: { escrow, transactions } }
    } catch (error: any) {
      console.error('Error getting escrow:', error)
      throw error
    }
  }

  /**
   * Get user's escrows
   */
  static async getUserEscrows(event: H3Event) {
    try {
      const userId = event.context.user?.id
      const query = getQuery(event)
      const role = (query.role as 'buyer' | 'seller' | 'holder') || 'buyer'

      if (!userId) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
      }

      const escrows = await EscrowTradeModel.getUserEscrows(userId, role)

      return { success: true, data: escrows }
    } catch (error: any) {
      console.error('Error getting user escrows:', error)
      throw error
    }
  }

  /**
   * Get escrows by status
   */
  static async getEscrowsByStatus(event: H3Event) {
    try {
      const query = getQuery(event)
      const status = query.status as string
      const limit = parseInt(query.limit as string) || 50

      if (!status) {
        throw createError({ statusCode: 400, statusMessage: 'Status is required' })
      }

      const escrows = await EscrowTradeModel.getByStatus(status as any, limit)

      return { success: true, data: escrows }
    } catch (error: any) {
      console.error('Error getting escrows by status:', error)
      throw error
    }
  }
}
