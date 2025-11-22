// server/models/comment.js - Supabase PostgreSQL Comments Model
import { supabase } from '../utils/supabase.js';

export class Comment {
  /**
   * Create a new comment
   */
  static async create(commentData) {
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert([{
          user_id: commentData.userId,
          target_type: commentData.targetType,
          target_id: commentData.targetId,
          parent_id: commentData.parentId || null,
          content: commentData.content,
          media_urls: commentData.mediaUrls || [],
          mentions: commentData.mentions || []
        }])
        .select(`
          *,
          profiles:user_id(username, avatar_url, is_verified),
          parent:parent_id(id, content, profiles:user_id(username))
        `)
        .single();

      if (error) throw error;

      // Update replies count for parent comment
      if (commentData.parentId) {
        await this.updateRepliesCount(commentData.parentId);
      }

      return data;
    } catch (error) {
      console.error('Error creating comment:', error);
      throw error;
    }
  }

  /**
   * Get comments for target
   */
  static async getComments(targetType, targetId, limit = 20, offset = 0) {
    try {
      const { data, error, count } = await supabase
        .from('comments')
        .select(`
          *,
          profiles:user_id(username, avatar_url, is_verified),
          likes:likes!target_id(count),
          replies:comments!parent_id(count)
        `, { count: 'exact' })
        .eq('target_type', targetType)
        .eq('target_id', targetId)
        .is('parent_id', null)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return { data, count };
    } catch (error) {
      console.error('Error fetching comments:', error);
      throw error;
    }
  }

  /**
   * Get comment replies
   */
  static async getReplies(parentId, limit = 10) {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles:user_id(username, avatar_url, is_verified),
          likes:likes!target_id(count)
        `)
        .eq('parent_id', parentId)
        .order('created_at')
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching replies:', error);
      throw error;
    }
  }

  /**
   * Update comment
   */
  static async updateComment(commentId, userId, newContent) {
    try {
      const { data, error } = await supabase
        .from('comments')
        .update({
          content: newContent,
          is_edited: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId)
        .eq('user_id', userId)
        .select(`
          *,
          profiles:user_id(username, avatar_url, is_verified)
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating comment:', error);
      throw error;
    }
  }

  /**
   * Delete comment
   */
  static async deleteComment(commentId, userId) {
    try {
      // First, delete all replies
      await supabase
        .from('comments')
        .delete()
        .eq('parent_id', commentId);

      // Delete associated likes
      await supabase
        .from('likes')
        .delete()
        .eq('target_type', 'comment')
        .eq('target_id', commentId);

      // Delete the comment
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', userId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  }

  /**
   * Update replies count
   */
  static async updateRepliesCount(parentId) {
    try {
      const { data: replies, error: countError } = await supabase
        .from('comments')
        .select('id', { count: 'exact' })
        .eq('parent_id', parentId);

      if (countError) throw countError;

      const { error } = await supabase
        .from('comments')
        .update({ replies_count: replies?.length || 0 })
        .eq('id', parentId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating replies count:', error);
      throw error;
    }
  }

  /**
   * Update likes count
   */
  static async updateLikesCount(commentId) {
    try {
      const { data: likes, error: countError } = await supabase
        .from('likes')
        .select('id', { count: 'exact' })
        .eq('target_type', 'comment')
        .eq('target_id', commentId);

      if (countError) throw countError;

      const { error } = await supabase
        .from('comments')
        .update({ likes_count: likes?.length || 0 })
        .eq('id', commentId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating likes count:', error);
      throw error;
    }
  }

  /**
   * Get user comments
   */
  static async getUserComments(userId, limit = 20, offset = 0) {
    try {
      const { data, error, count } = await supabase
        .from('comments')
        .select(`
          *,
          likes:likes!target_id(count),
          replies:comments!parent_id(count)
        `, { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return { data, count };
    } catch (error) {
      console.error('Error fetching user comments:', error);
      throw error;
    }
  }

  /**
   * Get comment by ID
   */
  static async getCommentById(commentId) {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles:user_id(username, avatar_url, is_verified),
          parent:parent_id(id, content, profiles:user_id(username)),
          likes:likes!target_id(count),
          replies:comments!parent_id(count)
        `)
        .eq('id', commentId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching comment:', error);
      throw error;
    }
  }

  /**
   * Get comments with replies
   */
  static async getCommentsWithReplies(targetType, targetId, limit = 10) {
    try {
      // Get top-level comments
      const { data: comments, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles:user_id(username, avatar_url, is_verified),
          likes:likes!target_id(count)
        `)
        .eq('target_type', targetType)
        .eq('target_id', targetId)
        .is('parent_id', null)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Get replies for each comment
      for (let comment of comments) {
        const replies = await this.getReplies(comment.id, 3);
        comment.replies = replies;
      }

      return comments;
    } catch (error) {
      console.error('Error fetching comments with replies:', error);
      throw error;
    }
  }

  /**
   * Search comments
   */
  static async searchComments(query, targetType = null, targetId = null) {
    try {
      let searchQuery = supabase
        .from('comments')
        .select(`
          *,
          profiles:user_id(username, avatar_url, is_verified)
        `)
        .ilike('content', `%${query}%`);

      if (targetType) {
        searchQuery = searchQuery.eq('target_type', targetType);
      }
      if (targetId) {
        searchQuery = searchQuery.eq('target_id', targetId);
      }

      const { data, error } = await searchQuery
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error searching comments:', error);
      throw error;
    }
  }

  /**
   * Get comment statistics
   */
  static async getStats(targetType, targetId) {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('id, parent_id, likes_count, replies_count')
        .eq('target_type', targetType)
        .eq('target_id', targetId);

      if (error) throw error;

      const stats = {
        totalComments: data.length,
        topLevelComments: data.filter(c => !c.parent_id).length,
        totalReplies: data.filter(c => c.parent_id).length,
        totalLikes: data.reduce((sum, c) => sum + (c.likes_count || 0), 0),
        averageLikesPerComment: data.length > 0 
          ? (data.reduce((sum, c) => sum + (c.likes_count || 0), 0) / data.length).toFixed(2)
          : 0
      };

      return stats;
    } catch (error) {
      console.error('Error fetching comment stats:', error);
      throw error;
    }
  }

  /**
   * Bulk delete comments
   */
  static async bulkDelete(commentIds, userId) {
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .in('id', commentIds)
        .eq('user_id', userId);

      if (error) throw error;
      return { success: true, deletedCount: commentIds.length };
    } catch (error) {
      console.error('Error bulk deleting comments:', error);
      throw error;
    }
  }

  /**
   * Get trending comments
   */
  static async getTrendingComments(limit = 10) {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles:user_id(username, avatar_url, is_verified)
        `)
        .order('likes_count', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching trending comments:', error);
      throw error;
    }
  }
}
