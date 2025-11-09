// models/swapTransaction.js - Supabase PostgreSQL Swap Transaction Model
import { supabase } from '../utils/supabase.js';

export class SwapTransaction {
  static async create(swapData) {
    const { data, error } = await supabase
      .from('swap_transactions')
      .insert([{
        user_id: swapData.userId,
        from_currency: swapData.fromCurrency,
        to_currency: swapData.toCurrency,
        from_amount: swapData.fromAmount,
        to_amount: swapData.toAmount,
        exchange_rate: swapData.exchangeRate,
        fee_amount: swapData.feeAmount || 0.0,
        fee_currency: swapData.feeCurrency,
        provider: swapData.provider || 'internal',
        external_ref: swapData.externalRef
      }])
      .select(`
        *,
        profiles:user_id(username, avatar_url)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  static async updateStatus(id, status, externalRef = null) {
    const updateData = { status };
    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }
    if (externalRef) {
      updateData.external_ref = externalRef;
    }

    const { data, error } = await supabase
      .from('swap_transactions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getUserSwaps(userId) {
    const { data, error } = await supabase
      .from('swap_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async getSwapHistory(userId, limit = 20) {
    const { data, error } = await supabase
      .from('swap_transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  static async getPendingSwaps(userId) {
    const { data, error } = await supabase
      .from('swap_transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async getSwapStatistics(userId, fromDate, toDate) {
    const { data, error } = await supabase
      .from('swap_transactions')
      .select('from_currency, to_currency, from_amount, to_amount, fee_amount')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('completed_at', fromDate)
      .lte('completed_at', toDate);

    if (error) throw error;

    // Calculate statistics
    const stats = {
      total_swaps: data.length,
      total_fees_paid: data.reduce((sum, swap) => sum + (swap.fee_amount || 0), 0),
      currencies_used: [...new Set([...data.map(s => s.from_currency), ...data.map(s => s.to_currency)])],
      volume_by_currency: {}
    };

    data.forEach(swap => {
      if (!stats.volume_by_currency[swap.from_currency]) {
        stats.volume_by_currency[swap.from_currency] = 0;
      }
      stats.volume_by_currency[swap.from_currency] += parseFloat(swap.from_amount);
    });

    return stats;
  }

  static async getCurrentExchangeRates() {
    // In a real app, this would fetch from external APIs
    // For now, return mock rates
    return {
      'BTC/USDT': 45000.00,
      'ETH/USDT': 3000.00,
      'SOL/USDT': 100.00,
      'MATIC/USDT': 0.85,
      'USDC/USDT': 1.00,
      'XAUT/USDT': 2000.00
    };
  }
}
