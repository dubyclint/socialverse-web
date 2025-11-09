// models/PewGiftEconomy.js - Enhanced PewGift Economy System
import { supabase } from '../utils/supabase.js';

export class PewGiftEconomy {
  // Transaction validation and processing
  static async processGiftTransaction(transactionData) {
    const {
      senderId,
      recipientId,
      postId,
      commentId,
      amount,
      giftType = 'standard',
      message = null
    } = transactionData;

    try {
      // Start transaction
      const { data: transaction, error: transactionError } = await supabase.rpc(
        'process_pew_gift_transaction',
        {
          sender_id: senderId,
          recipient_id: recipientId,
          post_id: postId,
          comment_id: commentId,
          gift_amount: amount,
          gift_type: giftType,
          gift_message: message
        }
      );

      if (transactionError) throw transactionError;

      return {
        success: true,
        transaction: transaction,
        message: 'Gift sent successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        code: this.getErrorCode(error.message)
      };
    }
  }

  // Balance validation
  static async validateBalance(userId, amount) {
    try {
      const { data: balance, error } = await supabase
        .from('user_balances')
        .select('balance, locked_balance')
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      const availableBalance = (balance?.balance || 0) - (balance?.locked_balance || 0);
      const fees = this.calculateFees(amount);
      const totalRequired = amount + fees.total;

      return {
        isValid: availableBalance >= totalRequired,
        availableBalance,
        requiredAmount: totalRequired,
        fees,
        shortfall: Math.max(0, totalRequired - availableBalance)
      };
    } catch (error) {
      throw new Error(`Balance validation failed: ${error.message}`);
    }
  }

  // Fee calculation system
  static calculateFees(amount, giftType = 'standard') {
    const feeStructure = {
      standard: {
        platformFee: 0.05, // 5%
        processingFee: 0.02, // 2%
        minimumFee: 1
      },
      premium: {
        platformFee: 0.03, // 3%
        processingFee: 0.01, // 1%
        minimumFee: 0.5
      },
      bulk: {
        platformFee: 0.02, // 2%
        processingFee: 0.005, // 0.5%
        minimumFee: 0.1
      }
    };

    const fees = feeStructure[giftType] || feeStructure.standard;
    
    const platformFee = Math.max(amount * fees.platformFee, fees.minimumFee);
    const processingFee = Math.max(amount * fees.processingFee, fees.minimumFee * 0.5);
    
    return {
      platformFee: Math.round(platformFee * 100) / 100,
      processingFee: Math.round(processingFee * 100) / 100,
      total: Math.round((platformFee + processingFee) * 100) / 100,
      breakdown: {
        amount,
        platformFee,
        processingFee,
        totalWithFees: amount + platformFee + processingFee
      }
    };
  }

  // Gift splitting logic for posts vs comments
  static calculateGiftSplit(amount, postId, commentId, postOwnerId, commentOwnerId) {
    let split = {
      recipients: [],
      platformFee: 0,
      totalDistributed: 0
    };

    const fees = this.calculateFees(amount);
    const netAmount = amount - fees.total;
    split.platformFee = fees.total;

    if (commentId && commentOwnerId && postOwnerId) {
      // Comment gift: 70% to commenter, 30% to post owner
      const commenterShare = Math.round(netAmount * 0.7 * 100) / 100;
      const postOwnerShare = Math.round(netAmount * 0.3 * 100) / 100;

      split.recipients = [
        {
          userId: commentOwnerId,
          type: 'commenter',
          amount: commenterShare,
          percentage: 70
        },
        {
          userId: postOwnerId,
          type: 'post_owner',
          amount: postOwnerShare,
          percentage: 30
        }
      ];
      split.totalDistributed = commenterShare + postOwnerShare;
    } else if (postId && postOwnerId) {
      // Post gift: 100% to post owner
      split.recipients = [
        {
          userId: postOwnerId,
          type: 'post_owner',
          amount: netAmount,
          percentage: 100
        }
      ];
      split.totalDistributed = netAmount;
    }

    return split;
  }

