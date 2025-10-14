// Wallet.js - Enhanced Supabase PostgreSQL Model with Lock Balance Toggle
import { supabase } from './utils/supabase.js';

export class Wallet {
  static async create(walletData) {
    const currencies = ['USDT', 'USDC', 'BTC', 'ETH', 'SOL', 'MATIC', 'XAUT'];
    
    const walletInserts = currencies.map(currency => ({
      user_id: walletData.userId,
      currency_code: currency,
      currency_name: this.getCurrencyName(currency),
      balance: 0.00,
      locked_balance: 0.00,
      wallet_address: `${currency.toLowerCase()}_${walletData.userId}`,
      wallet_type: 'internal',
      is_locked: false,
      lock_reason: null,
      locked_at: null,
      locked_by: null,
      unlock_scheduled_at: null
    }));

    const { data, error } = await supabase
      .from('wallets')
      .insert(walletInserts)
      .select();

    if (error) throw error;
    return data;
  }

  static getCurrencyName(code) {
    const names = {
      'USDT': 'Tether',
      'USDC': 'USD Coin',
      'BTC': 'Bitcoin',
      'ETH': 'Ethereum',
      'SOL': 'Solana',
      'MATIC': 'Polygon',
      'XAUT': 'Tether Gold'
    };
    return names[code] || code;
  }

