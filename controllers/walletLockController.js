// controllers/walletLockController.js - Wallet Lock Management Controller
import { Wallet } from '../Wallet.js';
import { supabase } from '../utils/supabase.js';

export class WalletLockController {
  
  /**
   * Lock a wallet balance
   * POST /api/wallet/lock
   */
  static async lockWallet(req, res) {
    try {
      const { walletId, reason, scheduledUnlock } = req.body;
      const userId = req.user?.id;

      if (!walletId) {
        return res.status(400).json({
          success: false,
          message: 'Wallet ID is required'
        });
      }

      // Check if user has permission to lock this wallet
      const hasPermission = await this.checkLockPermission(userId, walletId);
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to lock this wallet'
        });
      }

      const unlockDate = scheduledUnlock ? new Date(scheduledUnlock) : null;
      const result = await Wallet.lockBalance(walletId, reason, userId, unlockDate);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Error in lockWallet:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Unlock a wallet balance
   * POST /api/wallet/unlock
   */
  static async unlockWallet(req, res) {
    try {
      const { walletId, reason } = req.body;
      const userId = req.user?.id;

      if (!walletId) {
        return res.status(400).json({
          success: false,
          message: 'Wallet ID is required'
        });
      }

      // Check if user has permission to unlock this wallet
      const hasPermission = await this.checkLockPermission(userId, walletId);
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to unlock this wallet'
        });
      }

      const result = await Wallet.unlockBalance(walletId, reason, userId);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Error in unlockWallet:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Schedule wallet unlock
   * POST /api/wallet/schedule-unlock
   */
  static async scheduleUnlock(req, res) {
    try {
      const { walletId, unlockTime, reason } = req.body;
      const userId = req.user?.id;

      if (!walletId || !unlockTime) {
        return res.status(400).json({
          success: false,
          message: 'Wallet ID and unlock time are required'
        });
      }

      const hasPermission = await this.checkLockPermission(userId, walletId);
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to schedule unlock for this wallet'
        });
      }

      const unlockDate = new Date(unlockTime);
      if (unlockDate <= new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Unlock time must be in the future'
        });
      }

      const result = await Wallet.scheduleUnlock(walletId, unlockDate, reason);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Error in scheduleUnlock:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Get wallet lock status and history
   * GET /api/wallet/:walletId/lock-status
   */
  static async getLockStatus(req, res) {
    try {
      const { walletId } = req.params;
      const userId = req.user?.id;

      if (!walletId) {
        return res.status(400).json({
          success: false,
          message: 'Wallet ID is required'
        });
      }

      // Check if user can view this wallet's lock status
      const hasPermission = await this.checkViewPermission(userId, walletId);
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to view this wallet'
        });
      }

      const result = await Wallet.getLockStatus(walletId);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Error in getLockStatus:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Get all locked wallets (admin only)
   * GET /api/wallet/locked
   */
  static async getLockedWallets(req, res) {
    try {
      const userId = req.user?.id;
      const { currency, user } = req.query;

      // Check if user is admin
      const isAdmin = await this.checkAdminPermission(userId);
      if (!isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Admin permissions required'
        });
      }

      const filters = {};
      if (currency) filters.currencyCode = currency;
      if (user) filters.userId = user;

      const result = await Wallet.getLockedWallets(filters);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Error in getLockedWallets:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Toggle wallet lock status
   * POST /api/wallet/:walletId/toggle-lock
   */
  static async toggleLock(req, res) {
    try {
      const { walletId } = req.params;
      const { reason } = req.body;
      const userId = req.user?.id;

      if (!walletId) {
        return res.status(400).json({
          success: false,
          message: 'Wallet ID is required'
        });
      }

      const hasPermission = await this.checkLockPermission(userId, walletId);
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to modify this wallet'
        });
      }

      // Get current wallet status
      const wallet = await Wallet.findById(walletId);
      if (!wallet) {
        return res.status(404).json({
          success: false,
          message: 'Wallet not found'
        });
      }

      let result;
      if (wallet.is_locked) {
        result = await Wallet.unlockBalance(walletId, reason || 'Toggle unlock', userId);
      } else {
        result = await Wallet.lockBalance(walletId, reason || 'Toggle lock', userId);
      }

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Error in toggleLock:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Check if user has permission to lock/unlock wallet
   * @private
   */
  static async checkLockPermission(userId, walletId) {
    try {
      // Get wallet to check ownership
      const wallet = await Wallet.findById(walletId);
      if (!wallet) return false;

      // Get user profile to check role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      // Allow if user owns the wallet or is admin/manager
      return wallet.user_id === userId || 
             (profile && ['admin', 'manager'].includes(profile.role));
    } catch (error) {
      console.error('Error checking lock permission:', error);
      return false;
    }
  }

  /**
   * Check if user has permission to view wallet lock status
   * @private
   */
  static async checkViewPermission(userId, walletId) {
    try {
      const wallet = await Wallet.findById(walletId);
      if (!wallet) return false;

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      // Allow if user owns the wallet or is admin/manager
      return wallet.user_id === userId || 
             (profile && ['admin', 'manager'].includes(profile.role));
    } catch (error) {
      console.error('Error checking view permission:', error);
      return false;
    }
  }

  /**
   * Check if user has admin permissions
   * @private
   */
  static async checkAdminPermission(userId) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      return profile && ['admin', 'manager'].includes(profile.role);
    } catch (error) {
      console.error('Error checking admin permission:', error);
      return false;
    }
  }
}
