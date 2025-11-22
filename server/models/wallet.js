// server/models/wallet.js - Supabase PostgreSQL Wallet Model
import { supabase } from '../utils/supabase.js';

export class Wallet {
  static async createUserWallets(userId) {
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

    const { data, error } = await supabase
      .from('wallets')
      .insert(walletInserts)
      .select();

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

  static async updateBalance(userId, currencyCode, newBalance, lockedBalance = null) {
    const updateData = { balance: newBalance };
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

  static async getBalance(userId, currencyCode) {
    const { data, error } = await supabase
      .from('wallets')
      .select('balance, locked_balance')
      .eq('user_id', userId)
      .eq('currency_code', currencyCode)
      .single();

    if (error) throw error;
    return data;
  }
}
