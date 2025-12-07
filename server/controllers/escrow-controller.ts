// server/controllers/escrow-controller.ts
// ============================================================================
// CONSOLIDATED ESCROW CONTROLLER - FIXED WITH LAZY LOADING
// ============================================================================

import { EscrowTradeModel } from '~/server/models/escrow-trade'
import { supabase } from '~/server/utils/database'
import { sendPush } from '~/push-engine'
import EscrowDealABI from '@/abis/EscrowDeal.json'
import type { H3Event } from 'h3'

// Lazy load ethers
let ethers: any = null;

async function getEthers() {
  if (!ethers) {
    const module = await import('ethers');
    ethers = module.ethers;
  }
  return ethers;
}

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

export class EscrowController {
  /**
   * Create escrow contract
   */
  async createEscrow(event: H3Event, data: CreateEscrowRequest) {
    try {
      const ethersLib = await getEthers();
      
      // Initialize provider and contract
      const provider = new ethersLib.JsonRpcProvider(process.env.PROVIDER_URL);
      const wallet = new ethersLib.Wallet(process.env.PRIVATE_KEY!, provider);
      const contract = new ethersLib.Contract(
        process.env.ESCROW_CONTRACT_ADDRESS!,
        EscrowDealABI,
        wallet
      );

      // Create escrow on blockchain
      const tx = await contract.createEscrow(
        data.buyerId,
        data.sellerId,
        ethersLib.parseEther(data.amount.toString())
      );

      await tx.wait();

      // Save to database
      const escrow = await EscrowTradeModel.create({
        buyerId: data.buyerId,
        sellerId: data.sellerId,
        amount: data.amount,
        token: data.token,
        tradeId: data.tradeId,
        txHash: tx.hash,
        status: 'pending'
      });

      // Send push notification
      await sendPush(
        data.sellerId,
        'Escrow Created',
        `New escrow for ${data.amount} ${data.token}`
      );

      return {
        success: true,
        escrow,
        txHash: tx.hash
      };
    } catch (error) {
      console.error('[Escrow] Create failed:', error);
      throw error;
    }
  }

  /**
   * Release escrow funds
   */
  async releaseEscrow(event: H3Event, escrowId: string) {
    try {
      const ethersLib = await getEthers();
      
      const escrow = await EscrowTradeModel.findByPk(escrowId);
      if (!escrow) {
        throw new Error('Escrow not found');
      }

      // Initialize provider and contract
      const provider = new ethersLib.JsonRpcProvider(process.env.PROVIDER_URL);
      const wallet = new ethersLib.Wallet(process.env.PRIVATE_KEY!, provider);
      const contract = new ethersLib.Contract(
        process.env.ESCROW_CONTRACT_ADDRESS!,
        EscrowDealABI,
        wallet
      );

      // Release on blockchain
      const tx = await contract.releaseEscrow(escrowId);
      await tx.wait();

      // Update database
      await escrow.update({
        status: 'completed',
        releaseTxHash: tx.hash
      });

      // Send push notification
      await sendPush(
        escrow.sellerId,
        'Escrow Released',
        `Funds released for escrow ${escrowId}`
      );

      return {
        success: true,
        txHash: tx.hash
      };
    } catch (error) {
      console.error('[Escrow] Release failed:', error);
      throw error;
    }
  }

  /**
   * Refund escrow
   */
  async refundEscrow(event: H3Event, escrowId: string) {
    try {
      const ethersLib = await getEthers();
      
      const escrow = await EscrowTradeModel.findByPk(escrowId);
      if (!escrow) {
        throw new Error('Escrow not found');
      }

      // Initialize provider and contract
      const provider = new ethersLib.JsonRpcProvider(process.env.PROVIDER_URL);
      const wallet = new ethersLib.Wallet(process.env.PRIVATE_KEY!, provider);
      const contract = new ethersLib.Contract(
        process.env.ESCROW_CONTRACT_ADDRESS!,
        EscrowDealABI,
        wallet
      );

      // Refund on blockchain
      const tx = await contract.refundEscrow(escrowId);
      await tx.wait();

      // Update database
      await escrow.update({
        status: 'refunded',
        refundTxHash: tx.hash
      });

      // Send push notification
      await sendPush(
        escrow.buyerId,
        'Escrow Refunded',
        `Escrow ${escrowId} has been refunded`
      );

      return {
        success: true,
        txHash: tx.hash
      };
    } catch (error) {
      console.error('[Escrow] Refund failed:', error);
      throw error;
    }
  }

  /**
   * Get escrow details
   */
  async getEscrow(event: H3Event, escrowId: string) {
    try {
      const escrow = await EscrowTradeModel.findByPk(escrowId);
      
      if (!escrow) {
        throw new Error('Escrow not found');
      }

      return {
        success: true,
        escrow
      };
    } catch (error) {
      console.error('[Escrow] Get failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const escrowController = new EscrowController();