  static async findOne(filter) {
    let query = supabase.from('wallets').select('*');
    
    if (filter.userId) {
      query = query.eq('user_id', filter.userId);
    }
    if (filter.currency_code) {
      query = query.eq('currency_code', filter.currency_code);
    }

    const { data, error } = await query.single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async find(filter = {}) {
    let query = supabase.from('wallets').select('*');
    
    if (filter.userId) {
      query = query.eq('user_id', filter.userId);
    }
    if (filter.user_id) {
      query = query.eq('user_id', filter.user_id);
    }

    query = query.order('currency_code');

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  static async save(walletData) {
    if (walletData.id) {
      // Update existing
      const { data, error } = await supabase
        .from('wallets')
        .update({
          balance: walletData.balance,
          locked_balance: walletData.locked_balance,
          wallet_address: walletData.wallet_address,
          updated_at: new Date().toISOString()
        })
        .eq('id', walletData.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } else {
      // Create new
      return await this.create(walletData);
    }
  }

  static async updateBalance(userId, currencyCode, newBalance, lockedBalance = null) {
    const updateData = { 
      balance: newBalance,
      updated_at: new Date().toISOString()
    };
    
    if (lockedBalance !== null) {
      updateData.locked_balance = lockedBalance;
    }

    const { data, error } = await supabase
      .from('wallets')
      .update(updateData)
      .eq('user_id', userId)
      .eq('currency_code', currencyCode)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getUserWallets(userId) {
    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('currency_code');

    if (error) throw error;
    return data;
  }

  // =============================================
  // LOCK BALANCE TOGGLE FUNCTIONALITY
  // =============================================

  /**
   * Lock a wallet balance
   * @param {string} walletId - Wallet ID to lock
   * @param {string} reason - Reason for locking
   * @param {string} lockedBy - User ID who performed the lock
   * @param {Date} scheduledUnlock - Optional scheduled unlock time
   * @returns {Object} Updated wallet data
   */
  static async lockBalance(walletId, reason = 'Manual lock', lockedBy = null, scheduledUnlock = null) {
    try {
      // First, get the wallet to ensure it exists and get user_id
      const wallet = await this.findById(walletId);
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      // Check if wallet is already locked
      if (wallet.is_locked) {
        throw new Error('Wallet is already locked');
      }

      // Update wallet to locked state
      const { data: updatedWallet, error: walletError } = await supabase
        .from('wallets')
        .update({
          is_locked: true,
          lock_reason: reason,
          locked_at: new Date().toISOString(),
          locked_by: lockedBy,
          unlock_scheduled_at: scheduledUnlock ? scheduledUnlock.toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', walletId)
        .select()
        .single();

      if (walletError) throw walletError;

      // Log the lock action in history
      await this.logWalletAction(walletId, wallet.user_id, 'LOCK', reason, wallet.balance, lockedBy);

      return {
        success: true,
        wallet: updatedWallet,
        message: 'Wallet balance locked successfully'
      };
    } catch (error) {
      console.error('Error locking wallet balance:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to lock wallet balance'
      };
    }
  }

  /**
   * Unlock a wallet balance
   * @param {string} walletId - Wallet ID to unlock
   * @param {string} reason - Reason for unlocking
   * @param {string} unlockedBy - User ID who performed the unlock
   * @returns {Object} Updated wallet data
   */
  static async unlockBalance(walletId, reason = 'Manual unlock', unlockedBy = null) {
    try {
      // First, get the wallet to ensure it exists and get user_id
      const wallet = await this.findById(walletId);
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      // Check if wallet is actually locked
      if (!wallet.is_locked) {
        throw new Error('Wallet is not locked');
      }

      // Update wallet to unlocked state
      const { data: updatedWallet, error: walletError } = await supabase
        .from('wallets')
        .update({
          is_locked: false,
          lock_reason: null,
          locked_at: null,
          locked_by: null,
          unlock_scheduled_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', walletId)
        .select()
        .single();

      if (walletError) throw walletError;

      // Log the unlock action in history
      await this.logWalletAction(walletId, wallet.user_id, 'UNLOCK', reason, wallet.balance, unlockedBy);

      return {
        success: true,
        wallet: updatedWallet,
        message: 'Wallet balance unlocked successfully'
      };
    } catch (error) {
      console.error('Error unlocking wallet balance:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to unlock wallet balance'
      };
    }
  }

  /**
   * Schedule wallet unlock for a future time
   * @param {string} walletId - Wallet ID
   * @param {Date} unlockTime - When to unlock the wallet
   * @param {string} reason - Reason for scheduled unlock
   * @returns {Object} Updated wallet data
   */
  static async scheduleUnlock(walletId, unlockTime, reason = 'Scheduled unlock') {
    try {
      const wallet = await this.findById(walletId);
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      if (!wallet.is_locked) {
        throw new Error('Wallet must be locked to schedule unlock');
      }

      const { data: updatedWallet, error } = await supabase
        .from('wallets')
        .update({
          unlock_scheduled_at: unlockTime.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', walletId)
        .select()
        .single();

      if (error) throw error;

      // Log the schedule action
      await this.logWalletAction(walletId, wallet.user_id, 'SCHEDULE_UNLOCK', reason, wallet.balance);

      return {
        success: true,
        wallet: updatedWallet,
        message: 'Wallet unlock scheduled successfully'
      };
    } catch (error) {
      console.error('Error scheduling wallet unlock:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to schedule wallet unlock'
      };
    }
  }

  /**
   * Get wallet lock status and history
   * @param {string} walletId - Wallet ID
   * @returns {Object} Lock status and history
   */
  static async getLockStatus(walletId) {
    try {
      const wallet = await this.findById(walletId);
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      // Get lock history
      const { data: history, error: historyError } = await supabase
        .from('wallet_lock_history')
        .select(`
          *,
          performed_by_profile:performed_by(username, email)
        `)
        .eq('wallet_id', walletId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (historyError) throw historyError;

      return {
        success: true,
        lockStatus: {
          isLocked: wallet.is_locked,
          lockReason: wallet.lock_reason,
          lockedAt: wallet.locked_at,
          lockedBy: wallet.locked_by,
          unlockScheduledAt: wallet.unlock_scheduled_at
        },
        history: history || []
      };
    } catch (error) {
      console.error('Error getting lock status:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Check if wallet operations are allowed (not locked)
   * @param {string} walletId - Wallet ID
   * @returns {boolean} True if operations are allowed
   */
  static async isOperationAllowed(walletId) {
    try {
      const wallet = await this.findById(walletId);
      if (!wallet) return false;

      // Check if wallet is locked
      if (wallet.is_locked) {
        // Check if scheduled unlock time has passed
        if (wallet.unlock_scheduled_at) {
          const unlockTime = new Date(wallet.unlock_scheduled_at);
          if (new Date() >= unlockTime) {
            // Auto-unlock the wallet
            await this.unlockBalance(walletId, 'Automatic unlock - scheduled time reached', 'system');
            return true;
          }
        }
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking wallet operation permission:', error);
      return false;
    }
  }

  /**
   * Get all locked wallets (for admin/management)
   * @param {Object} filters - Optional filters
   * @returns {Array} List of locked wallets
   */
  static async getLockedWallets(filters = {}) {
    try {
      let query = supabase
        .from('wallets')
        .select(`
          *,
          user_profile:user_id(username, email),
          locked_by_profile:locked_by(username, email)
        `)
        .eq('is_locked', true);

      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }

      if (filters.currencyCode) {
        query = query.eq('currency_code', filters.currencyCode);
      }

      query = query.order('locked_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      return {
        success: true,
        wallets: data || []
      };
    } catch (error) {
      console.error('Error getting locked wallets:', error);
      return {
        success: false,
        error: error.message,
        wallets: []
      };
    }
  }

  /**
   * Log wallet lock/unlock actions
   * @private
   */
  static async logWalletAction(walletId, userId, action, reason, amount, performedBy = null) {
    try {
      const { error } = await supabase
        .from('wallet_lock_history')
        .insert({
          wallet_id: walletId,
          user_id: userId,
          action: action,
          reason: reason,
          locked_amount: amount,
          performed_by: performedBy
        });

      if (error) {
        console.error('Error logging wallet action:', error);
      }
    } catch (error) {
      console.error('Error in logWalletAction:', error);
    }
  }

  // Legacy compatibility methods
  static async findById(id) {
    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async findByIdAndUpdate(id, updateData) {
    const { data, error } = await supabase
      .from('wallets')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Enhanced balance update with lock checking
   */
  static async safeUpdateBalance(userId, currencyCode, newBalance, lockedBalance = null) {
    try {
      // First check if wallet is locked
      const wallet = await this.findOne({ userId, currency_code: currencyCode });
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      const isAllowed = await this.isOperationAllowed(wallet.id);
      if (!isAllowed) {
        throw new Error('Wallet is locked - balance updates not allowed');
      }

      // Proceed with balance update
      return await this.updateBalance(userId, currencyCode, newBalance, lockedBalance);
    } catch (error) {
      console.error('Error in safeUpdateBalance:', error);
      throw error;
    }
  }
}
