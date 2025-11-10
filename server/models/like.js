// server/models/like.js - Supabase PostgreSQL Likes Model
import { supabase } from '../utils/supabase.js';

export class Like {
  static async toggleLike(userId, targetType, targetId) {
    // Check if like already exists
    const { data: existingLike } = await supabase
      .from('likes')
      .select('id')
      .eq('user_id', userId)
      .eq('target_type', targetType)
      .eq('target_id', targetId)
      .single();

    if (existingLike) {
      // Unlike
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('id', existingLike.id);

      if (error) throw error;
      return { liked: false, action: 'unliked' };
    } else {
      // Like
      const { data, error } = await supabase
        .from('likes')
        .insert([{
          user_id: userId,
          target_type: targetType,
          target_id: targetId
        }])
        .select(`
          *,
          profiles:user_id(username, avatar_url)
        `)
        .single();

      if (error) throw error;
      return { liked: true, action: 'liked', data };
    }
  }

  static async getLikesCount(targetType, targetId) {
    const { data, error } = await supabase
      .from('likes')
      .select('id', { count: 'exact' })
      .eq('target_type', targetType)
      .eq('target_id', targetId);

    if (error) throw error;
    return { count: data.length };
  }

  static async getUserLikes(userId, targetType = null) {
    let query = supabase
      .from('likes')
      .select('*')
      .eq('user_id', userId);

    if (targetType) {
      query = query.eq('target_type', targetType);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  static async getTargetLikes(targetType, targetId) {
    const { data, error } = await supabase
      .from('likes')
      .select(`
        *,
        profiles:user_id(username, avatar_url, is_verified)
      `)
      .eq('target_type', targetType)
      .eq('target_id', targetId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async isLikedByUser(userId, targetType, targetId) {
    const { data, error } = await supabase
      .from('likes')
      .select('id')
      .eq('user_id', userId)
      .eq('target_type', targetType)
      .eq('target_id', targetId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  }

  static async getMostLikedContent(targetType, limit = 10, timeframe = null) {
    let query = supabase
      .from('likes')
      .select('target_id, count(*)')
      .eq('target_type', targetType);

    if (timeframe) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - timeframe);
      query = query.gte('created_at', startDate.toISOString());
    }

    query = query
      .group('target_id')
      .order('count', { ascending: false })
      .limit(limit);

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  static async getLikeActivity(userId, limit = 20) {
    const { data, error } = await supabase
      .from('likes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }
}
