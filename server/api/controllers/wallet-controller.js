// server/api/controllers/walletController.js
import { supabase } from '../../../utils/supabase.js';

export class WalletController {
  // Create user wallets
  static async createUserWallets(req, res) {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const currencies = [
        { code: 'USDT', name: 'Tether' },
        { code: 'USDC', name: 'USD Coin' },
        { code: 'BTC', name: 'Bitcoin' },
        { code: 'ETH', name: 'Ethereum' },
        { code: 'SOL', name: 'Solana' },
        { code: 'MATIC', name: 'Polygon' },
        { code: 'XAUT', name: 'Tether Gold' }
      ];

      const walletInserts = currencies.map(currency => ({
        user_id: userId,
        currency_code: currency.code,
        currency_name: currency.name,
        balance: 0.00,
        locked_balance: 0.00,
        wallet_address: `${currency.code.toLowerCase()}_${userId}`,
        wallet_type: 'internal'
      }));

      const { data: wallets, error } = await supabase
        .from('wallets')
        .insert(walletInserts)
        .select();

      if (error) throw error;
      
      return res.status(201).json({
        success: true,
        message: 'User wallets created successfully',
        data: wallets
      });
    } catch (error) {
      console.error('Error creating user wallets:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get user wallets
  static async getUserWallets(req, res) {
    try {
      const { userId } = req.params;
      
      const { data: wallets, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      return res.status(200).json({
        success: true,
        data: wallets
      });
    } catch (error) {
      console.error('Error fetching user wallets:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Update wallet balance
  static async updateBalance(req, res) {
    try {
      const { walletId } = req.params;
      const { amount, type, description } = req.body; // type: 'credit' or 'debit'
      
      if (!amount || !type) {
        return res.status(400).json({ error: 'Amount and type are required' });
      }

      // Get current wallet
      const { data: wallet, error: fetchError } = await supabase
        .from('wallets')
        .select('balance')
        .eq('id', walletId)
        .single();

      if (fetchError) throw fetchError;

      const newBalance = type === 'credit' 
        ? parseFloat(wallet.balance) + parseFloat(amount)
        : parseFloat(wallet.balance) - parseFloat(amount);

      if (newBalance < 0) {
        return res.status(400).json({ error: 'Insufficient balance' });
      }

      const { data: updatedWallet, error: updateError } = await supabase
        .from('wallets')
        .update({ 
          balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', walletId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Log transaction
      await supabase
        .from('wallet_transactions')
        .insert({
          wallet_id: walletId,
          transaction_type: type,
          amount: amount,
          description: description || `${type} transaction`,
          balance_after: newBalance,
          created_at: new Date().toISOString()
        });

      return res.status(200).json({
        success: true,
        message: 'Wallet balance updated successfully',
        data: updatedWallet
      });
    } catch (error) {
      console.error('Error updating wallet balance:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Lock/unlock balance for trades
  static async lockBalance(req, res) {
    try {
      const { walletId } = req.params;
      const { amount, action } = req.body; // action: 'lock' or 'unlock'
      
      const { data: wallet, error: fetchError } = await supabase
        .from('wallets')
        .select('balance, locked_balance')
        .eq('id', walletId)
        .single();

      if (fetchError) throw fetchError;

      let newBalance, newLockedBalance;

      if (action === 'lock') {
        if (parseFloat(wallet.balance) < parseFloat(amount)) {
          return res.status(400).json({ error: 'Insufficient balance to lock' });
        }
        newBalance = parseFloat(wallet.balance) - parseFloat(amount);
        newLockedBalance = parseFloat(wallet.locked_balance) + parseFloat(amount);
      } else {
        newBalance = parseFloat(wallet.balance) + parseFloat(amount);
        newLockedBalance = parseFloat(wallet.locked_balance) - parseFloat(amount);
      }

      const { data: updatedWallet, error: updateError } = await supabase
        .from('wallets')
        .update({ 
          balance: newBalance,
          locked_balance: newLockedBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', walletId)
        .select()
        .single();

      if (updateError) throw updateError;

      return res.status(200).json({
        success: true,
        message: `Balance ${action}ed successfully`,
        data: updatedWallet
      });
    } catch (error) {
      console.error('Error locking/unlocking balance:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get wallet by currency
  static async getWalletByCurrency(req, res) {
    try {
      const { userId, currencyCode } = req.params;
      
      const { data: wallet, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .eq('currency_code', currencyCode)
        .single();

      if (error) throw error;

      return res.status(200).json({
        success: true,
        data: wallet
      });
    } catch (error) {
      console.error('Error fetching wallet by currency:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get wallet transaction history
  static async getTransactionHistory(req, res) {
    try {
      const { walletId } = req.params;
      const { page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      const { data: transactions, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('wallet_id', walletId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return res.status(200).json({
        success: true,
        data: transactions
      });
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}
