// server/controllers/pewgift-controller.js - Enhanced PewGift Controller
import { PewGiftEconomy } from '../models/PewGiftEconomy.js';
import { supabase } from '../utils/supabase.js';

export class PewGiftController {
  // Send a gift with full validation
  static async sendGift(req, res) {
    try {
      const {
        recipientId,
        postId,
        commentId,
        amount,
        giftType = 'standard',
        message = null
      } = req.body;
      
      const senderId = req.user.id; // From auth middleware

      // Input validation
      if (!recipientId || !amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid input parameters',
          code: 'INVALID_INPUT'
        });
      }

      // Prevent self-gifting
      if (senderId === recipientId) {
        return res.status(400).json({
          success: false,
          error: 'Cannot send gift to yourself',
          code: 'SELF_GIFT_NOT_ALLOWED'
        });
      }

      // Check gift limits
      const limitsCheck = await PewGiftEconomy.checkGiftLimits(senderId, amount, recipientId);
      if (!limitsCheck.canSend) {
        return res.status(400).json({
          success: false,
          error: 'Gift limits exceeded',
          code: 'GIFT_LIMITS_EXCEEDED',
          details: limitsCheck.restrictions
        });
      }

      // Validate balance
      const balanceCheck = await PewGiftEconomy.validateBalance(senderId, amount);
      if (!balanceCheck.isValid) {
        return res.status(400).json({
          success: false,
          error: 'Insufficient balance',
          code: 'INSUFFICIENT_BALANCE',
          details: {
            required: balanceCheck.requiredAmount,
            available: balanceCheck.availableBalance,
            shortfall: balanceCheck.shortfall,
            fees: balanceCheck.fees
          }
        });
      }

      // Process the gift transaction
      const result = await PewGiftEconomy.processGiftTransaction({
        senderId,
        recipientId,
        postId,
        commentId,
        amount,
        giftType,
        message
      });

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(201).json({
        success: true,
        message: 'Gift sent successfully',
        data: {
          transaction: result.transaction,
          fees: balanceCheck.fees,
          split: result.transaction.split_details
        }
      });

    } catch (error) {
      console.error('Error sending gift:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'SERVER_ERROR'
      });
    }
  }

  // Get gift preview with fees and splits
  static async getGiftPreview(req, res) {
    try {
      const { amount, postId, commentId, giftType = 'standard' } = req.query;
      const senderId = req.user.id;

      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid amount',
          code: 'INVALID_AMOUNT'
        });
      }

      // Calculate fees
      const fees = PewGiftEconomy.calculateFees(parseFloat(amount), giftType);

      // Get post/comment details for split calculation
      let postOwnerId = null;
      let commentOwnerId = null;

      if (postId) {
        const { data: post } = await supabase
          .from('pews')
          .select('user_id')
          .eq('id', postId)
          .single();
        postOwnerId = post?.user_id;
      }

      if (commentId) {
        const { data: comment } = await supabase
          .from('comments')
          .select('user_id')
          .eq('id', commentId)
          .single();
        commentOwnerId = comment?.user_id;
      }

      // Calculate split
      const split = PewGiftEconomy.calculateGiftSplit(
        parseFloat(amount),
        postId,
        commentId,
        postOwnerId,
        commentOwnerId
      );

      // Check balance
      const balanceCheck = await PewGiftEconomy.validateBalance(senderId, parseFloat(amount));

      return res.status(200).json({
        success: true,
        data: {
          amount: parseFloat(amount),
          fees,
          split,
          balanceCheck: {
            canAfford: balanceCheck.isValid,
            availableBalance: balanceCheck.availableBalance,
            requiredAmount: balanceCheck.requiredAmount,
            shortfall: balanceCheck.shortfall
          }
        }
      });

    } catch (error) {
      console.error('Error getting gift preview:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'SERVER_ERROR'
      });
    }
  }

  // Send bulk gifts
  static async sendBulkGifts(req, res) {
    try {
      const { gifts } = req.body; // Array of gift objects
      const senderId = req.user.id;

      if (!Array.isArray(gifts) || gifts.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid gifts array',
          code: 'INVALID_INPUT'
        });
      }

      // Calculate total amount
      const totalAmount = gifts.reduce((sum, gift) => sum + (gift.amount || 0), 0);

      // Process bulk gifts
      const result = await PewGiftEconomy.processBulkGifts({
        senderId,
        gifts,
        totalAmount
      });

      return res.status(result.success ? 201 : 400).json(result);

    } catch (error) {
      console.error('Error sending bulk gifts:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'SERVER_ERROR'
      });
    }
  }

  // Get transaction history
  static async getTransactionHistory(req, res) {
    try {
      const userId = req.user.id;
      const {
        limit = 50,
        offset = 0,
        type = 'all',
        startDate,
        endDate
      } = req.query;

      const history = await PewGiftEconomy.getTransactionHistory(userId, {
        limit: parseInt(limit),
        offset: parseInt(offset),
        type,
        startDate,
        endDate
      });

      return res.status(200).json({
        success: true,
        data: history
      });

    } catch (error) {
      console.error('Error fetching transaction history:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'SERVER_ERROR'
      });
    }
  }

  // Get gift analytics
  static async getGiftAnalytics(req, res) {
    try {
      const userId = req.user.id;
      const { period = '30d' } = req.query;

      const analytics = await PewGiftEconomy.getGiftAnalytics(userId, period);

      return res.status(200).json({
        success: true,
        data: analytics
      });

    } catch (error) {
      console.error('Error fetching gift analytics:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'SERVER_ERROR'
      });
    }
  }

  // Get user balance
  static async getUserBalance(req, res) {
    try {
      const userId = req.user.id;

      const { data: balance, error } = await supabase
        .from('user_balances')
        .select('balance, locked_balance, updated_at')
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      const availableBalance = (balance?.balance || 0) - (balance?.locked_balance || 0);

      return res.status(200).json({
        success: true,
        data: {
          totalBalance: balance?.balance || 0,
          lockedBalance: balance?.locked_balance || 0,
          availableBalance,
          lastUpdated: balance?.updated_at
        }
      });

    } catch (error) {
      console.error('Error fetching user balance:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'SERVER_ERROR'
      });
    }
  }

  // Cancel pending gift (if applicable)
  static async cancelGift(req, res) {
    try {
      const { transactionId } = req.params;
      const userId = req.user.id;

      const { data: transaction, error: fetchError } = await supabase
        .from('pew_gift_transactions')
        .select('*')
        .eq('id', transactionId)
        .eq('sender_id', userId)
        .eq('status', 'pending')
        .single();

      if (fetchError || !transaction) {
        return res.status(404).json({
          success: false,
          error: 'Transaction not found or cannot be cancelled',
          code: 'TRANSACTION_NOT_FOUND'
        });
      }

      // Cancel the transaction
      const { error: cancelError } = await supabase.rpc('cancel_gift_transaction', {
        transaction_id: transactionId,
        user_id: userId
      });

      if (cancelError) throw cancelError;

      return res.status(200).json({
        success: true,
        message: 'Gift cancelled successfully'
      });

    } catch (error) {
      console.error('Error cancelling gift:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'SERVER_ERROR'
      });
    }
  }
}
