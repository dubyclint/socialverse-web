// server/models/like.js - Supabase PostgreSQL Likes Model
import { supabase } from '../utils/supabase.js';

export class Like {
  /**
   * Toggle like on content
   */
  static async toggleLike(userId, targetType, targetId) {
    try {
      // Check if like already exists
      const { data: existingLike, error: checkError } = await supabase
        .from('likes')
        .select('id')
        .eq('user_id', userId)
        .eq('target_type', targetType)
        .eq('target_id', targetId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') throw checkError;

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
    } catch (error) {
      console.error('Error toggling like:', error);
      throw error;
    }
  }

  /**
   * Get likes count for content
   */
  static async getLikesCount(targetType, targetId) {
    try {
      const { data, error, count } = await supabase
        .from('likes')
        .select('id', { count: 'exact' })
        .eq('target_type', targetType)
        .eq('target_id', targetId);

      if (error) throw error;
      return { count: count || 0 };
    } catch (error) {
      console.error('Error fetching likes count:', error);
      throw error;
    }
  }

  /**
   * Get user's likes
   */
  static async getUserLikes(userId, targetType = null, limit = 50, offset = 0) {
    try {
      let query = supabase
        .from('likes')
        .select('*', { count: 'exact' })
        .eq('user_id', userId);

      if (targetType) {
        query = query.eq('target_type', targetType);
      }

      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data, error, count } = await query;
      if (error) throw error;
      return { data, count };
    } catch (error) {
      console.error('Error fetching user likes:', error);
      throw error;
    }
  }

  /**
   * Get likes on content
   */
  static async getTargetLikes(targetType, targetId, limit = 50, offset = 0) {
    try {
      const { data, error, count } = await supabase
        .from('likes')
        .select(`
          *,
          profiles:user_id(username, avatar_url, is_verified)
        `, { count: 'exact' })
        .eq('target_type', targetType)
        .eq('target_id', targetId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return { data, count };
    } catch (error) {
      console.error('Error fetching target likes:', error);
      throw error;
    }
  }

  /**
   * Check if user liked content
   */
  static async isLikedByUser(userId, targetType, targetId) {
    try {
      const { data, error } = await supabase
        .from('likes')
        .select('id')
        .eq('user_id', userId)
        .eq('target_type', targetType)
        .eq('target_id', targetId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return !!data;
    } catch (error) {
      console.error('Error checking if liked:', error);
      throw error;
    }
  }

  /**
   * Get most liked content
   */
  static async getMostLikedContent(targetType, limit = 10, timeframe = null) {
    try {
      let query = supabase
        .from('likes')
        .select('target_id, count(*) as like_count')
        .eq('target_type', targetType);

      if (timeframe) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - timeframe);
        query = query.gte('created_at', startDate.toISOString());
      }

      const { data, error } = await query
        .group_by('target_id')
        .order('like_count', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching most liked content:', error);
      throw error;
    }
  }

  /**
   * Get like activity for user
   */
  static async getLikeActivity(userId, limit = 20, offset = 0) {
    try {
      const { data, error, count } = await supabase
        .from('likes')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return { data, count };
    } catch (error) {
      console.error('Error fetching like activity:', error);
      throw error;
    }
  }

  /**
   * Get mutual likes between users
   */
  static async getMutualLikes(userId1, userId2, targetType) {
    try {
      const { data, error } = await supabase
        .from('likes')
        .select('target_id')
        .eq('target_type', targetType)
        .in('user_id', [userId1, userId2])
        .group_by('target_id')
        .having('count(*) = 2');

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching mutual likes:', error);
      throw error;
    }
  }

  /**
   * Get like statistics
   */
  static async getStatistics(targetType, targetId) {
    try {
      const { data, error } = await supabase
        .from('likes')
        .select('user_id, created_at')
        .eq('target_type', targetType)
        .eq('target_id', targetId);

      if (error) throw error;

      const stats = {
        totalLikes: data.length,
        uniqueUsers: new Set(data.map(l => l.user_id)).size,
        likesPerDay: {}
      };

      data.forEach(like => {
        const date = new Date(like.created_at).toISOString().split('T')[0];
        stats.likesPerDay[date] = (stats.likesPerDay[date] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Error fetching like statistics:', error);
      throw error;
    }
  }

  /**
   * Unlike content
   */
  static async unlike(userId, targetType, targetId) {
    try {
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('user_id', userId)
        .eq('target_type', targetType)
        .eq('target_id', targetId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error unliking:', error);
      throw error;
    }
  }

  /**
   * Bulk unlike
   */
  static async bulkUnlike(userId, targetIds) {
    try {
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('user_id', userId)
        .in('target_id', targetIds);

      if (error) throw error;
      return { success: true, unlikedCount: targetIds.length };
    } catch (error) {
      console.error('Error bulk unliking:', error);
      throw error;
    }
  }
}
