// models/pewgift.js - Supabase PostgreSQL Gift System Model
import { supabase } from '../utils/supabase.js';

export class pewgift {
  static async getAllGifts() {
    const { data, error } = await supabase
      .from('gifts')
      .select('*')
      .eq('is_active', true)
      .order('cost_amount');

    if (error) throw error;
    return data;
  }

  static async getpewgiftsByCategory(category) {
    const { data, error } = await supabase
      .from('gifts')
      .select('*')
      .eq('category', category)
      .eq('is_active', true)
      .order('cost_amount');

    if (error) throw error;
    return data;
  }

  static async sendpewgift(giftData) {
    const { data, error } = await supabase
      .from('pew_gifts')
      .insert([{
        sender_id: giftData.senderId,
        recipient_id: giftData.recipientId,
        gift_id: giftData.giftId,
        target_type: giftData.targetType,
        target_id: giftData.targetId,
        quantity: giftData.quantity || 1,
        message: giftData.message,
        is_anonymous: giftData.isAnonymous || false
      }])
      .select(`
        *,
        sender:sender_id(username, avatar_url),
        recipient:recipient_id(username, avatar_url),
        gift:gift_id(name, image_url, cost_amount, cost_currency)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  static async getReceivedGifts(userId) {
    const { data, error } = await supabase
      .from('pew_gifts')
      .select(`
        *,
        sender:sender_id(username, avatar_url),
        gift:gift_id(name, image_url, animation_url, rarity)
      `)
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async getSentGifts(userId) {
    const { data, error } = await supabase
      .from('pew_gifts')
      .select(`
        *,
        recipient:recipient_id(username, avatar_url),
        gift:gift_id(name, image_url, animation_url, rarity)
      `)
      .eq('sender_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async getTargetGifts(targetType, targetId) {
    const { data, error } = await supabase
      .from('pew_gifts')
      .select(`
        *,
        sender:sender_id(username, avatar_url),
        gift:gift_id(name, image_url, animation_url, rarity)
      `)
      .eq('target_type', targetType)
      .eq('target_id', targetId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async createGift(giftData) {
    const { data, error } = await supabase
      .from('gifts')
      .insert([{
        name: giftData.name,
        description: giftData.description,
        category: giftData.category,
        gift_type: giftData.giftType,
        cost_currency: giftData.costCurrency,
        cost_amount: giftData.costAmount,
        image_url: giftData.imageUrl,
        animation_url: giftData.animationUrl,
        rarity: giftData.rarity || 'common',
        is_limited: giftData.isLimited || false,
        stock_quantity: giftData.stockQuantity
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
