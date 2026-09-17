// server/controllers/escrow-controller.ts
// ============================================================================
// CONSOLIDATED ESCROW CONTROLLER - FIXED WITH LAZY LOADING
// ============================================================================

import { EscrowTradeModel } from '~/server/models/escrow-trade'
// permissive runtime alias: runtime model exposes methods not captured by static types
const EscrowTrade: any = (EscrowTradeModel as any) || {}
import { sendPush } from '~/push-engine'
// The ABI JSON may be provided at runtime in some builds; provide a permissive stub for TS.
let EscrowDealABI: any = {}
try {
  // prefer project alias import when available
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  EscrowDealABI = require('@/abis/EscrowDeal.json')
} catch {
  EscrowDealABI = {}
}
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
  async createEscrow(_event: H3Event, data: CreateEscrowRequest) {
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
  const escrow = await EscrowTrade.create({
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
  async releaseEscrow(_event: H3Event, escrowId: string) {
    try {
      const ethersLib = await getEthers();
      
  const escrow = await EscrowTrade.findByPk(escrowId);
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
  async refundEscrow(_event: H3Event, escrowId: string) {
    try {
      const ethersLib = await getEthers();
      
  const escrow = await EscrowTrade.findByPk(escrowId);
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
  async getEscrow(_event: H3Event, escrowId: string) {
    try {
  const escrow = await EscrowTrade.findByPk(escrowId);
      
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