  // Transaction history
  static async getTransactionHistory(userId, options = {}) {
    const {
      limit = 50,
      offset = 0,
      type = 'all', // 'sent', 'received', 'all'
      startDate = null,
      endDate = null
    } = options;

    try {
      let query = supabase
        .from('pew_gift_transactions')
        .select(`
          *,
          sender:sender_id(username, avatar_url),
          recipient:recipient_id(username, avatar_url),
          post:post_id(title, content),
          comment:comment_id(content)
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      // Filter by transaction type
      if (type === 'sent') {
        query = query.eq('sender_id', userId);
      } else if (type === 'received') {
        query = query.eq('recipient_id', userId);
      } else {
        query = query.or(`sender_id.eq.${userId},recipient_id.eq.${userId}`);
      }

      // Date range filter
      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      const { data: transactions, error } = await query;

      if (error) throw error;

      return {
        transactions,
        pagination: {
          limit,
          offset,
          hasMore: transactions.length === limit
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch transaction history: ${error.message}`);
    }
  }

  // Bulk gift processing
  static async processBulkGifts(bulkData) {
    const { senderId, gifts, totalAmount } = bulkData;
    
    try {
      // Validate total balance first
      const balanceCheck = await this.validateBalance(senderId, totalAmount);
      if (!balanceCheck.isValid) {
        throw new Error(`Insufficient balance. Required: ${balanceCheck.requiredAmount}, Available: ${balanceCheck.availableBalance}`);
      }

      // Process each gift
      const results = [];
      for (const gift of gifts) {
        try {
          const result = await this.processGiftTransaction({
            senderId,
            ...gift
          });
          results.push({ ...gift, result });
        } catch (error) {
          results.push({ ...gift, result: { success: false, error: error.message } });
        }
      }

      const successful = results.filter(r => r.result.success).length;
      const failed = results.length - successful;

      return {
        success: true,
        summary: {
          total: results.length,
          successful,
          failed,
          totalAmount: successful > 0 ? totalAmount : 0
        },
        results
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        results: []
      };
    }
  }

  // Gift analytics
  static async getGiftAnalytics(userId, period = '30d') {
    try {
      const { data: analytics, error } = await supabase.rpc('get_gift_analytics', {
        user_id: userId,
        period_days: parseInt(period.replace('d', ''))
      });

      if (error) throw error;

      return analytics;
    } catch (error) {
      throw new Error(`Failed to fetch gift analytics: ${error.message}`);
    }
  }

  // Error code mapping
  static getErrorCode(errorMessage) {
    const errorCodes = {
      'insufficient balance': 'INSUFFICIENT_BALANCE',
      'user not found': 'USER_NOT_FOUND',
      'post not found': 'POST_NOT_FOUND',
      'comment not found': 'COMMENT_NOT_FOUND',
      'invalid amount': 'INVALID_AMOUNT',
      'self gift not allowed': 'SELF_GIFT_NOT_ALLOWED',
      'user blocked': 'USER_BLOCKED',
      'daily limit exceeded': 'DAILY_LIMIT_EXCEEDED'
    };

    for (const [key, code] of Object.entries(errorCodes)) {
      if (errorMessage.toLowerCase().includes(key)) {
        return code;
      }
    }
    return 'UNKNOWN_ERROR';
  }

  // Gift limits and restrictions
  static async checkGiftLimits(senderId, amount, recipientId) {
    try {
      const { data: limits, error } = await supabase.rpc('check_gift_limits', {
        sender_id: senderId,
        recipient_id: recipientId,
        gift_amount: amount
      });

      if (error) throw error;

      return {
        canSend: limits.can_send,
        limits: limits.limits,
        restrictions: limits.restrictions
      };
    } catch (error) {
      throw new Error(`Failed to check gift limits: ${error.message}`);
    }
  }
}
